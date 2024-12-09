import { io, Socket } from "socket.io-client";
import { GameState } from "@/types/game";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class GameSocket {
  private socket: Socket | null = null;
  private messageHandlers: ((message: string) => void)[] = [];
  private stateHandlers: ((state: GameState) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL);

    this.socket.on("connect", () => {
      console.log("Connected to game server");
    });

    this.socket.on("game:message", (message: string) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on("game:state", (state: GameState) => {
      this.stateHandlers.forEach((handler) => handler(state));
    });

    this.socket.on("game:error", (error: string) => {
      this.errorHandlers.forEach((handler) => handler(error));
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from game server");
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  sendAction(action: string) {
    if (!this.socket) return;
    this.socket.emit("game:action", action);
  }

  onMessage(handler: (message: string) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onStateUpdate(handler: (state: GameState) => void) {
    this.stateHandlers.push(handler);
    return () => {
      this.stateHandlers = this.stateHandlers.filter((h) => h !== handler);
    };
  }

  onError(handler: (error: string) => void) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }
}

export const gameSocket = new GameSocket();
