import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { processAction } from "./game/actions";
import { initializeGameState } from "./game/state";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Game state for each player session
const gameStates = new Map<string, any>();

// Initialize game state for a new player
app.post("/api/game/start", (req, res) => {
  const sessionId = Math.random().toString(36).substring(7);
  const gameState = initializeGameState();
  gameStates.set(sessionId, gameState);
  res.json({ sessionId, gameState });
});

// Get current game state
app.get("/api/game/state/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const gameState = gameStates.get(sessionId);

  if (!gameState) {
    return res.status(404).json({ error: "Game session not found" });
  }

  res.json(gameState);
});

// Handle game action
app.post("/api/game/action/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { action } = req.body;

  const currentState = gameStates.get(sessionId);
  if (!currentState) {
    return res.status(404).json({ error: "Game session not found" });
  }

  try {
    const { newState, message } = await processAction(currentState, action);
    gameStates.set(sessionId, newState);
    res.json({ gameState: newState, message });
  } catch (error) {
    console.error("Error handling game action:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your action" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
