import {
  GameState,
  Room,
  AbilityScores,
  DerivedStats,
  Position,
} from "../types/game";
import { openai } from "../lib/openai";
import generateRoomPrompt from "./generation/roomGen";

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
    hitPoints: (10 + constitutionModifier) * level, // Base HP + CON modifier per level
    armorClass: 10 + dexterityModifier, // Base AC + DEX modifier
    initiative: dexterityModifier,
    carryCapacity: abilityScores.strength * 15, // Each point of STR = 15 pounds
  };
};

interface RoomPosition extends Position {
  floor: number;
}

const createStartingRoom = (): Room => ({
  id: "start",
  name: "Entrance Hall",
  description:
    "You wake up, finding yourself in a dimly lit entrance hall where cool air carries the scent of damp earth and aged stone. Ancient stone walls, cloaked in moss and faintly glowing runes, tower above them, while intermittently flickering torches cast dancing shadows that seem alive. The vaulted ceiling is supported by intricately carved stone pillars depicting forgotten deities and mythical creatures. Beneath their feet, a worn mosaic floor portrays a celestial map aligned with the night sky, with some tiles feeling cold and others slightly warm, hinting at hidden magical properties. Minimal torchlight creates pockets of brightness and deep, almost palpable shadows in the corners, lending an eerie ambiance. Faint echoes of dripping water and the soft scuttling of unseen creatures resonate from deeper within the dungeon, occasionally accompanied by a distant, hollow thud that makes it seem as if the dungeon itself is breathing.",
  items: [
    {
      id: "torch_1",
      name: "Rusty Torch",
      description:
        "A well-worn torch that could be used for light, the handle is worn and the wick is frayed.",
      type: "quest",
      isUsable: true,
      isConsumable: false,
      isQuestItem: true,
      stats: {},
      weight: "1 lb.",
      value: 5,
      properties: ["Provides light in dark areas"],
      rarity: "Common",
      isUnique: false,
      isMagic: false,
    },
    {
      id: "dagger_1",
      name: "Broken Pocket Knife",
      description:
        "A small, sharp pocket knife, its blade glints in the torchlight.",
      type: "weapon",
      isUsable: true,
      isConsumable: false,
      isQuestItem: false,
      stats: {
        damage: 1,
      },
      weight: "0.5 lb.",
      value: 10,
      properties: ["Lightweight and easily concealed"],
      rarity: "Common",
      isUnique: false,
      isMagic: false,
    },
    {
      id: "bandage_1",
      name: "Cloth Bandage",
      description: "A small tan cloth bandage, slightly wet in a puddle.",
      type: "consumable",
      isUsable: true,
      isConsumable: true,
      isQuestItem: false,
      stats: {
        healing: 1,
      },
      weight: "0.1 lb.",
      value: 2,
      properties: ["Restores a small amount of health when used"],
      rarity: "Common",
      isUnique: false,
      isMagic: false,
    },
  ],
  enemies: [],
  doors: {
    north: {
      id: "door_1",
      description: "A heavy wooden door with iron bindings.",
      isLocked: false,
      destinationRoomId: "room_1",
      isOpen: false,
    },
  },
  visited: true,
  position: {
    x: 0,
    y: 0,
    floor: 1,
  },
});

export const initializeGameState = (): GameState => {
  const startingRoom = createStartingRoom();
  const sessionId = `session_${Math.random().toString(36).substring(2, 9)}`;

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
      id: `player_${Math.random().toString(36).substring(2, 9)}`,
      name: "Adventurer",
      level: 1,
      experience: 0,
      inventory: [],
      currentRoomId: "start",
      previousRoomId: null, // Initialize with starting room
      position: { x: 0, y: 0, floor: 1 },
      baseAbilityScores: abilityScores,
      currentAbilityScores: abilityScores,
      baseDerivedStats: derivedStats,
      currentDerivedStats: derivedStats,
      equipment: {
        weapon: undefined,
        armor: undefined,
        offhand: undefined,
        accessory: undefined,
      },
      statusEffects: [],
      knowledge: [],
      sessionId, // Add session ID
    },
    currentFloor: 1,
    rooms: {
      start: startingRoom,
    },
    messageHistory: [
      "Welcome to the AI Dungeon! You find yourself in a mysterious entrance hall.",
      'Type "look" to examine your surroundings, or "help" for available commands.',
    ],
    sessionId, // Add session ID to game state
    currentRoomId: "start",
    previousRoomId: null,
  };
};

export const generateRoom = async (
  theme: string,
  gameState: GameState,
  position: RoomPosition
): Promise<Room> => {
  const prompt = generateRoomPrompt(theme, gameState);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
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
          isOpen: false,
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
