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
import { applyEffects, generateRoom, handleItemsMoved } from "./state";
import { openai } from "../lib/openai";
import { ACTION_PROMPT } from "./generation/actionGen";

interface LLMResponse {
  action: {
    type: string;
    target?: string;
    using?: string[];
  };
  effects: any[];
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
  const currentRoom = newState.rooms[newState.player.currentRoomName];
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
  const currentRoom = state.rooms[state.player.currentRoomName];

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
  const currentRoom = gameState.rooms[gameState.player.currentRoomName];
  const itemIndex = currentRoom.items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return gameState;
  }

  // Remove item from room
  const [takenItem] = currentRoom.items.splice(itemIndex, 1);

  gameState.rooms[gameState.player.currentRoomName] = currentRoom;

  // Add item to player inventory
  return {
    ...gameState,
    player: {
      ...gameState.player,
      inventory: [...gameState.player.inventory, takenItem],
    },
    rooms: {
      ...gameState.rooms,
    },
  };
};

export const dropItem = (gameState: GameState, itemId: string): GameState => {
  const currentRoom = gameState.rooms[gameState.player.currentRoomName];
  const itemIndex = gameState.player.inventory.findIndex(
    (item) => item.id === itemId
  );

  if (itemIndex === -1) {
    return gameState;
  }

  // Remove item from inventory
  const [droppedItem] = gameState.player.inventory.splice(itemIndex, 1);

  gameState.rooms[gameState.player.currentRoomName].items.push(droppedItem);

  // Add item to current room
  return {
    ...gameState,
    player: {
      ...gameState.player,
      inventory: [...gameState.player.inventory],
    },
    rooms: {
      ...gameState.rooms,
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
    const interpretation: LLMResponse = await interpretAction(action, newState);
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
    const result = await applyEffects(interpretation.effects, newState);
    newState = result;

    console.log("=== Action Processing Complete ===\n");

    return {
      newState,
      message: interpretation.message,
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
  const currentRoom = state.rooms[state.player.currentRoomName];

  const prompt = `
Current game state:
Room: ${JSON.stringify(currentRoom)}
Player: ${JSON.stringify(state.player)}

Player action: "${action}"`;

  console.log("Prompt sent to LLM:", prompt);

  const response = await openai.chat.completions.create({
    // model: "gpt-4o-2024-11-20",
    model: "gpt-4o-mini",
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

// Add helper function to calculate total inventory weight
function calculateInventoryWeight(inventory: Item[]): number {
  return inventory.reduce((total, item) => total + (item.weight || 0), 0);
}

// Add helper function to calculate derived stats
function calculateDerivedStats(
  abilityScores: AbilityScores,
  level: number,
  inventory: Item[] = []
): DerivedStats {
  // Calculate ability modifiers
  const conMod = Math.floor((abilityScores.constitution - 10) / 2);
  const dexMod = Math.floor((abilityScores.dexterity - 10) / 2);
  const strMod = Math.floor((abilityScores.strength - 10) / 2);

  return {
    hitPoints: (10 + conMod) * level, // Base HP + CON mod per level
    armorClass: 10 + dexMod, // Base AC + DEX mod
    initiative: dexMod, // Initiative is based on DEX mod
  };
}
