import { ArrowLeft, Flame, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { LevelNode } from "@/components/LevelNode";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { subscribeToUserProgress, type Level } from "@/lib/firebase/learningPathService";
import { subscribeToUserStats, type UserStats } from "@/lib/firebase/dashboardService";
import forestBg from "@/assets/forest-background.jpg";

export default function LearningPath() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  // Subscribe to user progress and levels
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribeProgress = subscribeToUserProgress(currentUser.uid, (fetchedLevels) => {
      setLevels(fetchedLevels);
      
      // Find current level index
      const currentIdx = fetchedLevels.findIndex(l => l.status === 'current');
      setCurrentLevelIndex(currentIdx >= 0 ? currentIdx : 0);
      
      setLoading(false);
    });

    const unsubscribeStats = subscribeToUserStats(currentUser.uid, (stats) => {
      setUserStats(stats);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeStats();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  // Use fallback levels if Firebase is empty
  const displayLevels = levels.length > 0 ? levels : [
    { id: 'level_1', name: "Saying Hello", status: "completed" as const, position: "center" as const, order: 1 },
    { id: 'level_2', name: "Introducing Yourself", status: "completed" as const, position: "left" as const, order: 2 },
    { id: 'level_3', name: "Active Listening", status: "current" as const, position: "right" as const, order: 3 },
    { id: 'level_4', name: "Asking Questions", status: "locked" as const, position: "center" as const, order: 4 },
    { id: 'level_5', name: "Sharing Stories", status: "locked" as const, position: "left" as const, order: 5 },
    { id: 'level_6', name: "Understanding Feelings", status: "locked" as const, position: "right" as const, order: 6 },
    { id: 'level_7', name: "Topic Changes", status: "locked" as const, position: "center" as const, order: 7 },
    { id: 'level_8', name: "Saying Goodbye", status: "locked" as const, position: "left" as const, order: 8 },
  ];

  const progressPercentage = displayLevels.length > 0 
    ? ((currentLevelIndex + 1) / displayLevels.length) * 100 
    : 0;

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
                <span className="font-bold">{userStats?.currentStreak || 0} Day Streak</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">{userStats?.totalXP || 0} XP</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar 
              value={progressPercentage}
              label={`Level ${currentLevelIndex + 1} of ${displayLevels.length}`}
              variant="success"
            />
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-0">
          {displayLevels.map((level, index) => (
            <LevelNode 
              key={level.id}
              level={typeof level.id === 'string' ? index + 1 : level.id}
              name={level.name}
              status={level.status}
              position={level.position}
              onStart={() => level.status === "current" ? navigate(`/conversation/${level.id}`) : null}
            />
          ))}
          
          {/* End marker */}
          {displayLevels.length > 0 && (
            <div className="self-center flex flex-col items-center gap-2 mt-4">
              <div className="w-16 h-16 rounded-full bg-gradient-sunrise flex items-center justify-center shadow-soft-lg">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
              <p className="font-bold text-foreground">Forest Explorer Complete!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
