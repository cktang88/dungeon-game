import {
  GameState,
  Item,
  Enemy,
  Room,
  Player,
  StatusEffect,
  Equipment,
  AbilityScores,
  DerivedStats,
  Knowledge,
} from "../types/game";
import { generateRoom, handleItemsMoved } from "./state";
import { openai } from "../lib/openai";
import { ACTION_PROMPT } from "./generation/actionGen";

interface ActionEffect {
  type: string;
  description: string;
  targetId?: string; // should be of form "enemy-<type>-<id>" or "item-<type>-<id>" or "room-<name>-<id>", etc.
  statChange?: {
    statAffectedName?: keyof AbilityScores | keyof DerivedStats;
    magnitude?: number;
  };
  statusEffect?: StatusEffect;
  itemModified?: Item;
  itemsMoved?: {
    itemId: string; // eg. 'item-<type>-<id>'
    from: string; // "player", "enemy", "room", "environment"
    fromSpecificId?: string; // eg. which enemy, which chest, what part of the room, etc.
    to: string; // "player", "enemy", "room", "environment"
    toSpecificId?: string; // eg. which enemy, which chest, what part of the room, etc.
  };
  conditions?: {
    requires?: string[];
    consumes?: string[];
  };
  knowledge?: Knowledge;
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

function processStatusEffects(state: GameState, turnNumber: number): GameState {
  const newState = { ...state };

  // Process player status effects
  if (newState.player.statusEffects) {
    const activeEffects: StatusEffect[] = [];
    const expiredEffects: StatusEffect[] = [];

    newState.player.statusEffects.forEach((effect) => {
      if (!effect.isActive) return;

      // Check if effect has expired
      if (!effect.isPermanent && effect.duration !== undefined) {
        if (!effect.startTurn) {
          effect.startTurn = turnNumber;
        }

        const elapsedTurns = turnNumber - effect.startTurn;
        if (elapsedTurns >= effect.duration) {
          expiredEffects.push(effect);
          return;
        }
      }

      activeEffects.push(effect);

      // Apply stat modifications if not already applied
      if (!effect.statsApplied) {
        // Apply ability score modifiers
        if (effect.statModifiers) {
          effect.statModifiers.forEach((modifiers) => {
            Object.entries(modifiers).forEach(([stat, value]) => {
              const abilityScoreStat = stat as keyof AbilityScores;
              newState.player.currentAbilityScores[abilityScoreStat] += value;
            });
          });
        }

        // Apply derived stat modifiers
        if (effect.derivedStatsModifiers) {
          effect.derivedStatsModifiers.forEach((modifiers) => {
            Object.entries(modifiers).forEach(([stat, value]) => {
              const derivedStat = stat as keyof DerivedStats;
              newState.player.currentDerivedStats[derivedStat] += value;
            });
          });
        }

        effect.statsApplied = true;
      }
    });

    // Handle expired effects
    expiredEffects.forEach((effect) => {
      if (effect.startTurn && effect.shouldRevert) {
        const turnsActive = turnNumber - effect.startTurn;

        // Revert ability score modifiers
        if (effect.statModifiers) {
          effect.statModifiers.forEach((modifiers) => {
            Object.entries(modifiers).forEach(([stat, value]) => {
              const abilityScoreStat = stat as keyof AbilityScores;
              const totalChange = value * turnsActive;
              newState.player.currentAbilityScores[abilityScoreStat] -=
                totalChange;
            });
          });
        }

        // Revert derived stat modifiers
        if (effect.derivedStatsModifiers) {
          effect.derivedStatsModifiers.forEach((modifiers) => {
            Object.entries(modifiers).forEach(([stat, value]) => {
              const derivedStat = stat as keyof DerivedStats;
              const totalChange = value * turnsActive;
              newState.player.currentDerivedStats[derivedStat] -= totalChange;
            });
          });
        }
      }
    });

    // Update status effects list
    newState.player.statusEffects = activeEffects;
  }

  // Process enemy status effects
  const currentRoom = newState.rooms[newState.player.currentRoomId];
  if (currentRoom.enemies) {
    currentRoom.enemies.forEach((enemy) => {
      if (enemy.statusEffects) {
        const activeEffects: StatusEffect[] = [];

        enemy.statusEffects.forEach((effect) => {
          if (!effect.isActive) return;

          // Check if effect has expired
          if (!effect.isPermanent && effect.duration !== undefined) {
            if (!effect.startTurn) {
              effect.startTurn = turnNumber;
            }

            const elapsedTurns = turnNumber - effect.startTurn;
            if (elapsedTurns >= effect.duration) {
              // Handle stat modifications reversion if needed
              if (
                effect.startTurn &&
                effect.shouldRevert &&
                effect.statModifiers
              ) {
                const turnsActive = turnNumber - effect.startTurn;
                effect.statModifiers.forEach((modifiers) => {
                  Object.entries(modifiers).forEach(([stat, value]) => {
                    const abilityScoreStat = stat as keyof AbilityScores;
                    const totalChange = value * turnsActive;
                    enemy.currentStats.abilityScores[abilityScoreStat] -=
                      totalChange;
                  });
                });
              }
              return;
            }
          }

          activeEffects.push(effect);

          // Apply stat modifications if not already applied
          if (!effect.statsApplied && effect.statModifiers) {
            effect.statModifiers.forEach((modifiers) => {
              Object.entries(modifiers).forEach(([stat, value]) => {
                const abilityScoreStat = stat as keyof AbilityScores;
                enemy.currentStats.abilityScores[abilityScoreStat] += value;
              });
            });
            effect.statsApplied = true;
          }
        });

        enemy.statusEffects = activeEffects;
      }
    });
  }

  return newState;
}

// Helper function to find an item in either room or inventory
function findItem(
  state: GameState,
  itemId: string
): {
  item: Item | undefined;
  location: "room" | "inventory" | undefined;
  index: number;
} {
  const currentRoom = state.rooms[state.player.currentRoomId];

  // Check room items
  const roomIndex = currentRoom.items.findIndex((item) => item.id === itemId);
  if (roomIndex !== -1) {
    return {
      item: currentRoom.items[roomIndex],
      location: "room",
      index: roomIndex,
    };
  }

  // Check inventory items
  const inventoryIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId
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
    const result = await applyEffects(newState, interpretation, Date.now());
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
  interpretation: LLMResponse,
  turnNumber: number
): Promise<{ newState: GameState; message: string }> {
  let newState = { ...state };
  let message = interpretation.message;

  // Process any active status effects first
  newState = processStatusEffects(newState, turnNumber);

  const currentRoom = newState.rooms[newState.player.currentRoomId];

  for (const effect of interpretation.effects) {
    console.log(`Applying effect: ${effect.type}`, effect);

    switch (effect.type) {
      case "STAT_CHANGE":
        if (effect.targetId && effect.statChange) {
          console.log(
            `Applying stat change to ${effect.targetId}:`,
            effect.statChange
          );

          // Handle player stats
          if (effect.targetId === newState.player.id) {
            if (
              effect.statChange.statAffectedName &&
              effect.statChange.magnitude
            ) {
              const stat = effect.statChange.statAffectedName.toLowerCase();
              // Update ability scores if it's an ability score
              if (stat in newState.player.currentAbilityScores) {
                console.log(
                  `Changing ability score ${stat} by ${effect.statChange.magnitude}`
                );
                newState.player.currentAbilityScores[
                  stat as keyof AbilityScores
                ] += effect.statChange.magnitude;
              }
              // Update derived stats if needed
              const derivedStats = calculateDerivedStats(
                newState.player.currentAbilityScores,
                newState.player.level
              );
              newState.player.currentDerivedStats = derivedStats;
            }
          }
          // Handle enemy stats
          else if (effect.targetId.startsWith("enemy")) {
            const currentRoom = newState.rooms[newState.player.currentRoomId];
            const enemy = currentRoom.enemies.find(
              (e) => e.id === effect.targetId
            );
            if (
              enemy &&
              effect.statChange.statAffectedName &&
              effect.statChange.magnitude
            ) {
              const stat = effect.statChange.statAffectedName.toLowerCase();
              if (stat === "hitpoints") {
                enemy.currentStats.hitPoints += effect.statChange.magnitude;
              } else if (stat in enemy.currentStats.abilityScores) {
                enemy.currentStats.abilityScores[stat as keyof AbilityScores] +=
                  effect.statChange.magnitude;
              }
            }
          }
        }
        break;

      case "STATUS_EFFECT":
        if (effect.targetId && effect.statusEffect) {
          console.log(
            `Applying status effect to ${effect.targetId}:`,
            effect.statusEffect
          );

          const statusEffect: StatusEffect = {
            id: `status-effect-${effect.targetId}-${effect.statusEffect.name}-${effect.statusEffect.duration}`,
            name: effect.statusEffect.name,
            description: effect.statusEffect.description,
            source: "effect",
            target: effect.targetId,
            duration: effect.statusEffect.duration,
            isActive: effect.statusEffect.isActive ?? true,
            isPermanent: effect.statusEffect.isPermanent ?? false,
          };

          // Apply to player
          if (effect.targetId === newState.player.id) {
            if (!newState.player.statusEffects) {
              newState.player.statusEffects = [];
            }
            newState.player.statusEffects.push(statusEffect);
            message += `\nYou are affected by ${statusEffect.name}.`;
          }
          // Apply to enemy
          else if (effect.targetId.startsWith("enemy")) {
            const currentRoom = newState.rooms[newState.player.currentRoomId];
            const enemy = currentRoom.enemies.find(
              (e) => e.id === effect.targetId
            );
            if (enemy) {
              if (!enemy.statusEffects) {
                enemy.statusEffects = [];
              }
              enemy.statusEffects.push(statusEffect);
              message += `\n${enemy.name} is affected by ${statusEffect.name}.`;
            }
          }
          // Apply to item
          else if (effect.targetId.startsWith("item")) {
            const { item } = findItem(newState, effect.targetId);
            if (item) {
              if (!item.statusEffects) {
                item.statusEffects = [];
              }
              item.statusEffects.push(statusEffect);
              message += `\n${item.name} is affected by ${statusEffect.name}.`;
            }
          }
        }
        break;

      case "ITEM_MODIFICATION":
        if (effect.itemModified) {
          const targetId = effect.targetId || effect.itemModified.id;
          console.log(`Modifying item: ${targetId}`);
          const { item, location, index } = findItem(newState, targetId);

          if (item && location !== undefined && index !== -1) {
            const modifiedItem = { ...item };

            // Update basic properties
            if (effect.itemModified.name) {
              modifiedItem.name = effect.itemModified.name;
            }
            if (effect.itemModified.description) {
              modifiedItem.description = effect.itemModified.description;
            }
            if (effect.itemModified.type) {
              modifiedItem.type = effect.itemModified.type;
            }
            if (effect.itemModified.state) {
              modifiedItem.state = effect.itemModified.state;
            }
            if (effect.itemModified.isUsable !== undefined) {
              modifiedItem.isUsable = effect.itemModified.isUsable;
            }
            if (effect.itemModified.isConsumable !== undefined) {
              modifiedItem.isConsumable = effect.itemModified.isConsumable;
            }

            // Update stats
            if (effect.itemModified.stats) {
              modifiedItem.stats = {
                ...(modifiedItem.stats || {}),
                ...effect.itemModified.stats,
              };
            }

            // Update additional attributes
            if (effect.itemModified.additionalAttributes) {
              modifiedItem.additionalAttributes = {
                ...(modifiedItem.additionalAttributes || {}),
                ...effect.itemModified.additionalAttributes,
              };
            }

            // Update requirements
            if (effect.itemModified.requirements) {
              modifiedItem.requirements = {
                ...(modifiedItem.requirements || {}),
                ...effect.itemModified.requirements,
              };
            }

            // Update other properties
            if (effect.itemModified.weight !== undefined) {
              modifiedItem.weight = effect.itemModified.weight;
            }
            if (effect.itemModified.value !== undefined) {
              modifiedItem.value = effect.itemModified.value;
            }
            if (effect.itemModified.properties) {
              modifiedItem.properties = effect.itemModified.properties;
            }
            if (effect.itemModified.rarity) {
              modifiedItem.rarity = effect.itemModified.rarity;
            }

            // Update flags
            if (effect.itemModified.isUnique !== undefined) {
              modifiedItem.isUnique = effect.itemModified.isUnique;
            }
            if (effect.itemModified.isQuestItem !== undefined) {
              modifiedItem.isQuestItem = effect.itemModified.isQuestItem;
            }
            if (effect.itemModified.isMagic !== undefined) {
              modifiedItem.isMagic = effect.itemModified.isMagic;
            }
            if (effect.itemModified.isArtifact !== undefined) {
              modifiedItem.isArtifact = effect.itemModified.isArtifact;
            }
            if (effect.itemModified.isRare !== undefined) {
              modifiedItem.isRare = effect.itemModified.isRare;
            }
            if (effect.itemModified.isUncommon !== undefined) {
              modifiedItem.isUncommon = effect.itemModified.isUncommon;
            }
            if (effect.itemModified.isCommon !== undefined) {
              modifiedItem.isCommon = effect.itemModified.isCommon;
            }

            // Update or add status effects
            if (effect.statusEffect) {
              if (!modifiedItem.statusEffects) {
                modifiedItem.statusEffects = [];
              }
              modifiedItem.statusEffects.push(effect.statusEffect);
            }

            // Update the item in its location
            if (location === "inventory") {
              newState.player.inventory[index] = modifiedItem;
            } else if (location === "room") {
              newState.rooms[newState.player.currentRoomId].items[index] =
                modifiedItem;
            }

            message += `\n${item.name} has been modified.`;
          }
        }
        break;

      case "GAIN_ITEM":
        if (effect.itemsMoved && Array.isArray(effect.itemsMoved)) {
          console.log(
            `Processing GAIN_ITEM with itemsMoved array:`,
            effect.itemsMoved
          );

          for (const moveData of effect.itemsMoved) {
            console.log(`Moving item:`, moveData);

            // Convert the from/to locations to the format expected by handleItemsMoved
            let sourceLocation = "";
            let targetLocation = "";

            // Handle source location
            if (moveData.from === "player") {
              sourceLocation = "inventory";
            } else if (moveData.from === "enemy") {
              sourceLocation = moveData.fromSpecificId || "";
            } else if (moveData.from === "room") {
              sourceLocation =
                moveData.fromSpecificId || newState.player.currentRoomId;
            }

            // Handle target location
            if (moveData.to === "player") {
              targetLocation = "inventory";
            } else if (moveData.to === "enemy") {
              targetLocation = moveData.toSpecificId || "";
            } else if (moveData.to === "room") {
              targetLocation =
                moveData.toSpecificId || newState.player.currentRoomId;
            }

            if (sourceLocation && targetLocation) {
              console.log(
                `Moving item from ${sourceLocation} to ${targetLocation}`
              );
              newState = handleItemsMoved(
                newState,
                sourceLocation,
                targetLocation,
                [moveData.itemId]
              );
            }
          }
        } else if (effect.itemsMoved) {
          // Handle single itemsMoved object (not in array)
          console.log(
            `Processing GAIN_ITEM with single itemsMoved:`,
            effect.itemsMoved
          );
          const moveData = effect.itemsMoved;

          let sourceLocation =
            moveData.fromSpecificId ||
            (moveData.from === "player"
              ? "inventory"
              : moveData.from === "enemy"
              ? moveData.fromSpecificId!
              : moveData.from === "room"
              ? newState.player.currentRoomId
              : "");

          let targetLocation =
            moveData.to === "player"
              ? "inventory"
              : moveData.to === "enemy"
              ? moveData.toSpecificId!
              : moveData.to === "room"
              ? newState.player.currentRoomId
              : moveData.toSpecificId || "";

          if (sourceLocation && targetLocation) {
            console.log(
              `Moving item from ${sourceLocation} to ${targetLocation}`
            );
            newState = handleItemsMoved(
              newState,
              sourceLocation,
              targetLocation,
              [moveData.itemId]
            );
          }
        } else if (effect.targetId) {
          // Legacy format where targetId is the item to gain
          console.log(
            `Attempting to gain item with legacy format: ${effect.targetId}`
          );
          const currentRoom = newState.rooms[newState.player.currentRoomId];
          const itemIndex = currentRoom.items.findIndex(
            (item) => item.id === effect.targetId
          );

          if (itemIndex !== -1) {
            // Remove item from room
            const [takenItem] = currentRoom.items.splice(itemIndex, 1);
            // Add to inventory
            newState.player.inventory.push(takenItem);
            console.log(`Moved item from room to inventory: ${takenItem.name}`);
            message += `\nYou pick up the ${takenItem.name}.`;
          } else {
            console.log(`Item ${effect.targetId} not found in current room`);
          }
        }
        break;

      case "LOSE_ITEM":
        if (effect.itemsMoved) {
          // Handle itemsMoved object
          console.log(
            `Processing LOSE_ITEM with itemsMoved:`,
            effect.itemsMoved
          );
          const moveData = effect.itemsMoved;

          let sourceLocation =
            moveData.from === "player"
              ? "inventory"
              : moveData.from === "enemy"
              ? moveData.fromSpecificId!
              : moveData.from === "room"
              ? `room-${newState.player.currentRoomId}`
              : moveData.fromSpecificId || "";

          let targetLocation =
            moveData.to === "player"
              ? "inventory"
              : moveData.to === "enemy"
              ? moveData.toSpecificId!
              : moveData.to === "room"
              ? moveData.toSpecificId || `room-${newState.player.currentRoomId}`
              : moveData.toSpecificId || "";

          if (sourceLocation && targetLocation) {
            console.log(
              `Moving item from ${sourceLocation} to ${targetLocation}`
            );
            newState = handleItemsMoved(
              newState,
              sourceLocation,
              targetLocation,
              [moveData.itemId]
            );
          }
        } else if (effect.targetId) {
          // Legacy format - just remove from inventory
          console.log(`Removing item: ${effect.targetId}`);
          newState.player.inventory = newState.player.inventory.filter(
            (item) => item.id !== effect.targetId
          );
        }
        break;

      case "MOVE_BETWEEN_ROOMS":
        if (effect.targetId) {
          console.log(`Moving to room: ${effect.targetId}`);
          const targetRoomId = effect.targetId;

          // Check if the room exists and is accessible
          if (newState.rooms[targetRoomId]) {
            // Update previous room before changing current room
            newState.player.previousRoomId = newState.player.currentRoomId;
            newState.player.currentRoomId = targetRoomId;
            newState.player.position = {
              x: newState.rooms[targetRoomId].position.x,
              y: newState.rooms[targetRoomId].position.y,
              floorDepth: newState.rooms[targetRoomId].position.floorDepth,
            };
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
          const knowledgeType = effect.targetId || "general";
          const knowledgeId = `knowledge-${knowledgeType}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          // Get knowledge type from LLM output
          const isFact = effect.knowledge?.isFact ?? false;
          const isRumor = effect.knowledge?.isRumor ?? false;
          const isLore = effect.knowledge?.isLore ?? false;

          // Determine the target entity this knowledge is about
          let target = "general";
          if (
            effect.targetId?.startsWith("enemy-") ||
            effect.targetId?.startsWith("item-") ||
            effect.targetId?.startsWith("room-")
          ) {
            target = effect.targetId;
          } else if (effect.targetId) {
            // If target doesn't have proper prefix, add one based on type
            target = `${knowledgeType}-${effect.targetId}`;
          }

          newState.player.knowledge.push({
            id: knowledgeId,
            type: knowledgeType,
            description: effect.description,
            timestamp: Date.now(),
            target,
            isFact,
            isRumor,
            isLore,
          });
        }
        break;

      case "USE_ITEM":
        if (effect.targetId) {
          console.log(`Using item: ${effect.targetId}`);
          const { item, location, index } = findItem(newState, effect.targetId);

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
                    const newHealth = Math.min(
                      newState.player.currentDerivedStats.hitPoints + value,
                      newState.player.baseDerivedStats.hitPoints
                    );
                    newState.player.currentDerivedStats.hitPoints = newHealth;
                    message += `\nHealed for ${value} HP.`;
                  } else if (stat === "damage" || stat === "defense") {
                    // These are equipment stats, they should modify derived stats
                    if (stat === "damage") {
                      // Add to weapon damage
                      message += `\nDamage increased by ${value}.`;
                    } else {
                      // Add to armor class
                      newState.player.currentDerivedStats.armorClass += value;
                      message += `\nArmor Class increased by ${value}.`;
                    }
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
              if (effect.itemModified) {
                const modifiedItem = {
                  ...item,
                  ...effect.itemModified,
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
        if (effect.targetId) {
          console.log(`Attacking target: ${effect.targetId}`);
          const currentRoom = newState.rooms[newState.player.currentRoomId];
          const targetEnemy = currentRoom.enemies.find(
            (enemy) =>
              enemy.name.toLowerCase() === effect.targetId?.toLowerCase()
          );

          if (targetEnemy) {
            // Calculate damage based on player stats and equipped weapon
            const strengthMod = Math.floor(
              (newState.player.currentAbilityScores.strength - 10) / 2
            );
            const baseDamage = 1 + strengthMod;
            const weaponDamage =
              newState.player.equipment?.weapon?.stats?.damage || 0;
            const totalDamage = baseDamage + weaponDamage;

            // Apply damage to enemy
            targetEnemy.currentStats.hitPoints -= totalDamage;
            message += `\nYou deal ${totalDamage} damage to ${targetEnemy.name}.`;

            // Check if enemy is defeated
            if (targetEnemy.currentStats.hitPoints <= 0) {
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
        if (effect.targetId) {
          console.log(`Equipping item: ${effect.targetId}`);
          const { item, location, index } = findItem(newState, effect.targetId);

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
                // Remove current item's stats
                if (currentEquipped.stats) {
                  if (currentEquipped.stats.defense) {
                    newState.player.currentDerivedStats.armorClass -=
                      currentEquipped.stats.defense;
                  }
                }
                newState.player.inventory.push(currentEquipped);
                message += `\nUnequipped ${currentEquipped.name}.`;
              }

              // Equip the new item
              newState.player.equipment[slot] = item;
              newState.player.inventory.splice(index, 1);
              message += `\nEquipped ${item.name}.`;

              // Apply new item's stats
              if (item.stats) {
                if (item.stats.defense) {
                  newState.player.currentDerivedStats.armorClass +=
                    item.stats.defense;
                }
              }
            }
          }
        }
        break;

      case "UNEQUIP_ITEM":
        if (effect.targetId) {
          console.log(`Unequipping item: ${effect.targetId}`);
          // Find the equipped item
          let unequippedItem: Item | undefined;
          let slot: keyof Equipment | undefined;

          Object.entries(newState.player.equipment).forEach(
            ([equipSlot, item]) => {
              if (
                item &&
                item.name.toLowerCase() === effect.targetId?.toLowerCase()
              ) {
                unequippedItem = item;
                slot = equipSlot as keyof Equipment;
              }
            }
          );

          if (unequippedItem && slot) {
            // Remove item's stat bonuses
            if (unequippedItem.stats) {
              if (unequippedItem.stats.defense) {
                newState.player.currentDerivedStats.armorClass -=
                  unequippedItem.stats.defense;
              }
            }

            // Move item to inventory and clear equipment slot
            newState.player.inventory.push(unequippedItem);
            newState.player.equipment[slot] = undefined;
            message += `\nUnequipped ${unequippedItem.name}.`;
          }
        }
        break;

      case "MOVE":
        if (effect.targetId) {
          console.log(`Attempting to move: ${effect.targetId}`);
          const door =
            newState.rooms[newState.player.currentRoomId].doors[
              effect.targetId.toLowerCase() as keyof Room["doors"]
            ];
          if (door && !door.isLocked) {
            console.log(`Moving to room: ${door.destinationRoomId}`);

            // Check if the destination room needs to be generated
            if (!newState.rooms[door.destinationRoomId]) {
              // Calculate new room position based on direction
              const currentRoom = newState.rooms[newState.player.currentRoomId];
              const newPosition = { ...currentRoom.position };

              switch (effect.targetId.toLowerCase()) {
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
                "dungeon", // You might want to pass a proper theme based on the floor
                newState,
                newPosition
              );

              // Add the room to the game state
              newState.rooms[door.destinationRoomId] = newRoom;
            }

            // Update previous room before changing current room
            newState.player.previousRoomId = newState.player.currentRoomId;
            newState.player.currentRoomId = door.destinationRoomId;
          }
        }
        break;

      case "ITEMS_MOVED":
        if (effect.itemsMoved) {
          const data = effect.itemsMoved;
          console.log(
            `Moving item from ${data.from}${
              data.fromSpecificId ? ` (${data.fromSpecificId})` : ""
            } to ${data.to}${
              data.toSpecificId ? ` (${data.toSpecificId})` : ""
            }`
          );

          // Convert the from/to locations to the format expected by handleItemsMoved
          let sourceLocation = "";
          let targetLocation = "";

          // Handle source location
          if (data.from === "player") {
            sourceLocation = "inventory";
          } else if (data.from === "enemy") {
            sourceLocation = data.fromSpecificId || "";
          } else if (data.from === "room") {
            sourceLocation =
              data.fromSpecificId || newState.player.currentRoomId;
          }

          // Handle target location
          if (data.to === "player") {
            targetLocation = "inventory";
          } else if (data.to === "enemy") {
            targetLocation = data.toSpecificId || "";
          } else if (data.to === "room") {
            targetLocation = data.toSpecificId || newState.player.currentRoomId;
          }

          if (sourceLocation && targetLocation) {
            console.log(
              `Resolved locations - from: ${sourceLocation} to: ${targetLocation}`
            );
            newState = handleItemsMoved(
              newState,
              sourceLocation,
              targetLocation,
              [data.itemId]
            );
          } else {
            console.log("Failed to resolve source or target location", {
              sourceLocation,
              targetLocation,
              data,
            });
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

// Helper functions for applying changes

function applyItemChange(item: Item, changes: Partial<Item>): void {
  Object.assign(item, changes);
}

function applyRoomChange(room: Room, changes: any): void {
  Object.assign(room, changes);
}

// Add helper function to calculate derived stats
function calculateDerivedStats(
  abilityScores: AbilityScores,
  level: number
): DerivedStats {
  // Calculate ability modifiers
  const conMod = Math.floor((abilityScores.constitution - 10) / 2);
  const dexMod = Math.floor((abilityScores.dexterity - 10) / 2);
  const strMod = Math.floor((abilityScores.strength - 10) / 2);

  return {
    hitPoints: (10 + conMod) * level, // Base HP + CON mod per level
    armorClass: 10 + dexMod, // Base AC + DEX mod
    initiative: dexMod, // Initiative is based on DEX mod
    carryCapacity: abilityScores.strength * 15, // Each point of STR = 15 lbs capacity
  };
}
