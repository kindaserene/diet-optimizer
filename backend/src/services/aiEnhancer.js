const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.analyze = async (nutritionalData) => {
  try {
    // Create prompt for the AI
    const prompt = createAnalysisPrompt(nutritionalData);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a nutritional analysis assistant specialized in diet optimization. Provide detailed, actionable recommendations based on nutritional data." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });
    
    // Parse the response
    return parseAIResponse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    // Fallback to basic analysis if AI fails
    return createFallbackAnalysis(nutritionalData);
  }
};

// Function to create prompt for OpenAI
function createAnalysisPrompt(nutritionalData) {
  const { targets, currentIntake, comparison, userInfo, dietaryGoal } = nutritionalData;
  
  let prompt = `
Analyze the following diet information and provide specific recommendations:

User Profile:
- Age: ${userInfo.age}
- Gender: ${userInfo.gender}
- Diet Goal: ${dietaryGoal}

Current Nutritional Intake:
`;

  // Add current intake data
  for (const nutrient in currentIntake) {
    prompt += `- ${nutrient}: ${currentIntake[nutrient].toFixed(1)}`;
    if (targets[nutrient]) {
      prompt += ` (Target: ${targets[nutrient].toFixed(1)})`;
    }
    prompt += '\n';
  }
  
  prompt += `
Comparison Results:
`;

  // Add comparison data
  for (const nutrient in comparison) {
    prompt += `- ${nutrient}: ${comparison[nutrient].current.toFixed(1)} vs target of ${comparison[nutrient].target.toFixed(1)} (${comparison[nutrient].percentage.toFixed(1)}%, Status: ${comparison[nutrient].status})\n`;
  }
  
  // Add instructions for output format
  prompt += `
Please provide:
1. A list of strengths in the current diet (what's good)
2. A list of deficiencies or concerns (what needs improvement)
3. Specific food recommendations to address deficiencies
4. A short summary paragraph

Format your response as a JSON object with these keys: strengths, deficiencies, recommendations, summary
For each recommendation, include: nutrient, suggestion, and options (array of specific food suggestions).
`;

  return prompt;
}

// Function to parse AI response
function parseAIResponse(responseText) {
  try {
    // Try to parse directly if response is valid JSON
    return JSON.parse(responseText);
  } catch (error) {
    // If not valid JSON, try to extract JSON portion
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        console.error('Error parsing extracted JSON:', innerError);
      }
    }
    
    // Fallback to manual extraction
    return extractAnalysisFromText(responseText);
  }
}

// Function to manually extract analysis from text
function extractAnalysisFromText(text) {
  // Simple extraction for fallback
  const strengths = [];
  const deficiencies = [];
  const recommendations = [];
  let summary = "";
  
  // Extract strengths
  const strengthsMatch = text.match(/strengths:?[\s\S]*?(?=deficiencies|recommendations|summary|$)/i);
  if (strengthsMatch) {
    const strengthsText = strengthsMatch[0];
    const strengthItems = strengthsText.match(/[-•*]\s*(.*?)(?=[-•*]|$)/g);
    if (strengthItems) {
      strengthItems.forEach(item => {
        const cleanItem = item.replace(/[-•*]\s*/, '').trim();
        if (cleanItem) strengths.push(cleanItem);
      });
    }
  }
  
  // Extract deficiencies
  const deficienciesMatch = text.match(/deficiencies:?[\s\S]*?(?=strengths|recommendations|summary|$)/i);
  if (deficienciesMatch) {
    const deficienciesText = deficienciesMatch[0];
    const deficiencyItems = deficienciesText.match(/[-•*]\s*(.*?)(?=[-•*]|$)/g);
    if (deficiencyItems) {
      deficiencyItems.forEach(item => {
        const cleanItem = item.replace(/[-•*]\s*/, '').trim();
        if (cleanItem) deficiencies.push(cleanItem);
      });
    }
  }
  
  // Extract recommendations
  const recommendationsMatch = text.match(/recommendations:?[\s\S]*?(?=strengths|deficiencies|summary|$)/i);
  if (recommendationsMatch) {
    const recommendationsText = recommendationsMatch[0];
    const recommendationItems = recommendationsText.match(/[-•*]\s*(.*?)(?=[-•*]|$)/g);
    if (recommendationItems) {
      recommendationItems.forEach(item => {
        const cleanItem = item.replace(/[-•*]\s*/, '').trim();
        if (cleanItem) {
          const parts = cleanItem.split(':');
          if (parts.length >= 2) {
            recommendations.push({
              nutrient: parts[0].trim(),
              suggestion: parts[1].trim(),
              options: ['Add foods rich in this nutrient']
            });
          } else {
            recommendations.push({
              nutrient: 'general',
              suggestion: cleanItem,
              options: ['Follow this recommendation']
            });
          }
        }
      });
    }
  }
  
  // Extract summary
  const summaryMatch = text.match(/summary:?[\s\S]*?$/i);
  if (summaryMatch) {
    summary = summaryMatch[0].replace(/summary:?/i, '').trim();
  }
  
  return { strengths, deficiencies, recommendations, summary };
}

// Function to create fallback analysis when AI fails
function createFallbackAnalysis(nutritionalData) {
  const { comparison } = nutritionalData;
  
  const strengths = [];
  const deficiencies = [];
  const recommendations = [];
  
  for (const nutrient in comparison) {
    if (comparison[nutrient].status === 'ADEQUATE') {
      strengths.push(`${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}: Meeting targets at ${comparison[nutrient].percentage.toFixed(0)}%`);
    } else if (comparison[nutrient].status === 'DEFICIENT') {
      deficiencies.push(`${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}: Only at ${comparison[nutrient].percentage.toFixed(0)}% of target`);
      
      // Basic recommendation based on nutrient
      const recommendation = {
        nutrient,
        suggestion: `Increase ${nutrient} intake to reach target of ${comparison[nutrient].target.toFixed(0)} per day`,
        options: generateFoodOptions(nutrient)
      };
      
      recommendations.push(recommendation);
    }
  }
  
  return {
    strengths,
    deficiencies,
    recommendations,
    summary: "This analysis provides basic guidance based on your nutritional data. Consider these recommendations as a starting point for improving your diet."
  };
}

// Function to generate basic food options for common nutrients
function generateFoodOptions(nutrient) {
  const foodSuggestions = {
    protein: ['Chicken breast', 'Greek yogurt', 'Eggs', 'Lentils', 'Tuna'],
    carbs: ['Brown rice', 'Sweet potatoes', 'Oats', 'Quinoa', 'Whole grain bread'],
    fat: ['Avocados', 'Olive oil', 'Nuts', 'Seeds', 'Fatty fish'],
    fiber: ['Beans', 'Broccoli', 'Apples', 'Chia seeds', 'Whole grains'],
  };
  
  return foodSuggestions[nutrient] || ['Consult a nutritional guide for food sources'];
}
