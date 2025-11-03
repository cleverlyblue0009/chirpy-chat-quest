// Lesson data for all 18 levels
// Each lesson has a goal, training questions, and expected responses

export interface TrainingQuestion {
  id: string;
  question: string;
  expectedResponses: string[];
  hints?: string[];
  category: 'greeting' | 'introduction' | 'question' | 'response' | 'ending' | 'emotion' | 'conversation';
}

export interface LessonData {
  levelId: string;
  levelNumber: number;
  name: string;
  tier: 'foundation' | 'intermediate' | 'advanced';
  goal: string;
  description: string;
  trainingQuestions: TrainingQuestion[];
  requiredCorrect: number; // Number of questions that must be answered correctly
  xpReward: number;
}

export const LESSON_DATA: LessonData[] = [
  // ===== TIER 1: FOUNDATION SKILLS (Levels 1-6) =====
  {
    levelId: 'level_1',
    levelNumber: 1,
    name: 'Hello & Greetings',
    tier: 'foundation',
    goal: 'Learn to greet others using "Hello", "Hi", "Good morning", and "Good afternoon"',
    description: 'Practice different ways to say hello and greet people you meet.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Say hello to me!',
        expectedResponses: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        hints: ['Try saying "Hello!" or "Hi!"'],
        category: 'greeting'
      },
      {
        id: 'q2',
        question: 'What do you say in the morning?',
        expectedResponses: ['good morning', 'morning', 'hello', 'hi'],
        hints: ['Think about the time of day!', 'We usually say "Good morning"'],
        category: 'greeting'
      },
      {
        id: 'q3',
        question: 'What about in the afternoon?',
        expectedResponses: ['good afternoon', 'afternoon', 'hello', 'hi'],
        hints: ['After lunch, we say "Good afternoon"'],
        category: 'greeting'
      },
      {
        id: 'q4',
        question: 'Greet me like we just met!',
        expectedResponses: ['hello', 'hi', 'good morning', 'good afternoon', 'nice to meet you'],
        hints: ['Choose any greeting you like!'],
        category: 'greeting'
      },
      {
        id: 'q5',
        question: 'Now greet a friend at school!',
        expectedResponses: ['hi', 'hello', 'hey', 'good morning', 'what\'s up'],
        hints: ['Friends often say "Hi!" or "Hey!"'],
        category: 'greeting'
      }
    ],
    requiredCorrect: 5,
    xpReward: 30
  },
  {
    levelId: 'level_2',
    levelNumber: 2,
    name: 'My Name Is...',
    tier: 'foundation',
    goal: 'Learn to introduce yourself by stating your name clearly',
    description: 'Practice saying your name and introducing yourself to others.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'What\'s your name?',
        expectedResponses: ['my name is', 'i\'m', 'i am', 'call me', 'name'],
        hints: ['Say "My name is..." and then your name'],
        category: 'introduction'
      },
      {
        id: 'q2',
        question: 'Now say "I\'m" and your name!',
        expectedResponses: ['i\'m', 'i am', 'my name'],
        hints: ['Try "I\'m [your name]"'],
        category: 'introduction'
      },
      {
        id: 'q3',
        question: 'Who are you?',
        expectedResponses: ['i\'m', 'i am', 'my name is', 'name'],
        hints: ['You can say your name!'],
        category: 'introduction'
      },
      {
        id: 'q4',
        question: 'Tell me your name clearly!',
        expectedResponses: ['my name', 'i\'m', 'i am', 'call me'],
        hints: ['Just say your name clearly'],
        category: 'introduction'
      },
      {
        id: 'q5',
        question: 'Introduce yourself to a new friend!',
        expectedResponses: ['hi', 'hello', 'my name', 'i\'m', 'nice to meet you'],
        hints: ['Start with a greeting, then say your name!'],
        category: 'introduction'
      }
    ],
    requiredCorrect: 5,
    xpReward: 30
  },
  {
    levelId: 'level_3',
    levelNumber: 3,
    name: 'How Are You?',
    tier: 'foundation',
    goal: 'Learn to ask "How are you?" and respond appropriately',
    description: 'Practice asking others how they are and answering when asked.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Hi! How are you today?',
        expectedResponses: ['good', 'fine', 'great', 'okay', 'well', 'happy', 'i\'m'],
        hints: ['You can say "I\'m good!" or "I\'m fine!"'],
        category: 'response'
      },
      {
        id: 'q2',
        question: 'That\'s wonderful! Now, can you ask me how I am?',
        expectedResponses: ['how are you', 'how do you feel', 'are you okay', 'how\'s it going'],
        hints: ['Try asking "How are you?"'],
        category: 'question'
      },
      {
        id: 'q3',
        question: 'What\'s another way to say you\'re good?',
        expectedResponses: ['fine', 'good', 'great', 'okay', 'wonderful', 'not bad', 'pretty good'],
        hints: ['You could say "Fine!" or "Great!"'],
        category: 'response'
      },
      {
        id: 'q4',
        question: 'Greet me and ask how I am!',
        expectedResponses: ['hello', 'hi', 'how are you', 'how'],
        hints: ['Say hello, then ask "How are you?"'],
        category: 'conversation'
      },
      {
        id: 'q5',
        question: 'I\'m wonderful! And how are you doing?',
        expectedResponses: ['good', 'fine', 'great', 'well', 'i\'m'],
        hints: ['Tell me how you\'re feeling!'],
        category: 'response'
      }
    ],
    requiredCorrect: 5,
    xpReward: 30
  },
  {
    levelId: 'level_4',
    levelNumber: 4,
    name: 'Basic Goodbye',
    tier: 'foundation',
    goal: 'Learn to end conversations with "Goodbye", "See you later", "Talk to you soon"',
    description: 'Practice different ways to say goodbye politely.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'We\'ve been chatting for a while! Can you say goodbye to me?',
        expectedResponses: ['goodbye', 'bye', 'see you', 'talk to you', 'later'],
        hints: ['Try saying "Goodbye!" or "Bye!"'],
        category: 'ending'
      },
      {
        id: 'q2',
        question: 'Nice! What\'s another way to say goodbye if you\'ll see the person again soon?',
        expectedResponses: ['see you later', 'see you soon', 'talk to you later', 'catch you later', 'later'],
        hints: ['You can say "See you later!"'],
        category: 'ending'
      },
      {
        id: 'q3',
        question: 'Great! And if you\'re leaving but want to chat again, what could you say?',
        expectedResponses: ['talk to you soon', 'talk to you later', 'speak soon', 'chat later'],
        hints: ['Try "Talk to you soon!"'],
        category: 'ending'
      },
      {
        id: 'q4',
        question: 'Perfect! Now, say goodbye to me like you\'re leaving school for the day.',
        expectedResponses: ['bye', 'goodbye', 'see you tomorrow', 'see you', 'later'],
        hints: ['You might see them tomorrow!'],
        category: 'ending'
      },
      {
        id: 'q5',
        question: 'Wonderful! Last one - say goodbye and wish me a nice day!',
        expectedResponses: ['goodbye', 'bye', 'have a nice day', 'have a good day', 'see you'],
        hints: ['Say goodbye and add "Have a nice day!"'],
        category: 'ending'
      }
    ],
    requiredCorrect: 5,
    xpReward: 30
  },
  {
    levelId: 'level_5',
    levelNumber: 5,
    name: 'Simple Conversations',
    tier: 'foundation',
    goal: 'Chain greetings + name + how are you into a full conversation',
    description: 'Put together everything you\'ve learned: greet, introduce, ask how someone is!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Let\'s have a complete conversation! Start by greeting me.',
        expectedResponses: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        hints: ['Say "Hello!" or "Hi!"'],
        category: 'greeting'
      },
      {
        id: 'q2',
        question: 'Hello! Now, can you tell me your name?',
        expectedResponses: ['my name', 'i\'m', 'i am', 'call me', 'name'],
        hints: ['Say "My name is..." or "I\'m..."'],
        category: 'introduction'
      },
      {
        id: 'q3',
        question: 'Nice to meet you! How are you today?',
        expectedResponses: ['good', 'fine', 'great', 'okay', 'well', 'i\'m'],
        hints: ['Tell me how you\'re feeling!'],
        category: 'response'
      },
      {
        id: 'q4',
        question: 'That\'s great! Now, it\'s polite to ask me back. Can you ask how I am?',
        expectedResponses: ['how are you', 'how about you', 'and you', 'you'],
        hints: ['Ask "How are you?"'],
        category: 'question'
      },
      {
        id: 'q5',
        question: 'I\'m wonderful, thank you! Now let\'s end our conversation. Say goodbye!',
        expectedResponses: ['goodbye', 'bye', 'see you', 'talk to you', 'later'],
        hints: ['Say "Goodbye!" or "Bye!"'],
        category: 'ending'
      },
      {
        id: 'q6',
        question: 'Perfect! Now let\'s do it all again, but faster. Greet me, introduce yourself, and ask how I am - all at once!',
        expectedResponses: ['hello', 'hi', 'my name', 'i\'m', 'how are you'],
        hints: ['Combine: greeting + introduction + question'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 6,
    xpReward: 40
  },
  {
    levelId: 'level_6',
    levelNumber: 6,
    name: 'Conversation Starters',
    tier: 'foundation',
    goal: 'Learn to start conversations in different contexts (home, school, playground)',
    description: 'Practice starting conversations in different places with different people.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Imagine you\'re at school and see a friend. What would you say to start a conversation?',
        expectedResponses: ['hi', 'hello', 'hey', 'what\'s up', 'how are you', 'good morning'],
        hints: ['Greet your friend!'],
        category: 'greeting'
      },
      {
        id: 'q2',
        question: 'Great! Now you\'re at the playground and want to play with someone new. How would you start?',
        expectedResponses: ['hi', 'hello', 'want to play', 'can i play', 'what are you', 'my name'],
        hints: ['Introduce yourself or ask to play!'],
        category: 'conversation'
      },
      {
        id: 'q3',
        question: 'Nice! At home, your parent just came home. What do you say?',
        expectedResponses: ['hi', 'hello', 'welcome home', 'how was', 'good to see you'],
        hints: ['Greet them warmly!'],
        category: 'greeting'
      },
      {
        id: 'q4',
        question: 'Perfect! You meet your teacher in the hallway. How do you greet them?',
        expectedResponses: ['hello', 'hi', 'good morning', 'good afternoon', 'how are you'],
        hints: ['Be polite with teachers!'],
        category: 'greeting'
      },
      {
        id: 'q5',
        question: 'Excellent! At lunch, you want to sit with someone. What do you say?',
        expectedResponses: ['can i sit', 'may i sit', 'is this seat taken', 'mind if i sit', 'hi'],
        hints: ['Ask if you can join them!'],
        category: 'question'
      },
      {
        id: 'q6',
        question: 'Wonderful! Last one - you see someone reading a book you like. How do you start a conversation?',
        expectedResponses: ['i like', 'that\'s a good', 'i read', 'is that', 'what book'],
        hints: ['Comment on the book or ask about it!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 6,
    xpReward: 40
  },
  
  // ===== TIER 2: INTERMEDIATE SKILLS (Levels 7-12) =====
  {
    levelId: 'level_7',
    levelNumber: 7,
    name: 'Talking About Hobbies',
    tier: 'intermediate',
    goal: 'Learn to talk about things you like to do and ask others about their hobbies',
    description: 'Share your favorite activities and learn what others enjoy!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'What do you like to do for fun? Tell me about your favorite hobby!',
        expectedResponses: ['i like', 'i love', 'i enjoy', 'i play', 'my favorite'],
        hints: ['Start with "I like to..." or "I enjoy..."'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'That sounds fun! Why do you like that activity?',
        expectedResponses: ['because', 'it\'s fun', 'it\'s cool', 'i think', 'makes me happy'],
        hints: ['Explain why it makes you happy!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'Great! Now, can you ask me what I like to do?',
        expectedResponses: ['what do you', 'what are your hobbies', 'what do you like', 'do you like'],
        hints: ['Ask "What do you like to do?"'],
        category: 'question'
      },
      {
        id: 'q4',
        question: 'I love to sing and fly around the forest! Do you like music or nature?',
        expectedResponses: ['yes', 'no', 'i like', 'music', 'nature', 'both', 'sometimes'],
        hints: ['Answer yes or no, then explain!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Wonderful! Tell me one more thing you enjoy doing with friends or family.',
        expectedResponses: ['i like', 'we play', 'we do', 'i enjoy', 'playing', 'doing'],
        hints: ['Talk about activities with others!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 50
  },
  {
    levelId: 'level_8',
    levelNumber: 8,
    name: 'School Conversations',
    tier: 'intermediate',
    goal: 'Practice talking about school, classes, and learning',
    description: 'Talk about your school day, favorite subjects, and what you\'re learning!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'How was school today? Tell me about your day!',
        expectedResponses: ['good', 'fun', 'it was', 'okay', 'i learned', 'we did'],
        hints: ['Describe your school day!'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'That sounds interesting! What\'s your favorite subject in school?',
        expectedResponses: ['math', 'reading', 'science', 'art', 'pe', 'music', 'i like', 'my favorite'],
        hints: ['Name a subject you enjoy!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'Cool! Can you tell me why you like that subject?',
        expectedResponses: ['because', 'it\'s fun', 'i\'m good', 'i like', 'it\'s interesting'],
        hints: ['Explain what makes it fun!'],
        category: 'conversation'
      },
      {
        id: 'q4',
        question: 'Great! Now, what did you learn today in school?',
        expectedResponses: ['we learned', 'i learned', 'we talked about', 'we studied', 'about'],
        hints: ['Share something new you learned!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Awesome! Do you have homework today? Tell me about it.',
        expectedResponses: ['yes', 'no', 'i have', 'i need to', 'homework', 'reading', 'math'],
        hints: ['Talk about your homework!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 50
  },
  {
    levelId: 'level_9',
    levelNumber: 9,
    name: 'Expressing Feelings',
    tier: 'intermediate',
    goal: 'Learn to talk about your emotions and feelings',
    description: 'Practice sharing how you feel and understanding others\' emotions.',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'How are you feeling right now? Use a feeling word like happy, sad, excited, or calm.',
        expectedResponses: ['happy', 'sad', 'excited', 'calm', 'good', 'okay', 'i feel', 'i\'m feeling'],
        hints: ['Use words like happy, excited, calm, etc.'],
        category: 'emotion'
      },
      {
        id: 'q2',
        question: 'Thank you for sharing! Can you tell me why you feel that way?',
        expectedResponses: ['because', 'i\'m', 'it\'s', 'makes me', 'i like'],
        hints: ['Explain what made you feel this way!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'That makes sense! What makes you feel happy?',
        expectedResponses: ['when', 'playing', 'friends', 'family', 'doing', 'i feel happy'],
        hints: ['Think of things that make you smile!'],
        category: 'emotion'
      },
      {
        id: 'q4',
        question: 'Wonderful! If someone looks sad, what could you ask them?',
        expectedResponses: ['are you okay', 'what\'s wrong', 'how are you', 'are you sad', 'can i help'],
        hints: ['Show you care by asking if they\'re okay!'],
        category: 'question'
      },
      {
        id: 'q5',
        question: 'Perfect! Tell me about a time you felt really proud of yourself.',
        expectedResponses: ['when', 'i felt proud', 'i was', 'i did', 'because'],
        hints: ['Share a moment when you did something great!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 50
  },
  {
    levelId: 'level_10',
    levelNumber: 10,
    name: 'Asking Good Questions',
    tier: 'intermediate',
    goal: 'Learn to ask thoughtful questions to keep conversations going',
    description: 'Practice asking questions that show you\'re interested and listening!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'I went on an adventure today! What question could you ask me about it?',
        expectedResponses: ['where', 'what did', 'how was', 'tell me', 'what happened', 'who'],
        hints: ['Ask "Where did you go?" or "What did you do?"'],
        category: 'question'
      },
      {
        id: 'q2',
        question: 'I flew over a beautiful lake! Ask me another question about my adventure.',
        expectedResponses: ['what', 'how', 'did you', 'was it', 'who', 'why'],
        hints: ['Keep asking to learn more!'],
        category: 'question'
      },
      {
        id: 'q3',
        question: 'Great questions! Now, if someone tells you about their weekend, what\'s a good question to ask?',
        expectedResponses: ['what did you do', 'how was', 'where did', 'did you have fun', 'what'],
        hints: ['Ask about what they did!'],
        category: 'question'
      },
      {
        id: 'q4',
        question: 'Your friend got a new pet! What do you ask?',
        expectedResponses: ['what kind', 'what is', 'what\'s its name', 'can i see', 'how'],
        hints: ['Ask about the type of pet or its name!'],
        category: 'question'
      },
      {
        id: 'q5',
        question: 'Excellent! Last one - someone says they\'re learning something new. What do you ask?',
        expectedResponses: ['what are you learning', 'what is it', 'how', 'is it fun', 'why'],
        hints: ['Ask what they\'re learning or if they enjoy it!'],
        category: 'question'
      }
    ],
    requiredCorrect: 5,
    xpReward: 50
  },
  {
    levelId: 'level_11',
    levelNumber: 11,
    name: 'Sharing Stories',
    tier: 'intermediate',
    goal: 'Learn to share your own stories and experiences',
    description: 'Practice telling stories about things that happened to you!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Tell me about something fun you did recently!',
        expectedResponses: ['i', 'we', 'yesterday', 'last', 'went', 'did', 'played'],
        hints: ['Start with "I did..." or "We went..."'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'That sounds fun! What happened next in your story?',
        expectedResponses: ['then', 'after', 'next', 'we', 'i', 'and'],
        hints: ['Continue your story with "Then..." or "After that..."'],
        category: 'conversation'
      },
      {
        id: 'q3',
        question: 'Interesting! How did your story end? What happened at the end?',
        expectedResponses: ['finally', 'at the end', 'we', 'i', 'it was', 'ended'],
        hints: ['Finish your story!'],
        category: 'conversation'
      },
      {
        id: 'q4',
        question: 'Great storytelling! Now tell me about your favorite memory.',
        expectedResponses: ['my favorite', 'i remember', 'once', 'when', 'i', 'we'],
        hints: ['Share a special memory!'],
        category: 'conversation'
      },
      {
        id: 'q5',
        question: 'Wonderful! Last question - what\'s something that made you laugh recently?',
        expectedResponses: ['when', 'once', 'i laughed', 'something funny', 'it was funny'],
        hints: ['Tell me about a funny moment!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 50
  },
  {
    levelId: 'level_12',
    levelNumber: 12,
    name: 'Turn-Taking Practice',
    tier: 'intermediate',
    goal: 'Learn when to speak and when to listen in conversations',
    description: 'Practice taking turns in conversations and waiting for your turn to talk!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'In a good conversation, we take turns talking and listening. Can you tell me something, then I\'ll share too?',
        expectedResponses: ['okay', 'yes', 'sure', 'i', 'well', 'so', 'today'],
        hints: ['Share something, then wait for me to respond!'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'Thank you for sharing! Now it\'s my turn. I saw a rainbow today. Your turn - ask me a question about it!',
        expectedResponses: ['what', 'where', 'how', 'when', 'was it', 'did you'],
        hints: ['Ask me something about the rainbow!'],
        category: 'question'
      },
      {
        id: 'q3',
        question: 'Good question! It was beautiful. Now, your turn to share - tell me about something you saw today.',
        expectedResponses: ['i saw', 'i noticed', 'today', 'i', 'there was'],
        hints: ['Take your turn to share!'],
        category: 'conversation'
      },
      {
        id: 'q4',
        question: 'Interesting! I\'m listening. Tell me more about it - what did you think?',
        expectedResponses: ['i thought', 'it was', 'i liked', 'i felt', 'it looked'],
        hints: ['Share your thoughts!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Perfect! You\'re doing great at taking turns. Let\'s practice one more time - you start!',
        expectedResponses: ['okay', 'so', 'well', 'i', 'can i', 'let me'],
        hints: ['Begin a new topic!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 60
  },

  // ===== TIER 3: ADVANCED SKILLS (Levels 13-18) =====
  {
    levelId: 'level_13',
    levelNumber: 13,
    name: 'Understanding Others',
    tier: 'advanced',
    goal: 'Learn to understand others\' perspectives and feelings',
    description: 'Practice seeing things from someone else\'s point of view!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'If your friend drops their ice cream, how do you think they feel?',
        expectedResponses: ['sad', 'upset', 'disappointed', 'unhappy', 'they feel', 'they would'],
        hints: ['Think about how you would feel!'],
        category: 'emotion'
      },
      {
        id: 'q2',
        question: 'That\'s right! What could you say to make them feel better?',
        expectedResponses: ['it\'s okay', 'don\'t worry', 'i\'m sorry', 'you can', 'we can'],
        hints: ['Say something kind and comforting!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'Great! If someone is excited about their birthday, what could you say?',
        expectedResponses: ['happy birthday', 'that\'s great', 'exciting', 'i\'m happy for you', 'when is'],
        hints: ['Share in their excitement!'],
        category: 'response'
      },
      {
        id: 'q4',
        question: 'Perfect! Your friend is nervous about a test. How can you help?',
        expectedResponses: ['you\'ll do great', 'don\'t worry', 'i can help', 'study together', 'it\'s okay'],
        hints: ['Encourage them!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Excellent empathy! Last one - someone is proud of their artwork. What do you say?',
        expectedResponses: ['it\'s beautiful', 'great job', 'i love it', 'amazing', 'good work'],
        hints: ['Give them a compliment!'],
        category: 'response'
      }
    ],
    requiredCorrect: 5,
    xpReward: 75
  },
  {
    levelId: 'level_14',
    levelNumber: 14,
    name: 'Problem Solving Together',
    tier: 'advanced',
    goal: 'Learn to discuss problems and find solutions with others',
    description: 'Practice working through problems in conversation!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Imagine you and a friend both want to play different games. What could you say?',
        expectedResponses: ['we could', 'let\'s', 'how about', 'we can', 'maybe'],
        hints: ['Suggest a solution!'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'Good thinking! What if your friend suggests something you don\'t like? How do you respond politely?',
        expectedResponses: ['i don\'t', 'maybe we could', 'what if', 'how about', 'i\'d rather'],
        hints: ['Be polite but share your idea!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'Great! If someone is struggling with something, what could you ask them?',
        expectedResponses: ['can i help', 'do you need', 'what\'s wrong', 'are you okay', 'how can i'],
        hints: ['Offer to help!'],
        category: 'question'
      },
      {
        id: 'q4',
        question: 'Perfect! You\'re working on a puzzle and it\'s tricky. What could you say?',
        expectedResponses: ['this is hard', 'can you help', 'i need', 'this is tricky', 'help me'],
        hints: ['Ask for help when you need it!'],
        category: 'conversation'
      },
      {
        id: 'q5',
        question: 'Excellent! Last one - you and a friend solved a problem together. What do you say?',
        expectedResponses: ['we did it', 'great job', 'thank you', 'we worked', 'good teamwork'],
        hints: ['Celebrate your teamwork!'],
        category: 'response'
      }
    ],
    requiredCorrect: 5,
    xpReward: 75
  },
  {
    levelId: 'level_15',
    levelNumber: 15,
    name: 'Complex Conversations',
    tier: 'advanced',
    goal: 'Handle longer, more detailed conversations on various topics',
    description: 'Practice having in-depth conversations about multiple topics!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Let\'s have a longer conversation! Tell me about your week. What happened?',
        expectedResponses: ['this week', 'i', 'we', 'on', 'monday', 'it was'],
        hints: ['Tell me about several things from your week!'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'Interesting! Tell me more details about one of those things.',
        expectedResponses: ['well', 'so', 'it', 'we', 'i', 'first', 'then'],
        hints: ['Add more details to your story!'],
        category: 'conversation'
      },
      {
        id: 'q3',
        question: 'I see! How did that make you feel?',
        expectedResponses: ['i felt', 'it made me', 'i was', 'happy', 'excited', 'good'],
        hints: ['Share your emotions!'],
        category: 'emotion'
      },
      {
        id: 'q4',
        question: 'That makes sense! Now, can you ask me about my week?',
        expectedResponses: ['how was your', 'what did you', 'how about you', 'tell me', 'what'],
        hints: ['Ask about my week!'],
        category: 'question'
      },
      {
        id: 'q5',
        question: 'My week was busy! I helped many students learn. What would you like to know about it?',
        expectedResponses: ['what', 'how', 'who', 'where', 'did you', 'was it'],
        hints: ['Ask a detailed question!'],
        category: 'question'
      },
      {
        id: 'q6',
        question: 'Great question! I helped with conversations. Now, let\'s wrap up - what\'s one thing you learned this week?',
        expectedResponses: ['i learned', 'i found out', 'i discovered', 'now i know', 'i'],
        hints: ['Share something new you learned!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 6,
    xpReward: 75
  },
  {
    levelId: 'level_16',
    levelNumber: 16,
    name: 'Handling Interruptions',
    tier: 'advanced',
    goal: 'Learn what to do when someone interrupts or when you need to interrupt politely',
    description: 'Practice managing interruptions respectfully!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'What should you say if you need to interrupt someone politely?',
        expectedResponses: ['excuse me', 'sorry', 'pardon me', 'can i', 'may i'],
        hints: ['Start with "Excuse me" or "Sorry"'],
        category: 'conversation'
      },
      {
        id: 'q2',
        question: 'Good! If someone interrupts you while you\'re talking, what could you say?',
        expectedResponses: ['wait', 'one moment', 'let me finish', 'hold on', 'just a second'],
        hints: ['Politely ask them to wait!'],
        category: 'response'
      },
      {
        id: 'q3',
        question: 'Perfect! Now, practice interrupting me politely to ask a question.',
        expectedResponses: ['excuse me', 'sorry', 'can i', 'may i ask', 'pardon'],
        hints: ['Say "Excuse me" first!'],
        category: 'question'
      },
      {
        id: 'q4',
        question: 'Great job being polite! If you accidentally interrupt someone, what should you say?',
        expectedResponses: ['sorry', 'oops', 'excuse me', 'my bad', 'i\'m sorry', 'go ahead'],
        hints: ['Apologize and let them continue!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Excellent! Last one - you\'re in a group conversation and want to add something. What do you say?',
        expectedResponses: ['can i', 'may i', 'excuse me', 'i\'d like to', 'i want to add'],
        hints: ['Ask to join the conversation politely!'],
        category: 'conversation'
      }
    ],
    requiredCorrect: 5,
    xpReward: 75
  },
  {
    levelId: 'level_17',
    levelNumber: 17,
    name: 'Reading Social Cues',
    tier: 'advanced',
    goal: 'Learn to notice and respond to social cues in conversations',
    description: 'Practice picking up on hints about how others are feeling!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'If someone keeps looking at their watch, what might that mean?',
        expectedResponses: ['they\'re busy', 'they have to go', 'they\'re in a hurry', 'need to leave', 'running late'],
        hints: ['Think about why someone checks the time!'],
        category: 'emotion'
      },
      {
        id: 'q2',
        question: 'Right! What could you say if you notice that?',
        expectedResponses: ['do you need to go', 'are you busy', 'should we finish', 'i don\'t want to keep you'],
        hints: ['Ask if they need to leave!'],
        category: 'question'
      },
      {
        id: 'q3',
        question: 'Good! If someone is giving very short answers, what might that tell you?',
        expectedResponses: ['not interested', 'busy', 'distracted', 'don\'t want to talk', 'tired'],
        hints: ['They might not want to talk much!'],
        category: 'response'
      },
      {
        id: 'q4',
        question: 'Exactly! What should you do if you notice someone isn\'t interested in talking?',
        expectedResponses: ['stop talking', 'say goodbye', 'give them space', 'end conversation', 'let them go'],
        hints: ['Be respectful of their time!'],
        category: 'response'
      },
      {
        id: 'q5',
        question: 'Perfect! If someone is smiling and leaning in, what does that tell you?',
        expectedResponses: ['interested', 'engaged', 'enjoying', 'happy', 'listening', 'they like'],
        hints: ['They\'re interested in the conversation!'],
        category: 'emotion'
      }
    ],
    requiredCorrect: 5,
    xpReward: 75
  },
  {
    levelId: 'level_18',
    levelNumber: 18,
    name: 'Master Conversationalist',
    tier: 'advanced',
    goal: 'Demonstrate all conversation skills in a complete, natural conversation',
    description: 'Put everything together in a full, natural conversation!',
    trainingQuestions: [
      {
        id: 'q1',
        question: 'Welcome to the final level! Let\'s have a complete, natural conversation. Start by greeting me!',
        expectedResponses: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'how are you'],
        hints: ['Use any greeting you like!'],
        category: 'greeting'
      },
      {
        id: 'q2',
        question: 'Hello! I\'m Ruby. It\'s wonderful to talk with you! How has your learning journey been so far?',
        expectedResponses: ['good', 'great', 'i learned', 'it\'s been', 'i\'ve been', 'fun'],
        hints: ['Tell me about your experience!'],
        category: 'conversation'
      },
      {
        id: 'q3',
        question: 'That\'s wonderful to hear! What skill are you most proud of learning?',
        expectedResponses: ['i\'m proud', 'i learned', 'my favorite', 'i like', 'the best', 'greeting'],
        hints: ['Share what you\'re proud of!'],
        category: 'conversation'
      },
      {
        id: 'q4',
        question: 'Amazing! I\'m so proud of your progress. Now, what are you going to practice next in real life?',
        expectedResponses: ['i will', 'i want to', 'i\'m going to', 'practice', 'try to', 'talk'],
        hints: ['Tell me your plans!'],
        category: 'conversation'
      },
      {
        id: 'q5',
        question: 'That sounds like a great plan! You\'ve come so far. How do you feel about your conversation skills now?',
        expectedResponses: ['confident', 'good', 'better', 'i feel', 'proud', 'ready', 'happy'],
        hints: ['Share how you feel about your progress!'],
        category: 'emotion'
      },
      {
        id: 'q6',
        question: 'You should feel proud! You\'ve completed all 18 levels. Do you have any questions for me before we finish?',
        expectedResponses: ['no', 'yes', 'thank you', 'what', 'can i', 'will i', 'nope'],
        hints: ['Ask a question or say thank you!'],
        category: 'question'
      },
      {
        id: 'q7',
        question: 'It\'s been wonderful learning with you! Now, let\'s end our conversation properly. Say goodbye!',
        expectedResponses: ['goodbye', 'bye', 'see you', 'thank you', 'talk to you later', 'thanks'],
        hints: ['Say a warm goodbye!'],
        category: 'ending'
      }
    ],
    requiredCorrect: 7,
    xpReward: 100
  }
];

// Helper function to get lesson by level ID
export function getLessonData(levelId: string): LessonData | undefined {
  return LESSON_DATA.find(lesson => lesson.levelId === levelId);
}

// Helper function to get lesson by level number
export function getLessonByNumber(levelNumber: number): LessonData | undefined {
  return LESSON_DATA.find(lesson => lesson.levelNumber === levelNumber);
}

// Helper function to check if user response matches expected responses
export function checkResponse(userResponse: string, expectedResponses: string[]): boolean {
  const normalized = userResponse.toLowerCase().trim();
  
  return expectedResponses.some(expected => {
    const normalizedExpected = expected.toLowerCase();
    
    // Check for exact match
    if (normalized === normalizedExpected) return true;
    
    // Check if normalized response contains the expected response
    if (normalized.includes(normalizedExpected)) return true;
    
    // Check if expected response is contained in user response (for multi-word answers)
    const words = normalized.split(/\s+/);
    return words.some(word => word === normalizedExpected || normalizedExpected.includes(word));
  });
}
