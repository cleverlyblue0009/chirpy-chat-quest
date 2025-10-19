import { ArrowLeft, Lock, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { subscribeToUserBirds, setActiveBird, type Bird } from "@/lib/firebase/birdService";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";
import owlAvatar from "@/assets/owl-character.png";
import sparrowAvatar from "@/assets/sparrow-character.png";

const birdAvatarMap: { [key: string]: string } = {
  'ruby_robin': robinAvatar,
  'sage_owl': owlAvatar,
  'charlie_sparrow': sparrowAvatar,
};

export default function BirdCollection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedBird, setSelectedBird] = useState<string | null>(null);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingBird, setChangingBird] = useState<string | null>(null);

  // Subscribe to user's bird collection
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = subscribeToUserBirds(currentUser.uid, (fetchedBirds) => {
      // Map avatar images
      const birdsWithAvatars = fetchedBirds.map(bird => ({
        ...bird,
        image: birdAvatarMap[bird.id] || bird.image
      }));
      
      setBirds(birdsWithAvatars);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSelectBird = async (birdId: string) => {
    if (!currentUser) return;
    
    try {
      setChangingBird(birdId);
      await setActiveBird(currentUser.uid, birdId);
      
      toast({
        title: "Bird Changed!",
        description: `Your active companion has been changed.`,
      });
    } catch (error) {
      console.error('Error changing bird:', error);
      toast({
        title: "Error",
        description: "Failed to change bird. Please try again.",
        variant: "destructive"
      });
    } finally {
      setChangingBird(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your bird collection...</p>
        </div>
      </div>
    );
  }

  // Use fallback birds if Firebase is empty
  const displayBirds = birds.length > 0 ? birds : [
    {
      id: 'ruby_robin',
      name: "Ruby Robin",
      description: "Your first friend in the forest",
      image: robinAvatar,
      unlockRequirement: "Always unlocked",
      isUnlocked: true,
      isActive: true,
      personality: "Ruby loves to talk about feelings and helps you express yourself!"
    },
    {
      id: 'sage_owl',
      name: "Wise Owl",
      description: "The patient teacher",
      image: owlAvatar,
      unlockRequirement: "Complete Level 3",
      isUnlocked: false,
      isActive: false,
      personality: "Wise Owl teaches you to listen carefully and think before speaking."
    },
    {
      id: 'charlie_sparrow',
      name: "Chatty Sparrow",
      description: "The energetic friend",
      image: sparrowAvatar,
      unlockRequirement: "Complete Level 5",
      isUnlocked: false,
      isActive: false,
      personality: "Sparrow loves quick conversations and helps you keep up with fast talkers!"
    },
  ];

  const unlockedCount = displayBirds.filter(b => b.isUnlocked).length;

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Forest background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />

      {/* Header */}
      <div className="relative z-10 bg-gradient-forest shadow-soft-lg">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary-foreground flex items-center gap-2">
                🪺 Your Bird Collection
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Collected {unlockedCount} of {displayBirds.length} birds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bird Grid */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBirds.map((bird) => (
            <Card 
              key={bird.id}
              className={`
                relative overflow-hidden transition-all duration-300 cursor-pointer
                ${bird.isUnlocked ? "hover:scale-105 hover:shadow-soft-lg" : "opacity-60"}
                ${bird.isActive ? "ring-4 ring-secondary shadow-soft-lg" : ""}
              `}
              onClick={() => bird.isUnlocked && setSelectedBird(bird.id)}
            >
              {bird.isActive && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Active
                  </div>
                </div>
              )}

              <div className="p-6 flex flex-col items-center">
                <div className={`
                  w-32 h-32 rounded-full mb-4 flex items-center justify-center
                  ${bird.isUnlocked 
                    ? "bg-gradient-forest shadow-soft-md" 
                    : "bg-muted"
                  }
                  ${bird.isUnlocked ? "animate-breathe" : ""}
                `}>
                  {bird.isUnlocked ? (
                    bird.image ? (
                      <img 
                        src={bird.image} 
                        alt={bird.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <Sparkles className="w-16 h-16 text-primary-foreground" />
                    )
                  ) : (
                    <div className="relative">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${bird.isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {bird.name}
                </h3>
                <p className={`text-sm text-center mb-4 ${bird.isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                  {bird.description}
                </p>

                {bird.isUnlocked ? (
                  bird.isActive ? (
                    <Button variant="secondary" className="w-full font-bold" disabled>
                      Currently Active
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      className="w-full font-bold"
                      disabled={changingBird !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBird(bird.id);
                      }}
                    >
                      {changingBird === bird.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Selecting...
                        </>
                      ) : (
                        'Select as Active'
                      )}
                    </Button>
                  )
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-semibold">
                      🔒 {bird.unlockRequirement}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-8 p-6 bg-accent shadow-soft-lg">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-accent-foreground flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-accent-foreground mb-2">
                About Your Bird Companions
              </h3>
              <p className="text-accent-foreground/80">
                Each bird you unlock becomes your conversation partner and guide! They have unique personalities and teaching styles. 
                Complete levels to unlock new friends and switch between them anytime to keep learning fresh and fun.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
