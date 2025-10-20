import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Level, BirdCharacter } from '@/types/firebase';
import { apiClient } from '../api/client';
import { 
  analyzeChildResponse, 
  generateAdaptiveResponse,
  initializeAdaptiveConversation 
} from './enhancedConversationEngine';

interface AIResponse {
  text: string;
  birdCharacter: string;
  tone: string;
  shouldEnd: boolean;
  score: number;
  feedback: string;
}

/**
 * Generate AI response for conversation
 * @param messages Previous messages in the conversation
 * @param levelId The current level ID
 * @param userMessage The user's latest message
 * @returns AI-generated response
 */
export async function generateAIResponse(
  conversationId: string,
  userId: string,
  levelId: string,
  userMessage: string
): Promise<AIResponse> {
  try {
    // Use enhanced adaptive response generation
    const context = {
      levelId,
      userId,
      conversationId,
      exchangeCount: 0, // This should be tracked properly
      userResponses: [],
      objectives: [],
      birdCharacter: 'ruby_robin',
    };
    
    // Get level data for context
    const levelDoc = await getDoc(doc(db, 'levels', levelId));
    if (levelDoc.exists()) {
      const levelData = levelDoc.data();
      context.objectives = levelData.objectives || [];
      context.birdCharacter = levelData.bird_character || 'ruby_robin';
    }
    
    // Analyze the user's response
    const analysis = analyzeChildResponse(userMessage, context);
    
    try {
      // Call backend API with enhanced context
      const response = await apiClient.sendChatMessage({
        conversationId,
        userId,
        levelId,
        userMessage,
        analysisData: analysis
      });
      
      // Ensure we have valid response data from API
      if (!response.text && !response.response) {
        throw new Error('No response text received from API');
      }
      
      // Validate and enhance the response
      const validatedResponse = validateAIResponse(response, context);
      
      return {
        text: validatedResponse.text || response.text || response.response,
        birdCharacter: response.birdCharacter || context.birdCharacter || 'ruby_robin',
        tone: response.tone || 'encouraging',
        shouldEnd: response.shouldEnd || false,
        score: validatedResponse.score || response.score || 75,
        feedback: validatedResponse.feedback || response.feedback || 'Great job! Keep practicing!'
      };
    } catch (apiError) {
      console.error('API call failed:', apiError);
      
      // Fallback to local response generation
      return generateFallbackResponse(userMessage, context);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Return a safe fallback response
    return {
      text: "That's interesting! Can you tell me more about that?",
      birdCharacter: 'ruby_robin',
      tone: 'encouraging',
      shouldEnd: false,
      score: 75,
      feedback: 'Keep going! You\'re doing great!'
    };
  }
}

/**
 * Generate a fallback response when API is unavailable
 */
function generateFallbackResponse(
  userMessage: string,
  context: any
): AIResponse {
  const responses = [
    "That's wonderful! Tell me more about that.",
    "I really like hearing about that! What else?",
    "You're doing so well! Can you share another thought?",
    "That sounds interesting! How does that make you feel?",
    "Great job expressing yourself! What do you think about that?"
  ];
  
  // Simple response selection based on message length and content
  let selectedResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Check if it's a greeting
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon'];
  if (greetings.some(g => userMessage.toLowerCase().includes(g))) {
    selectedResponse = "Hello! It's so nice to talk with you today! How are you feeling?";
  }
  
  // Check if it's a question
  if (userMessage.includes('?')) {
    selectedResponse = "That's a great question! Let me think... What do you think about it?";
  }
  
  return {
    text: selectedResponse,
    birdCharacter: context.birdCharacter || 'ruby_robin',
    tone: 'encouraging',
    shouldEnd: false,
    score: 75,
    feedback: 'You\'re doing wonderfully! Keep practicing your conversation skills!'
  };
}

/**
 * Validate and enhance AI response for appropriateness
 */
function validateAIResponse(
  response: any,
  context: any
): { text: string; score: number; feedback: string } {
  let text = response.text || response.response || '';
  let score = response.score || 75;
  let feedback = response.feedback || '';
  
  // Ensure response is not too long (autism-friendly)
  if (text.length > 150) {
    // Truncate to first 2 sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    text = sentences.slice(0, 2).join(' ');
  }
  
  // Ensure response is encouraging
  if (!text.includes('!') && !text.includes('?')) {
    text = text.replace('.', '!');
  }
  
  // Validate score is in reasonable range
  if (score < 60) {
    score = 65; // Minimum encouraging score
  }
  if (score > 100) {
    score = 100;
  }
  
  // Ensure feedback is positive
  if (!feedback || feedback.length < 10) {
    feedback = generateEncouragingFeedback(score);
  }
  
  return { text, score, feedback };
}

/**
 * Generate encouraging feedback based on score
 */
function generateEncouragingFeedback(score: number): string {
  if (score >= 90) {
    return "Amazing work! You're a conversation superstar! 🌟";
  } else if (score >= 80) {
    return "Great job! You're communicating so well! 🎉";
  } else if (score >= 70) {
    return "Good work! You're getting better every time! 👍";
  } else {
    return "Nice try! Every conversation helps you grow stronger! 💪";
  }
}

/**
 * Generate feedback based on scores
 */
function generateFeedback(
  overallScore: number,
  scores: number[],
  topics: string[]
): string {
  const [relevance, turnTaking, emotional, clarity] = scores;
  
  let feedback = '';
  
  if (overallScore >= 90) {
    feedback = "Outstanding work! You're a communication superstar! 🌟";
  } else if (overallScore >= 80) {
    feedback = "Great job! You're communicating very well! ";
    
    // Add specific praise
    if (relevance >= 90) feedback += "You stayed on topic perfectly! ";
    if (turnTaking >= 90) feedback += "Excellent turn-taking! ";
    if (emotional >= 90) feedback += "You understand emotions so well! ";
    if (clarity >= 90) feedback += "You express yourself very clearly! ";
  } else if (overallScore >= 70) {
    feedback = "Good work! You're improving! ";
    
    // Add specific encouragement
    const lowestScore = Math.min(relevance, turnTaking, emotional, clarity);
    if (lowestScore === relevance) {
      feedback += "Try to stay focused on the topic we're discussing. ";
    } else if (lowestScore === turnTaking) {
      feedback += "Remember to wait for your turn to speak. ";
    } else if (lowestScore === emotional) {
      feedback += "Think about how others might be feeling. ";
    } else if (lowestScore === clarity) {
      feedback += "Take your time to express your thoughts clearly. ";
    }
  } else {
    feedback = "Keep practicing! Every conversation helps you get better! ";
    feedback += "Remember: " + topics.join(', ') + ". You're doing great!";
  }
  
  return feedback;
}

/**
 * Generate initial greeting for a level
 */
export async function generateInitialGreeting(
  levelId: string
): Promise<{ text: string; birdCharacter: string }> {
  try {
    // Get level details
    const levelRef = doc(db, 'levels', levelId);
    const levelDoc = await getDoc(levelRef);
    
    if (!levelDoc.exists()) {
      // Fallback greeting if level not found
      return {
        text: "Hi there! I'm Ruby Robin! I'm so excited to talk with you today! What's your name?",
        birdCharacter: 'ruby_robin'
      };
    }
    
    const level = levelDoc.data() as Level;
    
    // Get bird character with fallback
    let birdCharacterName = 'Ruby Robin';
    let birdCharacterId = level.bird_character || 'ruby_robin';
    
    try {
      const birdRef = doc(db, 'bird_characters', birdCharacterId);
      const birdDoc = await getDoc(birdRef);
      
      if (birdDoc.exists()) {
        const birdCharacter = birdDoc.data() as BirdCharacter;
        birdCharacterName = birdCharacter.name;
      }
    } catch (birdError) {
      console.log('Could not fetch bird character, using default');
    }
    
    // Generate contextual greeting based on level
    const greetings: { [key: string]: string } = {
      'Hello, Friend!': `Hi there! I'm ${birdCharacterName}! I'm so happy to meet you today. What's your name?`,
      'Nice to Meet You': `Hello again! It's ${birdCharacterName}. Let's practice introducing ourselves. Can you tell me your name and something you like?`,
      'How Are You?': `Hi friend! I'm ${birdCharacterName}. I'm feeling happy today! How are you feeling?`,
      'Taking Turns': `Hey there! ${birdCharacterName} here. Let's practice taking turns talking. I'll ask you a question, then you ask me one. Ready?`,
      'Active Listening': `Hello! I'm ${birdCharacterName}. Today we'll practice listening carefully. I'll tell you something, then you tell me what you heard. Sound good?`
    };
    
    const greeting = greetings[level.name] || 
      `Hello! I'm ${birdCharacterName}, and I'm excited to chat with you today! Let's practice ${level.conversation_topics?.[0] || 'having a nice conversation'}.`;
    
    return {
      text: greeting,
      birdCharacter: birdCharacterId
    };
  } catch (error) {
    console.error('Error generating initial greeting:', error);
    // Return a safe fallback greeting
    return {
      text: "Hi! I'm Ruby Robin, and I'm so happy to talk with you today! How are you?",
      birdCharacter: 'ruby_robin'
    };
  }
}

/**
 * Analyze conversation for skill improvements
 */
export async function analyzeConversationSkills(
  messages: Message[]
): Promise<{
  skills: { [key: string]: number };
  improvements: string[];
  strengths: string[];
}> {
  const userMessages = messages.filter(m => m.sender === 'user');
  
  if (userMessages.length === 0) {
    return {
      skills: {},
      improvements: [],
      strengths: []
    };
  }
  
  // Analyze various skills
  const skills = {
    greeting: 0,
    turn_taking: 0,
    emotion_recognition: 0,
    listening: 0,
    expression: 0
  };
  
  // Simple analysis (in production, this would be more sophisticated)
  userMessages.forEach(msg => {
    const text = msg.text.toLowerCase();
    
    // Greeting skill
    if (text.includes('hello') || text.includes('hi') || text.includes('good')) {
      skills.greeting += 20;
    }
    
    // Turn-taking (based on message length and timing)
    if (msg.text.length > 10 && msg.text.length < 100) {
      skills.turn_taking += 15;
    }
    
    // Emotion recognition
    const emotionWords = ['happy', 'sad', 'angry', 'excited', 'scared', 'feel'];
    if (emotionWords.some(word => text.includes(word))) {
      skills.emotion_recognition += 20;
    }
    
    // Listening (if responds to questions appropriately)
    if (text.includes('?') || text.includes('yes') || text.includes('no')) {
      skills.listening += 15;
    }
    
    // Expression (based on clarity and completeness)
    if (msg.pronunciation_score && msg.pronunciation_score > 80) {
      skills.expression += 20;
    }
  });
  
  // Normalize scores to 0-100
  Object.keys(skills).forEach(key => {
    skills[key as keyof typeof skills] = Math.min(100, skills[key as keyof typeof skills]);
  });
  
  // Identify strengths and improvements
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  Object.entries(skills).forEach(([skill, score]) => {
    if (score >= 70) {
      strengths.push(skill.replace('_', ' '));
    } else if (score < 50) {
      improvements.push(skill.replace('_', ' '));
    }
  });
  
  return {
    skills,
    improvements,
    strengths
  };
}