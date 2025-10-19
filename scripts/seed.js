import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

// Validate credentials
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('❌ Missing Firebase Admin credentials in server/.env');
  console.error('Required variables:');
  console.error('  - FIREBASE_ADMIN_PROJECT_ID');
  console.error('  - FIREBASE_ADMIN_PRIVATE_KEY');
  console.error('  - FIREBASE_ADMIN_CLIENT_EMAIL');
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = getFirestore();

// Your seed data (keep the same)
const seedData = {
  // 🐦 Bird characters
  bird_characters: {
    ruby_robin: {
      name: 'Ruby Robin',
      personality: 'Warm, friendly, patient',
      system_prompt: `You are Ruby Robin, a warm and friendly bird who helps children learn to greet others. 
        You are patient, encouraging, and speak in simple, clear sentences. Your goal is to make the child 
        feel comfortable with basic greetings and introductions. Always be positive and celebrate small wins. 
        Keep responses short (2-3 sentences max).`,
      specialties: ['greetings', 'introductions', 'first impressions'],
      emoji: '🐦',
      unlock_level: 0,
      image_url: '/images/birds/ruby_robin.png'
    },
    sage_owl: {
      name: 'Sage Owl',
      personality: 'Wise, thoughtful, understanding',
      system_prompt: `You are Sage Owl, a wise and thoughtful bird who helps children understand emotions. 
        You speak calmly and help children identify and express their feelings. You're patient and never rush. 
        You use simple examples and metaphors that children can understand. Keep responses short (2-3 sentences max).`,
      specialties: ['emotions', 'feelings', 'empathy'],
      emoji: '🦉',
      unlock_level: 3,
      image_url: '/images/birds/sage_owl.png'
    },
    charlie_sparrow: {
      name: 'Charlie Sparrow',
      personality: 'Energetic, playful, encouraging',
      system_prompt: `You are Charlie Sparrow, an energetic and playful bird who teaches turn-taking in conversations. 
        You're enthusiastic but know when to pause and listen. You make learning fun with games and activities. 
        Always encourage the child to share their thoughts. Keep responses short (2-3 sentences max).`,
      specialties: ['turn-taking', 'active listening', 'games'],
      emoji: '🦜',
      unlock_level: 5,
      image_url: '/images/birds/charlie_sparrow.png'
    },
    harmony_hawk: {
      name: 'Harmony Hawk',
      personality: 'Confident, supportive, inspiring',
      system_prompt: `You are Harmony Hawk, a confident bird who helps children express themselves clearly. 
        You're supportive and help build confidence in communication. You encourage children to speak up 
        and share their ideas. Always praise effort and progress. Keep responses short (2-3 sentences max).`,
      specialties: ['self-expression', 'confidence', 'clarity'],
      emoji: '🦅',
      unlock_level: 7,
      image_url: '/images/birds/harmony_hawk.png'
    },
    luna_lark: {
      name: 'Luna Lark',
      personality: 'Creative, imaginative, gentle',
      system_prompt: `You are Luna Lark, a creative bird who helps children with storytelling and imagination. 
        You're gentle and encourage creative expression. You help children build narratives and share experiences. 
        Always validate their creativity. Keep responses short (2-3 sentences max).`,
      specialties: ['storytelling', 'imagination', 'creativity'],
      emoji: '🕊️',
      unlock_level: 9,
      image_url: '/images/birds/luna_lark.png'
    },
    phoenix_finch: {
      name: 'Phoenix Finch',
      personality: 'Resilient, motivating, transformative',
      system_prompt: `You are Phoenix Finch, a resilient bird who helps children overcome communication challenges. 
        You're motivating and help children see mistakes as learning opportunities. You celebrate growth and 
        transformation. Always remind them how far they've come. Keep responses short (2-3 sentences max).`,
      specialties: ['resilience', 'growth mindset', 'problem-solving'],
      emoji: '🔥',
      unlock_level: 11,
      image_url: '/images/birds/phoenix_finch.png'
    },
    melody_mockingbird: {
      name: 'Melody Mockingbird',
      personality: 'Musical, expressive, joyful',
      system_prompt: `You are Melody Mockingbird, a musical bird who helps children with voice modulation and expression. 
        You teach them about tone, volume, and emotional expression through voice. You make learning fun with 
        songs and rhythms. Keep responses short (2-3 sentences max).`,
      specialties: ['voice modulation', 'tone', 'expression'],
      emoji: '🎵',
      unlock_level: 8,
      image_url: '/images/birds/melody_mockingbird.png'
    },
    wisdom_woodpecker: {
      name: 'Wisdom Woodpecker',
      personality: 'Persistent, focused, determined',
      system_prompt: `You are Wisdom Woodpecker, a persistent bird who helps children stay focused in conversations. 
        You teach them about attention, focus, and following through with thoughts. You celebrate persistence 
        and determination. Keep responses short (2-3 sentences max).`,
      specialties: ['focus', 'attention', 'persistence'],
      emoji: '🪶',
      unlock_level: 10,
      image_url: '/images/birds/wisdom_woodpecker.png'
    }
  },

  // 🌲 Learning paths
  learning_paths: {
    forest_explorer: {
      name: 'Forest Explorer',
      description: 'Begin your journey with basic greetings and introductions',
      difficulty_level: 'beginner',
      order: 1,
      color: '#10B981',
      icon: '🌳'
    },
    tree_climber: {
      name: 'Tree Climber',
      description: 'Build conversation skills and emotional understanding',
      difficulty_level: 'intermediate',
      order: 2,
      color: '#F59E0B',
      icon: '🌲'
    },
    sky_soarer: {
      name: 'Sky Soarer',
      description: 'Master complex social interactions and empathy',
      difficulty_level: 'advanced',
      order: 3,
      color: '#8B5CF6',
      icon: '☁️'
    }
  },

  // 🎯 Levels (array)
  levels: [
    {
      id: 'level_1',
      name: 'Level 1 - Greetings',
      description: 'Learn to say hello and introduce yourself.',
      xp_required: 0,
      difficulty: 'beginner'
    },
    {
      id: 'level_2',
      name: 'Level 2 - Emotions',
      description: 'Learn to identify and express your emotions.',
      xp_required: 100,
      difficulty: 'beginner'
    },
    {
      id: 'level_3',
      name: 'Level 3 - Conversations',
      description: 'Practice turn-taking and confidence in conversations.',
      xp_required: 300,
      difficulty: 'intermediate'
    }
  ],

  // 🧠 Skills (placeholder array)
  skills: [
    {
      id: 'skill_greetings',
      name: 'Basic Greetings',
      description: 'Learn how to say hello and introduce yourself.'
    },
    {
      id: 'skill_empathy',
      name: 'Understanding Emotions',
      description: 'Recognize and respond to others’ feelings.'
    }
  ],

  // 🏅 Achievements (placeholder array)
  achievements: [
    {
      id: 'ach_first_chat',
      name: 'First Conversation!',
      description: 'Completed your first chat with a bird guide.',
      icon: '✨'
    },
    {
      id: 'ach_level_up',
      name: 'Level Up!',
      description: 'Reached a new communication level.',
      icon: '🏆'
    }
  ],

  // ❓ Assessment questions (placeholder array)
  assessment_questions: [
    {
      id: 'q1',
      question: 'What do you say when you meet someone new?',
      options: ['Goodbye', 'Hello!', 'No thanks'],
      correct_answer: 'Hello!'
    },
    {
      id: 'q2',
      question: 'What should you do when someone looks sad?',
      options: ['Ignore them', 'Ask if they are okay', 'Laugh'],
      correct_answer: 'Ask if they are okay'
    }
  ]
};

// Function to clear and seed collection
// Function to seed collection
// Function to seed collection with better error handling
async function seedCollection(collectionName, data) {
  console.log(`Seeding ${collectionName}...`);
  
  try {
    if (Array.isArray(data)) {
      // For arrays - validate and seed each item
      let successCount = 0;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // Check if item exists
        if (!item) {
          console.error(`  ⚠️  Item at index ${i} is undefined or null`);
          continue;
        }
        
        // Check if item has id
        if (!item.id) {
          console.error(`  ⚠️  Item at index ${i} missing id:`, JSON.stringify(item).substring(0, 100));
          continue;
        }
        
        // Extract id and create clean data object
        const { id, ...docData } = item;
        
        // Remove any undefined or null values
        const cleanData = Object.fromEntries(
          Object.entries(docData).filter(([_, v]) => v !== undefined && v !== null)
        );
        
        await db.collection(collectionName).doc(id).set(cleanData);
        successCount++;
      }
      console.log(`  ✅ Added ${successCount} documents to ${collectionName}`);
      
    } else if (typeof data === 'object' && data !== null) {
      // For objects - use keys as document IDs
      let successCount = 0;
      for (const [docId, docData] of Object.entries(data)) {
        
        // Check if data exists
        if (!docData) {
          console.error(`  ⚠️  Data for ${docId} is undefined or null`);
          continue;
        }
        
        // Remove any undefined or null values
        const cleanData = Object.fromEntries(
          Object.entries(docData).filter(([_, v]) => v !== undefined && v !== null)
        );
        
        await db.collection(collectionName).doc(docId).set(cleanData);
        successCount++;
      }
      console.log(`  ✅ Added ${successCount} documents to ${collectionName}`);
      
    } else {
      throw new Error(`Invalid data type for ${collectionName}: expected array or object`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error seeding ${collectionName}:`, error.message);
    throw error;
  }
}
async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Seed each collection (order matters for dependencies)
    await seedCollection('bird_characters', seedData.bird_characters);
    await seedCollection('learning_paths', seedData.learning_paths);
    await seedCollection('levels', seedData.levels); // This is an array
    await seedCollection('skills', seedData.skills);
    await seedCollection('achievements', seedData.achievements); // This is an array
    await seedCollection('assessment_questions', seedData.assessment_questions); // This is an array

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}
// Run the seeding
seed();