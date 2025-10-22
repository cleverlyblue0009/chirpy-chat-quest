/**
 * Types for emotion detection and analysis
 */

export interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FacialLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
  jawOutline: Array<{ x: number; y: number }>;
}

export interface EmotionAnalysis {
  currentEmotion: string;
  confidence: number;
  isLookingAtScreen: boolean;
  engagementLevel: 'high' | 'medium' | 'low';
  strugglingIndicators: string[];
  needsSupport: boolean;
  timestamp: number;
  rawEmotions?: EmotionData;
  facialLandmarks?: FacialLandmarks;
}

export interface EmotionHistory {
  analyses: EmotionAnalysis[];
  averageEngagement: number;
  supportTriggers: number;
  processingTimeAverage: number;
}

export interface CameraPermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'checking';
  error?: string;
}

export interface WebcamConfig {
  enabled: boolean;
  showPreview: boolean;
  detectionInterval: number; // milliseconds
  privacyMode: boolean; // true = no video storage, only local analysis
}

export interface ParentalConsent {
  hasConsent: boolean;
  consentDate?: Date;
  consentedBy?: string;
  features: {
    facialDetection: boolean;
    emotionTracking: boolean;
    dataAnalytics: boolean;
  };
}

export interface StrugglingSignals {
  frustration: boolean;
  confusion: boolean;
  disengagement: boolean;
  lowEngagement: boolean;
  frequentLookingAway: boolean;
  prolongedNeutral: boolean;
}

export interface EmotionFeedback {
  message: string;
  type: 'encouragement' | 'support' | 'hint' | 'break_suggestion';
  timestamp: number;
}