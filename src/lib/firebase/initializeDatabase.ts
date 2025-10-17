/**
 * Script to initialize Firebase database with default data
 * Run this once after setting up Firebase project
 */

import { SkillsService } from './skillsService';
import { AchievementsService } from './achievementsService';
import { levelsApi } from '../api/levelsApi';
import { birdsApi } from '../api/birdsApi';
import { assessmentApi } from '../api/assessmentApi';

export async function initializeFirebaseDatabase() {
  try {
    console.log('Starting Firebase database initialization...');
    
    // Initialize skills
    console.log('Initializing skills...');
    await SkillsService.initializeDefaultSkills();
    
    // Initialize achievements
    console.log('Initializing achievements...');
    await AchievementsService.initializeDefaultAchievements();
    
    // Initialize learning paths
    console.log('Initializing learning paths...');
    await levelsApi.initializeDefaultPaths();
    
    // Initialize levels
    console.log('Initializing levels...');
    await levelsApi.initializeDefaultLevels();
    
    // Initialize bird characters
    console.log('Initializing bird characters...');
    await birdsApi.initializeDefaultBirdCharacters();
    
    // Initialize assessment questions
    console.log('Initializing assessment questions...');
    await assessmentApi.initializeDefaultAssessmentQuestions();
    
    console.log('Firebase database initialization complete!');
    
    return {
      success: true,
      message: 'Database initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing Firebase database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Optional: Create an admin tool component to run this
export const InitializationButton = () => {
  const handleInitialize = async () => {
    if (confirm('This will initialize the Firebase database with default data. Continue?')) {
      const result = await initializeFirebaseDatabase();
      if (result.success) {
        alert('Database initialized successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };
  
  return (
    <button 
      onClick={handleInitialize}
      style={{
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Initialize Firebase Database
    </button>
  );
};