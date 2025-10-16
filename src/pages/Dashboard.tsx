import { MessageCircle, Award, Calendar, Sparkles, Target, Map, Bird as BirdIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { ProgressBar } from "@/components/ProgressBar";
import { BirdAvatar } from "@/components/BirdAvatar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { SkillProgress } from "@/components/SkillProgress";
import { useNavigate } from "react-router-dom";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = "Alex";
  const currentBird = "Ruby Robin";
  const currentStreak = 3;
  const totalXP = 245;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const skills = [
    { name: "Greetings & Introductions", progress: 100 },
    { name: "Turn-Taking", progress: 75 },
    { name: "Active Listening", progress: 60 },
    { name: "Emotion Recognition", progress: 40 },
    { name: "Topic Maintenance", progress: 25 },
    { name: "Asking Questions", progress: 0, isLocked: true },
    { name: "Ending Conversations", progress: 0, isLocked: true },
  ];

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
                name={currentBird} 
                imageSrc={robinAvatar}
                size="xl"
                isActive
                onClick={() => navigate("/birds")}
              />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">
                  {getGreeting()}, {userName}!
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  {currentBird} is excited to learn with you today
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center bg-white/20 rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-primary-foreground">{currentStreak}</p>
                <p className="text-xs text-primary-foreground/80">Day Streak 🔥</p>
              </div>
              <div className="text-center bg-white/20 rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-primary-foreground">{totalXP}</p>
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
            value={12}
            subtitle="Completed this week"
          />
          <StatsCard 
            icon={Award}
            title="Skills Mastered"
            value="4 of 7"
            subtitle="Keep going!"
            variant="success"
          />
          <StatsCard 
            icon={Calendar}
            title="Active Days"
            value={18}
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
              <p className="text-muted-foreground mt-1">Level 3: Active Listening</p>
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
            value={40} 
            label="2 of 5 conversations completed"
          />
        </Card>

        {/* Recent Achievements */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-secondary" />
            Recent Achievements
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <AchievementBadge 
              icon={MessageCircle}
              title="First Conversation!"
              description="Completed your first conversation"
            />
            <AchievementBadge 
              icon={Calendar}
              title="3 Day Streak!"
              description="Keep the momentum going"
              isNew
            />
            <AchievementBadge 
              icon={BirdIcon}
              title="Bird Collector"
              description="Unlocked Wise Owl"
            />
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
