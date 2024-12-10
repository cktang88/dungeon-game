import giantItems from "../../../data/items/giant_items.json";
import smallItems from "../../../data/items/small_items.json";
import goodItems from "../../../data/items/good_items.json";
import weirdItems from "../../../data/items/weird_items.json";
import { Player } from "../../types/game";
import { getRandomItems } from "./utils";

export type ITEM_TYPES = "giant" | "small" | "good" | "weird";

export function generateItemPrompt(
  theme: string,
  itemType: ITEM_TYPES,
  player: Player
) {
  let itemExamples = ``;
  if (itemType === "giant") {
    itemExamples = `
    Examples of giant items:
    ${JSON.stringify(getRandomItems(giantItems, 10))}
  `;
  } else if (itemType === "small") {
    itemExamples = `
    Examples of small items:
    ${JSON.stringify(getRandomItems(smallItems, 10))}
  `;
  } else if (itemType === "good") {
    itemExamples = `
    Examples of good items:
    ${JSON.stringify(getRandomItems(goodItems, 10))}
  `;
  } else if (itemType === "weird") {
    itemExamples = `
    Examples of weird items:
    ${JSON.stringify(getRandomItems(weirdItems, 10))}
  `;
  }

  const prompt = `Generate an item that is related to the theme of ${theme}. 
  
  You can take inspiration from the examples of items below to get a sense of the type of item you should generate, but you may generate a new item as well, or a variation of one of the below items.

  Focus on generating interesting items, or useful items, or items that might be useful when combined with other items in the player's inventory.
  Or items the player might use or might fit the player's playstyle or might be useful in a specific situation.
  Items should be useable based on the player's current stats and level.

  Tips for Creating Balanced and Engaging Item Stats
    Align with Character Progression:
    Ensure that item power scales appropriately with character levels to maintain game balance.

    Consider Rarity and Availability:
    Rarer items should have more potent or unique effects, making them valuable and sought after.
    
    Encourage Strategic Use:
    Design items that offer versatility or require strategic thinking, rather than providing straightforward power boosts.
    
    Integrate Lore and Story:
    Connect items to the game’s narrative, making them more meaningful and memorable for players.
    
    Balance Mechanical Benefits:
    Weigh the benefits against potential drawbacks to prevent items from becoming overpowered.
    
    Provide Clear Descriptions:
    Ensure that item effects are clearly defined to avoid confusion during gameplay.
    
    Limit Attunement Slots:
    Be mindful of the maximum number of items that require attunement to prevent characters from becoming too powerful.


  The player state is:
  ${JSON.stringify(player)}

  The type of item we want to generate is: ${itemType}

  Examples of items we can use as inspiration:

    ${itemExamples}
    
    NOTE: when generating item's hidden stats, statuses, and attributes, focus on what distinguishes the item from other similar items, even if it's slight.
    Mention if there is a small bonus, or a small drawback, or a small effect, or a small property, or a small requirement, or a small attribute, etc.
    Mention if this item has a unique effect, requirement, property, or attribute, that isn't in other items of this type.
    Mention any lore or mysterious attributes, specific to this particular item that aren't in other items of this type. This is usually in magical or higher rarity items.
    IT IS VERY IMPORTANT TO MENTION ANY SMALL DETAILS THAT MAKE THIS ITEM UNIQUE AND DIFFERENT FROM OTHER ITEMS OF THIS TYPE.
    For common items, sometimes there are just visual differences, or small effects, or small properties, or small requirements, or small attributes, but no lore or magical effects.
    Generate an item with the following schema:
{
  "item": {
    "name": "string - name of the item, e.g., 'Sword of Flames', 'Healing Potion'",
    "description": "string - long description of the item, detailing its appearance, effects, and lore",
    "hiddenDetailedStats": "string - long, comma separated list of the dnd 5e stats and ability scores of the item",
    "hiddenDetailedStatuses": "string - long, specific detailed description of the statuses of the item",
    "hiddenDetailedAttributes": "string - long, specific detailed description of the attributes of the item",
  }
}

The hidden detailed stats and statuses of the item may include such stats as the following. The purposes of this field is so that the LLM can "remember" the stats and statuses of the item when it is used in an action.
Detailed Breakdown of Item Stats
a. Name
Purpose: Identifies the item uniquely.
Considerations: Should be descriptive and fit the item's lore and appearance.
b. Item Type
Purpose: Categorizes the item, determining its general use and relevant mechanics.
Categories:
Weapon: Swords, bows, daggers, etc.
Armor: Shields, helmets, breastplates, etc.
Potion: Healing potions, elixirs, etc.
Wondrous Item: Amulets, cloaks, boots, etc.
Ring: Rings with various magical properties.
Scroll: Contain spells that can be read and cast.
Artifact: Extremely rare and powerful items with significant lore.
c. Rarity
Purpose: Indicates the item's scarcity and power level.
Categories:
Common: Easily found, minimal magical properties.
Uncommon: Slightly rare, more useful magical effects.
Rare: Harder to find, significant magical enhancements.
Very Rare: Difficult to obtain, powerful magical abilities.
Legendary: Extremely rare, game-altering effects.
Artifact: Unique items with immense power and history.
d. Description
Purpose: Provides a narrative context, enhancing immersion and storytelling.
Elements: Appearance, origin, any notable features or lore.
e. Properties
Purpose: Defines the mechanical effects and benefits the item provides.
Examples:
Bonuses: +1 to attack rolls, +2 to AC.
Special Abilities: Can cast specific spells, grants resistance to damage types.
Passive Effects: Advantage on saving throws, ability to turn invisible.
f. Requirements
Purpose: Specifies conditions needed to use or attune to the item.
Types:
Attunement: Whether the item requires a character to attune to it, limiting the number of magical items a character can effectively use.
Class Restrictions: Some items may only be usable by certain classes (e.g., wizards, rogues).
Ability Score Prerequisites: Items that require a minimum Strength, Dexterity, etc.
g. Attunement
Purpose: Details the process and necessity of bonding with the item to unlock its full potential.
Mechanics: Typically requires a short rest while focusing on the item.
h. Weight
Purpose: Affects inventory management and encumbrance.
Considerations: Heavier items may impact a character's mobility or carrying capacity.
i. Value
Purpose: Provides an economic measure for trading, selling, or appraising items.
Usage: Helps DMs balance treasure rewards and establish the game's economy.
j. Additional Attributes
Purpose: Captures specific stats relevant to the item's type.
Examples:
Armor Class (AC): Relevant for armor and shields.
Damage: Dice and type of damage for weapons.
Spell Levels: For scrolls or items that can cast spells.
Charges: Number of times an item can be used before it depletes or needs recharging.


Examples of items that fit the schema:
{
  "name": "Staff of the Arcane Sage",
  "type": "Weapon",
  "rarity": "Very Rare",
  "description": "A beautifully carved staff adorned with arcane symbols and a large sapphire at its tip, pulsating with magical energy.",
  "properties": [
    "+2 to spell attack rolls and spell save DCs.",
    "Allows the casting of the *Dispel Magic* and *Counterspell* spells once per day each.",
    "Grants advantage on Intelligence (Arcana) checks related to magical phenomena."
  ],
  "requirements": {
    "attunement": "Requires attunement by a Wizard or Sorcerer.",
    "class": ["Wizard", "Sorcerer"],
    "abilityScores": {
      "intelligence": 15
    }
  },
  "weight": "4 lbs.",
  "value": 25000,
  "additionalAttributes": {
    "spellLevels": {
      "Dispel Magic": 3,
      "Counterspell": 3
    },
    "charges": 2
  }
}

{
  "name": "Gauntlets of the Mighty",
  "type": "Armor",
  "rarity": "Rare",
  "description": "Sturdy gauntlets made of reinforced steel, etched with runes that glow faintly when in battle.",
  "properties": [
    "+2 to Strength (STR) checks and Strength (Athletics) checks.",
    "Grants advantage on Strength saving throws against being pushed, pulled, or knocked prone.",
    "Once per long rest, can use a bonus action to gain a +5 bonus to Strength for 1 minute."
  ],
  "requirements": {
    "attunement": "Requires attunement by a Fighter or Barbarian.",
    "class": ["Fighter", "Barbarian"],
    "abilityScores": {
      "strength": 13
    }
  },
  "weight": "2 lbs.",
  "value": 15000,
  "additionalAttributes": {
    "abilityScores": {
      "strength": 5
    },
    "charges": 1
  }
}

{
  "name": "Boots of Elvenkind",
  "type": "Wondrous Item",
  "rarity": "Uncommon",
  "description": "Soft leather boots that blend seamlessly with natural environments, enhancing the wearer's stealth.",
  "properties": [
    "While you wear these boots, your steps make no sound regardless of the surface you're moving on.",
    "You have advantage on Dexterity (Stealth) checks that rely on moving silently."
  ],
  "requirements": {
    "attunement": "Not required.",
    "class": "",
    "abilityScores": {}
  },
  "weight": "1 lb.",
  "value": 2000,
  "additionalAttributes": {}
}
`;
  return prompt;
}
