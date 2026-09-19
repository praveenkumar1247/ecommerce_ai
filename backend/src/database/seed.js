const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper to create sample SVG images for local upload testing
const createSampleImage = (filename, title, categoryName, bgGradient1, bgGradient2) => {
  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    const svgContent = `<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgGradient1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgGradient2};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <circle cx="400" cy="360" r="190" fill="#ffffff" fill-opacity="0.08" filter="url(#shadow)" />
  <circle cx="400" cy="360" r="140" fill="#ffffff" fill-opacity="0.12" />
  
  <text x="400" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    ${categoryName.toUpperCase()}
  </text>
  <text x="400" y="390" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle">
    ${title}
  </text>
  <rect x="340" y="440" width="120" height="36" rx="18" fill="#ffffff" fill-opacity="0.25" />
  <text x="400" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">
    ORIGINAL STORE
  </text>
</svg>`;
    fs.writeFileSync(filePath, svgContent, 'utf-8');
  }
  return `/uploads/products/${filename}`;
};

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing data
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Users (Admin & Customer)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const userPasswordHash = await bcrypt.hash('User@123456', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      phone: '+91 9876543210',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      email: 'john@example.com',
      passwordHash: userPasswordHash,
      fullName: 'John Doe',
      phone: '+91 9123456780',
      role: 'USER',
      status: 'ACTIVE',
      addresses: {
        create: [
          {
            fullName: 'John Doe',
            phone: '+91 9123456780',
            addressLine1: '742 Evergreen Terrace',
            addressLine2: 'Apartment 4B',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560001',
            addressType: 'HOME',
            isDefault: true,
          },
          {
            fullName: 'John Doe (Office)',
            phone: '+91 9123456780',
            addressLine1: 'Tech Park, Tower 2, 5th Floor',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560100',
            addressType: 'WORK',
            isDefault: false,
          },
        ],
      },
      cart: {
        create: {},
      },
    },
  });

  console.log(`👤 Seeded Users: Admin (${adminUser.email}) and Customer (${normalUser.email})`);

  // 3. Create Categories
  const categoriesData = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Latest flagship smartphones, noise-cancelling headphones, laptops, and smart wearables.',
      status: 'ACTIVE',
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Premium apparel, designer footwear, timeless watches, and curated accessories.',
      status: 'ACTIVE',
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Modern ergonomic furniture, luxury lighting, and artisan kitchen essentials.',
      status: 'ACTIVE',
    },
    {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Performance gear, smart workout accessories, outdoor camping equipment, and recovery tools.',
      status: 'ACTIVE',
    },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created;
  }
  console.log(`🏷️ Seeded ${Object.keys(categories).length} Categories.`);

  // 4. Products Data
  const sampleProducts = [
    {
      name: 'Apex Pro Wireless ANC Headphones',
      slug: 'apex-pro-wireless-anc-headphones',
      description: 'Studio-grade acoustic architecture with 40mm custom drivers, active hybrid noise cancellation, 45-hour battery life, and ultra-plush memory foam earcups.',
      brand: 'AcoustiMax',
      sku: 'ELEC-APEX-001',
      price: 19999.00,
      discountPercent: 15.00,
      offerPrice: 16999.15,
      stockQuantity: 25,
      status: 'ACTIVE',
      categoryId: categories['electronics'].id,
      images: [
        {
          filename: 'apex-pro-headphones-1.svg',
          title: 'Apex Pro ANC',
          cat: 'Electronics',
          c1: '#1e1b4b',
          c2: '#4338ca',
          isPrimary: true,
        },
        {
          filename: 'apex-pro-headphones-2.svg',
          title: 'Driver Acoustic View',
          cat: 'Electronics',
          c1: '#312e81',
          c2: '#6366f1',
          isPrimary: false,
        },
      ],
    },
    {
      name: 'NovaBook Ultra 16 M3 Laptop',
      slug: 'novabook-ultra-16-m3-laptop',
      description: 'Featherlight aerospace aluminum unibody, 3.2K OLED 120Hz display, 32GB Unified RAM, 1TB NVMe PCIe 4.0 SSD, and 18 hours of all-day battery efficiency.',
      brand: 'NovaTech',
      sku: 'ELEC-NOVA-002',
      price: 149999.00,
      discountPercent: 10.00,
      offerPrice: 134999.10,
      stockQuantity: 8,
      status: 'ACTIVE',
      categoryId: categories['electronics'].id,
      images: [
        {
          filename: 'novabook-ultra-1.svg',
          title: 'NovaBook Ultra 16',
          cat: 'Electronics',
          c1: '#0f172a',
          c2: '#334155',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'PulseTrack Horizon Smartwatch',
      slug: 'pulsetrack-horizon-smartwatch',
      description: 'Titanium bezel with sapphire crystal glass, continuous ECG & SpO2 monitoring, dual-frequency GPS, and 100m water resistance rating.',
      brand: 'Chronos',
      sku: 'ELEC-PULSE-003',
      price: 24999.00,
      discountPercent: 20.00,
      offerPrice: 19999.20,
      stockQuantity: 40,
      status: 'ACTIVE',
      categoryId: categories['electronics'].id,
      images: [
        {
          filename: 'pulsetrack-watch-1.svg',
          title: 'Horizon Smartwatch',
          cat: 'Wearables',
          c1: '#022c22',
          c2: '#059669',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Signature Cashmere Merino Sweater',
      slug: 'signature-cashmere-merino-sweater',
      description: 'Crafted from 100% sustainably harvested Mongolian cashmere and fine Merino wool blend. Breathable, thermo-regulating, and tailored for a modern relaxed fit.',
      brand: 'Atelier Sartorial',
      sku: 'FASH-SWEAT-001',
      price: 8499.00,
      discountPercent: 25.00,
      offerPrice: 6374.25,
      stockQuantity: 15,
      status: 'ACTIVE',
      categoryId: categories['fashion-apparel'].id,
      images: [
        {
          filename: 'cashmere-sweater-1.svg',
          title: 'Cashmere Knit',
          cat: 'Fashion',
          c1: '#701a75',
          c2: '#a21caf',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Handcrafted Italian Oxford Shoes',
      slug: 'handcrafted-italian-oxford-shoes',
      description: 'Full-grain calfskin leather vegetable-tanned in Tuscany, Goodyear welted construction, burnished almond toe, and cushioned arch-support insole.',
      brand: 'Enzo Bellini',
      sku: 'FASH-SHOE-002',
      price: 18999.00,
      discountPercent: 0.00,
      offerPrice: 18999.00,
      stockQuantity: 12,
      status: 'ACTIVE',
      categoryId: categories['fashion-apparel'].id,
      images: [
        {
          filename: 'oxford-shoes-1.svg',
          title: 'Italian Oxfords',
          cat: 'Footwear',
          c1: '#78350f',
          c2: '#b45309',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'ErgoComfort Aero Mesh Office Chair',
      slug: 'ergocomfort-aero-mesh-office-chair',
      description: 'Synchronized tilt mechanism with 4D adjustable armrests, dynamic lumbar support, breathable German elastomer mesh, and heavy-duty class-4 gas lift.',
      brand: 'ErgoSpace',
      sku: 'HOME-CHAIR-001',
      price: 28999.00,
      discountPercent: 30.00,
      offerPrice: 20299.30,
      stockQuantity: 5,
      status: 'ACTIVE',
      categoryId: categories['home-living'].id,
      images: [
        {
          filename: 'ergo-chair-1.svg',
          title: 'ErgoComfort Aero',
          cat: 'Home Living',
          c1: '#111827',
          c2: '#374151',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'Ceramic Artisan Pour-Over Dripper Set',
      slug: 'ceramic-artisan-pour-over-dripper-set',
      description: 'Hand-thrown matte black ceramic cone with spiral extraction ridges, heat-resistant borosilicate glass server (600ml), and solid brass stand.',
      brand: 'Kurasu Design',
      sku: 'HOME-COFFEE-002',
      price: 4999.00,
      discountPercent: 10.00,
      offerPrice: 4499.10,
      stockQuantity: 30,
      status: 'ACTIVE',
      categoryId: categories['home-living'].id,
      images: [
        {
          filename: 'pour-over-1.svg',
          title: 'Pour-Over Set',
          cat: 'Kitchen',
          c1: '#422006',
          c2: '#713f12',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'ProGrip Carbon Trekking Poles (Pair)',
      slug: 'progrip-carbon-trekking-poles-pair',
      description: '100% high-modulus 3K carbon fiber shafts, quick-cam aluminum locks, natural cork moisture-wicking grips, and carbide tips with all-terrain baskets.',
      brand: 'SummitPeak',
      sku: 'SPRT-POLE-001',
      price: 6999.00,
      discountPercent: 15.00,
      offerPrice: 5949.15,
      stockQuantity: 20,
      status: 'ACTIVE',
      categoryId: categories['sports-fitness'].id,
      images: [
        {
          filename: 'trekking-poles-1.svg',
          title: 'Carbon Trekking Poles',
          cat: 'Outdoors',
          c1: '#14532d',
          c2: '#15803d',
          isPrimary: true,
        },
      ],
    },
    {
      name: 'HyperStrike Pro Speed Rope',
      slug: 'hyperstrike-pro-speed-rope',
      description: 'Precision dual ball bearings, aircraft-grade polyurethane coated steel cable, non-slip knurled aluminum handles, and quick-adjust mechanism.',
      brand: 'HyperStrike',
      sku: 'SPRT-ROPE-002',
      price: 1999.00,
      discountPercent: 0.00,
      offerPrice: 1999.00,
      stockQuantity: 0,
      status: 'OUT_OF_STOCK',
      categoryId: categories['sports-fitness'].id,
      images: [
        {
          filename: 'speed-rope-1.svg',
          title: 'Speed Jump Rope',
          cat: 'Fitness',
          c1: '#831843',
          c2: '#be185d',
          isPrimary: true,
        },
      ],
    },
  ];

  for (const item of sampleProducts) {
    const { images, ...productData } = item;
    const createdProduct = await prisma.product.create({
      data: productData,
    });

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imageUrl = createSampleImage(img.filename, img.title, img.cat, img.c1, img.c2);
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          imageUrl,
          isPrimary: img.isPrimary,
          displayOrder: i,
        },
      });
    }
  }

  console.log(`📦 Seeded ${sampleProducts.length} Products with images.`);

  // 5. Seed an initial sample order for the customer
  const firstProduct = await prisma.product.findFirst({
    where: { sku: 'ELEC-APEX-001' },
    include: { images: true },
  });

  if (firstProduct) {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-1001`;
    const subtotal = Number(firstProduct.price);
    const discount = Number(firstProduct.price) - Number(firstProduct.offerPrice);
    const shippingFee = 0.0;
    const tax = Number((Number(firstProduct.offerPrice) * 0.18).toFixed(2));
    const totalAmount = Number((Number(firstProduct.offerPrice) + tax + shippingFee).toFixed(2));

    const sampleOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: normalUser.id,
        subtotal,
        discount,
        shippingFee,
        tax,
        totalAmount,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        shippingAddressSnapshot: {
          fullName: 'John Doe',
          phone: '+91 9123456780',
          addressLine1: '742 Evergreen Terrace',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        items: {
          create: [
            {
              productId: firstProduct.id,
              productNameSnapshot: firstProduct.name,
              brandSnapshot: firstProduct.brand,
              priceSnapshot: firstProduct.price,
              discountSnapshot: firstProduct.discountPercent,
              finalPrice: firstProduct.offerPrice,
              quantity: 1,
              subtotal: firstProduct.offerPrice,
              imageUrlSnapshot: firstProduct.images[0]?.imageUrl || '',
            },
          ],
        },
        payment: {
          create: {
            paymentMethod: 'MOCK_CARD',
            transactionId: `TXN-MOCK-${Date.now()}`,
            amount: totalAmount,
            currency: 'INR',
            status: 'SUCCESS',
            providerResponse: {
              gateway: 'MockPaymentGateway',
              code: '200',
              authCode: 'AUTH_OK_9999',
            },
          },
        },
      },
    });

    console.log(`🧾 Seeded Initial Order: ${sampleOrder.orderNumber} for ${normalUser.email}`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
