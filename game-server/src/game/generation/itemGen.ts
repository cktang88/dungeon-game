import giantItems from "../../../data/items/giant_items.json";
import smallItems from "../../../data/items/small_items.json";
import goodItems from "../../../data/items/good_items.json";
import weirdItems from "../../../data/items/weird_items.json";
import { getRandomItems } from "./utils";

export type ITEM_TYPES = "giant" | "small" | "good" | "weird";

export function generateItemPrompt(theme: string, itemType: ITEM_TYPES) {
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
    "name": "string - name of the item, e.g., 'Sword of Flames', 'Healing Potion'",
    "description": "string - long description of the item, detailing its appearance, effects, and lore",
    "hiddenDetailedStats": "A comprehensive string that includes specific and detailed statistics about the item or object. This encompasses unique physical characteristics, minor bonuses or disadvantages, special traits, or subtle variations in standard item metrics that distinguish it from other objects of the same type. Examples include size, weight, value, damage potential, range, durability, capacity, and any other quantitative or measurable attributes that influence the item's interaction with adventurers.",
    "hiddenDetailedStatuses": "A thorough string that provides a detailed description of the item's current conditions, environmental effects, or status phenomena. This highlights unique interactions, tendencies, or ongoing effects that the item may have on creatures or other objects within the room. Examples include elemental properties, enchantments, auras, magical effects, environmental adaptations, or any other status-related features that create a distinct presence for the item.",
    "hiddenDetailedAttributes": "A detailed string that outlines additional attributes covering the item's materials, build quality, rarity, required levels or conditions for use, short lore snippets, unique abilities or enchantments, and any other distinguishing features. This may include how worn/used it is, unique crafting materials, inscriptions or runes, thematic elements, and any other characteristics that set it apart from other items of the same type. For higher rarity items, this can also encompass unique charms, curses, or legendary backstories.",
  }
`;
  return prompt;
}
