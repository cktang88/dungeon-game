export interface Item {
  id: string;
  name: string;
  description: string;
  type:
    | "weapon"
    | "armor"
    | "key"
    | "consumable"
    | "quest"
    | "misc"
    | "treasure"
    | "material"
    | string;
  state?: string;
  isUsable?: boolean;
  isConsumable?: boolean;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
  };
  statusEffects?: StatusEffect[];
  additionalAttributes?: {
    spellLevels?: {
      [key: string]: number;
    };
    charges?: number;
  };
  requirements?: {
    attunement?: string;
    class?: string[];
    abilityScores?: {
      [key in keyof AbilityScores]?: number;
    };
  };
  weight?: string;
  value?: number;
  properties?: string[];
  rarity?: string;
  isUnique?: boolean;
  isQuestItem?: boolean;
  isMagic?: boolean;
  isArtifact?: boolean;
  isRare?: boolean;
  isUncommon?: boolean;
  isCommon?: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  health: number;
  maxHealth: number;
  level: number;
  damage: number;
  defense: number;
  isAlive: boolean;
  isBoss?: boolean;
  drops?: Item[];
  statusEffects?: Array<{
    name: string;
    duration: number;
    magnitude: number;
  }>;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  items: Item[];
  enemies: Enemy[];
  doors: {
    north?: Door;
    south?: Door;
    east?: Door;
    west?: Door;
  };
  visited: boolean;
  position: Position;
  events?: Array<{
    trigger: string;
    position?: string;
    message?: string;
    effects?: any[];
  }>;
}

export interface Door {
  id: string;
  description: string;
  isLocked: boolean;
  requiredKeyId?: string;
  destinationRoomId: string;
}

export interface AbilityScores {
  strength: number; // Physical power, melee combat
  dexterity: number; // Agility, ranged combat, defense
  constitution: number; // Health, stamina
  intelligence: number; // Mental acuity, knowledge
  wisdom: number; // Perception, insight
  charisma: number; // Personality, leadership
}

// Derived stats from ability scores
export interface DerivedStats {
  maxHealth: number; // Based on constitution
  armorClass: number; // Based on dexterity and armor
  initiative: number; // Based on dexterity
  carryCapacity: number; // Based on strength
}

export interface Player {
  id?: string;
  name?: string;
  health: number;
  level: number;
  experience: number;
  inventory: Item[];
  currentRoomId: string;
  position: Position;
  abilityScores: AbilityScores;
  derivedStats: DerivedStats;
  stats: Record<string, number>;
  equipment: Equipment;
  statusEffects?: StatusEffect[];
  knowledge?: Knowledge[];
}

export interface GameState {
  player: Player;
  currentFloor: number;
  rooms: Record<string, Room>;
  messageHistory: string[];
}

// Client-specific types
export interface GameResponse {
  gameState: GameState;
  message?: string;
  error?: string;
}

export interface StartGameResponse {
  sessionId: string;
  gameState: GameState;
}

export interface StatusEffect {
  name: string;
  description: string;
  source: string;
  target: string;
  duration: number;
  magnitude: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Knowledge {
  type: string;
  description: string;
  timestamp?: number;
}
