import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { generateSpeech, getTransliteration } from './services/geminiService';
import { decodeAudioData } from './utils/audioUtils';
import { TTSState, VoiceName, SpeechSpeed } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [styleInstruction, setStyleInstruction] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [selectedSpeed, setSelectedSpeed] = useState<SpeechSpeed>(SpeechSpeed.Neutral);
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    progress: 0,
    error: null,
    audioDuration: 0,
    transliteration: null,
    hasAudio: false,
  });

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastAudioBufferRef = useRef<AudioBuffer | null>(null);
  
  // Playback Timing Refs
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const isPauseActionRef = useRef<boolean>(false);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Clear error and previous transliteration when input changes
    if (state.error || state.transliteration || state.hasAudio) {
      stopAudio();
      setState((prev) => ({ 
        ...prev, 
        error: null, 
        transliteration: null,
        hasAudio: false,
        isPaused: false,
        progress: 0
      }));
      lastAudioBufferRef.current = null;
      pausedAtRef.current = 0;
    }
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStyleInstruction(e.target.value);
    if (state.hasAudio) {
       stopAudio();
       setState(prev => ({ ...prev, hasAudio: false, isPaused: false, progress: 0 }));
       lastAudioBufferRef.current = null;
       pausedAtRef.current = 0;
    }
  };

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !lastAudioBufferRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    const elapsed = currentTime - startTimeRef.current;
    const duration = lastAudioBufferRef.current.duration / selectedSpeed;
    
    // Calculate percentage
    let percent = (elapsed / duration) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    setState(prev => ({ ...prev, progress: percent }));

    if (percent < 100) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [selectedSpeed]);

  const playBuffer = useCallback(async (buffer: AudioBuffer, offset: number = 0) => {
      // 1. Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000 
        });
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 2. Stop any currently playing audio
      stopAudio();

      // 3. Play the Audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = selectedSpeed;
      source.connect(audioContextRef.current.destination);
      
      // Calculate start time in AudioContext timeline
      // We want the audio to start playing at 'offset' seconds into the buffer.
      // So effectively, the 'start' of the buffer was at (currentTime - offset/speed).
      // However, start() takes (when, offset, duration).
      
      const playOffset = offset; // Offset into the buffer in seconds
      
      source.start(0, playOffset);
      
      // Track start time adjusted for speed to calculate progress correctly
      // Formula: elapsed_real_time * speed = elapsed_audio_time
      // So: elapsed_real_time = elapsed_audio_time / speed
      startTimeRef.current = audioContextRef.current.currentTime - (playOffset / selectedSpeed);
      
      audioSourceRef.current = source;
      isPauseActionRef.current = false;
      
      source.onended = () => {
        if (isPauseActionRef.current) {
          // Stopped explicitly for pause, do not reset state
          return;
        }
        setState((prev) => ({ ...prev, isPlaying: false, isPaused: false, progress: 100 }));
        pausedAtRef.current = 0;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      // Start Progress Loop
      updateProgress();

      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
  }, [selectedSpeed, stopAudio, updateProgress]);

  const handleSpeak = useCallback(async () => {
    if (!inputText.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter some text to speak." }));
      return;
    }

    stopAudio();
    pausedAtRef.current = 0;
    setState((prev) => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
           sampleRate: 24000 
        });
      }

      const speechPromise = generateSpeech(inputText, selectedVoice, styleInstruction);
      const transliterationPromise = getTransliteration(inputText);

      const [base64Audio, transliterationData] = await Promise.all([
        speechPromise,
        transliterationPromise
      ]);

      const audioBuffer = await decodeAudioData(
        base64Audio,
        audioContextRef.current,
        24000,
        1
      );

      lastAudioBufferRef.current = audioBuffer;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        audioDuration: audioBuffer.duration / selectedSpeed,
        transliteration: transliterationData,
        hasAudio: true
      }));

      await playBuffer(audioBuffer, 0);

    } catch (err: any) {
      console.error("Playback error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: err.message || "Failed to generate or play audio."
      }));
    }
  }, [inputText, selectedVoice, selectedSpeed, styleInstruction, playBuffer, stopAudio]);

  const handlePause = useCallback(() => {
    if (!audioContextRef.current || !state.isPlaying) return;

    // Calculate where we are
    const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * selectedSpeed;
    pausedAtRef.current = elapsed;
    
    // Set flag so onended doesn't reset everything
    isPauseActionRef.current = true;
    stopAudio();

    setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
  }, [state.isPlaying, selectedSpeed, stopAudio]);

  const handleResume = useCallback(() => {
    if (!lastAudioBufferRef.current) return;
    playBuffer(lastAudioBufferRef.current, pausedAtRef.current);
  }, [playBuffer]);

  const handleReplay = useCallback(async () => {
    if (lastAudioBufferRef.current) {
      pausedAtRef.current = 0;
      try {
        await playBuffer(lastAudioBufferRef.current, 0);
      } catch (err: any) {
        console.error("Replay error:", err);
        setState((prev) => ({ ...prev, error: "Failed to replay audio." }));
      }
    }
  }, [playBuffer]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-slate-900 rounded-2xl shadow-xl shadow-black/20 border border-slate-800 overflow-hidden">
          
          {/* Top Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 relative z-10">Chinese Text-to-Speech</h2>
            <p className="text-indigo-100 relative z-10 opacity-90">
              Transform your Chinese text into natural-sounding speech instantly.
            </p>
          </div>

          <div className="p-8">
            {/* Input Area */}
            <div className="mb-6">
              <label htmlFor="chinese-input" className="block text-sm font-semibold text-slate-300 mb-2">
                Input Text (Chinese)
              </label>
              <div className="relative">
                <textarea
                  id="chinese-input"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="在此处输入中文文本 (Type or paste Chinese text here)..."
                  className="chinese-text w-full min-h-[150px] p-4 rounded-xl border-2 border-slate-700 bg-slate-950 text-slate-100 text-lg focus:border-indigo-500 focus:bg-slate-900 focus:ring-0 transition-all resize-y placeholder:text-slate-600"
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-500 pointer-events-none font-medium">
                  {inputText.length} chars
                </div>
              </div>
            </div>

             {/* Style Instructions */}
            <div className="mb-6">
              <label htmlFor="style-instruction" className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>Style / Tone Instructions</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Optional</span>
              </label>
              <input
                id="style-instruction"
                type="text"
                value={styleInstruction}
                onChange={handleStyleChange}
                placeholder="E.g., Cheerful, Excited, Whisper, Serious news anchor..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:border-indigo-500 focus:bg-slate-900 focus:ring-0 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Transliteration Results */}
            {state.transliteration && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">English Pinyin</span>
                    <div className="h-px flex-1 bg-slate-700/50"></div>
                  </div>
                  <p className="text-lg text-indigo-300 font-medium font-mono leading-relaxed">{state.transliteration.pinyin}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                   <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thai Pronunciation</span>
                    <div className="h-px flex-1 bg-slate-700/50"></div>
                  </div>
                  <p className="text-lg text-emerald-300 font-medium leading-relaxed">{state.transliteration.thai}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            {/* Controls */}
            <Controls 
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              selectedSpeed={selectedSpeed}
              onSpeedChange={setSelectedSpeed}
              isLoading={state.isLoading}
              isPlaying={state.isPlaying}
              isPaused={state.isPaused}
              progress={state.progress}
              hasAudio={state.hasAudio}
              disabled={inputText.length === 0}
              onSpeak={handleSpeak}
              onReplay={handleReplay}
              onPause={handlePause}
              onResume={handleResume}
            />
          </div>

          <div className="bg-slate-900 px-8 py-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Powered by Gemini 2.5 Flash</span>
            <span className={state.isPlaying ? "text-indigo-400 font-semibold transition-colors duration-300" : ""}>
              {state.isPlaying ? "Playing..." : state.isPaused ? "Paused" : "Ready"}
            </span>
          </div>
        </div>
        
        {/* Sample Suggestions */}
        <div className="mt-8">
           <p className="text-sm text-slate-400 font-medium mb-4 uppercase tracking-wide">Sample Phrases</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {[
               "你好，今天天气怎么样？",
               "我喜欢学习新的编程语言。",
               "请问去最近的火车站怎么走？",
               "这是一个非常棒的文本转语音演示。"
             ].map((phrase, idx) => (
               <button 
                key={idx}
                onClick={() => setInputText(phrase)}
                className="text-left p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-950/30 transition-all duration-200 text-sm chinese-text"
               >
                 {phrase}
               </button>
             ))}
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;