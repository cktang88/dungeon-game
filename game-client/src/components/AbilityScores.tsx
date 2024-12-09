import { Player } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
          <CardTitle>Ability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                const modifier = getAbilityModifier(value);
                const baseModifier = getAbilityModifier(baseValue);
                const modifierDiff = modifier - baseModifier;

                return (
                  <div key={stat} className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <div className="text-lg font-medium capitalize">
                          {stat}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Base: {baseValue} ({formatModifier(baseModifier)})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {value}
                          <span className="text-lg ml-2">
                            ({formatModifier(modifier)})
                          </span>
                        </div>
                        {diff && (
                          <div className="text-sm text-muted-foreground">
                            {diff}
                            {modifierDiff !== 0 &&
                              ` (${formatModifier(modifierDiff)} modifier)`}
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress value={(value / 20) * 100} className="h-2" />
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
