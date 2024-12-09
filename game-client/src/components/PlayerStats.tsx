import { Player } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PlayerStatsProps {
  player?: Player;
}

// Calculate ability score modifier (D&D style)
const getAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

// Format modifier for display (e.g., "+1" or "-1")
const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

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
  const health = player.health || 0;
  const maxHealth = player.derivedStats?.maxHealth || 100;

  const experienceToNextLevel = Math.pow(level, 2) * 100;
  const experiencePercentage = (experience / experienceToNextLevel) * 100;
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="space-y-4">
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
              <Progress value={healthPercentage} className="h-2" />
            </div>

            {/* Experience Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>XP</span>
                <span>
                  {experience}/{experienceToNextLevel}
                </span>
              </div>
              <Progress value={experiencePercentage} className="h-2" />
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
                  className="text-sm py-1 px-3"
                >
                  {effect.name} ({effect.duration} turns)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ability Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(player.abilityScores).map(([stat, value]) => (
              <div key={stat} className="text-center p-2 bg-muted rounded-lg">
                <div className="text-sm font-medium capitalize">{stat}</div>
                <div className="flex items-center justify-center gap-1">
                  <span>{value}</span>
                  <Badge variant="outline" className="h-5">
                    {formatModifier(getAbilityModifier(value))}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Combat Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Combat Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Armor Class</span>
              <span className="font-medium">
                {player.derivedStats.armorClass}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Initiative</span>
              <span className="font-medium">
                {formatModifier(player.derivedStats.initiative)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Carry Capacity</span>
              <span className="font-medium">
                {player.derivedStats.carryCapacity} lbs
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
