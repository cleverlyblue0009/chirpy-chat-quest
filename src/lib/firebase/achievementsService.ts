import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Achievement, UserAchievement } from '@/types/firebase';
import { UserService } from './userService';
import { ConversationService } from './conversationService';
import { ProgressService } from './progressService';

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
      const defaultAchievements: Omit<Achievement, 'id'>[] = [
        // First Steps
        {
          name: 'First Words',
          description: 'Complete your first conversation',
          icon: '🎯',
          unlock_criteria: { type: 'conversations_completed', value: 1 }
        },
        {
          name: 'Getting Started',
          description: 'Earn your first 100 XP',
          icon: '✨',
          unlock_criteria: { type: 'total_xp', value: 100 }
        },
        
        // XP Milestones
        {
          name: 'XP Explorer',
          description: 'Earn 500 XP',
          icon: '⭐',
          unlock_criteria: { type: 'total_xp', value: 500 }
        },
        {
          name: 'XP Adventurer',
          description: 'Earn 1,000 XP',
          icon: '🌟',
          unlock_criteria: { type: 'total_xp', value: 1000 }
        },
        {
          name: 'XP Champion',
          description: 'Earn 2,500 XP',
          icon: '💫',
          unlock_criteria: { type: 'total_xp', value: 2500 }
        },
        {
          name: 'XP Master',
          description: 'Earn 5,000 XP',
          icon: '🏆',
          unlock_criteria: { type: 'total_xp', value: 5000 }
        },
        {
          name: 'XP Legend',
          description: 'Earn 10,000 XP',
          icon: '👑',
          unlock_criteria: { type: 'total_xp', value: 10000 }
        },
        
        // Conversation Milestones
        {
          name: 'Chatty Bird',
          description: 'Complete 5 conversations',
          icon: '💬',
          unlock_criteria: { type: 'conversations_completed', value: 5 }
        },
        {
          name: 'Conversation Pro',
          description: 'Complete 10 conversations',
          icon: '🗨️',
          unlock_criteria: { type: 'conversations_completed', value: 10 }
        },
        {
          name: 'Talk Master',
          description: 'Complete 25 conversations',
          icon: '💭',
          unlock_criteria: { type: 'conversations_completed', value: 25 }
        },
        {
          name: 'Social Expert',
          description: 'Complete 50 conversations',
          icon: '🎭',
          unlock_criteria: { type: 'conversations_completed', value: 50 }
        },
        {
          name: 'Conversation Legend',
          description: 'Complete 100 conversations',
          icon: '🌈',
          unlock_criteria: { type: 'conversations_completed', value: 100 }
        },
        
        // Streak Achievements
        {
          name: 'Warm Up',
          description: 'Practice 2 days in a row',
          icon: '🔥',
          unlock_criteria: { type: 'streak_days', value: 2 }
        },
        {
          name: 'On Fire',
          description: 'Practice 5 days in a row',
          icon: '🔥',
          unlock_criteria: { type: 'streak_days', value: 5 }
        },
        {
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '⚡',
          unlock_criteria: { type: 'streak_days', value: 7 }
        },
        {
          name: 'Two Week Hero',
          description: 'Maintain a 14-day streak',
          icon: '💪',
          unlock_criteria: { type: 'streak_days', value: 14 }
        },
        {
          name: 'Streak Master',
          description: 'Maintain a 30-day streak',
          icon: '🎖️',
          unlock_criteria: { type: 'streak_days', value: 30 }
        },
        
        // Level Completion
        {
          name: 'First Steps',
          description: 'Complete your first level',
          icon: '📚',
          unlock_criteria: { type: 'levels_completed', value: 1 }
        },
        {
          name: 'Learning Path',
          description: 'Complete 5 levels',
          icon: '📈',
          unlock_criteria: { type: 'levels_completed', value: 5 }
        },
        {
          name: 'Path Explorer',
          description: 'Complete 10 levels',
          icon: '🗺️',
          unlock_criteria: { type: 'levels_completed', value: 10 }
        },
        {
          name: 'Almost There',
          description: 'Complete 15 levels',
          icon: '🎯',
          unlock_criteria: { type: 'levels_completed', value: 15 }
        },
        {
          name: 'Journey Complete',
          description: 'Complete all 20 levels',
          icon: '🦋',
          unlock_criteria: { type: 'levels_completed', value: 20 }
        },
        
        // Bird Collection
        {
          name: 'New Friend',
          description: 'Unlock your second bird (500 XP)',
          icon: '🐦',
          unlock_criteria: { type: 'birds_unlocked', value: 2 }
        },
        {
          name: 'Bird Collector',
          description: 'Unlock 3 bird characters',
          icon: '🦜',
          unlock_criteria: { type: 'birds_unlocked', value: 3 }
        },
        {
          name: 'Flock Builder',
          description: 'Unlock 4 bird characters',
          icon: '🦆',
          unlock_criteria: { type: 'birds_unlocked', value: 4 }
        },
        {
          name: 'Bird Enthusiast',
          description: 'Unlock 5 bird characters',
          icon: '🦉',
          unlock_criteria: { type: 'birds_unlocked', value: 5 }
        },
        {
          name: 'Aviary Master',
          description: 'Unlock all 6 bird characters',
          icon: '🦅',
          unlock_criteria: { type: 'birds_unlocked', value: 6 }
        },
        
        // Performance
        {
          name: 'Perfect Performance',
          description: 'Get 100% on any conversation',
          icon: '💯',
          unlock_criteria: { type: 'perfect_score', value: 100 }
        },
        {
          name: 'Excellence',
          description: 'Get 100% on 5 conversations',
          icon: '🎯',
          unlock_criteria: { type: 'perfect_score', value: 100, count: 5 }
        },
        {
          name: 'Skill Builder',
          description: 'Reach 50% progress in any skill',
          icon: '📊',
          unlock_criteria: { type: 'skill_progress', value: 50 }
        },
        {
          name: 'Skill Master',
          description: 'Master any skill to 100%',
          icon: '🎓',
          unlock_criteria: { type: 'skill_mastery', value: 100 }
        },
        {
          name: 'All Skills Learned',
          description: 'Master all skills to 100%',
          icon: '🏅',
          unlock_criteria: { type: 'all_skills_mastered', value: 100 }
        },
        
        // Special Achievements
        {
          name: 'Speed Talker',
          description: 'Complete a conversation in under 5 minutes',
          icon: '⚡',
          unlock_criteria: { type: 'speed_conversation', value: 300 }
        },
        {
          name: 'Great Listener',
          description: 'Maintain high engagement for entire conversation',
          icon: '👂',
          unlock_criteria: { type: 'high_engagement_full', value: 1 }
        },
        {
          name: 'Pronunciation Pro',
          description: 'Average 90%+ pronunciation in a conversation',
          icon: '🗣️',
          unlock_criteria: { type: 'pronunciation_excellence', value: 90 }
        },
        {
          name: 'Emotional Intelligence',
          description: 'Respond well to emotion detection 10 times',
          icon: '💝',
          unlock_criteria: { type: 'emotion_responses', value: 10 }
        }
      ];
      
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