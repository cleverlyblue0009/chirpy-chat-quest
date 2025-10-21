# Chirp Application - Setup & Running Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm installed
- A modern browser (Chrome/Firefox/Safari/Edge)
- Microphone access for speech features
- Firebase project already configured (credentials in .env files)

### Fastest Way to Run
```bash
# Run the automated setup and start script
./runApp.sh

# When prompted, press 'y' to seed the database with 18 levels
# The script will:
# 1. Install all dependencies
# 2. Seed the database
# 3. Start both frontend (port 5173) and backend (port 3001)
```

## 📋 Manual Setup Instructions

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..

# Script dependencies (for seeding)
cd scripts
npm install
cd ..
```

### 2. Seed the Database
```bash
# Run the enhanced seed script with 18 comprehensive levels
node scripts/seedEnhanced.js
```

### 3. Start the Servers

**Option A: Start Both Servers Together**
```bash
npm run dev:all
```

**Option B: Start Servers Separately (2 terminals)**
```bash
# Terminal 1 - Backend server
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Test Mode**: All levels are unlocked for testing

## 🧪 Testing the Application

### Test User Creation
1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Create a test account with:
   - Email: test@example.com
   - Password: Test123!
   - Child's name: TestChild

### Features to Test

#### 1. Dashboard
- Verify current level shows "Hello & Goodbye" for new users
- Check XP and streak tracking
- Test navigation to Learning Path

#### 2. Enhanced Learning Path
- All 18 levels should be visible
- Levels are organized in 3 tiers
- Click any level to start a conversation (test mode enables all)
- Note the autism-aware descriptions for each level

#### 3. Conversation Practice
**Testing the AI Conversation:**
1. Start with Level 1 "Hello & Goodbye"
2. Test different input methods:
   - **Voice**: Click microphone and say "Hello Ruby!"
   - **Text**: Type a response if voice doesn't work
3. Observe:
   - Natural AI responses from bird characters
   - Positive, encouraging feedback
   - No pressure for perfect answers

**Things to Try:**
- Give brief one-word answers (should be accepted)
- Take pauses (system should be patient)
- Go slightly off-topic (should be gently redirected)
- Complete 3-5 exchanges to finish a conversation

#### 4. Autism-Aware Features
Test these specialized features:
- **Processing Time**: Pause before responding - system waits patiently
- **Brief Responses**: Try one-word answers like "yes" or "hi"
- **Special Interests**: Mention a hobby - AI validates then guides back
- **No Eye Contact Pressure**: Never mentioned or required
- **Strength-Based Feedback**: Always starts with what you did well

### API Keys Verification
Ensure these are properly configured in `/workspace/server/.env`:
```
GEMINI_API_KEY=<your-key>
ELEVENLABS_API_KEY=<your-key>
```

## 🎯 Key Features to Demonstrate

### For Academic Presentation

1. **18-Level Progression System**
   - Tier 1: Foundation Skills (Levels 1-6)
   - Tier 2: Intermediate Skills (Levels 7-12)  
   - Tier 3: Advanced Skills (Levels 13-18)

2. **Evidence-Based Framework Integration**
   - SCERTS Model implementation
   - Social Thinking curriculum
   - PEERS program elements
   - Social Stories methodology

3. **Technical Innovations**
   - Real-time AI conversation with GPT-4
   - Autism-aware adaptive prompting
   - Multi-modal input (voice & text)
   - Firebase real-time synchronization

4. **Neurodiversity-Affirming Design**
   - Accepts all communication styles
   - No penalization for autistic traits
   - Celebrates special interests
   - Minimum 60% scores for encouragement

## 🐛 Troubleshooting

### Issue: "Cannot find Gemini API key"
**Solution**: Ensure GEMINI_API_KEY is in `/workspace/server/.env`

### Issue: Microphone not working
**Solution**: 
1. Check browser permissions
2. Use text input as fallback
3. Ensure HTTPS or localhost

### Issue: Conversations not loading
**Solution**:
1. Check backend is running on port 3001
2. Verify Firebase credentials
3. Re-seed database if needed

### Issue: Levels not showing
**Solution**: Run `node scripts/seedEnhanced.js` to populate database

## 📚 Documentation

### Academic Materials
- `ACADEMIC_REPORT.md` - Comprehensive research documentation
- `DEMO_SCRIPT.md` - Professor presentation guide
- `RESEARCH_GAPS.md` - Future research directions

### Technical Documentation
- `src/lib/ai/enhancedConversationEngine.ts` - AI conversation logic
- `scripts/seedEnhanced.js` - 18-level database structure
- `server/index.js` - Backend API endpoints

## 🔑 Important Notes

### For Testing
- **Test Mode Active**: All levels unlocked for demonstration
- **Minimum Scores**: System ensures 60% minimum to maintain encouragement
- **Mock Pronunciation**: Currently returns simulated scores (70-100%)

### For Production
Would need:
- Clinical validation studies
- Real pronunciation analysis (Deepgram/Azure)
- Parent dashboard implementation
- Progress report generation
- Multi-language support

## 📞 Support

For issues or questions about:
- Technical implementation
- Research collaboration
- Clinical validation
- Partnership opportunities

Refer to contact information in `ACADEMIC_REPORT.md`

---

## Quick Commands Reference

```bash
# Seed database
node scripts/seedEnhanced.js

# Start everything
./runApp.sh

# Start frontend only
npm run dev

# Start backend only
cd server && npm run dev

# Run both servers
npm run dev:all
```

---

**Last Updated**: December 2024
**Version**: 1.0 (Pre-Clinical Research Version)