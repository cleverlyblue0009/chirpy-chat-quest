import { 
  collection, 
  query, 
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Level {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'completed' | 'current' | 'locked';
  position: 'left' | 'center' | 'right';
  requiredXP?: number;
  birdCharacter?: string;
}

export interface UserProgress {
  userId: string;
  levelId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
  conversations: number;
}

/**
 * Fetch all levels from Firebase
 */
export async function fetchLevels(): Promise<Level[]> {
  try {
    const levelsRef = collection(db, 'levels');
    const q = query(levelsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    const levels: Level[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      levels.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        order: data.order,
        status: 'locked', // Will be updated based on user progress
        position: getPositionByOrder(data.order),
        requiredXP: data.required_xp,
        birdCharacter: data.bird_character
      });
    });
    
    return levels;
  } catch (error) {
    console.error('Error fetching levels:', error);
    throw error;
  }
}

/**
 * Get position based on level order (for UI zigzag pattern)
 */
function getPositionByOrder(order: number): 'left' | 'center' | 'right' {
  const positions: Array<'center' | 'left' | 'right'> = ['center', 'left', 'right'];
  return positions[(order - 1) % 3];
}

/**
 * Subscribe to user's level progress
 */
export function subscribeToUserProgress(
  userId: string,
  callback: (levels: Level[]) => void
): Unsubscribe {
  // First, get all levels
  const unsubscribes: Unsubscribe[] = [];
  
  fetchLevels().then(async (allLevels) => {
    // Then, listen to user progress
    const progressRef = collection(db, 'user_progress');
    const q = query(progressRef, where('user_id', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const progressMap = new Map<string, UserProgress>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        progressMap.set(data.level_id, {
          userId: data.user_id,
          levelId: data.level_id,
          completed: data.completed || false,
          completedAt: data.completed_at?.toDate(),
          score: data.score,
          conversations: data.conversations_completed || 0
        });
      });
      
      // Update level statuses based on progress
      const updatedLevels = updateLevelStatuses(allLevels, progressMap);
      callback(updatedLevels);
    });
    
    unsubscribes.push(unsubscribe);
  });
  
  // Return a function that unsubscribes all listeners
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

/**
 * Update level statuses based on user progress
 */
function updateLevelStatuses(
  levels: Level[], 
  progressMap: Map<string, UserProgress>
): Level[] {
  let foundCurrent = false;
  
  return levels.map((level) => {
    const progress = progressMap.get(level.id);
    
    if (progress?.completed) {
      return { ...level, status: 'completed' as const };
    } else if (!foundCurrent) {
      foundCurrent = true;
      return { ...level, status: 'current' as const };
    } else {
      return { ...level, status: 'locked' as const };
    }
  });
}

/**
 * Get user's current level details
 */
export async function getUserCurrentLevel(userId: string): Promise<Level | null> {
  try {
    // Get user document to find current level
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('__name__', '==', userId)
    ));
    
    if (userDoc.empty) return null;
    
    const userData = userDoc.docs[0].data();
    const currentLevelId = userData.current_level_id;
    
    if (!currentLevelId) return null;
    
    // Get level details
    const levelDoc = await getDocs(query(
      collection(db, 'levels'),
      where('__name__', '==', currentLevelId)
    ));
    
    if (levelDoc.empty) return null;
    
    const levelData = levelDoc.docs[0].data();
    return {
      id: currentLevelId,
      name: levelData.name,
      description: levelData.description,
      order: levelData.order,
      status: 'current',
      position: getPositionByOrder(levelData.order),
      requiredXP: levelData.required_xp,
      birdCharacter: levelData.bird_character
    };
  } catch (error) {
    console.error('Error getting current level:', error);
    return null;
  }
}