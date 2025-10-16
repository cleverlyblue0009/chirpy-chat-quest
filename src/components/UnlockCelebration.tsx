import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Star } from "lucide-react";

interface UnlockCelebrationProps {
  birdName: string;
  birdImage: string;
  description: string;
  onClose: () => void;
}

export function UnlockCelebration({ birdName, birdImage, description, onClose }: UnlockCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {i % 2 === 0 ? (
              <Star className="w-6 h-6 text-secondary fill-secondary" />
            ) : (
              <Sparkles className="w-6 h-6 text-secondary" />
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div
        className={`
          relative bg-gradient-sunrise rounded-3xl p-8 max-w-md w-full mx-4
          shadow-soft-lg transform transition-all duration-500
          ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
        `}
      >
        {/* Bird flying in animation */}
        <div className="flex justify-center mb-6">
          <div
            className={`
              w-40 h-40 rounded-full bg-white/30 flex items-center justify-center
              transform transition-all duration-1000
              ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
            `}
          >
            <img
              src={birdImage}
              alt={birdName}
              className="w-full h-full object-cover rounded-full animate-bounce-gentle"
            />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-secondary-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" />
            Congratulations!
            <Sparkles className="w-8 h-8" />
          </h2>

          <p className="text-xl font-semibold text-secondary-foreground">
            You unlocked {birdName}!
          </p>

          <p className="text-secondary-foreground/90 text-base">
            {description}
          </p>

          <Button
            size="lg"
            className="bg-white text-secondary-foreground hover:bg-white/90 font-bold w-full mt-6"
            onClick={onClose}
          >
            Meet Your New Friend!
          </Button>
        </div>

        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 animate-sparkle">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="absolute top-4 left-4 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Star className="w-6 h-6 text-white fill-white" />
        </div>
        <div className="absolute bottom-4 right-8 animate-sparkle" style={{ animationDelay: '1s' }}>
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}
