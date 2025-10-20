import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import OpenAI from 'openai';
import elevenLabsModule from 'elevenlabs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'chirp-app-3902d.appspot.com',
});

const db = getFirestore();
const storage = getStorage();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize ElevenLabs
const elevenlabs = new elevenLabsModule.ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Voice IDs for different bird characters
const BIRD_VOICES = {
  ruby_robin: 'EXAVITQu4vr4xnSDxMaL', // Rachel voice
  sage_owl: 'ErXwobaYiN019PkySvjV', // Antoni voice
  charlie_sparrow: 'TxGEqnHWrfWFTfGW9XjX', // Josh voice
  harmony_hawk: 'MF3mGyEYCl7XYWbV9V6O', // Bella voice
  luna_lark: 'EXAVITQu4vr4xnSDxMaL', // Elli voice
  phoenix_finch: 'pNInz6obpgDQGcFmaJgB', // Adam voice
};

// ======================
// CHAT API ENDPOINT - Enhanced for Autism-Aware Conversations
// ======================
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, userId, levelId, userMessage, systemPrompt, analysisData } = req.body;

    if (!conversationId || !userId || !levelId || !userMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get level details
    const levelDoc = await db.collection('levels').doc(levelId).get();
    if (!levelDoc.exists) {
      return res.status(404).json({ error: 'Level not found' });
    }
    const level = levelDoc.data();

    // Get bird character details
    const birdDoc = await db.collection('bird_characters').doc(level.bird_character).get();
    if (!birdDoc.exists) {
      return res.status(404).json({ error: 'Bird character not found' });
    }
    const birdCharacter = birdDoc.data();

    // Get conversation history
    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    const conversation = conversationDoc.exists ? conversationDoc.data() : { messages: [] };
    
    // Build conversation context for OpenAI
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Determine if conversation should end
    const exchangeCount = conversation.messages.filter(m => m.sender === 'user').length;
    const shouldEnd = exchangeCount >= 5;

    // Use provided system prompt or create enhanced default
    const enhancedSystemPrompt = systemPrompt || `
      ${birdCharacter.system_prompt}
      
      You are helping an autistic child aged 6-14 practice: ${level.objectives ? level.objectives.join(', ') : level.conversation_topics.join(', ')}.
      Level: ${level.name} - ${level.description}
      
      Autism-Aware Guidelines:
      - Keep responses short (2-3 sentences maximum, under 50 words)
      - Use simple, concrete language (avoid metaphors unless explaining)
      - Be encouraging and positive - celebrate ALL attempts
      - Accept brief responses as valid
      - Give processing time - acknowledge pauses are okay
      - Never pressure for eye contact
      - One question or idea at a time
      - Validate echolalia and special interests
      - Focus on the learning objectives: ${level.objectives ? level.objectives.join(', ') : level.conversation_topics.join(', ')}
      ${shouldEnd ? '- This is the last exchange. Wrap up positively, summarize what they did well, and congratulate enthusiastically!' : ''}
      ${analysisData?.needs_support ? '- Child needs extra support. Simplify language and offer choices.' : ''}
      ${analysisData?.engagement_level === 'high' ? '- Child is highly engaged! Match their enthusiasm!' : ''}
    `;

    // Generate response using OpenAI with enhanced parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 100, // Shorter for clearer responses
      presence_penalty: 0.1, // Encourage variety
      frequency_penalty: 0.1, // Avoid repetition
    });

    const aiResponse = completion.choices[0].message.content;

    // Calculate autism-aware scores (always encouraging)
    const scores = {
      relevance: analysisData?.content_relevance || Math.floor(65 + Math.random() * 35),
      turnTaking: analysisData?.turn_appropriate !== false ? Math.floor(75 + Math.random() * 25) : 70,
      emotional: analysisData?.emotional_content?.length > 0 ? 90 : Math.floor(70 + Math.random() * 30),
      clarity: Math.floor(70 + Math.random() * 30),
      engagement: analysisData?.engagement_level === 'high' ? 95 : 
                  analysisData?.engagement_level === 'low' ? 65 : 80,
      skillDemonstration: analysisData?.strategy_used?.length ? analysisData.strategy_used.length * 20 : 70
    };
    
    // Weight scores appropriately for autism (engagement matters more than perfect relevance)
    const weights = {
      relevance: 0.15,
      turnTaking: 0.20,
      emotional: 0.15,
      clarity: 0.10,
      engagement: 0.25,
      skillDemonstration: 0.15
    };
    
    let weightedSum = 0;
    for (const [key, value] of Object.entries(scores)) {
      weightedSum += value * (weights[key] || 0.1);
    }
    
    // Ensure minimum score of 60 for encouragement
    const overallScore = Math.max(60, Math.floor(weightedSum));

    // Generate autism-aware, strength-based feedback
    let feedback = '';
    const strengths = [];
    
    if (scores.engagement > 80) strengths.push('amazing engagement');
    if (scores.emotional > 80) strengths.push('expressing feelings');
    if (scores.turnTaking > 80) strengths.push('great turn-taking');
    if (analysisData?.special_interest_mentioned) strengths.push('sharing your interests');
    if (analysisData?.question_asked) strengths.push('asking questions');
    
    if (overallScore >= 90) {
      feedback = "🌟 Outstanding! You're a conversation superstar! ";
    } else if (overallScore >= 80) {
      feedback = "🎉 Great job! You're doing wonderfully! ";
    } else if (overallScore >= 70) {
      feedback = "👏 Good work! You're learning so well! ";
    } else {
      feedback = "💪 Nice try! Every conversation helps you grow! ";
    }
    
    if (strengths.length > 0) {
      feedback += `You're amazing at ${strengths.join(' and ')}! `;
    }
    
    feedback += "Keep going, you're doing great!";

    // Save user message to Firestore
    const userMessageData = {
      sender: 'user',
      text: userMessage,
      timestamp: new Date(),
      pronunciation_score: scores.clarity,
    };

    // Save bird response to Firestore
    const birdMessageData = {
      sender: 'bird',
      text: aiResponse,
      timestamp: new Date(),
      tone: shouldEnd ? 'congratulatory' : 'encouraging',
    };

    // Update conversation in Firestore
    await db.collection('conversations').doc(conversationId).update({
      messages: [...(conversation.messages || []), userMessageData, birdMessageData],
      ...(shouldEnd ? { 
        completed_at: new Date(),
        score: overallScore,
        feedback
      } : {})
    });

    res.json({
      response: aiResponse,
      text: aiResponse, // Add text field for compatibility
      birdCharacter: level.bird_character,
      tone: analysisData?.emotional_content?.includes('sad') ? 'calming' :
            analysisData?.engagement_level === 'high' ? 'playful' :
            shouldEnd ? 'congratulatory' : 'encouraging',
      shouldEnd,
      score: overallScore,
      feedback,
      scores,
      hints: analysisData?.needs_support ? 
        ['Try saying hello', 'Tell me how you feel', 'You can take your time'] : undefined,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// ======================
// TEXT-TO-SPEECH API
// ======================
app.post('/api/tts', async (req, res) => {
  try {
    const { text, birdCharacter = 'ruby_robin', conversationId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get the appropriate voice ID
    const voiceId = BIRD_VOICES[birdCharacter] || BIRD_VOICES.ruby_robin;

    // For now, return a mock URL to test the rest of the functionality
    // TODO: Implement actual ElevenLabs integration once Firebase Storage is configured
    console.log('TTS request received for text:', text.substring(0, 50) + '...');
    
    // Return a placeholder audio URL
    const mockAudioUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESQAABEIAAABAAAAZGF0YQAAAAA=';
    
    res.json({ audioUrl: mockAudioUrl });
  } catch (error) {
    console.error('TTS API error:', error);
    console.error('Full error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate speech', details: error.message });
  }
});

// ======================
// SPEECH-TO-TEXT API
// ======================
app.post('/api/stt', async (req, res) => {
  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({ error: 'Audio URL is required' });
    }

    // For now, return a mock transcription
    // In production, you would use Deepgram or Google Speech-to-Text here
    res.json({ 
      transcript: 'This is a placeholder transcription',
      confidence: 0.95
    });
  } catch (error) {
    console.error('STT API error:', error);
    res.status(500).json({ error: 'Failed to transcribe speech' });
  }
});

// ======================
// PRONUNCIATION SCORING API
// ======================
app.post('/api/pronunciation', async (req, res) => {
  try {
    const { audioUrl, referenceText } = req.body;

    // Simple pronunciation scoring (in production, use a real API)
    const score = Math.floor(70 + Math.random() * 30);
    const feedback = score >= 90 
      ? "Excellent pronunciation!" 
      : score >= 80 
      ? "Very good!" 
      : "Keep practicing!";

    res.json({ score, feedback });
  } catch (error) {
    console.error('Pronunciation API error:', error);
    res.status(500).json({ error: 'Failed to analyze pronunciation' });
  }
});

// ======================
// ASSESSMENT SCORING API
// ======================
app.post('/api/assessment/score', async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate skill scores
    const skillScores = {
      greeting: 0,
      turn_taking: 0,
      emotion_recognition: 0,
      listening: 0,
      expression: 0,
    };

    // Score each answer
    Object.entries(answers).forEach(([questionId, answer]) => {
      switch (questionId) {
        case 'q1':
          if (answer.text?.toLowerCase().includes('hello') || answer.text?.toLowerCase().includes('hi')) {
            skillScores.greeting += 40;
            skillScores.expression += 30;
          }
          break;
        case 'q2':
          if (answer === 'Nice to meet you') {
            skillScores.greeting += 40;
            skillScores.turn_taking += 20;
          }
          break;
        case 'q3':
          if (answer === 'Happy') {
            skillScores.emotion_recognition += 50;
          }
          break;
        case 'q4':
          if (answer.text?.toLowerCase().includes('good') || answer.text?.toLowerCase().includes('fine')) {
            skillScores.turn_taking += 30;
            skillScores.listening += 30;
          }
          break;
        case 'q5':
          const correct = ['Say hello', 'Ask a question', 'Listen to answer', 'Say goodbye'];
          if (JSON.stringify(answer) === JSON.stringify(correct)) {
            skillScores.turn_taking += 30;
            skillScores.listening += 30;
          }
          break;
        case 'q6':
          if (answer === "Ask if they're okay") {
            skillScores.emotion_recognition += 30;
            skillScores.expression += 20;
          }
          break;
      }
    });

    // Normalize scores to 0-100
    Object.keys(skillScores).forEach(key => {
      skillScores[key] = Math.min(100, skillScores[key]);
    });

    // Determine learning path
    const averageScore = Object.values(skillScores).reduce((a, b) => a + b, 0) / 5;
    let assignedPath = 'forest_explorer';
    if (averageScore >= 70) {
      assignedPath = 'sky_soarer';
    } else if (averageScore >= 40) {
      assignedPath = 'tree_climber';
    }

    // Get starting level
    const levelsSnapshot = await db.collection('levels')
      .where('path_id', '==', assignedPath)
      .where('level_number', '==', 1)
      .limit(1)
      .get();

    const startingLevel = levelsSnapshot.empty ? 'level_1' : levelsSnapshot.docs[0].id;

    // Save assessment result
    await db.collection('assessment_results').add({
      user_id: userId,
      responses: Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: typeof answer === 'object' ? answer.text || JSON.stringify(answer) : answer,
        audio_url: answer.audioUrl || null,
      })),
      skill_scores: skillScores,
      assigned_path: assignedPath,
      starting_level: startingLevel,
      completed_at: new Date(),
    });

    // Update user profile
    await db.collection('users').doc(userId).update({
      current_level_id: startingLevel,
    });

    res.json({
      assignedPath,
      startingLevel,
      skillScores,
      averageScore,
    });
  } catch (error) {
    console.error('Assessment scoring error:', error);
    res.status(500).json({ error: 'Failed to score assessment' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});