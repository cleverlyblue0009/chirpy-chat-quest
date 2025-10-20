# 🔥 Firebase Setup Guide for Chirp Application

This guide will walk you through setting up Firebase from scratch for the Chirp application.

## 📋 Prerequisites

You'll need:
1. A Google account
2. Access to [Firebase Console](https://console.firebase.google.com/)

## 🚀 Step-by-Step Firebase Setup

### Step 1: Create Firebase Project (if not already created)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or select your existing "chirp-app-3902d" project
3. If creating new:
   - Enter project name: `chirp-app` (or keep your existing name)
   - Accept the terms
   - Disable Google Analytics (optional, not needed for now)
   - Click **Create Project**

### Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **"Get Started"**
3. Enable the following sign-in methods:
   - Click **Email/Password**:
     - Toggle **Enable** to ON
     - Toggle **Email link (passwordless sign-in)** to OFF
     - Click **Save**
   - (Optional) Click **Google**:
     - Toggle **Enable** to ON
     - Select your project support email
     - Click **Save**

### Step 3: Set Up Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select your preferred location (e.g., `us-central1`)
5. Click **Enable**

### Step 4: Set Up Storage

1. Click **Storage** in the left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select same location as Firestore
5. Click **Done**

### Step 5: Update Storage CORS Configuration

To allow web access to Storage files:

1. Install Google Cloud SDK (if not installed):
   ```bash
   # On Ubuntu/Debian
   snap install google-cloud-sdk --classic
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Create a CORS configuration file:
   ```bash
   cat > cors.json << 'EOF'
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8080"],
       "method": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type"]
     }
   ]
   EOF
   ```

3. Apply CORS configuration:
   ```bash
   gsutil cors set cors.json gs://chirp-app-3902d.appspot.com
   ```

### Step 6: Create Firestore Collections

In the Firebase Console > Firestore Database, you need to create these collections:

#### 1. **users** Collection
Click **"Start collection"** and create:
- Collection ID: `users`
- Add a sample document with Auto-ID containing:
```json
{
  "email": "test@example.com",
  "display_name": "Test User",
  "created_at": [Timestamp],
  "current_level_id": "level_1",
  "learning_path": "forest_explorer",
  "total_xp": 0,
  "achievements": [],
  "skills": {
    "greeting": 0,
    "turn_taking": 0,
    "emotion_recognition": 0,
    "listening": 0,
    "expression": 0
  }
}
```

#### 2. **levels** Collection
Create with Collection ID: `levels`
Add documents with specific IDs:

**Document ID**: `level_1`
```json
{
  "name": "Hello, Friend!",
  "description": "Learn to greet new friends",
  "level_number": 1,
  "path_id": "forest_explorer",
  "bird_character": "ruby_robin",
  "objectives": [
    "Practice saying hello",
    "Learn to introduce yourself",
    "Respond to greetings"
  ],
  "conversation_topics": [
    "What's your name?",
    "How are you feeling today?",
    "Nice to meet you!"
  ],
  "required_xp": 0,
  "reward_xp": 100,
  "status": "available"
}
```

**Document ID**: `level_2`
```json
{
  "name": "How Are You?",
  "description": "Ask and answer about feelings",
  "level_number": 2,
  "path_id": "forest_explorer",
  "bird_character": "sage_owl",
  "objectives": [
    "Ask how someone is feeling",
    "Share your own feelings",
    "Recognize emotion words"
  ],
  "conversation_topics": [
    "How are you today?",
    "I'm feeling happy/sad/excited",
    "What makes you feel better?"
  ],
  "required_xp": 100,
  "reward_xp": 150,
  "status": "locked"
}
```

#### 3. **bird_characters** Collection
Create with these documents:

**Document ID**: `ruby_robin`
```json
{
  "name": "Ruby Robin",
  "emoji": "🦜",
  "personality": "Cheerful and encouraging",
  "voice_style": "Warm and friendly",
  "system_prompt": "You are Ruby Robin, a cheerful and encouraging bird who loves helping children practice conversations. Keep responses short, positive, and simple.",
  "unlock_level": 0
}
```

**Document ID**: `sage_owl`
```json
{
  "name": "Sage Owl",
  "emoji": "🦉",
  "personality": "Wise and patient",
  "voice_style": "Calm and thoughtful",
  "system_prompt": "You are Sage Owl, a wise and patient teacher who helps children learn at their own pace. Be gentle, understanding, and supportive.",
  "unlock_level": 5
}
```

**Document ID**: `charlie_sparrow`
```json
{
  "name": "Charlie Sparrow",
  "emoji": "🐦",
  "personality": "Playful and energetic",
  "voice_style": "Upbeat and fun",
  "system_prompt": "You are Charlie Sparrow, a playful friend who makes learning fun. Be enthusiastic but not overwhelming, and celebrate small victories.",
  "unlock_level": 10
}
```

#### 4. **conversations** Collection
This will be auto-created when users start conversations. Structure:
```json
{
  "user_id": "userId",
  "level_id": "level_1",
  "messages": [],
  "started_at": [Timestamp],
  "completed_at": [Timestamp],
  "score": 0,
  "feedback": ""
}
```

#### 5. **learning_paths** Collection

**Document ID**: `forest_explorer`
```json
{
  "name": "Forest Explorer",
  "description": "Begin your journey through the Friendship Forest",
  "difficulty": "beginner",
  "total_levels": 10,
  "emoji": "🌲"
}
```

**Document ID**: `tree_climber`
```json
{
  "name": "Tree Climber",
  "description": "Climb higher and learn more complex conversations",
  "difficulty": "intermediate",
  "total_levels": 10,
  "emoji": "🌳"
}
```

**Document ID**: `sky_soarer`
```json
{
  "name": "Sky Soarer",
  "description": "Soar through advanced social interactions",
  "difficulty": "advanced",
  "total_levels": 10,
  "emoji": "☁️"
}
```

### Step 7: Update Security Rules

#### Firestore Security Rules
Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read levels and paths
    match /levels/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /learning_paths/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /bird_characters/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow users to read/write their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.user_id;
    }
    
    // Assessment results
    match /assessment_results/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null;
    }
  }
}
```

Click **Publish**.

#### Storage Security Rules
Go to Storage > Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read all audio files
    match /audio/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow users to upload their recordings
    match /audio/user_recordings/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

### Step 8: Get Your Firebase Configuration

1. Click the **Settings gear** ⚙️ > **Project settings**
2. Scroll down to **"Your apps"**
3. If no app exists, click **"Add app"** and choose **Web** (</> icon)
4. Register app with a nickname (e.g., "Chirp Web App")
5. Copy the configuration - it should look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "chirp-app-3902d.firebaseapp.com",
  projectId: "chirp-app-3902d",
  storageBucket: "chirp-app-3902d.appspot.com",  // ⚠️ Note: .appspot.com, not .firebasestorage.app
  messagingSenderId: "124505821871",
  appId: "1:124505821871:web:..."
};
```

### Step 9: Update Your .env Files

Update `/workspace/.env`:
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=chirp-app-3902d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chirp-app-3902d
VITE_FIREBASE_STORAGE_BUCKET=chirp-app-3902d.appspot.com  # Use .appspot.com!
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Update `/workspace/server/.env`:
```bash
FIREBASE_STORAGE_BUCKET=chirp-app-3902d.appspot.com  # Use .appspot.com!
```

## 🎯 Quick Setup Script

After creating the collections, you can run this script to populate initial data:

```bash
cd /workspace
node scripts/initializeFirebase.js
```

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] All collections created:
  - [ ] users
  - [ ] levels
  - [ ] bird_characters
  - [ ] learning_paths
  - [ ] conversations (will auto-create)
- [ ] Security rules updated for both Firestore and Storage
- [ ] Environment variables updated with correct values
- [ ] Storage bucket uses `.appspot.com` (not `.firebasestorage.app`)

## 🚨 Common Issues and Solutions

### Issue: Storage bucket not found
**Solution**: Make sure you're using `projectId.appspot.com` not `projectId.firebasestorage.app`

### Issue: Permission denied errors
**Solution**: Check that security rules are published and authentication is working

### Issue: No data showing in app
**Solution**: Make sure all collections are created with the exact document IDs specified

### Issue: Authentication not working
**Solution**: Ensure Email/Password auth is enabled in Firebase Console

## 🎉 Success Indicators

When everything is set up correctly:
1. Users can sign up and log in
2. Levels appear in the learning path
3. Bird characters load and speak
4. Conversations are saved to Firestore
5. Audio files can be uploaded and retrieved

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for specific error messages
2. Verify all collection names and document IDs match exactly
3. Ensure your Firebase project ID matches in all .env files
4. Check that security rules are published

---

**Created for**: Chirp Language Learning App
**Last Updated**: October 2024
**Status**: Complete Setup Guide