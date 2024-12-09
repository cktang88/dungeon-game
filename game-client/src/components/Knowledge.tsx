import { Knowledge as KnowledgeType } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Knowledge({
  knowledge,
}: {
  knowledge: KnowledgeType[];
}) {
  if (!knowledge || knowledge.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No knowledge gained yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group knowledge by type
  const groupedKnowledge = knowledge.reduce((acc, item) => {
    const type = item.type || "general";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as Record<string, KnowledgeType[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedKnowledge).map(([type, items]) => (
              <div key={type} className="space-y-3">
                <h3 className="text-lg font-semibold capitalize">{type}</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-base leading-relaxed flex-1">
                          {item.description}
                        </p>
                        <div className="flex flex-col gap-2">
                          {item.isFact && (
                            <Badge
                              variant="default"
                              className="whitespace-nowrap"
                            >
                              Fact
                            </Badge>
                          )}
                          {item.isRumor && (
                            <Badge
                              variant="secondary"
                              className="whitespace-nowrap"
                            >
                              Rumor
                            </Badge>
                          )}
                          {item.isLore && (
                            <Badge
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              Lore
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {item.target && (
                          <p>
                            Source:{" "}
                            <span className="font-medium">{item.target}</span>
                          </p>
                        )}
                        {item.timestamp && (
                          <p>
                            Learned:{" "}
                            <span className="font-medium">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
