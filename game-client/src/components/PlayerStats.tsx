import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from "@/types/game";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Level {level} {player.class}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Ability Scores */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(player.currentAbilityScores).map(([stat, value]) => (
            <div key={stat} className="text-center p-2 bg-muted rounded-lg">
              <div className="text-xs font-medium uppercase">{stat}</div>
              <div className="text-lg">{value}</div>
            </div>
          ))}
        </div>

        {/* Status Effects */}
        {player.statusEffects && player.statusEffects.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Status Effects</h3>
            <div className="flex flex-wrap gap-1">
              {player.statusEffects.map((effect, index) => (
                <Badge key={index} variant="secondary">
                  {effect.name}
                  {effect.duration && ` (${effect.duration} turns)`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
