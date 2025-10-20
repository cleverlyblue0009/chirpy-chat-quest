# 🚀 Firebase Setup Checklist for Chirp

Use this checklist to ensure everything is set up correctly in Firebase.

## 📱 In Firebase Console (https://console.firebase.google.com/)

### 1️⃣ Project Setup
- [ ] Project exists (name: chirp-app-3902d or similar)
- [ ] Project is on Blaze (pay-as-you-go) plan (required for some features)

### 2️⃣ Authentication
- [ ] Go to **Authentication** section
- [ ] Click **Get Started** if not initialized
- [ ] **Sign-in methods** tab:
  - [ ] Email/Password is **ENABLED**
  - [ ] (Optional) Google sign-in is enabled

### 3️⃣ Firestore Database
- [ ] Go to **Firestore Database** section
- [ ] Database is created (if not, click **Create database**)
- [ ] Mode: Start in test mode (for now)
- [ ] Location selected (e.g., us-central1)

### 4️⃣ Storage
- [ ] Go to **Storage** section
- [ ] Storage is initialized (if not, click **Get started**)
- [ ] Rules are in test mode (for now)

### 5️⃣ Collections to Create in Firestore

Go to **Firestore Database** and create these collections:

#### ✅ Collection: `bird_characters`
Create documents with these EXACT IDs:
- [ ] Document ID: `ruby_robin`
- [ ] Document ID: `sage_owl`
- [ ] Document ID: `charlie_sparrow`

#### ✅ Collection: `learning_paths`
Create documents with these EXACT IDs:
- [ ] Document ID: `forest_explorer`
- [ ] Document ID: `tree_climber`
- [ ] Document ID: `sky_soarer`

#### ✅ Collection: `levels`
Create documents with these EXACT IDs:
- [ ] Document ID: `level_1`
- [ ] Document ID: `level_2`
- [ ] Document ID: `level_3`
- [ ] Document ID: `level_4`
- [ ] Document ID: `level_5`

#### ✅ Collection: `users`
- [ ] Will be auto-created when first user signs up

#### ✅ Collection: `conversations`
- [ ] Will be auto-created when first conversation starts

### 6️⃣ Get Your Configuration
- [ ] Go to **Project Settings** (gear icon)
- [ ] Scroll to **Your apps**
- [ ] Add a Web app if none exists
- [ ] Copy the configuration values

### 7️⃣ Update Environment Variables

In `/workspace/.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com  # ⚠️ Use .appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

In `/workspace/server/.env`:
```env
FIREBASE_STORAGE_BUCKET=your-project.appspot.com  # ⚠️ Use .appspot.com
```

## 🤖 Automated Setup

After completing steps 1-4 above, you can run:

```bash
# Install dependencies
cd /workspace/scripts
npm install

# Run initialization script
npm run init
# OR
node initializeFirebase.js
```

This will automatically create all the collections and documents for you!

## ✅ Verification

After setup, verify everything works:

1. **Test Authentication**:
   - Try signing up a new user in the app
   - Check Firebase Console > Authentication > Users tab

2. **Test Firestore**:
   - Check all collections exist in Firestore
   - Verify document IDs match exactly

3. **Test Storage**:
   - Upload a file through the app
   - Check Firebase Console > Storage

4. **Test the App**:
   ```bash
   # Start backend
   cd /workspace/server
   PORT=3001 npm start
   
   # In another terminal, start frontend
   cd /workspace
   npm run dev
   
   # Open http://localhost:8080
   ```

## ⚠️ Important Notes

1. **Storage Bucket Name**: Always use `.appspot.com` not `.firebasestorage.app`
2. **Document IDs**: Must match EXACTLY as specified (e.g., `level_1`, not `level1`)
3. **Authentication**: Email/Password must be enabled for the app to work
4. **Security Rules**: Start with test mode, then add proper rules for production

## 🆘 Troubleshooting

### "Permission Denied" Errors
- Check Authentication is enabled
- Verify user is logged in
- Check Firestore/Storage rules

### "Document Not Found" Errors
- Verify collection names are exact
- Check document IDs match exactly
- Ensure initialization script ran successfully

### "Storage Bucket Not Found"
- Use `.appspot.com` suffix
- Ensure Storage is initialized in Firebase Console
- Check environment variables

## 📞 Still Having Issues?

1. Check browser console for specific error messages
2. Verify Firebase project ID in all locations
3. Ensure all services are enabled in Firebase Console
4. Try running the initialization script again

---

**Ready?** Once all checkboxes are checked, your Firebase is fully configured! 🎉