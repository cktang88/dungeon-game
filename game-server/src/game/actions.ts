import {
  GameState,
  Item,
  Enemy,
  Room,
  Player,
  StatusEffect,
} from "../types/game";
import { generateRoom } from "./generation";
import OpenAI from "openai";

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

const ACTION_PROMPT = `You are the game master for a text-based dungeon crawler RPG. Your role is to interpret player actions in natural language and determine their effects.

Given the current game state and a player's command, determine:
1. The core action being attempted
2. Any items or objects involved
3. The effects this should have on the game state

Effects can include:
- Stat changes (health, stamina, strength, dexterity, etc.)
- Status effects (tired, poisoned, strengthened, etc.)
- Resource changes (gaining/losing items)
- Environmental changes
- Knowledge gains
- Enemy reactions

Respond with a JSON object in this format:
{
  "action": {
    "type": "string (e.g. MOVE, ATTACK, INSPECT, USE_ITEM, etc.)",
    "target": "optional string - what is being acted upon",
    "using": ["optional array of items being used"]
  },
  "effects": [
    {
      "type": "string (e.g. STAT_CHANGE, STATUS_EFFECT, GAIN_ITEM, etc.)",
      "description": "string explaining the effect",
      "magnitude": "optional number for the size of the effect",
      "duration": "optional number of turns the effect lasts",
      "target": "optional string specifying what is affected",
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

export async function processAction(
  state: GameState,
  action: string
): Promise<{ newState: GameState; message: string }> {
  let newState = { ...state };

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
    const interpretation = await interpretAction(action, newState);

    // Apply the determined effects
    const result = await applyEffects(newState, interpretation);
    newState = result.newState;

    // Process enemy actions if any are present
    if (newState.rooms[newState.player.currentRoomId].enemies.length > 0) {
      const enemyActions = processEnemyActions(newState);
      result.message += "\n" + enemyActions.message;
      newState = enemyActions.newState;
    }

    return {
      newState,
      message: result.message,
    };
  } catch (error) {
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
  const openai = new OpenAI();

  const currentRoom = state.rooms[state.player.currentRoomId];

  const prompt = `${ACTION_PROMPT}

Current game state:
Room: ${JSON.stringify(currentRoom)}
Player: ${JSON.stringify(state.player)}

Player action: "${action}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(content) as LLMResponse;
  } catch (error) {
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
    switch (effect.type) {
      case "STAT_CHANGE":
        if (effect.target && effect.magnitude) {
          const target = effect.target.toLowerCase();
          if (target in newState.player.stats) {
            newState.player.stats[target] += effect.magnitude;
          }
        }
        break;

      case "STATUS_EFFECT":
        if (!newState.player.statusEffects) {
          newState.player.statusEffects = [];
        }
        newState.player.statusEffects.push({
          name: effect.description,
          duration: effect.duration || EFFECT_DURATIONS.TEMPORARY,
          magnitude: effect.magnitude || 1,
        });
        break;

      case "GAIN_ITEM":
        if (effect.target) {
          // Here you'd need to implement item generation or lookup
          const item = await generateItem(effect.target);
          newState.player.inventory.push(item);
        }
        break;

      case "LOSE_ITEM":
        if (effect.target) {
          newState.player.inventory = newState.player.inventory.filter(
            (item) => item.name.toLowerCase() !== effect.target?.toLowerCase()
          );
        }
        break;

      case "MOVE":
        if (effect.target) {
          const door =
            newState.rooms[newState.player.currentRoomId].doors[
              effect.target.toLowerCase() as keyof Room["doors"]
            ];
          if (door && !door.isLocked) {
            newState.player.currentRoomId = door.destinationRoomId;
          }
        }
        break;

      case "KNOWLEDGE_GAIN":
        if (!newState.player.knowledge) {
          newState.player.knowledge = [];
        }
        newState.player.knowledge.push({
          type: effect.target || "general",
          description: effect.description,
          timestamp: Date.now(),
        });
        break;

      case "ENEMY_EFFECT": {
        if (!effect.target || !effect.description) break;

        // Find target enemy
        const enemyIndex = currentRoom.enemies.findIndex(
          (e) => e.name.toLowerCase() === effect.target?.toLowerCase()
        );

        if (enemyIndex === -1) break;

        const enemy = currentRoom.enemies[enemyIndex];

        // Process status effects
        const statusEffect = interpretStatusEffect(effect.description);
        if (statusEffect) {
          if (!enemy.statusEffects) enemy.statusEffects = [];
          enemy.statusEffects.push({
            ...statusEffect,
            duration: effect.duration || statusEffect.duration,
          });

          // Apply immediate stat modifications
          if (statusEffect.statModifiers) {
            for (const mod of statusEffect.statModifiers) {
              applyStatModifier(enemy, mod);
            }
          }
        }

        // Process direct stat changes
        const statChange = interpretStatChange(effect.description);
        if (statChange) {
          applyStatModifier(enemy, statChange);
        }

        // Update enemy in room
        currentRoom.enemies[enemyIndex] = enemy;
        break;
      }

      case "ITEM_EFFECT": {
        if (!effect.target || !effect.description) break;

        // Find target item (in room or inventory)
        const roomItem = currentRoom.items.find(
          (i) => i.name.toLowerCase() === effect.target?.toLowerCase()
        );
        const inventoryItem = newState.player.inventory.find(
          (i) => i.name.toLowerCase() === effect.target?.toLowerCase()
        );
        const item = roomItem || inventoryItem;

        if (!item) break;

        // Process item state changes
        const itemChange = interpretItemChange(effect.description);
        if (itemChange) {
          applyItemChange(item, itemChange);

          // Update item in its location
          if (roomItem) {
            const itemIndex = currentRoom.items.findIndex(
              (i) => i.id === item.id
            );
            if (itemIndex !== -1) {
              currentRoom.items[itemIndex] = item;
            }
          } else if (inventoryItem) {
            const itemIndex = newState.player.inventory.findIndex(
              (i) => i.id === item.id
            );
            if (itemIndex !== -1) {
              newState.player.inventory[itemIndex] = item;
            }
          }
        }
        break;
      }

      case "ROOM_EFFECT": {
        if (!effect.description) break;

        // Process room state changes
        const roomChange = interpretRoomChange(effect.description);
        if (roomChange) {
          applyRoomChange(currentRoom, roomChange);
        }
        break;
      }
    }
  }

  // Update the room in state
  newState.rooms[newState.player.currentRoomId] = currentRoom;
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
    changes.condition = "broken";
  } else if (description.includes("enhanced")) {
    changes.condition = "enhanced";
  }

  // Check for property changes
  if (description.includes("glowing")) {
    changes.properties = changes.properties || [];
    changes.properties.push("glowing");
  }

  // Check for stat modifications
  const statMatch = description.match(/(\+|-)(\d+)\s+to\s+(\w+)/);
  if (statMatch) {
    changes.stats = changes.stats || {};
    changes.stats[statMatch[3]] = parseInt(statMatch[1] + statMatch[2]);
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
