import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, BirdCollectionItem, UserSkill, UserProgress } from '@/types/firebase';

export class UserService {
  private static collectionName = 'users';

  // Create a new user
  static async createUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      const newUser: User = {
        name: data.name || '',
        age: data.age || 0,
        created_at: Timestamp.now(),
        current_level_id: null,
        total_xp: 0,
        streak_count: 0,
        last_active_date: Timestamp.now(),
        active_bird_id: 'ruby_robin',
        ...data
      };
      
      await setDoc(userRef, newUser);

      // Initialize user's bird collection with Ruby Robin
      await this.initializeBirdCollection(uid);
      
      // Initialize user skills
      await this.initializeUserSkills(uid);
      
      // Initialize user progress for all levels
      await this.initializeUserProgress(uid);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        return { id: userSnapshot.id, ...userSnapshot.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.collectionName, uid);
      await updateDoc(userRef, {
        ...data,
        last_active_date: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user streak
  static async updateStreak(uid: string): Promise<void> {
    try {
      const user = await this.getUser(uid);
      if (!user) return;

      const now = new Date();
      const lastActive = user.last_active_date.toDate();
      const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      let newStreakCount = user.streak_count;
      
      if (daysDiff === 0) {
        // Same day, no change
        return;
      } else if (daysDiff === 1) {
        // Next day, increment streak
        newStreakCount++;
      } else {
        // Streak broken, reset to 1
        newStreakCount = 1;
      }

      await this.updateUser(uid, {
        streak_count: newStreakCount,
        last_active_date: Timestamp.now()
      });

      // Check for streak achievements
      await this.checkStreakAchievements(uid, newStreakCount);
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Add XP to user
  static async addXP(uid: string, xpAmount: number): Promise<void> {
    try {
      const user = await this.getUser(uid);
      if (!user) return;

      await this.updateUser(uid, {
        total_xp: (user.total_xp || 0) + xpAmount
      });
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }

  // Initialize bird collection for new user
  private static async initializeBirdCollection(uid: string): Promise<void> {
    try {
      const birdCollectionRef = collection(db, 'bird_collection');
      const rubyRobin: Omit<BirdCollectionItem, 'id'> = {
        user_id: uid,
        bird_id: 'ruby_robin',
        bird_name: 'Ruby Robin',
        is_active: true,
        unlocked_at: Timestamp.now(),
        conversations_count: 0
      };
      
      await setDoc(doc(birdCollectionRef), rubyRobin);
    } catch (error) {
      console.error('Error initializing bird collection:', error);
      throw error;
    }
  }

  // Initialize user skills
  private static async initializeUserSkills(uid: string): Promise<void> {
    try {
      const skillsRef = collection(db, 'skills');
      const skillsSnapshot = await getDocs(skillsRef);
      
      const userSkillsRef = collection(db, 'user_skills');
      
      for (const skillDoc of skillsSnapshot.docs) {
        const userSkill: Omit<UserSkill, 'id'> = {
          user_id: uid,
          skill_id: skillDoc.id,
          progress_percentage: 0,
          last_updated: Timestamp.now()
        };
        
        await setDoc(doc(userSkillsRef), userSkill);
      }
    } catch (error) {
      console.error('Error initializing user skills:', error);
      throw error;
    }
  }

  // Initialize user progress for all levels
  private static async initializeUserProgress(uid: string): Promise<void> {
    try {
      const levelsRef = collection(db, 'levels');
      const levelsSnapshot = await getDocs(levelsRef);
      
      const userProgressRef = collection(db, 'user_progress');
      
      let isFirstLevel = true;
      for (const levelDoc of levelsSnapshot.docs) {
        const userProgress: Omit<UserProgress, 'id'> = {
          user_id: uid,
          level_id: levelDoc.id,
          status: isFirstLevel ? 'current' : 'locked',
          stars_earned: 0
        };
        
        await setDoc(doc(userProgressRef), userProgress);
        isFirstLevel = false;
      }
    } catch (error) {
      console.error('Error initializing user progress:', error);
      throw error;
    }
  }

  // Check and unlock streak achievements
  private static async checkStreakAchievements(uid: string, streakCount: number): Promise<void> {
    // This will be implemented in the achievementsService
    // For now, just log
    console.log(`Checking streak achievements for user ${uid} with streak ${streakCount}`);
  }

  // Get user stats
  static async getUserStats(uid: string): Promise<{
    totalXP: number;
    streakCount: number;
    levelsCompleted: number;
    birdsUnlocked: number;
    achievementsUnlocked: number;
  }> {
    try {
      const user = await this.getUser(uid);
      if (!user) throw new Error('User not found');

      // Get completed levels count
      const progressRef = collection(db, 'user_progress');
      const progressQuery = query(progressRef, 
        where('user_id', '==', uid),
        where('status', '==', 'completed')
      );
      const progressSnapshot = await getDocs(progressQuery);
      const levelsCompleted = progressSnapshot.size;

      // Get unlocked birds count
      const birdsRef = collection(db, 'bird_collection');
      const birdsQuery = query(birdsRef, where('user_id', '==', uid));
      const birdsSnapshot = await getDocs(birdsQuery);
      const birdsUnlocked = birdsSnapshot.size;

      // Get achievements count
      const achievementsRef = collection(db, 'user_achievements');
      const achievementsQuery = query(achievementsRef, where('user_id', '==', uid));
      const achievementsSnapshot = await getDocs(achievementsQuery);
      const achievementsUnlocked = achievementsSnapshot.size;

      return {
        totalXP: user.total_xp || 0,
        streakCount: user.streak_count || 0,
        levelsCompleted,
        birdsUnlocked,
        achievementsUnlocked
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}