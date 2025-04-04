exports.generate = (nutritionalData, aiAnalysis) => {
  const { comparison, targets, currentIntake, userInfo, dietaryGoal } = nutritionalData;
  const { strengths, deficiencies, recommendations, summary } = aiAnalysis;
  
  // Format the current diet description
  const currentDietDescription = formatCurrentDiet(nutritionalData);
  
  // Generate nutrients table data
  const nutrientsData = generateNutrientsTable(comparison, targets, currentIntake);
  
  // Return the formatted report
  return {
    title: `Complete Nutritional Profile for ${formatDietaryGoal(dietaryGoal)}`,
    currentDiet: currentDietDescription,
    nutrients: nutrientsData,
    analysis: {
      strengths,
      deficiencies
    },
    recommendations,
    summary
  };
};

// Format the current diet description
function formatCurrentDiet(nutritionalData) {
  // For MVP, return a placeholder
  // In a complete implementation, this would list all the food items from user input
  return "Current diet items would be listed here based on user input";
}

// Format the dietary goal for display
function formatDietaryGoal(dietaryGoal) {
  const dietNames = {
    'high-protein-low-carb': 'High-Protein, Low-Carb Diet',
    'keto': 'Ketogenic Diet',
    'balanced': 'Balanced Diet',
    'low-fat': 'Low-Fat Diet',
    'plant-based': 'Plant-Based Diet'
  };
  
  return dietNames[dietaryGoal] || 'Custom Diet';
}

// Generate the nutrients table for the report
function generateNutrientsTable(comparison, targets, currentIntake) {
  const nutrientCategories = [
    {
      category: "Macronutrients",
      items: ["calories", "protein", "carbs", "fat", "fiber"]
    }
    // Additional categories would be added for a complete implementation
  ];
  
  const formattedCategories = [];
  
  nutrientCategories.forEach(category => {
    const items = [];
    
    category.items.forEach(nutrient => {
      if (comparison[nutrient]) {
        const { target, current, percentage, status } = comparison[nutrient];
        
        items.push({
          name: formatNutrientName(nutrient),
          target: formatTarget(nutrient, target),
          amount: `~${Math.round(current)}${getUnit(nutrient)}`,
          percentOfTarget: `${Math.round(percentage)}%`,
          status
        });
      }
    });
    
    formattedCategories.push({
      category: category.category,
      items
    });
  });
  
  return formattedCategories;
}

// Format nutrient names for display
function formatNutrientName(nutrient) {
  const names = {
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbohydrates",
    fat: "Fat",
    fiber: "Fiber"
  };
  
  return names[nutrient] || nutrient.charAt(0).toUpperCase() + nutrient.slice(1);
}

// Format target values with appropriate context
function formatTarget(nutrient, target) {
  if (nutrient === 'protein') {
    const range = [Math.round(target * 0.9), Math.round(target * 1.1)];
    return `${range[0]}-${range[1]}g (30-40% of calories)`;
  }
  
  if (nutrient === 'carbs') {
    return `50-100g (12-25% of calories)`;
  }
  
  if (nutrient === 'fat') {
    return `${Math.round(target * 0.9)}-${Math.round(target * 1.1)}g (40-50% of calories)`;
  }
  
  return `${Math.round(target)}${getUnit(nutrient)}`;
}

// Get appropriate units for nutrients
function getUnit(nutrient) {
  if (nutrient === 'calories') return '';
  if (nutrient === 'protein' || nutrient === 'carbs' || nutrient === 'fat' || nutrient === 'fiber') return 'g';
  return '';
}
