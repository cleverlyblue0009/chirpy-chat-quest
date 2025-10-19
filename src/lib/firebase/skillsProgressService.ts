import { 
  collection, 
  query, 
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Skill {
  id: string;
  name: string;
  description: string;
  progress: number;
  isLocked: boolean;
  category?: string;
  requiredLevel?: number;
  subSkills?: string[];
}

export interface UserSkillProgress {
  userId: string;
  skillId: string;
  skillName: string;
  progress: number;
  isLocked: boolean;
  lastPracticed?: Date;
  totalPracticeTime?: number;
}

/**
 * Default skills if none exist in Firebase
 */
const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'greetings',
    name: 'Greetings & Introductions',
    description: 'Learn how to start conversations',
    progress: 100,
    isLocked: false,
    category: 'basic'
  },
  {
    id: 'turn_taking',
    name: 'Turn-Taking',
    description: 'Master the art of conversation flow',
    progress: 75,
    isLocked: false,
    category: 'basic'
  },
  {
    id: 'active_listening',
    name: 'Active Listening',
    description: 'Show you are engaged in the conversation',
    progress: 60,
    isLocked: false,
    category: 'intermediate'
  },
  {
    id: 'emotion_recognition',
    name: 'Emotion Recognition',
    description: 'Understand and respond to emotions',
    progress: 40,
    isLocked: false,
    category: 'intermediate'
  },
  {
    id: 'topic_maintenance',
    name: 'Topic Maintenance',
    description: 'Keep conversations on track',
    progress: 25,
    isLocked: false,
    category: 'intermediate'
  },
  {
    id: 'asking_questions',
    name: 'Asking Questions',
    description: 'Learn to ask engaging questions',
    progress: 0,
    isLocked: true,
    category: 'advanced',
    requiredLevel: 4
  },
  {
    id: 'ending_conversations',
    name: 'Ending Conversations',
    description: 'Gracefully conclude interactions',
    progress: 0,
    isLocked: true,
    category: 'advanced',
    requiredLevel: 6
  }
];

/**
 * Subscribe to user's skills progress
 */
export function subscribeToUserSkills(
  userId: string,
  callback: (skills: Skill[]) => void
): Unsubscribe {
  const skillsRef = collection(db, 'user_skills');
  const q = query(skillsRef, where('user_id', '==', userId));
  
  return onSnapshot(q, async (snapshot) => {
    const skills: Skill[] = [];
    
    if (snapshot.empty) {
      // Initialize with default skills if none exist
      await initializeUserSkills(userId);
      callback(DEFAULT_SKILLS);
      return;
    }
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      skills.push({
        id: doc.id,
        name: data.skill_name,
        description: data.description || '',
        progress: data.progress || 0,
        isLocked: data.is_locked || false,
        category: data.category,
        requiredLevel: data.required_level,
        subSkills: data.sub_skills
      });
    });
    
    // Sort skills by category and progress
    skills.sort((a, b) => {
      if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1;
      return b.progress - a.progress;
    });
    
    callback(skills);
  });
}

/**
 * Initialize user skills with defaults
 */
async function initializeUserSkills(userId: string): Promise<void> {
  try {
    for (const skill of DEFAULT_SKILLS) {
      const skillDoc = doc(db, 'user_skills', `${userId}_${skill.id}`);
      await setDoc(skillDoc, {
        user_id: userId,
        skill_id: skill.id,
        skill_name: skill.name,
        description: skill.description,
        progress: skill.progress,
        is_locked: skill.isLocked,
        category: skill.category,
        required_level: skill.requiredLevel,
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error initializing user skills:', error);
  }
}

/**
 * Update skill progress
 */
export async function updateSkillProgress(
  userId: string,
  skillId: string,
  progress: number
): Promise<void> {
  try {
    const skillDoc = doc(db, 'user_skills', `${userId}_${skillId}`);
    await updateDoc(skillDoc, {
      progress: Math.min(100, Math.max(0, progress)),
      last_practiced: new Date()
    });
  } catch (error) {
    console.error('Error updating skill progress:', error);
    throw error;
  }
}

/**
 * Unlock a skill for the user
 */
export async function unlockSkill(
  userId: string,
  skillId: string
): Promise<void> {
  try {
    const skillDoc = doc(db, 'user_skills', `${userId}_${skillId}`);
    await updateDoc(skillDoc, {
      is_locked: false,
      unlocked_at: new Date()
    });
  } catch (error) {
    console.error('Error unlocking skill:', error);
    throw error;
  }
}

/**
 * Get skill recommendations based on current progress
 */
export function getSkillRecommendations(skills: Skill[]): Skill[] {
  // Find skills that are unlocked but not mastered (< 100% progress)
  const inProgressSkills = skills.filter(
    s => !s.isLocked && s.progress > 0 && s.progress < 100
  );
  
  // Sort by progress (lowest first - needs more practice)
  inProgressSkills.sort((a, b) => a.progress - b.progress);
  
  return inProgressSkills.slice(0, 3); // Return top 3 skills to practice
}