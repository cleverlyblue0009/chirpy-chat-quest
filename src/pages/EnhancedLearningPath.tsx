import { ArrowLeft, Flame, Sparkles, Loader2, Trophy, Star, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { LevelNode } from "@/components/LevelNode";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subscribeToUserStats, type UserStats } from "@/lib/firebase/dashboardService";
import forestBg from "@/assets/forest-background.jpg";

interface EnhancedLevel {
  id: string;
  name: string;
  description: string;
  tier: number;
  order: number;
  status: 'completed' | 'current' | 'available' | 'locked';
  position: 'left' | 'center' | 'right';
  xp_reward: number;
  bird_character: string;
  objectives: string[];
  required_conversations: number;
  conversations_completed?: number;
}

export default function EnhancedLearningPath() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [levels, setLevels] = useState<EnhancedLevel[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [testMode] = useState(true); // Enable test mode to unlock all levels

  // Fetch all levels from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    // Query all levels ordered by order field
    const levelsRef = collection(db, 'levels');
    const q = query(levelsRef, orderBy('order'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedLevels: EnhancedLevel[] = [];
      
      // Get user's current level from user stats
      let currentUserLevel = 'level_1';
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          currentUserLevel = userDoc.data().current_level_id || 'level_1';
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      
      snapshot.forEach((levelDoc) => {
        const data = levelDoc.data();
        
        // Determine status
        let status: EnhancedLevel['status'] = 'available';
        
        if (levelDoc.id === currentUserLevel) {
          status = 'current';
        } else {
          const levelNum = parseInt(levelDoc.id.split('_')[1]);
          const currentNum = parseInt(currentUserLevel.split('_')[1]);
          
          if (levelNum < currentNum) {
            status = 'completed';
          } else if (testMode || levelNum === currentNum + 1) {
            // In test mode, all levels are available
            status = 'available';
          } else {
            status = 'locked';
          }
        }
        
        // Determine position for visual path
        const positions: Array<'left' | 'center' | 'right'> = ['center', 'left', 'right'];
        const position = positions[(data.order - 1) % 3];
        
        fetchedLevels.push({
          id: levelDoc.id,
          name: data.name,
          description: data.description,
          tier: data.tier,
          order: data.order,
          status,
          position,
          xp_reward: data.xp_reward,
          bird_character: data.bird_character,
          objectives: data.objectives || [],
          required_conversations: data.required_conversations || 3,
          conversations_completed: 0 // This would come from user_progress
        });
      });
      
      setLevels(fetchedLevels);
      
      // Find current level index
      const currentIdx = fetchedLevels.findIndex(l => l.status === 'current');
      setCurrentLevelIndex(currentIdx >= 0 ? currentIdx : 0);
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, testMode]);

  // Subscribe to user stats
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserStats(currentUser.uid, (stats) => {
      setUserStats(stats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = levels.length > 0 
    ? ((currentLevelIndex + 1) / levels.length) * 100 
    : 0;

  const tierColors = {
    1: 'from-green-500 to-teal-500',
    2: 'from-blue-500 to-purple-500',
    3: 'from-purple-500 to-pink-500'
  };

  const tierNames = {
    1: 'Foundation Skills',
    2: 'Intermediate Skills',
    3: 'Advanced Skills'
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Forest background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />
      
      {/* Floating elements */}
      <div className="fixed top-20 left-10 w-8 h-8 opacity-30">
        <div className="text-4xl animate-float">🍃</div>
      </div>
      <div className="fixed top-40 right-20 w-8 h-8 opacity-30">
        <div className="text-4xl animate-float-delayed">🍂</div>
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
            <h1 className="text-3xl font-bold text-primary-foreground">Your Learning Journey</h1>
            {testMode && (
              <Badge className="ml-auto bg-yellow-500 text-black">
                Test Mode - All Levels Unlocked
              </Badge>
            )}
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
              <div className="flex items-center gap-2 text-primary-foreground">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">Level {currentLevelIndex + 1} of {levels.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar 
              value={progressPercentage}
              label={`Overall Progress: ${Math.round(progressPercentage)}%`}
              variant="success"
            />
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-0">
          {levels.map((level, index) => {
            const isNewTier = level.order === 1 || level.order === 7 || level.order === 13;
            
            return (
              <div key={level.id} className="relative">
                {/* Tier Marker */}
                {isNewTier && (
                  <div className="text-center mb-8 mt-8">
                    <div className={`inline-block bg-gradient-to-r ${tierColors[level.tier]} text-white px-8 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-transform`}>
                      <div className="flex items-center gap-3">
                        {level.tier === 1 && <Star className="w-5 h-5" />}
                        {level.tier === 2 && <Sparkles className="w-5 h-5" />}
                        {level.tier === 3 && <Trophy className="w-5 h-5" />}
                        <span className="text-lg">Tier {level.tier}: {tierNames[level.tier]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Level Card */}
                <div className={`relative self-${level.position === 'left' ? 'start' : level.position === 'right' ? 'end' : 'center'} w-72`}>
                  <Card 
                    className={`p-4 shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                      level.status === 'current' 
                        ? 'ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                        : level.status === 'completed'
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                        : level.status === 'available'
                        ? 'bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl'
                        : 'bg-gray-50 opacity-75'
                    }`}
                    onClick={() => {
                      if (level.status !== 'locked' || testMode) {
                        navigate(`/conversation/${level.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {level.order}
                          </span>
                          {level.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {level.status === 'current' && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          )}
                          {level.status === 'locked' && !testMode && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-bold text-lg mt-1">{level.name}</h3>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        +{level.xp_reward} XP
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {level.description}
                    </p>
                    
                    {/* Progress for current level */}
                    {level.status === 'current' && (
                      <div className="mb-3">
                        <ProgressBar 
                          value={(level.conversations_completed || 0) / level.required_conversations * 100}
                          label={`${level.conversations_completed || 0}/${level.required_conversations} conversations`}
                          variant="warning"
                        />
                      </div>
                    )}
                    
                    {/* Objectives preview */}
                    <div className="space-y-1">
                      {level.objectives.slice(0, 2).map((objective, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          <span>{objective}</span>
                        </div>
                      ))}
                      {level.objectives.length > 2 && (
                        <div className="text-xs text-muted-foreground italic">
                          +{level.objectives.length - 2} more objectives
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      className="w-full mt-3"
                      variant={level.status === 'current' ? 'default' : level.status === 'available' ? 'outline' : 'ghost'}
                      disabled={level.status === 'locked' && !testMode}
                    >
                      {level.status === 'current' ? 'Continue' : 
                       level.status === 'completed' ? 'Review' : 
                       level.status === 'available' || testMode ? 'Start' : 
                       'Locked'}
                    </Button>
                  </Card>
                  
                  {/* Connecting line */}
                  {index < levels.length - 1 && (
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                      <div className="w-1 h-16 bg-gradient-to-b from-gray-300 to-transparent" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Journey Complete Marker */}
          {levels.length > 0 && (
            <div className="self-center flex flex-col items-center gap-4 mt-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-yellow-400 flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <p className="font-bold text-xl text-foreground">Conversation Master!</p>
              <p className="text-muted-foreground text-center max-w-md">
                Complete all 18 levels to become a master of social communication
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}