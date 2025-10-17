# Chirp App - Firebase Setup Guide

## Prerequisites

1. Node.js and npm installed
2. Firebase account (create one at https://firebase.google.com)
3. OpenAI API key (get from https://platform.openai.com)
4. ElevenLabs API key (get from https://elevenlabs.io)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Enter project name (e.g., "chirp-app")
4. Follow the setup wizard

## Step 2: Enable Firebase Services

### Enable Authentication
1. In Firebase Console, go to Authentication
2. Click "Get Started"
3. Enable Email/Password provider
4. Enable Google provider
5. Add your domain to authorized domains

### Enable Firestore Database
1. Go to Firestore Database
2. Click "Create Database"
3. Choose production mode
4. Select your region
5. Click "Enable"

### Enable Storage
1. Go to Storage
2. Click "Get Started"
3. Choose production mode
4. Select your region

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Click "Web" icon to add a web app
4. Register your app with a nickname
5. Copy the configuration values

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Add your API keys:
   ```
   VITE_OPENAI_API_KEY=sk-your_openai_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

## Step 5: Deploy Security Rules

### Firestore Rules
1. In Firebase Console, go to Firestore Database > Rules
2. Copy contents from `firestore.rules` file
3. Click "Publish"

### Storage Rules
1. Go to Storage > Rules
2. Copy contents from `storage.rules` file
3. Click "Publish"

## Step 6: Initialize Database

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Create an admin page temporarily by adding this route to `App.tsx`:
   ```tsx
   import { InitializationButton } from '@/lib/firebase/initializeDatabase';
   
   // Add this route
   <Route path="/admin/init" element={<InitializationButton />} />
   ```

3. Navigate to `http://localhost:5173/admin/init`
4. Click the initialization button
5. Remove the admin route after initialization

## Step 7: Create Firestore Indexes

Some queries require indexes. Firebase will prompt you to create them when needed, or you can create them proactively:

1. Go to Firestore Database > Indexes
2. Create these composite indexes:
   - Collection: `levels`
     - Fields: `path_id (Ascending)`, `level_number (Ascending)`
   - Collection: `user_progress`
     - Fields: `user_id (Ascending)`, `status (Ascending)`
   - Collection: `conversations`
     - Fields: `user_id (Ascending)`, `started_at (Descending)`

## Step 8: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the flow:
   - Sign up with email/password
   - Complete onboarding
   - Take assessment
   - Start learning

## Troubleshooting

### Authentication Issues
- Ensure Email/Password and Google providers are enabled
- Check authorized domains in Authentication settings
- Verify environment variables are loaded (check browser console)

### Firestore Issues
- Check security rules are published
- Verify indexes are created for complex queries
- Check browser console for permission errors

### Storage Issues
- Ensure Storage is enabled
- Check storage rules are published
- Verify CORS settings if needed

### API Issues
- Verify API keys are correct
- Check API quotas and limits
- For OpenAI/ElevenLabs, ensure accounts have credits

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your hosting service (Vercel, Netlify, Firebase Hosting, etc.)

3. Update Firebase authorized domains:
   - Go to Authentication > Settings > Authorized domains
   - Add your production domain

4. Update environment variables on your hosting platform

5. Consider implementing:
   - Rate limiting for API calls
   - Error monitoring (Sentry, LogRocket)
   - Analytics (Firebase Analytics, Google Analytics)
   - Performance monitoring

## Security Best Practices

1. **Never expose sensitive keys in client code**
   - Move OpenAI calls to Cloud Functions if possible
   - Use Firebase App Check for additional security

2. **Implement rate limiting**
   - Use Firebase Security Rules to limit writes
   - Implement Cloud Functions for sensitive operations

3. **Regular backups**
   - Enable Firestore automatic backups
   - Export data regularly

4. **Monitor usage**
   - Set up billing alerts
   - Monitor API usage
   - Track storage usage

## Support

For issues or questions:
1. Check Firebase documentation: https://firebase.google.com/docs
2. Review the codebase comments
3. Check browser console for errors
4. Verify all environment variables are set correctly