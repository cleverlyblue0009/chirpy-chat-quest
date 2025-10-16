import { ArrowLeft, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { LevelNode } from "@/components/LevelNode";
import { useNavigate } from "react-router-dom";
import forestBg from "@/assets/forest-background.jpg";

export default function LearningPath() {
  const navigate = useNavigate();
  
  const levels = [
    { id: 1, name: "Saying Hello", status: "completed" as const, position: "center" as const },
    { id: 2, name: "Introducing Yourself", status: "completed" as const, position: "left" as const },
    { id: 3, name: "Active Listening", status: "current" as const, position: "right" as const },
    { id: 4, name: "Asking Questions", status: "locked" as const, position: "center" as const },
    { id: 5, name: "Sharing Stories", status: "locked" as const, position: "left" as const },
    { id: 6, name: "Understanding Feelings", status: "locked" as const, position: "right" as const },
    { id: 7, name: "Topic Changes", status: "locked" as const, position: "center" as const },
    { id: 8, name: "Saying Goodbye", status: "locked" as const, position: "left" as const },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Forest background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />
      
      {/* Floating leaves decoration */}
      <div className="fixed top-20 left-10 w-8 h-8 opacity-30">
        <div className="text-4xl animate-float">🍃</div>
      </div>
      <div className="fixed top-40 right-20 w-8 h-8 opacity-30">
        <div className="text-4xl animate-float-delayed">🍂</div>
      </div>
      <div className="fixed bottom-40 left-20 w-8 h-8 opacity-30">
        <div className="text-4xl animate-float">🌿</div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-forest shadow-soft-lg">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-bold text-primary-foreground">Your Learning Path</h1>
          </div>
          
          <div className="flex items-center justify-between bg-white/20 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Flame className="w-5 h-5" />
                <span className="font-bold">3 Day Streak</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">245 XP</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar 
              value={25}
              label="Level 3 of 12"
              variant="success"
            />
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-0">
          {levels.map((level, index) => (
            <LevelNode 
              key={level.id}
              level={level.id}
              name={level.name}
              status={level.status}
              position={level.position}
              onStart={() => level.status === "current" ? navigate(`/conversation/${level.id}`) : null}
            />
          ))}
          
          {/* End marker */}
          <div className="self-center flex flex-col items-center gap-2 mt-4">
            <div className="w-16 h-16 rounded-full bg-gradient-sunrise flex items-center justify-center shadow-soft-lg">
              <Sparkles className="w-8 h-8 text-secondary-foreground" />
            </div>
            <p className="font-bold text-foreground">Forest Explorer Complete!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
