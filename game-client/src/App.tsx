import { useEffect, useState } from "react";
import "./App.css";
import { GameMap } from "./components/GameMap";

// Mock data for testing - replace with actual game state
const mockRooms = [
  {
    id: "1",
    x: 0,
    y: 0,
    doors: { north: true, east: true },
    items: ["Key", "Potion"],
    visited: true,
  },
  {
    id: "2",
    x: 1,
    y: 0,
    doors: { west: true, south: true },
    items: ["Sword"],
    visited: true,
  },
  {
    id: "3",
    x: 1,
    y: 1,
    doors: { north: true },
    items: [],
    visited: true,
  },
];

function App() {
  const [currentRoom, setCurrentRoom] = useState("1");

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dungeon Explorer</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Game Map</h2>
            <GameMap rooms={mockRooms} currentRoom={currentRoom} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Game Controls</h2>
            {/* Add your game controls here */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
