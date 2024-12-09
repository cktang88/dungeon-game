import { GameState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoomViewProps {
  gameState: GameState;
}

export default function RoomView({ gameState }: RoomViewProps) {
  const currentRoom = gameState.rooms[gameState.player.currentRoomId];

  if (!currentRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{currentRoom.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{currentRoom.description}</p>
        </CardContent>
      </Card>

      {/* Items */}
      {currentRoom.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentRoom.items.map((item) => (
                <Badge key={item.id} variant="secondary">
                  {item.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enemies */}
      {currentRoom.enemies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enemies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentRoom.enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">{enemy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {enemy.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      HP: {enemy.health}/{enemy.maxHealth}
                    </p>
                    <p className="text-sm">Level {enemy.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(currentRoom.doors).map(([direction, door]) => (
              <div
                key={door.id}
                className="p-2 border rounded flex items-center justify-between"
              >
                <span className="capitalize">{direction}</span>
                {door.isLocked && <Badge variant="destructive">Locked</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
