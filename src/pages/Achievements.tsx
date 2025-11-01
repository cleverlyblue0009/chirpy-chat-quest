import { ArrowLeft, Trophy, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "@/components/AchievementCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NEW_ACHIEVEMENTS } from "@/lib/achievements/achievementDefinitions";
import forestBg from "@/assets/forest-background.jpg";

interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedDate?: Date;
  progress?: number;
  requirement: string;
  category: string;
}

export default function Achievements() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 18,
    unlocked: 0,
    percentage: 0,
  });

  useEffect(() => {
    const loadAchievements = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Get user's unlocked achievements
        const userAchievementsRef = collection(db, 'user_achievements');
        const q = query(userAchievementsRef, where('user_id', '==', currentUser.uid));
        const userAchievementsSnapshot = await getDocs(q);
        
        const unlockedAchievementIds = new Set<string>();
        const unlockedDates: { [key: string]: Date } = {};
        
        userAchievementsSnapshot.forEach(doc => {
          const data = doc.data();
          unlockedAchievementIds.add(data.achievement_id);
          unlockedDates[data.achievement_id] = data.unlocked_at?.toDate();
        });
        
        // Get user's progress data for calculating progress toward achievements
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        const totalXP = userData?.total_xp || 0;
        const streakDays = userData?.streak_count || 0;
        
        const progressRef = collection(db, 'user_progress');
        const progressQuery = query(progressRef, where('user_id', '==', currentUser.uid));
        const progressSnapshot = await getDocs(progressQuery);
        
        let levelsCompleted = 0;
        progressSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            levelsCompleted++;
          }
        });
        
        // Map all achievements to display format
        const achievementDisplays: AchievementDisplay[] = NEW_ACHIEVEMENTS.map((achievement, index) => {
          const achievementId = achievement.name.toLowerCase().replace(/\s+/g, '_');
          const isUnlocked = unlockedAchievementIds.has(achievementId);
          
          // Calculate progress for locked achievements
          let progress = 0;
          let requirement = '';
          let category = 'General';
          
          const { type, value } = achievement.unlock_criteria;
          
          switch (type) {
            case 'levels_completed':
              progress = Math.min((levelsCompleted / value) * 100, 100);
              requirement = `Complete ${value} level${value > 1 ? 's' : ''}`;
              category = 'Milestones';
              break;
            case 'streak_days':
              progress = Math.min((streakDays / value) * 100, 100);
              requirement = `Practice ${value} days in a row`;
              category = 'Streaks';
              break;
            case 'total_xp':
              progress = Math.min((totalXP / value) * 100, 100);
              requirement = `Reach ${value.toLocaleString()} XP`;
              category = 'XP Milestones';
              break;
            case 'pronunciation_excellence':
              requirement = `Achieve ${value}+ pronunciation score`;
              category = 'Performance';
              break;
            case 'perfect_lesson':
              requirement = 'Complete a lesson with 0 errors';
              category = 'Performance';
              break;
            case 'speed_conversation':
              requirement = 'Complete a lesson in under 5 minutes';
              category = 'Performance';
              break;
            case 'lesson_repetition':
              requirement = `Complete same lesson ${value} times`;
              category = 'Consistency';
              break;
            case 'achievement_count':
              const unlockedCount = unlockedAchievementIds.size;
              progress = Math.min((unlockedCount / value) * 100, 100);
              requirement = `Unlock ${value} achievements`;
              category = 'Special';
              break;
            case 'weekly_lessons':
              requirement = `Complete ${value} lessons in one week`;
              category = 'Special';
              break;
            case 'skills_unlocked':
              requirement = `Unlock ${value} different skills`;
              category = 'Skills';
              break;
            case 'master_completion':
              requirement = 'Reach 2,000 XP and complete all 18 levels';
              category = 'Ultimate';
              break;
            default:
              requirement = 'Complete the requirement';
          }
          
          return {
            id: achievementId,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            isUnlocked,
            unlockedDate: unlockedDates[achievementId],
            progress: isUnlocked ? 100 : Math.round(progress),
            requirement,
            category,
          };
        });
        
        setAchievements(achievementDisplays);
        
        // Update stats
        const unlockedCount = achievementDisplays.filter(a => a.isUnlocked).length;
        setStats({
          total: achievementDisplays.length,
          unlocked: unlockedCount,
          percentage: Math.round((unlockedCount / achievementDisplays.length) * 100),
        });
        
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAchievements();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);
  
  // Group by category
  const categories = Array.from(new Set(achievements.map(a => a.category)));
  const achievementsByCategory = categories.reduce((acc, category) => {
    acc[category] = achievements.filter(a => a.category === category);
    return acc;
  }, {} as { [key: string]: AchievementDisplay[] });

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Forest background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-8 h-8" />
                Achievements
              </h1>
              <p className="text-white/80 mt-1">
                Unlocked {stats.unlocked} of {stats.total} achievements ({stats.percentage}%)
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked ({stats.unlocked})</TabsTrigger>
            <TabsTrigger value="locked">Locked ({stats.total - stats.unlocked})</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>
          
          {/* All Achievements */}
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  icon={achievement.icon}
                  title={achievement.name}
                  description={achievement.description}
                  isUnlocked={achievement.isUnlocked}
                  unlockedDate={achievement.unlockedDate}
                  progress={achievement.progress}
                  requirement={achievement.requirement}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Unlocked Achievements */}
          <TabsContent value="unlocked">
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.name}
                    description={achievement.description}
                    isUnlocked={achievement.isUnlocked}
                    unlockedDate={achievement.unlockedDate}
                    progress={achievement.progress}
                    requirement={achievement.requirement}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No Achievements Yet
                </h3>
                <p className="text-gray-600">
                  Complete lessons to unlock your first achievement!
                </p>
              </Card>
            )}
          </TabsContent>
          
          {/* Locked Achievements */}
          <TabsContent value="locked">
            {lockedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.name}
                    description={achievement.description}
                    isUnlocked={achievement.isUnlocked}
                    progress={achievement.progress}
                    requirement={achievement.requirement}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-gradient-to-br from-yellow-50 to-orange-50">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🎉 All Achievements Unlocked!
                </h3>
                <p className="text-gray-700">
                  Congratulations! You're a Master Conversationalist!
                </p>
              </Card>
            )}
          </TabsContent>
          
          {/* By Category */}
          <TabsContent value="categories">
            <div className="space-y-8">
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <div key={category}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        icon={achievement.icon}
                        title={achievement.name}
                        description={achievement.description}
                        isUnlocked={achievement.isUnlocked}
                        unlockedDate={achievement.unlockedDate}
                        progress={achievement.progress}
                        requirement={achievement.requirement}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
