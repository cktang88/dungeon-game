# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## DEBUGGING

ALWAYS read backend-error.log for debugging server errors.

## Commands

### Development
- Frontend: `cd game-client && npm run dev` - Start frontend dev server at localhost:3000
- Backend: `cd game-server && npm run dev` - Start backend dev server at localhost:3001
- Build frontend: `cd game-client && npm run build`
- Build backend: `cd game-server && npm run build`
- Lint frontend: `cd game-client && npm run lint`

### Environment Setup
- Backend requires `.env` file with:
  - `GEMINI_API_KEY` - Google Gemini API key (used for all AI generation)
  - `OPENAI_API_KEY` - OpenAI API key (deprecated, migrated to Gemini)

## Architecture Overview

This is an AI-powered text-based dungeon crawler game with:
- **Frontend**: React + TypeScript + Vite with Tailwind CSS
- **Backend**: Express.js + TypeScript 
- **AI Integration**: Google Gemini 2.5 Flash for all content generation

### Key Design Patterns

1. **Stateless Server Architecture**
   - Server maintains no session state
   - Full game state passed with each request
   - Enables horizontal scaling

2. **LLM-Driven Gameplay**
   - Natural language action processing
   - Dynamic content generation for rooms, items, and enemies
   - Hidden state fields for AI memory consistency

3. **Entity System with Hidden Fields**
   - All entities (items, enemies, rooms) have:
     - Visible fields: name, description
     - Hidden fields: detailedStats, detailedStatuses, detailedAttributes
   - Hidden fields preserve context for consistent AI responses

### Core Data Flow

1. Player submits natural language action
2. `processAction()` in actions.ts sends to Gemini with ACTION_PROMPT
3. LLM returns structured response with effects and messages
4. `applyEffectsToGameState()` in state.ts processes state changes
5. Updated state returned to client

### Important Files

- `game-server/src/game/state.ts` - Game state management and effect application
- `game-server/src/game/actions.ts` - Action processing pipeline
- `game-server/src/game/generation/` - Content generation prompts
- `game-server/src/lib/gemini.ts` - Gemini AI integration
- `game-client/src/components/` - React UI components

### AI Integration Notes

- All LLM calls now use Gemini 2.5 Flash via `generateContent()`
- Prompts must explicitly request JSON-only responses
- Room generation happens lazily when players enter new areas
- Enemy loot generates only upon death for efficiency