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

export function GameMap({ rooms, currentRoom }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);

  const drawRoom = (
    ctx: CanvasRenderingContext2D,
    room: Room,
    isCurrentRoom: boolean
  ) => {
    const x = room.position.x * (ROOM_SIZE + 20) + 100;
    const y = room.position.y * (ROOM_SIZE + 20) + 100;

    // Draw room background
    ctx.fillStyle = isCurrentRoom ? "#4a5568" : "#2d3748";
    ctx.fillRect(x, y, ROOM_SIZE, ROOM_SIZE);

    // Draw doors
    ctx.fillStyle = "#48bb78"; // Open door color
    const lockedColor = "#e53e3e"; // Red color for locked doors

    if (room.doors.north) {
      ctx.fillStyle = room.doors.north.isLocked ? lockedColor : "#48bb78";
      ctx.fillRect(x + (ROOM_SIZE - DOOR_SIZE) / 2, y - 2, DOOR_SIZE, 4);
    }
    if (room.doors.south) {
      ctx.fillStyle = room.doors.south.isLocked ? lockedColor : "#48bb78";
      ctx.fillRect(
        x + (ROOM_SIZE - DOOR_SIZE) / 2,
        y + ROOM_SIZE - 2,
        DOOR_SIZE,
        4
      );
    }
    if (room.doors.east) {
      ctx.fillStyle = room.doors.east.isLocked ? lockedColor : "#48bb78";
      ctx.fillRect(
        x + ROOM_SIZE - 2,
        y + (ROOM_SIZE - DOOR_SIZE) / 2,
        4,
        DOOR_SIZE
      );
    }
    if (room.doors.west) {
      ctx.fillStyle = room.doors.west.isLocked ? lockedColor : "#48bb78";
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
      if (room.visited) {
        drawRoom(ctx, room, room.id === currentRoom);
      }
    });
  }, [rooms, currentRoom]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered room
    const room = rooms.find((r) => {
      const roomX = r.position.x * (ROOM_SIZE + 20) + 100;
      const roomY = r.position.y * (ROOM_SIZE + 20) + 100;
      return (
        x >= roomX &&
        x <= roomX + ROOM_SIZE &&
        y >= roomY &&
        y <= roomY + ROOM_SIZE &&
        r.visited
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
                    {hoveredRoom.items.map((item) => (
                      <li key={item.id}>{item.name}</li>
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
