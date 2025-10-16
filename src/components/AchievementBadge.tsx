import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isNew?: boolean;
}

export function AchievementBadge({ icon: Icon, title, description, isNew = false }: AchievementBadgeProps) {
  return (
    <Card className="relative p-4 min-w-[200px] bg-gradient-sunrise shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105">
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full shadow-soft animate-bounce-gentle">
          NEW!
        </div>
      )}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-secondary-foreground" />
        </div>
        <h4 className="font-bold text-secondary-foreground">{title}</h4>
        <p className="text-xs text-secondary-foreground/80">{description}</p>
      </div>
    </Card>
  );
}
