import {
  GameState,
  Item,
  Enemy,
  Room,
  Player,
  StatusEffect,
  Equipment,
} from "../types/game";
import { generateRoom } from "./state";
import { openai } from "../lib/openai";
import { ACTION_PROMPT } from "./generation/actionGen";
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

export const takeItem = (gameState: GameState, itemId: string): GameState => {
  const currentRoom = gameState.rooms[gameState.player.currentRoomId];
  const itemIndex = currentRoom.items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return gameState;
  }

  // Remove item from room
  const [takenItem] = currentRoom.items.splice(itemIndex, 1);

  // Add item to player inventory
  return {
    ...gameState,
    player: {
      ...gameState.player,
      inventory: [...gameState.player.inventory, takenItem],
    },
    rooms: {
      ...gameState.rooms,
      [currentRoom.id]: currentRoom,
    },
  };
};

export const dropItem = (gameState: GameState, itemId: string): GameState => {
  const currentRoom = gameState.rooms[gameState.player.currentRoomId];
  const itemIndex = gameState.player.inventory.findIndex(
    (item) => item.id === itemId
  );

  if (itemIndex === -1) {
    return gameState;
  }

  // Remove item from inventory
  const [droppedItem] = gameState.player.inventory.splice(itemIndex, 1);

  // Add item to current room
  return {
    ...gameState,
    player: {
      ...gameState.player,
      inventory: [...gameState.player.inventory],
    },
    rooms: {
      ...gameState.rooms,
      [currentRoom.id]: {
        ...currentRoom,
        items: [...currentRoom.items, droppedItem],
      },
    },
  };
};

export async function processAction(
  state: GameState,
  action: string
): Promise<{ newState: GameState; message: string }> {
  let newState = { ...state };
  console.log("\n=== Processing Action ===");
  console.log("Player Action:", action);

  // Add player action to message history
  newState.messageHistory.push(`> ${action}`);

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
      // Add response to message history
      newState.messageHistory.push(interpretation.message);
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

    // Add response to message history
    newState.messageHistory.push(result.message);

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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    // Add error message to history
    newState.messageHistory.push(`Error: ${errorMessage}`);
    return {
      newState,
      message: errorMessage,
    };
  }
}

async function interpretAction(
  action: string,
  state: GameState
): Promise<LLMResponse> {
  const currentRoom = state.rooms[state.player.currentRoomId];

  const prompt = `
Current game state:
Room: ${JSON.stringify(currentRoom)}
Player: ${JSON.stringify(state.player)}

Player action: "${action}"`;

  console.log("Prompt sent to LLM:", prompt);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-2024-11-20",
    messages: [
      { role: "system", content: ACTION_PROMPT },
      { role: "user", content: prompt },
    ],
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
          description: effect.description,
          source: "effect",
          target: "player",
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
          console.log(`Attempting to gain item: ${effect.target}`);
          const { item, location, index } = findItem(newState, effect.target);

          if (item) {
            if (location === "room") {
              // Remove from room
              newState.rooms[newState.player.currentRoomId].items.splice(
                index,
                1
              );
              // Add to inventory
              newState.player.inventory.push(item);
              console.log(`Moved item from room to inventory: ${item.name}`);
            } else if (!location) {
              // If item doesn't exist in room or inventory, generate a new one
              console.log(`Generating new item: ${effect.target}`);
              const newItem = await generateItem(effect.target);
              newState.player.inventory.push(newItem);
              console.log(
                `Generated and added new item to inventory: ${newItem.name}`
              );
            }
          }
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

      case "MOVE_WITHIN_ROOM":
        if (effect.target) {
          console.log(`Moving within room to: ${effect.target}`);
          // Update player's position within the current room
          newState.player.position = {
            x: typeof effect.target === "object" ? effect.target.x : 0,
            y: typeof effect.target === "object" ? effect.target.y : 0,
            floor: newState.currentFloor,
          };
        }
        break;

      case "MOVE_BETWEEN_ROOMS":
        if (effect.target) {
          console.log(`Moving to room: ${effect.target}`);
          const targetRoomId = effect.target;

          // Check if the room exists and is accessible
          if (newState.rooms[targetRoomId]) {
            newState.player.currentRoomId = targetRoomId;
            newState.player.position = {
              x: newState.rooms[targetRoomId].position.x,
              y: newState.rooms[targetRoomId].position.y,
              floor: newState.rooms[targetRoomId].position.floor,
            };

            // Discover connecting rooms
            const newRoom = newState.rooms[targetRoomId];
            Object.values(newRoom.doors).forEach((door) => {
              if (!newState.rooms[door.destinationRoomId]) {
                // Generate the new room if it doesn't exist
                // Note: This would need to be made async if we want to generate rooms here
                console.log(
                  `Room ${door.destinationRoomId} discovered but not yet generated`
                );
              }
            });
          }
        }
        break;

      case "KNOWLEDGE_GAIN":
        if (effect.description) {
          console.log(`Gaining knowledge: ${effect.description}`);
          if (!newState.player.knowledge) {
            newState.player.knowledge = [];
          }

          // Add the new knowledge
          newState.player.knowledge.push({
            type: effect.target || "general",
            description: effect.description,
            timestamp: Date.now(),
          });

          // Update any relevant game state based on knowledge
          if (effect.target === "secret" || effect.target === "puzzle") {
            newState.player.stats.wisdom =
              (newState.player.stats.wisdom || 0) + 1;
          }
        }
        break;

      case "USE_ITEM":
        if (effect.target) {
          console.log(`Using item: ${effect.target}`);
          const { item, location, index } = findItem(newState, effect.target);

          if (item && location) {
            // Apply item effects
            if (item.statusEffects) {
              item.statusEffects.forEach((statusEffect) => {
                if (!newState.player.statusEffects) {
                  newState.player.statusEffects = [];
                }
                newState.player.statusEffects.push({
                  ...statusEffect,
                  duration: statusEffect.duration || EFFECT_DURATIONS.TEMPORARY,
                });
              });
            }

            // Apply stat changes from item
            if (item.stats) {
              Object.entries(item.stats).forEach(([stat, value]) => {
                if (value) {
                  if (stat === "healing") {
                    newState.player.health = Math.min(
                      newState.player.health + value,
                      newState.player.derivedStats.maxHealth
                    );
                    message += `\nHealed for ${value} HP.`;
                  } else {
                    newState.player.stats[stat] =
                      (newState.player.stats[stat] || 0) + value;
                    message += `\n${
                      stat.charAt(0).toUpperCase() + stat.slice(1)
                    } ${value >= 0 ? "increased" : "decreased"} by ${Math.abs(
                      value
                    )}.`;
                  }
                }
              });
            }

            // Handle consumable items
            if (item.isConsumable) {
              // Remove the item from its location after use
              if (location === "inventory") {
                newState.player.inventory.splice(index, 1);
                console.log(
                  `Consumed and removed item from inventory: ${item.name}`
                );
              } else if (location === "room") {
                newState.rooms[newState.player.currentRoomId].items.splice(
                  index,
                  1
                );
                console.log(
                  `Consumed and removed item from room: ${item.name}`
                );
              }
              message += `\nConsumed ${item.name}.`;
            } else {
              // Update item state if it's not consumed
              if (effect.itemModification) {
                const modifiedItem = {
                  ...item,
                  ...effect.itemModification,
                };

                if (location === "inventory") {
                  newState.player.inventory[index] = modifiedItem;
                } else if (location === "room") {
                  newState.rooms[newState.player.currentRoomId].items[index] =
                    modifiedItem;
                }
                message += `\nUsed ${item.name}.`;
              }
            }

            // Handle charges if the item has them
            if (item.additionalAttributes?.charges !== undefined) {
              const charges = item.additionalAttributes.charges - 1;
              if (charges <= 0) {
                message += `\n${item.name} has been depleted.`;
                if (location === "inventory") {
                  newState.player.inventory.splice(index, 1);
                } else if (location === "room") {
                  newState.rooms[newState.player.currentRoomId].items.splice(
                    index,
                    1
                  );
                }
              } else {
                const updatedItem = {
                  ...item,
                  additionalAttributes: {
                    ...item.additionalAttributes,
                    charges,
                  },
                };
                if (location === "inventory") {
                  newState.player.inventory[index] = updatedItem;
                } else if (location === "room") {
                  newState.rooms[newState.player.currentRoomId].items[index] =
                    updatedItem;
                }
                message += `\n${item.name} has ${charges} charges remaining.`;
              }
            }
          }
        }
        break;

      case "ATTACK":
        if (effect.target) {
          console.log(`Attacking target: ${effect.target}`);
          const currentRoom = newState.rooms[newState.player.currentRoomId];
          const targetEnemy = currentRoom.enemies.find(
            (enemy) => enemy.name.toLowerCase() === effect.target?.toLowerCase()
          );

          if (targetEnemy) {
            // Calculate damage based on player stats and equipped weapon
            const baseDamage = newState.player.stats.strength || 1;
            const weaponDamage =
              newState.player.equipment?.weapon?.stats?.damage || 0;
            const totalDamage = baseDamage + weaponDamage;

            // Apply damage to enemy
            targetEnemy.health -= totalDamage;
            message += `\nYou deal ${totalDamage} damage to ${targetEnemy.name}.`;

            // Check if enemy is defeated
            if (targetEnemy.health <= 0) {
              targetEnemy.isAlive = false;
              message += `\n${targetEnemy.name} has been defeated!`;

              // Handle enemy drops if any
              if (targetEnemy.drops) {
                targetEnemy.drops.forEach((drop) => {
                  currentRoom.items.push(drop);
                });
                message += `\n${targetEnemy.name} dropped some items.`;
              }
            }
          }
        }
        break;

      case "EQUIP_ITEM":
        if (effect.target) {
          console.log(`Equipping item: ${effect.target}`);
          const { item, location, index } = findItem(newState, effect.target);

          if (item && location === "inventory") {
            // Determine equipment slot based on item type
            let slot: keyof Equipment | undefined;
            switch (item.type) {
              case "weapon":
                slot = "weapon";
                break;
              case "armor":
                slot = "armor";
                break;
              case "shield":
                slot = "offhand";
                break;
              case "ring":
              case "amulet":
                slot = "accessory";
                break;
            }

            if (slot) {
              // If there's an item already equipped in that slot, move it to inventory
              const currentEquipped = newState.player.equipment[slot];
              if (currentEquipped) {
                newState.player.inventory.push(currentEquipped);
                message += `\nUnequipped ${currentEquipped.name}.`;
              }

              // Equip the new item
              newState.player.equipment[slot] = item;
              newState.player.inventory.splice(index, 1);
              message += `\nEquipped ${item.name}.`;

              // Update player stats based on equipped item
              if (item.stats) {
                Object.entries(item.stats).forEach(([stat, value]) => {
                  if (value) {
                    newState.player.stats[stat] =
                      (newState.player.stats[stat] || 0) + value;
                  }
                });
              }
            }
          }
        }
        break;

      case "UNEQUIP_ITEM":
        if (effect.target) {
          console.log(`Unequipping item: ${effect.target}`);
          // Find the equipped item
          let unequippedItem: Item | undefined;
          let slot: keyof Equipment | undefined;

          Object.entries(newState.player.equipment).forEach(
            ([equipSlot, item]) => {
              if (
                item &&
                item.name.toLowerCase() === effect.target?.toLowerCase()
              ) {
                unequippedItem = item;
                slot = equipSlot as keyof Equipment;
              }
            }
          );

          if (unequippedItem && slot) {
            // Remove item's stat bonuses
            if (unequippedItem.stats) {
              Object.entries(unequippedItem.stats).forEach(([stat, value]) => {
                if (value) {
                  newState.player.stats[stat] =
                    (newState.player.stats[stat] || 0) - value;
                }
              });
            }

            // Move item to inventory and clear equipment slot
            newState.player.inventory.push(unequippedItem);
            newState.player.equipment[slot] = undefined;
            message += `\nUnequipped ${unequippedItem.name}.`;
          }
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
