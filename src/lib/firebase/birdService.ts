import { 
  collection, 
  query, 
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Bird {
  id: string;
  name: string;
  description: string;
  personality: string;
  image?: string;
  unlockRequirement: string;
  unlockLevel?: number;
  isUnlocked: boolean;
  isActive: boolean;
}

/**
 * Fetch all bird characters from Firebase
 */
export async function fetchBirdCharacters(): Promise<Bird[]> {
  try {
    const birdsRef = collection(db, 'bird_characters');
    const snapshot = await getDocs(birdsRef);
    
    const birds: Bird[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      birds.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        personality: data.personality,
        image: data.image_url,
        unlockRequirement: data.unlock_requirement,
        unlockLevel: data.unlock_level,
        isUnlocked: false, // Will be updated based on user collection
        isActive: false // Will be updated based on user's active bird
      });
    });
    
    return birds;
  } catch (error) {
    console.error('Error fetching bird characters:', error);
    throw error;
  }
}

/**
 * Subscribe to user's bird collection
 */
export function subscribeToUserBirds(
  userId: string,
  callback: (birds: Bird[]) => void
): Unsubscribe {
  const unsubscribes: Unsubscribe[] = [];
  
  // First, get all birds
  fetchBirdCharacters().then(async (allBirds) => {
    // Listen to user's bird collection
    const collectionRef = collection(db, 'bird_collection');
    const collectionQuery = query(collectionRef, where('user_id', '==', userId));
    
    const collectionUnsub = onSnapshot(collectionQuery, async (collectionSnapshot) => {
      const unlockedBirdIds = new Set<string>();
      
      collectionSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.unlocked) {
          unlockedBirdIds.add(data.bird_id);
        }
      });
      
      // Get user's active bird
      const userRef = doc(db, 'users', userId);
      onSnapshot(userRef, (userSnapshot) => {
        const userData = userSnapshot.data();
        const activeBirdId = userData?.active_bird_character || 'ruby_robin';
        
        // Update bird statuses
        const updatedBirds = allBirds.map(bird => ({
          ...bird,
          isUnlocked: unlockedBirdIds.has(bird.id) || bird.id === 'ruby_robin', // Ruby Robin is always unlocked
          isActive: bird.id === activeBirdId
        }));
        
        callback(updatedBirds);
      });
    });
    
    unsubscribes.push(collectionUnsub);
  });
  
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

/**
 * Set a bird as active for the user
 */
export async function setActiveBird(userId: string, birdId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      active_bird_character: birdId
    });
  } catch (error) {
    console.error('Error setting active bird:', error);
    throw error;
  }
}

/**
 * Check and unlock birds based on user progress
 */
export async function checkAndUnlockBirds(userId: string): Promise<string[]> {
  try {
    const newlyUnlocked: string[] = [];
    
    // Get user's current level progress
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('__name__', '==', userId)
    ));
    
    if (userDoc.empty) return newlyUnlocked;
    
    const userData = userDoc.docs[0].data();
    const currentLevel = userData.current_level_order || 1;
    
    // Get all birds with unlock requirements
    const birds = await fetchBirdCharacters();
    
    // Check each bird's unlock condition
    for (const bird of birds) {
      if (bird.unlockLevel && currentLevel >= bird.unlockLevel) {
        // Check if already unlocked
        const collectionQuery = query(
          collection(db, 'bird_collection'),
          where('user_id', '==', userId),
          where('bird_id', '==', bird.id)
        );
        
        const collectionSnapshot = await getDocs(collectionQuery);
        
        if (collectionSnapshot.empty) {
          // Unlock the bird
          await collection(db, 'bird_collection').add({
            user_id: userId,
            bird_id: bird.id,
            unlocked: true,
            unlocked_at: new Date()
          });
          
          newlyUnlocked.push(bird.name);
        }
      }
    }
    
    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking bird unlocks:', error);
    return [];
  }
}