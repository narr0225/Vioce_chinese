export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum SpeechSpeed {
  Slow = 0.75,
  Neutral = 1.0,
  Fast = 1.25,
  VeryFast = 1.5,
}

export interface TransliterationData {
  pinyin: string;
  thai: string;
}

export interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0 to 100
  error: string | null;
  audioDuration: number;
  transliteration: TransliterationData | null;
  hasAudio: boolean;
}

export interface AudioProcessingResult {
  buffer: AudioBuffer;
  duration: number;
}