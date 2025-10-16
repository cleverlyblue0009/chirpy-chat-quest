import { Check, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LevelNodeProps {
  level: number;
  name: string;
  status: "completed" | "current" | "locked";
  onStart?: () => void;
  position?: "left" | "right" | "center";
}

export function LevelNode({ level, name, status, onStart, position = "center" }: LevelNodeProps) {
  const statusStyles = {
    completed: "bg-success border-success/20 shadow-soft-md",
    current: "bg-gradient-sunrise border-secondary animate-pulse-gentle shadow-soft-lg",
    locked: "bg-muted border-muted-foreground/20 opacity-60",
  };

  const positionStyles = {
    left: "self-start ml-8",
    right: "self-end mr-8",
    center: "self-center",
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${positionStyles[position]}`}>
      <Card className={`p-6 min-w-[200px] max-w-[280px] ${statusStyles[status]} transition-all duration-300 hover:scale-105`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${status === "completed" ? "bg-white/30" : status === "current" ? "bg-white/40" : "bg-foreground/10"}
          `}>
            {status === "completed" && <Check className="w-6 h-6 text-white" />}
            {status === "current" && <Play className="w-6 h-6 text-secondary-foreground" />}
            {status === "locked" && <Lock className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-semibold ${status === "locked" ? "text-muted-foreground" : "text-white"}`}>
              Level {level}
            </p>
            <h3 className={`font-bold ${status === "locked" ? "text-muted-foreground" : "text-white"}`}>
              {name}
            </h3>
          </div>
        </div>
        
        {status === "current" && onStart && (
          <Button 
            onClick={onStart} 
            className="w-full bg-white text-secondary-foreground hover:bg-white/90 font-bold"
            size="lg"
          >
            Start Conversation
          </Button>
        )}
        
        {status === "locked" && (
          <p className="text-xs text-muted-foreground text-center">
            Complete previous levels to unlock
          </p>
        )}
      </Card>
      
      {/* Connecting path line */}
      {status !== "locked" && (
        <div className="w-1 h-16 bg-gradient-forest rounded-full" />
      )}
      {status === "locked" && (
        <div className="w-1 h-16 bg-border rounded-full opacity-30" />
      )}
    </div>
  );
}
