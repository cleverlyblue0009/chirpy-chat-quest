#!/usr/bin/env node

// Test script to verify TTS and API integration

const API_URL = 'http://localhost:3001';

async function testTTS() {
  console.log('Testing Text-to-Speech API...\n');
  
  const testCases = [
    { text: "Hello! I'm Ruby the Robin!", birdCharacter: 'ruby_robin' },
    { text: "Welcome to Chirp!", birdCharacter: 'sage_owl' },
    { text: "Let's practice together!", birdCharacter: 'charlie_sparrow' }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing ${testCase.birdCharacter}: "${testCase.text}"`);
    
    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.audioUrl) {
          console.log(`✅ Success! Audio URL: ${data.audioUrl}`);
          
          // Test if audio file is accessible
          if (data.audioUrl.startsWith('/')) {
            const audioResponse = await fetch(`${API_URL}${data.audioUrl}`);
            if (audioResponse.ok) {
              const contentLength = audioResponse.headers.get('content-length');
              console.log(`   Audio file size: ${contentLength} bytes`);
            } else {
              console.log(`   ⚠️ Audio file not accessible: ${audioResponse.status}`);
            }
          }
        } else if (data.useBrowserTTS) {
          console.log(`✅ Using browser TTS fallback`);
        }
      } else {
        console.log(`❌ Error: ${data.error}`);
        if (data.details) {
          console.log(`   Details: ${data.details}`);
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log('');
  }
}

async function testChat() {
  console.log('Testing Chat API...\n');
  
  const testMessage = {
    conversationId: 'test-conv-1',
    userId: 'test-user-1',
    levelId: 'level_1',
    userMessage: 'Hello, how are you?'
  };
  
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Chat API working!');
      console.log(`   Response: "${data.text || data.response}"`);
      if (data.score) {
        console.log(`   Score: ${data.score}`);
      }
    } else {
      console.log(`❌ Chat API error: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Chat API failed: ${error.message}`);
  }
  
  console.log('');
}

async function checkServices() {
  console.log('Checking services...\n');
  
  // Check backend
  try {
    const response = await fetch(API_URL);
    if (response.ok || response.status === 404) {
      console.log('✅ Backend server is running on port 3001');
    }
  } catch (error) {
    console.log('❌ Backend server is not running on port 3001');
    console.log('   Run: cd server && PORT=3001 npm start');
  }
  
  // Check frontend
  try {
    const response = await fetch('http://localhost:8080');
    if (response.ok) {
      console.log('✅ Frontend is running on port 8080');
    }
  } catch (error) {
    console.log('❌ Frontend is not running');
    console.log('   Run: npm run dev');
  }
  
  console.log('');
}

async function main() {
  console.log('='.repeat(50));
  console.log('Chirp Integration Test');
  console.log('='.repeat(50));
  console.log('');
  
  await checkServices();
  await testTTS();
  await testChat();
  
  console.log('='.repeat(50));
  console.log('Test complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Open http://localhost:8080 in your browser');
  console.log('2. Navigate to a conversation practice');
  console.log('3. Test the microphone (click Allow when prompted)');
  console.log('4. The bird should speak using generated audio');
  console.log('='.repeat(50));
}

main().catch(console.error);