# Dungeon Crawler Game Architecture

## Overview

This is an AI-powered text-based dungeon crawler game built with a React frontend and Node.js/Express backend. The game leverages Large Language Models (LLMs) to generate dynamic content, interpret player actions, and create emergent gameplay experiences.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │  API    │                 │
│  React Client   │ <-----> │  Express Server │ <-----> │   OpenAI API    │
│   (Vite/TS)     │         │    (Node.js)    │         │   (GPT-4)       │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for server state management
- Tailwind CSS for styling
- Shadcn/ui component library
- Socket.io client (prepared for real-time features)

**Backend:**
- Node.js with Express
- TypeScript
- OpenAI API integration
- Google Gemini API integration
- In-memory game state storage

## Core Components

### 1. Game State Management

The game state is the central data structure that represents the entire game world:

```typescript
interface GameState {
  player: Player;
  rooms: Record<string, Room>;
  messageHistory: string[];
  currentRoomId: string;
  previousRoomId: string | null;
  sessionId: string;
}
```

**Key Features:**
- Player stats based on D&D-style ability scores (STR, DEX, CON, INT, WIS, CHA)
- Room-based exploration with dynamic connections
- Persistent message history for game narrative
- Session-based gameplay (each session is independent)

### 2. Entity System

All game objects inherit from `DescribedEntity`:

```typescript
interface DescribedEntity {
  name: string;
  description: string;
  detailedStats: string;      // Hidden LLM memory
  detailedStatuses: string;   // Hidden LLM memory
  detailedAttributes: string; // Hidden LLM memory
}
```

**Entity Types:**
- **Player**: Character with inventory, stats, and status effects
- **Room**: Explorable spaces with items, enemies, and connections
- **Item**: Collectible objects with various properties
- **Enemy**: NPCs with combat capabilities
- **Door**: Connections between rooms

**Hidden Fields:**
The `detailedStats`, `detailedStatuses`, and `detailedAttributes` fields serve as the LLM's "memory" for maintaining complex state across interactions.

### 3. Action Processing Pipeline

```
Player Input → Action Interpretation → Effect Application → State Update → Response
```

1. **Action Interpretation** (`interpretAction`):
   - Uses LLM to understand natural language commands
   - Determines action type, target, and required items
   - Generates list of effects to apply

2. **Effect Application** (`applyEffects`):
   - Sequentially applies effects to game state
   - Handles stat changes, status effects, item transfers
   - Maintains numerical accuracy and state consistency

3. **State Validation**:
   - Ensures critical fields are preserved
   - Validates state structure before committing changes

### 4. Content Generation

**Room Generation:**
- Dynamic room creation based on themes
- Includes items, enemies, puzzles, and atmospheric descriptions
- Connects to existing dungeon layout

**Item Generation:**
- Categorized items (good, weird, giant, small)
- Detailed stat blocks for gameplay mechanics
- Thematic consistency with room environment

**Monster Generation:**
- Varied enemy types with unique abilities
- Appearance, attacks, and behavior patterns
- Dynamic loot drops calculated on defeat

## API Architecture

### Endpoints

1. **POST /api/game/start**
   - Initializes new game session
   - Generates starting room and connected room
   - Returns session ID and initial game state

2. **POST /api/game/action**
   - Processes player commands
   - Updates game state based on LLM interpretation
   - Returns updated state and narrative response

3. **GET /api/game/state/:sessionId**
   - Retrieves current game state for session
   - Used for state synchronization

### Request/Response Flow

```typescript
// Start Game
Request:  POST /api/game/start
Response: {
  sessionId: string,
  gameState: GameState
}

// Send Action
Request:  POST /api/game/action
Body:     { sessionId: string, action: string }
Response: {
  gameState: GameState,
  message: string
}
```

## AI Integration

### LLM Usage Patterns

1. **Action Interpretation**:
   - Natural language understanding
   - Command parsing and validation
   - Effect determination

2. **Content Generation**:
   - Room descriptions and layouts
   - Item and enemy creation
   - Puzzle and trap design

3. **State Transformation**:
   - Complex effect application
   - Maintaining narrative consistency
   - Balancing gameplay mechanics

### Prompt Engineering

The system uses specialized prompts for different tasks:

- **Action Prompt**: Focuses on emergent gameplay, stat-based outcomes, and detailed narrative responses
- **Room Generation Prompt**: Creates atmospheric, explorable spaces with interactive elements
- **Effect Application Prompt**: Maintains numerical accuracy while applying complex state changes

### Model Configuration

- Primary: OpenAI GPT-4 for complex reasoning
- Fallback: GPT-4 Mini for faster, simpler operations
- Experimental: Google Gemini integration

## Client Architecture

### Component Hierarchy

```
GameLayout (Main Container)
├── RoomView (Current room display)
├── GameMap (Visual dungeon map)
├── ChatBox (Command input/history)
├── PlayerStats (Character sheet)
└── Inventory (Item management)
```

### State Management

- **TanStack Query**: Server state synchronization
- **React State**: Local UI state
- **Session Storage**: Persistence across refreshes

### Real-time Features (Planned)

- Socket.io integration prepared
- Live multiplayer support
- Real-time state updates

## Data Flow

### Game Initialization
```
1. Client loads → Request new game
2. Server creates session → Generate initial rooms
3. LLM generates content → Return to client
4. Client renders game world
```

### Action Processing
```
1. Player types command
2. Client sends to server
3. Server interprets with LLM
4. Effects applied to state
5. Updated state returned
6. Client updates UI
```

## Key Design Decisions

### 1. Stateless Server Architecture
- Game state stored in memory
- Sessions are ephemeral
- Easy horizontal scaling (with external state store)

### 2. LLM-Driven Gameplay
- Natural language commands
- Dynamic content generation
- Emergent narrative experiences

### 3. Hidden State Management
- LLM "memory" through detailed fields
- Preserves complex interactions
- Enables persistent object properties

### 4. D&D-Inspired Mechanics
- Familiar stat system
- Ability score modifiers
- Skill checks and combat rolls

## Performance Considerations

### Optimizations
- Selective room updates (only current room sent to LLM)
- Caching for repeated LLM calls
- Efficient state diffing

### Scalability
- Session-based isolation
- Stateless request handling
- External state store ready (Redis/PostgreSQL)

## Security Considerations

### API Security
- CORS configuration
- Input validation
- Rate limiting (to be implemented)

### LLM Safety
- Controlled prompt templates
- Output validation
- Content filtering

## Future Enhancements

### Planned Features
1. Multiplayer support via WebSockets
2. Persistent game saves
3. Achievement system
4. Expanded AI models support
5. Procedural dungeon layouts
6. Combat system improvements
7. Magic and spell system
8. Character classes and progression

### Technical Improvements
1. Database integration for persistence
2. Caching layer for LLM responses
3. WebSocket real-time updates
4. Microservice architecture
5. Container orchestration
6. CI/CD pipeline

## Development Workflow

### Local Development
```bash
# Start backend
cd game-server
npm install
npm run dev

# Start frontend
cd game-client
npm install
npm run dev
```

### Environment Setup
Required environment variables:
- `OPENAI_API_KEY`: OpenAI API access
- `GEMINI_API_KEY`: Google Gemini access (optional)

### Code Organization
- `/game-server`: Backend application
  - `/src/game`: Game logic and generation
  - `/src/lib`: External integrations
  - `/src/types`: TypeScript definitions
  - `/data`: Static game content

- `/game-client`: Frontend application
  - `/src/components`: React components
  - `/src/lib`: API and utilities
  - `/src/types`: Shared type definitions

## Conclusion

This architecture provides a flexible, scalable foundation for an AI-driven dungeon crawler. The separation of concerns between client, server, and AI services allows for independent scaling and development. The use of LLMs for content generation and action interpretation creates unique, emergent gameplay experiences while maintaining consistent game mechanics.