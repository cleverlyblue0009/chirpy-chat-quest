import OpenAI from 'openai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Level, BirdCharacter } from '@/types/firebase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend API
});

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
  messages: Message[],
  levelId: string,
  userMessage: string
): Promise<AIResponse> {
  try {
    // Get level details
    const levelRef = doc(db, 'levels', levelId);
    const levelDoc = await getDoc(levelRef);
    
    if (!levelDoc.exists()) {
      throw new Error('Level not found');
    }
    
    const level = levelDoc.data() as Level;
    
    // Get bird character details
    const birdRef = doc(db, 'bird_characters', level.bird_character);
    const birdDoc = await getDoc(birdRef);
    
    if (!birdDoc.exists()) {
      throw new Error('Bird character not found');
    }
    
    const birdCharacter = birdDoc.data() as BirdCharacter;
    
    // Build conversation context
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Determine if conversation should end (after 5-7 exchanges)
    const exchangeCount = messages.filter(m => m.sender === 'user').length;
    const shouldEnd = exchangeCount >= 5;
    
    // Create system prompt
    const systemPrompt = `
      ${birdCharacter.system_prompt}
      
      You are helping a child practice: ${level.conversation_topics.join(', ')}.
      Level: ${level.name} - ${level.description}
      
      Guidelines:
      - Keep responses short (2-3 sentences maximum)
      - Use simple, clear language appropriate for children
      - Be encouraging and positive
      - Ask follow-up questions to keep the conversation going
      - Focus on the learning objectives: ${level.conversation_topics.join(', ')}
      ${shouldEnd ? '- This is the last exchange. Wrap up the conversation positively and congratulate the child.' : ''}
      
      Evaluate the child's response for:
      - Relevance to the topic (0-100)
      - Appropriate turn-taking (0-100)
      - Emotional understanding if applicable (0-100)
      - Clarity of expression (0-100)
    `;
    
    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 150,
      functions: [
        {
          name: 'evaluate_response',
          description: 'Evaluate the child\'s response',
          parameters: {
            type: 'object',
            properties: {
              response_text: {
                type: 'string',
                description: 'The bird\'s response to the child'
              },
              tone: {
                type: 'string',
                enum: ['friendly', 'encouraging', 'excited', 'thoughtful', 'congratulatory'],
                description: 'The tone of the response'
              },
              relevance_score: {
                type: 'number',
                description: 'How relevant the child\'s response was (0-100)'
              },
              turn_taking_score: {
                type: 'number',
                description: 'How well the child took their turn (0-100)'
              },
              emotional_score: {
                type: 'number',
                description: 'How well the child understood emotions if applicable (0-100)'
              },
              clarity_score: {
                type: 'number',
                description: 'How clearly the child expressed themselves (0-100)'
              }
            },
            required: ['response_text', 'tone', 'relevance_score', 'turn_taking_score', 'emotional_score', 'clarity_score']
          }
        }
      ],
      function_call: { name: 'evaluate_response' }
    });
    
    const functionCall = completion.choices[0].message.function_call;
    const evaluation = JSON.parse(functionCall?.arguments || '{}');
    
    // Calculate overall score
    const scores = [
      evaluation.relevance_score || 70,
      evaluation.turn_taking_score || 70,
      evaluation.emotional_score || 70,
      evaluation.clarity_score || 70
    ];
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // Generate feedback
    const feedback = generateFeedback(overallScore, scores, level.conversation_topics);
    
    return {
      text: evaluation.response_text || "That's interesting! Can you tell me more?",
      birdCharacter: level.bird_character,
      tone: evaluation.tone || 'friendly',
      shouldEnd,
      score: overallScore,
      feedback
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback response
    return {
      text: "That's great! Keep going, you're doing wonderfully!",
      birdCharacter: 'ruby_robin',
      tone: 'encouraging',
      shouldEnd: false,
      score: 75,
      feedback: 'Keep practicing! You\'re making great progress!'
    };
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
    
    // Fallback greeting
    return {
      text: "Hello there! I'm Ruby Robin, and I'm excited to chat with you today! What's your name?",
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