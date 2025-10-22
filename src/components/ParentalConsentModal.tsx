import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Camera, Brain, BarChart3, Lock } from 'lucide-react';
import { ParentalConsent } from '@/types/emotion';

interface ParentalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: ParentalConsent) => void;
  childName?: string;
}

export const ParentalConsentModal: React.FC<ParentalConsentModalProps> = ({
  isOpen,
  onClose,
  onConsent,
  childName = 'your child',
}) => {
  const [parentName, setParentName] = useState('');
  const [consentFeatures, setConsentFeatures] = useState({
    facialDetection: false,
    emotionTracking: false,
    dataAnalytics: false,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleSubmit = () => {
    if (!parentName || !agreedToTerms) {
      return;
    }
    
    const consent: ParentalConsent = {
      hasConsent: true,
      consentDate: new Date(),
      consentedBy: parentName,
      features: consentFeatures,
    };
    
    onConsent(consent);
  };
  
  const allFeaturesChecked = Object.values(consentFeatures).every(v => v);
  const canSubmit = parentName && agreedToTerms && Object.values(consentFeatures).some(v => v);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Parental Consent for Enhanced Features</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Chirp can use optional features to better support {childName}'s learning journey. 
            Your consent is required to enable these privacy-focused features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-6">
          {/* Privacy Promise */}
          <Alert className="border-green-200 bg-green-50">
            <Lock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Our Privacy Promise:</strong> All processing happens locally on your device. 
              No videos or images are ever stored or sent to servers. Only anonymous emotion 
              patterns are saved to track progress.
            </AlertDescription>
          </Alert>
          
          {/* Feature Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">Choose which features to enable:</h3>
            
            {/* Facial Detection */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="facial"
                checked={consentFeatures.facialDetection}
                onCheckedChange={(checked) => 
                  setConsentFeatures(prev => ({ ...prev, facialDetection: !!checked }))
                }
              />
              <div className="flex-1">
                <Label htmlFor="facial" className="flex items-center gap-2 cursor-pointer">
                  <Camera className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Facial Expression Detection</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Uses the camera to detect when {childName} might be confused, frustrated, or needs help. 
                  Enables real-time support without requiring verbal communication.
                </p>
              </div>
            </div>
            
            {/* Emotion Tracking */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="emotion"
                checked={consentFeatures.emotionTracking}
                onCheckedChange={(checked) => 
                  setConsentFeatures(prev => ({ ...prev, emotionTracking: !!checked }))
                }
              />
              <div className="flex-1">
                <Label htmlFor="emotion" className="flex items-center gap-2 cursor-pointer">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Emotion Recognition & Support</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzes emotional patterns to provide timely encouragement and adjust difficulty. 
                  Helps build emotional awareness and self-regulation skills.
                </p>
              </div>
            </div>
            
            {/* Data Analytics */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id="analytics"
                checked={consentFeatures.dataAnalytics}
                onCheckedChange={(checked) => 
                  setConsentFeatures(prev => ({ ...prev, dataAnalytics: !!checked }))
                }
              />
              <div className="flex-1">
                <Label htmlFor="analytics" className="flex items-center gap-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Progress Analytics</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Tracks engagement patterns and learning progress over time. 
                  Provides insights to help you and teachers better support {childName}.
                </p>
              </div>
            </div>
          </div>
          
          {/* What We Collect */}
          <div className="space-y-2">
            <Button
              variant="link"
              onClick={() => setShowDetails(!showDetails)}
              className="p-0 h-auto font-medium"
            >
              {showDetails ? '▼' : '▶'} What information is collected?
            </Button>
            
            {showDetails && (
              <div className="ml-4 space-y-2 text-sm text-muted-foreground">
                <p><strong>We collect:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Emotion labels (happy, confused, focused) - no images</li>
                  <li>Engagement levels during conversations</li>
                  <li>Times when support was needed</li>
                  <li>Progress through learning levels</li>
                </ul>
                <p className="mt-2"><strong>We NEVER collect:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Video recordings or screenshots</li>
                  <li>Facial images or biometric data</li>
                  <li>Personal identifying information from video</li>
                  <li>Any data without explicit consent</li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Parent Information */}
          <div className="space-y-2">
            <Label htmlFor="parent-name">Parent/Guardian Name *</Label>
            <Input
              id="parent-name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I understand and agree that:
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>These features are optional and can be disabled anytime</li>
                <li>All video processing happens locally on this device</li>
                <li>Only anonymous emotion data is stored for progress tracking</li>
                <li>My child can always choose to turn off the camera</li>
                <li>This consent can be withdrawn at any time</li>
              </ul>
            </Label>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="sm:ml-auto"
          >
            {allFeaturesChecked ? 'Enable All Features' : 'Enable Selected Features'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};