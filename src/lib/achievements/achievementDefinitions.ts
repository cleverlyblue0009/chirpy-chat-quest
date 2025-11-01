// Achievement definitions matching the 18 new achievements for the autism conversation skills app

import { Achievement } from '@/types/firebase';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlock_criteria: {
    type: string;
    value: number;
  };
  category: 'milestone' | 'streak' | 'skill' | 'performance' | 'xp';
}

export const NEW_ACHIEVEMENTS: Omit<Achievement, 'id'>[] = [
  // 1. First Conversation - Complete Level 1
  {
    name: 'First Conversation',
    description: 'Complete Level 1',
    icon: '🎯',
    unlock_criteria: { type: 'levels_completed', value: 1 }
  },
  
  // 2. Foundation Master - Complete all Level 1-6
  {
    name: 'Foundation Master',
    description: 'Complete all Foundation levels (1-6)',
    icon: '🏆',
    unlock_criteria: { type: 'levels_completed', value: 6 }
  },
  
  // 3. 3 Day Streak - 3 consecutive days of lessons
  {
    name: '3 Day Streak',
    description: 'Practice 3 days in a row',
    icon: '🔥',
    unlock_criteria: { type: 'streak_days', value: 3 }
  },
  
  // 4. 7 Day Streak - 7 consecutive days of lessons
  {
    name: '7 Day Streak',
    description: 'Practice 7 days in a row',
    icon: '⚡',
    unlock_criteria: { type: 'streak_days', value: 7 }
  },
  
  // 5. Conversation Starter - Reach 100 XP
  {
    name: 'Conversation Starter',
    description: 'Reach 100 XP',
    icon: '✨',
    unlock_criteria: { type: 'total_xp', value: 100 }
  },
  
  // 6. Conversation Pro - Reach 500 XP
  {
    name: 'Conversation Pro',
    description: 'Reach 500 XP',
    icon: '⭐',
    unlock_criteria: { type: 'total_xp', value: 500 }
  },
  
  // 7. Conversation Expert - Reach 1000 XP
  {
    name: 'Conversation Expert',
    description: 'Reach 1,000 XP',
    icon: '🌟',
    unlock_criteria: { type: 'total_xp', value: 1000 }
  },
  
  // 8. Perfect Pronunciation - Achieve 95+ score in any lesson
  {
    name: 'Perfect Pronunciation',
    description: 'Achieve 95+ pronunciation score in any lesson',
    icon: '🗣️',
    unlock_criteria: { type: 'pronunciation_excellence', value: 95 }
  },
  
  // 9. No Mistakes - Complete a full lesson with 0 errors
  {
    name: 'No Mistakes',
    description: 'Complete a full lesson with 0 errors',
    icon: '💯',
    unlock_criteria: { type: 'perfect_lesson', value: 1 }
  },
  
  // 10. Speed Talker - Complete a lesson in under 5 minutes
  {
    name: 'Speed Talker',
    description: 'Complete a lesson in under 5 minutes',
    icon: '⚡',
    unlock_criteria: { type: 'speed_conversation', value: 300 }
  },
  
  // 11. Consistent Learner - Complete same lesson 5 times
  {
    name: 'Consistent Learner',
    description: 'Complete the same lesson 5 times',
    icon: '🔁',
    unlock_criteria: { type: 'lesson_repetition', value: 5 }
  },
  
  // 12. Intermediate Skills - Complete all Level 7-12
  {
    name: 'Intermediate Skills',
    description: 'Complete all Intermediate levels (7-12)',
    icon: '📚',
    unlock_criteria: { type: 'levels_completed', value: 12 }
  },
  
  // 13. Advanced Skills - Complete all Level 13-18
  {
    name: 'Advanced Skills',
    description: 'Complete all Advanced levels (13-18)',
    icon: '🎓',
    unlock_criteria: { type: 'levels_completed', value: 18 }
  },
  
  // 14. Completionist - Unlock all other achievements
  {
    name: 'Completionist',
    description: 'Unlock all other achievements',
    icon: '👑',
    unlock_criteria: { type: 'achievement_count', value: 17 }
  },
  
  // 15. Weekly Champion - Complete 10 lessons in one week
  {
    name: 'Weekly Champion',
    description: 'Complete 10 lessons in one week',
    icon: '🏅',
    unlock_criteria: { type: 'weekly_lessons', value: 10 }
  },
  
  // 16. Monthly Milestone - 30 days of using app
  {
    name: 'Monthly Milestone',
    description: '30 days of using the app',
    icon: '📅',
    unlock_criteria: { type: 'streak_days', value: 30 }
  },
  
  // 17. Skill Collector - Unlock 10 different skills
  {
    name: 'Skill Collector',
    description: 'Unlock 10 different skills',
    icon: '🎯',
    unlock_criteria: { type: 'skills_unlocked', value: 10 }
  },
  
  // 18. Master Conversationalist - Reach 2000 XP + complete all levels
  {
    name: 'Master Conversationalist',
    description: 'Reach 2,000 XP and complete all 18 levels',
    icon: '🦋',
    unlock_criteria: { type: 'master_completion', value: 1 }
  },
];

// Helper function to check if user meets achievement criteria
export async function checkUserForAchievement(
  achievement: AchievementDefinition,
  userData: {
    totalXP: number;
    streakDays: number;
    levelsCompleted: number;
    lessonsThisWeek: number;
    skillsUnlocked: number;
    achievementsUnlocked: number;
    perfectLessons: number;
    bestPronunciation: number;
    fastestLesson: number;
    lessonRepetitions: { [levelId: string]: number };
  }
): Promise<boolean> {
  const { type, value } = achievement.unlock_criteria;
  
  switch (type) {
    case 'levels_completed':
      return userData.levelsCompleted >= value;
      
    case 'streak_days':
      return userData.streakDays >= value;
      
    case 'total_xp':
      return userData.totalXP >= value;
      
    case 'pronunciation_excellence':
      return userData.bestPronunciation >= value;
      
    case 'perfect_lesson':
      return userData.perfectLessons >= value;
      
    case 'speed_conversation':
      return userData.fastestLesson > 0 && userData.fastestLesson <= value;
      
    case 'lesson_repetition':
      return Object.values(userData.lessonRepetitions).some(count => count >= value);
      
    case 'achievement_count':
      return userData.achievementsUnlocked >= value;
      
    case 'weekly_lessons':
      return userData.lessonsThisWeek >= value;
      
    case 'skills_unlocked':
      return userData.skillsUnlocked >= value;
      
    case 'master_completion':
      return userData.totalXP >= 2000 && userData.levelsCompleted >= 18;
      
    default:
      return false;
  }
}

// Get achievement by name
export function getAchievementByName(name: string): Omit<Achievement, 'id'> | undefined {
  return NEW_ACHIEVEMENTS.find(a => a.name === name);
}

// Get all achievements by category
export function getAchievementsByCategory(category: string): Omit<Achievement, 'id'>[] {
  // This would need to be enhanced to actually filter by category
  // For now, return all
  return NEW_ACHIEVEMENTS;
}
