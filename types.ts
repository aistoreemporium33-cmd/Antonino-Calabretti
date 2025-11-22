export interface Message {
  role: 'user' | 'anya' | 'system';
  content: string;
  emotion?: string; // Inner feeling
  sensory?: string; // Haptic description
  fullText?: string; // Combined text for TTS
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'credit' | 'debit';
}

export interface UserProfile {
  name: string; // The AI's name for the user (nickname)
  realName?: string; // Verified real name
  nationality?: string;
  idNumber?: string;
  birthDate?: string;
  idVerified?: boolean;
  trait: string;
  isPremium: boolean;
  imageGenerationCount: number;
  balance: number;
  transactions: Transaction[];
}

export interface ImageGenerationState {
  url: string | null;
  error: string | null;
  isGenerating: boolean;
  isVideo: boolean;
}

export interface GeminiResponse {
  emotion: string;
  sensory: string;
  dialogue: string;
}

export type AppMode = 'chat' | 'image' | 'upgrade' | 'bank';