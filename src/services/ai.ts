import { GoogleGenAI } from "@google/genai";

// Use the Vite environment variable for the API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is not defined. AI features will fail until configured.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * Translates text into the target language using Gemini AI.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!apiKey || !text || !targetLanguage) return text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Traducción ultra-rápida al ${targetLanguage.toUpperCase()}. Solo devuelve el texto traducido: "${text}"`,
    });
    return response.text.trim() || text;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return text;
  }
}

/**
 * Detects the language of a given text.
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!apiKey || !text) return "English";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Detect the language of the following text. Return ONLY the name of the language in English (e.g., "Spanish", "English", "French"): "${text}"`,
    });
    return response.text || "English";
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return "English";
  }
}
