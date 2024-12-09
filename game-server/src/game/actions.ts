import { OpenAI } from "openai";
import { GameState, Room, Item, Enemy } from "../types/game";
import { generateRoom } from "./state";

const SYSTEM_PROMPT = `You are an AI game master for a text-based dungeon crawler game. 
Your role is to interpret player actions in natural language and determine their consequences.
You should maintain the game's dark fantasy atmosphere while being creative and engaging.

You can modify the game state based on player actions. For example:
- If a player picks up an item, remove it from the room and add it to their inventory
- If a player attacks an enemy, calculate damage based on their stats and equipment
- If a player uses an item, apply its effects (healing, damage, etc.)
- If a player moves to a new room, update their location
- If a player interacts with the environment, describe the results

Keep responses concise but descriptive. Focus on the immediate consequences of actions.
If an action is impossible or illogical, explain why it can't be done.

The game state includes:
- Player stats (health, level, experience, etc.)
- Player inventory
- Current room and its contents
- Available exits and their states (locked/unlocked)
- Enemies and their states

Respond with both a narrative description and the specific game state changes that should occur.`;

interface ActionResult {
  newState: GameState;
  message: string;
}

interface StateChange {
  type:
    | "MODIFY_HEALTH"
    | "ADD_ITEM"
    | "REMOVE_ITEM"
    | "MOVE_ROOM"
    | "MODIFY_ENEMY"
    | "ADD_EXPERIENCE";
  payload: any;
}

const interpretAction = async (
  action: string,
  gameState: GameState,
  openai: OpenAI
): Promise<{ message: string; stateChanges: StateChange[] }> => {
  const currentRoom = gameState.rooms[gameState.player.currentRoomId];

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Current game state:
Room: ${JSON.stringify(currentRoom)}
Player: ${JSON.stringify(gameState.player)}

Player action: "${action}"

Respond in the following JSON format:
{
  "message": "Narrative description of what happens",
  "stateChanges": [
    {
      "type": "MODIFY_HEALTH" | "ADD_ITEM" | "REMOVE_ITEM" | "MOVE_ROOM" | "MODIFY_ENEMY" | "ADD_EXPERIENCE",
      "payload": {
        // Relevant data for the state change
      }
    }
  ]
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
};

const applyStateChanges = (
  state: GameState,
  changes: StateChange[]
): GameState => {
  let newState = { ...state };

  for (const change of changes) {
    switch (change.type) {
      case "MODIFY_HEALTH":
        newState = {
          ...newState,
          player: {
            ...newState.player,
            health: Math.max(
              0,
              Math.min(
                newState.player.maxHealth,
                newState.player.health + change.payload.amount
              )
            ),
          },
        };
        break;

      case "ADD_ITEM":
        newState = {
          ...newState,
          player: {
            ...newState.player,
            inventory: [
              ...newState.player.inventory,
              change.payload.item as Item,
            ],
          },
        };
        break;

      case "REMOVE_ITEM":
        newState = {
          ...newState,
          player: {
            ...newState.player,
            inventory: newState.player.inventory.filter(
              (item) => item.id !== change.payload.itemId
            ),
          },
        };
        break;

      case "MOVE_ROOM":
        // Generate new room if it doesn't exist
        if (!newState.rooms[change.payload.roomId]) {
          const newRoom = generateRoom(newState.currentFloor, "dungeon");
          newState.rooms[newRoom.id] = newRoom;
        }
        newState = {
          ...newState,
          player: {
            ...newState.player,
            currentRoomId: change.payload.roomId,
          },
        };
        break;

      case "MODIFY_ENEMY":
        const room = newState.rooms[newState.player.currentRoomId];
        const enemyIndex = room.enemies.findIndex(
          (e) => e.id === change.payload.enemyId
        );
        if (enemyIndex !== -1) {
          const updatedEnemies = [...room.enemies];
          updatedEnemies[enemyIndex] = {
            ...updatedEnemies[enemyIndex],
            ...change.payload.changes,
          } as Enemy;
          newState = {
            ...newState,
            rooms: {
              ...newState.rooms,
              [newState.player.currentRoomId]: {
                ...room,
                enemies: updatedEnemies,
              },
            },
          };
        }
        break;

      case "ADD_EXPERIENCE":
        newState = {
          ...newState,
          player: {
            ...newState.player,
            experience: newState.player.experience + change.payload.amount,
          },
        };
        // Level up if enough experience
        const expToNextLevel = Math.pow(newState.player.level, 2) * 100;
        if (newState.player.experience >= expToNextLevel) {
          newState.player.level += 1;
          newState.player.maxHealth += 10;
          newState.player.health = newState.player.maxHealth;
          newState.player.stats = {
            strength: newState.player.stats.strength + 2,
            dexterity: newState.player.stats.dexterity + 2,
            intelligence: newState.player.stats.intelligence + 2,
          };
        }
        break;
    }
  }

  return newState;
};

export const handleGameAction = async (
  action: string,
  state: GameState,
  openai: OpenAI
): Promise<ActionResult> => {
  const { message, stateChanges } = await interpretAction(
    action,
    state,
    openai
  );
  const newState = applyStateChanges(state, stateChanges);
  return { newState, message };
};
