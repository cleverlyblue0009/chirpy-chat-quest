import { LucideIcon, Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate?: Date;
  progress?: number; // 0-100, for locked achievements showing progress
  requirement?: string; // e.g., "Complete 5 lessons"
  isNew?: boolean;
}

export function AchievementCard({ 
  icon, 
  title, 
  description, 
  isUnlocked, 
  unlockedDate,
  progress,
  requirement,
  isNew = false 
}: AchievementCardProps) {
  return (
    <Card className={`
      relative p-4 min-w-[240px] transition-all duration-300 hover:scale-105
      ${isUnlocked 
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg hover:shadow-xl' 
        : 'bg-gray-50 border-gray-200 opacity-75'
      }
    `}>
      {/* New badge for recently unlocked */}
      {isNew && isUnlocked && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
          NEW!
        </div>
      )}
      
      <div className="flex flex-col items-center text-center gap-3">
        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center text-4xl
          ${isUnlocked 
            ? 'bg-yellow-100 ring-4 ring-yellow-300' 
            : 'bg-gray-200'
          }
        `}>
          {isUnlocked ? (
            <span>{icon}</span>
          ) : (
            <div className="relative">
              <span className="opacity-30">{icon}</span>
              <Lock className="w-6 h-6 text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
        
        {/* Title */}
        <h4 className={`font-bold text-lg ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {title}
        </h4>
        
        {/* Description */}
        <p className={`text-sm ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
          {description}
        </p>
        
        {/* Status */}
        {isUnlocked ? (
          <div className="flex items-center gap-2 mt-2">
            <Check className="w-4 h-4 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
              Unlocked
            </Badge>
          </div>
        ) : (
          <div className="mt-2 w-full">
            {requirement && (
              <p className="text-xs text-gray-600 mb-2">
                <strong>Requirement:</strong> {requirement}
              </p>
            )}
            {progress !== undefined && progress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}
        
        {/* Unlocked date */}
        {isUnlocked && unlockedDate && (
          <p className="text-xs text-gray-500 mt-1">
            Unlocked: {unlockedDate.toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  );
}
