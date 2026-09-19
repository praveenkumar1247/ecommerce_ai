const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public catalog endpoints (no login required)
router.get('/', productController.getPublicProducts);
router.get('/:idOrSlug', productController.getProductByIdOrSlug);

module.exports = router;
