export interface Item {
  id: string; // should be of form "item-<type>-<id>"
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
    | "potion"
    | "scroll"
    | "wand"
    | "ring"
    | "amulet"
    | "trinket"
    | "artifact"
    | string;
  state?: string;
  isUsable: boolean;
  isConsumable: boolean;
  stats?: {
    damage?: number;
    defense?: number;
    healing?: number;
  };
  statusEffects: StatusEffect[]; // status effects that the item is currently afflicted with
  additionalAttributes: {
    spellLevels?: {
      [key: string]: number;
    };
    charges?: number;
  };
  requirements: {
    attunement?: string;
    class?: string[];
    abilityScores?: {
      [key in keyof AbilityScores]?: number;
    };
  };
  weight: number;
  value: number;
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

export interface EnemyAction {
  name: string;
  description: string;
  damage: {
    amount: number;
    type: string;
  };
}

export interface EnemyStats {
  armorClass: number;
  hitPoints: number;
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
  };
  abilityScores: AbilityScores;
}

export interface Enemy {
  id: string; // should be of form "enemy-<type>-<id>"
  name: string;
  description: string;
  level: number;
  isAlive: boolean;
  isBoss?: boolean;
  drops?: Item[];
  baseStats: EnemyStats;
  currentStats: EnemyStats; // modified by status effects, game actions, etc.
  actions: EnemyAction[];
  legendaryActions: EnemyAction[];
  resistances: string[];
  weaknesses: string[];
  immunities: string[];
  languages: string;
  cr: number;
  statusEffects?: StatusEffect[]; // status effects that the enemy is currently afflicted with
}

export interface Room {
  id: string; // should be of form "room-<name>-<id>"
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
}

export interface Door {
  id: string; // should be of form "door-<id>"
  description: string;
  isLocked: boolean;
  requiredKeyId?: string; // should be of form "item-key-<id>"
  destinationRoomId: string;
  isOpen: boolean;
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
  hitPoints: number; // Based on constitution
  armorClass: number; // Based on dexterity and armor
  initiative: number; // Based on dexterity
  carryCapacity: number; // Based on strength
  currentWeight: number; // Current weight of all carried items
  isEncumbered: boolean; // Whether the player is carrying too much weight
}

export interface StatusEffect {
  name: string;
  description: string;
  source: string; // who initiated the status effect, should be of form "item-<type>-<id>" or "enemy-<type>-<id>" or "player-<id>", etc.
  target: string;
  duration?: number;
  isActive: boolean;
  isPermanent: boolean;
  id: string; // should be of form "status-effect-<id>"
  startTurn?: number;
  statsApplied?: boolean;
  statModifiers?: { [key in keyof AbilityScores]?: number }[];
  derivedStatsModifiers?: { [key in keyof DerivedStats]?: number }[];
  shouldRevert?: boolean;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  offhand?: Item;
  accessory?: Item;
}

export interface Player {
  id: string; // should be of form "player-<id>"
  name: string;
  level: number;
  experience: number;
  baseAbilityScores: AbilityScores;
  currentAbilityScores: AbilityScores; // modified by equipment and status effects, etc.
  baseDerivedStats: DerivedStats;
  currentDerivedStats: DerivedStats; // modified by equipment and status effects, etc.
  currentRoomId: string;
  previousRoomId: string | null;
  position: Position;
  inventory: Item[];
  equipment: Equipment;
  statusEffects: StatusEffect[];
  knowledge: Knowledge[];
  sessionId: string;
}

export interface Position {
  x: number;
  y: number;
  floorDepth: number;
}

export interface GameState {
  player: Player;
  currentFloor: Floor;
  rooms: Record<string, Room>;
  messageHistory: string[];
  currentRoomId: string;
  previousRoomId: string | null;
  sessionId: string;
}

export interface GameAction {
  type: string;
  target?: string;
  item?: string;
  direction?: string;
}

export interface Knowledge {
  id: string; // should be of form "knowledge-<type>-<id>"
  type: string;
  description: string;
  timestamp: number;
  target: string; // what entity the knowledge is about, should be of form "enemy-<type>-<id>" or "item-<type>-<id>" or "room-<name>-<id>", etc.
  isFact: boolean;
  isRumor: boolean;
  isLore: boolean;
}

export interface Floor {
  name: string;
  floorDepth: number;
  theme: Theme;
}

export interface Theme {
  name: string;
  environment: string;
  floraFauna: string;
  oddities: string;
  monsters: string[];
  enemyTypes: string[];
  afflictions: string[];
}
