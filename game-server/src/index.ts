import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import { initializeGameState } from "./game/state";
import { processAction } from "./game/actions";
import { openai } from "./lib/openai";
import { GameState } from "./types/game";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Game state storage (in memory for now)
const gameStates: Record<string, GameState> = {};

// Validate game state
export function isValidGameState(state: any): boolean {
  return (
    state &&
    state.player &&
    typeof state.player.currentRoomName === "string" &&
    state.rooms &&
    typeof state.rooms === "object"
  );
}

app.post("/api/game/start", async (req, res) => {
  console.log("START GAME CALLED");
  const sessionId = `session_${Math.random().toString(36).substring(2, 9)}`;
  const initialState = await initializeGameState();

  if (!isValidGameState(initialState)) {
    console.error("Invalid initial game state generated");
    res.status(500).json({ error: "Failed to initialize game state" });
    return;
  }

  gameStates[sessionId] = initialState;
  console.log("New game started:", {
    sessionId,
    currentRoomId: initialState.player.currentRoomName,
    rooms: initialState.rooms,
  });
  res.json({ sessionId, gameState: initialState });
});

app.post("/api/game/action", async (req, res) => {
  const { sessionId, action } = req.body;

  if (!gameStates[sessionId]) {
    res.status(404).json({ error: "Game session not found" });
    return;
  }

  try {
    const { newState, message } = await processAction(
      gameStates[sessionId],
      action
    );
    console.log("sending", newState);

    if (!isValidGameState(newState)) {
      console.error("Invalid game state after action");
      res.status(500).json({ error: "Action resulted in invalid game state" });
      return;
    }

    gameStates[sessionId] = newState;
    res.json({ gameState: newState, message });
  } catch (error) {
    console.error("Error processing action:", error);
    res.status(500).json({ error: "Failed to process action" });
  }
});

app.get("/api/game/state/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  if (!gameStates[sessionId]) {
    console.log("Game session not found:", sessionId);
    res.status(404).json({ error: "Game session not found" });
    return;
  }

  const state = gameStates[sessionId];

  if (!isValidGameState(state)) {
    console.error("Invalid game state found for session:", sessionId);
    res.status(500).json({ error: "Invalid game state" });
    return;
  }

  console.log("Game state retrieved:", {
    sessionId,
    currentRoomId: state.player.currentRoomName,
    rooms: state.rooms,
  });
  res.json({ gameState: state });
});

app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
});
