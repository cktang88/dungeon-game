import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GameResponse, StartGameResponse } from "@/types/client";
import { GameState } from "@/types/game";
import RoomView from "./RoomView";
import Inventory from "./Inventory";
import PlayerStats from "./PlayerStats";
import ChatBox from "./ChatBox";
import { GameMap } from "./GameMap";
import { gameApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function GameLayout() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const hasStartedGame = useRef(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([
    "Welcome to the Dungeon! Type 'help' to see available commands.",
  ]);

  // Start game session
  const startGameMutation = useMutation<StartGameResponse, Error>({
    mutationFn: gameApi.startGame,
    onSuccess: (data) => {
      console.log("Game started successfully:", data);
      setSessionId(data.sessionId);
      queryClient.setQueryData(["gameState", data.sessionId], data.gameState);
      setMessageHistory((prev) => [...prev, ...data.gameState.messageHistory]);
    },
    onError: (error) => {
      console.error("Failed to start game:", error);
      setMessageHistory((prev) => [...prev, `Error: ${error.message}`]);
    },
  });

  // Get game state
  const { data: gameState, isLoading } = useQuery<GameState>({
    queryKey: ["gameState", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session ID");
      return gameApi.getGameState(sessionId);
    },
    enabled: !!sessionId && !isProcessingAction,
    refetchInterval: 10000,
    retry: false,
  });

  // Send action mutation
  const sendActionMutation = useMutation<
    GameResponse,
    Error,
    { sessionId: string; action: string }
  >({
    mutationFn: ({ sessionId, action }) =>
      gameApi.sendAction(sessionId, action),
    onMutate: () => {
      setIsProcessingAction(true);
    },
    onSuccess: (data) => {
      if (data.message) {
        setMessageHistory((prev) => [...prev, data.message!]);
      }
      if (data.gameState && sessionId) {
        queryClient.setQueryData(["gameState", sessionId], data.gameState);
        setTimeout(() => {
          setIsProcessingAction(false);
        }, 1000);
      }
    },
    onError: (error) => {
      setMessageHistory((prev) => [...prev, `Error: ${error.message}`]);
      setIsProcessingAction(false);
    },
  });

  useEffect(() => {
    // Start a new game immediately when component mounts
    if (!sessionId && !startGameMutation.isPending && !hasStartedGame.current) {
      console.log("Starting new game...");
      hasStartedGame.current = true;
      startGameMutation.mutate();
    }
  }, [sessionId]);

  const handleSendMessage = (message: string) => {
    if (!sessionId) return;
    setMessageHistory((prev) => [...prev, `> ${message}`]);
    sendActionMutation.mutate({ sessionId, action: message });
  };

  if (startGameMutation.isPending) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-lg">Starting new game...</p>
      </div>
    );
  }

  if (startGameMutation.isError) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-lg text-red-500">
          Failed to start game: {startGameMutation.error.message}
        </p>
        <button
          onClick={() => startGameMutation.mutate()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !gameState) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-lg">Loading game state...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-screen p-4 flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_400px] gap-4 flex-1">
        <div className="flex flex-col gap-4">
          <Tabs defaultValue="room" className="flex-1">
            <TabsList>
              <TabsTrigger value="room">Room</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
            <TabsContent value="room" className="h-[calc(100%-40px)]">
              <RoomView gameState={gameState} />
            </TabsContent>
            <TabsContent value="map" className="h-[calc(100%-40px)]">
              <GameMap
                rooms={Object.values(gameState?.rooms || {})}
                currentRoom={gameState?.player?.currentRoomName}
              />
            </TabsContent>
          </Tabs>
          <ChatBox
            messages={messageHistory}
            onSendMessage={handleSendMessage}
          />
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto">
          <PlayerStats player={gameState?.player} />
          <Inventory items={gameState?.player?.inventory || []} />
        </div>
      </div>
    </div>
  );
}
