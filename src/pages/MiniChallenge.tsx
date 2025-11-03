import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp, addDoc, collection, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateSpeech, playAudioWithAnimation } from "@/lib/speech/textToSpeech";
import { XPService } from "@/lib/firebase/xpService";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";

interface Message {
  sender: "user" | "bird";
  text: string;
}

export default function MiniChallenge() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isBirdSpeaking, setIsBirdSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [conversationId, setConversationId] = useState<string>("");
  const [currentTopic] = useState(() => {
    const topics = [
      "your favorite hobby",
      "a book you like",
      "your favorite animal",
      "something that makes you happy",
      "a fun activity you enjoy"
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const targetExchanges = 4; // Short conversation
  const progress = Math.min((exchangeCount / targetExchanges) * 100, 100);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
      }
    }
  }, []);

  const startChallenge = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setChallengeStarted(true);
    startTimeRef.current = Date.now();
    
    try {
      // Create conversation record
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        user_id: currentUser.uid,
        level_id: 'mini_challenge',
        messages: [],
        started_at: Timestamp.now(),
        challenge_type: 'daily_mini',
      });
      setConversationId(conversationRef.id);
      
      // Ruby's introduction
      const introMessage = `Hi! Let's have a quick 2-minute chat about ${currentTopic}! Tell me what you think about it!`;
      
      setMessages([{ sender: 'bird', text: introMessage }]);
      
      const audioUrl = await generateSpeech(
        introMessage,
        'ruby_robin',
        conversationRef.id
      ).catch(() => undefined);
      
      if (audioUrl) {
        playAudioWithAnimation(
          audioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      } else {
        const utterance = new SpeechSynthesisUtterance(introMessage);
        setIsBirdSpeaking(true);
        utterance.onend = () => setIsBirdSpeaking(false);
        speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({
        title: "Error",
        description: "Failed to start challenge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      if (recognitionRef.current) {
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
          stopRecording();
        };
        
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async (transcript?: string) => {
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (transcript && transcript.trim()) {
      await processUserMessage(transcript.trim());
    }
  };

  const processUserMessage = async (text: string) => {
    if (!currentUser || !conversationId || !text.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Add user message
      setMessages(prev => [...prev, { sender: 'user', text }]);
      
      const currentExchanges = exchangeCount + 1;
      setExchangeCount(currentExchanges);
      
      // Generate simple AI response
      const responses = [
        `That's wonderful! Tell me more about that!`,
        `How interesting! What else do you like about ${currentTopic}?`,
        `I love hearing about this! What makes it special to you?`,
        `That sounds amazing! Can you tell me why you enjoy it?`,
        `Great! What's your favorite part about ${currentTopic}?`
      ];
      
      let aiResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Check if challenge should end
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      if (currentExchanges >= targetExchanges || elapsedTime >= 120) {
        aiResponse = `That was such a great conversation! You did an amazing job talking about ${currentTopic}! 🌟`;
        setChallengeComplete(true);
      }
      
      setMessages(prev => [...prev, { sender: 'bird', text: aiResponse }]);
      
      const audioUrl = await generateSpeech(
        aiResponse,
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
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        setIsBirdSpeaking(true);
        utterance.onend = () => setIsBirdSpeaking(false);
        speechSynthesis.speak(utterance);
      }
      
      // Complete challenge
      if (challengeComplete) {
        setTimeout(() => completeChallenge(), 3000);
      }
      
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

  const completeChallenge = async () => {
    if (!currentUser) return;
    
    try {
      // Award XP
      await XPService.awardXP(
        currentUser.uid,
        50,
        'challenge_complete',
        `Completed Mini Challenge: ${currentTopic}`,
        { challengeType: 'daily_mini', topic: currentTopic, exchanges: exchangeCount }
      );
      
      toast({
        title: "🎉 Challenge Complete!",
        description: "You earned 50 XP! Great conversation!",
        duration: 4000,
      });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Great job! 🎉",
        description: "You completed the challenge!",
      });
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${forestBg})` }}
      />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 mx-4">
              <p className="text-white/90 text-sm font-semibold">
                💫 Today's Mini Challenge
              </p>
              {challengeStarted && (
                <Progress value={progress} className="h-2 mt-1 bg-white/30" />
              )}
            </div>
            <Trophy className="w-6 h-6 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Bird Character */}
      <div className="relative z-10 bg-gradient-to-b from-yellow-100 to-transparent py-6">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full overflow-hidden shadow-lg bg-white ${
              isBirdSpeaking ? 'animate-bounce ring-4 ring-yellow-400' : ''
            }`}>
              <img 
                src={robinAvatar} 
                alt="Ruby Robin" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold mt-3">Quick Chat Challenge!</h2>
            {isBirdSpeaking && (
              <div className="flex items-center gap-2 mt-2 text-orange-600">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm animate-pulse">Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-32">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          
          {!challengeStarted && !challengeComplete && (
            <Card className="p-8 text-center shadow-lg">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-4">Ready for a Quick Challenge?</h3>
              <p className="text-gray-700 mb-4">
                Let's have a 2-minute conversation about <strong>{currentTopic}</strong>!
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Reward: +50 XP
              </p>
              <Button 
                size="lg" 
                onClick={startChallenge}
                disabled={isLoading}
                className="text-lg px-8 py-6"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Start Challenge
              </Button>
            </Card>
          )}
          
          {challengeStarted && (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-[80%] p-4 shadow-md ${
                      msg.sender === 'bird'
                        ? 'bg-white border-orange-200'
                        : 'bg-orange-50 border-yellow-200'
                    }`}
                  >
                    <p className="text-sm font-medium mb-2">
                      {msg.sender === 'bird' ? '🐦 Ruby Robin' : '👤 You'}
                    </p>
                    <p className="text-gray-800">{msg.text}</p>
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
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {challengeStarted && !challengeComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="container max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={isRecording ? () => stopRecording() : startRecording}
                disabled={isBirdSpeaking || isLoading}
                className={`
                  w-20 h-20 rounded-full
                  ${isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-orange-500 hover:bg-orange-600'
                  }
                `}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </Button>
              
              <p className="text-sm text-gray-500 text-center">
                {isRecording ? "🎤 Listening... Tap to stop" : "Tap the microphone to speak"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
