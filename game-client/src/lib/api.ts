import { GameResponse, StartGameResponse } from "@/types/client";
import { GameState } from "@/types/game";

const BASE_URL = "http://localhost:3001";

export const gameApi = {
  startGame: async (): Promise<StartGameResponse> => {
    const response = await fetch(`${BASE_URL}/api/game/start`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to start game");
    }
    return response.json();
  },

  getGameState: async (sessionId: string): Promise<GameState> => {
    const response = await fetch(`${BASE_URL}/api/game/state/${sessionId}`);
    if (!response.ok) {
      throw new Error("Failed to get game state");
    }
    const data = await response.json();
    return data.gameState;
  },

  sendAction: async (
    sessionId: string,
    action: string
  ): Promise<GameResponse> => {
    const response = await fetch(`${BASE_URL}/api/game/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, action }),
    });
    if (!response.ok) {
      throw new Error("Failed to send action");
    }
    return response.json();
  },
};
