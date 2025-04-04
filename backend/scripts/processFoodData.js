require('dotenv').config();
const foodDataService = require('../src/services/foodDataService');

async function downloadFoodData() {
  console.log('Downloading food data from FoodData Central...');
  
  try {
    // Download Foundation Foods
    const dataTypes = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
    const count = await foodDataService.downloadCommonFoods(dataTypes);
    
    console.log(`Successfully downloaded ${count} foods.`);
    console.log('\nFood data processed and saved successfully!');
    console.log('\nCitation:');
    console.log('U.S. Department of Agriculture, Agricultural Research Service.');
    console.log('FoodData Central, 2019. fdc.nal.usda.gov.');
  } catch (error) {
    console.error('Error downloading or processing food data:', error);
  }
}

// Run the download function
downloadFoodData();
