import { Player } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlayerStatsProps {
  player: Player;
}

// Calculate ability score modifier (D&D style)
const getAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

// Format modifier for display (e.g., "+1" or "-1")
const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export default function PlayerStats({ player }: PlayerStatsProps) {
  const experienceToNextLevel = Math.pow(player.level, 2) * 100;
  const experiencePercentage =
    (player.experience / experienceToNextLevel) * 100;
  const healthPercentage =
    (player.health / player.derivedStats.maxHealth) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Level {player.level}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Health</span>
              <span className="text-sm">
                {player.health}/{player.derivedStats.maxHealth}
              </span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Experience</span>
              <span className="text-sm">
                {player.experience}/{experienceToNextLevel}
              </span>
            </div>
            <Progress value={experiencePercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Ability Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ability Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Strength (STR)</span>
              <span className="font-medium">
                {player.abilityScores.strength} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.strength)
                )}
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Dexterity (DEX)</span>
              <span className="font-medium">
                {player.abilityScores.dexterity} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.dexterity)
                )}
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Constitution (CON)</span>
              <span className="font-medium">
                {player.abilityScores.constitution} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.constitution)
                )}
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Intelligence (INT)</span>
              <span className="font-medium">
                {player.abilityScores.intelligence} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.intelligence)
                )}
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Wisdom (WIS)</span>
              <span className="font-medium">
                {player.abilityScores.wisdom} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.wisdom)
                )}
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Charisma (CHA)</span>
              <span className="font-medium">
                {player.abilityScores.charisma} (
                {formatModifier(
                  getAbilityModifier(player.abilityScores.charisma)
                )}
                )
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Derived Stats */}
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
