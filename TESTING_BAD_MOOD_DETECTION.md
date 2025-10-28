# Testing Bad Mood Detection - Quick Guide

## Overview
This guide helps you verify that the bad mood detection fix is working correctly.

## Prerequisites
1. Start the development server: `npm run dev`
2. Navigate to a conversation practice level
3. Grant camera permissions when prompted

## Test Procedure

### Test 1: Angry/Frustrated Expression
1. **Enable the camera** using the camera toggle in the top-right corner
2. **Make an angry or frustrated face**
   - Frown deeply
   - Furrow your brows
   - Clench your jaw
3. **Hold for 2-3 seconds**
4. **Expected Result**: Within 100-500ms, you should hear/see the chatbot say something like:
   - "Oh, I can see you're feeling frustrated! That's okay..."
   - "Hey, I notice you might be upset. We can take a break..."
   - "I can see this might be tough right now. No worries!..."

### Test 2: Sad Expression
1. **Make a sad face**
   - Turn down corners of mouth
   - Look down slightly
   - Droopy eyes
2. **Hold for 2-3 seconds**
3. **Expected Result**: Chatbot responds with:
   - "I can see you're feeling a bit down..."
   - "You look sad. Remember, it's okay to feel this way!..."
   - "I notice you're not feeling great..."

### Test 3: Fearful/Worried Expression
1. **Make a worried or scared face**
   - Wide eyes
   - Open mouth slightly
   - Raised eyebrows
2. **Hold for 2-3 seconds**
3. **Expected Result**: Chatbot responds with:
   - "You seem a bit worried. Don't worry! I'm here to help..."
   - "I can see you might be nervous. That's completely normal!..."

### Test 4: Happy Expression (Positive Control)
1. **Smile widely**
2. **Expected Result**: After a moment, chatbot celebrates:
   - "Wow! I can see you're so happy!"
   - "You look so excited! I love your energy!"

## Console Monitoring

Open the browser console (F12) and watch for these logs:

### When Bad Mood Detected:
```
🎭 Emotion detected: {emotion: "angry", confidence: 0.85, ...}
🚨 DISTRESS DETECTED! Triggering URGENT immediate response... {emotion: "angry", confidence: 0.85}
🤖 Sending emotional support message: {message: "...", emotion: "angry", confidence: 0.85, isUrgent: true, forceImmediate: true}
✅ Emotional support message sent successfully
```

### If Detection Fails:
If you see:
```
⚠️ Cannot generate emotional support: {...}
```
Check that:
- `hasEmotion: true`
- `isCameraReady: true`
- `hasBirdCharacter: true`
- `hasConversationId: true`

All should be `true` for the response to work.

## Troubleshooting

### Issue: No response to bad mood
**Check:**
1. Is camera actually on? (green dot should be visible)
2. Is face clearly visible in camera preview?
3. Is confidence > 0.5? (shown in emotion display)
4. Check console for error messages

### Issue: Response delayed by 15+ seconds
**Check:**
- This is expected for non-urgent emotions (neutral, surprised)
- Urgent emotions (angry, sad, fearful) should respond within 1 second

### Issue: Camera won't activate
**Check:**
1. Parental consent modal approved?
2. Browser camera permissions granted?
3. Camera not in use by another app?

## Success Criteria

✅ **PASS**: Bad mood detected → Response within 1 second
✅ **PASS**: Appropriate empathetic message displayed
✅ **PASS**: Console shows full detection → response flow
✅ **PASS**: Works even if chatbot is speaking (urgent interruption)
✅ **PASS**: No cooldown for urgent emotions

❌ **FAIL**: Detection takes > 5 seconds
❌ **FAIL**: No response to clear bad mood expression
❌ **FAIL**: Generic response instead of emotion-specific

## Advanced Testing

### Test Interruption (Urgent Priority)
1. Start chatbot speaking a long message
2. Make an angry face mid-speech
3. **Expected**: Chatbot interrupts itself to address your emotion

### Test Cooldown Bypass
1. Make angry face → get response
2. Immediately make sad face (< 1 second later)
3. **Expected**: Get another immediate response (no 15-second cooldown for urgent)

### Test Multiple Emotions
1. Cycle through: angry → sad → fearful → happy
2. **Expected**: Each emotion triggers appropriate response

## Reporting Issues

If tests fail, provide:
1. Console logs (full output)
2. Which emotion was tested
3. Camera preview screenshot
4. Confidence level shown
5. Any error messages

---

**Note**: Emotions must have confidence > 0.5 to trigger responses. Ensure good lighting and clear facial expressions for best results.
