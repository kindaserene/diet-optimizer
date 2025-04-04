// Function to calculate nutrition based on user inputs
exports.calculate = async (userData) => {
  // Extract user data
  const { userInfo, activityLevel, dietaryGoal, foodEntries } = userData;
  
  // Calculate base metabolic needs
  const bmr = calculateBMR(userInfo);
  const tdee = bmr * getActivityMultiplier(activityLevel);
  
  // Determine target nutrients based on dietary goal
  const targets = determineNutrientTargets(dietaryGoal, tdee, userInfo);
  
  // Calculate current nutrient intake from food entries
  const currentIntake = calculateCurrentIntake(foodEntries);
  
  // Compare current intake with targets
  const comparison = compareWithTargets(currentIntake, targets);
  
  return { 
    targets, 
    currentIntake, 
    comparison,
    userInfo,
    dietaryGoal
  };
};

// Helper function to calculate Basal Metabolic Rate (BMR)
function calculateBMR(userInfo) {
  const { age, gender, weight, weightUnit, height, heightUnit } = userInfo;
  
  // Convert to metric if needed
  const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
  
  let heightCm;
  if (heightUnit === 'ft') {
    // Assuming height is stored as feet in decimal format
    heightCm = height * 30.48;
  } else {
    heightCm = height;
  }
  
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

// Helper function to get activity multiplier
function getActivityMultiplier(activityLevel) {
  const multipliers = {
    1: 1.2,  // Sedentary
    2: 1.375, // Lightly active
    3: 1.55,  // Moderately active
    4: 1.725, // Very active
    5: 1.9    // Extremely active
  };
  
  return multipliers[activityLevel] || 1.2;
}

// Helper function to determine nutrient targets based on dietary goal
function determineNutrientTargets(dietaryGoal, tdee, userInfo) {
  // Base macronutrient ratios by diet type
  const dietMacros = {
    'high-protein-low-carb': {
      protein: 0.35, // 35% of calories from protein
      carbs: 0.2,    // 20% of calories from carbs
      fat: 0.45      // 45% of calories from fat
    },
    'keto': {
      protein: 0.2,   // 20% of calories from protein
      carbs: 0.05,    // 5% of calories from carbs
      fat: 0.75       // 75% of calories from fat
    },
    'balanced': {
      protein: 0.25,  // 25% of calories from protein
      carbs: 0.5,     // 50% of calories from carbs
      fat: 0.25       // 25% of calories from fat
    },
    'low-fat': {
      protein: 0.3,   // 30% of calories from protein
      carbs: 0.55,    // 55% of calories from carbs
      fat: 0.15       // 15% of calories from fat
    },
    'plant-based': {
      protein: 0.2,   // 20% of calories from protein
      carbs: 0.6,     // 60% of calories from carbs
      fat: 0.2        // 20% of calories from fat
    }
  };
  
  // Default to balanced if goal not found
  const macros = dietMacros[dietaryGoal] || dietMacros.balanced;
  
  // Calculate macronutrient targets in grams
  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fat: 9 calories per gram
  const proteinGrams = (tdee * macros.protein) / 4;
  const carbGrams = (tdee * macros.carbs) / 4;
  const fatGrams = (tdee * macros.fat) / 9;
  
  // For MVP, we'll return a simplified set of nutrient targets
  return {
    calories: tdee,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    fiber: 25, // Standard recommendation
    // Add more nutrients as needed for advanced version
  };
}

// Function to calculate nutrients from food entries (simplified for MVP)
function calculateCurrentIntake(foodEntries) {
  // For MVP, we'll return mock data
  // In a real implementation, this would look up food items in the database
  // and calculate actual nutritional values
  
  return {
    calories: 1500,
    protein: 120,
    carbs: 100,
    fat: 50,
    fiber: 15,
    // Additional nutrients would be calculated here
  };
}

// Function to compare current intake with targets
function compareWithTargets(currentIntake, targets) {
  const result = {};
  
  // Calculate percentage of target for each nutrient
  for (const nutrient in targets) {
    if (currentIntake[nutrient]) {
      const percentage = (currentIntake[nutrient] / targets[nutrient]) * 100;
      
      let status;
      if (percentage >= 90) {
        status = 'ADEQUATE';
      } else if (percentage >= 50) {
        status = 'PARTIAL';
      } else {
        status = 'DEFICIENT';
      }
      
      result[nutrient] = {
        target: targets[nutrient],
        current: currentIntake[nutrient],
        percentage,
        status
      };
    }
  }
  
  return result;
}
