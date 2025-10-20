import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { apiClient } from '../api/client';

// Types for conversation management
interface ConversationContext {
  levelId: string;
  userId: string;
  conversationId: string;
  exchangeCount: number;
  userResponses: string[];
  objectives: string[];
  birdCharacter: string;
  childAge?: number;
  specialInterests?: string[];
  communicationStyle?: 'verbal' | 'minimal' | 'echolalic';
}

interface ResponseAnalysis {
  content_relevance: number; // 0-100
  emotional_content: string[];
  question_asked: boolean;
  turn_appropriate: boolean;
  strategy_used: string[];
  needs_support: boolean;
  engagement_level: 'high' | 'medium' | 'low';
  special_interest_mentioned: boolean;
  processing_time_needed: boolean;
  next_action: 'continue' | 'provide_hint' | 'simplify' | 'celebrate' | 'wrap_up';
}

interface ConversationMetrics {
  relevance: number;
  turnTaking: number;
  emotionalAwareness: number;
  clarity: number;
  engagement: number;
  skillDemonstration: number;
}

interface AIResponse {
  text: string;
  birdCharacter: string;
  tone: 'encouraging' | 'celebratory' | 'gentle' | 'playful' | 'calming';
  shouldEnd: boolean;
  score?: number;
  feedback?: string;
  hints?: string[];
  visualSupport?: string;
  nextObjective?: string;
}

// Enhanced bird character prompts for autism-aware interaction
const ENHANCED_BIRD_PROMPTS = {
  ruby_robin: {
    base: `You are Ruby Robin, a warm and patient bird teaching basic social skills to an autistic child aged 6-14.`,
    style: `
    Communication Style:
    - Use simple, concrete language (no metaphors unless explaining them)
    - One idea per sentence
    - Wait time is important - acknowledge pauses are okay
    - Never pressure for eye contact - "looking toward me" is enough
    - Celebrate all attempts at communication
    - Accept echolalia as valid communication
    - Use predictable patterns in conversation`,
    adaptations: {
      minimal: 'Accept one-word answers. Expand gently: "Yes! You said [word]. That\'s right!"',
      echolalic: 'When child echoes, acknowledge it: "You said [phrase]! That\'s one way to say it."',
      verbal: 'Encourage elaboration gently: "Tell me more about that" or "What else?"'
    }
  },
  sage_owl: {
    base: `You are Sage Owl, a wise and calm bird teaching emotional awareness to an autistic child aged 6-14.`,
    style: `
    Emotion Teaching Approach:
    - Connect emotions to body sensations: "When happy, your body might feel light"
    - Use weather metaphors: "Anger can feel like a storm inside"
    - Validate all emotions: "It's okay to feel [emotion]"
    - Teach emotion regulation: "Let's take three deep breaths together"
    - Recognize alexithymia (difficulty identifying emotions) is common
    - Use emotion scales: "On a scale of 1-5, how big is that feeling?"
    - Never rush emotional processing`,
    adaptations: {
      minimal: 'Use emotion cards or simple choices: "Happy or sad?"',
      echolalic: 'Provide emotion scripts: "When I\'m happy, I say..."',
      verbal: 'Explore emotions deeply: "What does that feeling remind you of?"'
    }
  },
  charlie_sparrow: {
    base: `You are Charlie Sparrow, an energetic but structured bird teaching turn-taking to an autistic child aged 6-14.`,
    style: `
    Turn-Taking Teaching:
    - Make turns explicit: "My turn... Your turn!"
    - Use visual or verbal cues for turns
    - Count turns together: "That was turn 1, now turn 2"
    - Praise waiting: "Great waiting for your turn!"
    - Allow processing time between turns
    - Accept non-verbal turns (gestures, pointing)
    - Create predictable turn patterns`,
    adaptations: {
      minimal: 'Use very clear turn markers. Accept any response as a turn.',
      echolalic: 'Incorporate echoed phrases into turn structure.',
      verbal: 'Practice longer conversational turns with clear boundaries.'
    }
  },
  phoenix_finch: {
    base: `You are Phoenix Finch, teaching resilience and problem-solving to an autistic child aged 6-14.`,
    style: `
    Problem-Solving Approach:
    - Break problems into tiny steps
    - Celebrate trying, not just succeeding
    - Normalize mistakes: "Mistakes help us learn"
    - Offer choices for solutions: "We could try A or B"
    - Recognize sensory overwhelm affects problem-solving
    - Build on strengths and special interests
    - Use visual problem-solving maps when helpful`,
    adaptations: {
      minimal: 'Offer binary choices. Use visual supports.',
      echolalic: 'Provide problem-solving scripts to practice.',
      verbal: 'Explore multiple solutions together.'
    }
  },
  harmony_hawk: {
    base: `You are Harmony Hawk, teaching self-advocacy to an autistic child aged 6-14.`,
    style: `
    Self-Advocacy Teaching:
    - Practice "I need" statements
    - Validate communication differences
    - Teach asking for breaks: "I need space"
    - Practice requesting accommodations
    - Celebrate self-knowledge: "You know what you need!"
    - Build confidence in expressing needs
    - Never shame communication style`,
    adaptations: {
      minimal: 'Practice single advocacy phrases: "Help" or "Break"',
      echolalic: 'Provide advocacy scripts to echo when needed.',
      verbal: 'Practice detailed need expression and boundary setting.'
    }
  }
};

/**
 * Analyzes child's response for autism-aware metrics
 */
export function analyzeChildResponse(
  userMessage: string,
  context: ConversationContext
): ResponseAnalysis {
  const analysis: ResponseAnalysis = {
    content_relevance: 0,
    emotional_content: [],
    question_asked: false,
    turn_appropriate: true, // Default to true - all responses are valid
    strategy_used: [],
    needs_support: false,
    engagement_level: 'medium',
    special_interest_mentioned: false,
    processing_time_needed: false,
    next_action: 'continue'
  };

  const lowerMessage = userMessage.toLowerCase();
  const wordCount = userMessage.split(' ').length;

  // Check for relevance (but don't penalize special interest tangents)
  if (context.objectives.some(obj => 
    lowerMessage.includes(obj.toLowerCase().split(' ')[0])
  )) {
    analysis.content_relevance = 80;
  } else if (wordCount > 0) {
    // Any response shows engagement
    analysis.content_relevance = 60;
  }

  // Check for special interests (these are valuable!)
  if (context.specialInterests?.some(interest => 
    lowerMessage.includes(interest.toLowerCase())
  )) {
    analysis.special_interest_mentioned = true;
    analysis.engagement_level = 'high';
    analysis.content_relevance = Math.max(analysis.content_relevance, 70);
  }

  // Detect emotional content
  const emotions = ['happy', 'sad', 'angry', 'scared', 'excited', 'worried', 'calm'];
  emotions.forEach(emotion => {
    if (lowerMessage.includes(emotion)) {
      analysis.emotional_content.push(emotion);
    }
  });

  // Check for questions
  analysis.question_asked = lowerMessage.includes('?') || 
    lowerMessage.startsWith('what') || 
    lowerMessage.startsWith('why') || 
    lowerMessage.startsWith('how');

  // Determine engagement level
  if (wordCount === 1) {
    analysis.engagement_level = 'low';
    analysis.needs_support = true;
  } else if (wordCount > 10 || analysis.special_interest_mentioned) {
    analysis.engagement_level = 'high';
  }

  // Check if child needs more processing time
  if (userMessage === '' || userMessage === '...' || lowerMessage === 'um' || lowerMessage === 'uh') {
    analysis.processing_time_needed = true;
    analysis.next_action = 'provide_hint';
  }

  // Determine next action based on exchange count
  if (context.exchangeCount >= 4) {
    analysis.next_action = 'wrap_up';
  } else if (analysis.needs_support) {
    analysis.next_action = 'simplify';
  } else if (analysis.engagement_level === 'high') {
    analysis.next_action = 'celebrate';
  }

  // Check strategies used
  if (analysis.emotional_content.length > 0) {
    analysis.strategy_used.push('emotion_expression');
  }
  if (analysis.question_asked) {
    analysis.strategy_used.push('question_asking');
  }
  if (wordCount > 5) {
    analysis.strategy_used.push('elaboration');
  }

  return analysis;
}

/**
 * Generates adaptive AI response based on child's needs
 */
export async function generateAdaptiveResponse(
  userMessage: string,
  context: ConversationContext
): Promise<AIResponse> {
  try {
    // Analyze the child's response
    const analysis = analyzeChildResponse(userMessage, context);
    
    // Get bird character data
    const birdDoc = await getDoc(doc(db, 'bird_characters', context.birdCharacter));
    const birdData = birdDoc.data();
    
    // Build adaptive prompt based on analysis
    const systemPrompt = buildAdaptivePrompt(
      birdData,
      context,
      analysis
    );
    
    // Call the backend API with enhanced context
    const response = await apiClient.sendChatMessage({
      conversationId: context.conversationId,
      userId: context.userId,
      levelId: context.levelId,
      userMessage,
      systemPrompt, // Pass the adaptive prompt
      analysisData: analysis // Pass analysis for backend processing
    });
    
    // Calculate comprehensive scores
    const metrics = calculateMetrics(analysis, context);
    
    // Generate appropriate feedback
    const feedback = generateAutismAwareFeedback(metrics, analysis, context);
    
    // Determine if conversation should end
    const shouldEnd = analysis.next_action === 'wrap_up' || context.exchangeCount >= 5;
    
    return {
      text: response.response || generateFallbackResponse(analysis, context),
      birdCharacter: context.birdCharacter,
      tone: determineTone(analysis),
      shouldEnd,
      score: calculateOverallScore(metrics),
      feedback,
      hints: analysis.needs_support ? generateHints(context) : undefined,
      visualSupport: analysis.processing_time_needed ? '🤔💭' : undefined,
      nextObjective: context.objectives[Math.min(context.exchangeCount, context.objectives.length - 1)]
    };
  } catch (error) {
    console.error('Error generating adaptive response:', error);
    return getFallbackResponse(context);
  }
}

/**
 * Builds an adaptive system prompt based on child's needs
 */
function buildAdaptivePrompt(
  birdData: any,
  context: ConversationContext,
  analysis: ResponseAnalysis
): string {
  const birdPrompts = ENHANCED_BIRD_PROMPTS[context.birdCharacter as keyof typeof ENHANCED_BIRD_PROMPTS];
  const communicationStyle = context.communicationStyle || 'verbal';
  
  let prompt = `
    ${birdPrompts.base}
    ${birdPrompts.style}
    
    Current Context:
    - Child's communication style: ${communicationStyle}
    - Current objective: ${context.objectives[context.exchangeCount] || context.objectives[0]}
    - Exchange ${context.exchangeCount + 1} of 5
    - Child's engagement level: ${analysis.engagement_level}
    ${analysis.special_interest_mentioned ? '- Child mentioned their special interest - acknowledge and gently guide back' : ''}
    ${analysis.processing_time_needed ? '- Child needs processing time - be patient and offer gentle support' : ''}
    ${analysis.needs_support ? '- Child needs extra support - simplify and encourage' : ''}
    
    Adaptation: ${birdPrompts.adaptations[communicationStyle]}
    
    Response Guidelines:
    - Keep response under 50 words
    - ${analysis.next_action === 'provide_hint' ? 'Offer a gentle hint or choice' : ''}
    - ${analysis.next_action === 'simplify' ? 'Simplify your language and offer binary choices' : ''}
    - ${analysis.next_action === 'celebrate' ? 'Celebrate their engagement enthusiastically!' : ''}
    - ${analysis.next_action === 'wrap_up' ? 'Wrap up positively and summarize what they did well' : ''}
    - Always validate their communication attempt
    - Never criticize or show frustration
  `;
  
  return prompt;
}

/**
 * Calculates comprehensive metrics
 */
function calculateMetrics(
  analysis: ResponseAnalysis,
  context: ConversationContext
): ConversationMetrics {
  return {
    relevance: analysis.content_relevance,
    turnTaking: analysis.turn_appropriate ? 85 : 60,
    emotionalAwareness: analysis.emotional_content.length > 0 ? 90 : 70,
    clarity: 80, // Base score - adjust based on pronunciation if available
    engagement: 
      analysis.engagement_level === 'high' ? 95 :
      analysis.engagement_level === 'medium' ? 80 : 65,
    skillDemonstration: analysis.strategy_used.length * 25
  };
}

/**
 * Generates autism-aware, encouraging feedback
 */
function generateAutismAwareFeedback(
  metrics: ConversationMetrics,
  analysis: ResponseAnalysis,
  context: ConversationContext
): string {
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Always start with strengths
  if (metrics.engagement > 80) {
    strengths.push('amazing engagement');
  }
  if (analysis.emotional_content.length > 0) {
    strengths.push('expressing feelings');
  }
  if (analysis.question_asked) {
    strengths.push('asking great questions');
  }
  if (analysis.special_interest_mentioned) {
    strengths.push('sharing your interests');
  }
  if (metrics.turnTaking > 80) {
    strengths.push('excellent turn-taking');
  }
  
  // Frame improvements positively
  if (metrics.relevance < 60 && !analysis.special_interest_mentioned) {
    improvements.push('staying on our topic');
  }
  
  // Build feedback message
  let feedback = '';
  
  const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.values(metrics).length;
  
  if (avgScore >= 85) {
    feedback = '🌟 Outstanding! You\'re a conversation superstar! ';
  } else if (avgScore >= 75) {
    feedback = '🎉 Great job! You\'re doing wonderfully! ';
  } else if (avgScore >= 65) {
    feedback = '👏 Good work! You\'re learning so well! ';
  } else {
    feedback = '💪 Nice try! Every conversation helps you grow! ';
  }
  
  if (strengths.length > 0) {
    feedback += `You're amazing at ${strengths.join(' and ')}! `;
  }
  
  if (improvements.length > 0 && avgScore >= 65) {
    feedback += `Let's keep practicing ${improvements.join(' and ')}. `;
  }
  
  // Add specific encouragement based on communication style
  if (context.communicationStyle === 'minimal') {
    feedback += 'Every word you share is valuable! ';
  } else if (context.communicationStyle === 'echolalic') {
    feedback += 'I love hearing your voice! ';
  }
  
  return feedback + 'You\'re doing great!';
}

/**
 * Determines appropriate tone based on child's state
 */
function determineTone(analysis: ResponseAnalysis): AIResponse['tone'] {
  if (analysis.next_action === 'celebrate') {
    return 'celebratory';
  } else if (analysis.processing_time_needed || analysis.needs_support) {
    return 'gentle';
  } else if (analysis.engagement_level === 'high') {
    return 'playful';
  } else if (analysis.emotional_content.includes('sad') || analysis.emotional_content.includes('worried')) {
    return 'calming';
  }
  return 'encouraging';
}

/**
 * Calculates overall score with autism-aware weighting
 */
function calculateOverallScore(metrics: ConversationMetrics): number {
  // Weight engagement and skill demonstration more heavily
  // Don't penalize as much for topic relevance if engaged
  const weights = {
    relevance: 0.15,
    turnTaking: 0.20,
    emotionalAwareness: 0.15,
    clarity: 0.10,
    engagement: 0.25,
    skillDemonstration: 0.15
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [key, value] of Object.entries(metrics)) {
    const weight = weights[key as keyof typeof weights] || 0.1;
    weightedSum += value * weight;
    totalWeight += weight;
  }
  
  const score = Math.round(weightedSum / totalWeight);
  // Ensure minimum score of 60 to maintain encouragement
  return Math.max(60, Math.min(100, score));
}

/**
 * Generates hints based on current objective
 */
function generateHints(context: ConversationContext): string[] {
  const hints: string[] = [];
  const objective = context.objectives[context.exchangeCount] || context.objectives[0];
  
  if (objective.includes('greeting')) {
    hints.push('Try saying "Hello" or "Hi"');
    hints.push('You can wave too!');
  } else if (objective.includes('name')) {
    hints.push('Say "My name is..."');
    hints.push('Ask "What\'s your name?"');
  } else if (objective.includes('feeling')) {
    hints.push('How does your body feel?');
    hints.push('Happy, sad, calm, or excited?');
  } else if (objective.includes('turn')) {
    hints.push('Wait for the bird to finish');
    hints.push('Now it\'s your turn to talk!');
  }
  
  return hints;
}

/**
 * Generates fallback response when API fails
 */
function generateFallbackResponse(
  analysis: ResponseAnalysis,
  context: ConversationContext
): string {
  const responses = {
    provide_hint: "That's okay! Take your time. You could try saying hello or telling me how you feel.",
    simplify: "Good try! Let me ask something easier. Do you like birds? You can say yes or no.",
    celebrate: "Wonderful! You're doing such a great job talking with me!",
    continue: "That's interesting! Tell me more about that.",
    wrap_up: "You did amazing today! I'm so proud of how well you communicated!"
  };
  
  return responses[analysis.next_action] || responses.continue;
}

/**
 * Gets complete fallback response object
 */
function getFallbackResponse(context: ConversationContext): AIResponse {
  return {
    text: "You're doing great! Let's keep practicing together.",
    birdCharacter: context.birdCharacter,
    tone: 'encouraging',
    shouldEnd: false,
    score: 75,
    feedback: 'Keep going! Every conversation helps you learn.',
    hints: ['Try saying hello', 'Tell me how you feel'],
  };
}

/**
 * Initializes conversation with adaptive greeting
 */
export async function initializeAdaptiveConversation(
  levelId: string,
  userId: string,
  userProfile?: {
    age?: number;
    specialInterests?: string[];
    communicationStyle?: 'verbal' | 'minimal' | 'echolalic';
    preferredSupports?: string[];
  }
): Promise<AIResponse> {
  try {
    // Get level data
    const levelDoc = await getDoc(doc(db, 'levels', levelId));
    const levelData = levelDoc.data();
    
    if (!levelData) {
      throw new Error('Level not found');
    }
    
    // Get bird character
    const birdDoc = await getDoc(doc(db, 'bird_characters', levelData.bird_character));
    const birdData = birdDoc.data();
    
    if (!birdData) {
      throw new Error('Bird character not found');
    }
    
    // Create personalized greeting
    let greeting = `Hello! I'm ${birdData.name}! ${birdData.emoji} `;
    
    if (userProfile?.specialInterests && userProfile.specialInterests.length > 0) {
      greeting += `I heard you like ${userProfile.specialInterests[0]}. That's cool! `;
    }
    
    // Add level-specific introduction
    if (levelData.order <= 6) {
      greeting += `Today we'll practice ${levelData.conversation_topics[0]}. Ready to start?`;
    } else {
      greeting += `Let's work on ${levelData.name.toLowerCase()} together. I'm here to help!`;
    }
    
    return {
      text: greeting,
      birdCharacter: levelData.bird_character,
      tone: 'encouraging',
      shouldEnd: false,
      hints: levelData.conversation_topics,
      nextObjective: levelData.objectives[0]
    };
  } catch (error) {
    console.error('Error initializing conversation:', error);
    return {
      text: "Hi there! I'm excited to chat with you today! What's your name?",
      birdCharacter: 'ruby_robin',
      tone: 'encouraging',
      shouldEnd: false
    };
  }
}

/**
 * Saves conversation results with detailed metrics
 */
export async function saveConversationResults(
  conversationId: string,
  metrics: ConversationMetrics,
  analysis: ResponseAnalysis[],
  context: ConversationContext
): Promise<void> {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Calculate skill improvements
    const skillImprovements: { [key: string]: number } = {};
    
    // Map metrics to skills
    if (metrics.emotionalAwareness > 70) {
      skillImprovements['emotion_recognition'] = 10;
    }
    if (metrics.turnTaking > 75) {
      skillImprovements['turn_taking'] = 10;
    }
    if (metrics.engagement > 80) {
      skillImprovements['active_listening'] = 10;
    }
    if (metrics.clarity > 75) {
      skillImprovements['self_expression'] = 10;
    }
    
    // Check for special achievements
    const achievements: string[] = [];
    const anySpecialInterest = analysis.some(a => a.special_interest_mentioned);
    if (anySpecialInterest) {
      achievements.push('shared_interest');
    }
    if (metrics.engagement > 90) {
      achievements.push('super_engaged');
    }
    if (analysis.every(a => a.turn_appropriate)) {
      achievements.push('perfect_turns');
    }
    
    // Update conversation document
    await updateDoc(conversationRef, {
      completed_at: new Date(),
      overall_score: calculateOverallScore(metrics),
      detailed_metrics: metrics,
      skill_improvements: skillImprovements,
      achievements_earned: achievements,
      communication_style: context.communicationStyle,
      total_exchanges: context.exchangeCount
    });
    
    // Update user skills
    for (const [skillId, improvement] of Object.entries(skillImprovements)) {
      await updateUserSkill(context.userId, skillId, improvement);
    }
    
  } catch (error) {
    console.error('Error saving conversation results:', error);
  }
}

/**
 * Updates user's skill progress
 */
async function updateUserSkill(
  userId: string,
  skillId: string,
  improvement: number
): Promise<void> {
  try {
    const skillsRef = collection(db, 'user_skills');
    // Query for existing skill record
    // If exists, update progress
    // If not, create new record
    // Implementation depends on your exact Firestore structure
  } catch (error) {
    console.error('Error updating user skill:', error);
  }
}