// API client for communication with backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Add timeout using AbortController
      signal: AbortSignal.timeout(15000), // 15 second timeout
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          console.error(`API Error (attempt ${attempt + 1}): ${response.status} ${response.statusText}`, errorText);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }
          
          // Retry on server errors (5xx)
          if (attempt < retries && response.status >= 500) {
            console.log(`Retrying request to ${endpoint} (attempt ${attempt + 2}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }
          
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
      } catch (error: any) {
        // Handle timeout errors
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          console.error(`Request timeout for ${endpoint} (attempt ${attempt + 1})`);
          if (attempt < retries) {
            console.log(`Retrying after timeout (attempt ${attempt + 2}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error('Request timeout - please check your connection');
        }
        
        // Handle network errors
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          console.error(`Network error for ${endpoint} (attempt ${attempt + 1})`);
          if (attempt < retries) {
            console.log(`Retrying after network error (attempt ${attempt + 2}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error('Network error - please check your connection');
        }
        
        console.error('Request failed:', endpoint, error);
        
        // Don't retry on other errors
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // Chat API - Enhanced with autism-aware parameters
  async sendChatMessage(data: {
    conversationId: string;
    userId: string;
    levelId: string;
    userMessage: string;
    systemPrompt?: string;
    analysisData?: any;
  }): Promise<any> {
    try {
      return await this.request('/api/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }, 1); // Fewer retries for chat to avoid long waits
    } catch (error) {
      console.error('Chat API failed:', error);
      // Return a fallback structure instead of throwing
      return {
        response: null,
        text: null,
        error: true,
        fallback: true
      };
    }
  }

  // Text-to-Speech API
  async generateSpeech(data: {
    text: string;
    birdCharacter?: string;
    conversationId?: string;
  }): Promise<{ audioUrl: string; useBrowserTTS?: boolean; text?: string }> {
    return this.request('/api/tts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Speech-to-Text API
  async transcribeSpeech(audioUrl: string): Promise<{ transcript: string; confidence: number }> {
    return this.request('/api/stt', {
      method: 'POST',
      body: JSON.stringify({ audioUrl }),
    });
  }

  // Pronunciation Scoring API
  async scorePronunciation(data: {
    audioUrl: string;
    referenceText: string;
  }): Promise<{ score: number; feedback: string }> {
    return this.request('/api/pronunciation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Assessment Scoring API
  async scoreAssessment(data: {
    userId: string;
    answers: Record<string, any>;
  }) {
    return this.request('/api/assessment/score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();