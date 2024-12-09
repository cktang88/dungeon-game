import { Player } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InventoryProps {
  player: Player;
}

export default function Inventory({ player }: InventoryProps) {
  const itemsByType = player.inventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, typeof player.inventory>);

  if (player.inventory.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Your inventory is empty
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-1">
        {Object.entries(itemsByType).map(([type, items]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{type}s</CardTitle>
              <CardDescription>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.stats && (
                      <div className="flex flex-wrap gap-1">
                        {item.stats.damage && (
                          <Badge variant="destructive">
                            +{item.stats.damage} DMG
                          </Badge>
                        )}
                        {item.stats.defense && (
                          <Badge variant="secondary">
                            +{item.stats.defense} DEF
                          </Badge>
                        )}
                        {item.stats.healing && (
                          <Badge variant="default">
                            +{item.stats.healing} HP
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
