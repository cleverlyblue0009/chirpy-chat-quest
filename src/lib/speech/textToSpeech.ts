import { ElevenLabsClient } from '@elevenlabs/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY
});

// Voice IDs for different bird characters (you'll need to set these up in ElevenLabs)
const BIRD_VOICES = {
  ruby_robin: 'rachel', // Use a warm, friendly voice
  sage_owl: 'antoni', // Use a calm, wise voice
  charlie_sparrow: 'josh', // Use an energetic voice
  harmony_hawk: 'bella', // Use a confident voice
  luna_lark: 'elli', // Use a gentle, creative voice
  phoenix_finch: 'adam' // Use a motivating voice
};

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
    // Get the appropriate voice ID
    const voiceId = BIRD_VOICES[birdCharacter as keyof typeof BIRD_VOICES] || BIRD_VOICES.ruby_robin;
    
    // Generate audio using ElevenLabs
    const audioStream = await elevenlabs.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    });
    
    // Convert stream to blob
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
    
    // Upload to Firebase Storage
    const timestamp = Date.now();
    const fileName = `${birdCharacter}_${timestamp}.mp3`;
    
    let storagePath: string;
    if (conversationId) {
      storagePath = `audio/conversations/${conversationId}/${fileName}`;
    } else {
      storagePath = `audio/bird_messages/${fileName}`;
    }
    
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, audioBlob, {
      contentType: 'audio/mpeg'
    });
    
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
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