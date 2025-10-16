import { Bird } from "lucide-react";

interface BirdAvatarProps {
  name: string;
  imageSrc?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isActive?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

export function BirdAvatar({ name, imageSrc, size = "md", isActive = false, onClick }: BirdAvatarProps) {
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        overflow-hidden 
        bg-gradient-forest 
        flex items-center justify-center
        shadow-soft-md
        transition-all duration-300
        hover:scale-110 hover:shadow-soft-lg
        ${isActive ? "ring-4 ring-secondary animate-pulse-gentle" : ""}
        ${onClick ? "cursor-pointer" : "cursor-default"}
      `}
      disabled={!onClick}
    >
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-full h-full object-cover animate-breathe"
        />
      ) : (
        <Bird className="w-1/2 h-1/2 text-primary-foreground" />
      )}
    </button>
  );
}
