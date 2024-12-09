import { Item } from "@/types/game";
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
  items: Item[];
}

export default function Inventory({ items }: InventoryProps) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Your inventory is empty
          </p>
        </CardContent>
      </Card>
    );
  }

  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>Items you are carrying</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {Object.entries(itemsByType).map(([type, items]) => (
            <div key={type} className="mb-6 last:mb-0">
              <h3 className="font-semibold mb-3 capitalize">{type}s</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="capitalize">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    {item.stats && (
                      <div className="flex flex-wrap gap-2">
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
                    {item.isUsable && (
                      <Badge variant="outline" className="text-xs">
                        Usable
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
