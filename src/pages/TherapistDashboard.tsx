import { ArrowLeft, TrendingUp, Brain, Smile, Mic2, MessageSquare, Download, Loader2, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import forestBg from "@/assets/forest-background.jpg";

interface EmotionBreakdown {
  emotion: string;
  count: number;
  percentage: number;
}

interface LessonData {
  id: string;
  date: Date;
  level: string;
  pronunciationScore: number;
  emotionsDetected: string[];
  duration: number;
}

interface TherapistNote {
  id: string;
  date: Date;
  note: string;
  goals?: string[];
}

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [emotionData, setEmotionData] = useState<EmotionBreakdown[]>([]);
  const [lessonHistory, setLessonHistory] = useState<LessonData[]>([]);
  const [pronunciationTrend, setPronunciationTrend] = useState<number[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<TherapistNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  
  useEffect(() => {
    const loadTherapistData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const user = userDoc.data();
        setUserData(user);
        
        // Get conversation history with emotion and pronunciation data
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(
          conversationsRef, 
          where('user_id', '==', currentUser.uid),
          where('completed_at', '!=', null)
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        
        const lessons: LessonData[] = [];
        const emotions: { [key: string]: number } = {};
        const pronunciationScores: number[] = [];
        
        conversationsSnapshot.forEach(doc => {
          const data = doc.data();
          
          // Extract pronunciation scores
          if (data.messages) {
            const userMessages = data.messages.filter((m: any) => m.sender === 'user');
            const avgPronunciation = userMessages.reduce((sum: number, m: any) => 
              sum + (m.pronunciation_score || 0), 0) / (userMessages.length || 1);
            
            if (avgPronunciation > 0) {
              pronunciationScores.push(avgPronunciation);
            }
          }
          
          // Extract emotion data
          if (data.emotion_timeline) {
            data.emotion_timeline.forEach((e: any) => {
              const emotion = e.emotion || 'neutral';
              emotions[emotion] = (emotions[emotion] || 0) + 1;
            });
          }
          
          lessons.push({
            id: doc.id,
            date: data.completed_at?.toDate() || new Date(),
            level: data.level_id,
            pronunciationScore: pronunciationScores[pronunciationScores.length - 1] || 0,
            emotionsDetected: data.emotion_timeline?.map((e: any) => e.emotion) || [],
            duration: 0 // Would calculate from timestamps
          });
        });
        
        setLessonHistory(lessons);
        setPronunciationTrend(pronunciationScores.slice(-10)); // Last 10
        
        // Calculate emotion breakdown
        const totalEmotions = Object.values(emotions).reduce((a, b) => a + b, 0);
        const emotionBreakdown: EmotionBreakdown[] = Object.entries(emotions).map(([emotion, count]) => ({
          emotion,
          count,
          percentage: Math.round((count / totalEmotions) * 100)
        }));
        setEmotionData(emotionBreakdown);
        
        // Load therapist notes
        const notesRef = collection(db, 'therapist_notes');
        const notesQuery = query(notesRef, where('user_id', '==', currentUser.uid));
        const notesSnapshot = await getDocs(notesQuery);
        const notes: TherapistNote[] = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          date: doc.data().created_at?.toDate() || new Date(),
          note: doc.data().note,
          goals: doc.data().goals || []
        }));
        setTherapistNotes(notes);
        
      } catch (error) {
        console.error('Error loading therapist dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTherapistData();
  }, [currentUser]);

  const saveNote = async () => {
    if (!currentUser || !newNote.trim()) return;
    
    try {
      const notesRef = collection(db, 'therapist_notes');
      await setDoc(doc(notesRef), {
        user_id: currentUser.uid,
        note: newNote.trim(),
        goals: customGoals,
        created_at: Timestamp.now()
      });
      
      setNewNote('');
      // Reload notes
      window.location.reload();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const downloadDetailedReport = () => {
    const report = `
THERAPIST PROGRESS REPORT
Generated: ${new Date().toLocaleString()}
Client: ${userData?.name || 'User'}

=== OVERVIEW ===
Total XP: ${userData?.total_xp || 0}
Current Streak: ${userData?.streak_count || 0} days
Lessons Completed: ${lessonHistory.length}

=== PRONUNCIATION ANALYSIS ===
Average Pronunciation: ${pronunciationTrend.length > 0 
  ? Math.round(pronunciationTrend.reduce((a, b) => a + b, 0) / pronunciationTrend.length) 
  : 0}%
Trend: ${pronunciationTrend.slice(-5).join(', ')}%

=== EMOTION TRACKING ===
${emotionData.map(e => `${e.emotion}: ${e.percentage}% (${e.count} occurrences)`).join('\n')}

=== SESSION NOTES ===
${therapistNotes.map(n => `
[${n.date.toLocaleDateString()}]
${n.note}
${n.goals && n.goals.length > 0 ? `Goals: ${n.goals.join(', ')}` : ''}
`).join('\n')}

=== RECOMMENDATIONS ===
Based on the data, consider focusing on:
${emotionData.find(e => e.emotion === 'frustrated' || e.emotion === 'sad') 
  ? '- Emotional regulation strategies during challenging tasks' 
  : ''}
${pronunciationTrend[pronunciationTrend.length - 1] < 70 
  ? '- Additional pronunciation practice exercises' 
  : ''}
- Continue with current lesson progression
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `therapist-report-${new Date().toISOString().split('T')[0]}.txt`;
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
      <div className="relative z-10 bg-gradient-to-r from-blue-600 to-teal-500 shadow-lg">
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
              <h1 className="text-3xl font-bold text-white">Therapist Dashboard</h1>
              <p className="text-white/80 mt-1">
                Professional insights for {userData?.name || 'client'}
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={downloadDetailedReport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="notes">Session Notes</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-3xl font-bold">{lessonHistory.length}</p>
                    <p className="text-sm text-gray-600">Sessions Completed</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Mic2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-3xl font-bold">
                      {pronunciationTrend.length > 0 
                        ? Math.round(pronunciationTrend.reduce((a, b) => a + b, 0) / pronunciationTrend.length) 
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600">Avg Pronunciation</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Smile className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-3xl font-bold">
                      {emotionData.find(e => e.emotion === 'happy')?.percentage || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Positive Engagement</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Week-over-Week Improvement */}
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Progress Indicators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Pronunciation Trend</h4>
                  <div className="space-y-2">
                    {pronunciationTrend.slice(-5).map((score, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-20">Session {pronunciationTrend.length - 4 + index}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12">{Math.round(score)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Engagement Levels</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-semibold text-green-900">Strengths</p>
                      <p className="text-sm text-green-700">
                        {pronunciationTrend[pronunciationTrend.length - 1] >= 80 
                          ? 'Strong pronunciation skills' 
                          : 'Consistent participation'}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-900">Focus Areas</p>
                      <p className="text-sm text-yellow-700">
                        {emotionData.find(e => ['sad', 'frustrated'].includes(e.emotion)) 
                          ? 'Emotional support during challenging tasks' 
                          : 'Continue current progression'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Pronunciation Tab */}
          <TabsContent value="pronunciation" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Speech Clarity Analysis</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {pronunciationTrend.filter(s => s >= 80).length}
                    </p>
                    <p className="text-sm text-gray-600">Excellent Sessions</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      {pronunciationTrend.filter(s => s >= 60 && s < 80).length}
                    </p>
                    <p className="text-sm text-gray-600">Good Sessions</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">
                      {pronunciationTrend.filter(s => s < 60).length}
                    </p>
                    <p className="text-sm text-gray-600">Needs Practice</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Recent Sessions</h4>
                  <div className="space-y-2">
                    {lessonHistory.slice(-10).reverse().map((lesson, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{lesson.level}</p>
                          <p className="text-xs text-gray-600">{lesson.date.toLocaleDateString()}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          lesson.pronunciationScore >= 80 ? 'bg-green-100 text-green-800' :
                          lesson.pronunciationScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(lesson.pronunciationScore)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Emotions Tab */}
          <TabsContent value="emotions" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Emotional Response Tracking</h3>
              <div className="space-y-4">
                {emotionData.map((emotion, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{emotion.emotion}</span>
                      <span className="text-gray-600">{emotion.percentage}% ({emotion.count} times)</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          emotion.emotion === 'happy' || emotion.emotion === 'excited' ? 'bg-green-500' :
                          emotion.emotion === 'neutral' ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${emotion.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Insights</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Overall engagement: {emotionData.find(e => e.emotion === 'happy')?.percentage || 0 > 50 ? 'Positive' : 'Needs attention'}</li>
                  <li>• Frustration indicators: {emotionData.find(e => ['frustrated', 'angry'].includes(e.emotion))?.count || 0} occurrences</li>
                  <li>• Recommended action: {emotionData.find(e => e.emotion === 'frustrated')?.percentage || 0 > 20 
                    ? 'Consider adjusting difficulty or providing more support' 
                    : 'Continue current approach'}</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Add Session Note</h3>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter observations, progress notes, or recommendations..."
                className="mb-4 min-h-[120px]"
              />
              <Button onClick={saveNote} disabled={!newNote.trim()}>
                Save Note
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">Previous Notes</h3>
              <div className="space-y-4">
                {therapistNotes.length > 0 ? (
                  therapistNotes.map((note, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">Session Note</p>
                        <p className="text-xs text-gray-500">{note.date.toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                      {note.goals && note.goals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-600">Goals:</p>
                          <ul className="text-xs text-gray-600 ml-4">
                            {note.goals.map((goal, idx) => (
                              <li key={idx}>• {goal}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No notes yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
