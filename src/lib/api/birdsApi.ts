import { collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { BirdCollectionItem, BirdCharacter } from '@/types/firebase';

export const birdsApi = {
  // Get all bird characters
  async getAllBirdCharacters() {
    try {
      const birdsRef = collection(db, 'bird_characters');
      const snapshot = await getDocs(birdsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BirdCharacter));
    } catch (error) {
      console.error('Error fetching bird characters:', error);
      throw error;
    }
  },

  // Get user's bird collection
  async getUserBirds(userId: string) {
    try {
      const collectionRef = collection(db, 'bird_collection');
      const q = query(collectionRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      const userBirds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BirdCollectionItem));
      
      // Get bird character details
      const birdCharacters = await this.getAllBirdCharacters();
      
      // Combine user collection with character details
      return userBirds.map(userBird => {
        const character = birdCharacters.find(c => c.id === userBird.bird_id);
        return {
          ...userBird,
          character
        };
      });
    } catch (error) {
      console.error('Error fetching user birds:', error);
      throw error;
    }
  },

  // Set active bird
  async setActiveBird(userId: string, birdId: string) {
    try {
      // First, set all birds to inactive
      const collectionRef = collection(db, 'bird_collection');
      const q = query(collectionRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { is_active: false })
      );
      await Promise.all(updatePromises);
      
      // Then set the selected bird as active
      const activeBirdQuery = query(
        collectionRef,
        where('user_id', '==', userId),
        where('bird_id', '==', birdId)
      );
      const activeBirdSnapshot = await getDocs(activeBirdQuery);
      
      if (!activeBirdSnapshot.empty) {
        await updateDoc(activeBirdSnapshot.docs[0].ref, { is_active: true });
        
        // Update user's active bird
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { active_bird_id: birdId });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error setting active bird:', error);
      throw error;
    }
  },

  // Unlock a new bird
  async unlockBird(userId: string, birdId: string) {
    try {
      // Check if already unlocked
      const collectionRef = collection(db, 'bird_collection');
      const existingQuery = query(
        collectionRef,
        where('user_id', '==', userId),
        where('bird_id', '==', birdId)
      );
      const existing = await getDocs(existingQuery);
      
      if (!existing.empty) {
        return { success: false, message: 'Bird already unlocked' };
      }
      
      // Get bird character details
      const birdCharRef = doc(db, 'bird_characters', birdId);
      const birdCharDoc = await getDoc(birdCharRef);
      
      if (!birdCharDoc.exists()) {
        throw new Error('Bird character not found');
      }
      
      const birdChar = birdCharDoc.data() as BirdCharacter;
      
      // Unlock the bird
      const newBird: Omit<BirdCollectionItem, 'id'> = {
        user_id: userId,
        bird_id: birdId,
        bird_name: birdChar.name,
        is_active: false,
        unlocked_at: Timestamp.now(),
        conversations_count: 0
      };
      
      await setDoc(doc(collectionRef), newBird);
      
      // Check for bird collection achievements
      const { AchievementsService } = await import('../firebase/achievementsService');
      await AchievementsService.checkAchievements(userId);
      
      return { success: true, birdName: birdChar.name };
    } catch (error) {
      console.error('Error unlocking bird:', error);
      throw error;
    }
  },

  // Initialize default bird characters (for setup)
  async initializeDefaultBirdCharacters() {
    try {
      const defaultBirds: { [key: string]: Omit<BirdCharacter, 'id'> } = {
        ruby_robin: {
          name: 'Ruby Robin',
          personality: 'Warm, friendly, patient',
          system_prompt: `You are Ruby Robin, a warm and friendly bird who helps children learn to greet others. 
            You are patient, encouraging, and speak in simple, clear sentences. Your goal is to make the child 
            feel comfortable with basic greetings and introductions. Always be positive and celebrate small wins. 
            Keep responses short (2-3 sentences max).`,
          specialties: ['greetings', 'introductions', 'first impressions'],
          emoji: '🐦',
          unlock_level: 0
        },
        sage_owl: {
          name: 'Sage Owl',
          personality: 'Wise, thoughtful, understanding',
          system_prompt: `You are Sage Owl, a wise and thoughtful bird who helps children understand emotions. 
            You speak calmly and help children identify and express their feelings. You're patient and never rush. 
            You use simple examples and metaphors that children can understand. Keep responses short (2-3 sentences max).`,
          specialties: ['emotions', 'feelings', 'empathy'],
          emoji: '🦉',
          unlock_level: 3
        },
        charlie_sparrow: {
          name: 'Charlie Sparrow',
          personality: 'Energetic, playful, encouraging',
          system_prompt: `You are Charlie Sparrow, an energetic and playful bird who teaches turn-taking in conversations. 
            You're enthusiastic but know when to pause and listen. You make learning fun with games and activities. 
            Always encourage the child to share their thoughts. Keep responses short (2-3 sentences max).`,
          specialties: ['turn-taking', 'active listening', 'games'],
          emoji: '🦜',
          unlock_level: 5
        },
        harmony_hawk: {
          name: 'Harmony Hawk',
          personality: 'Confident, supportive, inspiring',
          system_prompt: `You are Harmony Hawk, a confident bird who helps children express themselves clearly. 
            You're supportive and help build confidence in communication. You encourage children to speak up 
            and share their ideas. Always praise effort and progress. Keep responses short (2-3 sentences max).`,
          specialties: ['self-expression', 'confidence', 'clarity'],
          emoji: '🦅',
          unlock_level: 7
        },
        luna_lark: {
          name: 'Luna Lark',
          personality: 'Creative, imaginative, gentle',
          system_prompt: `You are Luna Lark, a creative bird who helps children with storytelling and imagination. 
            You're gentle and encourage creative expression. You help children build narratives and share experiences. 
            Always validate their creativity. Keep responses short (2-3 sentences max).`,
          specialties: ['storytelling', 'imagination', 'creativity'],
          emoji: '🕊️',
          unlock_level: 10
        },
        phoenix_finch: {
          name: 'Phoenix Finch',
          personality: 'Resilient, motivating, transformative',
          system_prompt: `You are Phoenix Finch, a resilient bird who helps children overcome communication challenges. 
            You're motivating and help children see mistakes as learning opportunities. You celebrate growth and 
            transformation. Always remind them how far they've come. Keep responses short (2-3 sentences max).`,
          specialties: ['resilience', 'growth mindset', 'problem-solving'],
          emoji: '🔥',
          unlock_level: 12
        }
      };
      
      const birdsRef = collection(db, 'bird_characters');
      
      for (const [birdId, birdData] of Object.entries(defaultBirds)) {
        await setDoc(doc(birdsRef, birdId), birdData);
      }
      
      console.log('Default bird characters initialized successfully');
    } catch (error) {
      console.error('Error initializing default bird characters:', error);
      throw error;
    }
  },

  // Increment conversation count for active bird
  async incrementBirdConversationCount(userId: string) {
    try {
      const collectionRef = collection(db, 'bird_collection');
      const q = query(
        collectionRef,
        where('user_id', '==', userId),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const activeBird = snapshot.docs[0];
        const currentCount = activeBird.data().conversations_count || 0;
        
        await updateDoc(activeBird.ref, {
          conversations_count: currentCount + 1
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error incrementing bird conversation count:', error);
      throw error;
    }
  }
};