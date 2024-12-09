import {
  GameState,
  Item,
  Enemy,
  Room,
  Player,
  StatusEffect,
} from "../types/game";
import { generateRoom } from "./state";
import { openai } from "../lib/openai";

interface StateChange {
  type: string;
  payload: any;
}

interface ActionEffect {
  type: string;
  description: string;
  magnitude?: number;
  duration?: number;
  target?: string;
  itemModification?: {
    newDescription?: string;
    newState?: string;
    isUsable?: boolean;
  };
  conditions?: {
    requires?: string[];
    consumes?: string[];
  };
}

interface LLMResponse {
  action: {
    type: string;
    target?: string;
    using?: string[];
  };
  effects: ActionEffect[];
  message: string;
}

const EFFECT_DURATIONS = {
  TEMPORARY: 3,
  SHORT: 5,
  MEDIUM: 10,
  LONG: 20,
};

const ACTION_PROMPT = `You are a humorous game master for a text-based dungeon crawler RPG. Your role is to interpret player actions in natural language and determine their effects.

Given the current game state and a player's command, determine:
1. The core action being attempted
2. Any items or objects involved. Each of these items should be in the player's inventory or in the room.
3. The effects this should have on the game state
NOTE: if the player doesn't have the item(s) required to perform the action, the action should be denied.
NOTE: if the object of the action is not in the player inventory, the room, or environment, the action should be denied.
NOTE: some items are implicitly owned by the player, such as body parts, unless those are damaged, stunned, or otherwise unusable.
NOTE: ALWAYS take into account a player's status effects (and any items' and enemies' status effects) when determining the effects of an action.

Effects can include:
- Stat changes (health, stamina, strength, dexterity, etc.)
- Status effects (tired, poisoned, strengthened, etc.)
    - Status effects usually also have stat changes, eg. a player being hurt means health was lost.
- Resource changes (gaining/losing items)
- Item modifications (changing item descriptions, states, or usability)
- Environmental changes
- Knowledge gains
- Effects on enemies (enemy health, giving enemy status effects, etc.)
- Enemy reactions

For item modifications, you can:
- Change an item's description to reflect its new state
- Mark items as unusable if they've been damaged/destroyed
- Update item states (e.g., "lit" to "unlit" for a torch)

Respond with a JSON object in this format:
{
  "action": {
    "type": "string (e.g. MOVE, ATTACK, INSPECT, USE_ITEM, etc.)",
    "target": "optional string - what is being acted upon",
    "using": ["optional array of items being used"]
  },
  "effects": [
    {
      "type": "string (e.g. STAT_CHANGE, STATUS_EFFECT, GAIN_ITEM, ITEM_MODIFICATION, etc.)",
      "description": "string explaining the effect",
      "magnitude": "optional number for the size of the effect",
      "duration": "optional number of turns the effect lasts",
      "target": "optional string specifying what is affected",
      "itemModification": {
        "newDescription": "optional string - new description for the item",
        "newState": "optional string - new state for the item (e.g., 'lit', 'unlit', 'broken')",
        "isUsable": "optional boolean - whether the item can still be used"
      },
      "conditions": {
        "requires": ["optional array of required items/states"],
        "consumes": ["optional array of items consumed"]
      }
    }
  ],
  "message": "string describing what happens"
}`;

// Add new interfaces for effect processing
interface EffectModifier {
  stat: string;
  value: number;
  duration?: number;
}

interface StatusMapping {
  [key: string]: {
    statModifiers?: EffectModifier[];
    duration: number;
    description: string;
  };
}

// Define status effect mappings
const STATUS_MAPPINGS: StatusMapping = {
  burning: {
    statModifiers: [
      { stat: "health", value: -2 },
      { stat: "defense", value: -1 },
    ],
    duration: 3,
    description: "Taking damage from flames",
  },
  frozen: {
    statModifiers: [
      { stat: "speed", value: -2 },
      { stat: "dexterity", value: -2 },
    ],
    duration: 2,
    description: "Movement and reactions slowed",
  },
  poisoned: {
    statModifiers: [
      { stat: "health", value: -1 },
      { stat: "strength", value: -1 },
    ],
    duration: 4,
    description: "Taking poison damage over time",
  },
  strengthened: {
    statModifiers: [
      { stat: "strength", value: 2 },
      { stat: "damage", value: 1 },
    ],
    duration: 3,
    description: "Enhanced physical power",
  },
  // Add more status effects as needed
};

// Helper function to find an item in either room or inventory
function findItem(
  state: GameState,
  itemName: string
): {
  item: Item | undefined;
  location: "room" | "inventory" | undefined;
  index: number;
} {
  const currentRoom = state.rooms[state.player.currentRoomId];

  // Check room items
  const roomIndex = currentRoom.items.findIndex(
    (item) => item.name.toLowerCase() === itemName.toLowerCase()
  );
  if (roomIndex !== -1) {
    return {
      item: currentRoom.items[roomIndex],
      location: "room",
      index: roomIndex,
    };
  }

  // Check inventory items
  const inventoryIndex = state.player.inventory.findIndex(
    (item) => item.name.toLowerCase() === itemName.toLowerCase()
  );
  if (inventoryIndex !== -1) {
    return {
      item: state.player.inventory[inventoryIndex],
      location: "inventory",
      index: inventoryIndex,
    };
  }

  return { item: undefined, location: undefined, index: -1 };
}

export async function processAction(
  state: GameState,
  action: string
): Promise<{ newState: GameState; message: string }> {
  let newState = { ...state };
  console.log("\n=== Processing Action ===");
  console.log("Player Action:", action);

  // Process existing status effects
  if (newState.player.statusEffects) {
    newState.player.statusEffects = newState.player.statusEffects
      .map((effect) => ({
        ...effect,
        duration: effect.duration - 1,
      }))
      .filter((effect) => effect.duration > 0);
  }

  try {
    // Interpret the action using LLM
    console.log("\n--- Sending to LLM ---");
    const interpretation = await interpretAction(action, newState);
    console.log("\n--- LLM Response ---");
    console.log(JSON.stringify(interpretation, null, 2));

    // If there are no effects to process, just pass through the message
    if (!interpretation.effects || interpretation.effects.length === 0) {
      console.log("No effects to process - passing through message directly");
      return {
        newState,
        message: interpretation.message,
      };
    }

    // Apply the determined effects
    console.log("\n--- Applying Effects ---");
    const result = await applyEffects(newState, interpretation);
    newState = result.newState;

    // Process enemy actions if any are present
    if (newState.rooms[newState.player.currentRoomId].enemies.length > 0) {
      console.log("\n--- Processing Enemy Actions ---");
      const enemyActions = processEnemyActions(newState);
      result.message += "\n" + enemyActions.message;
      newState = enemyActions.newState;
    }

    console.log("\n--- Final Result ---");
    console.log("Message:", result.message);
    console.log("=== Action Processing Complete ===\n");

    return {
      newState,
      message: result.message,
    };
  } catch (error) {
    console.error("\n!!! Error Processing Action !!!");
    console.error(error);
    return {
      newState: state,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function interpretAction(
  action: string,
  state: GameState
): Promise<LLMResponse> {
  const currentRoom = state.rooms[state.player.currentRoomId];

  const prompt = `${ACTION_PROMPT}

Current game state:
Room: ${JSON.stringify(currentRoom)}
Player: ${JSON.stringify(state.player)}

Player action: "${action}"`;

  console.log("Prompt sent to LLM:", prompt);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-2024-11-20",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from LLM");

    console.log("Raw LLM Response:", content);

    const parsedResponse = JSON.parse(content) as LLMResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Failed to parse LLM response:\n", error);
    throw new Error("Failed to interpret action");
  }
}

async function applyEffects(
  state: GameState,
  interpretation: LLMResponse
): Promise<{ newState: GameState; message: string }> {
  let newState = { ...state };
  let message = interpretation.message;
  const currentRoom = newState.rooms[newState.player.currentRoomId];

  for (const effect of interpretation.effects) {
    console.log(`Applying effect: ${effect.type}`, effect);

    switch (effect.type) {
      case "STAT_CHANGE":
        if (effect.target && effect.magnitude) {
          const target = effect.target.toLowerCase();
          if (target in newState.player.stats) {
            console.log(`Changing stat ${target} by ${effect.magnitude}`);
            newState.player.stats[target] += effect.magnitude;
          }
        }
        break;

      case "STATUS_EFFECT":
        if (!newState.player.statusEffects) {
          newState.player.statusEffects = [];
        }
        console.log(`Adding status effect: ${effect.description}`);
        newState.player.statusEffects.push({
          name: effect.description,
          duration: effect.duration || EFFECT_DURATIONS.TEMPORARY,
          magnitude: effect.magnitude || 1,
        });
        break;

      case "ITEM_MODIFICATION":
        if (effect.target && effect.itemModification) {
          console.log(`Modifying item: ${effect.target}`);
          const { item, location, index } = findItem(newState, effect.target);

          if (item && location && index !== -1) {
            const modifiedItem = {
              ...item,
              description:
                effect.itemModification.newDescription || item.description,
              state: effect.itemModification.newState || item.state,
              isUsable:
                effect.itemModification.isUsable !== undefined
                  ? effect.itemModification.isUsable
                  : item.isUsable,
            };

            // Update the item in its location
            if (location === "room") {
              console.log(
                `Updating item in room: ${JSON.stringify(modifiedItem)}`
              );
              newState.rooms[newState.player.currentRoomId].items[index] =
                modifiedItem;
            } else {
              console.log(
                `Updating item in inventory: ${JSON.stringify(modifiedItem)}`
              );
              newState.player.inventory[index] = modifiedItem;
            }
          }
        }
        break;

      case "GAIN_ITEM":
        if (effect.target) {
          console.log(`Generating item: ${effect.target}`);
          const item = await generateItem(effect.target);
          newState.player.inventory.push(item);
        }
        break;

      case "LOSE_ITEM":
        if (effect.target) {
          console.log(`Removing item: ${effect.target}`);
          newState.player.inventory = newState.player.inventory.filter(
            (item) => item.name.toLowerCase() !== effect.target?.toLowerCase()
          );
        }
        break;

      case "MOVE":
        if (effect.target) {
          console.log(`Attempting to move: ${effect.target}`);
          const door =
            newState.rooms[newState.player.currentRoomId].doors[
              effect.target.toLowerCase() as keyof Room["doors"]
            ];
          if (door && !door.isLocked) {
            console.log(`Moving to room: ${door.destinationRoomId}`);

            // Check if the destination room needs to be generated
            if (!newState.rooms[door.destinationRoomId]) {
              // Calculate new room position based on direction
              const currentRoom = newState.rooms[newState.player.currentRoomId];
              const newPosition = { ...currentRoom.position };

              switch (effect.target.toLowerCase()) {
                case "north":
                  newPosition.y -= 1;
                  break;
                case "south":
                  newPosition.y += 1;
                  break;
                case "east":
                  newPosition.x += 1;
                  break;
                case "west":
                  newPosition.x -= 1;
                  break;
              }

              // Generate the new room
              const newRoom = await generateRoom(
                newState.currentFloor,
                "dungeon", // You might want to pass a proper theme based on the floor
                newPosition
              );

              // Add the room to the game state
              newState.rooms[door.destinationRoomId] = newRoom;
            }

            newState.player.currentRoomId = door.destinationRoomId;
          }
        }
        break;

      case "KNOWLEDGE_GAIN":
        if (!newState.player.knowledge) {
          newState.player.knowledge = [];
        }
        console.log(`Adding knowledge: ${effect.description}`);
        newState.player.knowledge.push({
          type: effect.target || "general",
          description: effect.description,
        });
        break;

      default:
        // For unknown effect types, just log it and continue without modifying state
        console.log(
          `Unhandled effect type: ${effect.type} - passing through without state modification`
        );
        break;
    }
  }

  return { newState, message };
}

function processEnemyActions(state: GameState): {
  newState: GameState;
  message: string;
} {
  let message = "";
  let newState = { ...state };
  const currentRoom = newState.rooms[newState.player.currentRoomId];

  currentRoom.enemies.forEach((enemy) => {
    if (enemy.isAlive) {
      const action = determineEnemyAction(enemy, newState);
      message += `\n${enemy.name} ${action.message}`;
      newState = action.apply(newState);
    }
  });

  return { newState, message };
}

function determineEnemyAction(
  enemy: Enemy,
  state: GameState
): {
  message: string;
  apply: (state: GameState) => GameState;
} {
  // Implement enemy AI logic here
  return {
    message: "watches you cautiously.",
    apply: (state) => state,
  };
}

// Helper function to generate items (implement based on your item system)
async function generateItem(itemType: string): Promise<Item> {
  // Implement item generation logic
  return {
    id: Math.random().toString(),
    name: itemType,
    description: `A ${itemType}`,
    type: "misc",
  };
}

// Helper functions for interpreting effects
function interpretStatusEffect(
  description: string
): StatusMapping[keyof StatusMapping] | null {
  // Look for known status effects in the description
  for (const [status, mapping] of Object.entries(STATUS_MAPPINGS)) {
    if (description.toLowerCase().includes(status)) {
      return mapping;
    }
  }

  // Try to interpret custom status effects
  const words = description.toLowerCase().split(" ");
  const effectWords = [
    "weakened",
    "strengthened",
    "slowed",
    "hastened",
    "protected",
    "vulnerable",
  ];

  for (const word of effectWords) {
    if (words.includes(word)) {
      return interpretCustomStatus(word, description);
    }
  }

  return null;
}

function interpretStatChange(description: string): EffectModifier | null {
  const statPatterns = [
    { regex: /(\d+)\s+damage/i, stat: "health", multiplier: -1 },
    { regex: /(\d+)\s+healing/i, stat: "health", multiplier: 1 },
    {
      regex: /strength\s+(increased|decreased)\s+by\s+(\d+)/i,
      stat: "strength",
    },
    { regex: /defense\s+(increased|decreased)\s+by\s+(\d+)/i, stat: "defense" },
    // Add more patterns as needed
  ];

  for (const pattern of statPatterns) {
    const match = description.match(pattern.regex);
    if (match) {
      const value = parseInt(match[1]);
      const multiplier = match[0].includes("decreased") ? -1 : 1;
      return {
        stat: pattern.stat,
        value: value * (pattern.multiplier || multiplier),
      };
    }
  }

  return null;
}

function interpretItemChange(description: string): Partial<Item> | null {
  const changes: Partial<Item> = {};

  // Check for state changes
  if (description.includes("broken")) {
    changes.state = "broken";
  } else if (description.includes("enhanced")) {
    changes.state = "enhanced";
  }

  // Check for glowing property
  if (description.includes("glowing")) {
    changes.state = "glowing";
  }

  // Check for stat modifications
  const statMatch = description.match(/(\+|-)(\d+)\s+to\s+(\w+)/);
  if (statMatch) {
    const statType = statMatch[3].toLowerCase();
    const value = parseInt(statMatch[1] + statMatch[2]);

    // Only add valid stats
    if (
      statType === "damage" ||
      statType === "defense" ||
      statType === "healing"
    ) {
      changes.stats = changes.stats || {};
      changes.stats[statType] = value;
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

function interpretRoomChange(description: string): any {
  // Implement room state change interpretation
  const changes: any = {};

  if (description.includes("darkened")) {
    changes.lighting = "dark";
  } else if (description.includes("illuminated")) {
    changes.lighting = "bright";
  }

  if (description.includes("flooded")) {
    changes.environment = "flooded";
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

// Helper functions for applying changes
function applyStatModifier(target: any, modifier: EffectModifier): void {
  if (target[modifier.stat] !== undefined) {
    target[modifier.stat] += modifier.value;
  }
}

function applyItemChange(item: Item, changes: Partial<Item>): void {
  Object.assign(item, changes);
}

function applyRoomChange(room: Room, changes: any): void {
  Object.assign(room, changes);
}

function interpretCustomStatus(
  effectWord: string,
  description: string
): StatusMapping[keyof StatusMapping] {
  const magnitude = extractMagnitude(description) || 1;

  const statusEffects: { [key: string]: StatusMapping[keyof StatusMapping] } = {
    weakened: {
      statModifiers: [
        { stat: "strength", value: -magnitude },
        { stat: "damage", value: -magnitude },
      ],
      duration: 3,
      description: "Reduced physical capabilities",
    },
    strengthened: {
      statModifiers: [
        { stat: "strength", value: magnitude },
        { stat: "damage", value: magnitude },
      ],
      duration: 3,
      description: "Enhanced physical capabilities",
    },
    // Add more custom status interpretations
  };

  return (
    statusEffects[effectWord] || {
      statModifiers: [{ stat: "health", value: -1 }],
      duration: 2,
      description: "Unknown effect",
    }
  );
}

function extractMagnitude(description: string): number | null {
  const match = description.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}
