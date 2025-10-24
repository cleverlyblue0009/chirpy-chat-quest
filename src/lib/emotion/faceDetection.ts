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
    if (this.modelsLoaded) {
      console.log('✅ Face detection models already loaded');
      return;
    }
    
    try {
      console.log('📦 Loading face detection models from CDN...');
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/models';
      
      console.log('⏳ Loading tinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('✅ tinyFaceDetector loaded');
      
      console.log('⏳ Loading faceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ faceLandmark68Net loaded');
      
      console.log('⏳ Loading faceRecognitionNet...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ faceRecognitionNet loaded');
      
      console.log('⏳ Loading faceExpressionNet...');
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      console.log('✅ faceExpressionNet loaded');
      
      this.modelsLoaded = true;
      console.log('✅ All face detection models loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load face detection models:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      this.modelsLoaded = false;
      throw new Error(`Failed to load face detection models. Please check your internet connection and try again. Error: ${(error as Error).message}`);
    }
  }
  
  /**
   * Request camera permission and get stream
   */
  async requestCameraAccess(): Promise<MediaStream> {
    try {
      console.log('🎥 Requesting camera access...');
      
      // Check browser compatibility
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices is not available. Are you using HTTPS?');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser. Please update your browser.');
      }
      
      console.log('⏳ Prompting user for camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      const videoTracks = stream.getVideoTracks();
      console.log('✅ Camera access granted');
      console.log(`📹 Video tracks: ${videoTracks.length}`);
      if (videoTracks.length > 0) {
        console.log(`📹 Camera: ${videoTracks[0].label}`);
        console.log(`📹 Settings:`, videoTracks[0].getSettings());
      }
      
      this.detectionStream = stream;
      return stream;
    } catch (error: any) {
      console.error('❌ Camera access error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      // Provide helpful error messages
      if (error.name === 'NotAllowedError') {
        console.error('🚫 Camera permission was denied by user or browser policy');
      } else if (error.name === 'NotFoundError') {
        console.error('🚫 No camera device found');
      } else if (error.name === 'NotReadableError') {
        console.error('🚫 Camera is already in use by another application');
      } else if (error.name === 'OverconstrainedError') {
        console.error('🚫 Camera constraints cannot be satisfied');
      } else if (error.name === 'SecurityError') {
        console.error('🚫 Security error - ensure you are using HTTPS');
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
   * Detect face and emotions from video element (improved + reliable)
   */
  async detectEmotions(videoElement: HTMLVideoElement): Promise<EmotionAnalysis | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    // 🟢 Ensure video frame is ready before processing
    if (!videoElement || videoElement.readyState < 2) {
      console.warn('⏳ Video not ready yet for detection');
      return null;
    }

    try {
      // ⚡ Run detection on current video frame
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // 🚫 No face detected
      if (!detection) {
        console.log('😶 No face detected in current frame');
        return null;
      }

      // ✅ Extract emotions
      const emotions = detection.expressions as EmotionData;

      // 🔍 Dominant emotion
      const dominantEmotion = this.getDominantEmotion(emotions);

      // 👁️ Estimate attention
      const isLookingAtScreen = detection.detection.score > 0.7;

      // 📊 Engagement level
      const engagementLevel = this.calculateEngagementLevel(
        emotions,
        isLookingAtScreen,
        detection.detection.score
      );

      // ⚠️ Detect struggling indicators
      const strugglingIndicators = this.detectStrugglingIndicators(
        emotions,
        isLookingAtScreen,
        engagementLevel
      );

      // 🧠 Simplified landmarks
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

    if (emotions.angry > 0.3 || emotions.disgusted > 0.3) {
      indicators.push('frustration');
    }
    if (emotions.surprised > 0.4 && emotions.fearful > 0.2) {
      indicators.push('confusion');
    }
    if (emotions.sad > 0.3) {
      indicators.push('overwhelm');
    }
    if (!isLookingAtScreen) {
      indicators.push('looking_away');
    }
    if (engagementLevel === 'low') {
      indicators.push('low_engagement');
    }
    if (emotions.neutral > 0.8 && isLookingAtScreen) {
      indicators.push('processing');
    }

    return indicators;
  }

  /**
   * Analyze emotion history to detect patterns
   */
  static analyzeEmotionHistory(history: EmotionAnalysis[]): StrugglingSignals {
    const recentEmotions = history.slice(-5);

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
    if (analysis.strugglingIndicators.includes('processing')) {
      return "I can see you're thinking hard! Take your time.";
    }
    if (strugglingSignals.frustration || analysis.strugglingIndicators.includes('frustration')) {
      return "I can see this is tricky! Let's try it together.";
    }
    if (strugglingSignals.confusion || analysis.strugglingIndicators.includes('confusion')) {
      return "You look a bit unsure - would you like me to explain differently?";
    }
    if (strugglingSignals.frequentLookingAway) {
      return "I notice you're looking away - do you need a break?";
    }
    if (strugglingSignals.lowEngagement) {
      return "Let's make this more fun! What interests you most?";
    }
    if (analysis.engagementLevel === 'high') {
      return "You're doing amazing! I love your enthusiasm!";
    }

    return null;
  }
}
