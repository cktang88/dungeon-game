import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatBoxProps {
  messages: string[];
  onSendMessage: (message: string) => void;
}

export default function ChatBox({ messages, onSendMessage }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <Card className="h-full flex flex-col">
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.startsWith(">")
                  ? "text-blue-500 font-medium"
                  : "text-foreground"
              }`}
            >
              {message}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a command (type 'help' for commands)..."
          className="w-full"
        />
      </form>
    </Card>
  );
}
