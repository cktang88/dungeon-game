type Direction = "north" | "east" | "south" | "west";
const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

// Simple adjacency list representation
type DungeonMap = Map<string, string[]>;

const getOppositeDirection = (direction: Direction): Direction => {
  switch (direction) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "east":
      return "west";
    case "west":
      return "east";
  }
};

const getAvailableDirections = (
  roomId: string,
  map: DungeonMap
): Direction[] => {
  const connections = map.get(roomId)?.length || 0;
  if (connections >= 4) return [];
  return DIRECTIONS.filter(
    (_, index) => !map.get(roomId)?.includes(index.toString())
  );
};

// Helper to randomly select an element from an array
const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const generateDungeon = (minRooms: number): DungeonMap => {
  const map: DungeonMap = new Map();

  // Start with first room
  map.set("0", []);

  // Active set for the Growing Tree algorithm
  const activeSet: string[] = ["0"];
  let nextRoomId = 1;

  while (activeSet.length > 0) {
    // Growing Tree: Choose a room from the active set
    // We'll use "newest" selection (last room) 80% of the time
    // and random selection 20% of the time for interesting layouts
    const currentRoomIndex =
      Math.random() < 0.8
        ? activeSet.length - 1
        : Math.floor(Math.random() * activeSet.length);
    const currentRoomId = activeSet[currentRoomIndex];

    // Get available directions for this room
    const availableDirections = getAvailableDirections(currentRoomId, map);

    if (
      availableDirections.length > 0 &&
      (map.size < minRooms || Math.random() < 0.3)
    ) {
      // Randomly choose a direction
      const direction = randomElement(availableDirections);

      // Create new room
      const newRoomId = nextRoomId.toString();
      nextRoomId++;

      // Add the new room to the map with bidirectional connection
      map.set(newRoomId, [currentRoomId]);
      const currentConnections = map.get(currentRoomId) || [];
      currentConnections.push(newRoomId);
      map.set(currentRoomId, currentConnections);

      // Add the new room to the active set
      activeSet.push(newRoomId);
    } else {
      // No available directions or chance to stop, remove the current room from active set
      activeSet.splice(currentRoomIndex, 1);
    }
  }

  // If we didn't generate enough rooms, try again
  if (map.size < minRooms) {
    return generateDungeon(minRooms);
  }

  return map;
};

// Example usage:
const dungeon = generateDungeon(6);
console.log(dungeon);
// Returns Map<string, string[]> where each key is a room ID and value is array of connected room IDs
// Example: Map { "0" => ["1", "2"], "1" => ["0", "3"], "2" => ["0", "4"] }
