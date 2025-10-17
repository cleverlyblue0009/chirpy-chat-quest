import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AssessmentQuestion, AssessmentResult } from '@/types/firebase';
import { UserService } from '../firebase/userService';

export const assessmentApi = {
  // Get assessment questions
  async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
    try {
      const questionsRef = collection(db, 'assessment_questions');
      const snapshot = await getDocs(questionsRef);
      
      if (snapshot.empty) {
        // Return default questions if none in database
        return this.getDefaultQuestions();
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AssessmentQuestion));
    } catch (error) {
      console.error('Error fetching assessment questions:', error);
      return this.getDefaultQuestions();
    }
  },

  // Submit assessment and calculate results
  async submitAssessment(userId: string, answers: { [key: string]: any }): Promise<{
    assignedPath: string;
    startingLevel: string;
    skillScores: any;
  }> {
    try {
      // Check if assessment already exists
      const existingResult = await this.getUserAssessmentResult(userId);
      if (existingResult) {
        throw new Error('Assessment already completed');
      }
      
      // Calculate skill scores based on answers
      const skillScores = this.calculateSkillScores(answers);
      
      // Determine learning path based on scores
      const assignedPath = this.determineLearningPath(skillScores);
      
      // Get the starting level for this path
      const startingLevel = await this.getStartingLevel(assignedPath);
      
      // Save assessment result
      const assessmentResult: Omit<AssessmentResult, 'id'> = {
        user_id: userId,
        responses: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer: answer.text || answer,
          audio_url: answer.audioUrl,
          score: this.scoreAnswer(questionId, answer)
        })),
        skill_scores: skillScores,
        assigned_path: assignedPath,
        starting_level: startingLevel,
        completed_at: Timestamp.now()
      };
      
      await setDoc(doc(collection(db, 'assessment_results')), assessmentResult);
      
      // Update user profile with assessment results
      await UserService.updateUser(userId, {
        current_level_id: startingLevel
      });
      
      // Initialize user progress for the assigned path
      await this.initializeUserProgress(userId, assignedPath);
      
      return {
        assignedPath,
        startingLevel,
        skillScores
      };
    } catch (error) {
      console.error('Error submitting assessment:', error);
      throw error;
    }
  },

  // Get user's assessment result
  async getUserAssessmentResult(userId: string): Promise<AssessmentResult | null> {
    try {
      const resultsRef = collection(db, 'assessment_results');
      const q = query(resultsRef, where('user_id', '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as AssessmentResult;
    } catch (error) {
      console.error('Error fetching assessment result:', error);
      return null;
    }
  },

  // Calculate skill scores from answers
  calculateSkillScores(answers: { [key: string]: any }): {
    greeting: number;
    turn_taking: number;
    emotion_recognition: number;
    listening: number;
    expression: number;
  } {
    const scores = {
      greeting: 0,
      turn_taking: 0,
      emotion_recognition: 0,
      listening: 0,
      expression: 0
    };
    
    // Score each answer based on question type and content
    // Q1: Voice greeting - tests greeting and expression
    if (answers.q1) {
      const text = (answers.q1.text || '').toLowerCase();
      if (text.includes('hello') || text.includes('hi')) {
        scores.greeting += 40;
      }
      if (text.includes('name') || text.includes('i am') || text.includes("i'm")) {
        scores.expression += 30;
      }
    }
    
    // Q2: Multiple choice greeting - tests greeting knowledge
    if (answers.q2 === 'Nice to meet you') {
      scores.greeting += 40;
      scores.turn_taking += 20;
    }
    
    // Q3: Emotion recognition
    if (answers.q3 === 'Happy') {
      scores.emotion_recognition += 50;
    }
    
    // Q4: Voice response - tests turn-taking and listening
    if (answers.q4) {
      const text = (answers.q4.text || '').toLowerCase();
      if (text.includes('good') || text.includes('fine') || text.includes('well')) {
        scores.turn_taking += 30;
        scores.listening += 30;
      }
    }
    
    // Q5: Ordering - tests turn-taking and listening
    if (answers.q5) {
      const correct = ['Say hello', 'Ask a question', 'Listen to answer', 'Say goodbye'];
      const userAnswer = answers.q5;
      if (JSON.stringify(userAnswer) === JSON.stringify(correct)) {
        scores.turn_taking += 30;
        scores.listening += 30;
      }
    }
    
    // Q6: Empathy - tests emotion recognition and expression
    if (answers.q6 === 'Ask if they\'re okay') {
      scores.emotion_recognition += 30;
      scores.expression += 20;
    }
    
    // Normalize scores to 0-100
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.min(100, scores[key as keyof typeof scores]);
    });
    
    return scores;
  },

  // Score individual answer
  scoreAnswer(questionId: string, answer: any): number {
    const correctAnswers: { [key: string]: any } = {
      q2: 'Nice to meet you',
      q3: 'Happy',
      q5: ['Say hello', 'Ask a question', 'Listen to answer', 'Say goodbye'],
      q6: 'Ask if they\'re okay'
    };
    
    if (questionId === 'q1' || questionId === 'q4') {
      // Voice questions - score based on presence of content
      return answer.text && answer.text.length > 0 ? 70 : 0;
    }
    
    if (questionId === 'q5') {
      // Ordering question
      const correct = correctAnswers[questionId];
      return JSON.stringify(answer) === JSON.stringify(correct) ? 100 : 50;
    }
    
    // Multiple choice questions
    return answer === correctAnswers[questionId] ? 100 : 0;
  },

  // Determine learning path based on skill scores
  determineLearningPath(skillScores: { [key: string]: number }): string {
    const averageScore = Object.values(skillScores).reduce((a, b) => a + b, 0) / Object.keys(skillScores).length;
    
    if (averageScore < 40) {
      return 'forest_explorer'; // Beginner
    } else if (averageScore < 70) {
      return 'tree_climber'; // Intermediate
    } else {
      return 'sky_soarer'; // Advanced
    }
  },

  // Get starting level for a learning path
  async getStartingLevel(pathId: string): Promise<string> {
    try {
      const levelsRef = collection(db, 'levels');
      const q = query(
        levelsRef,
        where('path_id', '==', pathId),
        where('level_number', '==', 1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      
      // Fallback: get any level from this path
      const fallbackQuery = query(levelsRef, where('path_id', '==', pathId));
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      if (!fallbackSnapshot.empty) {
        return fallbackSnapshot.docs[0].id;
      }
      
      throw new Error('No levels found for path');
    } catch (error) {
      console.error('Error getting starting level:', error);
      // Return a default level ID
      return 'level_1';
    }
  },

  // Initialize user progress for assigned path
  async initializeUserProgress(userId: string, pathId: string): Promise<void> {
    try {
      const { ProgressService } = await import('../firebase/progressService');
      
      // Get all levels in this path
      const levelsRef = collection(db, 'levels');
      const q = query(levelsRef, where('path_id', '==', pathId));
      const snapshot = await getDocs(q);
      
      // Create progress entries
      let isFirst = true;
      for (const levelDoc of snapshot.docs) {
        await ProgressService.updateLevelProgress(
          userId,
          levelDoc.id,
          isFirst ? 'current' : 'locked'
        );
        isFirst = false;
      }
    } catch (error) {
      console.error('Error initializing user progress:', error);
    }
  },

  // Get default assessment questions
  getDefaultQuestions(): AssessmentQuestion[] {
    return [
      {
        type: 'voice',
        content: 'Say hello and tell me your name',
        scoring_rules: [
          { skill: 'greeting', weight: 40 },
          { skill: 'expression', weight: 30 }
        ]
      },
      {
        type: 'multiple_choice',
        content: 'What do you say when you meet someone new?',
        options: ['Goodbye', 'Nice to meet you', 'See you later', 'Go away'],
        correct_answer: 'Nice to meet you',
        scoring_rules: [
          { skill: 'greeting', weight: 40 },
          { skill: 'turn_taking', weight: 20 }
        ]
      },
      {
        type: 'emotion_recognition',
        content: 'How does this person feel? 😊',
        options: ['Happy', 'Sad', 'Angry', 'Scared'],
        correct_answer: 'Happy',
        scoring_rules: [
          { skill: 'emotion_recognition', weight: 50 }
        ]
      },
      {
        type: 'voice',
        content: 'Someone says "How are you?" What do you say back?',
        scoring_rules: [
          { skill: 'turn_taking', weight: 30 },
          { skill: 'listening', weight: 30 }
        ]
      },
      {
        type: 'ordering',
        content: 'Put these conversation steps in order',
        options: ['Say goodbye', 'Say hello', 'Ask a question', 'Listen to answer'],
        correct_answer: ['Say hello', 'Ask a question', 'Listen to answer', 'Say goodbye'],
        scoring_rules: [
          { skill: 'turn_taking', weight: 30 },
          { skill: 'listening', weight: 30 }
        ]
      },
      {
        type: 'multiple_choice',
        content: 'Your friend is crying. What should you do?',
        options: ['Laugh', 'Walk away', 'Ask if they\'re okay', 'Ignore them'],
        correct_answer: 'Ask if they\'re okay',
        scoring_rules: [
          { skill: 'emotion_recognition', weight: 30 },
          { skill: 'expression', weight: 20 }
        ]
      }
    ] as AssessmentQuestion[];
  },

  // Initialize default assessment questions in Firestore (for setup)
  async initializeDefaultAssessmentQuestions(): Promise<void> {
    try {
      const questions = this.getDefaultQuestions();
      const questionsRef = collection(db, 'assessment_questions');
      
      for (let i = 0; i < questions.length; i++) {
        await setDoc(doc(questionsRef, `q${i + 1}`), questions[i]);
      }
      
      console.log('Default assessment questions initialized successfully');
    } catch (error) {
      console.error('Error initializing assessment questions:', error);
      throw error;
    }
  }
};