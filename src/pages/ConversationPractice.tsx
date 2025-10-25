import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Mic, MicOff, Lightbulb, Volume2, Loader2, Send, Camera, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  getDoc,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { generateAIResponse, generateInitialGreeting } from "@/lib/ai/conversationEngine";
import { generateSpeech, playAudioWithAnimation } from "@/lib/speech/textToSpeech";
import { analyzePronunciation } from "@/lib/speech/pronunciation";
import { WebcamEmotionDetector } from "@/components/WebcamEmotionDetector";
import { ParentalConsentModal } from "@/components/ParentalConsentModal";
import { FaceDetectionService } from "@/lib/emotion/faceDetection";
import { EmotionAnalysis, ParentalConsent, StrugglingSignals } from "@/types/emotion";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";
import owlAvatar from "@/assets/owl-character.png";
import sparrowAvatar from "@/assets/sparrow-character.png";

interface Message {
  sender: "user" | "bird";
  text: string;
  timestamp: Timestamp;
  audio_url?: string;
  pronunciation_score?: number;
}

const birdAvatars: { [key: string]: string } = {
  ruby_robin: robinAvatar,
  sage_owl: owlAvatar,
  charlie_sparrow: sparrowAvatar,
};

export default function ConversationPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { levelId = "level_1" } = useParams();
  const { currentUser } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isBirdSpeaking, setIsBirdSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [levelData, setLevelData] = useState<any>(null);
  const [birdCharacter, setBirdCharacter] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  
  // Emotion detection state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [parentalConsent, setParentalConsent] = useState<ParentalConsent | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionAnalysis[]>([]);
  const [showEmotionDetector, setShowEmotionDetector] = useState(false);
  const [strugglingSignals, setStrugglingSignals] = useState<StrugglingSignals | null>(null);
  const [emotionDetectorEnabled, setEmotionDetectorEnabled] = useState(false);
  const [lastEmotionResponseTime, setLastEmotionResponseTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [skillsMastered, setSkillsMastered] = useState(false);
  const [conversationExchanges, setConversationExchanges] = useState(0);
  const minExchanges = 8;
  const maxExchanges = 20;
  const progress = Math.min((conversationExchanges / minExchanges) * 100, 100);

  const useBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onstart = () => setIsBirdSpeaking(true);
      utterance.onend = () => setIsBirdSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  // Generate proactive emotional support message from chatbot
  const generateEmotionalSupportMessage = useCallback(async (forceImmediate: boolean = false) => {
    if (!currentEmotion || !emotionDetectorEnabled || !birdCharacter || !conversationId) {
      console.log('⚠️ Cannot generate emotional support:', {
        hasEmotion: !!currentEmotion,
        emotionDetectorEnabled,
        hasBirdCharacter: !!birdCharacter,
        hasConversationId: !!conversationId
      });
      return;
    }
    if (isBirdSpeaking || isLoading) {
      console.log('⚠️ Skipping emotional support: chatbot busy', { isBirdSpeaking, isLoading });
      return;
    }
    
    const now = Date.now();
    // Only respond to emotion changes every 15 seconds to avoid spamming (unless forced)
    if (!forceImmediate && now - lastEmotionResponseTime < 15000) return;
    
    let shouldRespond = false;
    let emotionalMessage = '';
    
    // IMMEDIATE responses for strong emotions (angry, sad, very happy)
    if (forceImmediate && currentEmotion.confidence > 0.5) {
      shouldRespond = true;
      
      if (currentEmotion.currentEmotion === 'angry') {
        const angryResponses = [
          "Oh, I can see you're feeling frustrated! That's okay. Let's make this more fun! Want to try something different?",
          "Hey, I notice you might be upset. We can take a break if you want, or do something else! What sounds good?",
          "I can see this might be tough right now. No worries! We can do this later when you're ready. How about we talk about something you like?",
          "It's okay to feel frustrated sometimes! Let's take a deep breath together. Want to talk about what's bothering you?",
        ];
        emotionalMessage = angryResponses[Math.floor(Math.random() * angryResponses.length)];
      } else if (currentEmotion.currentEmotion === 'sad') {
        const sadResponses = [
          "I can see you're feeling a bit down. That's totally okay. I'm here for you! Want to talk about it or do something fun?",
          "You look sad. Remember, it's okay to feel this way! We can do this later if you want. What would make you feel better?",
          "I notice you're not feeling great. Let's make this more cheerful! What makes you happy? Tell me about it!",
        ];
        emotionalMessage = sadResponses[Math.floor(Math.random() * sadResponses.length)];
      } else if (currentEmotion.currentEmotion === 'fearful') {
        const fearfulResponses = [
          "You seem a bit worried. Don't worry! I'm here to help you. We can go as slow as you need!",
          "I can see you might be nervous. That's completely normal! We'll take this step by step together. You're doing amazing!",
        ];
        emotionalMessage = fearfulResponses[Math.floor(Math.random() * fearfulResponses.length)];
      } else if (currentEmotion.currentEmotion === 'happy' && currentEmotion.confidence > 0.7) {
        const happyResponses = [
          "Wow! I can see you're so happy! Your smile makes me happy too! Tell me more!",
          "You look so excited! I love your energy! What's making you feel so great?",
          "Your happiness is contagious! This is so fun! Keep going!",
        ];
        emotionalMessage = happyResponses[Math.floor(Math.random() * happyResponses.length)];
      } else if (currentEmotion.engagementLevel === 'low') {
        const lowEngagementResponses = [
          "Let's make this more fun! What do you want to talk about? I'm really curious!",
          "Hey, want to try something different? We can talk about anything you like!",
          "I want to make sure you're enjoying this! What would be more fun for you?",
          "We can do this later if you want! Or maybe talk about something else? Your choice!",
        ];
        emotionalMessage = lowEngagementResponses[Math.floor(Math.random() * lowEngagementResponses.length)];
      }
    }
    
    // Fallback to pattern-based responses if not forced
    if (!shouldRespond && strugglingSignals) {
      const signals = strugglingSignals;
      
      // Check if chatbot should proactively respond to emotional state
      if (signals.frustration && currentEmotion.confidence > 0.6) {
        shouldRespond = true;
        emotionalMessage = "I can see this is a bit tricky! That's totally okay. Let's take it one step at a time together. You're doing great!";
      } else if (signals.confusion && currentEmotion.confidence > 0.6) {
        shouldRespond = true;
        emotionalMessage = "Hmm, you look a bit puzzled! Would you like me to explain that in a different way? I'm here to help!";
      } else if (signals.frequentLookingAway && conversationExchanges > 2) {
        shouldRespond = true;
        emotionalMessage = "I notice you're looking away. Do you need a little break? Or would you like to talk about something else? Whatever feels good!";
      } else if (signals.lowEngagement && conversationExchanges > 3) {
        shouldRespond = true;
        emotionalMessage = "Let's make this more fun! What do you want to talk about? I'm really interested in hearing your ideas!";
      }
    }
    
    if (shouldRespond && emotionalMessage) {
      setLastEmotionResponseTime(now);
      console.log('🤖 Sending emotional support message:', emotionalMessage);
      
      try {
        // Generate speech for the emotional support message
        const audioUrl = await generateSpeech(
          emotionalMessage,
          birdCharacter.id || 'ruby_robin',
          conversationId
        ).catch(() => undefined);
        
        const emotionMessage = {
          sender: 'bird' as const,
          text: emotionalMessage,
          timestamp: Timestamp.now(),
          audio_url: audioUrl,
        };
        
        // Add message to conversation
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);
        const currentMessages = conversationDoc.data()?.messages || [];
        
        await updateDoc(conversationRef, {
          messages: [...currentMessages, emotionMessage]
        });
        
        // Play audio if available
        if (audioUrl) {
          playAudioWithAnimation(
            audioUrl,
            () => setIsBirdSpeaking(true),
            () => setIsBirdSpeaking(false)
          ).catch(console.error);
        } else {
          useBrowserTTS(emotionalMessage);
        }
        
        console.log('✅ Emotional support message sent successfully');
      } catch (error) {
        console.error('❌ Error generating emotional support message:', error);
      }
    } else if (forceImmediate) {
      console.log('⚠️ Forced immediate response but no message to send');
    }
  }, [currentEmotion, emotionDetectorEnabled, birdCharacter, conversationId, isBirdSpeaking, isLoading, lastEmotionResponseTime, strugglingSignals, conversationExchanges, currentUser]);

  // Check for existing parental consent on mount
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
            console.log('✅ Facial detection authorized by parent');
          }
        } else {
          console.log('ℹ️ No parental consent found, will show modal');
          setTimeout(() => setShowConsentModal(true), 2000);
        }
      } catch (error: any) {
        console.error('Error checking parental consent:', error);
        if (error.code === 'unavailable') {
          console.warn('Firestore unavailable, skipping parental consent check');
        }
      }
    };
    
    checkParentalConsent();
  }, [currentUser]);
  
  // Handle emotion detection with enhanced logging
  const handleEmotionDetected = useCallback((analysis: EmotionAnalysis) => {
    console.log('🎭 Emotion detected:', {
      emotion: analysis.currentEmotion,
      confidence: analysis.confidence,
      lookingAtScreen: analysis.isLookingAtScreen,
      engagement: analysis.engagementLevel
    });
    
    setCurrentEmotion(analysis);
    
    // Add to history
    setEmotionHistory(prev => {
      const updated = [...prev, analysis].slice(-10);
      
      // Analyze for struggling patterns
      const signals = FaceDetectionService.analyzeEmotionHistory(updated);
      setStrugglingSignals(signals);
      
      console.log('📊 Struggling signals:', signals);
      
      return updated;
    });
    
    // IMMEDIATE response for negative emotions or low engagement
    if (analysis.confidence > 0.5) {
      const negativeEmotions = ['angry', 'sad', 'fearful', 'disgusted'];
      if (negativeEmotions.includes(analysis.currentEmotion)) {
        console.log('⚠️ Negative emotion detected! Triggering immediate response...');
        // Trigger immediate emotional support with a small delay to ensure state is updated
        setTimeout(() => generateEmotionalSupportMessage(true), 500);
      } else if (analysis.currentEmotion === 'happy' && analysis.confidence > 0.7) {
        // Also respond immediately to strong positive emotions
        console.log('😊 Strong positive emotion detected! Celebrating with user...');
        setTimeout(() => generateEmotionalSupportMessage(true), 500);
      }
    }
    
    // Also trigger for low engagement
    if (analysis.engagementLevel === 'low' && analysis.confidence > 0.5) {
      console.log('📉 Low engagement detected! Triggering immediate response...');
      setTimeout(() => generateEmotionalSupportMessage(true), 500);
    }
  }, [generateEmotionalSupportMessage]);
  
  // Handle parental consent
  const handleParentalConsent = async (consent: ParentalConsent) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'parental_consent', currentUser.uid), {
        ...consent,
        userId: currentUser.uid,
        timestamp: Timestamp.now(),
      });
      
      setParentalConsent(consent);
      setShowConsentModal(false);
      
      if (consent.features.facialDetection) {
        setShowEmotionDetector(true);
        toast({
          title: "Features Enabled",
          description: "Facial emotion detection has been enabled to better support learning.",
        });
      }
    } catch (error) {
      console.error('Error saving parental consent:', error);
      toast({
        title: "Error",
        description: "Failed to save consent preferences",
        variant: "destructive",
      });
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    const checkSpeechRecognitionSupport = () => {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        console.log('Speech recognition not supported in this browser');
        toast({
          title: "Browser compatibility",
          description: "Speech recognition is not supported in your browser. Using text input instead.",
        });
        setUseTextInput(true);
        return false;
      }
      
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.log('Speech recognition requires HTTPS');
        toast({
          title: "Secure connection required",
          description: "Speech recognition requires a secure (HTTPS) connection. Using text input instead.",
        });
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
        recognitionRef.current.maxAlternatives = 3;
        console.log('Speech recognition initialized successfully');
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setUseTextInput(true);
        toast({
          title: "Initialization Error",
          description: "Could not initialize speech recognition. Using text input instead.",
          variant: "destructive",
        });
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          console.log('Microphone permission granted');
        })
        .catch(err => {
          console.log('Microphone permission denied or not available:', err);
          toast({
            title: "Microphone access",
            description: "Please allow microphone access when prompted, or use text input instead.",
          });
        });
    }
  }, [toast]);

  // Load level and bird character data
  useEffect(() => {
    if (!levelId) return;

    const loadLevelData = async () => {
      try {
        const levelDoc = await getDoc(doc(db, 'levels', levelId));
        if (levelDoc.exists()) {
          const level = levelDoc.data();
          setLevelData(level);
          
          const birdDoc = await getDoc(doc(db, 'bird_characters', level.bird_character));
          if (birdDoc.exists()) {
            setBirdCharacter({ id: level.bird_character, ...birdDoc.data() });
          }
        }
      } catch (error) {
        console.error('Error loading level data:', error);
        toast({
          title: "Error",
          description: "Failed to load level data",
          variant: "destructive",
        });
      }
    };

    loadLevelData();
  }, [levelId, toast]);

  // Initialize conversation
  useEffect(() => {
    if (!currentUser || !levelData || !birdCharacter) return;

    const initConversation = async () => {
      try {
        setIsLoading(true);
        
        const conversationRef = await addDoc(collection(db, 'conversations'), {
          user_id: currentUser.uid,
          level_id: levelId,
          messages: [],
          started_at: Timestamp.now(),
        });
        
        setConversationId(conversationRef.id);
        console.log('✅ Conversation initialized:', conversationRef.id);
        
        let greetingData;
        try {
          greetingData = await generateInitialGreeting(levelId);
        } catch (error) {
          console.error('Failed to generate initial greeting:', error);
          toast({
            title: "Connection Error",
            description: "Unable to start conversation. Please check your connection.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        let audioUrl: string | undefined;
        try {
          audioUrl = await generateSpeech(greetingData.text, greetingData.birdCharacter, conversationRef.id);
        } catch (error) {
          console.error('Failed to generate greeting audio:', error);
        }
        
        const initialMessage: Message = {
          sender: 'bird',
          text: greetingData.text,
          timestamp: Timestamp.now(),
        };
        
        if (audioUrl) {
          initialMessage.audio_url = audioUrl;
        }
        
        await updateDoc(conversationRef, {
          messages: [initialMessage]
        });
        
        if (audioUrl) {
          playAudioWithAnimation(
            audioUrl,
            () => setIsBirdSpeaking(true),
            () => setIsBirdSpeaking(false)
          ).catch(console.error);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, [currentUser, levelData, birdCharacter]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'conversations', conversationId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMessages(data.messages || []);
          
          if (data.completed_at) {
            handleConversationComplete(data.score, data.feedback);
          }
        }
      },
      (error) => {
        console.error('Error listening to conversation:', error);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Check for emotional support needs periodically
  useEffect(() => {
    const supportCheckInterval = setInterval(generateEmotionalSupportMessage, 10000);
    return () => clearInterval(supportCheckInterval);
  }, [generateEmotionalSupportMessage]);

  // Start recording audio
  const startRecording = async () => {
    try {
      if (isRecording) {
        console.log('Already recording');
        return;
      }
      
      console.log('Starting recording process...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      console.log('Got media stream:', stream.getAudioTracks().length, 'audio tracks');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('MediaRecorder started');
      
      if (recognitionRef.current && !useTextInput) {
        let speechTimeout: NodeJS.Timeout;
        let hasSpokenSomething = false;
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          speechTimeout = setTimeout(() => {
            if (!hasSpokenSomething) {
              toast({
                title: "Waiting for speech...",
                description: "Please speak clearly into your microphone.",
              });
            }
          }, 3000);
        };
        
        recognitionRef.current.onspeechstart = () => {
          console.log('Speech detected');
          hasSpokenSomething = true;
          if (speechTimeout) clearTimeout(speechTimeout);
        };
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          
          console.log('Transcript:', transcript);
          
          if (event.results[event.results.length - 1].isFinal) {
            if (speechTimeout) clearTimeout(speechTimeout);
            stopRecording(transcript);
          }
        };
        
        recognitionRef.current.onnomatch = () => {
          console.log('No speech match found');
          toast({
            title: "Couldn't understand",
            description: "Please try speaking more clearly.",
          });
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          if (speechTimeout) clearTimeout(speechTimeout);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'no-speech') {
            toast({
              title: "No speech detected",
              description: "Please try speaking clearly or use text input instead.",
            });
          } else if (event.error === 'audio-capture') {
            toast({
              title: "Microphone error",
              description: "Could not access your microphone. Please check permissions.",
              variant: "destructive",
            });
          } else if (event.error === 'not-allowed') {
            toast({
              title: "Permission denied",
              description: "Microphone access was denied. Please allow microphone access.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Recognition error",
              description: `Speech recognition failed: ${event.error}`,
              variant: "destructive",
            });
          }
          
          if (event.error !== 'no-speech') {
            setUseTextInput(true);
          }
          stopRecording();
        };
        
        recognitionRef.current.start();
      }
      
      toast({
        title: "Listening...",
        description: "Speak clearly when you're ready!",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access or use text input instead.",
        variant: "destructive",
      });
      setUseTextInput(true);
    }
  };

  // Stop recording and process audio
  const stopRecording = async (transcript?: string) => {
    try {
      console.log('Stopping recording, transcript:', transcript);
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
          console.log('Created audio blob:', audioBlob.size, 'bytes');
        } else {
          console.log('No audio chunks available');
        }
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (!transcript && !useTextInput) {
        setUseTextInput(true);
        toast({
          title: "Couldn't hear that",
          description: "Please type your response instead.",
        });
        return;
      }
      
      if (transcript && transcript.trim()) {
        console.log('Processing message with transcript:', transcript);
        await processUserMessage(transcript.trim(), audioBlob || undefined);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to process recording",
        variant: "destructive",
      });
    }
  };

  // Build emotion context for AI
  const buildEmotionContext = () => {
    if (!emotionDetectorEnabled || !currentEmotion || emotionHistory.length === 0) {
      return undefined;
    }

    const recentEmotions = emotionHistory.slice(-5);
    
    // Calculate engagement
    const lookingAtScreen = recentEmotions.filter(e => e.isLookingAtScreen).length;
    const engagementPercentage = (lookingAtScreen / recentEmotions.length) * 100;
    const engagementLevel = engagementPercentage >= 70 ? 'high' : 
                           engagementPercentage >= 40 ? 'medium' : 'low';
    
    // Detect struggling
    const negativeEmotions = ['sad', 'angry', 'fear'];
    const strugglingCount = recentEmotions.filter(e => 
      negativeEmotions.includes(e.currentEmotion) || !e.isLookingAtScreen
    ).length;
    const isStruggling = strugglingCount >= 3;
    
    // Check for confusion
    const confusionCount = recentEmotions.slice(-3).filter(e => 
      e.currentEmotion === 'surprised' || e.currentEmotion === 'fear'
    ).length;
    const needsSimplification = confusionCount >= 2;
    
    // Calculate processing time
    let processingTime = 0;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      processingTime = Date.now() - lastMessage.timestamp.toMillis();
    }
    
    // Calculate pace
    let conversationPace = 'normal';
    if (messages.length >= 4) {
      const recent = messages.slice(-4);
      const times = recent.map((msg, i) => {
        if (i === 0) return 0;
        return msg.timestamp.toMillis() - recent[i-1].timestamp.toMillis();
      });
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      conversationPace = avgTime < 3000 ? 'fast' : avgTime > 15000 ? 'slow' : 'normal';
    }
    
    // Count emotion changes
    let emotionChanges = 0;
    for (let i = 1; i < recentEmotions.length; i++) {
      if (recentEmotions[i].currentEmotion !== recentEmotions[i-1].currentEmotion) {
        emotionChanges++;
      }
    }
    
    const context = {
      currentEmotion: currentEmotion.currentEmotion,
      emotionConfidence: currentEmotion.confidence,
      isLookingAtScreen: currentEmotion.isLookingAtScreen,
      engagementLevel,
      isStruggling,
      needsSimplification,
      processingTime,
      conversationPace,
      lookAwayCount: recentEmotions.filter(e => !e.isLookingAtScreen).length,
      emotionChanges,
    };
    
    console.log('🎯 Emotion context for AI:', context);
    return context;
  };

  // Process user message with emotion context
  const processUserMessage = async (text: string, audioBlob?: Blob) => {
    if (!currentUser || !conversationId || !text.trim()) {
      console.log('Missing required data for processing message');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('📝 Processing user message:', text);
      
      const cleanedText = text.trim();
      
      let audioUrl: string | undefined;
      let pronunciationScore: number | undefined;
      
      if (audioBlob) {
        console.log('Uploading audio blob, size:', audioBlob.size);
        const timestamp = Date.now();
        const audioRef = ref(storage, `audio/user_recordings/${currentUser.uid}/${timestamp}.webm`);
        await uploadBytes(audioRef, audioBlob);
        audioUrl = await getDownloadURL(audioRef);
        
        pronunciationScore = await analyzePronunciation(audioBlob);
        
        if (pronunciationScore !== undefined) {
          showPronunciationFeedback(pronunciationScore);
        }
      }
      
      const userMessage: Message = {
        sender: 'user',
        text: cleanedText,
        timestamp: Timestamp.now(),
      };
      
      if (audioUrl) userMessage.audio_url = audioUrl;
      if (pronunciationScore !== undefined) userMessage.pronunciation_score = pronunciationScore;
      
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      const currentMessages = conversationDoc.data()?.messages || [];
      
      const updateData: any = {
        messages: [...currentMessages, userMessage]
      };
      
      // Add emotion data if available
      if (currentEmotion && parentalConsent?.features.emotionTracking && emotionDetectorEnabled) {
        const emotionTimeline = conversationDoc.data()?.emotion_timeline || [];
        emotionTimeline.push({
          timestamp: Date.now(),
          emotion: currentEmotion.currentEmotion,
          engagement: currentEmotion.engagementLevel,
          struggling: currentEmotion.needsSupport
        });
        
        const avgEngagement = emotionHistory.reduce((sum, e) => {
          return sum + (e.engagementLevel === 'high' ? 1 : e.engagementLevel === 'medium' ? 0.5 : 0);
        }, 0) / Math.max(emotionHistory.length, 1);
        
        const supportTriggers = emotionHistory.filter(e => e.needsSupport).length;
        
        updateData.emotion_timeline = emotionTimeline;
        updateData.average_engagement = avgEngagement;
        updateData.support_triggers = supportTriggers;
      }
      
      await updateDoc(conversationRef, updateData);
      
      setCurrentQuestion(prev => prev + 1);
      const currentExchanges = conversationExchanges + 1;
      setConversationExchanges(currentExchanges);
      
      // Build emotion context for AI - always include current emotion state
      const emotionContext = buildEmotionContext();
      
      // Enhance emotion context with recent feedback suggestions
      if (emotionContext && strugglingSignals) {
        emotionContext.strugglingSignals = strugglingSignals;
        emotionContext.shouldBeEmphatic = currentEmotion?.needsSupport || false;
      }
      
      console.log('🤖 Sending to AI with emotion context:', emotionContext ? 'YES' : 'NO', emotionContext);
      
      let aiResponse;
      try {
        aiResponse = await generateAIResponse(
          conversationId,
          currentUser.uid,
          levelId,
          cleanedText,
          emotionContext
        );
        
        if (!aiResponse || !aiResponse.text) {
          throw new Error('Invalid AI response received');
        }
        
        if (aiResponse.skillsMastered) {
          setSkillsMastered(true);
        }
        
        if (currentExchanges >= maxExchanges) {
          aiResponse.shouldEnd = true;
          aiResponse.feedback = "Wonderful session! You've practiced so much today. Let's continue next time!";
          aiResponse.score = Math.max(aiResponse.score || 75, 85);
        } else if (currentExchanges >= minExchanges) {
          if (aiResponse.skillsMastered && !aiResponse.shouldEnd) {
            aiResponse.feedback = (aiResponse.feedback || '') + " You're doing so well! Feel free to continue or finish when ready.";
          }
        } else {
          aiResponse.shouldEnd = false;
        }
        
      } catch (error) {
        console.error('Failed to get AI response:', error);
        
        aiResponse = {
          text: getEncouragingFallbackResponse(cleanedText),
          birdCharacter: birdCharacter?.id || 'ruby_robin',
          tone: 'encouraging',
          shouldEnd: false,
          score: 75,
          feedback: "Keep practicing! You're doing great!"
        };
        
        toast({
          title: "Connection Issue",
          description: "Using offline mode. Your progress is still being saved!",
        });
      }
      
      let responseAudioUrl: string | undefined;
      if (aiResponse.text) {
        try {
          responseAudioUrl = await generateSpeech(
            aiResponse.text,
            aiResponse.birdCharacter || 'ruby_robin',
            conversationId
          );
        } catch (error) {
          console.error('Failed to generate speech:', error);
          useBrowserTTS(aiResponse.text);
        }
      }
      
      const birdMessage: Message = {
        sender: 'bird',
        text: aiResponse.text,
        timestamp: Timestamp.now(),
      };
      
      if (responseAudioUrl) {
        birdMessage.audio_url = responseAudioUrl;
      }
      
      const updatedMessages = [...currentMessages, userMessage, birdMessage];
      
      await updateDoc(conversationRef, {
        messages: updatedMessages,
        ...(aiResponse.shouldEnd ? {
          completed_at: Timestamp.now(),
          score: aiResponse.score,
          feedback: aiResponse.feedback
        } : {})
      });
      
      if (responseAudioUrl) {
        playAudioWithAnimation(
          responseAudioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        setIsBirdSpeaking(true);
        setTimeout(() => setIsBirdSpeaking(false), 2000);
      }
      
      setTextInput("");
      
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const showPronunciationFeedback = (score: number) => {
    let title = '';
    let description = '';
    
    if (score >= 90) {
      title = '🌟 Excellent Pronunciation!';
      description = "You're speaking so clearly!";
    } else if (score >= 80) {
      title = '🎉 Great Pronunciation!';
      description = 'Very well done!';
    } else if (score >= 70) {
      title = '👍 Good Pronunciation!';
      description = "You're doing well!";
    } else if (score >= 60) {
      title = '😊 Nice Try!';
      description = 'Keep practicing!';
    }
    
    if (title) {
      toast({
        title,
        description,
      });
    }
  };
  
  const getEncouragingFallbackResponse = (userText: string): string => {
    const responses = [
      "That's wonderful! Tell me more!",
      'I love hearing about that! What else?',
      "You're doing so well! Keep going!",
      'That sounds interesting! How exciting!',
      "Great job! You're expressing yourself so well!"
    ];
    
    if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('hi')) {
      return "Hello! It's so nice to talk with you! How are you today?";
    }
    
    if (userText.includes('?')) {
      return "That's a great question! What do you think about it?";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processUserMessage(textInput.trim());
    }
  };

  const handleConversationComplete = (score: number, feedback: string) => {
    toast({
      title: "Great job! 🎉",
      description: `You scored ${score}%! ${feedback}`,
    });
    
    setTimeout(() => {
      navigate('/path');
    }, 3000);
  };

  const replayAudio = (audioUrl: string) => {
    playAudioWithAnimation(
      audioUrl,
      () => setIsBirdSpeaking(true),
      () => setIsBirdSpeaking(false)
    ).catch(error => {
      console.error('Error replaying audio:', error);
      toast({
        title: "Audio Error",
        description: "Couldn't play audio",
        variant: "destructive",
      });
    });
  };


  if (isLoading && messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/path")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 mx-4">
              <p className="text-white/90 text-sm">
                {conversationExchanges < minExchanges 
                  ? `Exchange ${conversationExchanges} (Min ${minExchanges} for completion)`
                  : skillsMastered 
                  ? 'Skills mastered! Feel free to continue or finish.'
                  : `Exchange ${conversationExchanges} - Keep practicing!`}
              </p>
              <Progress value={progress} className="h-2 mt-1 bg-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Bird Character Section */}
      <div className="relative z-10 bg-gradient-to-b from-blue-100 to-transparent py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full overflow-hidden shadow-lg bg-white ${
              isBirdSpeaking ? 'animate-bounce ring-4 ring-yellow-400' : ''
            }`}>
              <img 
                src={birdAvatars[birdCharacter?.id] || robinAvatar} 
                alt={birdCharacter?.name || "Bird"} 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold mt-4">
              Chatting with {birdCharacter?.name || "your friend"}
            </h2>
            <p className="text-gray-600">
              {levelData?.name || "Practice Conversation"}
            </p>
            {isBirdSpeaking && (
              <div className="flex items-center gap-2 mt-2 text-blue-600">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span className="text-sm animate-pulse">Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Conversation Area */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-32">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`
                  max-w-[80%] p-4 shadow-md
                  ${message.sender === "bird" 
                    ? "bg-white border-blue-200" 
                    : "bg-blue-50 border-green-200"
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium">
                    {message.sender === "bird" ? `${birdCharacter?.emoji || "🐦"} ${birdCharacter?.name}` : "👤 You"}
                  </p>
                  {message.audio_url && message.sender === "bird" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => replayAudio(message.audio_url!)}
                      className="ml-2"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-800">{message.text}</p>
                {message.pronunciation_score !== undefined && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      Pronunciation: {message.pronunciation_score}%
                      {message.pronunciation_score >= 90 && " 🌟 Excellent!"}
                      {message.pronunciation_score >= 70 && message.pronunciation_score < 90 && " 👍 Good!"}
                      {message.pronunciation_score < 70 && " 💪 Keep practicing!"}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {message.timestamp?.toDate?.()?.toLocaleTimeString?.([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) || 'Just now'}
                </p>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-gray-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            {/* Hint Button */}
            {showHint && levelData?.conversation_topics && (
              <Card className="w-full p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-2">💡 Try talking about:</p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {levelData.conversation_topics.map((topic: string, i: number) => (
                        <li key={i}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Text Input (fallback or preference) */}
            {useTextInput && (
              <div className="flex w-full gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder="Type your message..."
                  disabled={isLoading || isBirdSpeaking}
                  className="flex-1"
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isLoading || isBirdSpeaking}
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
                className="flex-shrink-0"
              >
                <Lightbulb className="w-5 h-5" />
              </Button>

              {/* Microphone Button */}
              {!useTextInput && (
                <Button
                  size="lg"
                  onClick={isRecording ? () => stopRecording() : startRecording}
                  disabled={isBirdSpeaking || isLoading}
                  className={`
                    w-20 h-20 rounded-full flex-shrink-0 transition-all
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
                className="flex-shrink-0"
              >
                {useTextInput ? "Use Voice" : "Use Text"}
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center">
              {isRecording ? "🎤 Listening... Tap to stop" : 
               useTextInput ? "Type your message and press Enter" :
               "Tap the microphone to speak"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Webcam Emotion Detector - Now draggable! */}
      {showEmotionDetector && parentalConsent?.features.facialDetection && (
        <div className="fixed top-24 right-4 z-50">
          <WebcamEmotionDetector
            onEmotionDetected={handleEmotionDetected}
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
          <Button
            size="sm"
            variant={emotionDetectorEnabled ? "default" : "outline"}
            onClick={() => {
              setEmotionDetectorEnabled(!emotionDetectorEnabled);
              console.log('🎭 Emotion detector toggled:', !emotionDetectorEnabled);
            }}
            className="mt-2 w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            {emotionDetectorEnabled ? "Disable Camera" : "Enable Camera"}
          </Button>
        </div>
      )}
      
      {/* Parental Consent Modal */}
      <ParentalConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleParentalConsent}
        childName={currentUser?.displayName || "your child"}
      />
      
      {/* Privacy Badge */}
      {parentalConsent?.features.facialDetection && (
        <div className="fixed top-20 left-4 z-40">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs opacity-70 hover:opacity-100"
            onClick={() => setShowConsentModal(true)}
          >
            <Shield className="h-3 w-3" />
            Privacy Settings
          </Button>
        </div>
      )}
    </div>
  );
}