# Chirp App - Complete Setup & Run Instructions

## Quick Start

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend server dependencies  
cd server
npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.local` and fill in your actual values:

```bash
# Required Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Required for Backend Server
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Keys
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 3. Set Up Firebase

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Email/Password + Google)
   - Enable Firestore Database
   - Enable Storage

2. **Deploy Security Rules:**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (select your project)
   firebase init
   
   # Deploy rules
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

### 4. Seed the Database
```bash
npm run seed
```

This will populate your Firestore with:
- 8 bird characters
- 12 levels across 3 learning paths  
- 7 skills
- 10 achievements
- 6 assessment questions

### 5. Run the Application

**Option 1: Run Everything Together**
```bash
npm run dev:all
```

**Option 2: Run Separately (recommended for development)**

Terminal 1 - Backend Server:
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

Terminal 2 - Frontend:
```bash
npm run dev
# App runs on http://localhost:5173
```

### 6. Test the Application

1. **Sign Up:**
   - Go to http://localhost:5173/signup
   - Create an account with email/password or Google
   - Complete onboarding (name and age)

2. **Take Assessment:**
   - You'll be redirected to assessment after signup
   - Answer 6 questions to determine your learning path
   - Use microphone for voice questions or type responses

3. **Start Learning:**
   - After assessment, you'll see your dashboard
   - Click on your learning path to see levels
   - Start a conversation practice with your bird friend

4. **Practice Conversation:**
   - Click microphone to speak (Web Speech API)
   - Or use text input if microphone isn't available
   - Bird will respond with voice (ElevenLabs TTS)
   - Complete 5 exchanges to finish the conversation

## Features That Work

✅ **Authentication:**
- Email/Password signup and login
- Google OAuth
- Firebase session management (no JWT)
- Protected routes

✅ **Speech Features:**
- Real Web Speech API for voice input
- Fallback to text input if speech unavailable
- ElevenLabs text-to-speech for bird responses
- Audio stored in Firebase Storage
- Basic pronunciation scoring

✅ **AI Conversations:**
- Google Gemini generates contextual responses
- Bird personalities based on character
- Progressive difficulty based on level
- Real-time scoring and feedback

✅ **Firebase Integration:**
- Real-time Firestore listeners
- Firebase Storage for audio files
- Proper security rules
- Offline persistence

✅ **Assessment:**
- 6 different question types
- Voice and text input
- Automatic path assignment
- Skill score calculation

✅ **Progress Tracking:**
- XP system
- Level completion
- Skill progress
- Achievement unlocking
- Streak tracking

## Troubleshooting

### "Cannot connect to backend"
- Make sure backend server is running on port 3001
- Check VITE_API_URL in .env.local

### "Microphone not working"
- Check browser permissions for microphone
- Use HTTPS in production (required for Web Speech API)
- Falls back to text input automatically

### "Firebase permission denied"
- Check security rules are deployed
- Ensure user is authenticated
- Verify Firebase project configuration

### "Gemini/ElevenLabs not working"
- Check API keys in .env.local
- Ensure you have credits/quota
- Check backend server logs for errors

### "Assessment not calculating path"
- Ensure assessment_questions are seeded
- Check backend server is running
- Verify Firebase Admin SDK credentials

## Architecture Overview

```
Frontend (Vite React)
    ↓
API Client (src/lib/api/client.ts)
    ↓
Backend Server (Express on port 3001)
    ├── Google Gemini API (chat responses)
    ├── ElevenLabs API (text-to-speech)
    └── Firebase Admin SDK
    
Firebase Services:
    ├── Authentication (user sessions)
    ├── Firestore (database)
    └── Storage (audio files)
```

## Key Files

- **Backend Server:** `/server/index.js`
- **API Client:** `/src/lib/api/client.ts`
- **Auth Context:** `/src/contexts/AuthContext.tsx`
- **Conversation UI:** `/src/pages/ConversationPractice.tsx`
- **Assessment:** `/src/pages/Assessment.tsx`
- **Database Seed:** `/scripts/seed.js`

## Production Deployment

1. **Backend Server:**
   - Deploy to Vercel, Railway, or Render
   - Set environment variables on hosting platform
   - Update VITE_API_URL to production URL

2. **Frontend:**
   - Build: `npm run build`
   - Deploy dist folder to Vercel, Netlify, or Firebase Hosting
   - Set environment variables

3. **Security:**
   - Move API keys to backend only
   - Enable Firebase App Check
   - Set up CORS properly
   - Use HTTPS everywhere

## Support

For issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify all environment variables are set
4. Ensure Firebase project is configured correctly
5. Check network tab for API failures