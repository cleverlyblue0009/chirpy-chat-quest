import { Check, Lock } from "lucide-react";

interface SkillProgressProps {
  name: string;
  progress: number;
  isLocked?: boolean;
}

export function SkillProgress({ name, progress, isLocked = false }: SkillProgressProps) {
  const isComplete = progress >= 100;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-soft hover:shadow-soft-md transition-all duration-300">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center
        ${isLocked ? "bg-muted" : isComplete ? "bg-success" : "bg-primary/20"}
      `}>
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground" />
        ) : isComplete ? (
          <Check className="w-5 h-5 text-white" />
        ) : (
          <div className="w-6 h-6 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
          {name}
        </p>
        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      
      <span className={`text-sm font-bold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
        {progress}%
      </span>
    </div>
  );
}
