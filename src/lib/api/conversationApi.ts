import { ConversationService } from '../firebase/conversationService';
import { Message } from '@/types/firebase';
import { generateAIResponse } from '../ai/conversationEngine';
import { generateSpeech } from '../speech/textToSpeech';
import { analyzePronunciation } from '../speech/pronunciation';

export const conversationApi = {
  // Start a new conversation
  async startConversation(userId: string, levelId: string) {
    try {
      const conversationId = await ConversationService.startConversation(userId, levelId);
      
      // Generate and add initial bird greeting
      const greeting = await this.generateInitialGreeting(levelId);
      
      // Generate audio for greeting
      const audioUrl = await generateSpeech(greeting.text, greeting.birdCharacter);
      
      const initialMessage: Omit<Message, 'timestamp'> = {
        sender: 'bird',
        text: greeting.text,
        audio_url: audioUrl,
        tone: 'friendly'
      };
      
      await ConversationService.addMessage(conversationId, initialMessage);
      
      return { conversationId, initialMessage };
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  },

  // Submit user message to conversation
  async submitMessage(
    conversationId: string, 
    text: string, 
    audioBlob?: Blob,
    userId?: string
  ) {
    try {
      let audioUrl: string | undefined;
      let pronunciationScore: number | undefined;
      
      // Upload audio if provided
      if (audioBlob && userId) {
        audioUrl = await ConversationService.uploadAudio(audioBlob, userId, conversationId);
        
        // Analyze pronunciation
        pronunciationScore = await analyzePronunciation(audioBlob);
      }
      
      // Add user message
      const userMessage: Omit<Message, 'timestamp'> = {
        sender: 'user',
        text,
        audio_url: audioUrl,
        pronunciation_score: pronunciationScore
      };
      
      await ConversationService.addMessage(conversationId, userMessage);
      
      // Get conversation context
      const conversation = await ConversationService.getConversation(conversationId);
      if (!conversation) throw new Error('Conversation not found');
      
      // Generate AI response
      const aiResponse = await generateAIResponse(
        conversation.messages,
        conversation.level_id,
        text
      );
      
      // Generate audio for AI response
      const responseAudioUrl = await generateSpeech(aiResponse.text, aiResponse.birdCharacter);
      
      // Add bird response
      const birdMessage: Omit<Message, 'timestamp'> = {
        sender: 'bird',
        text: aiResponse.text,
        audio_url: responseAudioUrl,
        tone: aiResponse.tone
      };
      
      await ConversationService.addMessage(conversationId, birdMessage);
      
      // Check if conversation should end
      if (aiResponse.shouldEnd) {
        await this.completeConversation(conversationId, aiResponse.score, aiResponse.feedback);
      }
      
      return { 
        userMessage, 
        birdMessage, 
        shouldEnd: aiResponse.shouldEnd,
        score: aiResponse.score 
      };
    } catch (error) {
      console.error('Error submitting message:', error);
      throw error;
    }
  },

  // Complete a conversation
  async completeConversation(conversationId: string, score: number, feedback: string) {
    try {
      await ConversationService.completeConversation(conversationId, score, feedback);
      
      // Get conversation to update user progress
      const conversation = await ConversationService.getConversation(conversationId);
      if (!conversation) throw new Error('Conversation not found');
      
      // Update level progress if score is good enough
      if (score >= 60) {
        const { levelsApi } = await import('./levelsApi');
        await levelsApi.completeLevel(conversation.user_id, conversation.level_id, score);
      }
      
      return { success: true, score, feedback };
    } catch (error) {
      console.error('Error completing conversation:', error);
      throw error;
    }
  },

  // Get conversation history
  async getConversationHistory(userId: string, levelId?: string, limit: number = 10) {
    try {
      const conversations = await ConversationService.getUserConversations(userId, levelId, limit);
      return conversations;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  },

  // Get conversation statistics
  async getConversationStats(userId: string) {
    try {
      const stats = await ConversationService.getConversationStats(userId);
      const pronunciationProgress = await ConversationService.getPronunciationProgress(userId);
      
      return {
        ...stats,
        pronunciation: pronunciationProgress
      };
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      throw error;
    }
  },

  // Generate initial greeting based on level
  private async generateInitialGreeting(levelId: string) {
    // This would normally fetch from Firestore based on level
    // For now, return a default greeting
    const greetings: { [key: string]: { text: string; birdCharacter: string } } = {
      default: {
        text: "Hello there! I'm Ruby Robin. I'm so excited to chat with you today! What's your name?",
        birdCharacter: 'ruby_robin'
      }
    };
    
    return greetings.default;
  },

  // Subscribe to real-time conversation updates
  subscribeToConversation(conversationId: string, callback: (data: any) => void) {
    return ConversationService.subscribeToConversation(conversationId, callback);
  }
};