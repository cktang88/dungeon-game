import {
  GameState,
  Room,
  AbilityScores,
  DerivedStats,
  Door,
} from "../types/game";
import { openai } from "../lib/openai";
import generateRoomPrompt from "./generation/roomGen";
import { isValidGameState } from "..";

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
  };
};

const createStartingRoom = (): Room => ({
  name: "Entrance Hall",
  description:
    "You wake up, finding yourself in a dimly lit entrance hall where cool air carries the scent of damp earth and aged stone. Ancient stone walls, cloaked in moss and faintly glowing runes, tower above them, while intermittently flickering torches cast dancing shadows that seem alive. The vaulted ceiling is supported by intricately carved stone pillars depicting forgotten deities and mythical creatures. Beneath their feet, a worn mosaic floor portrays a celestial map aligned with the night sky, with some tiles feeling cold and others slightly warm, hinting at hidden magical properties. Minimal torchlight creates pockets of brightness and deep, almost palpable shadows in the corners, lending an eerie ambiance. Faint echoes of dripping water and the soft scuttling of unseen creatures resonate from deeper within the dungeon, occasionally accompanied by a distant, hollow thud that makes it seem as if the dungeon itself is breathing.",
  hiddenDetailedStats: "",
  hiddenDetailedStatuses: "",
  hiddenDetailedAttributes: "",
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
      name: "Shadowfang Dagger",
      description:
        "A sleek, black-bladed dagger with intricate silver runes etched along its blade. The hilt is wrapped in dark leather, providing a firm grip, and the dagger seems to absorb surrounding light, making it blend into the shadows.",
      hiddenDetailedStats:
        "Deals 1d4 piercing damage plus 1d2 necrotic damage. Grants a +1 bonus to attack and damage rolls. When attacking from stealth, the dagger deals an additional 1d4 damage.",
      hiddenDetailedStatuses:
        "The dagger grants the wielder advantage on Dexterity (Stealth) checks. It also bestows a shadowy aura that can momentarily obscure the wielder, providing a +2 bonus to AC against the first attack made each round.",
      hiddenDetailedAttributes:
        "Type: Weapon (Dagger)\nRarity: Uncommon\nRequires Attunement: Yes\nWeight: 1 lb.\nValue: 150 gold pieces\nAdditional Attributes: Can be thrown with a range of 20/60 feet. Returns to the wielder's hand immediately after being thrown.",
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
  connections: {
    north: {
      name: "Guardian's Oak Door",
      destinationRoomName: "room-1",
      description:
        "A massive wooden door carved from ancient oak, reinforced with iron bands and adorned with intricate runes depicting protective symbols. The door emanates a faint magical aura, hinting at its enchanted properties and the secrets it safeguards.",
      hiddenDetailedStats:
        "The door has an Armor Class (AC) of 18 and 100 hit points. It is resistant to bludgeoning, piercing, and slashing damage from non-magical weapons. The door cannot be broken down without a successful DC 15 Strength (Athletics) check or DC 15 Dexterity (Thieves' Tools) check to unlock. If the door is magically locked, it requires a specific key or a spell such as *Knock* to open.",
      hiddenDetailedStatuses:
        "When closed, the door provides complete separation between two areas, blocking sound and light. If enchanted with a teleportation spell, the door can serve as a portal to a predetermined location once activated by the correct key or password. Additionally, the door may be protected by spells that trigger alarms or summon guardians if tampered with without authorization.",
      hiddenDetailedAttributes:
        "Type: Wondrous Item\nRarity: Rare\nRequires Attunement: No\nWeight: 100 lbs.\nValue: 500 gold pieces\nAdditional Attributes: Once per day, the door can be activated to teleport anyone passing through it to a linked location within 1 mile. The door can be locked with a magical key or a password known only to authorized individuals.",
    },
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
  const gameState: GameState = {
    player: {
      name: "Liam",
      level: 1,
      experience: 0,
      inventory: [],
      currentRoomName: "Entrance Hall",
      baseAbilityScores: abilityScores,
      currentAbilityScores: abilityScores,
      baseDerivedStats: derivedStats,
      currentDerivedStats: derivedStats,
      statusEffects: [],
      class: "Fighter",
      roomsVisitedHistory: [],
      description:
        "Liam stands tall at 6 feet with a muscular build honed from years of rigorous training and countless battles. His sun-kissed skin bears numerous scars, each telling a story of survival and valor. His piercing emerald eyes reflect a mix of determination and weariness, hinting at the burdens he carries. Liam's dark, tousled hair is often kept short for practicality in combat, and a neatly trimmed beard frames his strong jawline.",
      hiddenDetailedStats: "",
      hiddenDetailedStatuses: "",
      hiddenDetailedAttributes: "",
    },
    rooms: {
      "Entrance Hall": startingRoom,
    },
    messageHistory: [
      "Welcome to the AI Dungeon! You find yourself in a mysterious entrance hall.",
      'Type "look" to examine your surroundings, or "help" for available commands.',
    ],
    sessionId, // Add session ID to game state
    currentRoomId: "Entrance Hall",
    previousRoomId: null,
  };

  const newRoom = await generateRoom("dungeon", gameState);
  gameState.rooms[newRoom.name] = newRoom;

  console.log(gameState);

  return gameState;
};

export const generateRoom = async (
  theme: string,
  gameState: GameState
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

    const roomData = JSON.parse(content) as Room;

    // Process items
    const items = roomData.items || [];

    // Process enemies
    const enemies = roomData.enemies || [];

    // Process doors
    const doors: Record<string, Door> = {};
    for (const [direction, door] of Object.entries(
      roomData.connections || {}
    )) {
      if (door) {
        doors[direction] = {
          ...door,
          destinationRoomName: door.destinationRoomName,
        };
      }
    }

    return {
      name: roomData.name,
      description: roomData.description,
      items,
      enemies,
      connections: doors,
      hiddenDetailedStats: roomData.hiddenDetailedStats,
      hiddenDetailedStatuses: roomData.hiddenDetailedStatuses,
      hiddenDetailedAttributes: roomData.hiddenDetailedAttributes,
    };
  } catch (error) {
    console.error("Error generating room:", error);
    throw error;
  }
};

export const applyEffects = async (
  effects: string[],
  gameState: GameState
): Promise<{ gameState: GameState; messages: string[] }> => {
  console.log("Applying effects:", effects);

  const prompt = `You are a game master for a text-based dungeon crawler RPG, and an expert JSON diff calculator and editor. Your role is to apply the following effects to the current game state and determine the outcome.

Current game state: ${JSON.stringify(gameState)}

Process effects sequentially, one at a time.
Reason through intermediate state after each effect, step by step.
Effects to apply: ${JSON.stringify(effects)}

Consider:
1. How each effect modifies the player's stats, status effects, or inventory
2. How each effect modifies the current room's state, items, or enemies
3. How each effect modifies the enemies in the room
4. Any changes to hidden stats or attributes for any entities, trying to preserve as much information as possible.
5. Any secondary effects that might occur as a result
6. Any other changes to the world.

Calculate JSON changes as accurate numerically and as surgically precise as possible.

Respond in this JSON format:
{
  "updatedGameState": GameState, // The full updated game state after applying all effects
  "messages": string[], // Array of messages describing what happened
  "explanation": string // A detailed explanation of what changes were made and why
}

Be creative but consistent with the game's mechanics and theme. Consider how effects might interact with each other and the current state of the game.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [{ role: "system", content: prompt }],
      temperature: 1, // deterministic
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from LLM");

    const result = JSON.parse(content) as {
      updatedGameState: GameState;
      messages: string[];
      explanation: string;
    };

    console.log(
      "Effects applied, will check validity later:",
      result.messages,
      result.explanation
    );

    // Validate the updated game state
    if (!result.updatedGameState.player || !result.updatedGameState.rooms) {
      throw new Error("Invalid game state returned from LLM");
    }

    if (!isValidGameState(result.updatedGameState)) {
      throw new Error("Invalid game state returned from LLM");
    }

    // Ensure we preserve the session ID and other critical fields
    result.updatedGameState.sessionId = gameState.sessionId;
    result.updatedGameState.messageHistory = [
      ...gameState.messageHistory,
      ...result.messages,
    ];

    return {
      gameState: result.updatedGameState,
      messages: result.messages,
    };
  } catch (error) {
    console.error("Error applying effects:", error);
    throw error;
  }
};
