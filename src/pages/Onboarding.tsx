import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Calendar, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Onboarding() {
  const [formData, setFormData] = useState({
    name: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { currentUser, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-fill name if available from Google
  React.useEffect(() => {
    if (currentUser?.displayName) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || ''
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name.');
      return false;
    }
    
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 4 || age > 18) {
      setError('Please enter a valid age between 4 and 18.');
      return false;
    }
    
    return true;
  };

  const [showAssessmentChoice, setShowAssessmentChoice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Update user profile with name and age
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age)
      });
      
      toast({
        title: "Profile completed!",
        description: "Choose how you'd like to start your learning journey.",
      });
      
      // Show assessment choice instead of navigating directly
      setShowAssessmentChoice(true);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAssessment = () => {
    navigate('/assessment');
  };

  const handleSkipAssessment = () => {
    toast({
      title: "Welcome to Chirp! 🎉",
      description: "Let's start learning!",
    });
    navigate('/');
  };

  const getBirdMessage = () => {
    const age = parseInt(formData.age);
    if (!age) return '';
    
    if (age <= 8) {
      return "Perfect! Ruby Robin is excited to be your friend! 🐦";
    } else if (age <= 12) {
      return "Wonderful! You'll love learning with our friendly birds! 🦜";
    } else {
      return "Great! Let's start your communication journey! 🦅";
    }
  };

  // Show assessment choice after profile completion
  if (showAssessmentChoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-blue-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
              <Sparkles className="h-10 w-10 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're All Set! 🎉</h1>
            <p className="text-gray-600">Choose how you'd like to begin your journey</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Ready to Start?</CardTitle>
              <CardDescription>
                Take a quick assessment to personalize your experience, or jump right in!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTakeAssessment}
                className="w-full" 
                size="lg"
              >
                Take Assessment 🎯
                <span className="ml-2">→</span>
              </Button>

              <Button 
                onClick={handleSkipAssessment}
                variant="outline"
                className="w-full" 
                size="lg"
              >
                Skip to Dashboard
              </Button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>💡 Tip:</strong> The assessment helps us understand your current level and create a personalized learning path. It only takes 2-3 minutes!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <Sparkles className="h-10 w-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Chirp!</h1>
          <p className="text-gray-600">Let's get to know you better</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us a bit about yourself so we can personalize your learning experience
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">What should we call you?</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This is how the birds will greet you
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">How old are you?</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    placeholder="4-18"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="pl-10"
                    min="4"
                    max="18"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll adjust the difficulty based on your age
                </p>
              </div>

              {formData.age && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    {getBirdMessage()}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  <>
                    Continue
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Next: Choose to take an assessment or start exploring
          </p>
        </div>
      </div>
    </div>
  );
}