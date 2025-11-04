import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Calendar, Chrome, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssessmentChoice, setShowAssessmentChoice] = useState(false);
  
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await signUp(
        formData.email, 
        formData.password, 
        formData.name, 
        parseInt(formData.age)
      );
      
      toast({
        title: "Welcome to Chirp!",
        description: "Your account has been created successfully.",
      });
      
      // Show assessment choice
      setShowAssessmentChoice(true);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      
      toast({
        title: "Welcome to Chirp!",
        description: "Please complete your profile to get started.",
      });
      
      // Navigate to onboarding to collect age information
      navigate('/onboarding');
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      setError('Failed to sign up with Google. Please try again.');
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

  // Show assessment choice after successful signup
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
          <h1 className="text-4xl font-bold text-orange-500 mb-2">🐦 Chirp</h1>
          <p className="text-gray-600">Start your communication journey</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join Chirp and learn with friendly bird characters</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
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
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-orange-500 hover:text-orange-600">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}