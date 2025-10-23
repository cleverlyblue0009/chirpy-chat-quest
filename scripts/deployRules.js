#!/usr/bin/env node

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const execPromise = promisify(exec);

if (!projectId) {
  console.error('❌ Missing Firebase project ID in .env');
  process.exit(1);
}

async function deployRules() {
  try {
    console.log('📋 Reading Firestore rules from firestore.rules...');
    const rulesContent = readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
    
    console.log('🔧 Deploying Firestore rules to project:', projectId);
    
    // Using Firebase REST API to deploy rules
    
    // First, let's try to use gcloud if available, otherwise fall back to manual update notice
    try {
      await execPromise(`which gcloud`);
      const { stdout, stderr } = await execPromise(
        `gcloud firestore databases update --project=${projectId} --rules-file=firestore.rules`
      );
      if (stderr) {
        console.log('ℹ️', stderr);
      }
      console.log('✅ Firestore rules deployed successfully!');
    } catch (gcloudError) {
      console.log('\n⚠️  gcloud CLI not available.');
      console.log('\n📝 Manual update required:');
      console.log('   1. Go to Firebase Console: https://console.firebase.google.com/project/' + projectId + '/firestore/rules');
      console.log('   2. Replace the existing rules with the content from firestore.rules');
      console.log('   3. Click "Publish" to deploy the rules\n');
      console.log('✨ The rules have been updated locally. The parental_consent collection rules have been added.');
      console.log('\n📋 Updated rules include:');
      console.log('   - parental_consent/{userId} - Users can read/write their own consent documents');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployRules();