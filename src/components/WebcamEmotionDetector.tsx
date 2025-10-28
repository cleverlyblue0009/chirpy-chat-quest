import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceDetectionService } from '@/lib/emotion/faceDetection';
import { EmotionAnalysis, CameraPermissionState, WebcamConfig } from '@/types/emotion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle, Smile, Frown, Meh, Move } from 'lucide-react';
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
  detectionInterval: 2000,
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

  const [cameraState, setCameraState] = useState<CameraPermissionState>({ status: 'prompt' });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [webcamConfig, setWebcamConfig] = useState<WebcamConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    faceServiceRef.current = FaceDetectionService.getInstance();
  }, []);

  useEffect(() => {
    onPermissionChange?.(cameraState);
  }, [cameraState, onPermissionChange]);

  const startDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    const detectEmotions = async () => {
      if (!faceServiceRef.current || !videoRef.current) {
        console.warn('⚠️ Detection skipped - ', {
          hasService: !!faceServiceRef.current,
          hasVideo: !!videoRef.current,
        });
        return;
      }

      try {
        console.log('🔍 Detecting emotions from video...');
        const analysis = await faceServiceRef.current.detectEmotions(videoRef.current);
        
        if (analysis) {
          console.log('✅ Emotion detected:', analysis);
          setCurrentEmotion(analysis);
          onEmotionDetected?.(analysis);
        } else {
          console.warn('⚠️ No emotion analysis returned');
        }
      } catch (error) {
        console.error('❌ Error during emotion detection:', error);
      }
    };

    detectEmotions();
    detectionIntervalRef.current = setInterval(detectEmotions, webcamConfig.detectionInterval);
  }, [webcamConfig.enabled, webcamConfig.detectionInterval, onEmotionDetected]);

  const startCamera = useCallback(async () => {
    if (!faceServiceRef.current) {
      console.error('❌ Face detection service not initialized');
      setCameraState({
        status: 'denied',
        error: 'Face detection service not initialized',
      });
      return;
    }

    try {
      console.log('⚙️ Starting camera initialization...');
      setCameraState({ status: 'checking' });
      
      // First, check if we have camera permissions
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('📹 Camera permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            throw new Error('Camera permission was previously denied. Please allow camera access in your browser settings.');
          }
        } catch (permErr) {
          console.warn('⚠️ Could not query camera permission:', permErr);
          // Continue anyway, the getUserMedia call will handle permissions
        }
      }
      
      console.log('⚙️ Loading face detection models...');
      await faceServiceRef.current.loadModels();
      console.log('✅ Models loaded successfully');

      console.log('🎥 Requesting camera access...');
      const stream = await faceServiceRef.current.requestCameraAccess();
      
      if (!stream) {
        throw new Error('No camera stream returned. Please ensure your camera is connected and working.');
      }
      
      console.log('✅ Got camera stream');

      // Wait for video element to be available
      let video = videoRef.current;
      let retries = 0;
      
      while (!video && retries < 15) {
        console.warn(`⚠️ Video element not found, retrying... (${retries + 1}/15)`);
        await new Promise(resolve => setTimeout(resolve, 200));
        video = videoRef.current;
        retries++;
      }
      
      if (!video) {
        console.error('❌ Video element not found after retries.');
        // Stop the stream to avoid leaks
        stream.getTracks().forEach(track => track.stop());
        setCameraState({
          status: 'denied',
          error: 'Video element not available. Please refresh the page and try again.',
        });
        return;
      }
      
      console.log('✅ Video element found');

      // Assign stream to video element
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');

      console.log('🎞️ Configuring video stream...');

      // Wait for video to be ready and start playing
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video playback timeout after 10 seconds'));
          }, 10000);

          const playVideo = async () => {
            try {
              await video.play();
              console.log('✅ Video playback started successfully');
              clearTimeout(timeout);
              resolve();
            } catch (err) {
              console.warn('⚠️ video.play() failed, retrying...', err);
              setTimeout(playVideo, 300);
            }
          };

          if (video.readyState >= 2) {
            console.log('📹 Video ready, starting playback...');
            playVideo();
          } else {
            console.log('⏳ Waiting for video metadata...');
            video.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded');
              playVideo();
            };
          }
        });
      } catch (playError) {
        console.error('❌ Video playback error:', playError);
        throw new Error('Failed to start video playback. Please try again.');
      }

      // Verify stream tracks
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        console.log('🎬 Active video track:', tracks[0].label);
        console.log('📐 Video track settings:', tracks[0].getSettings());
      } else {
        console.error('❌ No active video track found.');
        throw new Error('No video track available from camera.');
      }

      // Camera ready
      setWebcamConfig((prev) => ({ ...prev, enabled: true }));
      setCameraState({ status: 'granted' });
      console.log('✅ Camera fully initialized and ready');

      // Start detection loop
      console.log('🧠 Starting emotion detection loop in 1 second...');
      setTimeout(() => {
        console.log('▶️ Emotion detection loop started');
        startDetectionLoop();
      }, 1000);
    } catch (error: any) {
      console.error('🚫 Camera initialization error:', error);

      let errorMessage = 'Camera access was denied or unavailable';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission was denied. Please click the camera icon in your browser\'s address bar and allow access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera doesn\'t support required settings. Try a different camera.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setCameraState({ status: 'denied', error: errorMessage });
      
      // Clean up any stream that might have been created
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [startDetectionLoop]);

  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    faceServiceRef.current?.stopCameraStream();

    if (videoRef.current) videoRef.current.srcObject = null;

    setWebcamConfig((prev) => ({ ...prev, enabled: false }));
    setCurrentEmotion(null);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const toggleCamera = useCallback(async () => {
    if (webcamConfig.enabled) {
      stopCamera();
    } else {
      // Ensure video element is mounted before starting camera
      if (!videoRef.current) {
        console.warn('⚠️ Video element not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      await startCamera();
    }
  }, [webcamConfig.enabled, stopCamera, startCamera]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.initialX + deltaX,
      y: dragRef.current.initialY + deltaY,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={cn('relative', className, isDragging && 'cursor-grabbing')}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
      }}
    >
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

      <Card className={cn('overflow-hidden transition-all duration-300', isMinimized && 'w-48')}>
        <div className="flex items-center justify-between p-2 bg-muted/50">
          <div 
            className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-1"
            onMouseDown={handleMouseDown}
          >
            <Move className="h-3 w-3 text-muted-foreground" />
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
            {webcamConfig.enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideo(!showVideo)}
                className="h-7 w-7 p-0"
              >
                {showVideo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            )}

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

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCamera}
              className={cn('h-7 w-7 p-0', webcamConfig.enabled && 'text-green-600')}
              disabled={cameraState.status === 'checking'}
            >
              {webcamConfig.enabled ? <Camera className="h-3 w-3" /> : <CameraOff className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-2">
            {/* Video element always in DOM but hidden when not in use */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '320px',
                height: '240px',
                backgroundColor: 'black',
                borderRadius: '12px',
                objectFit: 'cover',
                display: webcamConfig.enabled && showVideo ? 'block' : 'none',
              }}
            />

            {webcamConfig.enabled && showVideo && currentEmotion && (
              <div className="absolute bottom-4 left-2 right-2 flex items-center justify-between pointer-events-none">
                <div className="bg-black/80 text-white px-2 py-1 rounded-md flex items-center gap-2 shadow-lg">
                  <span className="text-lg">
                    {EMOTION_EMOJIS[currentEmotion.currentEmotion] || '🤔'}
                  </span>
                  <span className="text-xs font-medium">
                    {currentEmotion.currentEmotion}
                  </span>
                </div>

                <div className="bg-black/80 text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                  {getEngagementIndicator()}
                  <span className="text-xs capitalize">{currentEmotion.engagementLevel}</span>
                </div>
              </div>
            )}

            {!webcamConfig.enabled && (
              <div className="flex flex-col items-center justify-center min-h-[160px] text-center px-4">
                <CameraOff className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Turn on camera to help me understand you better
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={startCamera}
                  disabled={cameraState.status === 'checking'}
                  className="mb-2"
                >
                  {cameraState.status === 'checking' ? (
                    <>
                      <span className="animate-pulse">⏳ Loading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Enable Camera
                    </>
                  )}
                </Button>
                {cameraState.error && (
                  <Alert className="mt-2 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-xs text-red-800">
                      {cameraState.error}
                    </AlertDescription>
                  </Alert>
                )}
                {cameraState.status === 'denied' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Look for the camera icon in your browser's address bar
                  </p>
                )}
              </div>
            )}

          </div>
        )}

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
            {!webcamConfig.enabled && <CameraOff className="h-4 w-4 text-muted-foreground" />}
          </div>
        )}
      </Card>
    </div>
  );
};