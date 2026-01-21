import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fetch from 'node-fetch';

const API_KEY = `${process.env.USDA_API_KEY}`;

async function usdaSearch(query, pageSize = 3) {
    const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}`
    );
    const json = await response.json();
    return json.foods || [];
}

async function usdaNutrients(fdcId) {
    const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${API_KEY}`
    );
    const json = await response.json();
    return json.labelNutrients;
}

export const usdaTool = tool(
    async ({ foodName, count }) => { 
      console.log(`--- AI Tool Called: ${foodName} (requesting ${count} results) ---`);
      try {
        // 1. Get multiple foods at once based on the requested count
        const foods = await usdaSearch(foodName, count || 1);
        
        if (foods.length === 0) return `No data found for "${foodName}".`;
  
        // 2. Map through ALL found foods and get nutrients for each
        const detailedResults = await Promise.all(foods.map(async (topFood) => {
            const nutrients = await usdaNutrients(topFood.fdcId);
            return {
              item: topFood.description,
              brand: topFood.brandName || "Generic",
              calories: nutrients?.calories?.value || "N/A",
              protein: nutrients?.protein?.value || "N/A",
              carbs: nutrients?.carbohydrates?.value || "N/A",
              fat: nutrients?.fat?.value || "N/A"
            };
        }));
  
        console.log(`Tool returning ${detailedResults.length} items.`);
        return JSON.stringify(detailedResults);
      } catch (error) {
        return "Error fetching data.";
      }
    },
    {
      name: "get_nutrition_data",
      description: "Search for nutritional info. Use 'count' to specify how many variations to return.",
      schema: z.object({
        foodName: z.string().describe("The name of the food"),
        count: z.number().optional().describe("Number of results to return") // Let the agent specify
      }),
    }
  );