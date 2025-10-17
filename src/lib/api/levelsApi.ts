import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Level, LearningPath, UserProgress } from '@/types/firebase';
import { ProgressService } from '../firebase/progressService';

export const levelsApi = {
  // Get all levels
  async getAllLevels() {
    try {
      const levelsRef = collection(db, 'levels');
      const levelsQuery = query(levelsRef, orderBy('level_number'));
      const snapshot = await getDocs(levelsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Level));
    } catch (error) {
      console.error('Error fetching levels:', error);
      throw error;
    }
  },

  // Get levels by learning path
  async getLevelsByPath(pathId: string) {
    try {
      const levelsRef = collection(db, 'levels');
      const levelsQuery = query(
        levelsRef,
        where('path_id', '==', pathId),
        orderBy('level_number')
      );
      const snapshot = await getDocs(levelsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Level));
    } catch (error) {
      console.error('Error fetching levels by path:', error);
      throw error;
    }
  },

  // Get single level
  async getLevel(levelId: string) {
    try {
      const levelRef = doc(db, 'levels', levelId);
      const levelDoc = await getDoc(levelRef);
      
      if (!levelDoc.exists()) {
        throw new Error('Level not found');
      }
      
      return {
        id: levelDoc.id,
        ...levelDoc.data()
      } as Level;
    } catch (error) {
      console.error('Error fetching level:', error);
      throw error;
    }
  },

  // Get levels with user progress
  async getLevelsWithProgress(userId: string) {
    try {
      const levels = await this.getAllLevels();
      const userProgress = await ProgressService.getUserProgress(userId);
      
      // Combine levels with progress
      return levels.map(level => {
        const progress = userProgress.find(p => p.level_id === level.id);
        return {
          ...level,
          status: progress?.status || 'locked',
          stars_earned: progress?.stars_earned || 0,
          completed_at: progress?.completed_at
        };
      });
    } catch (error) {
      console.error('Error fetching levels with progress:', error);
      throw error;
    }
  },

  // Get all learning paths
  async getLearningPaths() {
    try {
      const pathsRef = collection(db, 'learning_paths');
      const pathsQuery = query(pathsRef, orderBy('order'));
      const snapshot = await getDocs(pathsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LearningPath));
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      throw error;
    }
  },

  // Get learning path with progress
  async getPathWithProgress(userId: string, pathId: string) {
    try {
      const pathRef = doc(db, 'learning_paths', pathId);
      const pathDoc = await getDoc(pathRef);
      
      if (!pathDoc.exists()) {
        throw new Error('Learning path not found');
      }
      
      const path = {
        id: pathDoc.id,
        ...pathDoc.data()
      } as LearningPath;
      
      const progress = await ProgressService.getLearningPathProgress(userId, pathId);
      
      return {
        ...path,
        ...progress
      };
    } catch (error) {
      console.error('Error fetching path with progress:', error);
      throw error;
    }
  },

  // Complete a level
  async completeLevel(userId: string, levelId: string, score: number) {
    try {
      await ProgressService.completeLevel(userId, levelId, score);
      
      // Calculate XP reward
      const level = await this.getLevel(levelId);
      let xpReward = level.xp_reward;
      
      // Add bonuses
      if (score >= 90) {
        xpReward = Math.floor(xpReward * 1.2); // 20% bonus for high score
      }
      
      // Add XP to user
      const { UserService } = await import('../firebase/userService');
      await UserService.addXP(userId, xpReward);
      
      // Check achievements
      const { AchievementsService } = await import('../firebase/achievementsService');
      await AchievementsService.checkAchievements(userId);
      
      return { success: true, xpEarned: xpReward };
    } catch (error) {
      console.error('Error completing level:', error);
      throw error;
    }
  },

  // Initialize default levels (for setup)
  async initializeDefaultLevels() {
    try {
      const defaultLevels: Omit<Level, 'id'>[] = [
        // Beginner Path
        {
          path_id: 'forest_explorer',
          level_number: 1,
          name: 'Hello, Friend!',
          description: 'Learn to greet others and say hello',
          bird_character: 'ruby_robin',
          xp_reward: 50,
          unlock_requirement: 0,
          conversation_topics: ['greetings', 'introductions']
        },
        {
          path_id: 'forest_explorer',
          level_number: 2,
          name: 'Nice to Meet You',
          description: 'Practice introducing yourself',
          bird_character: 'ruby_robin',
          xp_reward: 75,
          unlock_requirement: 50,
          conversation_topics: ['introductions', 'personal_info']
        },
        {
          path_id: 'forest_explorer',
          level_number: 3,
          name: 'How Are You?',
          description: 'Learn to ask and answer about feelings',
          bird_character: 'sage_owl',
          xp_reward: 100,
          unlock_requirement: 125,
          conversation_topics: ['emotions', 'feelings']
        },
        // Intermediate Path
        {
          path_id: 'tree_climber',
          level_number: 4,
          name: 'Taking Turns',
          description: 'Master the art of conversation turn-taking',
          bird_character: 'charlie_sparrow',
          xp_reward: 125,
          unlock_requirement: 225,
          conversation_topics: ['turn_taking', 'conversations']
        },
        {
          path_id: 'tree_climber',
          level_number: 5,
          name: 'Active Listening',
          description: 'Learn to listen and respond appropriately',
          bird_character: 'harmony_hawk',
          xp_reward: 150,
          unlock_requirement: 350,
          conversation_topics: ['listening', 'responding']
        },
        // Add more levels as needed
      ];
      
      const levelsRef = collection(db, 'levels');
      for (const level of defaultLevels) {
        await setDoc(doc(levelsRef), level);
      }
      
      console.log('Default levels initialized successfully');
    } catch (error) {
      console.error('Error initializing default levels:', error);
      throw error;
    }
  },

  // Initialize default learning paths (for setup)
  async initializeDefaultPaths() {
    try {
      const defaultPaths: Omit<LearningPath, 'id'>[] = [
        {
          name: 'Forest Explorer',
          description: 'Begin your journey with basic greetings and introductions',
          difficulty_level: 'beginner',
          order: 1
        },
        {
          name: 'Tree Climber',
          description: 'Build conversation skills and emotional understanding',
          difficulty_level: 'intermediate',
          order: 2
        },
        {
          name: 'Sky Soarer',
          description: 'Master complex social interactions and empathy',
          difficulty_level: 'advanced',
          order: 3
        }
      ];
      
      const pathsRef = collection(db, 'learning_paths');
      for (const path of defaultPaths) {
        const pathId = path.name.toLowerCase().replace(/\s+/g, '_');
        await setDoc(doc(pathsRef, pathId), path);
      }
      
      console.log('Default learning paths initialized successfully');
    } catch (error) {
      console.error('Error initializing default paths:', error);
      throw error;
    }
  }
};