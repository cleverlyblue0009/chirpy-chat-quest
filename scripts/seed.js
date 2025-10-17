import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed data
const seedData = {
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

  levels: [
    // Forest Explorer Path (Beginner)
    {
      id: 'level_1',
      path_id: 'forest_explorer',
      level_number: 1,
      name: 'Hello, Friend!',
      description: 'Learn to greet others and say hello',
      bird_character: 'ruby_robin',
      xp_reward: 50,
      unlock_requirement: 0,
      conversation_topics: ['greetings', 'introductions'],
      objectives: ['Say hello appropriately', 'Introduce yourself', 'Make eye contact']
    },
    {
      id: 'level_2',
      path_id: 'forest_explorer',
      level_number: 2,
      name: 'Nice to Meet You',
      description: 'Practice introducing yourself to new friends',
      bird_character: 'ruby_robin',
      xp_reward: 75,
      unlock_requirement: 50,
      conversation_topics: ['introductions', 'personal_info'],
      objectives: ['Share your name', 'Ask for others\' names', 'Say "nice to meet you"']
    },
    {
      id: 'level_3',
      path_id: 'forest_explorer',
      level_number: 3,
      name: 'How Are You?',
      description: 'Learn to ask and answer about feelings',
      bird_character: 'sage_owl',
      xp_reward: 100,
      unlock_requirement: 125,
      conversation_topics: ['emotions', 'feelings'],
      objectives: ['Ask "How are you?"', 'Answer about your feelings', 'Recognize basic emotions']
    },
    {
      id: 'level_4',
      path_id: 'forest_explorer',
      level_number: 4,
      name: 'Please and Thank You',
      description: 'Master polite words and manners',
      bird_character: 'ruby_robin',
      xp_reward: 125,
      unlock_requirement: 225,
      conversation_topics: ['manners', 'politeness'],
      objectives: ['Use "please" when asking', 'Say "thank you"', 'Use "excuse me"']
    },
    
    // Tree Climber Path (Intermediate)
    {
      id: 'level_5',
      path_id: 'tree_climber',
      level_number: 5,
      name: 'Taking Turns',
      description: 'Master the art of conversation turn-taking',
      bird_character: 'charlie_sparrow',
      xp_reward: 150,
      unlock_requirement: 350,
      conversation_topics: ['turn_taking', 'conversations'],
      objectives: ['Wait for your turn', 'Know when to speak', 'Listen actively']
    },
    {
      id: 'level_6',
      path_id: 'tree_climber',
      level_number: 6,
      name: 'Active Listening',
      description: 'Learn to listen and respond appropriately',
      bird_character: 'harmony_hawk',
      xp_reward: 175,
      unlock_requirement: 500,
      conversation_topics: ['listening', 'responding'],
      objectives: ['Show you\'re listening', 'Ask follow-up questions', 'Remember what was said']
    },
    {
      id: 'level_7',
      path_id: 'tree_climber',
      level_number: 7,
      name: 'Sharing Stories',
      description: 'Practice telling stories and experiences',
      bird_character: 'luna_lark',
      xp_reward: 200,
      unlock_requirement: 675,
      conversation_topics: ['storytelling', 'experiences'],
      objectives: ['Tell a simple story', 'Share experiences', 'Stay on topic']
    },
    {
      id: 'level_8',
      path_id: 'tree_climber',
      level_number: 8,
      name: 'Expressing Feelings',
      description: 'Learn to express emotions clearly',
      bird_character: 'melody_mockingbird',
      xp_reward: 225,
      unlock_requirement: 875,
      conversation_topics: ['emotions', 'expression'],
      objectives: ['Name your emotions', 'Express feelings appropriately', 'Use emotion words']
    },
    
    // Sky Soarer Path (Advanced)
    {
      id: 'level_9',
      path_id: 'sky_soarer',
      level_number: 9,
      name: 'Making Friends',
      description: 'Build friendship through conversation',
      bird_character: 'luna_lark',
      xp_reward: 250,
      unlock_requirement: 1100,
      conversation_topics: ['friendship', 'connection'],
      objectives: ['Start conversations', 'Find common interests', 'Be a good friend']
    },
    {
      id: 'level_10',
      path_id: 'sky_soarer',
      level_number: 10,
      name: 'Problem Solving',
      description: 'Resolve conflicts through communication',
      bird_character: 'wisdom_woodpecker',
      xp_reward: 275,
      unlock_requirement: 1350,
      conversation_topics: ['problem_solving', 'conflict_resolution'],
      objectives: ['Express disagreement calmly', 'Find solutions', 'Apologize when needed']
    },
    {
      id: 'level_11',
      path_id: 'sky_soarer',
      level_number: 11,
      name: 'Empathy Explorer',
      description: 'Understand and share others\' feelings',
      bird_character: 'phoenix_finch',
      xp_reward: 300,
      unlock_requirement: 1625,
      conversation_topics: ['empathy', 'understanding'],
      objectives: ['Recognize others\' emotions', 'Show you understand', 'Offer comfort']
    },
    {
      id: 'level_12',
      path_id: 'sky_soarer',
      level_number: 12,
      name: 'Conversation Master',
      description: 'Master all aspects of communication',
      bird_character: 'phoenix_finch',
      xp_reward: 350,
      unlock_requirement: 1925,
      conversation_topics: ['mastery', 'advanced_communication'],
      objectives: ['Lead conversations', 'Adapt to different people', 'Communicate confidently']
    }
  ],

  skills: {
    greeting: {
      name: 'Greeting',
      description: 'Ability to greet others appropriately',
      category: 'Social Interaction',
      icon: '👋',
      color: '#10B981'
    },
    turn_taking: {
      name: 'Turn Taking',
      description: 'Understanding when to speak and when to listen',
      category: 'Communication',
      icon: '🔄',
      color: '#3B82F6'
    },
    emotion_recognition: {
      name: 'Emotion Recognition',
      description: 'Identifying emotions in others',
      category: 'Emotional Intelligence',
      icon: '😊',
      color: '#F59E0B'
    },
    listening: {
      name: 'Listening',
      description: 'Active listening and comprehension',
      category: 'Communication',
      icon: '👂',
      color: '#8B5CF6'
    },
    expression: {
      name: 'Expression',
      description: 'Expressing thoughts and feelings clearly',
      category: 'Communication',
      icon: '💬',
      color: '#EF4444'
    },
    empathy: {
      name: 'Empathy',
      description: 'Understanding and sharing feelings of others',
      category: 'Emotional Intelligence',
      icon: '❤️',
      color: '#EC4899'
    },
    focus: {
      name: 'Focus',
      description: 'Maintaining attention during conversations',
      category: 'Cognitive Skills',
      icon: '🎯',
      color: '#6366F1'
    }
  },

  achievements: [
    {
      id: 'first_flight',
      name: 'First Flight',
      description: 'Complete your first conversation',
      icon: '🎯',
      unlock_criteria: { type: 'conversations_completed', value: 1 },
      xp_reward: 50
    },
    {
      id: 'chat_champion',
      name: 'Chat Champion',
      description: 'Complete 10 conversations',
      icon: '💬',
      unlock_criteria: { type: 'conversations_completed', value: 10 },
      xp_reward: 100
    },
    {
      id: 'three_day_streak',
      name: '3 Day Streak',
      description: 'Practice for 3 days in a row',
      icon: '🔥',
      unlock_criteria: { type: 'streak_days', value: 3 },
      xp_reward: 75
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '⚡',
      unlock_criteria: { type: 'streak_days', value: 7 },
      xp_reward: 150
    },
    {
      id: 'bird_collector',
      name: 'Bird Collector',
      description: 'Unlock 3 bird characters',
      icon: '🦜',
      unlock_criteria: { type: 'birds_unlocked', value: 3 },
      xp_reward: 100
    },
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% on any conversation',
      icon: '💯',
      unlock_criteria: { type: 'perfect_score', value: 100 },
      xp_reward: 200
    },
    {
      id: 'level_up',
      name: 'Level Up',
      description: 'Complete 5 levels',
      icon: '📈',
      unlock_criteria: { type: 'levels_completed', value: 5 },
      xp_reward: 150
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Complete all Forest Explorer levels',
      icon: '🦋',
      unlock_criteria: { type: 'path_completed', value: 'forest_explorer' },
      xp_reward: 300
    },
    {
      id: 'empathy_expert',
      name: 'Empathy Expert',
      description: 'Master the empathy skill',
      icon: '💖',
      unlock_criteria: { type: 'skill_mastery', value: 'empathy' },
      xp_reward: 250
    },
    {
      id: 'communication_master',
      name: 'Communication Master',
      description: 'Complete all levels',
      icon: '🏆',
      unlock_criteria: { type: 'all_levels_completed', value: true },
      xp_reward: 500
    }
  ],

  assessment_questions: [
    {
      id: 'q1',
      type: 'voice',
      content: 'Say hello and tell me your name',
      instructions: 'Click the microphone and introduce yourself',
      scoring_rules: [
        { skill: 'greeting', weight: 40 },
        { skill: 'expression', weight: 30 }
      ]
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      content: 'What do you say when you meet someone new?',
      options: ['Goodbye', 'Nice to meet you', 'See you later', 'Go away'],
      correct_answer: 'Nice to meet you',
      scoring_rules: [
        { skill: 'greeting', weight: 40 },
        { skill: 'turn_taking', weight: 20 }
      ]
    },
    {
      id: 'q3',
      type: 'emotion_recognition',
      content: 'How does this person feel? 😊',
      options: ['Happy', 'Sad', 'Angry', 'Scared'],
      correct_answer: 'Happy',
      scoring_rules: [
        { skill: 'emotion_recognition', weight: 50 }
      ]
    },
    {
      id: 'q4',
      type: 'voice',
      content: 'Someone says "How are you?" What do you say back?',
      instructions: 'Click the microphone and respond',
      scoring_rules: [
        { skill: 'turn_taking', weight: 30 },
        { skill: 'listening', weight: 30 }
      ]
    },
    {
      id: 'q5',
      type: 'ordering',
      content: 'Put these conversation steps in order',
      options: ['Say goodbye', 'Say hello', 'Ask a question', 'Listen to answer'],
      correct_answer: ['Say hello', 'Ask a question', 'Listen to answer', 'Say goodbye'],
      scoring_rules: [
        { skill: 'turn_taking', weight: 30 },
        { skill: 'listening', weight: 30 }
      ]
    },
    {
      id: 'q6',
      type: 'multiple_choice',
      content: 'Your friend is crying. What should you do?',
      options: ['Laugh', 'Walk away', 'Ask if they\'re okay', 'Ignore them'],
      correct_answer: "Ask if they're okay",
      scoring_rules: [
        { skill: 'emotion_recognition', weight: 30 },
        { skill: 'empathy', weight: 40 }
      ]
    }
  ]
};

// Function to clear existing data
async function clearCollection(collectionName) {
  console.log(`Clearing ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// Function to seed a collection
async function seedCollection(collectionName, data) {
  console.log(`Seeding ${collectionName}...`);
  
  if (Array.isArray(data)) {
    // For arrays, use the id field if present, otherwise auto-generate
    for (const item of data) {
      const docId = item.id || doc(collection(db, collectionName)).id;
      const { id, ...docData } = item;
      await setDoc(doc(db, collectionName, docId), docData);
    }
  } else {
    // For objects, use the key as the document ID
    for (const [docId, docData] of Object.entries(data)) {
      await setDoc(doc(db, collectionName, docId), docData);
    }
  }
  
  console.log(`✓ ${collectionName} seeded successfully`);
}

// Main seeding function
async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const collections = [
      'bird_characters',
      'learning_paths',
      'levels',
      'skills',
      'achievements',
      'assessment_questions'
    ];

    for (const collectionName of collections) {
      await clearCollection(collectionName);
    }

    // Seed all collections
    await seedCollection('bird_characters', seedData.bird_characters);
    await seedCollection('learning_paths', seedData.learning_paths);
    await seedCollection('levels', seedData.levels);
    await seedCollection('skills', seedData.skills);
    await seedCollection('achievements', seedData.achievements);
    await seedCollection('assessment_questions', seedData.assessment_questions);

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seed();