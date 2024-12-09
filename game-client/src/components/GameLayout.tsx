import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GameState } from "@/types/game";
import RoomView from "./RoomView";
import Inventory from "./Inventory";
import PlayerStats from "./PlayerStats";
import ChatBox from "./ChatBox";
import { gameApi } from "@/lib/api";

export default function GameLayout() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<string[]>([
    "Welcome to the Dungeon! Type 'help' to see available commands.",
  ]);

  // Start game session
  const startGameMutation = useMutation({
    mutationFn: gameApi.startGame,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      queryClient.setQueryData(["gameState", data.sessionId], data.gameState);
    },
  });

  // Get game state
  const { data: gameState } = useQuery({
    queryKey: ["gameState", sessionId],
    queryFn: () => gameApi.getGameState(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Send action mutation
  const sendActionMutation = useMutation({
    mutationFn: ({
      sessionId,
      action,
    }: {
      sessionId: string;
      action: string;
    }) => gameApi.sendAction(sessionId, action),
    onSuccess: (data) => {
      if (data.message) {
        setMessageHistory((prev) => [...prev, data.message!]);
      }
      if (data.gameState && sessionId) {
        queryClient.setQueryData(["gameState", sessionId], data.gameState);
      }
    },
    onError: (error: Error) => {
      setMessageHistory((prev) => [...prev, `Error: ${error.message}`]);
    },
  });

  useEffect(() => {
    startGameMutation.mutate();
  }, []);

  const handleSendMessage = (message: string) => {
    if (!sessionId) return;

    setMessageHistory((prev) => [...prev, `> ${message}`]);
    sendActionMutation.mutate({ sessionId, action: message });
  };

  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col gap-4">
      <h1 className="text-4xl font-bold text-center mb-4">
        AI Dungeon Crawler
      </h1>

      <div className="grid grid-cols-3 gap-4 flex-grow">
        <div className="col-span-2">
          <Tabs defaultValue="room" className="h-full">
            <TabsList>
              <TabsTrigger value="room">Room</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
            <TabsContent value="room" className="h-[calc(100%-40px)]">
              <RoomView gameState={gameState} />
            </TabsContent>
            <TabsContent value="map">
              {/* Map view will be implemented later */}
              <div className="text-center p-4">Map coming soon...</div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="inventory">
            <TabsList className="w-full">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="inventory">
              <Inventory player={gameState.player} />
            </TabsContent>
            <TabsContent value="stats">
              <PlayerStats player={gameState.player} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="h-1/3">
        <ChatBox messages={messageHistory} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
