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

When generating a dungeon room's details, focus on what distinguishes the room from other similar rooms, even if it's slight. 
Incorporate small features, environmental effects, interactive elements, properties, sounds, smells, or unique lore elements that make the room stand out from other rooms of its type. 
Emphasize any unique environmental features, traps, hidden mechanisms, or thematic elements that are specific to this particular room.
Describe any furniture, decorations, water, fire, fog, or artifacts on the ceiling, walls, floor, or other surfaces.
IT IS VERY IMPORTANT to include small details that differentiate this room from others of its type. 
For common rooms, these differences might be purely visual, environmental effects, or minor interactive elements, without delving into high-level magical or legendary attributes.


Each room may have up to 4 doors/passages/tunnels that lead to other rooms (north, south, east, west). They might also have no exits other than the original room the player came from.

Respond in this JSON format:
{
  "name": "string", // this should be very descriptive, but is used as a unique ID so try to make it a unique descriptive phrase
  "description": "string",
  "hiddenDetailedStats": "string - long, specific detailed statistics that encompass unique environmental features, minor advantages or disadvantages, special room traits, or subtle variations in standard room metrics that set this room apart from others. This may include specific dimensions, lighting conditions, temperature variations, or structural peculiarities that influence the room's interaction with adventurers.",
  "hiddenDetailedStatuses": "string - long, specific detailed description of specific conditions, environmental effects, or status phenomena present within the room. This highlights unique interactions, tendencies, or ongoing effects that affect creatures or objects inside the room. Examples include ambient sounds, lingering smells, persistent fog, fluctuating temperatures, or recurring visual effects that create a distinct atmosphere.",
  "hiddenDetailedAttributes": "string - long, specific detailed description of additional attributes that cover the room's rarity, preferred dungeon levels, lore snippets, unique charms or curses (if a high rarity room), and any other distinguishing features. This may include historical significance,architectural styles, presence of artifacts or decorations, and any thematic elements that contribute to the room's uniqueness within the dungeon.",
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
${generateItemPrompt(theme, itemType)}

Enemy format:
${generateMonsterPrompt(theme)}

Make this room atmospheric and interesting, with potential for player interaction.`;
}
