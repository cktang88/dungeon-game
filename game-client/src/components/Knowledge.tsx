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
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedKnowledge).map(([type, items]) => (
              <div key={type} className="space-y-2">
                <h3 className="font-semibold capitalize">{type}</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{item.description}</p>
                        <div className="flex gap-2">
                          {item.isFact && <Badge variant="default">Fact</Badge>}
                          {item.isRumor && (
                            <Badge variant="secondary">Rumor</Badge>
                          )}
                          {item.isLore && <Badge variant="outline">Lore</Badge>}
                        </div>
                      </div>
                      {item.target && (
                        <p className="text-xs text-muted-foreground">
                          Source: {item.target}
                        </p>
                      )}
                      {item.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          Learned: {new Date(item.timestamp).toLocaleString()}
                        </p>
                      )}
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
