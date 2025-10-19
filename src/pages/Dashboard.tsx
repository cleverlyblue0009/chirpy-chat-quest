import { MessageCircle, Award, Calendar, Sparkles, Target, Map, Bird as BirdIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { ProgressBar } from "@/components/ProgressBar";
import { BirdAvatar } from "@/components/BirdAvatar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { SkillProgress } from "@/components/SkillProgress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { subscribeToUserStats, fetchUserAchievements, type UserStats, type Achievement } from "@/lib/firebase/dashboardService";
import { subscribeToUserProgress } from "@/lib/firebase/learningPathService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";
import owlAvatar from "@/assets/owl-character.png";
import sparrowAvatar from "@/assets/sparrow-character.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skills, setSkills] = useState<Array<{ name: string; progress: number; isLocked?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentLevelName, setCurrentLevelName] = useState("");
  const [currentLevelProgress, setCurrentLevelProgress] = useState(0);
  const [conversationsInLevel, setConversationsInLevel] = useState(0);
  const [totalConversationsNeeded, setTotalConversationsNeeded] = useState(5);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getBirdAvatar = (birdId: string) => {
    const avatarMap: { [key: string]: string } = {
      'ruby_robin': robinAvatar,
      'sage_owl': owlAvatar,
      'charlie_sparrow': sparrowAvatar,
    };
    return avatarMap[birdId] || robinAvatar;
  };

  const getBirdName = (birdId: string) => {
    const nameMap: { [key: string]: string } = {
      'ruby_robin': 'Ruby Robin',
      'sage_owl': 'Wise Owl',
      'charlie_sparrow': 'Chatty Sparrow',
    };
    return nameMap[birdId] || 'Ruby Robin';
  };

  // Subscribe to real-time user stats
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = subscribeToUserStats(currentUser.uid, (stats) => {
      setUserStats(stats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch achievements
  useEffect(() => {
    if (!currentUser) return;

    const loadAchievements = async () => {
      const userAchievements = await fetchUserAchievements(currentUser.uid);
      setAchievements(userAchievements.slice(0, 3)); // Show only 3 most recent
    };

    loadAchievements();
  }, [currentUser]);

  // Subscribe to skills progress
  useEffect(() => {
    if (!currentUser) return;

    const skillsRef = collection(db, 'user_skills');
    const q = query(skillsRef, where('user_id', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userSkills: Array<{ name: string; progress: number; isLocked?: boolean }> = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        userSkills.push({
          name: data.skill_name,
          progress: data.progress || 0,
          isLocked: data.is_locked || false
        });
      });

      // If no skills in Firebase, use defaults
      if (userSkills.length === 0) {
        setSkills([
          { name: "Greetings & Introductions", progress: 100 },
          { name: "Turn-Taking", progress: 75 },
          { name: "Active Listening", progress: 60 },
          { name: "Emotion Recognition", progress: 40 },
          { name: "Topic Maintenance", progress: 25 },
          { name: "Asking Questions", progress: 0, isLocked: true },
          { name: "Ending Conversations", progress: 0, isLocked: true },
        ]);
      } else {
        setSkills(userSkills);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Get current level details
  useEffect(() => {
    if (!currentUser || !userStats) return;

    const levelsRef = collection(db, 'levels');
    const progressRef = collection(db, 'user_progress');
    
    // Subscribe to current level
    const unsubscribeLevels = onSnapshot(levelsRef, (levelsSnapshot) => {
      const level = levelsSnapshot.docs.find(doc => doc.id === userStats.currentLevel);
      if (level) {
        setCurrentLevelName(level.data().name || 'Level 1');
        setTotalConversationsNeeded(level.data().required_conversations || 5);
      }
    });

    // Subscribe to progress in current level
    const q = query(
      progressRef,
      where('user_id', '==', currentUser.uid),
      where('level_id', '==', userStats.currentLevel)
    );
    
    const unsubscribeProgress = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const progress = snapshot.docs[0].data();
        setConversationsInLevel(progress.conversations_completed || 0);
        const percentage = ((progress.conversations_completed || 0) / totalConversationsNeeded) * 100;
        setCurrentLevelProgress(Math.min(percentage, 100));
      }
    });

    return () => {
      unsubscribeLevels();
      unsubscribeProgress();
    };
  }, [currentUser, userStats, totalConversationsNeeded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Forest background with parallax effect */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${forestBg})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Welcome Section */}
        <div className="bg-gradient-forest rounded-3xl p-6 shadow-soft-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <BirdAvatar 
                name={getBirdName(userStats.currentBird)} 
                imageSrc={getBirdAvatar(userStats.currentBird)}
                size="xl"
                isActive
                onClick={() => navigate("/birds")}
              />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">
                  {getGreeting()}, {userStats.userName}!
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  {getBirdName(userStats.currentBird)} is excited to learn with you today
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center bg-white/20 rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-primary-foreground">{userStats.currentStreak}</p>
                <p className="text-xs text-primary-foreground/80">Day Streak 🔥</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-primary-foreground">{userStats.totalXP}</p>
                <p className="text-xs text-primary-foreground/80">Total XP ✨</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard 
            icon={MessageCircle}
            title="Conversations"
            value={userStats.conversationsCompleted}
            subtitle="Completed this week"
          />
          <StatsCard 
            icon={Award}
            title="Skills Mastered"
            value={`${userStats.skillsMastered} of ${userStats.totalSkills}`}
            subtitle="Keep going!"
            variant="success"
          />
          <StatsCard 
            icon={Calendar}
            title="Active Days"
            value={userStats.activeDaysThisMonth}
            subtitle="This month"
            variant="warning"
          />
        </div>

        {/* Continue Learning */}
        <Card className="p-6 shadow-soft-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-secondary" />
                Continue Learning
              </h2>
              <p className="text-muted-foreground mt-1">{currentLevelName}</p>
            </div>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft-md"
              onClick={() => navigate("/path")}
            >
              Continue
            </Button>
          </div>
          <ProgressBar 
            value={currentLevelProgress} 
            label={`${conversationsInLevel} of ${totalConversationsNeeded} conversations completed`}
          />
        </Card>

        {/* Recent Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-secondary" />
            Recent Achievements
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <AchievementBadge 
                  key={achievement.id}
                  icon={achievement.icon === 'calendar' ? Calendar : achievement.icon === 'bird' ? BirdIcon : MessageCircle}
                  title={achievement.title}
                  description={achievement.description}
                  isNew={achievement.isNew}
                />
              ))
            ) : (
              <>
                <AchievementBadge 
                  icon={MessageCircle}
                  title="First Conversation!"
                  description="Complete your first conversation"
                />
                <AchievementBadge 
                  icon={Calendar}
                  title="3 Day Streak!"
                  description="Keep practicing for 3 days"
                />
                <AchievementBadge 
                  icon={BirdIcon}
                  title="Bird Collector"
                  description="Unlock new bird companions"
                />
              </>
            )}
          </div>
        </div>

        {/* Skills Progress */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Your Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((skill, index) => (
              <SkillProgress 
                key={index}
                name={skill.name}
                progress={skill.progress}
                isLocked={skill.isLocked}
              />
            ))}
          </div>
        </div>

        {/* Daily Challenge */}
        <Card className="p-6 bg-accent shadow-soft-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-foreground/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-accent-foreground">Today's Mini Challenge</h3>
              <p className="text-accent-foreground/80 mt-1">
                Have a 2-minute conversation about your favorite hobby!
              </p>
              <p className="text-sm text-accent-foreground/70 mt-2">
                Reward: +50 XP
              </p>
            </div>
            <Button variant="secondary" className="font-bold">
              Start
            </Button>
          </div>
        </Card>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft-lg">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-around py-4">
              <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate("/")}>
                <BirdIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Home</span>
              </Button>
              <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate("/path")}>
                <Map className="w-6 h-6 mb-1" />
                <span className="text-xs">Path</span>
              </Button>
              <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate("/birds")}>
                <BirdIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Birds</span>
              </Button>
              <Button variant="ghost" className="flex-col h-auto py-2">
                <Award className="w-6 h-6 mb-1" />
                <span className="text-xs">Progress</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
