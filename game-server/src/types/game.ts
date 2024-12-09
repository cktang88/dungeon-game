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

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  offhand?: Item;
  accessory?: Item;
}

export interface Player {
  id: string;
  name: string;
  currentRoomId: string;
  position: Position;
  inventory: Item[];
  equipment: Equipment;
  stats: {
    health: number;
    stamina: number;
    strength: number;
    dexterity: number;
    [key: string]: number;
  };
  statusEffects?: StatusEffect[];
  knowledge?: Knowledge[];
}

export interface Position {
  x: number;
  y: number;
}

export interface RoomEvent {
  trigger: "position" | "item" | "enemy";
  position?: string;
  message: string;
  effect?: string;
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

export interface Knowledge {
  type: string;
  description: string;
  timestamp: number;
}
