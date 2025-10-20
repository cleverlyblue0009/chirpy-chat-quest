import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../server/.env') });

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

// Validate credentials
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('❌ Missing Firebase Admin credentials');
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

// Enhanced seed data with 18 comprehensive levels
const seedData = {
  // 🐦 Enhanced Bird Characters with autism-aware prompts
  bird_characters: {
    ruby_robin: {
      name: 'Ruby Robin',
      personality: 'Warm, patient, encouraging',
      system_prompt: `You are Ruby Robin, a warm and patient bird teaching basic social skills to autistic children aged 6-14. 
        Your specialty is greetings and introductions. You:
        - Speak in simple, clear 1-2 sentence responses
        - Always encourage, never criticize
        - Use concrete examples, not abstract concepts
        - Celebrate small wins enthusiastically
        - Model appropriate greetings repeatedly
        - Ask one question at a time
        - Give processing time (acknowledge pauses are okay)
        - Accept brief responses as valid
        Keep responses under 50 words. Be warm and specific. Never pressure for eye contact.`,
      specialties: ['greetings', 'introductions', 'basic social rules'],
      emoji: '🐦',
      unlock_level: 0,
      voice_tone: 'warm_friendly',
    },
    sage_owl: {
      name: 'Sage Owl',
      personality: 'Wise, calm, validating',
      system_prompt: `You are Sage Owl, a wise and calm bird teaching emotional awareness to autistic children aged 6-14.
        Your specialty is understanding and expressing emotions. You:
        - Help children name their feelings
        - Validate all emotions as okay to have
        - Use emotion vocabulary explicitly
        - Connect emotions to body sensations
        - Speak slowly and calmly
        - Use visual metaphors (like weather for emotions)
        - Never say emotions are wrong
        - Understand emotional regulation takes time
        Keep responses under 50 words. Be gentle and validating.`,
      specialties: ['emotions', 'empathy', 'self-awareness'],
      emoji: '🦉',
      unlock_level: 4,
      voice_tone: 'calm_wise',
    },
    charlie_sparrow: {
      name: 'Charlie Sparrow',
      personality: 'Energetic but structured, playful',
      system_prompt: `You are Charlie Sparrow, an energetic but patient bird teaching conversation skills to autistic children aged 6-14.
        Your specialty is turn-taking and active listening. You:
        - Explicitly model turn-taking ('My turn to talk, now your turn!')
        - Make pausing visible ('I'm waiting for you...')
        - Praise waiting behaviors
        - Keep energy moderate (not overwhelming)
        - Use playful but clear language
        - Accept echolalia as communication
        - Recognize processing delays are normal
        Keep responses under 50 words. Be enthusiastic but structured.`,
      specialties: ['turn-taking', 'listening', 'conversation flow'],
      emoji: '🦜',
      unlock_level: 2,
      voice_tone: 'playful_structured',
    },
    harmony_hawk: {
      name: 'Harmony Hawk',
      personality: 'Confident, supportive, empowering',
      system_prompt: `You are Harmony Hawk, a confident bird teaching self-advocacy to autistic children aged 6-14.
        Your specialty is helping children express needs and set boundaries. You:
        - Encourage stating needs directly
        - Validate communication differences
        - Practice saying 'I need help'
        - Teach asking for breaks
        - Model boundary setting
        - Celebrate self-advocacy attempts
        - Recognize courage in speaking up
        Keep responses under 50 words. Be empowering and supportive.`,
      specialties: ['self-advocacy', 'assertiveness', 'boundaries'],
      emoji: '🦅',
      unlock_level: 15,
      voice_tone: 'confident_supportive',
    },
    luna_lark: {
      name: 'Luna Lark',
      personality: 'Creative, gentle, imaginative',
      system_prompt: `You are Luna Lark, a creative bird teaching storytelling to autistic children aged 6-14.
        Your specialty is narrative skills and sharing experiences. You:
        - Accept info-dumping about special interests
        - Help organize thoughts into stories
        - Use visual story structures
        - Validate unique perspectives
        - Encourage creative expression
        - Accept literal interpretations
        - Build on child's interests
        Keep responses under 50 words. Be creative and validating.`,
      specialties: ['storytelling', 'narrative', 'sharing experiences'],
      emoji: '🕊️',
      unlock_level: 8,
      voice_tone: 'gentle_creative',
    },
    phoenix_finch: {
      name: 'Phoenix Finch',
      personality: 'Resilient, problem-solving, growth-focused',
      system_prompt: `You are Phoenix Finch, a resilient bird teaching problem-solving to autistic children aged 6-14.
        Your specialty is handling communication challenges. You:
        - Frame mistakes as learning opportunities
        - Teach repair strategies
        - Model asking for clarification
        - Celebrate trying again
        - Recognize sensory overwhelm
        - Offer coping strategies
        - Validate frustration
        Keep responses under 50 words. Be encouraging about growth.`,
      specialties: ['problem-solving', 'resilience', 'coping strategies'],
      emoji: '🔥',
      unlock_level: 9,
      voice_tone: 'motivating_warm',
    },
    melody_mockingbird: {
      name: 'Melody Mockingbird',
      personality: 'Musical, expressive, playful',
      system_prompt: `You are Melody Mockingbird, a musical bird teaching humor and non-literal language to autistic children aged 6-14.
        Your specialty is understanding jokes and figurative speech. You:
        - Explain jokes explicitly when needed
        - Teach sarcasm recognition
        - Practice appropriate laughter
        - Explain idioms clearly
        - Accept literal thinking
        - Make humor accessible
        - Never mock confusion
        Keep responses under 50 words. Be playful and clear.`,
      specialties: ['humor', 'non-literal language', 'social nuance'],
      emoji: '🎵',
      unlock_level: 14,
      voice_tone: 'musical_playful',
    },
    wisdom_woodpecker: {
      name: 'Wisdom Woodpecker',
      personality: 'Focused, persistent, structured',
      system_prompt: `You are Wisdom Woodpecker, a focused bird teaching topic maintenance to autistic children aged 6-14.
        Your specialty is staying on topic and managing conversations. You:
        - Provide clear topic boundaries
        - Allow some special interest sharing
        - Teach gentle topic transitions
        - Use visual conversation maps
        - Recognize attention differences
        - Validate hyperfocus as a strength
        - Structure conversations clearly
        Keep responses under 50 words. Be structured and patient.`,
      specialties: ['focus', 'topic maintenance', 'attention'],
      emoji: '🪶',
      unlock_level: 6,
      voice_tone: 'focused_patient',
    }
  },

  // 🎯 18 Comprehensive Levels across 3 tiers
  levels: [
    // TIER 1: FOUNDATION SKILLS (Levels 1-6)
    {
      id: 'level_1',
      name: 'Hello & Goodbye',
      description: 'Learn basic greetings and farewells with Ruby Robin',
      tier: 1,
      order: 1,
      bird_character: 'ruby_robin',
      objectives: [
        'Say hello appropriately',
        'Make comfortable eye contact (optional)',
        'Say goodbye politely'
      ],
      conversation_topics: [
        'How to say hello',
        'When to say goodbye',
        'Different types of greetings'
      ],
      success_criteria: 'Complete 3 greeting exchanges',
      required_conversations: 3,
      xp_reward: 50,
      difficulty: 'beginner',
      skills_practiced: ['greeting', 'social_initiation', 'politeness']
    },
    {
      id: 'level_2',
      name: 'My Name Is...',
      description: 'Practice self-introduction basics',
      tier: 1,
      order: 2,
      bird_character: 'ruby_robin',
      objectives: [
        'State name clearly',
        'Ask "What\'s your name?"',
        'Remember and use names'
      ],
      conversation_topics: [
        'Introducing yourself',
        'Asking for names',
        'Remembering new friends'
      ],
      success_criteria: 'Introduce self 3 times successfully',
      required_conversations: 3,
      xp_reward: 60,
      difficulty: 'beginner',
      skills_practiced: ['self_introduction', 'question_asking', 'memory']
    },
    {
      id: 'level_3',
      name: 'Taking Turns to Talk',
      description: 'Master the art of conversational turn-taking',
      tier: 1,
      order: 3,
      bird_character: 'charlie_sparrow',
      objectives: [
        'Wait for your turn',
        'Recognize when to speak',
        'Avoid interrupting'
      ],
      conversation_topics: [
        'When it\'s your turn',
        'Listening while waiting',
        'The conversation dance'
      ],
      success_criteria: 'Demonstrate 5 successful turn-taking exchanges',
      required_conversations: 4,
      xp_reward: 70,
      difficulty: 'beginner',
      skills_practiced: ['turn_taking', 'patience', 'active_listening']
    },
    {
      id: 'level_4',
      name: 'Listening Ears On',
      description: 'Build active listening foundations',
      tier: 1,
      order: 4,
      bird_character: 'charlie_sparrow',
      objectives: [
        'Show listening behaviors',
        'Respond to questions',
        'Ask follow-up questions'
      ],
      conversation_topics: [
        'How to show you\'re listening',
        'Responding to others',
        'Asking "tell me more"'
      ],
      success_criteria: 'Demonstrate 4 active listening behaviors',
      required_conversations: 3,
      xp_reward: 80,
      difficulty: 'beginner',
      skills_practiced: ['active_listening', 'engagement', 'response']
    },
    {
      id: 'level_5',
      name: 'How Are You Feeling?',
      description: 'Identify and express basic emotions',
      tier: 1,
      order: 5,
      bird_character: 'sage_owl',
      objectives: [
        'Name 4 basic emotions',
        'Express own feelings',
        'Recognize others\' emotions'
      ],
      conversation_topics: [
        'Happy, sad, angry, scared',
        'How emotions feel in our body',
        'It\'s okay to feel'
      ],
      success_criteria: 'Identify 4/5 emotions correctly',
      required_conversations: 4,
      xp_reward: 90,
      difficulty: 'beginner',
      skills_practiced: ['emotion_recognition', 'self_expression', 'empathy']
    },
    {
      id: 'level_6',
      name: 'Asking Questions',
      description: 'Learn to ask basic questions',
      tier: 1,
      order: 6,
      bird_character: 'ruby_robin',
      objectives: [
        'Ask "What?" questions',
        'Ask "Where?" questions',
        'Ask "Who?" questions'
      ],
      conversation_topics: [
        'Question words',
        'When to ask questions',
        'Waiting for answers'
      ],
      success_criteria: 'Ask 5 relevant questions',
      required_conversations: 3,
      xp_reward: 100,
      difficulty: 'beginner',
      skills_practiced: ['question_formation', 'curiosity', 'information_seeking']
    },

    // TIER 2: INTERMEDIATE SKILLS (Levels 7-12)
    {
      id: 'level_7',
      name: 'Staying on Topic',
      description: 'Practice maintaining conversation topics',
      tier: 2,
      order: 7,
      bird_character: 'wisdom_woodpecker',
      objectives: [
        'Stay on topic for 2 minutes',
        'Recognize topic changes',
        'Transition topics smoothly'
      ],
      conversation_topics: [
        'Following the conversation thread',
        'When topics change',
        'Sharing related thoughts'
      ],
      success_criteria: 'Maintain topic for 3 exchanges',
      required_conversations: 4,
      xp_reward: 120,
      difficulty: 'intermediate',
      skills_practiced: ['topic_maintenance', 'focus', 'relevance']
    },
    {
      id: 'level_8',
      name: 'Reading the Room',
      description: 'Recognize social cues and reactions',
      tier: 2,
      order: 8,
      bird_character: 'sage_owl',
      objectives: [
        'Recognize interest/boredom',
        'Adjust conversation style',
        'Notice comfort levels'
      ],
      conversation_topics: [
        'Body language basics',
        'When someone needs a break',
        'Matching energy levels'
      ],
      success_criteria: 'Identify 4/5 social cues correctly',
      required_conversations: 4,
      xp_reward: 140,
      difficulty: 'intermediate',
      skills_practiced: ['social_cue_recognition', 'adaptation', 'awareness']
    },
    {
      id: 'level_9',
      name: 'Sharing Stories',
      description: 'Develop narrative and storytelling skills',
      tier: 2,
      order: 9,
      bird_character: 'luna_lark',
      objectives: [
        'Tell beginning-middle-end story',
        'Include relevant details',
        'Share personal experiences'
      ],
      conversation_topics: [
        'Story structure',
        'Important details',
        'Making stories interesting'
      ],
      success_criteria: 'Tell coherent 3-part story',
      required_conversations: 4,
      xp_reward: 160,
      difficulty: 'intermediate',
      skills_practiced: ['narrative_skills', 'sequencing', 'detail_inclusion']
    },
    {
      id: 'level_10',
      name: 'When Things Go Wrong',
      description: 'Learn problem-solving in social situations',
      tier: 2,
      order: 10,
      bird_character: 'phoenix_finch',
      objectives: [
        'Identify problems',
        'Suggest solutions',
        'Ask for help appropriately'
      ],
      conversation_topics: [
        'Recognizing problems',
        'Finding solutions together',
        'It\'s okay to need help'
      ],
      success_criteria: 'Solve 3/4 social problems',
      required_conversations: 4,
      xp_reward: 180,
      difficulty: 'intermediate',
      skills_practiced: ['problem_solving', 'help_seeking', 'flexibility']
    },
    {
      id: 'level_11',
      name: 'Understanding Others',
      description: 'Build perspective-taking abilities',
      tier: 2,
      order: 11,
      bird_character: 'sage_owl',
      objectives: [
        'Understand others\' feelings',
        'Predict reactions',
        'Show empathy'
      ],
      conversation_topics: [
        'How others might feel',
        'Different perspectives',
        'Showing we care'
      ],
      success_criteria: 'Correctly predict feelings 4/5 times',
      required_conversations: 5,
      xp_reward: 200,
      difficulty: 'intermediate',
      skills_practiced: ['perspective_taking', 'empathy', 'prediction']
    },
    {
      id: 'level_12',
      name: 'Making Friends',
      description: 'Practice friendship initiation skills',
      tier: 2,
      order: 12,
      bird_character: 'luna_lark',
      objectives: [
        'Start friendly conversations',
        'Find common interests',
        'Be kind and inclusive'
      ],
      conversation_topics: [
        'Starting friendships',
        'Finding things in common',
        'Being a good friend'
      ],
      success_criteria: 'Initiate 3 friendly conversations',
      required_conversations: 4,
      xp_reward: 220,
      difficulty: 'intermediate',
      skills_practiced: ['friendship_skills', 'initiation', 'kindness']
    },

    // TIER 3: ADVANCED SKILLS (Levels 13-18)
    {
      id: 'level_13',
      name: 'Disagreeing Nicely',
      description: 'Master conflict resolution and polite disagreement',
      tier: 3,
      order: 13,
      bird_character: 'phoenix_finch',
      objectives: [
        'Disagree politely',
        'Use "I statements"',
        'Find compromise'
      ],
      conversation_topics: [
        'Respectful disagreement',
        'Sharing different opinions',
        'Finding middle ground'
      ],
      success_criteria: 'Handle 3 disagreements appropriately',
      required_conversations: 5,
      xp_reward: 250,
      difficulty: 'advanced',
      skills_practiced: ['conflict_resolution', 'assertiveness', 'compromise']
    },
    {
      id: 'level_14',
      name: 'Group Conversations',
      description: 'Navigate multi-person interactions',
      tier: 3,
      order: 14,
      bird_character: 'charlie_sparrow',
      objectives: [
        'Include everyone',
        'Share talking time',
        'Follow group topics'
      ],
      conversation_topics: [
        'Group conversation rules',
        'Making sure everyone talks',
        'Following group flow'
      ],
      success_criteria: 'Participate in 5-minute group chat',
      required_conversations: 5,
      xp_reward: 270,
      difficulty: 'advanced',
      skills_practiced: ['group_dynamics', 'inclusion', 'sharing']
    },
    {
      id: 'level_15',
      name: 'Jokes & Humor',
      description: 'Understand non-literal language and humor',
      tier: 3,
      order: 15,
      bird_character: 'melody_mockingbird',
      objectives: [
        'Recognize jokes',
        'Understand basic sarcasm',
        'Laugh appropriately'
      ],
      conversation_topics: [
        'What makes something funny',
        'Different types of jokes',
        'When people are joking'
      ],
      success_criteria: 'Identify 4/5 jokes correctly',
      required_conversations: 5,
      xp_reward: 280,
      difficulty: 'advanced',
      skills_practiced: ['humor_comprehension', 'non_literal_language', 'social_timing']
    },
    {
      id: 'level_16',
      name: 'When I\'m Upset',
      description: 'Practice emotional self-regulation',
      tier: 3,
      order: 16,
      bird_character: 'phoenix_finch',
      objectives: [
        'Recognize escalating emotions',
        'Use calming strategies',
        'Communicate needs when upset'
      ],
      conversation_topics: [
        'Recognizing big feelings',
        'Calming down strategies',
        'Asking for space or help'
      ],
      success_criteria: 'Use 3 calming strategies successfully',
      required_conversations: 5,
      xp_reward: 290,
      difficulty: 'advanced',
      skills_practiced: ['emotional_regulation', 'self_awareness', 'coping']
    },
    {
      id: 'level_17',
      name: 'Speaking Up for Myself',
      description: 'Master self-advocacy skills',
      tier: 3,
      order: 17,
      bird_character: 'harmony_hawk',
      objectives: [
        'State needs clearly',
        'Ask for accommodations',
        'Set personal boundaries'
      ],
      conversation_topics: [
        'Saying what you need',
        'It\'s okay to ask for help',
        'Setting boundaries kindly'
      ],
      success_criteria: 'Advocate for self in 3 scenarios',
      required_conversations: 5,
      xp_reward: 300,
      difficulty: 'advanced',
      skills_practiced: ['self_advocacy', 'boundary_setting', 'assertiveness']
    },
    {
      id: 'level_18',
      name: 'Conversation Master',
      description: 'Integration of all learned skills',
      tier: 3,
      order: 18,
      bird_character: 'harmony_hawk',
      objectives: [
        'Demonstrate all learned skills',
        'Handle complex conversations',
        'Adapt to different situations'
      ],
      conversation_topics: [
        'Using all your skills',
        'Complex conversations',
        'Being your authentic self'
      ],
      success_criteria: 'Achieve 80% across all skill areas',
      required_conversations: 6,
      xp_reward: 500,
      difficulty: 'master',
      skills_practiced: ['integration', 'flexibility', 'mastery']
    }
  ],

  // 🧠 Skills that users develop
  skills: [
    { id: 'greeting', name: 'Greetings', description: 'Basic hellos and goodbyes', category: 'foundation' },
    { id: 'social_initiation', name: 'Social Initiation', description: 'Starting interactions', category: 'foundation' },
    { id: 'self_introduction', name: 'Self Introduction', description: 'Introducing yourself', category: 'foundation' },
    { id: 'turn_taking', name: 'Turn Taking', description: 'Conversational turns', category: 'foundation' },
    { id: 'active_listening', name: 'Active Listening', description: 'Showing you\'re listening', category: 'foundation' },
    { id: 'emotion_recognition', name: 'Emotion Recognition', description: 'Identifying feelings', category: 'emotional' },
    { id: 'empathy', name: 'Empathy', description: 'Understanding others', category: 'emotional' },
    { id: 'self_expression', name: 'Self Expression', description: 'Sharing your thoughts', category: 'communication' },
    { id: 'question_asking', name: 'Asking Questions', description: 'Forming questions', category: 'communication' },
    { id: 'topic_maintenance', name: 'Topic Maintenance', description: 'Staying on topic', category: 'conversation' },
    { id: 'narrative_skills', name: 'Storytelling', description: 'Sharing stories', category: 'conversation' },
    { id: 'social_cue_recognition', name: 'Social Cues', description: 'Reading the room', category: 'social' },
    { id: 'problem_solving', name: 'Problem Solving', description: 'Handling challenges', category: 'coping' },
    { id: 'emotional_regulation', name: 'Emotional Regulation', description: 'Managing feelings', category: 'coping' },
    { id: 'self_advocacy', name: 'Self Advocacy', description: 'Speaking up for needs', category: 'advanced' },
    { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'Handling disagreements', category: 'advanced' },
    { id: 'group_dynamics', name: 'Group Skills', description: 'Group conversations', category: 'advanced' },
    { id: 'humor_comprehension', name: 'Understanding Humor', description: 'Getting jokes', category: 'advanced' },
  ],

  // 🏅 Achievements
  achievements: [
    { id: 'first_chat', name: 'First Conversation!', description: 'Completed your first chat', icon: '✨', xp: 10 },
    { id: 'level_5', name: 'Rising Star', description: 'Reached level 5', icon: '⭐', xp: 50 },
    { id: 'level_10', name: 'Communication Champion', description: 'Reached level 10', icon: '🏆', xp: 100 },
    { id: 'level_15', name: 'Social Butterfly', description: 'Reached level 15', icon: '🦋', xp: 200 },
    { id: 'master', name: 'Conversation Master', description: 'Completed all 18 levels!', icon: '👑', xp: 500 },
    { id: 'streak_3', name: '3 Day Streak', description: 'Practiced 3 days in a row', icon: '🔥', xp: 30 },
    { id: 'streak_7', name: 'Week Warrior', description: 'Practiced 7 days in a row', icon: '💪', xp: 70 },
    { id: 'streak_30', name: 'Monthly Master', description: 'Practiced 30 days in a row', icon: '🌟', xp: 300 },
    { id: 'bird_collector', name: 'Bird Collector', description: 'Unlocked 5 bird friends', icon: '🦜', xp: 50 },
    { id: 'emotion_expert', name: 'Emotion Expert', description: 'Mastered emotion recognition', icon: '💖', xp: 75 },
    { id: 'listener', name: 'Super Listener', description: 'Perfect active listening scores', icon: '👂', xp: 60 },
    { id: 'storyteller', name: 'Master Storyteller', description: 'Told 10 complete stories', icon: '📚', xp: 80 },
  ],

  // 🎬 Conversation templates for each level
  conversation_templates: {
    level_1: {
      scenarios: [
        {
          name: 'Morning Greeting',
          opening: 'Good morning! I just woke up. How do you like to say hello in the morning?',
          prompts: ['What do you say when you see someone?', 'How do you greet your family?'],
          success_responses: ['Great job saying hello!', 'That\'s a wonderful greeting!']
        },
        {
          name: 'After School',
          opening: 'Welcome back from school! How do you say goodbye to your teachers?',
          prompts: ['What do you say when leaving?', 'How do you say "see you later"?'],
          success_responses: ['Perfect goodbye!', 'You\'re so polite!']
        }
      ]
    }
    // Additional templates would be created for each level
  }
};

// Clear existing collections
async function clearCollections() {
  console.log('🧹 Clearing existing collections...');
  
  const collections = [
    'bird_characters',
    'levels', 
    'skills',
    'achievements',
    'conversation_templates'
  ];
  
  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    const snapshot = await collection.get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`  ✅ Cleared ${collectionName}`);
  }
}

// Seed collection function
async function seedCollection(collectionName, data) {
  console.log(`🌱 Seeding ${collectionName}...`);
  
  try {
    if (Array.isArray(data)) {
      // For arrays
      let successCount = 0;
      for (const item of data) {
        if (!item || !item.id) continue;
        
        const { id, ...docData } = item;
        await db.collection(collectionName).doc(id).set(docData);
        successCount++;
      }
      console.log(`  ✅ Added ${successCount} documents to ${collectionName}`);
      
    } else if (typeof data === 'object' && data !== null) {
      // For objects
      let successCount = 0;
      for (const [docId, docData] of Object.entries(data)) {
        if (!docData) continue;
        
        await db.collection(collectionName).doc(docId).set(docData);
        successCount++;
      }
      console.log(`  ✅ Added ${successCount} documents to ${collectionName}`);
    }
  } catch (error) {
    console.error(`  ❌ Error seeding ${collectionName}:`, error.message);
    throw error;
  }
}

// Main seeding function
async function seed() {
  try {
    console.log('🚀 Starting enhanced database seeding...\n');

    // Clear existing data
    await clearCollections();
    console.log('');

    // Seed each collection
    await seedCollection('bird_characters', seedData.bird_characters);
    await seedCollection('levels', seedData.levels);
    await seedCollection('skills', seedData.skills);
    await seedCollection('achievements', seedData.achievements);
    await seedCollection('conversation_templates', seedData.conversation_templates);

    console.log('\n🎉 Enhanced database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - ${Object.keys(seedData.bird_characters).length} bird characters`);
    console.log(`  - ${seedData.levels.length} levels across 3 tiers`);
    console.log(`  - ${seedData.skills.length} skills to develop`);
    console.log(`  - ${seedData.achievements.length} achievements to unlock`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seed();