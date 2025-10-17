import { Timestamp } from 'firebase/firestore';

// User related types
export interface User {
  id?: string;
  name: string;
  age: number;
  created_at: Timestamp;
  current_level_id: string | null;
  total_xp: number;
  streak_count: number;
  last_active_date: Timestamp;
  active_bird_id: string;
}

// Learning path types
export interface LearningPath {
  id?: string;
  name: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
}

// Level types
export interface Level {
  id?: string;
  path_id: string;
  level_number: number;
  name: string;
  description: string;
  bird_character: string;
  xp_reward: number;
  unlock_requirement: number;
  conversation_topics: string[];
}

// Message types
export interface Message {
  sender: 'user' | 'bird';
  text: string;
  timestamp: Timestamp;
  audio_url?: string;
  tone?: string;
  pronunciation_score?: number;
}

// Conversation types
export interface Conversation {
  id?: string;
  user_id: string;
  level_id: string;
  messages: Message[];
  started_at: Timestamp;
  completed_at?: Timestamp;
  score?: number;
  feedback?: string;
}

// User progress types
export interface UserProgress {
  id?: string;
  user_id: string;
  level_id: string;
  status: 'locked' | 'current' | 'completed';
  stars_earned: number;
  completed_at?: Timestamp;
}

// Skills types
export interface Skill {
  id?: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface UserSkill {
  id?: string;
  user_id: string;
  skill_id: string;
  progress_percentage: number;
  last_updated: Timestamp;
}

// Achievement types
export interface Achievement {
  id?: string;
  name: string;
  description: string;
  icon: string;
  unlock_criteria: {
    type: string;
    value: number;
  };
}

export interface UserAchievement {
  id?: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Timestamp;
}

// Bird collection types
export interface BirdCollectionItem {
  id?: string;
  user_id: string;
  bird_id: string;
  bird_name: string;
  is_active: boolean;
  unlocked_at: Timestamp;
  conversations_count?: number;
}

// Bird character types
export interface BirdCharacter {
  id?: string;
  name: string;
  personality: string;
  system_prompt: string;
  specialties: string[];
  emoji: string;
  unlock_level?: number;
}

// Assessment types
export interface AssessmentQuestion {
  id?: string;
  type: 'voice' | 'multiple_choice' | 'emotion_recognition' | 'ordering';
  content: string;
  options?: string[];
  correct_answer?: string | string[];
  scoring_rules: {
    skill: string;
    weight: number;
  }[];
}

export interface AssessmentResult {
  id?: string;
  user_id: string;
  responses: {
    question_id: string;
    answer: string | string[];
    audio_url?: string;
    score: number;
  }[];
  skill_scores: {
    greeting: number;
    turn_taking: number;
    emotion_recognition: number;
    listening: number;
    expression: number;
  };
  assigned_path: string;
  starting_level: string;
  completed_at: Timestamp;
}

// Daily challenge types
export interface DailyChallenge {
  id?: string;
  date: string; // YYYY-MM-DD format
  description: string;
  xp_reward: number;
  skill_focus: string;
}

export interface UserDailyChallenge {
  id?: string;
  user_id: string;
  challenge_id: string;
  completed_at: Timestamp;
}

// Leaderboard types
export interface LeaderboardEntry {
  id?: string;
  user_id: string;
  display_name: string; // First name + last initial
  total_xp: number;
  rank: number;
  last_updated: Timestamp;
}