import { Player } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AbilityScores from "./AbilityScores";
import { Heart, Shield, Zap } from "lucide-react";

interface PlayerStatsProps {
  player?: Player;
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  if (!player) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading player stats...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate experience progress to next level
  const expForNextLevel = player.level * 100;
  const expProgress = (player.experience / expForNextLevel) * 100;

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Player Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Name</span>
            <span className="font-bold">{player.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Class</span>
            <Badge>{player.class}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Level</span>
            <Badge variant="outline">{player.level}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Experience</span>
              <span>{player.experience} / {expForNextLevel}</span>
            </div>
            <Progress value={expProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Derived Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Combat Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Hit Points</span>
            </div>
            <span className="font-bold">
              {player.currentDerivedStats.hitPoints} / {player.baseDerivedStats.hitPoints}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Armor Class</span>
            </div>
            <span className="font-bold">{player.currentDerivedStats.armorClass}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Initiative</span>
            </div>
            <span className="font-bold">+{player.currentDerivedStats.initiative}</span>
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
            <div className="space-y-2">
              {player.statusEffects.map((effect, index) => (
                <div key={index} className="p-2 bg-muted rounded-lg">
                  <div className="font-medium text-sm">{effect.name}</div>
                  <div className="text-xs text-muted-foreground">{effect.description}</div>
                  {effect.duration && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Duration: {effect.duration} turns
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ability Scores */}
      <AbilityScores player={player} />
    </div>
  );
}