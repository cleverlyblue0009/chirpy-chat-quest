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
  skillsMastered?: boolean; // Track if child has mastered the skills
  score: number;
  feedback: string;
}

/**
 * Generate AI response for conversation
 * @param messages Previous messages in the conversation
 * @param levelId The current level ID
 * @param userMessage The user's latest message
 * @param emotionContext Optional emotion context from facial detection
 * @returns AI-generated response
 */
export async function generateAIResponse(
  conversationId: string,
  userId: string,
  levelId: string,
  userMessage: string,
  emotionContext?: any
): Promise<AIResponse> {
  try {
    // Use enhanced adaptive response generation
    // Get conversation to track exchanges
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    const conversationData = conversationDoc.data();
    const exchangeCount = conversationData?.messages?.filter((m: any) => m.sender === 'user').length || 0;
    
    const context = {
      levelId,
      userId,
      conversationId,
      exchangeCount,
      userResponses: [],
      objectives: [],
      birdCharacter: 'ruby_robin',
    };
    
    // Build emotion-aware system prompt modifier - make it feel like a supportive friend
    let systemPromptModifier = '';
    
    if (emotionContext) {
      // Add empathy and emotional awareness to responses
      systemPromptModifier += `IMPORTANT: You are a friendly, supportive companion having a natural conversation. You can SEE the child's emotions through their facial expressions. `;
      
      // Current emotional state awareness
      systemPromptModifier += `CURRENT_EMOTION: The child is feeling ${emotionContext.currentEmotion} (confidence: ${Math.round((emotionContext.emotionConfidence || 0) * 100)}%). `;
      
      if (emotionContext.currentEmotion === 'happy') {
        systemPromptModifier += `The child is happy! Match their positive energy. Share in their joy. Use exclamation points and enthusiastic language! `;
      } else if (emotionContext.currentEmotion === 'sad') {
        systemPromptModifier += `The child seems sad. Be gentle, caring, and understanding. Offer comfort without being pushy. Ask if they'd like to talk about it or do something fun. `;
      } else if (emotionContext.currentEmotion === 'angry' || emotionContext.currentEmotion === 'frustrated') {
        systemPromptModifier += `The child seems frustrated or upset. Acknowledge their feelings with empathy: "I can see you're feeling frustrated" or "It's okay to feel upset". Help them work through it gently. `;
      } else if (emotionContext.currentEmotion === 'surprised') {
        systemPromptModifier += `The child looks surprised! They might be processing something new or unexpected. Give them time to absorb information. Ask gentle questions. `;
      }
      
      if (emotionContext.isStruggling) {
        systemPromptModifier += `STRUGGLING: The child is having difficulty. As a friend would: 1) Acknowledge the challenge warmly ("I can see this is tricky!"), 2) Break things down simply, 3) Offer to help or try differently, 4) Stay patient and encouraging. Keep responses under 35 words. `;
      }
      
      if (emotionContext.shouldBeEmphatic) {
        systemPromptModifier += `BE_EXTRA_SUPPORTIVE: The child needs emotional support right now. Show you care about them as a person, not just the learning. Use phrases like "I'm here for you", "You're doing amazing", "It's okay to take a break". `;
      }
      
      if (emotionContext.needsSimplification) {
        systemPromptModifier += `SIMPLIFY: The child looks confused. Use very simple language - short sentences (max 8 words), one clear idea at a time, concrete examples. No complex words. `;
      }
      
      if (emotionContext.engagementLevel === 'high') {
        systemPromptModifier += `HIGH_ENGAGEMENT: The child is really into this! They're looking at the screen and seem interested. Go deeper! Ask follow-up questions. Be playful. Celebrate their enthusiasm: "I love how excited you are about this!" `;
      } else if (emotionContext.engagementLevel === 'low') {
        systemPromptModifier += `LOW_ENGAGEMENT: The child seems disengaged. Try to re-engage them naturally: Ask about THEIR interests, make it fun, use humor, or suggest switching topics. Be a friend noticing they're not having fun. `;
      }
      
      if (emotionContext.lookAwayCount >= 2) {
        systemPromptModifier += `ATTENTION: Child looked away ${emotionContext.lookAwayCount} times. They might need a break or be distracted. Keep it SHORT (max 20 words). Ask simple yes/no questions. Maybe check in: "Do you want to keep going or take a quick break?" `;
      }
      
      if (!emotionContext.isLookingAtScreen) {
        systemPromptModifier += `NOT_LOOKING: Child is looking away right now. Keep response brief and engaging to draw attention back. Use their name if you know it. `;
      }
      
      if (emotionContext.conversationPace === 'slow') {
        systemPromptModifier += `SLOW_PACE: Child is taking time to process. That's great! Be patient. Use encouraging phrases: "Take all the time you need", "No rush, I'm right here", "Think about it". Give space between ideas. `;
      }
      
      if (emotionContext.conversationPace === 'fast') {
        systemPromptModifier += `FAST_PACE: Conversation is moving quickly. Slow down a bit to ensure comprehension. Add brief pauses in your language: "So... what do you think?" Use "hmm" or "let's see" to create natural breathing room. `;
      }
      
      // Add general friendly communication style
      systemPromptModifier += `STYLE: Talk like a caring friend, not a teacher. Use contractions ("you're" not "you are"). Be warm and genuine. Reflect their emotions: if they're excited, be excited WITH them. If they're struggling, be understanding WITH them. `;
    }
    
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
      // Call backend API with enhanced context including emotion data
      const response = await apiClient.sendChatMessage({
        conversationId,
        userId,
        levelId,
        userMessage,
        analysisData: analysis,
        emotionContext,
        systemPromptModifier: systemPromptModifier || undefined
      });
      
      // Ensure we have valid response data from API
      if (!response.text && !response.response) {
        throw new Error('No response text received from API');
      }
      
      // Validate and enhance the response
      const validatedResponse = validateAIResponse(response, context);
      
      // Track skill mastery based on exchange count and performance
      const minExchanges = 8;
      const skillsMastered = exchangeCount >= minExchanges && 
                           (validatedResponse.score || response.score || 75) >= 80;
      
      return {
        text: validatedResponse.text || response.text || response.response,
        birdCharacter: response.birdCharacter || context.birdCharacter || 'ruby_robin',
        tone: response.tone || 'encouraging',
        shouldEnd: response.shouldEnd || false,
        skillsMastered,
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
    "That's wonderful! Tell me more about that!",
    "I really like hearing about that! What else can you tell me?",
    "You're doing so well! I'm loving this conversation!",
    "That sounds really interesting! How does that make you feel?",
    "Great job! I can tell you're thinking hard about this. What do you think?",
    "Ooh, I like that! Can you explain more?",
    "That's such a cool idea! Tell me more!"
  ];
  
  // Simple response selection based on message length and content
  let selectedResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Check if it's a greeting
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon'];
  if (greetings.some(g => userMessage.toLowerCase().includes(g))) {
    selectedResponse = "Hi there! I'm so happy to talk with you! How are you doing today?";
  }
  
  // Check if it's a question
  if (userMessage.includes('?')) {
    selectedResponse = "Ooh, that's such a good question! Let me think... What do YOU think about it? I'd love to hear your thoughts!";
  }
  
  // Check for emotional words
  if (userMessage.toLowerCase().includes('sad') || userMessage.toLowerCase().includes('upset')) {
    selectedResponse = "I can hear that you're not feeling great right now. That's okay - everyone feels that way sometimes. Want to talk about it?";
  }
  
  if (userMessage.toLowerCase().includes('happy') || userMessage.toLowerCase().includes('excited')) {
    selectedResponse = "Yay! I can tell you're feeling happy! That makes me happy too! What's making you feel so good?";
  }
  
  // Check if minimum training is complete
  const minExchanges = 8;
  const skillsMastered = context.exchangeCount >= minExchanges;
  
  return {
    text: selectedResponse,
    birdCharacter: context.birdCharacter || 'ruby_robin',
    tone: 'encouraging',
    shouldEnd: false,
    skillsMastered,
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