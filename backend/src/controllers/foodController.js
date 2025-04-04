const foodDataService = require('../services/foodDataService');

/**
 * Search foods by name or other criteria
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
exports.searchFoods = async (req, res) => {
  try {
    const { 
      query = '', 
      dataType = [],
      category = '',
      pageSize = 50,
      pageNumber = 1,
      sortBy = 'dataType.keyword',
      sortOrder = 'asc'
    } = req.query;

    // Convert dataType to array if it's a string
    const dataTypeArray = Array.isArray(dataType) 
      ? dataType 
      : dataType ? [dataType] : [];

    const searchOptions = {
      query,
      dataType: dataTypeArray,
      pageSize: parseInt(pageSize),
      pageNumber: parseInt(pageNumber),
      sortBy,
      sortOrder
    };

    const results = await foodDataService.searchFoods(searchOptions);

    // If category filter was specified, filter results further
    // (FDC API doesn't support category filtering directly)
    if (category && results.foods) {
      results.foods = results.foods.filter(food => 
        food.foodCategory && food.foodCategory.toLowerCase().includes(category.toLowerCase())
      );
      results.totalHits = results.foods.length;
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ 
      message: 'Error searching foods', 
      error: error.message 
    });
  }
};

/**
 * Get food by ID
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await foodDataService.getFoodById(id);
    
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    
    res.json(food);
  } catch (error) {
    console.error('Error getting food by ID:', error);
    res.status(500).json({ 
      message: 'Error getting food', 
      error: error.message 
    });
  }
};

/**
 * Get multiple foods by ID
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
exports.getFoodsById = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Food IDs are required' });
    }
    
    const foods = await foodDataService.getFoodsById(ids);
    
    res.json(foods);
  } catch (error) {
    console.error('Error getting foods by ID:', error);
    res.status(500).json({ 
      message: 'Error getting foods', 
      error: error.message 
    });
  }
};

/**
 * Download common foods for offline use
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
exports.downloadCommonFoods = async (req, res) => {
  try {
    const { dataTypes } = req.query;
    
    const dataTypesArray = dataTypes 
      ? Array.isArray(dataTypes) ? dataTypes : [dataTypes] 
      : ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
    
    const count = await foodDataService.downloadCommonFoods(dataTypesArray);
    
    res.json({ 
      message: `Successfully downloaded ${count} foods`, 
      count 
    });
  } catch (error) {
    console.error('Error downloading common foods:', error);
    res.status(500).json({ 
      message: 'Error downloading common foods', 
      error: error.message 
    });
  }
};
