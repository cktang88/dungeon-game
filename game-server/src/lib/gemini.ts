import { GoogleGenAI, Type } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export async function generateContent(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  if (!response.text) {
    throw new Error("No text response received from Gemini");
  }
  
  return response.text;
}

export async function generateStructuredContent<T>(
  prompt: string,
  schema: any
): Promise<T> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  if (!response.text) {
    throw new Error("No text response received from Gemini");
  }
  
  return JSON.parse(response.text) as T;
}
