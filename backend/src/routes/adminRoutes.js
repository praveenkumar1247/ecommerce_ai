const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');
const { authLimiter } = require('../middleware/rateLimiter');

// Dedicated Admin Login (public with rate limiting)
router.post('/auth/login', authLimiter, authController.adminLogin);

// All subsequent admin routes require valid JWT AND ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Dashboard Analytics
router.get('/stats', adminController.getDashboardStats);

// Category Management
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.patch('/categories/:id/status', categoryController.toggleStatus);

// Product Management
router.get('/products', productController.getAdminProducts);
router.get('/products/:idOrSlug', productController.getProductByIdOrSlug);
router.post('/products', upload.array('images', 5), productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.patch('/products/:id/stock', productController.updateStock);
router.patch('/products/:id/status', productController.updateStatus);
router.delete('/products/:id', productController.deleteProduct);

// Product Image Management
router.post('/products/:id/images', upload.array('images', 5), productController.addProductImages);
router.delete('/products/:id/images/:imageId', productController.deleteProductImage);

// Order Fulfillment
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Customer Directory
router.get('/users', adminController.getAllUsers);

module.exports = router;
