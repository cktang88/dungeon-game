import axios from "axios";
import { GameState, GameResponse, StartGameResponse } from "../types/game";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const gameApi = {
  startGame: async (): Promise<StartGameResponse> => {
    const response = await api.post<StartGameResponse>("/game/start");
    return response.data;
  },

  getGameState: async (sessionId: string): Promise<GameState> => {
    const response = await api.get<GameState>(`/game/state/${sessionId}`);
    return response.data;
  },

  sendAction: async (
    sessionId: string,
    action: string
  ): Promise<GameResponse> => {
    const response = await api.post<GameResponse>(`/game/action/${sessionId}`, {
      action,
    });
    return response.data;
  },
};
