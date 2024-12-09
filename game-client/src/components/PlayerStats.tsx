import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/types/game";
import AbilityScores from "./AbilityScores";
import Knowledge from "./Knowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PlayerStatsProps {
  player?: Player;
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  const level = player.level || 1;
  const experience = player.experience || 0;
  const health = player.currentDerivedStats?.hitPoints || 0;
  const maxHealth = player.baseDerivedStats?.hitPoints || 100;

  const experienceToNextLevel = Math.pow(level, 2) * 100;
  const experiencePercentage = (experience / experienceToNextLevel) * 100;
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <Tabs defaultValue="combat" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="combat">Combat</TabsTrigger>
        <TabsTrigger value="abilities">Abilities</TabsTrigger>
        <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
      </TabsList>

      <TabsContent value="combat" className="space-y-4 mt-4">
        {/* Basic Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Level {level}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Health Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>HP</span>
                  <span>
                    {health}/{maxHealth}
                  </span>
                </div>
                <Progress value={healthPercentage} className="h-3" />
              </div>

              {/* Experience Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>XP</span>
                  <span>
                    {experience}/{experienceToNextLevel}
                  </span>
                </div>
                <Progress value={experiencePercentage} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combat Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Combat Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Armor Class</div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold">
                    {player.currentDerivedStats.armorClass}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Base: {player.baseDerivedStats.armorClass}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Initiative</div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold">
                    {player.currentDerivedStats.initiative}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Base: {player.baseDerivedStats.initiative}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Carry Capacity</div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold">
                    {player.currentDerivedStats.carryCapacity} lbs
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Base: {player.baseDerivedStats.carryCapacity} lbs
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Effects */}
        {player.statusEffects && player.statusEffects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Effects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {player.statusEffects.map((effect, index) => (
                  <Badge
                    key={index}
                    variant={effect.magnitude > 0 ? "default" : "destructive"}
                    className="text-sm py-1.5 px-4"
                  >
                    {effect.name} ({effect.duration} turns)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="abilities" className="mt-4">
        <AbilityScores player={player} />
      </TabsContent>

      <TabsContent value="knowledge" className="mt-4">
        <Knowledge knowledge={player.knowledge} />
      </TabsContent>
    </Tabs>
  );
}
