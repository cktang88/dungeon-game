export interface DescribedEntity {
  name: string;
  description: string;
  // these three hidden fields are used to store lots more information about the entity, so that the LLM can "remember" the stats and statuses of the entity over a long period of time
  hiddenDetailedStats?: string;
  hiddenDetailedStatuses?: string;
  hiddenDetailedAttributes?: string;
}

export interface Item extends DescribedEntity {}

export interface Enemy extends DescribedEntity {
  appearance: string;
  attacks: string[];
  // NOTE: drops are lazily calculated when monster is killed
}

export interface Door extends DescribedEntity {
  destinationRoomName: string;
}

export interface Room extends DescribedEntity {
  items: Item[];
  enemies: Enemy[];
  connections: {
    north?: Door;
    south?: Door;
    east?: Door;
    west?: Door;
  };
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
  currentWeight: number; // Current weight of all carried items, in pounds
  isEncumbered: boolean; // Whether the player is carrying too much weight
}

export interface StatusEffect extends DescribedEntity {
  target: string; // name of entity that is affected by the status effect
  duration?: number; // number of turns the status effect lasts
  startTurn?: number; // turn number when the status effect was applied
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
  roomsVisitedHistory: string[];
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
