import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import OpenAI from 'openai';
import { ElevenLabsClient } from '@elevenlabs/client';
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
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const storage = getStorage();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize ElevenLabs
const elevenlabs = new ElevenLabsClient({
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
// CHAT API ENDPOINT
// ======================
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, userId, levelId, userMessage } = req.body;

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
    `;

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0].message.content;

    // Calculate scores (simplified scoring)
    const scores = {
      relevance: Math.floor(70 + Math.random() * 30),
      turnTaking: Math.floor(70 + Math.random() * 30),
      emotional: Math.floor(70 + Math.random() * 30),
      clarity: Math.floor(70 + Math.random() * 30),
    };
    const overallScore = Math.floor((scores.relevance + scores.turnTaking + scores.emotional + scores.clarity) / 4);

    // Generate feedback
    let feedback = '';
    if (overallScore >= 90) {
      feedback = "Outstanding work! You're a communication superstar! 🌟";
    } else if (overallScore >= 80) {
      feedback = "Great job! You're communicating very well!";
    } else if (overallScore >= 70) {
      feedback = "Good work! You're improving!";
    } else {
      feedback = "Keep practicing! Every conversation helps you get better!";
    }

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
      birdCharacter: level.bird_character,
      tone: shouldEnd ? 'congratulatory' : 'encouraging',
      shouldEnd,
      score: overallScore,
      feedback,
      scores,
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

    // Generate audio using ElevenLabs
    const audioStream = await elevenlabs.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_monolingual_v1',
    });

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const fileName = `${birdCharacter}_${timestamp}.mp3`;
    const filePath = conversationId 
      ? `audio/conversations/${conversationId}/${fileName}`
      : `audio/bird_messages/${fileName}`;

    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/mpeg',
      },
    });

    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    res.json({ audioUrl: publicUrl });
  } catch (error) {
    console.error('TTS API error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
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