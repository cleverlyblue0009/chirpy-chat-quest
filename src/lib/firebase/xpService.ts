import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserService } from './userService';
import { AchievementsService } from './achievementsService';

// XP Milestone definitions for each level
export interface LevelMilestone {
  type: 'conversation_complete' | 'perfect_score' | 'streak_bonus' | 'skill_practice' | 'speed_bonus';
  xp: number;
  description: string;
}

export interface XPTransaction {
  userId: string;
  amount: number;
  source: string;
  description: string;
  timestamp: Timestamp;
  metadata?: any;
}

export class XPService {
  // XP required for each user level
  private static readonly XP_LEVELS = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    850,    // Level 5
    1300,   // Level 6
    1900,   // Level 7
    2600,   // Level 8
    3400,   // Level 9
    4300,   // Level 10
    5300,   // Level 11
    6400,   // Level 12
    7600,   // Level 13
    8900,   // Level 14
    10300,  // Level 15
    11800,  // Level 16
    13400,  // Level 17
    15100,  // Level 18
    16900,  // Level 19
    18800,  // Level 20
    20800,  // Level 21
    22900,  // Level 22
    25100,  // Level 23
    27400,  // Level 24
    29800,  // Level 25
  ];

  // Base XP rewards for different actions
  static readonly XP_REWARDS = {
    // Conversation completion - varies by level difficulty
    CONVERSATION_COMPLETE: {
      beginner: 30,
      intermediate: 50,
      advanced: 75,
    },
    // Score-based bonuses
    PERFECT_SCORE: 50,      // 100% score
    EXCELLENT_SCORE: 30,    // 90%+ score
    GOOD_SCORE: 15,         // 80%+ score
    // Milestones during conversation
    FIRST_EXCHANGE: 5,      // First message sent
    FIVE_EXCHANGES: 10,     // 5 exchanges completed
    TEN_EXCHANGES: 15,      // 10 exchanges completed
    SMOOTH_CONVERSATION: 20, // No errors, good flow
    // Emotion & engagement
    HIGH_ENGAGEMENT: 10,    // Maintained high engagement
    EMOTION_AWARENESS: 15,  // Responded well to emotion detection
    // Pronunciation
    EXCELLENT_PRONUNCIATION: 20, // Average 90%+ pronunciation
    GOOD_PRONUNCIATION: 10,      // Average 80%+ pronunciation
    // Skill practice
    SKILL_IMPROVEMENT: 10,  // Improved a skill
    SKILL_MASTERY: 50,      // Mastered a skill to 100%
    // Streaks
    DAILY_STREAK: 5,        // Login streak per day
    WEEKLY_STREAK: 50,      // 7-day streak bonus
    MONTHLY_STREAK: 200,    // 30-day streak bonus
    // Achievements
    ACHIEVEMENT_UNLOCK: 100, // Unlocking an achievement
    // Special
    FIRST_CONVERSATION: 100, // First ever conversation
    LEVEL_COMPLETE: 50,      // Completing a level
  };

  /**
   * Award XP to a user with detailed tracking
   */
  static async awardXP(
    userId: string, 
    amount: number, 
    source: string,
    description: string,
    metadata?: any
  ): Promise<{
    newTotal: number;
    leveledUp: boolean;
    newLevel?: number;
    oldLevel?: number;
    unlockedBirds?: string[];
    unlockedAchievements?: string[];
  }> {
    try {
      // Get current user stats
      const user = await UserService.getUser(userId);
      if (!user) throw new Error('User not found');

      const oldXP = user.total_xp || 0;
      const newXP = oldXP + amount;
      const oldLevel = this.calculateLevel(oldXP);
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel > oldLevel;

      // Update user's total XP
      await UserService.addXP(userId, amount);

      // Log the XP transaction
      await this.logXPTransaction(userId, amount, source, description, metadata);

      // Check for bird unlocks based on XP
      const unlockedBirds = await this.checkBirdUnlocks(userId, oldXP, newXP);

      // Check for achievements
      const unlockedAchievements = await AchievementsService.checkAchievements(userId);

      console.log(`🌟 Awarded ${amount} XP to user ${userId}:`, {
        source,
        description,
        oldXP,
        newXP,
        oldLevel,
        newLevel,
        leveledUp,
        unlockedBirds,
        unlockedAchievements,
      });

      return {
        newTotal: newXP,
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
        oldLevel: leveledUp ? oldLevel : undefined,
        unlockedBirds,
        unlockedAchievements,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  /**
   * Calculate user level from total XP
   */
  static calculateLevel(xp: number): number {
    for (let i = this.XP_LEVELS.length - 1; i >= 0; i--) {
      if (xp >= this.XP_LEVELS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get XP required for next level
   */
  static getXPForNextLevel(currentXP: number): {
    currentLevel: number;
    nextLevel: number;
    xpNeeded: number;
    xpProgress: number;
    percentage: number;
  } {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > this.XP_LEVELS.length) {
      return {
        currentLevel,
        nextLevel: currentLevel,
        xpNeeded: 0,
        xpProgress: 0,
        percentage: 100,
      };
    }

    const currentLevelXP = this.XP_LEVELS[currentLevel - 1];
    const nextLevelXP = this.XP_LEVELS[nextLevel - 1];
    const xpProgress = currentXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const percentage = Math.round((xpProgress / xpNeeded) * 100);

    return {
      currentLevel,
      nextLevel,
      xpNeeded,
      xpProgress,
      percentage,
    };
  }

  /**
   * Check and unlock birds based on XP thresholds
   */
  private static async checkBirdUnlocks(
    userId: string,
    oldXP: number,
    newXP: number
  ): Promise<string[]> {
    const unlockedBirds: string[] = [];

    // Bird unlock thresholds (XP required)
    const birdUnlocks = [
      { id: 'ruby_robin', name: 'Ruby Robin', xp: 0 },        // Default
      { id: 'sage_owl', name: 'Sage Owl', xp: 500 },          // 500 XP
      { id: 'charlie_sparrow', name: 'Charlie Sparrow', xp: 1500 }, // 1500 XP
      { id: 'harmony_hawk', name: 'Harmony Hawk', xp: 3000 }, // 3000 XP
      { id: 'luna_lark', name: 'Luna Lark', xp: 5000 },       // 5000 XP
      { id: 'phoenix_finch', name: 'Phoenix Finch', xp: 8000 }, // 8000 XP
    ];

    for (const bird of birdUnlocks) {
      // Check if this bird should be unlocked (XP threshold crossed)
      if (oldXP < bird.xp && newXP >= bird.xp) {
        try {
          // Check if already unlocked
          const collectionRef = collection(db, 'bird_collection');
          const q = query(
            collectionRef,
            where('user_id', '==', userId),
            where('bird_id', '==', bird.id)
          );
          const existing = await getDocs(q);

          if (existing.empty) {
            // Unlock the bird
            await addDoc(collectionRef, {
              user_id: userId,
              bird_id: bird.id,
              bird_name: bird.name,
              is_active: false,
              unlocked_at: Timestamp.now(),
              conversations_count: 0,
            });

            unlockedBirds.push(bird.name);
            console.log(`🦜 Unlocked bird: ${bird.name} at ${bird.xp} XP`);
          }
        } catch (error) {
          console.error(`Error unlocking bird ${bird.id}:`, error);
        }
      }
    }

    return unlockedBirds;
  }

  /**
   * Log XP transaction for history tracking
   */
  private static async logXPTransaction(
    userId: string,
    amount: number,
    source: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    try {
      const transactionsRef = collection(db, 'xp_transactions');
      await addDoc(transactionsRef, {
        user_id: userId,
        amount,
        source,
        description,
        metadata: metadata || {},
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging XP transaction:', error);
      // Don't throw - logging failure shouldn't block XP award
    }
  }

  /**
   * Get user's XP history
   */
  static async getXPHistory(
    userId: string,
    limit: number = 50
  ): Promise<XPTransaction[]> {
    try {
      const transactionsRef = collection(db, 'xp_transactions');
      const q = query(
        transactionsRef,
        where('user_id', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const transactions = snapshot.docs
        .map(doc => ({
          userId: doc.data().user_id,
          amount: doc.data().amount,
          source: doc.data().source,
          description: doc.data().description,
          timestamp: doc.data().timestamp,
          metadata: doc.data().metadata,
        }))
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, limit);

      return transactions;
    } catch (error) {
      console.error('Error getting XP history:', error);
      return [];
    }
  }

  /**
   * Calculate XP rewards for conversation completion
   */
  static calculateConversationXP(params: {
    score: number;
    exchangeCount: number;
    averagePronunciation?: number;
    emotionEngagement?: 'high' | 'medium' | 'low';
    isFirstConversation?: boolean;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }): {
    total: number;
    breakdown: Array<{ source: string; amount: number; description: string }>;
  } {
    const breakdown: Array<{ source: string; amount: number; description: string }> = [];
    let total = 0;

    const { 
      score, 
      exchangeCount, 
      averagePronunciation, 
      emotionEngagement,
      isFirstConversation,
      difficulty = 'beginner'
    } = params;

    // Base conversation completion XP
    const baseXP = this.XP_REWARDS.CONVERSATION_COMPLETE[difficulty];
    breakdown.push({
      source: 'conversation_complete',
      amount: baseXP,
      description: `Completed ${difficulty} conversation`,
    });
    total += baseXP;

    // Score bonuses
    if (score >= 100) {
      breakdown.push({
        source: 'perfect_score',
        amount: this.XP_REWARDS.PERFECT_SCORE,
        description: 'Perfect score! 💯',
      });
      total += this.XP_REWARDS.PERFECT_SCORE;
    } else if (score >= 90) {
      breakdown.push({
        source: 'excellent_score',
        amount: this.XP_REWARDS.EXCELLENT_SCORE,
        description: 'Excellent score! 🌟',
      });
      total += this.XP_REWARDS.EXCELLENT_SCORE;
    } else if (score >= 80) {
      breakdown.push({
        source: 'good_score',
        amount: this.XP_REWARDS.GOOD_SCORE,
        description: 'Good score! 👍',
      });
      total += this.XP_REWARDS.GOOD_SCORE;
    }

    // Exchange milestones
    if (exchangeCount >= 10) {
      breakdown.push({
        source: 'ten_exchanges',
        amount: this.XP_REWARDS.TEN_EXCHANGES,
        description: '10+ exchanges completed! 💬',
      });
      total += this.XP_REWARDS.TEN_EXCHANGES;
    } else if (exchangeCount >= 5) {
      breakdown.push({
        source: 'five_exchanges',
        amount: this.XP_REWARDS.FIVE_EXCHANGES,
        description: '5+ exchanges completed! 💬',
      });
      total += this.XP_REWARDS.FIVE_EXCHANGES;
    }

    // Pronunciation bonus
    if (averagePronunciation !== undefined) {
      if (averagePronunciation >= 90) {
        breakdown.push({
          source: 'excellent_pronunciation',
          amount: this.XP_REWARDS.EXCELLENT_PRONUNCIATION,
          description: 'Excellent pronunciation! 🗣️',
        });
        total += this.XP_REWARDS.EXCELLENT_PRONUNCIATION;
      } else if (averagePronunciation >= 80) {
        breakdown.push({
          source: 'good_pronunciation',
          amount: this.XP_REWARDS.GOOD_PRONUNCIATION,
          description: 'Good pronunciation! 🗣️',
        });
        total += this.XP_REWARDS.GOOD_PRONUNCIATION;
      }
    }

    // Engagement bonus
    if (emotionEngagement === 'high') {
      breakdown.push({
        source: 'high_engagement',
        amount: this.XP_REWARDS.HIGH_ENGAGEMENT,
        description: 'Stayed engaged throughout! 😊',
      });
      total += this.XP_REWARDS.HIGH_ENGAGEMENT;
    }

    // First conversation bonus
    if (isFirstConversation) {
      breakdown.push({
        source: 'first_conversation',
        amount: this.XP_REWARDS.FIRST_CONVERSATION,
        description: 'First conversation! Welcome! 🎉',
      });
      total += this.XP_REWARDS.FIRST_CONVERSATION;
    }

    return { total, breakdown };
  }

  /**
   * Get detailed user XP stats
   */
  static async getUserXPStats(userId: string): Promise<{
    totalXP: number;
    currentLevel: number;
    nextLevel: number;
    xpProgress: number;
    xpNeeded: number;
    percentage: number;
    recentTransactions: XPTransaction[];
    totalEarned: number;
  }> {
    try {
      const user = await UserService.getUser(userId);
      if (!user) throw new Error('User not found');

      const totalXP = user.total_xp || 0;
      const levelInfo = this.getXPForNextLevel(totalXP);
      const recentTransactions = await this.getXPHistory(userId, 10);
      
      // Calculate total earned from transactions
      const totalEarned = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        totalXP,
        ...levelInfo,
        recentTransactions,
        totalEarned,
      };
    } catch (error) {
      console.error('Error getting user XP stats:', error);
      throw error;
    }
  }
}
