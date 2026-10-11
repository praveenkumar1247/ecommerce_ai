# ApexStore - Production-Ready E-Commerce Application

A complete, high-performance, full-stack e-commerce web application built end-to-end with **React**, **Node.js/Express**, **MySQL**, and **Prisma ORM**.

Features atomic transactional stock reservations to prevent race-condition overselling, server-side validated pricing, local file storage with Multer, JWT authentication with role-based access control, customer order history, and a rich administration console.

--

## 1. Technology Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **HTTP Client:** Axios with request/response interceptors & token injection
- **Icons:** Lucide React
- **Design System:** Custom Vanilla CSS with glassmorphic aesthetics, dark theme tokens, responsive layouts, micro-animations, and shimmer skeletons

### Backend
- **Runtime:** Node.js (v24+)
- **Web Framework:** Express.js
- **Database & ORM:** MySQL 9+ with Prisma ORM 6
- **Authentication:** JWT (JSON Web Tokens) with 7-day expiration
- **Password Security:** bcryptjs (10-round salt hashing)
- **File Uploads:** Multer with mime-type filtering, 5MB file caps, and disk cleanup
- **Security & Headers:** Helmet, CORS origin restriction, express-rate-limit

---

## 2. Project Architecture

```text
E_commerce/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma schema with 10 normalized MySQL tables
│   ├── src/
│   │   ├── config/                 # Prisma client and constants
│   │   ├── controllers/            # Route controllers
│   │   ├── database/               # Database seed scripts
│   │   ├── middleware/             # Auth, role authorization, multer, error handler, rate limit
│   │   ├── routes/                 # REST API routes
│   │   ├── services/               # Business logic, pricing, inventory locking, payment
│   │   └── utils/                  # Response formatters, pricing algorithms, file utilities
│   ├── tests/
│   │   └── verifyConcurrency.js    # Concurrency and row-locking race condition test
│   ├── uploads/
│   │   └── products/               # Local product images (statically served via /uploads)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios clients for auth, products, categories, cart, orders, admin
│   │   ├── components/             # Reusable UI cards, filters, modals, badges, layout
│   │   ├── context/                # AuthContext, CartContext, ToastContext
│   │   ├── pages/                  # Shop, Auth, Cart, Checkout, Orders, Profile, Admin pages
│   │   ├── routes/                 # AppRoutes, ProtectedRoute, AdminRoute
│   │   ├── utils/                  # Currency (₹), date, and image URL formatters
│   │   ├── App.jsx
│   │   ├── index.css               # Global Design System tokens & glassmorphic styling
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 3. Database Relational Schema

The database uses 10 normalized tables with cascading deletes, foreign keys, and indexes:
- `users`: User and administrator accounts with role (`USER` | `ADMIN`) and status.
- `categories`: Product taxonomy with slugs and status (`ACTIVE` | `INACTIVE`).
- `products`: Product catalog with server-recalculated offer prices, stock, SKU, and status (`ACTIVE` | `INACTIVE` | `OUT_OF_STOCK`). Supports soft-deletion when historical orders exist.
- `product_images`: Multiple product image paths with display ordering and primary flag.
- `addresses`: Customer shipping addresses with default address flag.
- `carts`: User-specific persistent shopping carts.
- `cart_items`: User cart lines linked to products with price snapshots.
- `orders`: Customer orders with historical snapshots, status, and financial totals.
- `order_items`: Preserves purchase-time historical product name, brand, original price, discount, and final offer price.
- `payments`: Server-side verified transaction records with gateway response payloads.

---

## 4. Concurrency & Race-Condition Protection

To prevent concurrent users from overselling limited inventory (e.g. 2 users buying the last item simultaneously):
1. **Row-Level Lock (`FOR UPDATE`):**
   ```sql
   SELECT id, name, price, offerPrice, stockQuantity, status 
   FROM products 
   WHERE id = :productId AND deletedAt IS NULL 
   FOR UPDATE;
   ```
2. **Atomic Decrement:**
   ```sql
   UPDATE products 
   SET stockQuantity = stockQuantity - :qty,
       status = CASE WHEN stockQuantity - :qty = 0 THEN 'OUT_OF_STOCK' ELSE status END
   WHERE id = :productId;
   ```
3. Executed inside an interactive MySQL database transaction (`prisma.$transaction`). If stock is insufficient, the transaction rolls back immediately and returns HTTP 400 `INSUFFICIENT_STOCK`.

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+
- MySQL Server running locally on port 3306

### 1. Database Setup
Create the MySQL database:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Ensure DATABASE_URL="mysql://root:root@127.0.0.1:3306/ecommerce_db"
# Ensure PORT=5001

# Push database schema & generate Prisma client
npm run prisma:push

# Seed database with default admin, customer, categories, products, and sample order
npm run seed

# Start development server
npm run dev
# or
node server.js
```
The API server will boot on `http://localhost:5001`.
Health check: `http://localhost:5001/api/health`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:5001/api
# VITE_STORAGE_URL=http://localhost:5001

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Default Development Credentials

### Administrator Account
- **Email:** `admin@ecommerce.com`
- **Password:** `Admin@123456`
- **Portal:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

### Customer Account
- **Email:** `john@example.com`
- **Password:** `User@123456`
- **Portal:** [http://localhost:5173/login](http://localhost:5173/login)

*(Both login pages include one-click "Quick Fill" demo buttons for instant access).*

---

## 7. Running Verification Tests

To run the automated concurrency and race-condition inventory test:
```bash
cd backend
node tests/verifyConcurrency.js
```

**Expected output:**
```text
🧪 Starting Concurrency & Inventory Race Condition Verification...
✅ Admin login verified.
✅ Created 2 concurrent test users.
✅ Created limited product with stock = 1.
✅ Both users added the single item to their respective carts.
⚡ Firing 2 simultaneous checkout requests for the 1 remaining item...
📊 Concurrency Result: 1 Succeeded, 1 Rejected.
🏆 SUCCESS: Exactly 1 user purchased the item, 1 user was safely rejected!
🛡️ Rejected order message: "Insufficient stock for "Limited Edition Rare Watch". Requested: 1, Available: 0."
📦 Final product stock: 0, status: OUT_OF_STOCK
✅ Database stock correctly decremented to 0 and marked OUT_OF_STOCK.
```

---

## 8. REST API Documentation

### Public Endpoints
- `GET /api/health` - API server health check
- `GET /api/categories` - List active categories
- `GET /api/products` - Search, filter, sort, and paginate products
- `GET /api/products/:idOrSlug` - Product details with images
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Customer authentication (returns JWT)
- `POST /api/admin/auth/login` - Administrator authentication

### Protected Customer Endpoints (`Bearer <token>`)
- `GET /api/auth/me` - Profile data with active cart count
- `PUT /api/auth/profile` - Update profile name and phone
- `GET /api/cart` - User-specific shopping cart
- `POST /api/cart/items` - Add product to cart (validates stock)
- `PATCH /api/cart/items/:id` - Update quantity (validates stock)
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `GET /api/cart/validate` - Real-time stock & price validation
- `GET /api/addresses` - List saved shipping addresses
- `POST /api/addresses` - Add shipping address
- `POST /api/orders/checkout-preview` - Compute verified totals, taxes, and shipping
- `POST /api/orders` - Place order with transactional inventory locking
- `GET /api/orders` - User order history
- `GET /api/orders/:id` - User order details
- `POST /api/orders/:id/cancel` - Cancel order and restore inventory atomically
- `POST /api/payments/process` - Server-side payment verification

### Protected Admin Endpoints (`Bearer <admin_token>`)
- `GET /api/admin/stats` - Revenue, orders, catalog, customer, and low-stock KPIs
- `GET /api/admin/products` - Product inventory table
- `POST /api/admin/products` - Create product with local image uploads (Multer)
- `PUT /api/admin/products/:id` - Update product details
- `PATCH /api/admin/products/:id/stock` - Set, increase, or decrease stock
- `PATCH /api/admin/products/:id/status` - Mark ACTIVE, INACTIVE, or OUT_OF_STOCK
- `DELETE /api/admin/products/:id` - Delete product (soft-deletes if historical orders exist)
- `GET /api/admin/categories` - All categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category (protected against active product links)
- `GET /api/admin/orders` - Order fulfillment list with search & status filters
- `GET /api/admin/orders/:id` - Full order invoice details
- `PATCH /api/admin/orders/:id/status` - Update fulfillment status
- `GET /api/admin/users` - Customer directory with lifetime spend

---

## 9. Production Considerations

When deploying this application to production:
1. **HTTPS & Domain:** Configure reverse proxy (Nginx or Cloudflare) with SSL certificates.
2. **Object Storage Migration:** The file upload architecture (`backend/src/middleware/upload.js` and `backend/src/utils/fileStorage.js`) is modularized so local disk storage can be swapped with AWS S3 or Cloudflare R2 by updating the upload service provider.
3. **Database Scaling:** For high-throughput production workloads, utilize MySQL connection pooling and read replicas.
4. **Payment Gateway Integration:** Replace `MockPaymentProvider` with Stripe or Razorpay webhook verification in `backend/src/services/paymentService.js`.
