// Skills mapping for the 18 lesson levels
// Each skill is unlocked when the corresponding lesson is completed

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  unlockedAtLevel: number;
  relatedLevels: number[]; // Levels that contribute to this skill
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: 'basic_greetings',
    name: 'Basic Greetings',
    description: 'Say hello and greet others appropriately',
    category: 'Foundation',
    icon: '👋',
    unlockedAtLevel: 1,
    relatedLevels: [1, 6]
  },
  {
    id: 'self_introduction',
    name: 'Self Introduction',
    description: 'Introduce yourself clearly by name',
    category: 'Foundation',
    icon: '🙋',
    unlockedAtLevel: 2,
    relatedLevels: [2, 5]
  },
  {
    id: 'asking_how_are_you',
    name: 'Asking Questions',
    description: 'Ask others how they are and respond',
    category: 'Foundation',
    icon: '❓',
    unlockedAtLevel: 3,
    relatedLevels: [3, 5, 10]
  },
  {
    id: 'saying_goodbye',
    name: 'Saying Goodbye',
    description: 'End conversations politely',
    category: 'Foundation',
    icon: '👋',
    unlockedAtLevel: 4,
    relatedLevels: [4, 5]
  },
  {
    id: 'simple_conversations',
    name: 'Simple Conversations',
    description: 'Chain greetings, introductions, and questions',
    category: 'Foundation',
    icon: '💬',
    unlockedAtLevel: 5,
    relatedLevels: [5, 15]
  },
  {
    id: 'conversation_starters',
    name: 'Conversation Starters',
    description: 'Start conversations in different contexts',
    category: 'Foundation',
    icon: '🗨️',
    unlockedAtLevel: 6,
    relatedLevels: [6, 7, 8]
  },
  {
    id: 'talking_about_hobbies',
    name: 'Talking About Hobbies',
    description: 'Share what you like to do',
    category: 'Intermediate',
    icon: '🎨',
    unlockedAtLevel: 7,
    relatedLevels: [7]
  },
  {
    id: 'school_conversations',
    name: 'School Conversations',
    description: 'Talk about school and learning',
    category: 'Intermediate',
    icon: '📚',
    unlockedAtLevel: 8,
    relatedLevels: [8]
  },
  {
    id: 'expressing_feelings',
    name: 'Expressing Feelings',
    description: 'Share your emotions clearly',
    category: 'Intermediate',
    icon: '😊',
    unlockedAtLevel: 9,
    relatedLevels: [9, 13]
  },
  {
    id: 'asking_questions',
    name: 'Asking Good Questions',
    description: 'Ask thoughtful questions to keep conversations going',
    category: 'Intermediate',
    icon: '❔',
    unlockedAtLevel: 10,
    relatedLevels: [10]
  },
  {
    id: 'sharing_stories',
    name: 'Sharing Stories',
    description: 'Tell your own stories and experiences',
    category: 'Intermediate',
    icon: '📖',
    unlockedAtLevel: 11,
    relatedLevels: [11, 15]
  },
  {
    id: 'turn_taking',
    name: 'Turn-Taking',
    description: 'Know when to speak and when to listen',
    category: 'Intermediate',
    icon: '🔄',
    unlockedAtLevel: 12,
    relatedLevels: [12]
  },
  {
    id: 'understanding_others',
    name: 'Understanding Others',
    description: 'See things from someone else\'s perspective',
    category: 'Advanced',
    icon: '🤝',
    unlockedAtLevel: 13,
    relatedLevels: [13]
  },
  {
    id: 'problem_solving',
    name: 'Problem Solving Together',
    description: 'Work through problems with others',
    category: 'Advanced',
    icon: '🧩',
    unlockedAtLevel: 14,
    relatedLevels: [14]
  },
  {
    id: 'complex_conversations',
    name: 'Complex Conversations',
    description: 'Handle longer, detailed conversations',
    category: 'Advanced',
    icon: '💭',
    unlockedAtLevel: 15,
    relatedLevels: [15]
  },
  {
    id: 'handling_interruptions',
    name: 'Handling Interruptions',
    description: 'Manage interruptions politely',
    category: 'Advanced',
    icon: '✋',
    unlockedAtLevel: 16,
    relatedLevels: [16]
  },
  {
    id: 'reading_social_cues',
    name: 'Reading Social Cues',
    description: 'Notice and respond to social hints',
    category: 'Advanced',
    icon: '👁️',
    unlockedAtLevel: 17,
    relatedLevels: [17]
  },
  {
    id: 'master_conversationalist',
    name: 'Master Conversationalist',
    description: 'Use all conversation skills naturally',
    category: 'Advanced',
    icon: '🌟',
    unlockedAtLevel: 18,
    relatedLevels: [18]
  },
];

// Helper function to get skill by ID
export function getSkillById(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find(skill => skill.id === skillId);
}

// Helper function to get skills by category
export function getSkillsByCategory(category: string): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => skill.category === category);
}

// Helper function to get unlocked skills based on completed levels
export function getUnlockedSkills(completedLevels: number[]): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => 
    completedLevels.includes(skill.unlockedAtLevel)
  );
}

// Helper function to get locked skills based on completed levels
export function getLockedSkills(completedLevels: number[]): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => 
    !completedLevels.includes(skill.unlockedAtLevel)
  );
}

// Helper function to calculate skill proficiency
// Proficiency is based on how many related levels have been completed
export function calculateSkillProficiency(
  skill: SkillDefinition,
  completedLevels: number[]
): number {
  const relatedCompleted = skill.relatedLevels.filter(level => 
    completedLevels.includes(level)
  ).length;
  
  const proficiency = (relatedCompleted / skill.relatedLevels.length) * 100;
  return Math.round(proficiency);
}

// Helper function to get next skill to unlock
export function getNextSkillToUnlock(completedLevels: number[]): SkillDefinition | null {
  const lockedSkills = getLockedSkills(completedLevels);
  
  if (lockedSkills.length === 0) return null;
  
  // Sort by unlock level and return the first one
  lockedSkills.sort((a, b) => a.unlockedAtLevel - b.unlockedAtLevel);
  return lockedSkills[0];
}

// Get all skills with their unlock status and proficiency
export function getSkillsWithProgress(completedLevels: number[]): Array<{
  skill: SkillDefinition;
  isUnlocked: boolean;
  proficiency: number;
  lastPracticed?: Date;
}> {
  return SKILL_DEFINITIONS.map(skill => ({
    skill,
    isUnlocked: completedLevels.includes(skill.unlockedAtLevel),
    proficiency: calculateSkillProficiency(skill, completedLevels),
  }));
}
