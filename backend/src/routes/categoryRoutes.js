const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public category browsing
router.get('/', categoryController.getPublicCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

module.exports = router;
