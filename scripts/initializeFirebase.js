#!/usr/bin/env node

/**
 * Firebase Initialization Script
 * This script sets up all the required collections and documents in Firestore
 * Run this after setting up your Firebase project
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Data to initialize
const BIRD_CHARACTERS = {
  ruby_robin: {
    name: "Ruby Robin",
    emoji: "🦜",
    personality: "Cheerful and encouraging",
    voice_style: "Warm and friendly",
    system_prompt: "You are Ruby Robin, a cheerful and encouraging bird who loves helping children practice conversations. Keep responses short, positive, and simple.",
    unlock_level: 0
  },
  sage_owl: {
    name: "Sage Owl",
    emoji: "🦉",
    personality: "Wise and patient",
    voice_style: "Calm and thoughtful",
    system_prompt: "You are Sage Owl, a wise and patient teacher who helps children learn at their own pace. Be gentle, understanding, and supportive.",
    unlock_level: 5
  },
  charlie_sparrow: {
    name: "Charlie Sparrow",
    emoji: "🐦",
    personality: "Playful and energetic",
    voice_style: "Upbeat and fun",
    system_prompt: "You are Charlie Sparrow, a playful friend who makes learning fun. Be enthusiastic but not overwhelming, and celebrate small victories.",
    unlock_level: 10
  },
  harmony_hawk: {
    name: "Harmony Hawk",
    emoji: "🦅",
    personality: "Confident and motivating",
    voice_style: "Strong and encouraging",
    system_prompt: "You are Harmony Hawk, a confident mentor who helps children build self-assurance in conversations. Be motivating and celebrate their courage.",
    unlock_level: 15
  }
};

const LEARNING_PATHS = {
  forest_explorer: {
    name: "Forest Explorer",
    description: "Begin your journey through the Friendship Forest",
    difficulty: "beginner",
    total_levels: 10,
    emoji: "🌲"
  },
  tree_climber: {
    name: "Tree Climber",
    description: "Climb higher and learn more complex conversations",
    difficulty: "intermediate",
    total_levels: 10,
    emoji: "🌳"
  },
  sky_soarer: {
    name: "Sky Soarer",
    description: "Soar through advanced social interactions",
    difficulty: "advanced",
    total_levels: 10,
    emoji: "☁️"
  }
};

const LEVELS = [
  {
    id: "level_1",
    name: "Hello, Friend!",
    description: "Learn to greet new friends",
    level_number: 1,
    path_id: "forest_explorer",
    bird_character: "ruby_robin",
    objectives: [
      "Practice saying hello",
      "Learn to introduce yourself",
      "Respond to greetings"
    ],
    conversation_topics: [
      "What's your name?",
      "How are you feeling today?",
      "Nice to meet you!"
    ],
    required_xp: 0,
    reward_xp: 100,
    status: "available"
  },
  {
    id: "level_2",
    name: "How Are You?",
    description: "Ask and answer about feelings",
    level_number: 2,
    path_id: "forest_explorer",
    bird_character: "sage_owl",
    objectives: [
      "Ask how someone is feeling",
      "Share your own feelings",
      "Recognize emotion words"
    ],
    conversation_topics: [
      "How are you today?",
      "I'm feeling happy/sad/excited",
      "What makes you feel better?"
    ],
    required_xp: 100,
    reward_xp: 150,
    status: "locked"
  },
  {
    id: "level_3",
    name: "My Favorite Things",
    description: "Share what you like and ask about others' interests",
    level_number: 3,
    path_id: "forest_explorer",
    bird_character: "charlie_sparrow",
    objectives: [
      "Talk about favorite activities",
      "Ask about others' interests",
      "Find common interests"
    ],
    conversation_topics: [
      "What do you like to do?",
      "My favorite game is...",
      "Do you like...?"
    ],
    required_xp: 250,
    reward_xp: 200,
    status: "locked"
  },
  {
    id: "level_4",
    name: "Please and Thank You",
    description: "Practice polite words and phrases",
    level_number: 4,
    path_id: "forest_explorer",
    bird_character: "ruby_robin",
    objectives: [
      "Use please when asking",
      "Say thank you appropriately",
      "Respond to thank you"
    ],
    conversation_topics: [
      "Can you please help me?",
      "Thank you for helping",
      "You're welcome!"
    ],
    required_xp: 450,
    reward_xp: 200,
    status: "locked"
  },
  {
    id: "level_5",
    name: "Making Plans",
    description: "Learn to suggest and agree on activities",
    level_number: 5,
    path_id: "forest_explorer",
    bird_character: "harmony_hawk",
    objectives: [
      "Suggest activities",
      "Agree or disagree politely",
      "Make simple plans"
    ],
    conversation_topics: [
      "Do you want to play?",
      "Let's do something together",
      "That sounds fun!"
    ],
    required_xp: 650,
    reward_xp: 250,
    status: "locked"
  }
];

async function initializeCollections() {
  console.log('\n🔥 Starting Firebase initialization...\n');
  
  try {
    // Initialize Bird Characters
    console.log('📝 Creating bird characters...');
    for (const [id, data] of Object.entries(BIRD_CHARACTERS)) {
      await setDoc(doc(db, 'bird_characters', id), data);
      console.log(`   ✅ Created bird: ${data.name}`);
    }
    
    // Initialize Learning Paths
    console.log('\n📝 Creating learning paths...');
    for (const [id, data] of Object.entries(LEARNING_PATHS)) {
      await setDoc(doc(db, 'learning_paths', id), data);
      console.log(`   ✅ Created path: ${data.name}`);
    }
    
    // Initialize Levels
    console.log('\n📝 Creating levels...');
    for (const level of LEVELS) {
      const { id, ...data } = level;
      await setDoc(doc(db, 'levels', id), data);
      console.log(`   ✅ Created level: ${data.name}`);
    }
    
    // Create a test user (optional)
    console.log('\n👤 Creating test user...');
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'test@chirp.app', 
        'testpassword123'
      );
      
      // Create user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: 'test@chirp.app',
        display_name: 'Test User',
        created_at: Timestamp.now(),
        current_level_id: 'level_1',
        learning_path: 'forest_explorer',
        total_xp: 0,
        achievements: [],
        skills: {
          greeting: 0,
          turn_taking: 0,
          emotion_recognition: 0,
          listening: 0,
          expression: 0
        }
      });
      
      console.log('   ✅ Created test user: test@chirp.app (password: testpassword123)');
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('   ℹ️ Test user already exists');
      } else {
        console.log('   ⚠️ Could not create test user:', authError.message);
      }
    }
    
    // Verify data
    console.log('\n🔍 Verifying data...');
    
    const birdCharsSnapshot = await getDocs(collection(db, 'bird_characters'));
    console.log(`   ✅ Bird characters: ${birdCharsSnapshot.size} documents`);
    
    const pathsSnapshot = await getDocs(collection(db, 'learning_paths'));
    console.log(`   ✅ Learning paths: ${pathsSnapshot.size} documents`);
    
    const levelsSnapshot = await getDocs(collection(db, 'levels'));
    console.log(`   ✅ Levels: ${levelsSnapshot.size} documents`);
    
    console.log('\n✨ Firebase initialization complete!');
    console.log('\n📌 Next steps:');
    console.log('   1. Start the backend: cd server && PORT=3001 npm start');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Open http://localhost:8080');
    console.log('   4. Log in with test@chirp.app / testpassword123');
    console.log('\n🎉 Your Firebase is ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check your .env file has correct Firebase credentials');
    console.error('   2. Ensure Firestore is enabled in Firebase Console');
    console.error('   3. Check that your project ID matches');
    console.error('   4. Verify Authentication is enabled for Email/Password');
  }
  
  process.exit(0);
}

// Run the initialization
initializeCollections();