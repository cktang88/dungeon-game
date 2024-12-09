## LLM text-based dungeon crawler

Generally room by room, you can do any action to any object.

- player goes into rooms
- rooms have doors
- doors have keys
- keys are in rooms
- player can pick up keys
- player can unlock doors
- player can go through doors

- players can descend deeper into dungeon, each floor has a different theme
- players can find items, weapons, armor, etc.
- players can find enemies or NPCs
- players can find chests or treasures or random loot
- players can find traps
- players can find puzzles which can be solved for rewards or loot or keys

- each floor has many rooms
- each floor is harder than the last
- each floor has one or more bosses and minibosses

- you can beat the boss for rewards

item types:

- weapons
- armor
- potions
- scrolls
- rings
- amulets
- etc.

UI:

- player can see the map
- player can see the current room's description and contents and enemies
- chatbox with chat history and player input box
- a tab for the player's inventory
- a tab for player's current stats (health, xp, skills, etc.)

### Player Stats

**_Ability scores:_**

- Strength (STR)
- Dexterity (DEX)
- Constitution (CON)
- Intelligence (INT)
- Wisdom (WIS)
- Charisma (CHA)

**_Derived stats:_**

- Max Health (based on CON)
- Armor Class (based on DEX)
- Initiative (based on DEX)
- Carry Capacity (based on STR)

**_D&D-style mechanics:_**

- Ability modifiers (calculated as floor((score - 10) / 2))
- Base AC of 10 + DEX modifier
- HP calculation using CON modifier
- Carry capacity using STR × 15

**_The LLM can now use these stats for:_**

- Combat calculations (using STR/DEX for attacks)
- Skill checks (using appropriate abilities)
- Social interactions (using CHA)
- Puzzle solving (using INT/WIS)
- Physical challenges (using STR/DEX)
- Survival situations (using CON/WIS)
