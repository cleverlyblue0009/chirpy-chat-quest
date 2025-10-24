import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceDetectionService } from '@/lib/emotion/faceDetection';
import { EmotionAnalysis, CameraPermissionState, WebcamConfig } from '@/types/emotion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle, Smile, Frown, Meh } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebcamEmotionDetectorProps {
  onEmotionDetected?: (analysis: EmotionAnalysis) => void;
  onPermissionChange?: (state: CameraPermissionState) => void;
  config?: Partial<WebcamConfig>;
  className?: string;
  showPrivacyNotice?: boolean;
  minimizable?: boolean;
}

const DEFAULT_CONFIG: WebcamConfig = {
  enabled: false,
  showPreview: true,
  detectionInterval: 2000, // 2 seconds
  privacyMode: true,
};

const EMOTION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '🤢',
  surprised: '😮',
};

export const WebcamEmotionDetector: React.FC<WebcamEmotionDetectorProps> = ({
  onEmotionDetected,
  onPermissionChange,
  config = {},
  className,
  showPrivacyNotice = true,
  minimizable = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const faceServiceRef = useRef<FaceDetectionService>();
  
  const [cameraState, setCameraState] = useState<CameraPermissionState>({
    status: 'prompt',
  });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [webcamConfig, setWebcamConfig] = useState<WebcamConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });
  
  // Initialize face detection service
  useEffect(() => {
    faceServiceRef.current = FaceDetectionService.getInstance();
  }, []);
  
  // Handle permission changes
  useEffect(() => {
    onPermissionChange?.(cameraState);
  }, [cameraState, onPermissionChange]);
  
  // Detection loop
  const startDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    const detectEmotions = async () => {
      if (!faceServiceRef.current || !videoRef.current || !webcamConfig.enabled) {
        return;
      }
      
      const analysis = await faceServiceRef.current.detectEmotions(videoRef.current);
      
      if (analysis) {
        setCurrentEmotion(analysis);
        onEmotionDetected?.(analysis);
      }
    };
    
    // Initial detection
    detectEmotions();
    
    // Set up interval
    detectionIntervalRef.current = setInterval(detectEmotions, webcamConfig.detectionInterval);
  }, [webcamConfig.enabled, webcamConfig.detectionInterval, onEmotionDetected]);
  
  // Start camera and detection
  const startCamera = useCallback(async () => {
    // Check if face service is initialized
    if (!faceServiceRef.current) {
      console.error('Face detection service not initialized');
      setCameraState({
        status: 'denied',
        error: 'Face detection service not initialized',
      });
      return;
    }
    
    try {
      setCameraState({ status: 'checking' });
      
      // Load models first
      await faceServiceRef.current.loadModels();
      
      // Request camera access
      const stream = await faceServiceRef.current.requestCameraAccess();
      
      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            resolve();
            return;
          }
          
          const video = videoRef.current;
          
          // Check if metadata is already loaded
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            resolve();
            return;
          }
          
          // Set up event listeners
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video element error: ' + (e as any).message));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Timeout waiting for video metadata'));
          }, 5000);
        });
        
        // Ensure video is playing
        try {
          await videoRef.current.play();
          console.log('✅ Video is now playing');
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw new Error('Failed to play video: ' + (playError as Error).message);
        }
      }
      
      setCameraState({ status: 'granted' });
      setWebcamConfig(prev => ({ ...prev, enabled: true }));
      
      // Start detection loop
      startDetectionLoop();
    } catch (error: any) {
      console.error('Camera error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Camera access was denied or unavailable';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setCameraState({
        status: 'denied',
        error: errorMessage,
      });
    }
  }, [startDetectionLoop]);
  
  // Stop camera and detection
  const stopCamera = useCallback(() => {
    if (!faceServiceRef.current) return;
    
    // Stop detection loop
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Stop camera stream
    faceServiceRef.current.stopCameraStream();
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setWebcamConfig(prev => ({ ...prev, enabled: false }));
    setCurrentEmotion(null);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  // Toggle camera
  const toggleCamera = () => {
    if (webcamConfig.enabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };
  
  // Get engagement indicator
  const getEngagementIndicator = () => {
    if (!currentEmotion) return null;
    
    switch (currentEmotion.engagementLevel) {
      case 'high':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Frown className="h-4 w-4 text-orange-500" />;
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Privacy Notice */}
      {showPrivacyNotice && !webcamConfig.enabled && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy First:</strong> Camera helps me understand how you're feeling. 
            Video is analyzed locally on your device and never sent to servers. 
            You can turn it off anytime!
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Card */}
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        isMinimized && "w-48"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 bg-muted/50">
          <div className="flex items-center gap-2">
            {webcamConfig.enabled ? (
              <>
                <div className="relative">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 h-2 w-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="text-xs font-medium">Camera Active</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-gray-400 rounded-full" />
                <span className="text-xs font-medium text-muted-foreground">Camera Off</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Show/Hide Video Toggle */}
            {webcamConfig.enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideo(!showVideo)}
                className="h-7 w-7 p-0"
              >
                {showVideo ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Minimize Toggle */}
            {minimizable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0"
              >
                <span className="text-xs">{isMinimized ? '▶' : '▼'}</span>
              </Button>
            )}
            
            {/* Camera Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCamera}
              className={cn(
                "h-7 w-7 p-0",
                webcamConfig.enabled && "text-green-600"
              )}
            >
              {webcamConfig.enabled ? (
                <Camera className="h-3 w-3" />
              ) : (
                <CameraOff className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Content */}
        {!isMinimized && (
          <div className="p-2">
            {/* Video Preview */}
            {webcamConfig.enabled && showVideo && (
              <div className="relative mb-2">
                <video
                  ref={videoRef}
                  className="w-full h-32 object-cover rounded-md bg-black"
                  autoPlay
                  playsInline
                  muted
                  width="320"
                  height="240"
                />
                
                {/* Emotion Overlay */}
                {currentEmotion && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="bg-black/70 text-white px-2 py-1 rounded-md flex items-center gap-2">
                      <span className="text-lg">
                        {EMOTION_EMOJIS[currentEmotion.currentEmotion] || '🤔'}
                      </span>
                      <span className="text-xs">
                        {currentEmotion.currentEmotion} 
                        ({Math.round(currentEmotion.confidence * 100)}%)
                      </span>
                    </div>
                    
                    <div className="bg-black/70 text-white px-2 py-1 rounded-md flex items-center gap-1">
                      {getEngagementIndicator()}
                      <span className="text-xs">{currentEmotion.engagementLevel}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Status when camera is off */}
            {!webcamConfig.enabled && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <CameraOff className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Turn on camera to help me understand you better
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={startCamera}
                  className="mt-2"
                  disabled={cameraState.status === 'checking'}
                >
                  {cameraState.status === 'checking' ? 'Loading...' : 'Enable Camera'}
                </Button>
                {cameraState.error && (
                  <p className="text-xs text-red-500 mt-2">
                    {cameraState.error}
                  </p>
                )}
              </div>
            )}
            
            {/* Struggling Indicators */}
            {currentEmotion?.needsSupport && (
              <Alert className="mt-2">
                <AlertDescription className="text-xs">
                  I'm here to help! {currentEmotion.strugglingIndicators.includes('frustration') 
                    ? "Let's take it step by step." 
                    : "Take your time, you're doing great!"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* Minimized View */}
        {isMinimized && (
          <div className="p-2 flex items-center justify-center gap-2">
            {webcamConfig.enabled && currentEmotion && (
              <>
                <span className="text-lg">
                  {EMOTION_EMOJIS[currentEmotion.currentEmotion] || '🤔'}
                </span>
                {getEngagementIndicator()}
              </>
            )}
            {!webcamConfig.enabled && (
              <CameraOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};