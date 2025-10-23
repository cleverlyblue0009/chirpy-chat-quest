import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import elevenLabsModule from 'elevenlabs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { Readable } from 'stream';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
const publicPath = join(__dirname, '..', 'public');
app.use('/audio', express.static(join(publicPath, 'audio')));

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

// Initialize Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
// Helper function to build adaptive instructions based on emotion context
function buildAdaptiveInstructions(emotionContext) {
  if (!emotionContext) {
    return "The child is engaged and ready to learn.";
  }
  
  let instructions = [];
  
  // Detect struggling
  if (emotionContext.isStruggling) {
    instructions.push("⚠️ CHILD IS STRUGGLING:");
    instructions.push("- Simplify your next response dramatically");
    instructions.push("- Use only 1 short sentence");
    instructions.push("- Offer a specific, easy example");
    instructions.push("- Ask if they want help");
  }
  
  // Low engagement
  if (emotionContext.engagementLevel === 'low') {
    instructions.push("⚠️ LOW ENGAGEMENT:");
    instructions.push("- Make response more exciting and playful");
    instructions.push("- Use their name");
    instructions.push("- Add an element of fun or surprise");
  }
  
  // Not looking at screen
  if (!emotionContext.isLookingAtScreen || emotionContext.lookAwayCount >= 3) {
    instructions.push("⚠️ ATTENTION DRIFT:");
    instructions.push("- Child may be overwhelmed or distracted");
    instructions.push("- Keep next response VERY short (1 sentence)");
    instructions.push("- Offer a break option");
    instructions.push("- Use calming, gentle tone");
  }
  
  // Frustrated or upset
  if (['angry', 'sad', 'fearful', 'disgusted'].includes(emotionContext.currentEmotion)) {
    instructions.push("⚠️ EMOTIONAL DISTRESS:");
    instructions.push("- Validate their feelings explicitly");
    instructions.push("- Reassure them it's okay to struggle");
    instructions.push("- Offer to try something easier");
    instructions.push("- Use soothing language");
  }
  
  // Confused
  if (emotionContext.currentEmotion === 'surprised' || emotionContext.needsSimplification) {
    instructions.push("⚠️ CONFUSION DETECTED:");
    instructions.push("- Break down the previous concept");
    instructions.push("- Give a concrete example");
    instructions.push("- Use simpler words");
  }
  
  // Taking long to respond
  if (emotionContext.processingTime > 10000) { // 10+ seconds
    instructions.push("ℹ️ SLOW PROCESSING:");
    instructions.push("- Child needs more time");
    instructions.push("- Don't rush them");
    instructions.push("- Acknowledge they're thinking");
    instructions.push("- Provide encouragement to take their time");
  }
  
  // High engagement - doing great!
  if (emotionContext.engagementLevel === 'high' && 
      emotionContext.currentEmotion === 'happy') {
    instructions.push("✅ EXCELLENT ENGAGEMENT:");
    instructions.push("- Child is confident and engaged");
    instructions.push("- You can maintain current difficulty");
    instructions.push("- Celebrate their success enthusiastically");
  }
  
  if (instructions.length === 0) {
    return "The child appears calm and ready. Proceed normally.";
  }
  
  return instructions.join('\n');
}

// Helper function to enforce autism-friendly response format
function enforceAutismFriendlyFormat(response) {
  // Split into sentences
  let sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
  
  // Remove any sentences beyond 2
  if (sentences.length > 2) {
    sentences = sentences.slice(0, 2);
  }
  
  // If sentences are too long, simplify
  sentences = sentences.map(sentence => {
    sentence = sentence.trim();
    
    // If sentence is over 15 words, try to simplify
    const words = sentence.split(/\s+/);
    if (words.length > 15) {
      // Take first clause only
      const firstClause = sentence.split(/,|;/)[0];
      return firstClause + (firstClause.endsWith('.') || firstClause.endsWith('!') || firstClause.endsWith('?') ? '' : '.');
    }
    
    return sentence;
  });
  
  return sentences.join(' ').trim();
}

// Helper function to ensure friendly tone
function ensureFriendlyTone(response, birdName) {
  // Add warmth if response feels clinical
  const warmWords = ['great', 'wonderful', 'awesome', 'nice', 'good'];
  const hasWarmth = warmWords.some(word => response.toLowerCase().includes(word));
  
  if (!hasWarmth && Math.random() > 0.5) {
    // Add encouraging prefix
    const encouragements = [
      "You're doing great! ",
      "Wonderful! ",
      "I love that! ",
      "Nice work! ",
      "Awesome! "
    ];
    response = encouragements[Math.floor(Math.random() * encouragements.length)] + response;
  }
  
  return response;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, userId, levelId, userMessage, systemPrompt, analysisData, emotionContext } = req.body;

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
    
    // Build conversation context for Gemini
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Determine if conversation should end
    const exchangeCount = conversation.messages.filter(m => m.sender === 'user').length;
    const shouldEnd = exchangeCount >= 5;

    // Build adaptive instructions based on emotion context
    const adaptiveInstructions = buildAdaptiveInstructions(emotionContext);

    // Use provided system prompt or create enhanced default
    const enhancedSystemPrompt = systemPrompt || `
      You are ${birdCharacter.name}, ${birdCharacter.personality}.

      ${birdCharacter.system_prompt}

      Current lesson: ${level.name} - ${level.description}

      ${adaptiveInstructions}

      CORE RULES FOR AUTISM-FRIENDLY COMMUNICATION:
      1. **BREVITY**: Keep responses SHORT - 1-2 sentences maximum
      2. **CLARITY**: Use simple, concrete words - no metaphors or idioms
      3. **DIRECTNESS**: Say exactly what you mean - no hints or implications
      4. **POSITIVE**: Always encouraging, never critical
      5. **PREDICTABLE**: Follow a consistent pattern in responses
      6. **PATIENT**: Never rush, always supportive

      RESPONSE FORMULA (follow strictly):
      - ONE sentence validating their response
      - ONE sentence guiding them to next step OR asking follow-up
      - TOTAL: Maximum 2 sentences, use periods not commas

      EXAMPLES OF PERFECT RESPONSES:
      "Great job saying hi! Now try adding your name, like 'Hi, I'm [name].'"
      "I can see you're thinking hard! Take your time and try when you're ready."
      "You said that clearly! Can you say it again with a smile?"

      NEVER DO THIS:
      ❌ Long explanations
      ❌ Multiple questions at once
      ❌ Complex instructions
      ❌ Vague feedback like "good job" without specifics

      ${shouldEnd ? 'Wrap up in ONE warm sentence thanking them.' : ''}
    `;

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8, // Slightly higher for more complete responses
        maxOutputTokens: 200, // Increased to ensure complete responses
        topP: 0.95,
        topK: 40,
        stopSequences: [], // Don't use stop sequences that might cut off responses
      }
    });

    // Create chat history for Gemini including system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "System Instructions: " + enhancedSystemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I will follow these instructions and help the child practice their communication skills in an autism-aware way." }],
        },
        ...conversationHistory
      ],
    });

    // Helper function to validate response completeness
    const validateResponse = (response) => {
      // Check for incomplete response patterns
      const incompletePatterns = [
        /^(yes|sure|okay|alright),?\s*(i can help|let me help|i'll help)/i,
        /^(yes|sure|okay|of course)[,.!]?\s*$/i, // Very short yes responses
        /can help you with that\.?$/i,
        /let me (help|assist) you\.?$/i,
        /^(i (will|would|can))[,.!]?\s*$/i,
        /^(certainly|definitely|absolutely)[,.!]?\s*$/i
      ];
      
      const isIncomplete = incompletePatterns.some(pattern => pattern.test(response.trim()));
      const sentences = response.trim().split(/[.!?]/).filter(s => s.trim().length > 3);
      const isTooShort = sentences.length < 2;
      
      return !isIncomplete && !isTooShort;
    };
    
    // Helper function to get contextual guidance
    const getContextualGuidance = () => {
      const topicGuidance = {
        'greeting': "You can wave and say 'Hi!' or 'Hello!' with a smile. That's a great way to greet someone! Would you like to try?",
        'introduction': "You can say 'My name is [your name]' and ask 'What's your name?' That helps you get to know someone! Want to practice?",
        'turn-taking': "In conversations, we take turns - you speak, then I speak, then you speak again. It's like playing catch! Ready to try?",
        'emotion': "You can share how you feel by saying 'I feel happy' or 'I feel excited!' How are you feeling right now?",
      };
      
      // Check which topic applies based on level conversation topics
      for (const [topic, guidance] of Object.entries(topicGuidance)) {
        if (level.conversation_topics?.some(t => t.toLowerCase().includes(topic))) {
          return guidance;
        }
      }
      
      return "Keep practicing - you're doing great! Every conversation helps you learn. What would you like to talk about?";
    };

    // Generate response using Gemini
    let result = await chat.sendMessage(userMessage);
    let aiResponse = result.response.text();
    
    // Enforce autism-friendly format (1-2 sentences maximum)
    aiResponse = enforceAutismFriendlyFormat(aiResponse);
    
    // Ensure friendly tone
    aiResponse = ensureFriendlyTone(aiResponse, birdCharacter.name);
    
    console.log('✅ Final Gemini response:', aiResponse);

    // Calculate autism-aware scores (always encouraging)
    const scores = {
      relevance: analysisData?.content_relevance || Math.floor(65 + Math.random() * 35),
      turnTaking: analysisData?.turn_appropriate !== false ? Math.floor(75 + Math.random() * 25) : 70,
      emotional: analysisData?.emotional_content?.length > 0 ? 90 : Math.floor(70 + Math.random() * 30),
      clarity: Math.floor(70 + Math.random() * 30),
      engagement: emotionContext?.engagementLevel === 'high' ? 95 : 
                  emotionContext?.engagementLevel === 'low' ? 65 :
                  analysisData?.engagement_level === 'high' ? 95 : 
                  analysisData?.engagement_level === 'low' ? 65 : 80,
      skillDemonstration: analysisData?.strategy_used?.length ? analysisData.strategy_used.length * 20 : 70,
      // Add emotion-based bonus for trying despite struggles
      effortBonus: emotionContext?.needsSupport ? 15 : 0
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
    
    console.log('Generating speech for text:', text.substring(0, 50) + '...');
    console.log('Using voice ID:', voiceId);

    try {
      // Generate audio using ElevenLabs
      const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
        text: text,
        model_id: 'eleven_monolingual_v1',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      });

      // Convert the readable stream to a buffer
      const chunks = [];
      for await (const chunk of Readable.from(audioStream)) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);
      
      // Create public audio directory if it doesn't exist
      const publicDir = join(__dirname, '..', 'public', 'audio');
      await fsPromises.mkdir(publicDir, { recursive: true });
      
      // Save audio file locally
      const timestamp = Date.now();
      const fileName = `${birdCharacter}_${timestamp}.mp3`;
      const filePath = join(publicDir, fileName);
      
      await fsPromises.writeFile(filePath, audioBuffer);
      
      // Return the URL to access the audio file
      const audioUrl = `/audio/${fileName}`;
      
      console.log('Audio generated successfully:', audioUrl);
      res.json({ audioUrl });
      
    } catch (elevenLabsError) {
      console.error('ElevenLabs API error:', elevenLabsError);
      
      // Fallback: Use browser's text-to-speech as a backup
      // Return a special marker that tells the frontend to use browser TTS
      res.json({ 
        audioUrl: null, 
        useBrowserTTS: true,
        text: text 
      });
    }
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

    // Note: This endpoint is not currently used by the frontend
    // The app uses Web Speech API directly in the browser for better real-time performance
    // This endpoint is kept for potential future use with Deepgram/Google Speech-to-Text
    
    // If we were to implement this, we would:
    // 1. Download the audio from the URL
    // 2. Send it to Deepgram API using the configured DEEPGRAM_API_KEY
    // 3. Return the actual transcription
    
    // For now, return an error indicating this endpoint is not implemented
    res.status(501).json({ 
      error: 'Speech-to-text endpoint not implemented',
      message: 'The application uses Web Speech API in the browser instead',
      alternative: 'Use the browser\'s built-in speech recognition'
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