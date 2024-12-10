## dungeon master

- mana bar and mana and health regen stats

- the dungeon master over time learns the kind of player you are and verbalizes appropriately or tiny references or inside jokes later
- handle multiple action effects at once properly

## technical

- used prompt caching (is automatically done by openAI)
  - should only pass in current room and prev room
- use predicted outputs

NOTE: challenging syncing 3 schemas:

- backend TS types
- frontend TS types
- json schema pass to the LLM prompt
