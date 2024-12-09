import { GameState } from "./game";

export interface GameResponse {
  gameState: GameState;
  message?: string;
  error?: string;
}

export interface StartGameResponse {
  sessionId: string;
  gameState: GameState;
}
