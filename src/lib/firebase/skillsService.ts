import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Skill, UserSkill } from '@/types/firebase';

export class SkillsService {
  // Get all skills definitions
  static async getAllSkills(): Promise<Skill[]> {
    try {
      const skillsRef = collection(db, 'skills');
      const snapshot = await getDocs(skillsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Skill));
    } catch (error) {
      console.error('Error getting skills:', error);
      throw error;
    }
  }

  // Get user's skill progress
  static async getUserSkills(userId: string): Promise<UserSkill[]> {
    try {
      const userSkillsRef = collection(db, 'user_skills');
      const q = query(userSkillsRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserSkill));
    } catch (error) {
      console.error('Error getting user skills:', error);
      throw error;
    }
  }

  // Update skill progress
  static async updateSkillProgress(
    userId: string, 
    skillId: string, 
    progressIncrement: number
  ): Promise<void> {
    try {
      // Get current skill progress
      const userSkillsRef = collection(db, 'user_skills');
      const q = query(
        userSkillsRef,
        where('user_id', '==', userId),
        where('skill_id', '==', skillId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new user skill if doesn't exist
        const newUserSkill: Omit<UserSkill, 'id'> = {
          user_id: userId,
          skill_id: skillId,
          progress_percentage: Math.min(progressIncrement, 100),
          last_updated: Timestamp.now()
        };
        await setDoc(doc(userSkillsRef), newUserSkill);
      } else {
        // Update existing skill
        const userSkillDoc = snapshot.docs[0];
        const currentProgress = userSkillDoc.data().progress_percentage || 0;
        const newProgress = Math.min(currentProgress + progressIncrement, 100);
        
        await updateDoc(doc(db, 'user_skills', userSkillDoc.id), {
          progress_percentage: newProgress,
          last_updated: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating skill progress:', error);
      throw error;
    }
  }

  // Get skill details with user progress
  static async getSkillWithProgress(userId: string, skillId: string): Promise<{
    skill: Skill | null;
    progress: UserSkill | null;
  }> {
    try {
      // Get skill definition
      const skillRef = doc(db, 'skills', skillId);
      const skillDoc = await getDocs(query(collection(db, 'skills'), where('__name__', '==', skillId)));
      
      let skill: Skill | null = null;
      if (!skillDoc.empty) {
        skill = {
          id: skillDoc.docs[0].id,
          ...skillDoc.docs[0].data()
        } as Skill;
      }
      
      // Get user's progress for this skill
      const userSkillsRef = collection(db, 'user_skills');
      const q = query(
        userSkillsRef,
        where('user_id', '==', userId),
        where('skill_id', '==', skillId)
      );
      const progressSnapshot = await getDocs(q);
      
      let progress: UserSkill | null = null;
      if (!progressSnapshot.empty) {
        progress = {
          id: progressSnapshot.docs[0].id,
          ...progressSnapshot.docs[0].data()
        } as UserSkill;
      }
      
      return { skill, progress };
    } catch (error) {
      console.error('Error getting skill with progress:', error);
      throw error;
    }
  }

  // Calculate overall skill level
  static async getOverallSkillLevel(userId: string): Promise<{
    level: 'beginner' | 'intermediate' | 'advanced';
    percentage: number;
  }> {
    try {
      const userSkills = await this.getUserSkills(userId);
      
      if (userSkills.length === 0) {
        return { level: 'beginner', percentage: 0 };
      }
      
      const totalProgress = userSkills.reduce((sum, skill) => sum + skill.progress_percentage, 0);
      const averageProgress = Math.round(totalProgress / userSkills.length);
      
      let level: 'beginner' | 'intermediate' | 'advanced';
      if (averageProgress < 33) {
        level = 'beginner';
      } else if (averageProgress < 66) {
        level = 'intermediate';
      } else {
        level = 'advanced';
      }
      
      return { level, percentage: averageProgress };
    } catch (error) {
      console.error('Error calculating overall skill level:', error);
      throw error;
    }
  }

  // Initialize default skills (called once during setup)
  static async initializeDefaultSkills(): Promise<void> {
    try {
      const defaultSkills: Omit<Skill, 'id'>[] = [
        {
          name: 'Greeting',
          description: 'Ability to greet others appropriately',
          category: 'Social Interaction',
          icon: '👋'
        },
        {
          name: 'Turn Taking',
          description: 'Understanding when to speak and when to listen',
          category: 'Communication',
          icon: '🔄'
        },
        {
          name: 'Emotion Recognition',
          description: 'Identifying emotions in others',
          category: 'Emotional Intelligence',
          icon: '😊'
        },
        {
          name: 'Listening',
          description: 'Active listening and comprehension',
          category: 'Communication',
          icon: '👂'
        },
        {
          name: 'Expression',
          description: 'Expressing thoughts and feelings clearly',
          category: 'Communication',
          icon: '💬'
        },
        {
          name: 'Eye Contact',
          description: 'Maintaining appropriate eye contact',
          category: 'Non-verbal Communication',
          icon: '👁️'
        },
        {
          name: 'Body Language',
          description: 'Understanding and using body language',
          category: 'Non-verbal Communication',
          icon: '🤷'
        },
        {
          name: 'Empathy',
          description: 'Understanding and sharing feelings of others',
          category: 'Emotional Intelligence',
          icon: '❤️'
        }
      ];
      
      const skillsRef = collection(db, 'skills');
      
      for (const skill of defaultSkills) {
        // Use skill name as document ID for consistency
        const skillId = skill.name.toLowerCase().replace(/\s+/g, '_');
        await setDoc(doc(skillsRef, skillId), skill);
      }
      
      console.log('Default skills initialized successfully');
    } catch (error) {
      console.error('Error initializing default skills:', error);
      throw error;
    }
  }

  // Get skills by category
  static async getSkillsByCategory(category: string): Promise<Skill[]> {
    try {
      const skillsRef = collection(db, 'skills');
      const q = query(skillsRef, where('category', '==', category));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Skill));
    } catch (error) {
      console.error('Error getting skills by category:', error);
      throw error;
    }
  }

  // Reset all user skills (for testing)
  static async resetUserSkills(userId: string): Promise<void> {
    try {
      const userSkillsRef = collection(db, 'user_skills');
      const q = query(userSkillsRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          progress_percentage: 0,
          last_updated: Timestamp.now()
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error resetting user skills:', error);
      throw error;
    }
  }
}