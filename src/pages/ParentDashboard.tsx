import { ArrowLeft, TrendingUp, Calendar, Award, Target, Download, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import forestBg from "@/assets/forest-background.jpg";

interface WeeklyData {
  week: string;
  lessonsCompleted: number;
  xpEarned: number;
}

interface SkillData {
  name: string;
  proficiency: number;
  needsWork: boolean;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyData[]>([]);
  const [skillsData, setSkillsData] = useState<SkillData[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const user = userDoc.data();
        setUserData(user);
        
        // Get achievements
        const achievementsRef = collection(db, 'user_achievements');
        const achievementsQuery = query(achievementsRef, where('user_id', '==', currentUser.uid));
        const achievementsSnapshot = await getDocs(achievementsQuery);
        const userAchievements = achievementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          unlockedDate: doc.data().unlocked_at?.toDate()
        }));
        setAchievements(userAchievements);
        
        // Get skills proficiency
        const progressRef = collection(db, 'user_progress');
        const progressQuery = query(progressRef, where('user_id', '==', currentUser.uid));
        const progressSnapshot = await getDocs(progressQuery);
        
        const completedLevels: number[] = [];
        progressSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            const levelNum = parseInt(data.level_id.replace('level_', ''));
            if (!isNaN(levelNum)) {
              completedLevels.push(levelNum);
            }
          }
        });
        
        // Import skills mapping
        const { getSkillsWithProgress } = await import('@/lib/skills/skillsMapping');
        const skillsProgress = getSkillsWithProgress(completedLevels);
        
        const skills: SkillData[] = skillsProgress
          .filter(s => s.isUnlocked)
          .map(s => ({
            name: s.skill.name,
            proficiency: s.proficiency,
            needsWork: s.proficiency < 50
          }));
        
        setSkillsData(skills);
        
        // Identify areas needing work
        const weakSkills = skills.filter(s => s.needsWork);
        if (weakSkills.length > 0) {
          setAlerts([
            `${weakSkills.length} skill${weakSkills.length > 1 ? 's need' : ' needs'} more practice: ${weakSkills.map(s => s.name).join(', ')}`
          ]);
        }
        
        // Generate weekly progress from real data
        const xpHistoryRef = collection(db, 'xp_history');
        const xpHistoryQuery = query(xpHistoryRef, where('user_id', '==', currentUser.uid));
        const xpHistorySnapshot = await getDocs(xpHistoryQuery);
        
        // Group by week
        const weeklyData: { [key: string]: { lessons: number; xp: number } } = {};
        const now = new Date();
        
        xpHistorySnapshot.forEach(doc => {
          const data = doc.data();
          const date = data.timestamp?.toDate();
          if (!date) return;
          
          // Calculate week number from today
          const weeksDiff = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const weekKey = weeksDiff < 4 ? `Week ${4 - weeksDiff}` : null;
          
          if (weekKey && weeksDiff >= 0 && weeksDiff < 4) {
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { lessons: 0, xp: 0 };
            }
            weeklyData[weekKey].xp += data.amount || 0;
            if (data.reason === 'lesson_complete' || data.reason === 'conversation_complete') {
              weeklyData[weekKey].lessons += 1;
            }
          }
        });
        
        // Convert to array format
        const weeks: WeeklyData[] = [];
        for (let i = 1; i <= 4; i++) {
          const weekKey = `Week ${i}`;
          weeks.push({
            week: weekKey,
            lessonsCompleted: weeklyData[weekKey]?.lessons || 0,
            xpEarned: weeklyData[weekKey]?.xp || 0,
          });
        }
        
        setWeeklyProgress(weeks.reverse()); // Most recent week last
        
      } catch (error) {
        console.error('Error loading parent dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [currentUser]);

  const downloadReport = () => {
    // Generate a simple text report (in production, would generate PDF)
    const report = `
PARENT PROGRESS REPORT
Generated: ${new Date().toLocaleDateString()}
Child: ${userData?.name || 'User'}

OVERVIEW:
- Total XP: ${userData?.total_xp || 0}
- Current Streak: ${userData?.streak_count || 0} days
- Achievements Unlocked: ${achievements.length}

SKILLS PROGRESS:
${skillsData.map(s => `- ${s.name}: ${s.proficiency}%`).join('\n')}

WEEKLY SUMMARY:
${weeklyProgress.map(w => `${w.week}: ${w.lessonsCompleted} lessons, ${w.xpEarned} XP`).join('\n')}

AREAS NEEDING ATTENTION:
${alerts.join('\n')}
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
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
              <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
              <p className="text-white/80 mt-1">
                Track {userData?.name || 'your child'}'s conversation skills progress
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={downloadReport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userData?.total_xp || 0}</p>
                <p className="text-sm text-gray-600">Total XP</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userData?.streak_count || 0}</p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{achievements.length}</p>
                <p className="text-sm text-gray-600">Achievements</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{skillsData.length}</p>
                <p className="text-sm text-gray-600">Skills Unlocked</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              ?? Areas Needing Practice
            </h3>
            <ul className="space-y-2">
              {alerts.map((alert, index) => (
                <li key={index} className="text-sm text-gray-700">
                  ? {alert}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Weekly Progress Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Weekly Progress
          </h3>
          <div className="space-y-4">
            {weeklyProgress.map((week, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{week.week}</span>
                  <span className="text-gray-600">
                    {week.lessonsCompleted} lessons ? {week.xpEarned} XP
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${Math.min((week.xpEarned / 400) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skills Proficiency */}
        <Card className="p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-600" />
            Skills Proficiency
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillsData.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{skill.name}</span>
                  <span className={skill.needsWork ? 'text-orange-600 font-bold' : 'text-green-600'}>
                    {skill.proficiency}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      skill.needsWork ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Achievements */}
        <Card className="p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-600" />
            Recent Achievements
          </h3>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">??</div>
                  <div className="flex-1">
                    <p className="font-semibold">{achievement.achievement_id}</p>
                    <p className="text-xs text-gray-600">
                      Unlocked: {achievement.unlockedDate?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No achievements unlocked yet. Complete lessons to unlock achievements!
            </p>
          )}
        </Card>

        {/* Time Spent (coming soon) */}
        <Card className="p-6 bg-blue-50">
          <h3 className="font-bold text-lg mb-2">?? Detailed Analytics Coming Soon!</h3>
          <p className="text-sm text-gray-700">
            Future updates will include: Time spent in app, Detailed pronunciation data, 
            Emotion tracking insights, and more!
          </p>
        </Card>
      </div>
    </div>
  );
}
