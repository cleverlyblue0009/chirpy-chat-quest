# Gemini API Setup Guide

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click on "Get API key" or "Create API key"
4. Select or create a Google Cloud project (or use the default)
5. Copy your API key

## Setting Up the API Key

### For the Server (Required)

1. Navigate to the server directory:
   ```bash
   cd /workspace/server
   ```

2. Edit the `.env` file and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

## Gemini vs OpenAI Changes

### What Changed
- **Model**: Changed from OpenAI GPT-4 to Google Gemini 1.5 Flash
- **API**: Replaced OpenAI SDK with Google Generative AI SDK
- **Cost**: Gemini offers a generous free tier (unlike OpenAI)
- **Performance**: Gemini 1.5 Flash is optimized for quick responses

### Key Differences
1. **Free Tier**: Gemini offers 60 requests per minute in the free tier
2. **Model Selection**: Using `gemini-1.5-flash` for fast, efficient responses
3. **Context Handling**: Gemini uses a chat session with history for context
4. **Token Limits**: Similar token limits configured for short, autism-friendly responses

### Configuration Options

In `server/index.js`, you can adjust the Gemini model configuration:

```javascript
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",  // Can also use "gemini-1.5-pro" for more advanced responses
  generationConfig: {
    temperature: 0.7,        // Controls randomness (0-1)
    maxOutputTokens: 100,    // Maximum response length
    topP: 0.95,             // Controls diversity
    topK: 40,               // Controls vocabulary diversity
  }
});
```

### Available Models
- `gemini-1.5-flash`: Fast, efficient model (recommended for this app)
- `gemini-1.5-pro`: More capable model for complex tasks
- `gemini-1.0-pro`: Previous generation model

## Troubleshooting

### "API key not valid" Error
- Make sure you've copied the entire API key
- Check that the key is in `/workspace/server/.env`, not the root `.env`
- Verify the key starts with `AI` (Gemini keys typically start with AIza...)

### Rate Limiting
- Free tier: 60 requests per minute
- If you hit limits, consider upgrading or implementing request caching

### Model Not Available
- Some models may not be available in all regions
- Try switching to `gemini-1.0-pro` if `gemini-1.5-flash` isn't available

## Security Notes

- Never commit your API key to version control
- Keep the API key only in the server's `.env` file
- The frontend no longer needs direct API access - all AI calls go through the server