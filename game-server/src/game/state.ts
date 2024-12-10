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
  hiddenDetailedStats: "regular stats",
  hiddenDetailedStatuses: "regular statuses",
  hiddenDetailedAttributes: "regular attributes",
  items: [
    {
      name: "Wooden Torch",
      description:
        "A simple wooden torch that can be lit to provide light in dark areas. It's made from sturdy wood wrapped in cloth to sustain a flame.",
      hiddenDetailedStats:
        "The wooden torch emits bright light in a 20-foot radius and dim light for an additional 20 feet. It burns for approximately 1 hour before needing to be relit. As an improvised weapon, it deals 1d4 bludgeoning damage on a successful hit. The torch's wood is treated with a natural resin, making it slightly more resistant to burning out in damp conditions, extending its effective burn time by an additional 15 minutes when in humid environments.",
      hiddenDetailedStatuses:
        "When lit, the torch illuminates the surrounding area but lacks any magical properties. It can be extinguished by strong winds or heavy rain, requiring the user to relight it if necessary. Due to the resin treatment, the torch is less likely to extinguish in light rain, providing a slight reliability advantage during inclement weather.",
      hiddenDetailedAttributes:
        "Type: Tool (Torch)\nRarity: Common\nRequires Attunement: No\nWeight: 1 lb.\nValue: 5 gold pieces\nAdditional Attributes: The torch can be used to start fires, light up dark environments during nighttime adventures, or signal for help in emergencies. Its resin-treated wood leaves a faint, pleasant scent when burned, which can help mask other odors during stealth operations.",
    },
    {
      name: "Basic Dagger",
      description:
        "A plain steel dagger with a simple handle, suitable for combat and everyday tasks. It's lightweight and easy to carry.",
      hiddenDetailedStats:
        "The dagger deals 1d4 piercing damage. It possesses the Finesse and Light properties, allowing it to be used effectively in both melee and ranged combat with a throwing range of 20 feet normally and up to 60 feet with disadvantage. The handle is slightly ergonomically shaped, granting a +1 bonus to grip-related checks such as climbing or grappling when held in one hand.",
      hiddenDetailedStatuses:
        "The dagger does not have any magical properties or special effects. However, the ergonomically shaped handle provides a more secure grip, reducing the chance of slipping during combat or when performing tasks that require precision. It is reliable for both combat situations and utility purposes such as cutting ropes or preparing food.",
      hiddenDetailedAttributes:
        "Type: Weapon (Dagger)\nRarity: Common\nRequires Attunement: No\nWeight: 1 lb.\nValue: 10 gold pieces\nAdditional Attributes: Being lightweight and easily concealable, the dagger is a versatile tool for adventurers, useful in a variety of scenarios both in and out of combat. The unique handle design allows for better balance, making it slightly easier to throw accurately compared to standard daggers.",
    },
    {
      name: "Healing Bandage",
      description:
        "A set of basic cloth bandages used to treat wounds and provide minor healing. They are easy to apply and carry.",
      hiddenDetailedStats:
        "When applied, the healing bandage restores 1d4 hit points to the injured creature. It can also be used to stabilize a dying character, preventing death until further healing can be administered. The fabric is woven with a subtle, moisture-wicking thread, allowing the bandage to dry quickly and reducing the risk of infection by 10% compared to standard bandages.",
      hiddenDetailedStatuses:
        "The bandage has no magical properties. However, the moisture-wicking thread helps keep the wound dry, promoting faster healing and reducing the chances of infection. This makes the bandage more effective in damp or humid environments where standard bandages might retain moisture.",
      hiddenDetailedAttributes:
        "Type: Consumable (Bandage)\nRarity: Common\nRequires Attunement: No\nWeight: 0.5 lb.\nValue: 5 gold pieces\nAdditional Attributes: Each bandage is single-use and must be replenished after a long rest. They can be used to stop bleeding, cover wounds to prevent infection, and provide basic first aid in the field. The moisture-wicking property makes these bandages particularly useful for adventurers traveling through wet or marshy areas.",
    },
  ],
  enemies: [],
  connections: {
    north: {
      name: "Wooden Door",
      destinationRoomName: "room-1",
      description:
        "A simple wooden door made of plain oak, with no adornments or special features. It looks sturdy and functional.",
      hiddenDetailedStats:
        "The door has an Armor Class (AC) of 10 and 20 hit points. It is susceptible to damage and can be opened with a standard DC 10 Strength (Athletics) or Dexterity (Thieves' Tools) check if locked.",
      hiddenDetailedStatuses:
        "When closed, the door separates two areas, allowing minimal passage of sound and light. It has no magical properties and does not provide any special protections.",
      hiddenDetailedAttributes:
        "Type: Standard Door\nRarity: Common\nRequires Attunement: No\nWeight: 50 lbs.\nValue: 50 gold pieces\nAdditional Attributes: The door can be locked with a basic key or a simple locking mechanism.",
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
        "Your name is Liam. You stand tall at six feet, your muscular build honed from years of rigorous training and countless battles. Your sun-kissed skin bears numerous scars, each telling a story of survival and valor. Your piercing emerald eyes reflect a mix of determination and weariness, hinting at the burdens you carry. Your dark, tousled hair is often kept short for practicality in combat, and a neatly trimmed beard frames your strong jawline.",
      hiddenDetailedStats: "",
      hiddenDetailedStatuses: "",
      hiddenDetailedAttributes: "",
    },
    rooms: {
      "Entrance Hall": startingRoom,
    },
    messageHistory: [
      "Welcome to the AI Dungeon! Type any command to begin your adventure, for example 'count my blessings' or 'guess the age of the walls'.",
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
  effects: any[],
  gameState: GameState
): Promise<GameState> => {
  console.log("Applying effects:", effects);
  console.log("Message history before:", gameState.messageHistory);

  const prompt = `You are a game master for a text-based dungeon crawler RPG, and an expert JSON diff calculator and editor. Your role is to apply the following effects to the current game state and determine the outcome.

Process effects sequentially, one at a time.
Reason through intermediate state after each effect, step by step.

IMPORTANT: You must preserve all existing fields in the game state, including:
- messageHistory (array of strings)
- sessionId
- rooms
- currentRoomId
- previousRoomId
- all other existing fields

Consider:
1. How each effect modifies the player's stats, status effects, or inventory
2. How each effect modifies the current room's state, items, or enemies
3. How each effect modifies the enemies in the room
4. Any changes to hidden stats or attributes for any entities, trying to preserve as much information as possible.
5. Any secondary effects that might occur as a result
6. Any other changes to the world.

Make JSON changes as accurate numerically (eg. 5hp minus 2 dmg = 3hp) and modify only the fields that are affected by the effect.
DO NOT remove or omit any existing fields from the game state.

ONLY respond in the JSON format consistent with the provided game state. Do not say any additional text before or after the JSON.

Be creative but consistent with the game's mechanics and theme. Consider how effects might interact with each other and the current state of the game.`;

  const modifiedGameState = { ...gameState };
  // remove all rooms from modifiedGameState except for the current room
  // we do this for performance and accuracy reasons
  modifiedGameState.rooms = {
    [gameState.currentRoomId]: gameState.rooms[gameState.currentRoomId],
  };
  const modifiedGameStateJson = JSON.stringify(modifiedGameState);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: modifiedGameStateJson,
        },
        {
          role: "user",
          content: `${JSON.stringify(effects)}`,
        },
      ],
      temperature: 1, // deterministic
      prediction: {
        type: "content",
        content: modifiedGameStateJson,
      },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from LLM");

    console.log(content);
    // strip ```json and ```
    let updatedGameState = JSON.parse(content.replace(/```json|```/g, ""));

    // add back all rooms
    updatedGameState.rooms = {
      ...gameState.rooms,
      ...updatedGameState.rooms,
    };

    // Validate the updated game state
    if (!updatedGameState.player || !updatedGameState.rooms) {
      throw new Error("Invalid game state returned from LLM");
    }

    if (!isValidGameState(updatedGameState)) {
      throw new Error("Invalid game state returned from LLM");
    }

    // Ensure critical fields are preserved from original state
    updatedGameState = {
      ...updatedGameState,
      sessionId: gameState.sessionId,
      currentRoomId: updatedGameState.currentRoomId || gameState.currentRoomId,
      previousRoomId:
        updatedGameState.previousRoomId || gameState.previousRoomId,
    };

    return updatedGameState;
  } catch (error) {
    console.error("Error applying effects:", error);
    throw error;
  }
};
