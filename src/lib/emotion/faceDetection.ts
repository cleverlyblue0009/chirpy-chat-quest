import * as faceapi from '@vladmandic/face-api';
import { 
  EmotionData, 
  EmotionAnalysis, 
  FacialLandmarks,
  StrugglingSignals 
} from '@/types/emotion';

/**
 * Face detection and emotion analysis service
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
   * Load face-api.js models
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    
    try {
      // Load models from CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      this.modelsLoaded = true;
      console.log('✅ Face detection models loaded');
    } catch (error) {
      console.error('❌ Failed to load face detection models:', error);
      throw error;
    }
  }
  
  /**
   * Request camera permission and get stream
   */
  async requestCameraAccess(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      this.detectionStream = stream;
      return stream;
    } catch (error) {
      console.error('Camera access denied:', error);
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
    }
  }
  
  /**
   * Detect face and emotions from video element
   */
  async detectEmotions(videoElement: HTMLVideoElement): Promise<EmotionAnalysis | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }
    
    try {
      // Detect face with expressions
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (!detection) {
        return null;
      }
      
      // Extract emotion data
      const emotions = detection.expressions as EmotionData;
      
      // Find dominant emotion
      const dominantEmotion = this.getDominantEmotion(emotions);
      
      // Calculate eye contact (simplified - based on face detection confidence)
      const isLookingAtScreen = detection.detection.score > 0.7;
      
      // Calculate engagement level
      const engagementLevel = this.calculateEngagementLevel(
        emotions,
        isLookingAtScreen,
        detection.detection.score
      );
      
      // Detect struggling indicators
      const strugglingIndicators = this.detectStrugglingIndicators(
        emotions,
        isLookingAtScreen,
        engagementLevel
      );
      
      // Extract facial landmarks (simplified)
      const landmarks = detection.landmarks;
      const facialLandmarks: FacialLandmarks = {
        leftEye: { 
          x: landmarks.getLeftEye()[0].x, 
          y: landmarks.getLeftEye()[0].y 
        },
        rightEye: { 
          x: landmarks.getRightEye()[0].x, 
          y: landmarks.getRightEye()[0].y 
        },
        nose: { 
          x: landmarks.getNose()[0].x, 
          y: landmarks.getNose()[0].y 
        },
        mouth: { 
          x: landmarks.getMouth()[0].x, 
          y: landmarks.getMouth()[0].y 
        },
        jawOutline: landmarks.getJawOutline().map(p => ({ x: p.x, y: p.y }))
      };
      
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
      console.error('Emotion detection error:', error);
      return null;
    }
  }
  
  /**
   * Get dominant emotion from emotion data
   */
  private getDominantEmotion(emotions: EmotionData): { emotion: string; confidence: number } {
    const emotionEntries = Object.entries(emotions);
    const [dominantEmotion, confidence] = emotionEntries.reduce(
      (max, [emotion, value]) => value > max[1] ? [emotion, value] : max,
      ['neutral', 0]
    );
    
    return { emotion: dominantEmotion, confidence };
  }
  
  /**
   * Calculate engagement level based on emotions and attention
   */
  private calculateEngagementLevel(
    emotions: EmotionData,
    isLookingAtScreen: boolean,
    detectionConfidence: number
  ): 'high' | 'medium' | 'low' {
    if (!isLookingAtScreen || detectionConfidence < 0.5) {
      return 'low';
    }
    
    const positiveEmotions = emotions.happy + emotions.surprised;
    const negativeEmotions = emotions.sad + emotions.angry + emotions.fearful;
    const neutralEmotion = emotions.neutral;
    
    if (positiveEmotions > 0.6) {
      return 'high';
    } else if (neutralEmotion > 0.7 || negativeEmotions > 0.5) {
      return 'low';
    }
    
    return 'medium';
  }
  
  /**
   * Detect indicators that child might be struggling
   */
  private detectStrugglingIndicators(
    emotions: EmotionData,
    isLookingAtScreen: boolean,
    engagementLevel: string
  ): string[] {
    const indicators: string[] = [];
    
    // Check for frustration
    if (emotions.angry > 0.3 || emotions.disgusted > 0.3) {
      indicators.push('frustration');
    }
    
    // Check for confusion
    if (emotions.surprised > 0.4 && emotions.fearful > 0.2) {
      indicators.push('confusion');
    }
    
    // Check for sadness/overwhelm
    if (emotions.sad > 0.3) {
      indicators.push('overwhelm');
    }
    
    // Check for disengagement
    if (!isLookingAtScreen) {
      indicators.push('looking_away');
    }
    
    if (engagementLevel === 'low') {
      indicators.push('low_engagement');
    }
    
    // Check for processing (high neutral with focus)
    if (emotions.neutral > 0.8 && isLookingAtScreen) {
      indicators.push('processing');
    }
    
    return indicators;
  }
  
  /**
   * Analyze emotion history to detect patterns
   */
  static analyzeEmotionHistory(history: EmotionAnalysis[]): StrugglingSignals {
    const recentEmotions = history.slice(-5); // Last 5 readings
    
    if (recentEmotions.length < 3) {
      return {
        frustration: false,
        confusion: false,
        disengagement: false,
        lowEngagement: false,
        frequentLookingAway: false,
        prolongedNeutral: false
      };
    }
    
    return {
      frustration: recentEmotions.filter(e => 
        e.currentEmotion === 'angry' || e.currentEmotion === 'disgusted'
      ).length >= 2,
      
      confusion: recentEmotions.filter(e => 
        e.currentEmotion === 'surprised' || e.currentEmotion === 'fearful'
      ).length >= 2,
      
      disengagement: recentEmotions.filter(e => !e.isLookingAtScreen).length >= 3,
      
      lowEngagement: recentEmotions.filter(e => e.engagementLevel === 'low').length >= 3,
      
      frequentLookingAway: recentEmotions.filter(e => 
        e.strugglingIndicators.includes('looking_away')
      ).length >= 3,
      
      prolongedNeutral: recentEmotions.filter(e => 
        e.currentEmotion === 'neutral'
      ).length >= 4
    };
  }
  
  /**
   * Generate supportive feedback based on emotion analysis
   */
  static generateEmotionFeedback(
    analysis: EmotionAnalysis,
    strugglingSignals: StrugglingSignals
  ): string | null {
    // If processing (concentrated look)
    if (analysis.strugglingIndicators.includes('processing')) {
      return "I can see you're thinking hard! Take your time.";
    }
    
    // If frustrated
    if (strugglingSignals.frustration || analysis.strugglingIndicators.includes('frustration')) {
      return "I can see this is tricky! Let's try it together.";
    }
    
    // If confused
    if (strugglingSignals.confusion || analysis.strugglingIndicators.includes('confusion')) {
      return "You look a bit unsure - would you like me to explain differently?";
    }
    
    // If looking away frequently
    if (strugglingSignals.frequentLookingAway) {
      return "I notice you're looking away - do you need a break?";
    }
    
    // If low engagement
    if (strugglingSignals.lowEngagement) {
      return "Let's make this more fun! What interests you most?";
    }
    
    // If highly engaged
    if (analysis.engagementLevel === 'high') {
      return "You're doing amazing! I love your enthusiasm!";
    }
    
    return null;
  }
}