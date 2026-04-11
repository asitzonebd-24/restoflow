
import { GoogleGenAI } from "@google/genai";
import { Order, InventoryItem } from "../types";

// Helper to initialize the client with the required API_KEY environment variable.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessInsight = async (
  tenantName: string,
  orders: Order[],
  inventory: InventoryItem[]
): Promise<string> => {
  // Initialize AI client per call to ensure latest context/key.
  const ai = getAI();

  try {
    // Calculate basic stats to feed the AI
    const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold).map(i => i.name);

    const prompt = `
      You are a senior restaurant consultant. Analyze the following data for restaurant "${tenantName}".
      
      Data Summary:
      - Total Revenue: ${totalSales}
      - Completed Orders: ${completedOrders}
      - Low Stock Alerts: ${lowStockItems.join(', ') || 'None'}
      - Total Active Inventory Items: ${inventory.length}

      Please provide a concise, actionable executive summary (max 150 words) focusing on:
      1. Sales performance sentiment.
      2. Critical inventory actions needed.
      3. One strategic recommendation for the manager.
      
      Format with clear headings or bullet points.
    `;

    // Use gemini-3-flash-preview for summarization and proofreading tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insights. Please check your connection or API limit.";
  }
};

export const generateMenuDescription = async (itemName: string, category: string): Promise<string> => {
   const ai = getAI();

   try {
     const prompt = `Write a short, mouth-watering menu description (max 20 words) for a "${itemName}" in the "${category}" category. Make it sound premium.`;
     // Use gemini-3-flash-preview for creative text generation.
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
     });
     return response.text?.trim() || "Freshly prepared with local ingredients.";
   } catch (error) {
     return "Freshly prepared with local ingredients.";
   }
}
