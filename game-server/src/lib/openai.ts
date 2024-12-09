import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY environment variable is not set. Please create a .env file in the game-server directory with your OpenAI API key."
  );
}

if (apiKey === "your_api_key_here") {
  throw new Error(
    "Please replace 'your_api_key_here' in the .env file with your actual OpenAI API key."
  );
}

export const openai = new OpenAI({
  apiKey,
});
