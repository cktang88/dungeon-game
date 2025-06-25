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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ability Scores</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {Object.entries(player.currentAbilityScores).map(
            ([stat, value]) => {
              const baseValue =
                player.baseAbilityScores[
                  stat as keyof typeof player.baseAbilityScores
                ];
              const diff = value - baseValue;
              const modifier = getAbilityModifier(value);

              return (
                <div key={stat} className="flex items-center justify-between">
                  <span className="font-medium capitalize text-muted-foreground">
                    {stat.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="font-mono">
                    {value}
                    <span className="text-muted-foreground ml-1">
                      ({formatModifier(modifier)})
                    </span>
                    {diff !== 0 && (
                      <span className={`ml-1 text-xs ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </CardContent>
    </Card>
  );
}
