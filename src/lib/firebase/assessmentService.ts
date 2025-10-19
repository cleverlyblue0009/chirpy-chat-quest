import { 
  collection, 
  doc, 
  getDocs, 
  setDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AssessmentQuestion {
  id: string;
  type: 'voice' | 'multiple_choice' | 'emotion_recognition' | 'ordering';
  content: string;
  instructions?: string;
  options?: string[];
  correctAnswer?: string | string[];
  audioUrl?: string;
  order: number;
}

export interface AssessmentResult {
  userId: string;
  answers: Record<string, any>;
  score: number;
  assignedPath: string;
  completedAt: Timestamp;
}

/**
 * Fetch assessment questions from Firebase
 */
export async function fetchAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  try {
    const questionsRef = collection(db, 'assessment_questions');
    const q = query(questionsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    const questions: AssessmentQuestion[] = [];
    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      } as AssessmentQuestion);
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    throw error;
  }
}

/**
 * Save assessment results to Firebase
 */
export async function saveAssessmentResult(
  userId: string,
  answers: Record<string, any>,
  score: number,
  assignedPath: string
): Promise<void> {
  try {
    const resultDoc: AssessmentResult = {
      userId,
      answers,
      score,
      assignedPath,
      completedAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'assessment_results', userId), resultDoc);
  } catch (error) {
    console.error('Error saving assessment result:', error);
    throw error;
  }
}