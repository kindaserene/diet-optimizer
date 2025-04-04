const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for FoodData Central API
const FDC_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// API key from environment variables
const API_KEY = process.env.FDC_API_KEY;

// Path to local cache
const CACHE_DIR = path.join(__dirname, '../data/foodDataCentral');
const FOODS_CACHE_PATH = path.join(CACHE_DIR, 'processedFoods.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Search for foods by query string
 * @param {Object} options Search options
 * @returns {Promise<Object>} Search results
 */
exports.searchFoods = async (options = {}) => {
  try {
    const { 
      query = '', 
      dataType = [],
      pageSize = 50,
      pageNumber = 1,
      sortBy = 'dataType.keyword',
      sortOrder = 'asc'
    } = options;

    const response = await axios.get(`${FDC_API_BASE_URL}/foods/search`, {
      params: {
        api_key: API_KEY,
        query,
        pageSize,
        pageNumber,
        sortBy,
        sortOrder,
        dataType: dataType.join(',')
      }
    });

    // Save results to cache if there are results (optional)
    if (response.data.foods && response.data.foods.length > 0) {
      await updateFoodsCache(response.data.foods);
    }

    return response.data;
  } catch (error) {
    console.error('Error searching foods:', error);
    // If API fails, try to use cached data
    return searchFoodsFromCache(options);
  }
};

/**
 * Get detailed food information by FDC ID
 * @param {string} fdcId FDC ID
 * @returns {Promise<Object>} Food details
 */
exports.getFoodById = async (fdcId) => {
  try {
    const response = await axios.get(`${FDC_API_BASE_URL}/food/${fdcId}`, {
      params: {
        api_key: API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error getting food ${fdcId}:`, error);
    // If API fails, try to use cached data
    return getFoodByIdFromCache(fdcId);
  }
};

/**
 * Get multiple foods by their FDC IDs
 * @param {Array<string>} fdcIds Array of FDC IDs
 * @returns {Promise<Array<Object>>} Foods details
 */
exports.getFoodsById = async (fdcIds) => {
  try {
    const response = await axios.post(`${FDC_API_BASE_URL}/foods`, {
      fdcIds
    }, {
      params: {
        api_key: API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting multiple foods:', error);
    // If API fails, try to use cached data
    return getFoodsByIdFromCache(fdcIds);
  }
};

/**
 * Download and cache common foods for offline use
 * @param {Array<string>} dataTypes Array of data types to download
 * @returns {Promise<number>} Number of foods downloaded
 */
exports.downloadCommonFoods = async (dataTypes = ['Foundation', 'SR Legacy', 'Survey (FNDDS)']) => {
  try {
    let allFoods = [];
    
    for (const dataType of dataTypes) {
      console.log(`Downloading ${dataType} foods...`);
      
      const response = await axios.get(`${FDC_API_BASE_URL}/foods/search`, {
        params: {
          api_key: API_KEY,
          dataType,
          pageSize: 200, // Adjust based on needs
          sortBy: 'lowercaseDescription.keyword',
          sortOrder: 'asc'
        }
      });
      
      if (response.data.foods) {
        allFoods = [...allFoods, ...response.data.foods];
        console.log(`Added ${response.data.foods.length} ${dataType} foods.`);
      }
    }
    
    console.log(`Total foods collected: ${allFoods.length}`);
    
    // Process and save foods
    await updateFoodsCache(allFoods);
    
    return allFoods.length;
  } catch (error) {
    console.error('Error downloading common foods:', error);
    return 0;
  }
};

// Helper functions for cache management

/**
 * Update the foods cache with new food data
 * @param {Array<Object>} foods Array of food objects
 */
async function updateFoodsCache(foods) {
  try {
    // Process foods to extract the data we need
    const processedFoods = foods.map(food => ({
      id: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      category: food.foodCategory || 'Uncategorized',
      nutrients: (food.foodNutrients || []).map(nutrient => ({
        id: nutrient.nutrientId,
        name: nutrient.nutrientName,
        amount: nutrient.value,
        unit: nutrient.unitName
      })),
      brandOwner: food.brandOwner || null,
      ingredients: food.ingredients || null,
      servingSizes: food.servingSizeUnit ? [{
        amount: food.servingSize,
        unit: food.servingSizeUnit
      }] : []
    }));
    
    // Read existing cache if it exists
    let existingFoods = [];
    if (fs.existsSync(FOODS_CACHE_PATH)) {
      const cacheData = fs.readFileSync(FOODS_CACHE_PATH, 'utf8');
      existingFoods = JSON.parse(cacheData);
    }
    
    // Merge with existing foods, avoiding duplicates
    const foodMap = new Map();
    existingFoods.forEach(food => foodMap.set(food.id, food));
    processedFoods.forEach(food => foodMap.set(food.id, food));
    
    // Save updated cache
    const updatedFoods = Array.from(foodMap.values());
    fs.writeFileSync(FOODS_CACHE_PATH, JSON.stringify(updatedFoods, null, 2));
    console.log(`Updated foods cache with ${processedFoods.length} foods. Total: ${updatedFoods.length}`);
  } catch (error) {
    console.error('Error updating foods cache:', error);
  }
}

/**
 * Search foods from the local cache
 * @param {Object} options Search options
 * @returns {Promise<Object>} Search results
 */
async function searchFoodsFromCache({ query = '', dataType = [], pageSize = 50, pageNumber = 1 }) {
  try {
    if (!fs.existsSync(FOODS_CACHE_PATH)) {
      return { foods: [], totalHits: 0 };
    }
    
    const cacheData = fs.readFileSync(FOODS_CACHE_PATH, 'utf8');
    let foods = JSON.parse(cacheData);
    
    // Filter by query
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      foods = foods.filter(food => 
        searchTerms.every(term => 
          food.description.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by data type
    if (dataType.length > 0) {
      foods = foods.filter(food => 
        dataType.includes(food.dataType)
      );
    }
    
    // Pagination
    const totalHits = foods.length;
    const start = (pageNumber - 1) * pageSize;
    const end = start + pageSize;
    foods = foods.slice(start, end);
    
    return {
      foods,
      totalHits,
      pageSize,
      currentPage: pageNumber
    };
  } catch (error) {
    console.error('Error searching foods from cache:', error);
    return { foods: [], totalHits: 0 };
  }
}

/**
 * Get food by ID from the local cache
 * @param {string} fdcId FDC ID
 * @returns {Promise<Object>} Food details
 */
async function getFoodByIdFromCache(fdcId) {
  try {
    if (!fs.existsSync(FOODS_CACHE_PATH)) {
      return null;
    }
    
    const cacheData = fs.readFileSync(FOODS_CACHE_PATH, 'utf8');
    const foods = JSON.parse(cacheData);
    
    return foods.find(food => food.id.toString() === fdcId.toString()) || null;
  } catch (error) {
    console.error(`Error getting food ${fdcId} from cache:`, error);
    return null;
  }
}

/**
 * Get multiple foods by ID from the local cache
 * @param {Array<string>} fdcIds Array of FDC IDs
 * @returns {Promise<Array<Object>>} Foods details
 */
async function getFoodsByIdFromCache(fdcIds) {
  try {
    if (!fs.existsSync(FOODS_CACHE_PATH)) {
      return [];
    }
    
    const cacheData = fs.readFileSync(FOODS_CACHE_PATH, 'utf8');
    const foods = JSON.parse(cacheData);
    
    return foods.filter(food => 
      fdcIds.includes(food.id.toString())
    );
  } catch (error) {
    console.error('Error getting multiple foods from cache:', error);
    return [];
  }
}
