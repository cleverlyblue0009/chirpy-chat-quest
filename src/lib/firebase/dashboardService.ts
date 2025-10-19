import { 
  doc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserStats {
  userId: string;
  userName: string;
  currentBird: string;
  currentStreak: number;
  totalXP: number;
  conversationsCompleted: number;
  skillsMastered: number;
  totalSkills: number;
  activeDaysThisMonth: number;
  currentLevel: string;
  currentLevelProgress: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlockedAt: Date;
  isNew?: boolean;
}

/**
 * Subscribe to real-time user stats updates
 */
export function subscribeToUserStats(
  userId: string,
  callback: (stats: UserStats) => void
): Unsubscribe {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, async (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
      
      // Calculate additional stats
      const conversationsCount = await getConversationsCount(userId);
      const activeDays = await getActiveDaysThisMonth(userId);
      const skills = await getUserSkills(userId);
      
      const stats: UserStats = {
        userId,
        userName: userData.display_name || 'User',
        currentBird: userData.active_bird_character || 'ruby_robin',
        currentStreak: userData.current_streak || 0,
        totalXP: userData.total_xp || 0,
        conversationsCompleted: conversationsCount,
        skillsMastered: skills.filter(s => s.progress >= 100).length,
        totalSkills: skills.length,
        activeDaysThisMonth: activeDays,
        currentLevel: userData.current_level_id || 'level_1',
        currentLevelProgress: userData.current_level_progress || 0
      };
      
      callback(stats);
    }
  });
}

/**
 * Get user's conversation count for the current week
 */
async function getConversationsCount(userId: string): Promise<number> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('user_id', '==', userId),
    where('started_at', '>=', weekAgo)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Get active days this month
 */
async function getActiveDaysThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const progressRef = collection(db, 'user_progress');
  const q = query(
    progressRef,
    where('user_id', '==', userId),
    where('date', '>=', startOfMonth)
  );
  
  const snapshot = await getDocs(q);
  const uniqueDays = new Set();
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.date?.toDate) {
      const dateStr = data.date.toDate().toDateString();
      uniqueDays.add(dateStr);
    }
  });
  
  return uniqueDays.size;
}

/**
 * Get user's skills with progress
 */
async function getUserSkills(userId: string): Promise<Array<{ name: string; progress: number }>> {
  const skillsRef = collection(db, 'user_skills');
  const q = query(skillsRef, where('user_id', '==', userId));
  
  const snapshot = await getDocs(q);
  const skills: Array<{ name: string; progress: number }> = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    skills.push({
      name: data.skill_name,
      progress: data.progress || 0
    });
  });
  
  return skills;
}

/**
 * Fetch user's recent achievements
 */
export async function fetchUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    const achievementsRef = collection(db, 'user_achievements');
    const q = query(
      achievementsRef,
      where('user_id', '==', userId),
      orderBy('unlocked_at', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    const achievements: Achievement[] = [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const unlockedAt = data.unlocked_at?.toDate() || new Date();
      
      achievements.push({
        id: doc.id,
        icon: data.icon,
        title: data.title,
        description: data.description,
        unlockedAt,
        isNew: unlockedAt > weekAgo
      });
    });
    
    return achievements;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
}