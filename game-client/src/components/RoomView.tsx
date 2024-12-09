import { GameState, Enemy, Item } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoomViewProps {
  gameState?: GameState;
}

// Format modifier for display (e.g., "+1" or "-1")
const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

function ItemPopover({ item }: { item: Item }) {
  return (
    <PopoverContent className="w-80">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{item.name}</h4>
          <Badge variant="outline" className="capitalize">
            {item.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>

        {/* Stats */}
        {item.stats && (
          <div className="space-y-1">
            {item.stats.damage && (
              <div className="flex justify-between text-sm">
                <span>Damage</span>
                <Badge variant="destructive">+{item.stats.damage}</Badge>
              </div>
            )}
            {item.stats.defense && (
              <div className="flex justify-between text-sm">
                <span>Defense</span>
                <Badge variant="secondary">+{item.stats.defense}</Badge>
              </div>
            )}
            {item.stats.healing && (
              <div className="flex justify-between text-sm">
                <span>Healing</span>
                <Badge variant="default">+{item.stats.healing}</Badge>
              </div>
            )}
          </div>
        )}

        {/* Properties */}
        {item.properties && item.properties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.properties.map((prop, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {prop}
              </Badge>
            ))}
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {item.weight && <div>Weight: {item.weight}</div>}
          {item.value && <div>Value: {item.value} gold</div>}
          {item.rarity && <div>Rarity: {item.rarity}</div>}
        </div>

        {/* Status Effects */}
        {item.statusEffects && item.statusEffects.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Status Effects:</div>
            <div className="flex flex-wrap gap-1">
              {item.statusEffects.map((effect, i) => (
                <Badge
                  key={i}
                  variant={effect.magnitude > 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {effect.name} ({effect.duration})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </PopoverContent>
  );
}

function EnemyPopover({ enemy }: { enemy: Enemy }) {
  return (
    <PopoverContent className="w-80">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{enemy.name}</h4>
          <div className="flex gap-2">
            {enemy.isBoss && <Badge variant="destructive">Boss</Badge>}
            <Badge variant="outline">CR {enemy.cr}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{enemy.description}</p>

        {/* Stats */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>HP</span>
            <span>
              {enemy.currentStats.hitPoints}/{enemy.baseStats.hitPoints}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>AC</span>
            <span>{enemy.currentStats.armorClass}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Speed</span>
            <div className="flex gap-2 text-xs">
              {enemy.currentStats.speed.walk && (
                <span>Walk {enemy.currentStats.speed.walk}ft</span>
              )}
              {enemy.currentStats.speed.fly && (
                <span>Fly {enemy.currentStats.speed.fly}ft</span>
              )}
              {enemy.currentStats.speed.swim && (
                <span>Swim {enemy.currentStats.speed.swim}ft</span>
              )}
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(enemy.currentStats.abilityScores).map(
            ([stat, value]) => (
              <div key={stat} className="text-center p-1 bg-muted rounded">
                <div className="uppercase text-xs font-medium">
                  {stat.slice(0, 3)}
                </div>
                <div>
                  {value} ({formatModifier(Math.floor((value - 10) / 2))})
                </div>
              </div>
            )
          )}
        </div>

        {/* Status Effects */}
        {enemy.statusEffects && enemy.statusEffects.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Status Effects:</div>
            <div className="flex flex-wrap gap-1">
              {enemy.statusEffects.map((effect, i) => (
                <Badge
                  key={i}
                  variant={effect.magnitude > 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {effect.name} ({effect.duration})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resistances, Weaknesses, Immunities */}
        <ScrollArea className="h-24">
          <div className="space-y-2">
            {enemy.resistances.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Resistances:</div>
                <div className="flex flex-wrap gap-1">
                  {enemy.resistances.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {enemy.weaknesses.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Weaknesses:</div>
                <div className="flex flex-wrap gap-1">
                  {enemy.weaknesses.map((w, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {enemy.immunities.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Immunities:</div>
                <div className="flex flex-wrap gap-1">
                  {enemy.immunities.map((i, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </PopoverContent>
  );
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
                <Popover key={item.id}>
                  <PopoverTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-base py-1.5 px-4 cursor-pointer hover:bg-accent"
                    >
                      {item.name}
                    </Badge>
                  </PopoverTrigger>
                  <ItemPopover item={item} />
                </Popover>
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
                <Popover key={enemy.id}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent">
                      <div className="space-y-1">
                        <p className="font-medium">{enemy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          HP: {enemy.currentStats.hitPoints}/
                          {enemy.baseStats.hitPoints}
                        </p>
                        {enemy.statusEffects &&
                          enemy.statusEffects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {enemy.statusEffects.map((effect, index) => (
                                <Badge
                                  key={index}
                                  variant={
                                    effect.magnitude > 0
                                      ? "secondary"
                                      : "destructive"
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
                          CR {enemy.cr}
                        </Badge>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <EnemyPopover enemy={enemy} />
                </Popover>
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
