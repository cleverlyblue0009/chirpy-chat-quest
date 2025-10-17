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
    
    return response.audioUrl;
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Fallback: return empty string if TTS fails
    // In production, you might want to have a pre-recorded fallback
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
  return new Promise((resolve, reject) => {
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