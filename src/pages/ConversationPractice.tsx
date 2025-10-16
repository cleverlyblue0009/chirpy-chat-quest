import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Lightbulb, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";

interface Message {
  role: "bird" | "child";
  text: string;
  timestamp: Date;
}

const conversationScenarios = [
  {
    topic: "Greetings",
    birdIntro: "Hi there! I'm so happy to see you today! Can you tell me how you're feeling?",
    hints: [
      "Try saying 'Hi' or 'Hello'",
      "Share how you feel - happy, excited, or calm",
      "You can say 'I'm doing great, how about you?'"
    ]
  },
  {
    topic: "Favorite Things",
    birdIntro: "I love talking about the things we enjoy! What's your favorite thing to do?",
    hints: [
      "Think about what makes you happy",
      "You could talk about a hobby or game",
      "It's okay to take your time thinking!"
    ]
  },
];

export default function ConversationPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { levelId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isBirdSpeaking, setIsBirdSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scenario = conversationScenarios[0];
  const totalQuestions = 5;
  const progress = (currentQuestion / totalQuestions) * 100;

  useEffect(() => {
    // Bird's initial greeting
    speakBirdMessage(scenario.birdIntro);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakBirdMessage = async (text: string) => {
    setIsBirdSpeaking(true);
    
    // Add message to chat
    const newMessage: Message = {
      role: "bird",
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      // Call TTS function
      const { data, error } = await supabase.functions.invoke('conversation-ai', {
        body: { text, voice: "9BWtsMINqrJLrRacOk9x" } // Aria voice
      });

      if (error) throw error;

      // Play audio
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setIsBirdSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing bird speech:', error);
      toast({
        title: "Audio Error",
        description: "Couldn't play the bird's voice. Please try again.",
        variant: "destructive",
      });
      setIsBirdSpeaking(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const startRecording = async () => {
    try {
      await audioRecorder.current.start();
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Speak when you're ready!",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to continue.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    try {
      const audioBase64 = await audioRecorder.current.stop();
      setIsRecording(false);

      // Convert speech to text
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: audioBase64 }
      });

      if (error) throw error;

      const transcribedText = data.text || "I couldn't quite hear that.";
      
      // Add child's message
      const childMessage: Message = {
        role: "child",
        text: transcribedText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, childMessage]);

      // Bird responds
      setTimeout(() => {
        const responses = [
          "That's wonderful! Tell me more about that.",
          "I love hearing about that! What else can you share?",
          "You're doing great! That's very interesting!",
          "Thank you for sharing that with me!",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        speakBirdMessage(randomResponse);
        setCurrentQuestion(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: "Processing Error",
        description: "Couldn't understand that. Please try again.",
        variant: "destructive",
      });
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
      <div className="relative z-10 bg-gradient-forest shadow-soft-lg">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/path")}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 mx-4">
              <p className="text-primary-foreground/80 text-sm">Question {currentQuestion} of {totalQuestions}</p>
              <Progress value={progress} className="h-2 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bird Character Section */}
      <div className="relative z-10 bg-gradient-sky py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full overflow-hidden shadow-soft-lg ${isBirdSpeaking ? 'animate-bounce-gentle ring-4 ring-secondary' : ''}`}>
              <img src={robinAvatar} alt="Ruby Robin" className="w-full h-full object-cover animate-breathe" />
            </div>
            <h2 className="text-2xl font-bold mt-4 text-accent-foreground">
              Chatting with Ruby
            </h2>
            <p className="text-accent-foreground/80">{scenario.topic}</p>
            {isBirdSpeaking && (
              <div className="flex items-center gap-2 mt-2 text-accent-foreground">
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
              className={`flex ${message.role === "child" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`
                  max-w-[80%] p-4
                  ${message.role === "bird" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground"
                  }
                `}
              >
                <p className="text-sm font-medium mb-1">
                  {message.role === "bird" ? "🐦 Ruby" : "👤 You"}
                </p>
                <p>{message.text}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft-lg z-20">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            {/* Hint Button */}
            {showHint && (
              <Card className="w-full p-4 bg-info/10 border-info/20 animate-slide-up">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-info flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground mb-2">💡 Hint:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {scenario.hints.map((hint, i) => (
                        <li key={i}>• {hint}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
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
              <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isBirdSpeaking}
                className={`
                  w-20 h-20 rounded-full flex-shrink-0
                  ${isRecording 
                    ? 'bg-destructive hover:bg-destructive/90 animate-pulse-gentle' 
                    : 'bg-primary hover:bg-primary/90'
                  }
                `}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>

              <div className="w-12" /> {/* Spacer for centering */}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {isRecording ? "🎤 Listening carefully..." : "Tap to speak"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
