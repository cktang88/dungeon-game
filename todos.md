## dungeon master

- only the current room should be passed into the LLM for identifying diffs based on action effects.

- the dungeon master over time learns the kind of player you are and verbalizes appropriately or tiny references or inside jokes later
- handle multiple action effects at once properly

## technical

- uses predicted outputs and prompt caching already
- predicted outputs really show tho :(

### innovations (as compared to regular chatgpt)

- each generated item has a state, constantly updated, injected into prompt
- each item has lots of hidden state that's not displayed, but lets LLM make consistent object descriptions/actions

### optimizations

- using 4o-mini (30x cheaper than 4o, ~10% worse only)
- generating rooms lazily only when player enters a room
- generates loot on enemies only when enemies killed

NOTE: grok2 image gen is quite good, especially with detailed dungeon room text

### NOTES:

- even with just 4o (regular) in openAI playground online, consistency falls apart after a few rooms.

  - You can throw dagger multiple times, rooms aren't the same, etc.

- but o1-mini and 4o can record all actions and is pretty consistent w inventory (though shorter prompt) in openAI's public chatgpt
- shorter system prompts work BETTER b/c takes up less of context

- i did like the the humorous tone in the "main" branch, somehow not as humorous in the easy and super-easy branches...
- also 4o is not humorous because it's not a "humorous game master" system prompt, i put that in the first user message.
