import { apiClient } from '../api/client';

/**
 * Generate speech audio from text using ElevenLabs
 * @param text The text to convert to speech
 * @param birdCharacter The bird character speaking
 * @param conversationId Optional conversation ID for storage path
 * @returns Firebase Storage URL of the generated audio
 */
export async function generateSpeech(
  text: string,
  birdCharacter: string = 'ruby_robin',
  conversationId?: string
): Promise<string> {
  try {
    // Call backend API to generate speech
    const response = await apiClient.generateSpeech({
      text,
      birdCharacter,
      conversationId,
    });
    
    // Check if we should use browser TTS as fallback
    if (response.useBrowserTTS && 'speechSynthesis' in window) {
      // Use browser's text-to-speech as fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      // Try to select a child-friendly voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Return a special marker for browser TTS
      return 'browser-tts:' + text;
    }
    
    // If we have a server URL, prepend the base URL if it's relative
    if (response.audioUrl && response.audioUrl.startsWith('/')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      return baseUrl + response.audioUrl;
    }
    
    return response.audioUrl || '';
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Fallback: use browser TTS if available
    if ('speechSynthesis' in window) {
      return 'browser-tts:' + text;
    }
    
    return '';
  }
}

/**
 * Preload audio for better performance
 * @param audioUrl The audio URL to preload
 */
export function preloadAudio(audioUrl: string): HTMLAudioElement {
  const audio = new Audio(audioUrl);
  audio.preload = 'auto';
  return audio;
}

/**
 * Play audio with animation callback
 * @param audioUrl The audio URL to play
 * @param onStart Callback when audio starts
 * @param onEnd Callback when audio ends
 */
export async function playAudioWithAnimation(
  audioUrl: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // Check if this is browser TTS
  if (audioUrl.startsWith('browser-tts:')) {
    const text = audioUrl.substring('browser-tts:'.length);
    
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.error('Browser TTS not supported');
        onEnd?.();
        reject(new Error('Browser TTS not supported'));
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      // Try to select a child-friendly voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        onStart?.();
      };
      
      utterance.onend = () => {
        onEnd?.();
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('Browser TTS error:', error);
        onEnd?.();
        reject(error);
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }
  
  // Regular audio file playback
  return new Promise((resolve, reject) => {
    if (!audioUrl) {
      console.error('No audio URL provided');
      onEnd?.();
      resolve();
      return;
    }
    
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('play', () => {
      onStart?.();
    });
    
    audio.addEventListener('ended', () => {
      onEnd?.();
      resolve();
    });
    
    audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
      onEnd?.();
      reject(error);
    });
    
    audio.play().catch(reject);
  });
}