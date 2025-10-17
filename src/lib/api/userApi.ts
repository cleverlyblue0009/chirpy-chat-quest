import { UserService } from '../firebase/userService';
import { ProgressService } from '../firebase/progressService';
import { SkillsService } from '../firebase/skillsService';
import { AchievementsService } from '../firebase/achievementsService';
import { User } from '@/types/firebase';

// User Profile API
export const userApi = {
  // Get user profile
  async getProfile(userId: string) {
    try {
      const user = await UserService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userId: string, data: Partial<User>) {
    try {
      await UserService.updateUser(userId, data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get user stats
  async getStats(userId: string) {
    try {
      const stats = await UserService.getUserStats(userId);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Get user progress
  async getProgress(userId: string) {
    try {
      const progress = await ProgressService.getUserProgress(userId);
      return progress;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // Get user skills
  async getSkills(userId: string) {
    try {
      const skills = await SkillsService.getUserSkills(userId);
      const skillDefinitions = await SkillsService.getAllSkills();
      
      // Combine skill definitions with user progress
      return skillDefinitions.map(skill => {
        const userSkill = skills.find(us => us.skill_id === skill.id);
        return {
          ...skill,
          progress_percentage: userSkill?.progress_percentage || 0,
          last_updated: userSkill?.last_updated
        };
      });
    } catch (error) {
      console.error('Error fetching user skills:', error);
      throw error;
    }
  },

  // Get user achievements
  async getAchievements(userId: string) {
    try {
      const userAchievements = await AchievementsService.getUserAchievements(userId);
      const allAchievements = await AchievementsService.getAllAchievements();
      
      // Combine achievement definitions with user unlock status
      return allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          unlocked: !!userAchievement,
          unlocked_at: userAchievement?.unlocked_at
        };
      });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  },

  // Check and unlock achievements
  async checkAchievements(userId: string) {
    try {
      const unlockedIds = await AchievementsService.checkAchievements(userId);
      return { unlockedIds };
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  },

  // Update user streak
  async updateStreak(userId: string) {
    try {
      await UserService.updateStreak(userId);
      return { success: true };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  // Add XP to user
  async addXP(userId: string, amount: number) {
    try {
      await UserService.addXP(userId, amount);
      
      // Check for XP-based achievements
      await AchievementsService.checkAchievements(userId);
      
      return { success: true };
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }
};