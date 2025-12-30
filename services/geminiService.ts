import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceName } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateSpeech = async (
  text: string, 
  voice: VoiceName,
  styleInstruction?: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // For the TTS model, systemInstruction in config can cause internal errors.
  // Instead, we embed the style instruction into the prompt text as a stage direction.
  const promptText = styleInstruction 
    ? `(Tone: ${styleInstruction}) ${text}` 
    : text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.[0];

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini API.");
    }

    return audioPart.inlineData.data;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};

export const getTransliteration = async (text: string): Promise<{pinyin: string, thai: string}> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the Pinyin (with tone marks) and Thai phonetic transliteration for this Chinese text: "${text}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pinyin: { 
              type: Type.STRING,
              description: "The Pinyin romanization of the Chinese text."
            },
            thai: { 
              type: Type.STRING, 
              description: "The Thai phonetic pronunciation (transliteration) of the Chinese text."
            },
          },
          required: ["pinyin", "thai"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text returned from Gemini for transliteration.");
    }

    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini Transliteration Error:", error);
    // Return empty strings if transliteration fails so we don't block the main UI
    return { pinyin: "Unavailable", thai: "Unavailable" };
  }
};