import { Player } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AbilityScoresProps {
  player?: Player;
}

// Calculate ability score modifier (D&D style)
const getAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

// Format modifier for display (e.g., "+1" or "-1")
const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

// Format stat difference for display
const formatDifference = (current: number, base: number): string => {
  const diff = current - base;
  if (diff === 0) return "";
  return diff > 0 ? `(+${diff})` : `(${diff})`;
};

export default function AbilityScores({ player }: AbilityScoresProps) {
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
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(player.currentAbilityScores).map(
              ([stat, value]) => {
                const baseValue =
                  player.baseAbilityScores[
                    stat as keyof typeof player.baseAbilityScores
                  ];
                const diff = formatDifference(value, baseValue);
                return (
                  <div key={stat} className="p-2 bg-muted rounded-lg">
                    <div className="text-sm font-medium capitalize mb-1">
                      {stat}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{value}</span>
                        {diff && (
                          <span className="text-sm text-muted-foreground">
                            {diff}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5">
                          {formatModifier(getAbilityModifier(value))}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Base: {baseValue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
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
            <div className="p-2 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Armor Class</div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {player.currentDerivedStats.armorClass}
                  </span>
                  {formatDifference(
                    player.currentDerivedStats.armorClass,
                    player.baseDerivedStats.armorClass
                  ) && (
                    <span className="text-sm text-muted-foreground">
                      {formatDifference(
                        player.currentDerivedStats.armorClass,
                        player.baseDerivedStats.armorClass
                      )}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Base: {player.baseDerivedStats.armorClass}
                </span>
              </div>
            </div>

            <div className="p-2 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Initiative</div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {formatModifier(player.currentDerivedStats.initiative)}
                  </span>
                  {formatDifference(
                    player.currentDerivedStats.initiative,
                    player.baseDerivedStats.initiative
                  ) && (
                    <span className="text-sm text-muted-foreground">
                      {formatDifference(
                        player.currentDerivedStats.initiative,
                        player.baseDerivedStats.initiative
                      )}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Base: {formatModifier(player.baseDerivedStats.initiative)}
                </span>
              </div>
            </div>

            <div className="p-2 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Carry Capacity</div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {player.currentDerivedStats.carryCapacity} lbs
                  </span>
                  {formatDifference(
                    player.currentDerivedStats.carryCapacity,
                    player.baseDerivedStats.carryCapacity
                  ) && (
                    <span className="text-sm text-muted-foreground">
                      {formatDifference(
                        player.currentDerivedStats.carryCapacity,
                        player.baseDerivedStats.carryCapacity
                      )}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Base: {player.baseDerivedStats.carryCapacity} lbs
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
