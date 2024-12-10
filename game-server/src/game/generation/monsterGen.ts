import monsters from "../../../data/monsters/monsters.json";
import { getRandomItems } from "./utils";

export const generateMonsterPrompt = (theme: string) => {
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

Examples of monsters we can use as inspiration:
${JSON.stringify(getRandomItems(monsters, 5))}

NOTE: When generating a monster's details, focus on what distinguishes the monster from other similar creatures, even if it's slight. 
Incorporate small bonuses, drawbacks, status effects, behavioral ticks, specific emotional state, or unique lore elements that make the monster stand out. 
Be sure to mention about this specific monster:
1. current emotional state
2. current behavior, eg. is it pacing around, standing still, etc.
3. current physical state, eg. is it bleeding, injured, etc.
4. current mental state, eg. is it hallucinating, panicking, etc.
5. probably has not noticed the player yet, since it's the first time the player has encountered this monster.

Emphasize any unique behaviors, abilities, weaknesses, or mysterious traits that are specific to this particular monster. 
IT IS VERY IMPORTANT to include small details that differentiate this monster from others of its type. For common monsters, these differences might be purely visual, behavioral, or based on minor abilities, without delving into high-level magical or legendary attributes.

Generate an enemy with the following schema:

{
    "name": "string - name of the enemy",
    
    "description": "string - description of the enemy",
    
    "detailedStats": "A comprehensive string that includes specific and detailed statistics about the enemy. This encompasses unique physical characteristics, minor bonuses or disadvantages, special traits, or subtle variations in standard monster metrics that distinguish it from base creatures of the same type. Examples include strength, health, size, attack power, armor class, move speed, damage types, special abilities, resistances, vulnerabilities, and any other quantitative or measurable attributes that influence the enemy's interaction with adventurers. Focus on what's different about this current instance of the enemy, that DIFFERS from the base creature.",
    
    "detailedStatuses": "A detailed string that provides a detailed description of the enemy's current conditions, environmental effects, or status phenomena. This highlights unique interactions, behavioral tendencies, or ongoing effects that the enemy may have on creatures or other objects within the area. Examples include elemental properties, enchantments, auras, magical effects, behavioral patterns, environmental adaptations, or any other status-related features that create a distinct presence for the enemy. Focus on what's different about this current instance of the enemy, that DIFFERS from the base creature.",
    
    "detailedAttributes": "A detailed string that outlines additional attributes covering the enemy's materials, build quality, rarity, habitat preferences, lore snippets, unique weaknesses or resistances, and any other distinguishing features. This may include how formidable or ancient the enemy is, unique biological or magical traits, inscriptions or symbols, thematic elements, social structure, and any other characteristics that set it apart from other enemies of the same type. For higher rarity enemies, this can also encompass unique abilities, curses, blessings, or legendary backstories. Focus on what's different about this current instance of the enemy, that DIFFERS from the base creature."
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
}`;

  return prompt;
};
