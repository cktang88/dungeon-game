import { GameState, Room, AbilityScores, DerivedStats } from "../types/game";

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
  theme: string
): Promise<Room> => {
  // This will be implemented with OpenAI to generate dynamic rooms
  // For now, return a basic room
  return {
    id: `room_${Math.random().toString(36).substr(2, 9)}`,
    name: "Generated Room",
    description: "A mysterious chamber awaits exploration.",
    items: [],
    enemies: [],
    doors: {},
    visited: false,
  };
};
