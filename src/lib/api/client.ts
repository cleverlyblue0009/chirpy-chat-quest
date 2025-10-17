// API client for communication with backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Chat API
  async sendChatMessage(data: {
    conversationId: string;
    userId: string;
    levelId: string;
    userMessage: string;
  }) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Text-to-Speech API
  async generateSpeech(data: {
    text: string;
    birdCharacter?: string;
    conversationId?: string;
  }): Promise<{ audioUrl: string }> {
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