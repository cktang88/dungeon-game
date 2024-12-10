import { Item } from "@/types/game";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ItemPopoverProps {
  item: Item;
}

export function ItemPopover({ item }: ItemPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          {item.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium">{item.name}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
