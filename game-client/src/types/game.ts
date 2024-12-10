export interface DescribedEntity {
  name: string;
  description: string;
}

export interface Item extends DescribedEntity {}

export interface Enemy extends DescribedEntity {
  appearance: string;
  attacks: string[];
  drops: Item[];
}

export interface Room extends DescribedEntity {
  items: Item[];
  enemies: Enemy[];
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
  initiative: number; // Based on dexterity and status effects
}

export interface StatusEffect extends DescribedEntity {
  source: string; // who initiated the status effect, should be of form "item-<type>-<id>" or "enemy-<type>-<id>" or "player-<id>", etc.
  target: string;
  duration?: number;
  startTurn?: number;
}

export interface Player extends DescribedEntity {
  level: number;
  class: string;
  experience: number;
  baseAbilityScores: AbilityScores;
  currentAbilityScores: AbilityScores; // modified by equipment and status effects, etc.
  baseDerivedStats: DerivedStats;
  currentDerivedStats: DerivedStats; // modified by equipment and status effects, etc.
  inventory: Item[];
  statusEffects: StatusEffect[];
  currentRoomName: string;
  roomsVisitedHistory: string[]; // string of room names
}

export interface GameState {
  player: Player;
  rooms: Room[];
  messageHistory: string[];
  currentRoomId: string;
  previousRoomId: string | null;
  sessionId: string;
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
