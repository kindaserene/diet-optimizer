const nutritionCalculator = require('../services/nutritionCalculator');
const aiEnhancer = require('../services/aiEnhancer');
const reportGenerator = require('../services/reportGenerator');

// Analyze diet based on user inputs
exports.analyzeDiet = async (req, res) => {
  try {
    const userData = req.body;
    
    // 1. Calculate nutritional values
    const nutritionalData = await nutritionCalculator.calculate(userData);
    
    // 2. Enhance with AI analysis
    const enhancedAnalysis = await aiEnhancer.analyze(nutritionalData);
    
    // 3. Generate final report
    const report = reportGenerator.generate(nutritionalData, enhancedAnalysis);
    
    res.json(report);
  } catch (error) {
    console.error('Error analyzing diet:', error);
    res.status(500).json({ 
      message: 'Error analyzing diet', 
      error: error.message 
    });
  }
};
