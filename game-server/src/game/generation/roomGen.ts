import { GameState } from "../../types/game";
import { generateItemPrompt } from "./itemGen";
import { generateMonsterPrompt } from "./monsterGen";

export default function generateRoomPrompt(
  theme: string,
  gameState: GameState
) {
  const itemType = Math.random() < 0.3 ? "good" : "weird";

  return `You are a professional game master for a text-based dungeon crawler RPG. Your role is to generate a detailed dungeon room. The environment is themed: ${theme}.

Generate a room that feels like a natural progression from the previous rooms, and fits the current theme.
Monsters and items should be appropriate for the player's current level and past experiences.
However, at the same time, the room should feel unique, challenging, and MEMORABLE.

Current game state: ${JSON.stringify(gameState)}.

Focus on emergent, unpredictable, and memorable experiences.
NOTE: events may already be happening in the room, so be sure to describe them. The player may be interrupting something.
NOTE: entities in the room may be interacting with each other or the environment (not just the player), so be sure to describe them.
NOTE: often, the player may sneak into the room and not be noticed by entities in the room.


Include in your response:
1. A unique initial impression of the room and what the player sees/smells/hears/feels/senses when they enter.
2. A detailed atmospheric description desribing room and its contents.
3. Any items present (0-4 items, although they might be in chests or other containers that fit the theme)
4. Any enemies present (0-4 enemies, usually the weaker the enemies, the more there are)
5. Any puzzles, mysterious signs, or interactive elements. Make these interesting and relevant to the theme. Take into account the puzzles, mysterious signs, or interactive elements of previous rooms.
6. Available exits (0-4 doors/passages/tunnels in any direction)

Respond in this JSON format:
{
  "name": "string", // this should be very descriptive, but is used as a unique ID so try to make it a unique descriptive phrase
  "description": "string",
  "hiddenDetailedStats": "string - long, comma separated list of the dnd 5e stats and ability scores of the room",
  "hiddenDetailedStatuses": "string - long, specific detailed description of the statuses of the room",
  "hiddenDetailedAttributes": "string - long, specific detailed description of the attributes of the room",
  "items": [
    {
      // each of these is an Item object, Item format is below
    }
  ],
  "enemies": [
    {
      // each of these is an Enemy object, Enemy format is below
    }
  ],
  "connections": {
    "north": {
      "name": "string",
      "description": "string",
      "destinationRoomName": "string"
    },
    "south": {...},
    "east": {...},
    "west": {...}
  }
}

Item format:
${generateItemPrompt(theme, itemType, gameState.player)}

Enemy format:
${generateMonsterPrompt(theme, gameState.player)}

Make this room atmospheric and interesting, with potential for player interaction.`;
}
