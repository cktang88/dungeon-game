import { GameState, Room, AbilityScores, DerivedStats } from "../types/game";
import { OpenAI } from "openai";

// Calculate ability score modifier (D&D style)
const getAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

// Calculate derived stats from ability scores
const calculateDerivedStats = (
  abilityScores: AbilityScores,
  level: number
): DerivedStats => {
  const constitutionModifier = getAbilityModifier(abilityScores.constitution);
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);

  return {
    maxHealth: (10 + constitutionModifier) * level, // Base HP + CON modifier per level
    armorClass: 10 + dexterityModifier, // Base AC + DEX modifier
    initiative: dexterityModifier,
    carryCapacity: abilityScores.strength * 15, // Each point of STR = 15 pounds
  };
};

const createStartingRoom = (): Room => ({
  id: "start",
  name: "Entrance Hall",
  description:
    "A dimly lit entrance hall with ancient stone walls. Torches flicker on the walls, casting dancing shadows.",
  items: [
    {
      id: "torch_1",
      name: "Rusty Torch",
      description: "A well-worn torch that could be used for light.",
      type: "quest",
    },
  ],
  enemies: [],
  doors: {
    north: {
      id: "door_1",
      description: "A heavy wooden door with iron bindings.",
      isLocked: true,
      requiredKeyId: "key_1",
      destinationRoomId: "room_1",
    },
  },
  visited: true,
  position: {
    x: 0,
    y: 0,
  },
});

export const initializeGameState = (): GameState => {
  const startingRoom = createStartingRoom();

  // Starting ability scores (slightly above average)
  const abilityScores: AbilityScores = {
    strength: 12, // +1 modifier
    dexterity: 12, // +1 modifier
    constitution: 12, // +1 modifier
    intelligence: 12, // +1 modifier
    wisdom: 12, // +1 modifier
    charisma: 12, // +1 modifier
  };

  const derivedStats = calculateDerivedStats(abilityScores, 1);

  return {
    player: {
      health: derivedStats.maxHealth,
      level: 1,
      experience: 0,
      inventory: [],
      currentRoomId: "start",
      abilityScores,
      derivedStats,
      stats: {},
      statusEffects: [],
      knowledge: [],
    },
    currentFloor: 1,
    rooms: {
      start: startingRoom,
    },
    messageHistory: [
      "Welcome to the AI Dungeon! You find yourself in a mysterious entrance hall.",
      'Type "look" to examine your surroundings, or "help" for available commands.',
    ],
  };
};

export const generateRoom = async (
  floor: number,
  theme: string,
  position: { x: number; y: number },
  openai: OpenAI
): Promise<Room> => {
  const prompt = `You are the game master for a text-based dungeon crawler RPG. Generate a detailed dungeon room.This room is on floor ${floor} with theme: ${theme}.

Include in your response:
1. A unique initial impression of the room and what the player sees/smells/hears/feels/senses when they enter.
2. A detailed atmospheric description desribing room and its contents.
3. Any items present (0-4 items, although they might be in chests or other containers that fit the theme)
4. Any enemies present (0-4 enemies, usually the weaker the enemies, the more there are)
5. Any puzzles, mysterious signs, or interactive elements. Make these interesting and relevant to the theme. Take into account the puzzles, mysterious signs, or interactive elements of previous rooms.
6. Available exits (0-4 doors/passages/tunnels in any direction)

Respond in this JSON format:
{
  "name": "string",
  "description": "string",
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "weapon" | "armor" | "key" | "consumable" | "quest"
    }
  ],
  "enemies": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "health": number,
      "maxHealth": number,
      "level": number,
      "damage": number,
      "defense": number,
      "isAlive": true,
      "isBoss": boolean
    }
  ],
  "doors": {
    "north": {
      "id": "string",
      "description": "string",
      "isLocked": boolean,
      "requiredKeyId": "string (optional)",
      "destinationRoomId": "string"
    },
    "south": {...},
    "east": {...},
    "west": {...}
  }
}

Make it atmospheric and interesting, with potential for player interaction.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from LLM");

    const roomData = JSON.parse(content);

    // Generate unique IDs for the room and its contents
    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;

    // Process items
    const items = (roomData.items || []).map((item: any) => ({
      ...item,
      id: `${item.type}_${Math.random().toString(36).substring(2, 9)}`,
    }));

    // Process enemies
    const enemies = (roomData.enemies || []).map((enemy: any) => ({
      ...enemy,
      id: `enemy_${Math.random().toString(36).substring(2, 9)}`,
    }));

    // Process doors
    const doors: Record<string, any> = {};
    for (const [direction, door] of Object.entries(roomData.doors || {})) {
      if (door) {
        doors[direction] = {
          ...door,
          id: `door_${Math.random().toString(36).substring(2, 9)}`,
          destinationRoomId: `room_${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        };
      }
    }

    return {
      id: roomId,
      name: roomData.name,
      description: roomData.description,
      items,
      enemies,
      doors,
      visited: true,
      position,
    };
  } catch (error) {
    console.error("Error generating room:", error);
    // Fallback to a basic room if generation fails
    return {
      id: `room_${Math.random().toString(36).substr(2, 9)}`,
      name: "Mysterious Chamber",
      description: "A plain stone chamber with ancient markings on the walls.",
      items: [],
      enemies: [],
      doors: {},
      visited: true,
      position,
    };
  }
};
