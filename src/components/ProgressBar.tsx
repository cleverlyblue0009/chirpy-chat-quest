import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success";
}

export function ProgressBar({ value, label, showPercentage = true, variant = "default" }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground font-semibold">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <Progress value={value} className="h-3" />
    </div>
  );
}
