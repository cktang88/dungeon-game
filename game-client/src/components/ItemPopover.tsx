import { Item } from "@/types/game";
import { Badge } from "@/components/ui/badge";
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
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{item.name}</h4>
            <Badge variant="outline" className="capitalize">
              {item.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {/* Stats */}
          {item.stats && Object.keys(item.stats).length > 0 && (
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
            <div className="pt-2">
              <h5 className="text-sm font-medium mb-2">Properties</h5>
              <div className="flex flex-wrap gap-1">
                {item.properties.map((prop, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {prop}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              Type: <span className="capitalize">{item.type}</span>
            </div>
            {item.weight && <div>Weight: {item.weight} lbs</div>}
            {item.value && <div>Value: {item.value} gold</div>}
            {item.isQuestItem && <div>Quest Item</div>}
            {item.isMagic && <div>Magical</div>}
          </div>

          {/* Status Effects */}
          {item.statusEffects && item.statusEffects.length > 0 && (
            <div className="pt-2">
              <h5 className="text-sm font-medium mb-2">Status Effects</h5>
              <div className="flex flex-wrap gap-1">
                {item.statusEffects.map((effect, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {effect.name} ({effect.duration} turns)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
