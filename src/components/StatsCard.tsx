import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "success" | "warning";
}

export function StatsCard({ icon: Icon, title, value, subtitle, variant = "default" }: StatsCardProps) {
  const variants = {
    default: "bg-card border-border",
    success: "bg-gradient-forest border-primary/20",
    warning: "bg-gradient-sunrise border-secondary/20",
  };

  const textVariants = {
    default: "text-card-foreground",
    success: "text-primary-foreground",
    warning: "text-secondary-foreground",
  };

  return (
    <Card className={`p-4 shadow-soft ${variants[variant]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${variant === "default" ? "bg-primary/10" : "bg-white/20"}`}>
          <Icon className={`h-5 w-5 ${variant === "default" ? "text-primary" : "text-white"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textVariants[variant]} opacity-80`}>{title}</p>
          <p className={`text-2xl font-bold ${textVariants[variant]} mt-1`}>{value}</p>
          {subtitle && (
            <p className={`text-xs ${textVariants[variant]} opacity-70 mt-1`}>{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
