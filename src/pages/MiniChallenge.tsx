import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, Trophy, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateSpeech, playAudioWithAnimation } from "@/lib/speech/textToSpeech";
import { XPService } from "@/lib/firebase/xpService";
import forestBg from "@/assets/forest-background.jpg";
import robinAvatar from "@/assets/robin-character.png";

interface ConversationPuzzle {
  id: string;
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const CONVERSATION_PUZZLES: ConversationPuzzle[] = [
  {
    id: "puzzle1",
    scenario: "Your friend looks sad",
    question: "What should you say?",
    options: [
      "Ignore them",
      "Are you okay? What's wrong?",
      "That's your problem",
      "Go away"
    ],
    correctAnswer: 1,
    explanation: "Asking if they're okay shows you care!"
  },
  {
    id: "puzzle2",
    scenario: "Someone is talking to you",
    question: "What should you do?",
    options: [
      "Walk away",
      "Look at them and listen",
      "Talk over them",
      "Look at your phone"
    ],
    correctAnswer: 1,
    explanation: "Good listening means looking at the person!"
  },
  {
    id: "puzzle3",
    scenario: "You want to join a game",
    question: "What should you say?",
    options: [
      "Can I play with you?",
      "I'm playing now!",
      "Move over!",
      "This is my game"
    ],
    correctAnswer: 0,
    explanation: "Asking politely is the best way to join!"
  },
  {
    id: "puzzle4",
    scenario: "Someone shares good news",
    question: "How should you respond?",
    options: [
      "I don't care",
      "That's awesome! I'm happy for you!",
      "Whatever",
      "My news is better"
    ],
    correctAnswer: 1,
    explanation: "Share in their happiness! That's being a good friend!"
  },
  {
    id: "puzzle5",
    scenario: "You bump into someone",
    question: "What should you say?",
    options: [
      "Watch where you're going!",
      "Sorry! Are you okay?",
      "That was your fault",
      "Say nothing"
    ],
    correctAnswer: 1,
    explanation: "Saying sorry shows good manners!"
  },
  {
    id: "puzzle6",
    scenario: "Someone is telling a story",
    question: "What shows you're interested?",
    options: [
      "Yawn and look away",
      "Check your watch",
      "Nod and ask questions",
      "Talk about yourself"
    ],
    correctAnswer: 2,
    explanation: "Asking questions shows you're listening!"
  },
  {
    id: "puzzle7",
    scenario: "Your friend got a new pet",
    question: "What's a good question to ask?",
    options: [
      "I don't like pets",
      "What's its name? Can I meet it?",
      "Pets are boring",
      "I have better pets"
    ],
    correctAnswer: 1,
    explanation: "Asking about their pet shows you're interested!"
  },
  {
    id: "puzzle8",
    scenario: "Someone interrupts you",
    question: "What should you say?",
    options: [
      "Be quiet!",
      "One moment, let me finish please",
      "You're so rude!",
      "Stop talking!"
    ],
    correctAnswer: 1,
    explanation: "Being polite but firm is best!"
  }
];

export default function MiniChallenge() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [isBirdSpeaking, setIsBirdSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  
  const totalPuzzles = 5; // Show 5 random puzzles
  const [puzzles, setPuzzles] = useState<ConversationPuzzle[]>([]);
  const progress = ((currentPuzzleIndex + 1) / totalPuzzles) * 100;

  // Select random puzzles on mount
  useEffect(() => {
    const shuffled = [...CONVERSATION_PUZZLES].sort(() => Math.random() - 0.5);
    setPuzzles(shuffled.slice(0, totalPuzzles));
  }, []);

  const startChallenge = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setChallengeStarted(true);
    
    try {
      // Create conversation record
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        user_id: currentUser.uid,
        level_id: 'mini_challenge_puzzles',
        messages: [],
        started_at: Timestamp.now(),
        challenge_type: 'conversation_puzzles',
      });
      setConversationId(conversationRef.id);
      
      // Ruby's introduction
      const introMessage = `Hi! Let's solve some conversation puzzles! I'll give you situations and you pick the best response!`;
      
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

  const handleAnswer = async (answerIndex: number) => {
    if (answered || !puzzles[currentPuzzleIndex]) return;
    
    setSelectedAnswer(answerIndex);
    setAnswered(true);
    
    const puzzle = puzzles[currentPuzzleIndex];
    const isCorrect = answerIndex === puzzle.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Show feedback
    const feedbackMessage = isCorrect 
      ? `✅ Correct! ${puzzle.explanation}` 
      : `❌ Not quite. ${puzzle.explanation}`;
    
    toast({
      title: isCorrect ? "Great job!" : "Good try!",
      description: feedbackMessage,
      duration: 3000,
    });
    
    // Speak feedback
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
    
    // Move to next puzzle or complete
    setTimeout(() => {
      if (currentPuzzleIndex < totalPuzzles - 1) {
        setCurrentPuzzleIndex(currentPuzzleIndex + 1);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        completeChallenge();
      }
    }, 3000);
  };

  const completeChallenge = async () => {
    if (!currentUser) return;
    
    setChallengeComplete(true);
    
    try {
      // Calculate XP based on score
      const percentage = (score / totalPuzzles) * 100;
      const xpEarned = Math.round(20 + (percentage * 0.3)); // 20-50 XP based on score
      
      // Award XP
      await XPService.awardXP(
        currentUser.uid,
        xpEarned,
        'challenge_complete',
        `Completed Conversation Puzzles: ${score}/${totalPuzzles}`,
        { challengeType: 'conversation_puzzles', score, total: totalPuzzles }
      );
      
      const completionMessage = score === totalPuzzles
        ? `🎉 Perfect score! You got all ${totalPuzzles} puzzles right!`
        : score >= totalPuzzles * 0.8
        ? `🌟 Great job! You got ${score} out of ${totalPuzzles} correct!`
        : `👍 Good effort! You got ${score} out of ${totalPuzzles}. Keep practicing!`;
      
      toast({
        title: "Challenge Complete!",
        description: `${completionMessage}\n\nYou earned ${xpEarned} XP!`,
        duration: 5000,
      });
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Great job! 🎉",
        description: "You completed the challenge!",
      });
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const currentPuzzle = puzzles[currentPuzzleIndex];

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
                💫 Conversation Puzzles
              </p>
              {challengeStarted && (
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progress} className="h-2 flex-1 bg-white/30" />
                  <span className="text-white text-xs font-bold">
                    {currentPuzzleIndex + 1}/{totalPuzzles}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-200" />
              <span className="text-white font-bold">{score}</span>
            </div>
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
            <h2 className="text-xl font-bold mt-3">Conversation Puzzles!</h2>
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
      <div className="relative z-10 flex-1 overflow-y-auto pb-8">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          
          {!challengeStarted && !challengeComplete && (
            <Card className="p-8 text-center shadow-lg">
              <div className="text-5xl mb-4">🧩</div>
              <h3 className="text-2xl font-bold mb-4">Ready for Conversation Puzzles?</h3>
              <p className="text-gray-700 mb-4">
                Test your conversation skills! Pick the best response for different situations.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                {totalPuzzles} puzzles • Earn up to 50 XP
              </p>
              <Button 
                size="lg" 
                onClick={startChallenge}
                disabled={isLoading}
                className="text-lg px-8 py-6"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Start Puzzles
              </Button>
            </Card>
          )}
          
          {challengeStarted && !challengeComplete && currentPuzzle && (
            <div className="space-y-6">
              {/* Scenario */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">📖 Situation:</h3>
                <p className="text-xl text-gray-900">{currentPuzzle.scenario}</p>
              </Card>
              
              {/* Question */}
              <Card className="p-6 bg-white border-2 border-orange-200">
                <h3 className="text-lg font-bold text-orange-600 mb-2">❓ Question:</h3>
                <p className="text-xl font-semibold text-gray-900">{currentPuzzle.question}</p>
              </Card>
              
              {/* Options */}
              <div className="grid gap-3">
                {currentPuzzle.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentPuzzle.correctAnswer;
                  const showResult = answered;
                  
                  return (
                    <Button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={answered || isLoading}
                      variant="outline"
                      className={`
                        p-6 h-auto text-left justify-start text-base
                        ${!showResult ? 'hover:bg-blue-50 hover:border-blue-400' : ''}
                        ${showResult && isSelected && isCorrect ? 'bg-green-100 border-green-500 border-2' : ''}
                        ${showResult && isSelected && !isCorrect ? 'bg-red-100 border-red-500 border-2' : ''}
                        ${showResult && !isSelected && isCorrect ? 'bg-green-50 border-green-400 border-2' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                          ${!showResult ? 'bg-gray-200 text-gray-700' : ''}
                          ${showResult && isSelected && isCorrect ? 'bg-green-500 text-white' : ''}
                          ${showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' : ''}
                          ${showResult && !isSelected && isCorrect ? 'bg-green-500 text-white' : ''}
                        `}>
                          {!showResult && String.fromCharCode(65 + index)}
                          {showResult && isSelected && isCorrect && <CheckCircle className="w-5 h-5" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                          {showResult && !isSelected && isCorrect && <CheckCircle className="w-5 h-5" />}
                          {showResult && !isSelected && !isCorrect && String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {/* Explanation (after answering) */}
              {answered && (
                <Card className="p-6 bg-blue-50 border-2 border-blue-300">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">💡 Why?</h3>
                  <p className="text-gray-800">{currentPuzzle.explanation}</p>
                </Card>
              )}
            </div>
          )}
          
          {challengeComplete && (
            <Card className="p-8 text-center shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
              <div className="text-6xl mb-4">
                {score === totalPuzzles ? '🏆' : score >= totalPuzzles * 0.8 ? '🌟' : '👍'}
              </div>
              <h3 className="text-3xl font-bold mb-4">Challenge Complete!</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {score}/{totalPuzzles}
              </div>
              <p className="text-gray-600 mb-6">
                {score === totalPuzzles 
                  ? "Perfect! You're a conversation master!" 
                  : score >= totalPuzzles * 0.8
                  ? "Great job! You really understand conversations!"
                  : "Good effort! Keep practicing!"}
              </p>
              <p className="text-gray-500">
                Returning to Dashboard...
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
