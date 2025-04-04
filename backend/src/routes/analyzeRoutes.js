const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');

// POST /api/analyze - Analyze user's diet
router.post('/', analyzeController.analyzeDiet);

module.exports = router;
