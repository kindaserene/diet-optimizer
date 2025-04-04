const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');

// GET /api/foods/search - Search for foods
router.get('/search', foodController.searchFoods);

// GET /api/foods/:id - Get food by ID
router.get('/:id', foodController.getFoodById);

// POST /api/foods/batch - Get multiple foods by ID
router.post('/batch', foodController.getFoodsById);

// GET /api/foods/admin/download - Admin endpoint to download common foods
router.get('/admin/download', foodController.downloadCommonFoods);

module.exports = router;
