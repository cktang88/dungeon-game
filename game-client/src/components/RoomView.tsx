import { GameState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoomViewProps {
  gameState?: GameState;
}

export default function RoomView({ gameState }: RoomViewProps) {
  if (!gameState?.player?.currentRoomId || !gameState?.rooms) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  const currentRoom = gameState.rooms[gameState.player.currentRoomId];

  if (!currentRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{currentRoom.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">{currentRoom.description}</p>

        {/* Items in the room */}
        {currentRoom.items.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Items:</h3>
            <div className="flex flex-wrap gap-2">
              {currentRoom.items.map((item) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="text-base py-1.5 px-4"
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Enemies in the room */}
        {currentRoom.enemies.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Enemies:</h3>
            <div className="space-y-2">
              {currentRoom.enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{enemy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      HP: {enemy.health}/{enemy.maxHealth}
                    </p>
                    {enemy.statusEffects && enemy.statusEffects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {enemy.statusEffects.map((effect, index) => (
                          <Badge
                            key={index}
                            variant={
                              effect.magnitude > 0 ? "secondary" : "destructive"
                            }
                            className="text-xs"
                          >
                            {effect.name} ({effect.duration})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {enemy.isBoss && (
                      <Badge
                        variant="destructive"
                        className="text-base py-1 px-3"
                      >
                        Boss
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-sm">
                      Lvl {enemy.level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available exits */}
        <div>
          <h3 className="font-semibold mb-2">Exits:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentRoom.doors).map(([direction, door]) => {
              if (!door) return null;
              return (
                <Badge
                  key={direction}
                  variant={door.isLocked ? "destructive" : "outline"}
                  className="text-base py-1.5 px-4 capitalize"
                >
                  {direction} {door.isLocked && "🔒"}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
