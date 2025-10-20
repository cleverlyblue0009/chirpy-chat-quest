import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Lightbulb, Volume2, Loader2, Send } from "lucide-react";
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const totalQuestions = 5;
  const progress = (currentQuestion / totalQuestions) * 100;

  // Initialize Web Speech API
  useEffect(() => {
    // Check browser compatibility
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
      
      // Check if we're on HTTPS (required for speech recognition)
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
      
      // Test microphone permission on component mount
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Permission granted, stop the stream immediately
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
          
          // Load bird character
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
        
        // Create new conversation document
        const conversationRef = await addDoc(collection(db, 'conversations'), {
          user_id: currentUser.uid,
          level_id: levelId,
          messages: [],
          started_at: Timestamp.now(),
        });
        
        setConversationId(conversationRef.id);
        
        // Generate initial greeting from API
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
        
        // Generate audio for greeting
        let audioUrl: string | undefined;
        try {
          audioUrl = await generateSpeech(greetingData.text, greetingData.birdCharacter, conversationRef.id);
        } catch (error) {
          console.error('Failed to generate greeting audio:', error);
          // Continue without audio
        }
        
        // Add initial message
      const initialMessage: Message = {
        sender: 'bird',
        text: greetingData.text,
        timestamp: Timestamp.now(),
      };
      
      // Only add audio_url if it exists
      if (audioUrl) {
        initialMessage.audio_url = audioUrl;
      }
        
        await updateDoc(conversationRef, {
          messages: [initialMessage]
        });
        
        // Play the greeting
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
          
          // Check if conversation is complete
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

  // Start recording audio
  const startRecording = async () => {
    try {
      // Check if already recording
      if (isRecording) {
        console.log('Already recording');
        return;
      }
      
      console.log('Starting recording process...');
      
      // Get microphone access with error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      console.log('Got media stream:', stream.getAudioTracks().length, 'audio tracks');
      
      // Start MediaRecorder for audio recording
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
      
      // Start speech recognition
      if (recognitionRef.current && !useTextInput) {
        let speechTimeout: NodeJS.Timeout;
        let hasSpokenSomething = false;
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          // Set a timeout for no speech detection
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
          
          // Handle different error types
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
          
          // Only switch to text input for critical errors
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
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
      
      // Stop media recorder and get audio blob
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
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // If no transcript from speech recognition, show text input
      if (!transcript && !useTextInput) {
        setUseTextInput(true);
        toast({
          title: "Couldn't hear that",
          description: "Please type your response instead.",
        });
        return;
      }
      
      // Process the user's message
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

  // Process user message
  const processUserMessage = async (text: string, audioBlob?: Blob) => {
    if (!currentUser || !conversationId || !text.trim()) {
      console.log('Missing required data for processing message:', {
        currentUser: !!currentUser,
        conversationId: !!conversationId,
        text: text.trim()
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Processing user message:', text);
      
      // Upload audio if available
      let audioUrl: string | undefined;
      let pronunciationScore: number | undefined;
      
      if (audioBlob) {
        console.log('Uploading audio blob, size:', audioBlob.size);
        const timestamp = Date.now();
        const audioRef = ref(storage, `audio/user_recordings/${currentUser.uid}/${timestamp}.webm`);
        await uploadBytes(audioRef, audioBlob);
        audioUrl = await getDownloadURL(audioRef);
        
        // Analyze pronunciation
        pronunciationScore = await analyzePronunciation(audioBlob);
      }
      
      // Add user message to conversation
      const userMessage: Message = {
        sender: 'user',
        text,
        timestamp: Timestamp.now(),
      };
      
      // Only add optional fields if they have values
      if (audioUrl) {
        userMessage.audio_url = audioUrl;
      }
      if (pronunciationScore !== undefined) {
        userMessage.pronunciation_score = pronunciationScore;
      }
      
      // Update Firestore
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      const currentMessages = conversationDoc.data()?.messages || [];
      
      await updateDoc(conversationRef, {
        messages: [...currentMessages, userMessage]
      });
      
      // Increment question counter
      setCurrentQuestion(prev => prev + 1);
      
      // Generate AI response
      let aiResponse;
      try {
        aiResponse = await generateAIResponse(
          conversationId,
          currentUser.uid,
          levelId,
          text
        );
      } catch (error) {
        console.error('Failed to get AI response:', error);
        toast({
          title: "Connection Error",
          description: "Unable to get a response. Please check your connection and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return; // Exit early if API fails
      }
      
      // Generate audio for AI response
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
          // Continue without audio
        }
      }
      
      // Add bird response to conversation
      const birdMessage: Message = {
        sender: 'bird',
        text: aiResponse.text,
        timestamp: Timestamp.now(),
      };
      
      // Only add audio_url if it exists
      if (responseAudioUrl) {
        birdMessage.audio_url = responseAudioUrl;
      }
      
      const updatedMessages = [...currentMessages, userMessage, birdMessage];
      
      // Update conversation with bird response
      await updateDoc(conversationRef, {
        messages: updatedMessages,
        ...(aiResponse.shouldEnd ? {
          completed_at: Timestamp.now(),
          score: aiResponse.score,
          feedback: aiResponse.feedback
        } : {})
      });
      
      // Play bird response
      if (responseAudioUrl) {
        playAudioWithAnimation(
          responseAudioUrl,
          () => setIsBirdSpeaking(true),
          () => setIsBirdSpeaking(false)
        ).catch(console.error);
      }
      
      // Clear text input
      setTextInput("");
      
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text input submission
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processUserMessage(textInput.trim());
    }
  };

  // Handle conversation completion
  const handleConversationComplete = (score: number, feedback: string) => {
    toast({
      title: "Great job! 🎉",
      description: `You scored ${score}%! ${feedback}`,
    });
    
    // Navigate back to learning path after delay
    setTimeout(() => {
      navigate('/path');
    }, 3000);
  };

  // Replay bird audio
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
                Question {currentQuestion} of {totalQuestions}
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
    </div>
  );
}