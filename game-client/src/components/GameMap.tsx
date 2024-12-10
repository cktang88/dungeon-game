import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Room } from "@/types/game";

interface GameMapProps {
  rooms: Room[];
  currentRoom: string;
}

const ROOM_SIZE = 60;
const DOOR_SIZE = 10;

// Helper function to calculate room positions based on connections
function calculateRoomPositions(
  rooms: Room[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  // Start with the first room at (0,0)
  if (rooms.length === 0) return positions;

  const queue: [string, number, number][] = [[rooms[0].name, 0, 0]];
  positions.set(rooms[0].name, { x: 0, y: 0 });
  visited.add(rooms[0].name);

  while (queue.length > 0) {
    const [roomName, x, y] = queue.shift()!;
    const room = rooms.find((r) => r.name === roomName);
    if (!room) continue;

    // Check each direction
    const directions = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
    };

    for (const [direction, offset] of Object.entries(directions)) {
      const door = room.connections[direction as keyof typeof room.connections];
      if (door && !visited.has(door.destinationRoomName)) {
        const newX = x + offset.dx;
        const newY = y + offset.dy;
        positions.set(door.destinationRoomName, { x: newX, y: newY });
        visited.add(door.destinationRoomName);
        queue.push([door.destinationRoomName, newX, newY]);
      }
    }
  }

  return positions;
}

export function GameMap({ rooms, currentRoom }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [roomPositions, setRoomPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  useEffect(() => {
    setRoomPositions(calculateRoomPositions(rooms));
  }, [rooms]);

  const drawRoom = (
    ctx: CanvasRenderingContext2D,
    room: Room,
    isCurrentRoom: boolean,
    position: { x: number; y: number }
  ) => {
    const x = position.x * (ROOM_SIZE + 20) + 400; // Center the map more
    const y = position.y * (ROOM_SIZE + 20) + 300;

    // Draw room background
    ctx.fillStyle = isCurrentRoom ? "#4a5568" : "#2d3748";
    ctx.fillRect(x, y, ROOM_SIZE, ROOM_SIZE);

    // Draw doors
    ctx.fillStyle = "#48bb78";

    if (room.connections.north) {
      ctx.fillRect(x + (ROOM_SIZE - DOOR_SIZE) / 2, y - 2, DOOR_SIZE, 4);
    }
    if (room.connections.south) {
      ctx.fillRect(
        x + (ROOM_SIZE - DOOR_SIZE) / 2,
        y + ROOM_SIZE - 2,
        DOOR_SIZE,
        4
      );
    }
    if (room.connections.east) {
      ctx.fillRect(
        x + ROOM_SIZE - 2,
        y + (ROOM_SIZE - DOOR_SIZE) / 2,
        4,
        DOOR_SIZE
      );
    }
    if (room.connections.west) {
      ctx.fillRect(x - 2, y + (ROOM_SIZE - DOOR_SIZE) / 2, 4, DOOR_SIZE);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all rooms
    rooms.forEach((room) => {
      const position = roomPositions.get(room.name);
      if (position) {
        drawRoom(ctx, room, room.name === currentRoom, position);
      }
    });
  }, [rooms, currentRoom, roomPositions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered room
    const room = rooms.find((r) => {
      const position = roomPositions.get(r.name);
      if (!position) return false;

      const roomX = position.x * (ROOM_SIZE + 20) + 400;
      const roomY = position.y * (ROOM_SIZE + 20) + 300;

      return (
        x >= roomX &&
        x <= roomX + ROOM_SIZE &&
        y >= roomY &&
        y <= roomY + ROOM_SIZE
      );
    });

    setHoveredRoom(room || null);
  };

  return (
    <TooltipProvider>
      <Tooltip open={!!hoveredRoom}>
        <TooltipTrigger asChild>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-700 rounded-lg bg-gray-900"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredRoom(null)}
          />
        </TooltipTrigger>
        {hoveredRoom && (
          <TooltipContent>
            <div className="p-2">
              <h3 className="font-semibold mb-1">{hoveredRoom.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {hoveredRoom.description}
              </p>
              {hoveredRoom.items.length > 0 && (
                <>
                  <h4 className="font-semibold text-sm mb-1">Items:</h4>
                  <ul className="list-disc pl-4 text-sm">
                    {hoveredRoom.items.map((item, index) => (
                      <li key={index}>{item.name}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
