import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Conversation, Message } from '@/types/firebase';

export class ConversationService {
  private static collectionName = 'conversations';

  // Start a new conversation
  static async startConversation(userId: string, levelId: string): Promise<string> {
    try {
      const conversationRef = doc(collection(db, this.collectionName));
      const conversation: Conversation = {
        user_id: userId,
        level_id: levelId,
        messages: [],
        started_at: Timestamp.now()
      };
      
      await setDoc(conversationRef, conversation);
      return conversationRef.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  // Add message to conversation
  static async addMessage(
    conversationId: string, 
    message: Omit<Message, 'timestamp'>
  ): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        throw new Error('Conversation not found');
      }
      
      const conversation = conversationDoc.data() as Conversation;
      const newMessage: Message = {
        ...message,
        timestamp: Timestamp.now()
      };
      
      conversation.messages.push(newMessage);
      
      await updateDoc(conversationRef, {
        messages: conversation.messages
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Upload audio file to Firebase Storage
  static async uploadAudio(
    audioBlob: Blob, 
    userId: string, 
    conversationId?: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}.mp3`;
      
      let storagePath: string;
      if (conversationId) {
        storagePath = `audio/conversations/${conversationId}/${fileName}`;
      } else {
        storagePath = `audio/user_recordings/${userId}/${fileName}`;
      }
      
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, audioBlob, {
        contentType: 'audio/mp3'
      });
      
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  // Complete a conversation
  static async completeConversation(
    conversationId: string, 
    score: number, 
    feedback: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      
      await updateDoc(conversationRef, {
        completed_at: Timestamp.now(),
        score,
        feedback
      });
    } catch (error) {
      console.error('Error completing conversation:', error);
      throw error;
    }
  }

  // Get conversation by ID
  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationRef = doc(db, this.collectionName, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        return {
          id: conversationDoc.id,
          ...conversationDoc.data()
        } as Conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Get user's conversation history
  static async getUserConversations(
    userId: string, 
    levelId?: string,
    limitCount: number = 10
  ): Promise<Conversation[]> {
    try {
      const conversationsRef = collection(db, this.collectionName);
      let q = query(
        conversationsRef,
        where('user_id', '==', userId),
        orderBy('started_at', 'desc'),
        limit(limitCount)
      );
      
      if (levelId) {
        q = query(
          conversationsRef,
          where('user_id', '==', userId),
          where('level_id', '==', levelId),
          orderBy('started_at', 'desc'),
          limit(limitCount)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Subscribe to conversation updates (real-time)
  static subscribeToConversation(
    conversationId: string, 
    callback: (conversation: Conversation) => void
  ): Unsubscribe {
    const conversationRef = doc(db, this.collectionName, conversationId);
    
    return onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as Conversation);
      }
    });
  }

  // Calculate conversation statistics
  static async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    completedConversations: number;
    averageScore: number;
    totalPracticeTime: number; // in minutes
  }> {
    try {
      const conversationsRef = collection(db, this.collectionName);
      const q = query(conversationsRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      let totalConversations = 0;
      let completedConversations = 0;
      let totalScore = 0;
      let totalPracticeTime = 0;
      
      snapshot.docs.forEach(doc => {
        const conversation = doc.data() as Conversation;
        totalConversations++;
        
        if (conversation.completed_at && conversation.score) {
          completedConversations++;
          totalScore += conversation.score;
          
          // Calculate practice time
          const startTime = conversation.started_at.toMillis();
          const endTime = conversation.completed_at.toMillis();
          const practiceMinutes = Math.round((endTime - startTime) / (1000 * 60));
          totalPracticeTime += practiceMinutes;
        }
      });
      
      const averageScore = completedConversations > 0 
        ? Math.round(totalScore / completedConversations) 
        : 0;
      
      return {
        totalConversations,
        completedConversations,
        averageScore,
        totalPracticeTime
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      throw error;
    }
  }

  // Analyze pronunciation scores across conversations
  static async getPronunciationProgress(userId: string): Promise<{
    averageScore: number;
    improvement: number;
    bestScore: number;
  }> {
    try {
      const conversationsRef = collection(db, this.collectionName);
      const q = query(
        conversationsRef,
        where('user_id', '==', userId),
        orderBy('started_at', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const scores: number[] = [];
      
      snapshot.docs.forEach(doc => {
        const conversation = doc.data() as Conversation;
        conversation.messages.forEach(message => {
          if (message.sender === 'user' && message.pronunciation_score) {
            scores.push(message.pronunciation_score);
          }
        });
      });
      
      if (scores.length === 0) {
        return { averageScore: 0, improvement: 0, bestScore: 0 };
      }
      
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const bestScore = Math.max(...scores);
      
      // Calculate improvement (compare first 5 scores to last 5 scores)
      let improvement = 0;
      if (scores.length >= 10) {
        const firstScores = scores.slice(0, 5);
        const lastScores = scores.slice(-5);
        const firstAvg = firstScores.reduce((a, b) => a + b, 0) / 5;
        const lastAvg = lastScores.reduce((a, b) => a + b, 0) / 5;
        improvement = Math.round(lastAvg - firstAvg);
      }
      
      return { averageScore, improvement, bestScore };
    } catch (error) {
      console.error('Error getting pronunciation progress:', error);
      throw error;
    }
  }
}