import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  setDoc,
  Timestamp,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProgress, Level, UserSkill } from '@/types/firebase';

export class ProgressService {
  // Get user progress for all levels
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const progressRef = collection(db, 'user_progress');
      const progressQuery = query(
        progressRef,
        where('user_id', '==', userId)
      );
      
      const snapshot = await getDocs(progressQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserProgress));
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Get progress for a specific level
  static async getLevelProgress(userId: string, levelId: string): Promise<UserProgress | null> {
    try {
      const progressRef = collection(db, 'user_progress');
      const progressQuery = query(
        progressRef,
        where('user_id', '==', userId),
        where('level_id', '==', levelId)
      );
      
      const snapshot = await getDocs(progressQuery);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserProgress;
    } catch (error) {
      console.error('Error getting level progress:', error);
      throw error;
    }
  }

  // Update level progress
  static async updateLevelProgress(
    userId: string, 
    levelId: string, 
    status: 'locked' | 'current' | 'completed',
    starsEarned?: number
  ): Promise<void> {
    try {
      const progress = await this.getLevelProgress(userId, levelId);
      if (!progress || !progress.id) return;

      const progressRef = doc(db, 'user_progress', progress.id);
      const updateData: Partial<UserProgress> = { status };
      
      if (starsEarned !== undefined) {
        updateData.stars_earned = starsEarned;
      }
      
      if (status === 'completed') {
        updateData.completed_at = Timestamp.now();
      }
      
      await updateDoc(progressRef, updateData);

      // If level completed, unlock next level
      if (status === 'completed') {
        await this.unlockNextLevel(userId, levelId);
      }
    } catch (error) {
      console.error('Error updating level progress:', error);
      throw error;
    }
  }

  // Complete a level
  static async completeLevel(
    userId: string, 
    levelId: string, 
    score: number
  ): Promise<void> {
    try {
      // Calculate stars based on score
      let stars = 1;
      if (score >= 90) stars = 3;
      else if (score >= 70) stars = 2;

      // Update level progress
      await this.updateLevelProgress(userId, levelId, 'completed', stars);

      // Update user's current level
      const nextLevel = await this.getNextLevel(levelId);
      if (nextLevel) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          current_level_id: nextLevel.id
        });
      }

      // Check for bird unlocks
      await this.checkBirdUnlocks(userId, levelId);

      // Update related skills
      await this.updateSkillsProgress(userId, levelId, score);
    } catch (error) {
      console.error('Error completing level:', error);
      throw error;
    }
  }

  // Unlock next level
  private static async unlockNextLevel(userId: string, currentLevelId: string): Promise<void> {
    try {
      const nextLevel = await this.getNextLevel(currentLevelId);
      if (!nextLevel || !nextLevel.id) return;

      await this.updateLevelProgress(userId, nextLevel.id, 'current');
    } catch (error) {
      console.error('Error unlocking next level:', error);
      throw error;
    }
  }

  // Get next level
  private static async getNextLevel(currentLevelId: string): Promise<Level | null> {
    try {
      // Get current level
      const currentLevelRef = doc(db, 'levels', currentLevelId);
      const currentLevelDoc = await getDocs(query(collection(db, 'levels'), where('__name__', '==', currentLevelId)));
      
      if (currentLevelDoc.empty) return null;
      
      const currentLevel = currentLevelDoc.docs[0].data() as Level;
      
      // Get next level in the same path
      const levelsRef = collection(db, 'levels');
      const nextLevelQuery = query(
        levelsRef,
        where('path_id', '==', currentLevel.path_id),
        where('level_number', '==', currentLevel.level_number + 1)
      );
      
      const nextLevelSnapshot = await getDocs(nextLevelQuery);
      
      if (nextLevelSnapshot.empty) return null;
      
      return {
        id: nextLevelSnapshot.docs[0].id,
        ...nextLevelSnapshot.docs[0].data()
      } as Level;
    } catch (error) {
      console.error('Error getting next level:', error);
      throw error;
    }
  }

  // Check and unlock birds based on level completion
  private static async checkBirdUnlocks(userId: string, levelId: string): Promise<void> {
    try {
      // Get level info
      const levelsRef = collection(db, 'levels');
      const levelQuery = query(levelsRef, where('__name__', '==', levelId));
      const levelSnapshot = await getDocs(levelQuery);
      
      if (levelSnapshot.empty) return;
      
      const level = levelSnapshot.docs[0].data() as Level;
      
      // Check if this level unlocks a new bird
      // For example, unlock Sage Owl at level 3, Charlie Sparrow at level 5, etc.
      const birdUnlocks: { [key: number]: { id: string; name: string } } = {
        3: { id: 'sage_owl', name: 'Sage Owl' },
        5: { id: 'charlie_sparrow', name: 'Charlie Sparrow' },
        7: { id: 'harmony_hawk', name: 'Harmony Hawk' },
        10: { id: 'luna_lark', name: 'Luna Lark' },
        12: { id: 'phoenix_finch', name: 'Phoenix Finch' }
      };

      const birdToUnlock = birdUnlocks[level.level_number];
      if (!birdToUnlock) return;

      // Check if bird already unlocked
      const birdCollectionRef = collection(db, 'bird_collection');
      const existingBirdQuery = query(
        birdCollectionRef,
        where('user_id', '==', userId),
        where('bird_id', '==', birdToUnlock.id)
      );
      
      const existingBird = await getDocs(existingBirdQuery);
      if (!existingBird.empty) return;

      // Unlock new bird
      const newBird = {
        user_id: userId,
        bird_id: birdToUnlock.id,
        bird_name: birdToUnlock.name,
        is_active: false,
        unlocked_at: Timestamp.now(),
        conversations_count: 0
      };
      
      await setDoc(doc(birdCollectionRef), newBird);
    } catch (error) {
      console.error('Error checking bird unlocks:', error);
      throw error;
    }
  }

  // Update skills progress based on level completion
  private static async updateSkillsProgress(
    userId: string, 
    levelId: string, 
    score: number
  ): Promise<void> {
    try {
      // Get level to know which skills it practices
      const levelDoc = await getDocs(query(collection(db, 'levels'), where('__name__', '==', levelId)));
      if (levelDoc.empty) return;
      
      const level = levelDoc.docs[0].data() as Level;
      
      // Map conversation topics to skills
      const topicToSkills: { [key: string]: string[] } = {
        'greetings': ['greeting', 'expression'],
        'introductions': ['greeting', 'turn_taking'],
        'emotions': ['emotion_recognition', 'listening'],
        'conversations': ['turn_taking', 'listening', 'expression'],
        'questions': ['listening', 'expression', 'turn_taking']
      };

      const skillsToUpdate = new Set<string>();
      level.conversation_topics.forEach(topic => {
        const skills = topicToSkills[topic.toLowerCase()] || [];
        skills.forEach(skill => skillsToUpdate.add(skill));
      });

      // Calculate progress increment based on score
      const progressIncrement = Math.floor(score / 10); // 10% max per level

      // Update each skill
      const batch = writeBatch(db);
      
      for (const skillName of skillsToUpdate) {
        // Get user skill document
        const userSkillsRef = collection(db, 'user_skills');
        const userSkillQuery = query(
          userSkillsRef,
          where('user_id', '==', userId),
          where('skill_id', '==', skillName)
        );
        
        const userSkillSnapshot = await getDocs(userSkillQuery);
        
        if (!userSkillSnapshot.empty) {
          const userSkillDoc = userSkillSnapshot.docs[0];
          const currentProgress = userSkillDoc.data().progress_percentage || 0;
          const newProgress = Math.min(100, currentProgress + progressIncrement);
          
          batch.update(doc(db, 'user_skills', userSkillDoc.id), {
            progress_percentage: newProgress,
            last_updated: Timestamp.now()
          });
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating skills progress:', error);
      throw error;
    }
  }

  // Get user's learning path progress
  static async getLearningPathProgress(userId: string, pathId: string): Promise<{
    totalLevels: number;
    completedLevels: number;
    currentLevel: number;
    percentage: number;
  }> {
    try {
      // Get all levels in this path
      const levelsRef = collection(db, 'levels');
      const levelsQuery = query(
        levelsRef,
        where('path_id', '==', pathId),
        orderBy('level_number')
      );
      const levelsSnapshot = await getDocs(levelsQuery);
      const totalLevels = levelsSnapshot.size;
      
      // Get user's progress for these levels
      const levelIds = levelsSnapshot.docs.map(doc => doc.id);
      const progressRef = collection(db, 'user_progress');
      const progressQuery = query(
        progressRef,
        where('user_id', '==', userId),
        where('level_id', 'in', levelIds),
        where('status', '==', 'completed')
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      const completedLevels = progressSnapshot.size;
      
      // Find current level
      const currentQuery = query(
        progressRef,
        where('user_id', '==', userId),
        where('level_id', 'in', levelIds),
        where('status', '==', 'current')
      );
      
      const currentSnapshot = await getDocs(currentQuery);
      let currentLevel = 1;
      
      if (!currentSnapshot.empty) {
        const currentLevelId = currentSnapshot.docs[0].data().level_id;
        const currentLevelDoc = levelsSnapshot.docs.find(doc => doc.id === currentLevelId);
        if (currentLevelDoc) {
          currentLevel = currentLevelDoc.data().level_number;
        }
      }
      
      const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
      
      return {
        totalLevels,
        completedLevels,
        currentLevel,
        percentage
      };
    } catch (error) {
      console.error('Error getting learning path progress:', error);
      throw error;
    }
  }
}