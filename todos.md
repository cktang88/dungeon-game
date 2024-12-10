## dungeon master

- only the current room should be passed into the LLM for identifying diffs based on action effects.

- the dungeon master over time learns the kind of player you are and verbalizes appropriately or tiny references or inside jokes later
- handle multiple action effects at once properly

## technical

- uses predicted outputs and prompt caching already

NOTE: challenging syncing 3 schemas:

- backend TS types
- frontend TS types
- json schema pass to the LLM prompt

### innovations (as compared to regular chatgpt)

- each generated item has a state, constantly updated, injected into prompt
- each item has lots of hidden state that's not displayed, but lets LLM make consistent object descriptions/actions

### optimizations

- using 4o-mini (30x cheaper than 4o, ~10% worse only)
- generating rooms lazily only when player enters a room
- generates loot on enemies only when enemies killed
