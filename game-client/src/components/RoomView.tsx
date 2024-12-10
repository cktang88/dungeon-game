import { GameState, Enemy, Item } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ItemPopover } from "./ItemPopover";

interface RoomViewProps {
  gameState?: GameState;
}

function EnemyPopover({ enemy }: { enemy: Enemy }) {
  return (
    <HoverCardContent className="w-80">
      <div className="space-y-2">
        <div>
          <h4 className="font-medium">{enemy.name}</h4>
        </div>
        <p className="text-sm text-muted-foreground">{enemy.description}</p>
        <p className="text-sm text-muted-foreground">{enemy.appearance}</p>
        {enemy.attacks.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Attacks:</div>
            <div className="flex flex-wrap gap-1">
              {enemy.attacks.map((attack, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {attack}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </HoverCardContent>
  );
}

export default function RoomView({ gameState }: RoomViewProps) {
  if (!gameState?.player?.currentRoomName) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  const currentRoom = gameState.rooms.find(
    (room) => room.name === gameState.player.currentRoomName
  );

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
              {currentRoom.items.map((item, index) => (
                <HoverCard key={index} openDelay={200} closeDelay={200}>
                  <HoverCardTrigger>
                    <Badge
                      variant="outline"
                      className="text-base py-1.5 px-4 cursor-pointer hover:bg-accent"
                    >
                      {item.name}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <ItemPopover item={item} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>
        )}

        {/* Enemies in the room */}
        {currentRoom.enemies.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Enemies:</h3>
            <div className="space-y-2">
              {currentRoom.enemies.map((enemy, index) => (
                <HoverCard key={index} openDelay={200} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent">
                      <div className="space-y-1">
                        <p className="font-medium">{enemy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {enemy.appearance}
                        </p>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <EnemyPopover enemy={enemy} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>
        )}

        {/* Available exits */}
        <div>
          <h3 className="font-semibold mb-2">Exits:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentRoom.connections).map(
              ([direction, door]) => {
                if (!door) return null;
                return (
                  <Badge
                    key={direction}
                    variant="outline"
                    className="text-base py-1.5 px-4 capitalize"
                  >
                    {direction} → {door.name}
                  </Badge>
                );
              }
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
