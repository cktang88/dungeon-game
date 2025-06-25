import { Type } from "@google/genai";

// Schema for Item generation
export const itemSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    weight: { type: Type.NUMBER, nullable: true },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes"],
};

// Schema for Enemy generation
export const enemySchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    appearance: { type: Type.STRING },
    attacks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes", "appearance", "attacks"],
};

// Schema for Door generation
export const doorSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    destinationRoomName: { type: Type.STRING },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes", "destinationRoomName"],
};

// Schema for Room generation
export const roomSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: itemSchema,
    },
    enemies: {
      type: Type.ARRAY,
      items: enemySchema,
    },
    connections: {
      type: Type.OBJECT,
      properties: {
        north: { ...doorSchema, nullable: true },
        south: { ...doorSchema, nullable: true },
        east: { ...doorSchema, nullable: true },
        west: { ...doorSchema, nullable: true },
      },
    },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes", "items", "enemies", "connections"],
};

// Schema for AbilityScores
export const abilityScoresSchema = {
  type: Type.OBJECT,
  properties: {
    strength: { type: Type.NUMBER },
    dexterity: { type: Type.NUMBER },
    constitution: { type: Type.NUMBER },
    intelligence: { type: Type.NUMBER },
    wisdom: { type: Type.NUMBER },
    charisma: { type: Type.NUMBER },
  },
  required: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
};

// Schema for DerivedStats
export const derivedStatsSchema = {
  type: Type.OBJECT,
  properties: {
    hitPoints: { type: Type.NUMBER },
    armorClass: { type: Type.NUMBER },
    initiative: { type: Type.NUMBER },
  },
  required: ["hitPoints", "armorClass", "initiative"],
};

// Schema for StatusEffect
export const statusEffectSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    target: { type: Type.STRING },
    duration: { type: Type.NUMBER, nullable: true },
    startTurn: { type: Type.NUMBER, nullable: true },
    isActive: { type: Type.BOOLEAN, nullable: true },
    isPermanent: { type: Type.BOOLEAN, nullable: true },
    statsApplied: { type: Type.BOOLEAN, nullable: true },
    statModifiers: { 
      type: Type.OBJECT, 
      nullable: true,
      properties: {
        strength: { type: Type.NUMBER, nullable: true },
        dexterity: { type: Type.NUMBER, nullable: true },
        constitution: { type: Type.NUMBER, nullable: true },
        intelligence: { type: Type.NUMBER, nullable: true },
        wisdom: { type: Type.NUMBER, nullable: true },
        charisma: { type: Type.NUMBER, nullable: true },
      }
    },
    derivedStatsModifiers: { 
      type: Type.OBJECT, 
      nullable: true,
      properties: {
        hitPoints: { type: Type.NUMBER, nullable: true },
        armorClass: { type: Type.NUMBER, nullable: true },
        initiative: { type: Type.NUMBER, nullable: true },
      }
    },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes", "target"],
};

// Schema for Player
export const playerSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, nullable: true },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    detailedStats: { type: Type.STRING },
    detailedStatuses: { type: Type.STRING },
    detailedAttributes: { type: Type.STRING },
    level: { type: Type.NUMBER },
    class: { type: Type.STRING },
    experience: { type: Type.NUMBER },
    baseAbilityScores: abilityScoresSchema,
    currentAbilityScores: abilityScoresSchema,
    baseDerivedStats: derivedStatsSchema,
    currentDerivedStats: derivedStatsSchema,
    inventory: {
      type: Type.ARRAY,
      items: itemSchema,
    },
    statusEffects: {
      type: Type.ARRAY,
      items: statusEffectSchema,
    },
    currentRoomName: { type: Type.STRING },
    roomsVisitedHistory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["name", "description", "detailedStats", "detailedStatuses", "detailedAttributes", "level", "class", "experience", "baseAbilityScores", "currentAbilityScores", "baseDerivedStats", "currentDerivedStats", "inventory", "statusEffects", "currentRoomName", "roomsVisitedHistory"],
};

// Schema for GameState
export const gameStateSchema = {
  type: Type.OBJECT,
  properties: {
    player: playerSchema,
    rooms: {
      type: Type.OBJECT,
      properties: {
        "Entrance Hall": { ...roomSchema, nullable: true }
      }
    },
    messageHistory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    currentRoomId: { type: Type.STRING },
    previousRoomId: { type: Type.STRING, nullable: true },
    sessionId: { type: Type.STRING },
  },
  required: ["player", "rooms", "messageHistory", "currentRoomId", "sessionId"],
};

export const actionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    action: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        target: { type: Type.STRING, nullable: true },
        using: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          nullable: true,
        },
      },
      required: ["type"],
    },
    effects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          targetName: { type: Type.STRING },
          targetType: { type: Type.STRING },
          targetHiddenStats: { type: Type.STRING },
          targetHiddenStatuses: { type: Type.STRING },
          targetHiddenAttributes: { type: Type.STRING },
        },
        required: [
          "name",
          "description",
          "targetName",
          "targetType",
          "targetHiddenStats",
          "targetHiddenStatuses",
          "targetHiddenAttributes",
        ],
      },
    },
    message: { type: Type.STRING },
  },
  required: ["action", "effects", "message"],
};