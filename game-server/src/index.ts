import express from "express";
import cors from "cors";
import { initializeGameState } from "./game/state";
import { processAction } from "./game/actions";
import { OpenAI } from "openai";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Game state storage (in memory for now)
const gameStates: Record<string, any> = {};

app.post("/api/game/start", (req, res) => {
  const sessionId = Math.random().toString(36).substring(7);
  gameStates[sessionId] = initializeGameState();
  res.json({ sessionId, gameState: gameStates[sessionId] });
});

app.post("/api/game/action", async (req, res) => {
  const { sessionId, action } = req.body;

  if (!gameStates[sessionId]) {
    res.status(404).json({ error: "Game session not found" });
    return;
  }

  try {
    const newState = await processAction(gameStates[sessionId], action, openai);
    gameStates[sessionId] = newState;
    res.json({ gameState: newState });
  } catch (error) {
    console.error("Error processing action:", error);
    res.status(500).json({ error: "Error processing action" });
  }
});

app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
});
