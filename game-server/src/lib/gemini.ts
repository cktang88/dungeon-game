import { GoogleGenerativeAI } from "@google/generative-ai";
// load with dotenv
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const geminiApiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(geminiApiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const prompt =
  "Write a screenplay for a movie about a robot that can travel through time";

async function main() {
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

main();
