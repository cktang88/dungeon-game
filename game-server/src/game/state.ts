import {
  GameState,
  Room,
  AbilityScores,
  DerivedStats,
  Position,
  Floor,
} from "../types/game";
import { openai } from "../lib/openai";
import generateRoomPrompt from "./generation/roomGen";

// Calculate ability score modifier (D&D style)
const getAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

// Calculate derived stats from ability scores
const calculateDerivedStats = (
  abilityScores: AbilityScores,
  level: number,
  inventory: any[]
): DerivedStats => {
  const constitutionModifier = getAbilityModifier(abilityScores.constitution);
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);

  return {
    hitPoints: (10 + constitutionModifier) * level, // Base HP + CON modifier per level
    armorClass: 10 + dexterityModifier, // Base AC + DEX modifier
    initiative: dexterityModifier,
    carryCapacity: abilityScores.strength * 15, // Each point of STR = 15 pounds
    currentWeight: 0,
    isEncumbered: false,
  };
};

const createStartingRoom = (): Room => ({
  id: "room-start",
  name: "Entrance Hall",
  description:
    "You wake up, finding yourself in a dimly lit entrance hall where cool air carries the scent of damp earth and aged stone. Ancient stone walls, cloaked in moss and faintly glowing runes, tower above them, while intermittently flickering torches cast dancing shadows that seem alive. The vaulted ceiling is supported by intricately carved stone pillars depicting forgotten deities and mythical creatures. Beneath their feet, a worn mosaic floor portrays a celestial map aligned with the night sky, with some tiles feeling cold and others slightly warm, hinting at hidden magical properties. Minimal torchlight creates pockets of brightness and deep, almost palpable shadows in the corners, lending an eerie ambiance. Faint echoes of dripping water and the soft scuttling of unseen creatures resonate from deeper within the dungeon, occasionally accompanied by a distant, hollow thud that makes it seem as if the dungeon itself is breathing.",
  items: [
    {
      name: "Everburning Torch",
      description:
        "A sturdy wooden torch imbued with a magical flame that never extinguishes. The flame burns with a vibrant blue light, casting bright illumination in dark surroundings and revealing hidden details in shadows.",
      hiddenDetailedStats:
        "Provides bright light in a 30-foot radius and dim light for an additional 30 feet. The flame does not consume oxygen and cannot be extinguished by wind or rain. Grants a +1 bonus to Perception checks made in low-light conditions.",
      hiddenDetailedStatuses:
        "While lit, the torch emits a faint magical aura that can reveal invisible or hidden creatures within its bright light radius. The perpetual flame ensures consistent illumination without the need for maintenance.",
      hiddenDetailedAttributes:
        "Type: Wondrous Item\nRarity: Common\nRequires Attunement: No\nWeight: 1 lb.\nValue: 50 gold pieces\nAdditional Attributes: Can be used as a melee weapon dealing 1d4 fire damage on a successful hit.",
    },
    {
      name: "Linen of Renewed Vitality",
      description:
        "A simple yet finely woven cloth rag infused with healing magic. The fabric is soft to the touch and emanates a gentle warmth, capable of mending wounds and restoring vitality when applied to injuries.",
      hiddenDetailedStats:
        "Can be used to cast the *Cure Wounds* spell once per short rest. When used, it restores 2d8 + the user's Wisdom modifier in hit points to a creature touched.",
      hiddenDetailedStatuses:
        "When used, the rag emits a soothing light that provides comfort, granting the target advantage on saving throws against being frightened or charmed for 10 minutes after healing.",
      hiddenDetailedAttributes:
        "Type: Consumable (Potion)\nRarity: Common\nRequires Attunement: No\nWeight: 0.5 lb.\nValue: 25 gold pieces\nAdditional Attributes: The rag regenerates after a long rest, allowing it to be used again without requiring additional resources.",
    },
    {
      name: "Linen of Renewed Vitality",
      description:
        "A simple yet finely woven cloth rag infused with healing magic. The fabric is soft to the touch and emanates a gentle warmth, capable of mending wounds and restoring vitality when applied to injuries.",
      hiddenDetailedStats:
        "Can be used to cast the *Cure Wounds* spell once per short rest. When used, it restores 2d8 + the user's Wisdom modifier in hit points to a creature touched.",
      hiddenDetailedStatuses:
        "When used, the rag emits a soothing light that provides comfort, granting the target advantage on saving throws against being frightened or charmed for 10 minutes after healing.",
      hiddenDetailedAttributes:
        "Type: Consumable (Potion)\nRarity: Common\nRequires Attunement: No\nWeight: 0.5 lb.\nValue: 25 gold pieces\nAdditional Attributes: The rag regenerates after a long rest, allowing it to be used again without requiring additional resources.",
    },
  ],
  enemies: [],
  doors: {
    north: {
      id: "door-1",
      description: "A heavy wooden door with iron bindings.",
      isLocked: false,
      destinationRoomId: "room-1",
      isOpen: false,
    },
  },
  visited: true,
  position: {
    x: 0,
    y: 0,
    floorDepth: 1,
  },
});

export const initializeGameState = async (): Promise<GameState> => {
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

  const derivedStats = calculateDerivedStats(abilityScores, 1, []);

  const floor: Floor = {
    name: "Entrance Hall",
    theme: {
      name: "dungeon",
      environment: "dungeon",
      floraFauna: "dungeon",
      oddities: "dungeon",
      monsters: [],
      enemyTypes: [],
      afflictions: [],
    },
    floorDepth: 1,
  };

  const gameState: GameState = {
    player: {
      id: `player-${Math.random().toString(36).substring(2, 9)}`,
      name: "Adventurer",
      level: 1,
      experience: 0,
      inventory: [],
      currentRoomId: "room-start",
      previousRoomId: null, // Initialize with starting room
      position: { x: 0, y: 0, floorDepth: 1 },
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
    currentFloor: floor,
    rooms: [startingRoom],
    messageHistory: [
      "Welcome to the AI Dungeon! You find yourself in a mysterious entrance hall.",
      'Type "look" to examine your surroundings, or "help" for available commands.',
    ],
    sessionId, // Add session ID to game state
    currentRoomId: "room-start",
    previousRoomId: null,
  };

  gameState.rooms.push(
    await generateRoom("dungeon", gameState, {
      x: 0,
      y: 1,
      floorDepth: 1,
    })
  );

  console.log(gameState);

  return gameState;
};

export const generateRoom = async (
  theme: string,
  gameState: GameState,
  position: Position
): Promise<Room> => {
  console.log("Generating room...");
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

    // Process items
    const items = (roomData.items || []).map((item: any) => ({
      ...item,
      id: `item-${Math.random().toString(36).substring(2, 9)}`,
    }));

    // Process enemies
    const enemies = (roomData.enemies || []).map((enemy: any) => ({
      ...enemy,
      id: `enemy-${Math.random().toString(36).substring(2, 9)}`,
    }));

    // Process doors
    const doors: Record<string, any> = {};
    for (const [direction, door] of Object.entries(roomData.doors || {})) {
      if (door) {
        doors[direction] = {
          ...door,
          id: `door-${Math.random().toString(36).substring(2, 9)}`,
          destinationRoomId: `room-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          isOpen: false,
          isLocked: false, // TODO: make some locked doors
        };
      }
    }

    return {
      name: roomData.name,
      description: roomData.description,
      items,
      enemies,
      connections: roomData.connections,
    };
  } catch (error) {
    console.error("Error generating room:", error);
  }
};
