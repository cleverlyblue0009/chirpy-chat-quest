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
    
    return {
      text: response.text || response.response,
      birdCharacter: response.birdCharacter || context.birdCharacter || 'ruby_robin',
      tone: response.tone || 'encouraging',
      shouldEnd: response.shouldEnd || false,
      score: response.score || 0,
      feedback: response.feedback || ''
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Re-throw the error to be handled by the caller
    throw error;
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
      throw new Error('Level not found');
    }
    
    const level = levelDoc.data() as Level;
    
    // Get bird character
    const birdRef = doc(db, 'bird_characters', level.bird_character);
    const birdDoc = await getDoc(birdRef);
    
    if (!birdDoc.exists()) {
      throw new Error('Bird character not found');
    }
    
    const birdCharacter = birdDoc.data() as BirdCharacter;
    
    // Generate contextual greeting based on level
    const greetings: { [key: string]: string } = {
      'Hello, Friend!': `Hi there! I'm ${birdCharacter.name}! I'm so happy to meet you today. What's your name?`,
      'Nice to Meet You': `Hello again! It's ${birdCharacter.name}. Let's practice introducing ourselves. Can you tell me your name and something you like?`,
      'How Are You?': `Hi friend! I'm ${birdCharacter.name}. I'm feeling happy today! How are you feeling?`,
      'Taking Turns': `Hey there! ${birdCharacter.name} here. Let's practice taking turns talking. I'll ask you a question, then you ask me one. Ready?`,
      'Active Listening': `Hello! I'm ${birdCharacter.name}. Today we'll practice listening carefully. I'll tell you something, then you tell me what you heard. Sound good?`
    };
    
    const greeting = greetings[level.name] || 
      `Hello! I'm ${birdCharacter.name}, and I'm excited to chat with you today! Let's practice ${level.conversation_topics[0]}.`;
    
    return {
      text: greeting,
      birdCharacter: level.bird_character
    };
  } catch (error) {
    console.error('Error generating initial greeting:', error);
    // Re-throw the error to be handled by the caller
    throw error;
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