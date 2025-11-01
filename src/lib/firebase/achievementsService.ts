import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Achievement, UserAchievement } from '@/types/firebase';
import { UserService } from './userService';
import { ConversationService } from './conversationService';
import { ProgressService } from './progressService';
import { NEW_ACHIEVEMENTS } from '../achievements/achievementDefinitions';

export class AchievementsService {
  // Get all achievements
  static async getAllAchievements(): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const snapshot = await getDocs(achievementsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Achievement));
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }

  // Get user's unlocked achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const userAchievementsRef = collection(db, 'user_achievements');
      const q = query(userAchievementsRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserAchievement));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  // Unlock achievement for user
  static async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      // Check if already unlocked
      const userAchievementsRef = collection(db, 'user_achievements');
      const q = query(
        userAchievementsRef,
        where('user_id', '==', userId),
        where('achievement_id', '==', achievementId)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        return; // Already unlocked
      }
      
      // Unlock achievement
      const userAchievement: Omit<UserAchievement, 'id'> = {
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: Timestamp.now()
      };
      
      await setDoc(doc(userAchievementsRef), userAchievement);
      
      // Award bonus XP
      await UserService.addXP(userId, 100); // 100 XP bonus for achievements
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  // Check all achievements for a user
  static async checkAchievements(userId: string): Promise<string[]> {
    try {
      const unlockedIds: string[] = [];
      const achievements = await this.getAllAchievements();
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      for (const achievement of achievements) {
        if (!achievement.id || unlockedAchievementIds.has(achievement.id)) {
          continue; // Already unlocked
        }
        
        const isEligible = await this.checkAchievementCriteria(userId, achievement);
        if (isEligible) {
          await this.unlockAchievement(userId, achievement.id);
          unlockedIds.push(achievement.id);
        }
      }
      
      return unlockedIds;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  // Check if user meets achievement criteria
  private static async checkAchievementCriteria(
    userId: string, 
    achievement: Achievement
  ): Promise<boolean> {
    try {
      const { type, value } = achievement.unlock_criteria;
      
      switch (type) {
        case 'conversations_completed': {
          const stats = await ConversationService.getConversationStats(userId);
          return stats.completedConversations >= value;
        }
        
        case 'streak_days': {
          const user = await UserService.getUser(userId);
          return (user?.streak_count || 0) >= value;
        }
        
        case 'levels_completed': {
          const userProgress = await ProgressService.getUserProgress(userId);
          const completedCount = userProgress.filter(p => p.status === 'completed').length;
          return completedCount >= value;
        }
        
        case 'birds_unlocked': {
          const birdsRef = collection(db, 'bird_collection');
          const q = query(birdsRef, where('user_id', '==', userId));
          const snapshot = await getDocs(q);
          return snapshot.size >= value;
        }
        
        case 'perfect_score': {
          const conversationsRef = collection(db, 'conversations');
          const q = query(
            conversationsRef,
            where('user_id', '==', userId),
            where('score', '>=', value)
          );
          const snapshot = await getDocs(q);
          return snapshot.size > 0;
        }
        
        case 'total_xp': {
          const user = await UserService.getUser(userId);
          return (user?.total_xp || 0) >= value;
        }
        
        case 'skill_mastery': {
          const userSkillsRef = collection(db, 'user_skills');
          const q = query(
            userSkillsRef,
            where('user_id', '==', userId),
            where('progress_percentage', '>=', value)
          );
          const snapshot = await getDocs(q);
          return snapshot.size > 0;
        }
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking achievement criteria:', error);
      return false;
    }
  }

  // Initialize default achievements (called once during setup)
  static async initializeDefaultAchievements(): Promise<void> {
    try {
      console.log('🏆 Initializing 18 new achievements...');
      const defaultAchievements: Omit<Achievement, 'id'>[] = NEW_ACHIEVEMENTS;
      
      const achievementsRef = collection(db, 'achievements');
      
      for (const achievement of defaultAchievements) {
        // Use achievement name as document ID for consistency
        const achievementId = achievement.name.toLowerCase().replace(/\s+/g, '_');
        await setDoc(doc(achievementsRef, achievementId), achievement);
      }
      
      console.log('Default achievements initialized successfully');
    } catch (error) {
      console.error('Error initializing default achievements:', error);
      throw error;
    }
  }

  // Get achievement details with user unlock status
  static async getAchievementWithStatus(
    userId: string, 
    achievementId: string
  ): Promise<{
    achievement: Achievement | null;
    isUnlocked: boolean;
    unlockedAt?: Timestamp;
  }> {
    try {
      // Get achievement definition
      const achievementDoc = await getDocs(
        query(collection(db, 'achievements'), where('__name__', '==', achievementId))
      );
      
      if (achievementDoc.empty) {
        return { achievement: null, isUnlocked: false };
      }
      
      const achievement = {
        id: achievementDoc.docs[0].id,
        ...achievementDoc.docs[0].data()
      } as Achievement;
      
      // Check if user has unlocked it
      const userAchievementsRef = collection(db, 'user_achievements');
      const q = query(
        userAchievementsRef,
        where('user_id', '==', userId),
        where('achievement_id', '==', achievementId)
      );
      const userAchievement = await getDocs(q);
      
      if (userAchievement.empty) {
        return { achievement, isUnlocked: false };
      }
      
      return {
        achievement,
        isUnlocked: true,
        unlockedAt: userAchievement.docs[0].data().unlocked_at
      };
    } catch (error) {
      console.error('Error getting achievement with status:', error);
      throw error;
    }
  }

  // Calculate achievement completion percentage
  static async getAchievementProgress(userId: string): Promise<{
    unlocked: number;
    total: number;
    percentage: number;
  }> {
    try {
      const allAchievements = await this.getAllAchievements();
      const userAchievements = await this.getUserAchievements(userId);
      
      const total = allAchievements.length;
      const unlocked = userAchievements.length;
      const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
      
      return { unlocked, total, percentage };
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      throw error;
    }
  }
}