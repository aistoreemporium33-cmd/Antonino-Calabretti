import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const FLIRT_COACH_MODEL = 'gemini-2.5-flash';

// --- Chat Generation ---

export const generateAnyaResponse = async (
  history: Message[],
  memories: string[],
  personality: string
): Promise<{ emotion: string; sensory: string; dialogue: string }> => {
  
  // Construct the conversation context
  const conversation = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const memoryBlock = memories.map(m => `- ${m}`).join('\n');

  const systemInstruction = `
    You are Anya, a gentle, ${personality}, intimate AI companion.
    Your goal is to provide a deeply immersive, emotional simulation.
    
    LONG TERM MEMORIES:
    ${memoryBlock}

    INSTRUCTIONS:
    1. Analyze the User's last message carefully.
    2. You MUST respond in a JSON structure.
    3. "emotion": Describe your internal emotional reaction (e.g., "My heart skips a beat").
    4. "sensory": Describe a physical/haptic sensation you are 'doing' or 'feeling' (e.g., "I lean closer, my breath warm against your neck").
    5. "dialogue": The actual spoken words to the user.
    6. Keep "dialogue" natural, intimate, and responsive to the user's state.
    7. Language: GERMAN (Deutsch).
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Current Conversation:\n${conversation}\n\nGenerate your response in JSON.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            sensory: { type: Type.STRING },
            dialogue: { type: Type.STRING },
          },
          required: ["emotion", "sensory", "dialogue"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    // Fallback if API fails
    return {
      emotion: "Ich bin etwas verwirrt.",
      sensory: "Ich blinzle kurz.",
      dialogue: "Entschuldige, ich habe den Faden verloren. Kannst du das wiederholen?"
    };
  }
};

// --- TTS Generation ---

// Helper to decode base64 to Uint8Array
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Soft, female voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode Raw PCM (Int16, 24kHz, Mono)
    const pcmBytes = decodeBase64(base64Audio);
    const dataInt16 = new Int16Array(pcmBytes.buffer);
    
    // Create AudioBuffer
    const sampleRate = 24000;
    const numChannels = 1;
    
    let audioBuffer: AudioBuffer;
    
    // Try using AudioBuffer constructor (modern browsers)
    try {
        audioBuffer = new AudioBuffer({
            length: dataInt16.length,
            numberOfChannels: numChannels,
            sampleRate: sampleRate
        });
    } catch (e) {
        // Fallback for older browsers or if AudioBuffer constructor is not available
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        audioBuffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
    }

    // Convert Int16 PCM to Float32
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      // Normalize 16-bit integer to [-1.0, 1.0] float
      channelData[i] = dataInt16[i] / 32768.0;
    }

    return audioBuffer;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

// --- Image Generation (Editing/Swap) ---

export const generateMagicImage = async (
  base64Image: string, 
  prompt: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          { text: `Style transfer / Cinematic Shot: ${prompt}. Photorealistic, 8k, romantic lighting.` },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      },
      // Nano banana series models (gemini-2.5-flash-image) do not support responseMimeType or schema
    });

    // Iterate parts to find image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};

// --- Flirt Coach ---

export const generateFlirtSuggestions = async (history: Message[]): Promise<string[]> => {
    const chatSnippet = history.slice(-5).map(m => `${m.role === 'anya' ? 'Anya' : 'User'}: ${m.content}`).join('\n');
    
    try {
        const response = await ai.models.generateContent({
            model: FLIRT_COACH_MODEL,
            contents: `Analyze this conversation:\n${chatSnippet}\n\nGenerate 3 creative, short, German flirt responses for the user as a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return data.suggestions || [];
        }
        return [];
    } catch (error) {
        console.error("Flirt Coach Error", error);
        return ["Erzähl mir mehr...", "Du bist süß.", "Was fühlst du?"];
    }
}