import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Speech recognition using Web Speech API or Deepgram as fallback
 */
export class SpeechRecognition {
  private recognition: any;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor() {
    // Try to use Web Speech API
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                 (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  /**
   * Start recording audio and transcribing
   * @param onResult Callback for transcription results
   * @param onError Callback for errors
   */
  async startRecording(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start recording for audio storage
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      
      // Use Web Speech API if available
      if (this.recognition) {
        this.recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          const isFinal = event.results[last].isFinal;
          onResult(transcript, isFinal);
        };
        
        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Fall back to Deepgram
          this.useDeepgramFallback(onResult, onError);
        };
        
        this.recognition.start();
      } else {
        // Use Deepgram if Web Speech API is not available
        this.useDeepgramFallback(onResult, onError);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      onError(error as Error);
    }
  }

  /**
   * Stop recording and return the audio blob
   * @returns The recorded audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (this.recognition) {
        this.recognition.stop();
      }
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        
        this.mediaRecorder.stop();
      } else {
        resolve(null);
      }
      
      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    });
  }

  /**
   * Use Deepgram as a fallback for speech recognition
   */
  private async useDeepgramFallback(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // This would require a server endpoint to handle Deepgram API calls
    // For now, we'll just use a simple implementation
    console.warn('Deepgram fallback not fully implemented - using mock transcription');
    
    // Mock implementation - in production, this would call your Deepgram endpoint
    setTimeout(() => {
      onResult('Hello, this is a test transcription', true);
    }, 2000);
  }

  /**
   * Get audio levels for visualization
   */
  getAudioLevels(callback: (level: number) => void): void {
    if (!this.stream) return;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    microphone.connect(analyser);
    
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      callback(average / 255); // Normalize to 0-1
      
      if (this.stream) {
        requestAnimationFrame(checkLevel);
      }
    };
    
    checkLevel();
  }
}

/**
 * Upload recorded audio to Firebase Storage
 * @param audioBlob The audio blob to upload
 * @param userId The user ID
 * @param timestamp Optional timestamp
 * @returns The Firebase Storage URL
 */
export async function uploadUserRecording(
  audioBlob: Blob,
  userId: string,
  timestamp?: number
): Promise<string> {
  try {
    const fileName = `${timestamp || Date.now()}.webm`;
    const storagePath = `audio/user_recordings/${userId}/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, audioBlob, {
      contentType: 'audio/webm'
    });
    
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading user recording:', error);
    throw error;
  }
}

/**
 * Transcribe audio using Deepgram API (requires backend endpoint)
 * @param audioBlob The audio to transcribe
 * @returns The transcription
 */
export async function transcribeAudioWithDeepgram(audioBlob: Blob): Promise<string> {
  // This would typically call your backend API that interfaces with Deepgram
  // For now, returning a placeholder
  console.warn('Deepgram transcription requires backend implementation');
  return 'Transcription placeholder';
}