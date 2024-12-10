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
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <HoverCard key={index}>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
