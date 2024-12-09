import { GameState, GameResponse, StartGameResponse } from "@/types/game";

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
    return response.json();
  },

  sendAction: async (
    sessionId: string,
    action: string
  ): Promise<GameResponse> => {
    const response = await fetch(`${BASE_URL}/api/game/action/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      throw new Error("Failed to send action");
    }
    return response.json();
  },
};
