import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Play, CheckCircle, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { SpeechRecognition, uploadUserRecording } from '@/lib/speech/speechToText';
import { playAudioWithAnimation } from '@/lib/speech/textToSpeech';
import { fetchAssessmentQuestions, saveAssessmentResult, type AssessmentQuestion } from '@/lib/firebase/assessmentService';


export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [selectedOption, setSelectedOption] = useState('');
  const [orderedOptions, setOrderedOptions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    setSpeechRecognition(recognition);
  }, []);

  // Fetch assessment questions from Firebase
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const fetchedQuestions = await fetchAssessmentQuestions();
        if (fetchedQuestions.length === 0) {
          // Simple conversation-style questions
          const fallbackQuestions: AssessmentQuestion[] = [
            {
              id: 'q1',
              type: 'voice',
              content: 'Hello! Can you say hello back to me?',
              instructions: 'Click the microphone and say hello',
              order: 1
            },
            {
              id: 'q2',
              type: 'voice',
              content: 'Great! What is your name?',
              instructions: 'Tell me your name',
              order: 2
            },
            {
              id: 'q3',
              type: 'voice',
              content: 'Nice to meet you! How are you feeling today?',
              instructions: 'Tell me how you feel',
              order: 3
            },
            {
              id: 'q4',
              type: 'voice',
              content: 'What is your favorite thing to do for fun?',
              instructions: 'Tell me about something you enjoy',
              order: 4
            },
            {
              id: 'q5',
              type: 'voice',
              content: 'If a friend asks "How are you?", what would you say?',
              instructions: 'Say your answer',
              order: 5
            },
            {
              id: 'q6',
              type: 'voice',
              content: 'Thank you for talking with me! Can you say goodbye?',
              instructions: 'Say goodbye',
              order: 6
            }
          ];
          setQuestions(fallbackQuestions);
        } else {
          setQuestions(fetchedQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment questions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, [toast]);

  // Check if assessment already completed
  useEffect(() => {
    if (userProfile?.current_level_id) {
      navigate('/');
    }
  }, [userProfile, navigate]);

  const handleStartRecording = async () => {
    if (!speechRecognition) return;
    
    setIsRecording(true);
    setTranscript('');
    
    try {
      await speechRecognition.startRecording(
        (text, isFinal) => {
          setTranscript(text);
        },
        (error) => {
          console.error('Recording error:', error);
          toast({
            title: "Recording Error",
            description: "Could not access microphone. Please check permissions.",
            variant: "destructive"
          });
          setIsRecording(false);
        }
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!speechRecognition) return;
    
    setIsRecording(false);
    const blob = await speechRecognition.stopRecording();
    
    if (blob && currentUser) {
      setAudioBlob(blob);
      // Upload audio to Firebase Storage
      const audioUrl = await uploadUserRecording(blob, currentUser.uid);
      
      // Save answer with audio
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          text: transcript,
          audioUrl
        }
      }));
    }
  };

  const handleNextQuestion = () => {
    // Save current answer
    if (question.type === 'multiple_choice' || question.type === 'emotion_recognition') {
      setAnswers(prev => ({
        ...prev,
        [question.id]: selectedOption
      }));
    } else if (question.type === 'ordering') {
      setAnswers(prev => ({
        ...prev,
        [question.id]: orderedOptions
      }));
    }
    
    // Move to next question or complete assessment
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption('');
      setOrderedOptions([]);
      setTranscript('');
      setAudioBlob(null);
    } else {
      handleCompleteAssessment();
    }
  };

  const handleCompleteAssessment = async () => {
    setLoading(true);
    
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Calculate scores based on answers using backend API
      const result = await apiClient.scoreAssessment({
        userId: currentUser.uid,
        answers
      });
      
      // Save to Firebase for record keeping
      await saveAssessmentResult(
        currentUser.uid,
        answers,
        result.score || 0,
        result.assignedPath || 'beginner'
      );
      
      toast({
        title: "Assessment Complete!",
        description: `You've been placed in the ${result.assignedPath} path. Let's start learning!`,
      });
      
      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    // All questions are voice-based
    return transcript.length > 0;
  };

  const renderQuestion = () => {
    // All questions are voice-based conversations
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium">{question.content}</p>
        {question.instructions && (
          <p className="text-sm text-muted-foreground">{question.instructions}</p>
        )}
        
        <div className="flex flex-col items-center space-y-4">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full w-20 h-20"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm">Recording...</span>
            </div>
          )}
          
          {transcript && !isRecording && (
            <div className="p-4 bg-muted rounded-lg w-full">
              <p className="text-sm font-medium mb-1">You said:</p>
              <p>{transcript}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading assessment questions...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">No questions available</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Let's Find Your Starting Point! 🎯
          </h1>
          <p className="text-center text-muted-foreground">
            Answer a few questions to help us personalize your learning journey
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {renderQuestion()}
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                disabled={!canProceed() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentQuestion === questions.length - 1 ? (
                  <>
                    Complete Assessment
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Next Question'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't worry about getting everything perfect - this just helps us know where to start!
          </p>
        </div>
      </div>
    </div>
  );
}