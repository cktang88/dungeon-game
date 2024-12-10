import { Item } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemPopover } from "./ItemPopover";
import { Badge } from "./ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InventoryProps {
  items: Item[];
}

export default function Inventory({ items }: InventoryProps) {
  // Group items by type
  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {Object.entries(itemsByType).map(([type, items]) => (
            <div key={type} className="mb-4 last:mb-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {type}s
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <HoverCard key={item.id}>
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
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
