import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Mic, MicOff, Lightbulb, Volume2, Loader2, Send, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp, doc, updateDoc, getDoc, addDoc, collection, setDoc, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getLessonData, checkResponse, type LessonData, type TrainingQuestion } from "@/lib/lessons/lessonData";
import { generateSpeech, playAudioWithAnimation } from "@/lib/speech/textToSpeech";
import { analyzePronunciation } from "@/lib/speech/pronunciation";
import { XPService } from "@/lib/firebase/xpService";
import { UserService } from "@/lib/firebase/userService";
import { WebcamEmotionDetector } from "@/components/WebcamEmotionDetector";
import { ParentalConsentModal } from "@/components/ParentalConsentModal";
import { EmotionAnalysis, ParentalConsent } from "@/types/emotion";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";
import owlAvatar from "@/assets/owl-character.png";
import sparrowAvatar from "@/assets/sparrow-character.png";

const birdAvatars: { [key: string]: string } = {
  ruby_robin: robinAvatar,
  sage_owl: owlAvatar,
  charlie_sparrow: sparrowAvatar,
};

interface QuestionAttempt {
  questionId: string;
  userResponse: string;
  isCorrect: boolean;
  attempts: number;
  pronunciationScore?: number;
  emotion?: string;
}

export default function StructuredLesson() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { levelId = "level_1" } = useParams();
  const { currentUser } = useAuth();
  
  // Lesson state
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAttempts, setQuestionAttempts] = useState<QuestionAttempt[]>([]);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [totalXPEarned, setTotalXPEarned] = useState(0);
  
  // Input state
  const [isRecording, setIsRecording] = useState(false);
  const [isBirdSpeaking, setIsBirdSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasRespondedToQuestion, setHasRespondedToQuestion] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [noResponseTimer, setNoResponseTimer] = useState<NodeJS.Timeout | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{sender: 'bird' | 'user', text: string}>>([]);
  
  // Bird & conversation state
  const [birdCharacter, setBirdCharacter] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>("");
  
  // Emotion detection state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [parentalConsent, setParentalConsent] = useState<ParentalConsent | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [showEmotionDetector, setShowEmotionDetector] = useState(false);
  const [emotionDetectorEnabled, setEmotionDetectorEnabled] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [emotionResponseGiven, setEmotionResponseGiven] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load lesson data
  useEffect(() => {
    const lesson = getLessonData(levelId);
    if (lesson) {
      setLessonData(lesson);
      console.log('📚 Loaded lesson:', lesson.name, 'with', lesson.trainingQuestions.length, 'questions');
    } else {
      console.error('❌ Lesson not found for level:', levelId);
      toast({
        title: "Error",
        description: "Lesson data not found",
        variant: "destructive",
      });
      navigate('/path');
    }
  }, [levelId, navigate, toast]);

  // Load bird character
  useEffect(() => {
    const loadBirdCharacter = async () => {
      try {
        const birdDoc = await getDoc(doc(db, 'bird_characters', 'ruby_robin'));
        if (birdDoc.exists()) {
          setBirdCharacter({ id: 'ruby_robin', ...birdDoc.data() });
        }
      } catch (error) {
        console.error('Error loading bird character:', error);
      }
    };
    loadBirdCharacter();
  }, []);

  // Check parental consent
  useEffect(() => {
    const checkParentalConsent = async () => {
      if (!currentUser) return;
      
      try {
        const consentDoc = await getDoc(doc(db, 'parental_consent', currentUser.uid));
        if (consentDoc.exists()) {
          const consent = consentDoc.data() as ParentalConsent;
          setParentalConsent(consent);
          if (consent.features.facialDetection) {
            setShowEmotionDetector(true);
            console.log('✅ Facial detection authorized');
          }
        } else {
          setTimeout(() => setShowConsentModal(true), 2000);
        }
      } catch (error: any) {
        console.error('Error checking parental consent:', error);
      }
    };
    
    checkParentalConsent();
  }, [currentUser]);

  // Handle parental consent
  const handleParentalConsent = async (consent: ParentalConsent) => {
    if (!currentUser) return;
    
    try {
      await setDoc(doc(db, 'parental_consent', currentUser.uid), {
        ...consent,
        userId: currentUser.uid,
        timestamp: Timestamp.now(),
      }, { merge: true });
      
      setParentalConsent(consent);
      setShowConsentModal(false);
      
      if (consent.features.facialDetection) {
        setShowEmotionDetector(true);
        setEmotionDetectorEnabled(true);
        toast({
          title: "Features Enabled",
          description: "Facial emotion detection enabled.",
        });
      }
    } catch (error) {
      console.error('Error saving parental consent:', error);
      toast({
        title: "Error",
        description: "Failed to save consent preferences.",
        variant: "destructive",
      });
    }
  };

  // Handle emotion detection
  const handleEmotionDetected = useCallback((analysis: EmotionAnalysis) => {
    console.log('🎭 Emotion detected:', analysis.currentEmotion, 'confidence:', analysis.confidence);
    setCurrentEmotion(analysis);
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const checkSpeechRecognitionSupport = () => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        setUseTextInput(true);
        return false;
      }
      return true;
    };
    
    if (checkSpeechRecognitionSupport()) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
      } catch (error) {
        setUseTextInput(true);
      }
    }
  }, []);

  // Start lesson with Ruby's warm greeting
  const startLesson = async () => {
    if (!lessonData || !birdCharacter || !currentUser) return;
    
    setIsLoading(true);
    setLessonStarted(true);
    
    try {
      // Create conversation record
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        user_id: currentUser.uid,
        level_id: levelId,
        messages: [],
        started_at: Timestamp.now(),
        lesson_mode: 'structured',
      });
      setConversationId(conversationRef.id);
      
      // Ruby's warm greeting
      const greetingMessage = `Hello! I'm so happy to see you today! 🌟`;
      const introMessage = `Today we're going to practice ${lessonData.goal}. I'll ask you some questions, and we can chat like friends! Ready?`;
      
      // Add greeting to chat
      setChatMessages([{ sender: 'bird', text: greetingMessage }]);
      
      // Generate speech for greeting
      const greetingAudioUrl = await generateSpeech(
        greetingMessage,
        'ruby_robin',
        conversationRef.id
      ).catch(() => undefined);
      
      if (greetingAudioUrl) {
        await playAudioWithAnimation(
          greetingAudioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(greetingMessage);
        setIsBirdSpeaking(true);
        await new Promise(resolve => {
          utterance.onend = () => {
            setIsBirdSpeaking(false);
            resolve(true);
          };
          speechSynthesis.speak(utterance);
        });
      }
      
      // Wait a bit, then add intro
      await new Promise(resolve => setTimeout(resolve, 1500));
      setChatMessages(prev => [...prev, { sender: 'bird', text: introMessage }]);
      
      // Speak intro
      const introAudioUrl = await generateSpeech(
        introMessage,
        'ruby_robin',
        conversationRef.id
      ).catch(() => undefined);
      
      if (introAudioUrl) {
        await playAudioWithAnimation(
          introAudioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(introMessage);
        setIsBirdSpeaking(true);
        await new Promise(resolve => {
          utterance.onend = () => {
            setIsBirdSpeaking(false);
            resolve(true);
          };
          speechSynthesis.speak(utterance);
        });
      }
      
      // After intro, ask first question
      setTimeout(() => askQuestion(0), 1000);
      
    } catch (error) {
      console.error('Error starting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to start lesson",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ask a specific question
  const askQuestion = async (questionIndex: number) => {
    if (!lessonData || questionIndex >= lessonData.trainingQuestions.length) return;
    
    const question = lessonData.trainingQuestions[questionIndex];
    setCurrentQuestionIndex(questionIndex);
    setHasRespondedToQuestion(false);
    setEmotionResponseGiven(false);
    setNudgeCount(0);
    
    // Clear any existing timer
    if (noResponseTimer) {
      clearTimeout(noResponseTimer);
    }
    
    console.log(`❓ Asking question ${questionIndex + 1}/${lessonData.trainingQuestions.length}:`, question.question);
    
    // Add question to chat
    setChatMessages(prev => [...prev, { sender: 'bird', text: question.question }]);
    
    try {
      const audioUrl = await generateSpeech(
        question.question,
        'ruby_robin',
        conversationId
      ).catch(() => undefined);
      
      if (audioUrl) {
        playAudioWithAnimation(
          audioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(question.question);
        setIsBirdSpeaking(true);
        utterance.onend = () => setIsBirdSpeaking(false);
        speechSynthesis.speak(utterance);
      }
      
      // Set 5-minute timer for first nudge
      const timer = setTimeout(() => {
        if (!hasRespondedToQuestion && nudgeCount === 0) {
          sendNudge();
        }
      }, 300000); // 5 minutes
      
      setNoResponseTimer(timer);
    } catch (error) {
      console.error('Error asking question:', error);
    }
  };
  
  // Send a gentle nudge
  const sendNudge = async () => {
    if (nudgeCount >= 2 || hasRespondedToQuestion) return;
    
    const nudgeMessages = [
      "Take your time! I'm here whenever you're ready to answer. 😊",
      "No rush! Let me know when you'd like to try. I believe in you! 💫"
    ];
    
    const nudgeMessage = nudgeMessages[nudgeCount];
    setNudgeCount(prev => prev + 1);
    
    // Add nudge to chat
    setChatMessages(prev => [...prev, { sender: 'bird', text: nudgeMessage }]);
    
    try {
      const audioUrl = await generateSpeech(
        nudgeMessage,
        'ruby_robin',
        conversationId
      ).catch(() => undefined);
      
      if (audioUrl) {
        playAudioWithAnimation(
          audioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(nudgeMessage);
        setIsBirdSpeaking(true);
        utterance.onend = () => setIsBirdSpeaking(false);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
    }
    
    // Set timer for second nudge (only once)
    if (nudgeCount === 0) {
      const timer = setTimeout(() => {
        if (!hasRespondedToQuestion) {
          sendNudge();
        }
      }, 300000); // Another 5 minutes
      setNoResponseTimer(timer);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      if (recognitionRef.current && !useTextInput) {
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          
          if (event.results[event.results.length - 1].isFinal) {
            stopRecording(transcript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setUseTextInput(true);
          }
          stopRecording();
        };
        
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access or use text input.",
        variant: "destructive",
      });
      setUseTextInput(true);
    }
  };

  // Stop recording
  const stopRecording = async (transcript?: string) => {
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }
    
    let audioBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => resolve();
        }
      });
      
      if (audioChunksRef.current.length > 0) {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (transcript && transcript.trim()) {
      await processUserResponse(transcript.trim(), audioBlob || undefined);
    }
  };

  // Process user response
  const processUserResponse = async (text: string, audioBlob?: Blob) => {
    if (!lessonData || !currentUser || hasRespondedToQuestion) return;
    
    setHasRespondedToQuestion(true);
    setIsLoading(true);
    
    // Clear nudge timer
    if (noResponseTimer) {
      clearTimeout(noResponseTimer);
      setNoResponseTimer(null);
    }
    
    // Add user response to chat
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    
    const question = lessonData.trainingQuestions[currentQuestionIndex];
    const isCorrect = checkResponse(text, question.expectedResponses);
    
    console.log('📝 User response:', text, '| Correct:', isCorrect);
    
    try {
      // Upload audio and analyze pronunciation if available
      let audioUrl: string | undefined;
      let pronunciationScore: number | undefined;
      
      if (audioBlob && currentUser) {
        const timestamp = Date.now();
        const audioRef = ref(storage, `audio/user_recordings/${currentUser.uid}/${timestamp}.webm`);
        await uploadBytes(audioRef, audioBlob);
        audioUrl = await getDownloadURL(audioRef);
        pronunciationScore = await analyzePronunciation(audioBlob);
      }
      
      // Get current attempt count for this question
      const existingAttempt = questionAttempts.find(a => a.questionId === question.id);
      const attemptNumber = existingAttempt ? existingAttempt.attempts + 1 : 1;
      
      // Update attempts
      const newAttempt: QuestionAttempt = {
        questionId: question.id,
        userResponse: text,
        isCorrect,
        attempts: attemptNumber,
        pronunciationScore,
        emotion: currentEmotion?.currentEmotion,
      };
      
      setQuestionAttempts(prev => {
        const filtered = prev.filter(a => a.questionId !== question.id);
        return [...filtered, newAttempt];
      });
      
      // Generate single support/feedback message based on correctness + emotion
      await provideFeedback(isCorrect, attemptNumber, pronunciationScore);
      
      // Calculate XP for this question
      if (isCorrect) {
        const baseXP = 10;
        const firstAttemptBonus = attemptNumber === 1 ? 5 : 0;
        const pronunciationBonus = pronunciationScore ? Math.round((pronunciationScore / 100) * 15) : 0;
        const questionXP = baseXP + firstAttemptBonus + pronunciationBonus;
        
        setTotalXPEarned(prev => prev + questionXP);
        
        // Move to next question after delay
        setTimeout(() => {
          if (currentQuestionIndex < lessonData.trainingQuestions.length - 1) {
            askQuestion(currentQuestionIndex + 1);
          } else {
            completeLessonSequence();
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error processing response:', error);
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTextInput("");
    }
  };

  // Provide single feedback message (NO SPAM)
  const provideFeedback = async (
    isCorrect: boolean, 
    attemptNumber: number,
    pronunciationScore?: number
  ) => {
    let feedbackMessage = '';
    
    // SINGLE message based on correctness + emotion + pronunciation
    if (isCorrect) {
      // Correct response feedback
      if (currentEmotion && currentEmotion.currentEmotion === 'happy' && currentEmotion.confidence > 0.6) {
        feedbackMessage = "🎉 Great job! I can see you're happy - that was perfect!";
      } else if (pronunciationScore && pronunciationScore >= 90) {
        feedbackMessage = "🌟 Excellent! Your pronunciation was perfect!";
      } else if (attemptNumber === 1) {
        feedbackMessage = "✅ Correct! You got it on the first try!";
      } else {
        feedbackMessage = "👍 Good! That's the right answer!";
      }
    } else {
      // Incorrect response feedback
      if (currentEmotion && ['sad', 'angry', 'fearful'].includes(currentEmotion.currentEmotion)) {
        feedbackMessage = "It's okay! Let's try this together. Take a deep breath. Can you try again?";
      } else if (attemptNumber >= 2) {
        const question = lessonData?.trainingQuestions[currentQuestionIndex];
        const hint = question?.hints?.[0] || '';
        feedbackMessage = `That's okay! ${hint ? `Hint: ${hint}` : 'Try again!'}`;
      } else {
        feedbackMessage = "Not quite! Try again - you can do it!";
      }
    }
    
    // Add feedback to chat
    setChatMessages(prev => [...prev, { sender: 'bird', text: feedbackMessage }]);
    
    // Speak the feedback (TTS)
    try {
      const audioUrl = await generateSpeech(
        feedbackMessage,
        'ruby_robin',
        conversationId
      ).catch(() => undefined);
      
      if (audioUrl) {
        playAudioWithAnimation(
          audioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(feedbackMessage);
        setIsBirdSpeaking(true);
        utterance.onend = () => setIsBirdSpeaking(false);
        speechSynthesis.speak(utterance);
      }
      
      // Mark that we've given emotion-aware response
      setEmotionResponseGiven(true);
      
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  // Complete lesson sequence
  const completeLessonSequence = async () => {
    if (!lessonData || !currentUser) return;
    
    setLessonComplete(true);
    
    // Calculate total XP with completion bonus
    const completionBonus = 20;
    const finalXP = totalXPEarned + completionBonus + lessonData.xpReward;
    
    console.log('🎊 Lesson complete! Total XP:', finalXP);
    
    try {
      // Update streak (daily login tracking)
      await UserService.updateStreak(currentUser.uid);
      
      // Award XP
      const xpAward = await XPService.awardXP(
        currentUser.uid,
        finalXP,
        'lesson_complete',
        `Completed ${lessonData.name}`,
        {
          levelId,
          questionsAnswered: questionAttempts.length,
          correctAnswers: questionAttempts.filter(a => a.isCorrect).length,
        }
      );
      
      // Show completion message
      const completionMessage = `🎉 Congratulations! You completed ${lessonData.name}!
      
You earned ${finalXP} XP! Great work on all ${lessonData.trainingQuestions.length} questions!

Keep practicing these skills in real conversations!`;
      
      toast({
        title: "🎊 Lesson Complete!",
        description: `You earned ${finalXP} XP!`,
        duration: 5000,
      });
      
      // Show level up if applicable
      if (xpAward.leveledUp) {
        setTimeout(() => {
          toast({
            title: "🎊 Level Up!",
            description: `You reached Level ${xpAward.newLevel}!`,
            duration: 4000,
          });
        }, 1500);
      }
      
      // Show achievement notifications
      if (xpAward.unlockedAchievements && xpAward.unlockedAchievements.length > 0) {
        setTimeout(() => {
          xpAward.unlockedAchievements!.forEach((achievementId, index) => {
            setTimeout(() => {
              toast({
                title: "🏆 Achievement Unlocked!",
                description: `${achievementId}`,
                duration: 4000,
              });
            }, index * 2000);
          });
        }, 3000);
      }
      
      // Navigate back after delay
      setTimeout(() => {
        navigate('/path');
      }, 6000);
      
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Lesson Complete!",
        description: `Great job! You earned ${finalXP} XP!`,
      });
      setTimeout(() => navigate('/path'), 3000);
    }
  };

  // Handle text input submit
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processUserResponse(textInput.trim());
    }
  };

  if (!lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = lessonStarted 
    ? ((currentQuestionIndex + 1) / lessonData.trainingQuestions.length) * 100 
    : 0;
  const currentQuestion = lessonData.trainingQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-green-500 to-blue-500 shadow-lg">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/path")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-bold">
                <Trophy className="w-4 h-4 mr-1" />
                {totalXPEarned} XP
              </Badge>
              <Badge variant="outline" className="text-white border-white text-sm">
                {lessonData.tier.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          {/* Lesson Goal */}
          <Card className="bg-white/95 p-4 mb-3">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-bold text-lg text-gray-900">
                  Lesson {lessonData.levelNumber}: {lessonData.name}
                </h2>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Goal:</strong> {lessonData.goal}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Progress */}
          {lessonStarted && !lessonComplete && (
            <div>
              <p className="text-white/90 text-sm mb-1">
                Question {currentQuestionIndex + 1} of {lessonData.trainingQuestions.length}
              </p>
              <Progress value={progress} className="h-2 bg-white/30" />
            </div>
          )}
        </div>
      </div>

      {/* Bird Character Section */}
      <div className="relative z-10 bg-gradient-to-b from-blue-100 to-transparent py-6">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full overflow-hidden shadow-lg bg-white ${
              isBirdSpeaking ? 'animate-bounce ring-4 ring-yellow-400' : ''
            }`}>
              <img 
                src={birdAvatars['ruby_robin'] || robinAvatar} 
                alt="Ruby Robin" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold mt-4">Ruby Robin</h2>
            {isBirdSpeaking && (
              <div className="flex items-center gap-2 mt-2 text-blue-600">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm animate-pulse">Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-32">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          
          {/* Pre-lesson: Start button */}
          {!lessonStarted && !lessonComplete && (
            <Card className="p-8 text-center shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Ready to Begin?</h3>
              <p className="text-gray-700 mb-6">
                {lessonData.description}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                You'll answer {lessonData.trainingQuestions.length} questions. Take your time and don't worry about mistakes!
              </p>
              <Button 
                size="lg" 
                onClick={startLesson}
                disabled={isLoading}
                className="text-lg px-8 py-6"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Start Lesson
              </Button>
            </Card>
          )}
          
          {/* During lesson: Chat conversation */}
          {lessonStarted && !lessonComplete && (
            <div className="space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] p-4 shadow-md ${
                      msg.sender === 'bird'
                        ? 'bg-white border-blue-200'
                        : 'bg-blue-50 border-green-200'
                    }`}
                  >
                    <p className="text-sm font-medium mb-2">
                      {msg.sender === 'bird' ? '🐦 Ruby Robin' : '👤 You'}
                    </p>
                    <p className="text-gray-800">{msg.text}</p>
                  </Card>
                </div>
              ))}
              
              {showHint && currentQuestion && currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-900">
                      <strong>Hint:</strong> {currentQuestion.hints[0]}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Post-lesson: Completion */}
          {lessonComplete && (
            <Card className="p-8 text-center shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold mb-4">Lesson Complete!</h3>
              <p className="text-xl text-gray-700 mb-6">
                You earned <strong>{totalXPEarned + 20 + lessonData.xpReward} XP</strong>!
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-2xl font-bold text-green-600">
                    {questionAttempts.filter(a => a.isCorrect).length}
                  </p>
                  <p className="text-sm text-gray-600">Questions Correct</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-2xl font-bold text-blue-600">
                    {lessonData.trainingQuestions.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Questions</p>
                </div>
              </div>
              <p className="text-gray-600">
                Returning to Learning Path...
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Controls (only show during active lesson) */}
      {lessonStarted && !lessonComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="container max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col items-center gap-4">
              
              {/* Text Input (fallback or preference) */}
              {useTextInput && (
                <div className="flex w-full gap-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                    placeholder="Type your answer..."
                    disabled={isLoading || isBirdSpeaking || hasRespondedToQuestion}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isLoading || isBirdSpeaking || hasRespondedToQuestion}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-4 w-full justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb className="w-5 h-5" />
                </Button>

                {/* Microphone Button */}
                {!useTextInput && (
                  <Button
                    size="lg"
                    onClick={isRecording ? () => stopRecording() : startRecording}
                    disabled={isBirdSpeaking || isLoading || hasRespondedToQuestion}
                    className={`
                      w-20 h-20 rounded-full
                      ${isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-600'
                      }
                    `}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </Button>
                )}

                {/* Toggle Input Method */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseTextInput(!useTextInput)}
                >
                  {useTextInput ? "Use Voice" : "Use Text"}
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                {isRecording ? "🎤 Listening... Tap to stop" : 
                 useTextInput ? "Type your answer and press Enter" :
                 hasRespondedToQuestion ? "Waiting for next question..." :
                 "Tap the microphone to speak"}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Webcam Emotion Detector */}
      {showEmotionDetector && parentalConsent?.features.facialDetection && (
        <div className="fixed top-24 right-4 z-50">
          <WebcamEmotionDetector
            onEmotionDetected={handleEmotionDetected}
            onPermissionChange={(state) => {
              setCameraActive(state.status === 'granted');
              if (state.status === 'granted') {
                setEmotionDetectorEnabled(true);
              }
            }}
            config={{
              enabled: emotionDetectorEnabled,
              showPreview: true,
              detectionInterval: 2000,
              privacyMode: true,
            }}
            showPrivacyNotice={true}
            minimizable={true}
            className="max-w-sm"
          />
          {cameraActive && currentEmotion && (
            <div className="mt-2 p-2 bg-white rounded-lg shadow-md text-xs">
              <div className="flex items-center gap-2">
                <span>😊 {currentEmotion.currentEmotion}</span>
                <span className={`px-2 py-1 rounded ${
                  currentEmotion.engagementLevel === 'high' ? 'bg-green-100 text-green-800' :
                  currentEmotion.engagementLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentEmotion.engagementLevel}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Parental Consent Modal */}
      <ParentalConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleParentalConsent}
        childName={currentUser?.displayName || "your child"}
      />
    </div>
  );
}
