import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  updateProfile as firebaseUpdateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserService } from '@/lib/firebase/userService';
import { User } from '@/types/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, age: number) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to LOCAL (persists even after browser closes)
    setPersistence(auth, browserLocalPersistence);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const profile = await UserService.getUser(user.uid);
          setUserProfile(profile);
          
          // Update streak if it's a new day
          await UserService.updateStreak(user.uid);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string, age: number) => {
    try {
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await firebaseUpdateProfile(user, { displayName: name });
      
      // Create user profile in Firestore
      await UserService.createUser(user.uid, {
        name,
        age
      });
      
      // Fetch the created profile
      const profile = await UserService.getUser(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile
      const profile = await UserService.getUser(user.uid);
      setUserProfile(profile);
      
      // Update streak
      await UserService.updateStreak(user.uid);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      let profile = await UserService.getUser(user.uid);
      
      if (!profile) {
        // New user - create profile with default values
        // Note: You might want to show an onboarding flow to get age
        await UserService.createUser(user.uid, {
          name: user.displayName || 'User',
          age: 0 // This should be collected through onboarding
        });
        
        profile = await UserService.getUser(user.uid);
      } else {
        // Existing user - update streak
        await UserService.updateStreak(user.uid);
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      await UserService.updateUser(currentUser.uid, data);
      
      // Refresh user profile
      const updatedProfile = await UserService.getUser(currentUser.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};