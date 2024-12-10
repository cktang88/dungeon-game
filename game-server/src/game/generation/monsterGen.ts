import monsters from "../../../data/monsters/monsters.json";
import { Player } from "../../types/game";
import { getRandomItems } from "./utils";

export const generateMonsterPrompt = (theme: string, player: Player) => {
  const prompt = `Generate an enemy that is related to the theme of ${theme}. 

You can take inspiration from the examples of enemies below to get a sense of the type of enemy you should generate, but you may generate a new enemy as well, or a variation of one of the below enemies.

Focus on generating interesting enemies, challenging enemies, or enemies that might complement the dungeon's environment or narrative. Consider enemies that fit the player's current level and abilities, or that provide unique obstacles and opportunities for strategic combat.

Tips for Creating Balanced and Engaging Enemy Stats
  - **Align with Player Progression:**
    Ensure that enemy power scales appropriately with player levels to maintain game balance.
  
  - **Consider Threat Level and Variety:**
    Introduce a range of enemies with different challenge ratings and abilities to keep encounters diverse and engaging.
    
  - **Encourage Tactical Combat:**
    Design enemies with abilities that require strategic thinking and teamwork from players.
    
  - **Integrate Lore and Story:**
    Connect enemies to the game’s narrative, making them more meaningful and enhancing immersion.
    
  - **Balance Mechanical Benefits:**
    Weigh the enemy's offensive and defensive capabilities to ensure fair and engaging combat.
    
  - **Provide Clear Descriptions:**
    Ensure that enemy abilities and behaviors are clearly defined to avoid confusion during gameplay.
    
  - **Include Weaknesses and Resistances:**
    Adding vulnerabilities or resistances can encourage diverse strategies and interactions.

The player state is:
${JSON.stringify(player)}

Examples of monsters we can use as inspiration:
${JSON.stringify(getRandomItems(monsters, 10))}

NOTE: when generating enemy's hidden stats, statuses, and attributes, focus on what distinguishes the enemy from other similar enemies, even if it's slight.

Generate an enemy with the following schema:
{
  "enemy": {
    "name": "string - name of the enemy",
    "description": "string - description of the enemy",
    "hiddenDetailedStats": "string - long, detailed description of the hidden stats of the enemy",
    "hiddenDetailedStatuses": "string - long, detailed description of the hidden statuses of the enemy",
    "hiddenDetailedAttributes": "string - long, detailed description of the hidden attributes of the enemy",
  }
}


Detailed Breakdown of Enemy Stats
a. **Name**
   - **Purpose:** Identifies the enemy uniquely.
   - **Considerations:** Should be descriptive and fit the enemy's lore and appearance.

b. **Type**
   - **Purpose:** Categorizes the enemy, determining its general behavior and relevant mechanics.
   - **Categories:**
     - **Humanoid:** Goblins, Orcs, etc.
     - **Undead:** Skeletons, Zombies, etc.
     - **Elemental:** Fire Elementals, Water Sprites, etc.
     - **Beast:** Wolves, Bears, etc.
     - **Aberration:** Mind Flayers, Beholders, etc.
     - **Dragon:** Various dragon types.
     - **Construct:** Golems, Animated Armors, etc.
     - **Fiend:** Demons, Devils, etc.

c. **Challenge Rating**
   - **Purpose:** Indicates the difficulty level of the enemy, helping DMs balance encounters.
   - **Categories:**
     - **Low (CR 1-4):** Suitable for early levels.
     - **Medium (CR 5-10):** Suitable for mid-level players.
     - **High (CR 11-16):** Challenging for higher-level players.
     - **Epic (CR 17-30):** Extremely difficult, often boss-level.

d. **Description**
   - **Purpose:** Provides a narrative context, enhancing immersion and storytelling.
   - **Elements:** Appearance, origin, behavior, any notable features or lore.

e. **Abilities**
   - **Purpose:** Defines special abilities or traits the enemy possesses.
   - **Examples:**
     - **Spellcasting:** Can cast spells to hinder players.
     - **Regeneration:** Can recover hit points over time.
     - **Shape-shifting:** Can alter its form to gain advantages.

f. **Stats**
   - **Purpose:** Defines the mechanical aspects of the enemy.
   - **Elements:**
     - **Armor Class (AC):** Reflects the enemy's defense.
     - **Hit Points (HP):** Indicates the enemy's durability.
     - **Speed:** Movement capabilities.
     - **Ability Scores:** Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.

g. **Actions**
   - **Purpose:** Describes the actions the enemy can take during combat.
   - **Elements:** Name, description, damage types.

h. **Legendary Actions** (if applicable)
   - **Purpose:** Allows powerful enemies to take extra actions outside their turn.
   - **Elements:** Name, description, damage types.

i. **Resistances**
   - **Purpose:** Denotes damage types the enemy resists.
   - **Examples:** Fire, Cold, Bludgeoning.

j. **Weaknesses**
   - **Purpose:** Denotes damage types the enemy is vulnerable to.
   - **Examples:** Radiant, Thunder, Poison.

k. **Immunities**
   - **Purpose:** Denotes damage types or conditions the enemy is immune to.
   - **Examples:** Poison, Psychic, Charm.

m. **Languages**
   - **Purpose:** Indicates what languages the enemy can speak or understand.

n. **CR**
   - **Purpose:** Challenge Rating, indicating the relative difficulty of the enemy.

Examples of enemies that fit the schema:

{
  "name": "Shadow Stalker",
  "type": "Humanoid",
  "challengeRating": 5,
  "description": "A sinister figure cloaked in darkness, able to meld seamlessly into the shadows. Its eyes glow faintly red, and it moves with unnatural silence.",
  "abilities": [
    "Stealth Mastery: Advantage on Dexterity (Stealth) checks.",
    "Shadowmeld: Can become invisible in dim light or darkness."
  ],
  "stats": {
    "armorClass": 15,
    "hitPoints": 75,
    "speed": {
      "walk": 30,
      "fly": 0,
      "swim": 0
    },
    "strength": 14,
    "dexterity": 18,
    "constitution": 12,
    "intelligence": 10,
    "wisdom": 14,
    "charisma": 11
  },
  "actions": [
    {
      "name": "Shadow Strike",
      "description": "Makes a melee weapon attack with advantage. On hit, deals extra necrotic damage.",
      "damage": {
        "dice": "2d6",
        "type": "Necrotic"
      }
    },
    {
      "name": "Dagger Throw",
      "description": "Throws a dagger at a target within 30 feet.",
      "damage": {
        "dice": "1d4",
        "type": "Piercing"
      }
    }
  ],
  "legendaryActions": [],
  "resistances": [
    "Necrotic"
  ],
  "weaknesses": [
    "Radiant"
  ],
  "immunities": [],
  "languages": "Common, Elvish",
  "cr": 5
}

{
  "name": "Fire Elemental",
  "type": "Elemental",
  "challengeRating": 5,
  "description": "A swirling mass of flames taking the shape of a humanoid. Its body crackles with intense heat, and it leaves scorch marks wherever it moves.",
  "abilities": [
    "Ignite: Any flammable object hit by the elemental catches fire.",
    "Flame Body: Melee attacks deal additional fire damage."
  ],
  "stats": {
    "armorClass": 17,
    "hitPoints": 102,
    "speed": {
      "walk": 50,
      "fly": 0,
      "swim": 0
    },
    "strength": 20,
    "dexterity": 15,
    "constitution": 20,
    "intelligence": 6,
    "wisdom": 10,
    "charisma": 7
  },
  "actions": [
    {
      "name": "Touch of Flame",
      "description": "A touch attack that deals fire damage and can ignite objects.",
      "damage": {
        "dice": "2d6",
        "type": "Fire"
      }
    },
    {
      "name": "Fire Whirlwind",
      "description": "Creates a whirlwind of fire in a 20-foot radius. Creatures in the area must make a Dexterity saving throw or take fire damage.",
      "damage": {
        "dice": "3d6",
        "type": "Fire"
      }
    }
  ],
  "legendaryActions": [],
  "resistances": [
    "Fire"
  ],
  "weaknesses": [
    "Cold"
  ],
  "immunities": [
    "Fire",
    "Poison"
  ],
  "languages": "Ignan",
  "cr": 5
}

{
  "name": "Ancient Wyrm",
  "type": "Dragon",
  "challengeRating": 10,
  "description": "A colossal dragon with scales that shimmer like emeralds. Its eyes burn with ancient wisdom, and it exudes an aura of raw power.",
  "abilities": [
    "Legendary Resistance: If the dragon fails a saving throw, it can choose to succeed instead.",
    "Frightful Presence: Enemies within 120 feet must make a Wisdom saving throw or become frightened."
  ],
  "stats": {
    "armorClass": 22,
    "hitPoints": 500,
    "speed": {
      "walk": 40,
      "fly": 80,
      "swim": 40
    },
    "strength": 30,
    "dexterity": 10,
    "constitution": 30,
    "intelligence": 18,
    "wisdom": 15,
    "charisma": 23
  },
  "actions": [
    {
      "name": "Bite",
      "description": "A powerful bite attack that deals piercing and fire damage.",
      "damage": {
        "dice": "4d10",
        "type": "Piercing"
      }
    },
    {
      "name": "Tail Sweep",
      "description": "Sweeps its massive tail, knocking back and damaging nearby foes.",
      "damage": {
        "dice": "3d8",
        "type": "Bludgeoning"
      }
    },
    {
      "name": "Fire Breath",
      "description": "Exhales a 90-foot cone of fire. Creatures in the area must make a Dexterity saving throw or take fire damage.",
      "damage": {
        "dice": "12d6",
        "type": "Fire"
      }
    }
  ],
  "legendaryActions": [
    {
      "name": "Detect",
      "description": "The dragon makes a Wisdom (Perception) check."
    },
    {
      "name": "Tail Attack",
      "description": "The dragon makes a tail attack."
    },
    {
      "name": "Wing Attack",
      "description": "The dragon beats its wings. Each creature within 15 feet must make a Dexterity saving throw, taking bludgeoning damage and being knocked prone on a failed save."
    }
  ],
  "resistances": [
    "Bludgeoning",
    "Piercing",
    "Slashing"
  ],
  "weaknesses": [
    "Cold"
  ],
  "immunities": [
    "Fire",
    "Poison"
  ],
  "languages": "Common, Draconic",
  "cr": 10
}

{
  "name": "Necrotic Revenant",
  "type": "Undead",
  "challengeRating": 7,
  "description": "A tormented spirit clad in tattered remnants of armor, emanating a chilling aura of death and decay.",
  "abilities": [
    "Life Drain: Melee attacks deal necrotic damage and heal the revenant.",
    "Spectral Chains: Can bind a target's movement, restraining them."
  ],
  "stats": {
    "armorClass": 16,
    "hitPoints": 136,
    "speed": {
      "walk": 30,
      "fly": 0,
      "swim": 0
    },
    "strength": 18,
    "dexterity": 14,
    "constitution": 16,
    "intelligence": 10,
    "wisdom": 12,
    "charisma": 8
  },
  "actions": [
    {
      "name": "Life Drain",
      "description": "A claw attack that deals necrotic damage. The revenant regains hit points equal to half the damage dealt.",
      "damage": {
        "dice": "3d6",
        "type": "Necrotic"
      }
    },
    {
      "name": "Spectral Chains",
      "description": "Attempts to restrain a target within 15 feet. The target must make a Strength saving throw or be restrained until the end of its next turn.",
      "damage": {}
    }
  ],
  "legendaryActions": [],
  "resistances": [
    "Necrotic"
  ],
  "weaknesses": [
    "Radiant"
  ],
  "immunities": [
    "Poison",
    "Condition Immunities": "Charmed, Exhausted, Frightened"
  ],
  "languages": "Common",
  "cr": 7
}`;

  return prompt;
};
