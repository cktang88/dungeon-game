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
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
  };
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
  position: {
    x: number;
    y: number;
  };
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

export interface StatusEffect {
  name: string;
  duration: number;
  magnitude: number;
}

export interface Player {
  health: number;
  level: number;
  experience: number;
  inventory: Item[];
  currentRoomId: string;
  abilityScores: AbilityScores;
  derivedStats: DerivedStats;
  stats: Record<string, number>;
  statusEffects?: StatusEffect[];
  knowledge?: Array<{
    type: string;
    description: string;
  }>;
}

export interface GameState {
  player: Player;
  currentFloor: number;
  rooms: Record<string, Room>;
  messageHistory: string[];
}

export interface GameAction {
  type: string;
  target?: string;
  item?: string;
  direction?: string;
}
