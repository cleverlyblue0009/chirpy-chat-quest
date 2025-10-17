/**
 * Analyze pronunciation quality of recorded audio
 * This is a simplified version - in production, you'd use a service like Deepgram or Azure Speech
 */
export async function analyzePronunciation(audioBlob: Blob): Promise<number> {
  try {
    // In a real implementation, this would:
    // 1. Send audio to a pronunciation assessment API (Deepgram, Azure, etc.)
    // 2. Get back detailed pronunciation metrics
    // 3. Calculate an overall score
    
    // For now, we'll do a simple analysis based on audio properties
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Simple metrics
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate basic audio quality metrics
    let score = 70; // Base score
    
    // Check duration (not too short, not too long)
    if (duration >= 1 && duration <= 10) {
      score += 10;
    }
    
    // Check for silence/noise ratio
    const rms = calculateRMS(channelData);
    if (rms > 0.01 && rms < 0.5) {
      score += 10;
    }
    
    // Check for consistent volume (no major spikes or drops)
    const volumeConsistency = calculateVolumeConsistency(channelData);
    if (volumeConsistency > 0.7) {
      score += 10;
    }
    
    // Ensure score is between 0 and 100
    return Math.min(Math.max(score, 0), 100);
  } catch (error) {
    console.error('Error analyzing pronunciation:', error);
    // Return a default score if analysis fails
    return 75;
  }
}

/**
 * Calculate Root Mean Square (RMS) of audio signal
 */
function calculateRMS(channelData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < channelData.length; i++) {
    sum += channelData[i] * channelData[i];
  }
  return Math.sqrt(sum / channelData.length);
}

/**
 * Calculate volume consistency across the audio
 */
function calculateVolumeConsistency(channelData: Float32Array): number {
  const windowSize = Math.floor(channelData.length / 10);
  const volumes: number[] = [];
  
  for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
    const window = channelData.slice(i, i + windowSize);
    volumes.push(calculateRMS(window));
  }
  
  if (volumes.length === 0) return 0;
  
  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation means more consistent volume
  const consistency = 1 - (stdDev / mean);
  return Math.max(0, Math.min(1, consistency));
}

/**
 * Advanced pronunciation scoring (placeholder for API integration)
 * @param audioBlob The audio to analyze
 * @param referenceText The expected text
 * @returns Detailed pronunciation metrics
 */
export async function advancedPronunciationAnalysis(
  audioBlob: Blob,
  referenceText: string
): Promise<{
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  pronunciation: {
    word: string;
    score: number;
  }[];
}> {
  // This would integrate with a real pronunciation API
  // For now, return mock data
  
  const words = referenceText.split(' ');
  const wordScores = words.map(word => ({
    word,
    score: 70 + Math.random() * 30 // Random score between 70-100
  }));
  
  const overallScore = wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length;
  
  return {
    overallScore: Math.round(overallScore),
    accuracy: Math.round(overallScore * 0.9),
    fluency: Math.round(overallScore * 0.95),
    completeness: 100,
    pronunciation: wordScores
  };
}

/**
 * Get feedback message based on pronunciation score
 * @param score The pronunciation score (0-100)
 * @returns Encouraging feedback message
 */
export function getPronunciationFeedback(score: number): string {
  if (score >= 90) {
    return "Excellent pronunciation! You're speaking very clearly! 🌟";
  } else if (score >= 80) {
    return "Great job! Your pronunciation is really good! 🎉";
  } else if (score >= 70) {
    return "Good work! Keep practicing and you'll get even better! 👍";
  } else if (score >= 60) {
    return "Nice try! Let's practice this sound together. 😊";
  } else {
    return "Keep going! Every practice makes you better! 💪";
  }
}

/**
 * Calculate speaking pace (words per minute)
 * @param text The spoken text
 * @param duration Duration in seconds
 * @returns Words per minute
 */
export function calculateSpeakingPace(text: string, duration: number): number {
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = duration / 60;
  return Math.round(wordCount / minutes);
}

/**
 * Check if speaking pace is appropriate
 * @param wpm Words per minute
 * @param ageGroup Age group of the speaker
 * @returns Feedback about speaking pace
 */
export function evaluateSpeakingPace(
  wpm: number, 
  ageGroup: 'young' | 'middle' | 'older'
): {
  isAppropriate: boolean;
  feedback: string;
} {
  const targetRanges = {
    young: { min: 50, max: 100 },    // 4-8 years
    middle: { min: 80, max: 130 },   // 9-13 years
    older: { min: 100, max: 150 }    // 14-18 years
  };
  
  const range = targetRanges[ageGroup];
  
  if (wpm < range.min) {
    return {
      isAppropriate: false,
      feedback: "Try speaking a little faster - you're doing great!"
    };
  } else if (wpm > range.max) {
    return {
      isAppropriate: false,
      feedback: "Take your time - it's okay to slow down a bit!"
    };
  } else {
    return {
      isAppropriate: true,
      feedback: "Perfect pace! You're speaking at just the right speed!"
    };
  }
}