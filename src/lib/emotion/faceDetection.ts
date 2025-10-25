import * as faceapi from '@vladmandic/face-api';
import { 
  EmotionData, 
  EmotionAnalysis, 
  FacialLandmarks,
  StrugglingSignals 
} from '@/types/emotion';

/**
 * Face detection and emotion analysis service (stable local model version)
 */
export class FaceDetectionService {
  private static instance: FaceDetectionService;
  private modelsLoaded = false;
  private detectionStream: MediaStream | null = null;

  private constructor() {}

  static getInstance(): FaceDetectionService {
    if (!FaceDetectionService.instance) {
      FaceDetectionService.instance = new FaceDetectionService();
    }
    return FaceDetectionService.instance;
  }

  /**
   * Load face-api.js models from /public/models/
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      console.log('✅ Face detection models already loaded');
      return;
    }

    const MODEL_URL = '/models/';

    console.log('📦 Loading face detection models from local:', MODEL_URL);
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      console.log('✅ All face detection models loaded successfully');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('❌ Failed to load face detection models from local:', error);
      throw new Error('Failed to load face detection models. Make sure models are inside /public/models/');
    }
  }

  /**
   * Request camera permission and get stream
   */
  async requestCameraAccess(): Promise<MediaStream> {
    try {
      console.log('🎥 Requesting camera access...');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser does not support getUserMedia or HTTPS not used.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('✅ Camera access granted');
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        console.log(`📹 Using camera: ${tracks[0].label}`);
      }

      this.detectionStream = stream;
      return stream;
    } catch (error: any) {
      console.error('❌ Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        console.error('🚫 Permission denied: User or browser blocked camera access');
      } else if (error.name === 'NotFoundError') {
        console.error('🚫 No camera device detected');
      } else if (error.name === 'NotReadableError') {
        console.error('🚫 Camera is already in use by another app');
      } else if (error.name === 'SecurityError') {
        console.error('🚫 Must use HTTPS or localhost for camera access');
      }
      throw error;
    }
  }

  /**
   * Stop camera stream
   */
  stopCameraStream(): void {
    if (this.detectionStream) {
      this.detectionStream.getTracks().forEach(track => track.stop());
      this.detectionStream = null;
      console.log('🛑 Camera stream stopped');
    }
  }

  /**
   * Detect face and emotions
   */
  async detectEmotions(videoElement: HTMLVideoElement): Promise<EmotionAnalysis | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    if (!videoElement || videoElement.readyState < 2) {
      console.warn('⏳ Video not ready yet for detection');
      return null;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        console.log('😶 No face detected');
        return null;
      }

      const emotions = detection.expressions as EmotionData;
      const dominantEmotion = this.getDominantEmotion(emotions);
      const isLookingAtScreen = detection.detection.score > 0.7;
      const engagementLevel = this.calculateEngagementLevel(emotions, isLookingAtScreen, detection.detection.score);
      const strugglingIndicators = this.detectStrugglingIndicators(emotions, isLookingAtScreen, engagementLevel);

      const landmarks = detection.landmarks;
      const facialLandmarks: FacialLandmarks = {
        leftEye: landmarks.getLeftEye()[0],
        rightEye: landmarks.getRightEye()[0],
        nose: landmarks.getNose()[0],
        mouth: landmarks.getMouth()[0],
        jawOutline: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y }))
      };

      console.log(`😃 Detected emotion: ${dominantEmotion.emotion} (${(dominantEmotion.confidence * 100).toFixed(1)}%)`);

      return {
        currentEmotion: dominantEmotion.emotion,
        confidence: dominantEmotion.confidence,
        isLookingAtScreen,
        engagementLevel,
        strugglingIndicators,
        needsSupport: strugglingIndicators.length > 0,
        timestamp: Date.now(),
        rawEmotions: emotions,
        facialLandmarks
      };
    } catch (error) {
      console.error('❌ Emotion detection error:', error);
      return null;
    }
  }

  /** Get dominant emotion */
  private getDominantEmotion(emotions: EmotionData): { emotion: string; confidence: number } {
    const [emotion, confidence] = Object.entries(emotions)
      .reduce((max, [key, val]) => val > max[1] ? [key, val] : max, ['neutral', 0]);
    return { emotion, confidence };
  }

  /** Calculate engagement level */
  private calculateEngagementLevel(emotions: EmotionData, looking: boolean, conf: number): 'high' | 'medium' | 'low' {
    if (!looking || conf < 0.5) return 'low';
    const positive = emotions.happy + emotions.surprised;
    const negative = emotions.sad + emotions.angry + emotions.fearful;
    const neutral = emotions.neutral;
    if (positive > 0.6) return 'high';
    if (neutral > 0.7 || negative > 0.5) return 'low';
    return 'medium';
  }

  /** Detect struggling indicators */
  private detectStrugglingIndicators(emotions: EmotionData, looking: boolean, level: string): string[] {
    const i: string[] = [];
    if (emotions.angry > 0.3 || emotions.disgusted > 0.3) i.push('frustration');
    if (emotions.surprised > 0.4 && emotions.fearful > 0.2) i.push('confusion');
    if (emotions.sad > 0.3) i.push('overwhelm');
    if (!looking) i.push('looking_away');
    if (level === 'low') i.push('low_engagement');
    if (emotions.neutral > 0.8 && looking) i.push('processing');
    return i;
  }

  /** Analyze emotion history */
  static analyzeEmotionHistory(history: EmotionAnalysis[]): StrugglingSignals {
    const last = history.slice(-5);
    if (last.length < 3) {
      return { frustration: false, confusion: false, disengagement: false, lowEngagement: false, frequentLookingAway: false, prolongedNeutral: false };
    }
    return {
      frustration: last.filter(e => ['angry', 'disgusted'].includes(e.currentEmotion)).length >= 2,
      confusion: last.filter(e => ['surprised', 'fearful'].includes(e.currentEmotion)).length >= 2,
      disengagement: last.filter(e => !e.isLookingAtScreen).length >= 3,
      lowEngagement: last.filter(e => e.engagementLevel === 'low').length >= 3,
      frequentLookingAway: last.filter(e => e.strugglingIndicators.includes('looking_away')).length >= 3,
      prolongedNeutral: last.filter(e => e.currentEmotion === 'neutral').length >= 4
    };
  }

  /** Generate feedback */
  static generateEmotionFeedback(analysis: EmotionAnalysis, signals: StrugglingSignals): string | null {
    if (analysis.strugglingIndicators.includes('processing')) return "I can see you're thinking hard! Take your time.";
    if (signals.frustration || analysis.strugglingIndicators.includes('frustration')) return "I can see this is tricky! Let's try it together.";
    if (signals.confusion || analysis.strugglingIndicators.includes('confusion')) return "You look a bit unsure - would you like me to explain differently?";
    if (signals.frequentLookingAway) return "I notice you're looking away - do you need a break?";
    if (signals.lowEngagement) return "Let's make this more fun! What interests you most?";
    if (analysis.engagementLevel === 'high') return "You're doing amazing! I love your enthusiasm!";
    return null;
  }
}
