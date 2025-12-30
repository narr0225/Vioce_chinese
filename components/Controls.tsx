import React from 'react';
import { VoiceName, SpeechSpeed } from '../types';

interface ControlsProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  selectedSpeed: SpeechSpeed;
  onSpeedChange: (speed: SpeechSpeed) => void;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  hasAudio: boolean;
  disabled: boolean;
  onSpeak: () => void;
  onReplay: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  selectedVoice,
  onVoiceChange,
  selectedSpeed,
  onSpeedChange,
  isLoading,
  isPlaying,
  isPaused,
  progress,
  hasAudio,
  disabled,
  onSpeak,
  onReplay,
  onPause,
  onResume,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Settings Row */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-1/2">
          <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300 mb-1">
            Voice Tone
          </label>
          <div className="relative">
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
              disabled={isLoading || isPlaying}
              className="block w-full rounded-lg border-slate-700 bg-slate-800 py-2.5 pl-3 pr-10 text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-900 disabled:text-slate-600 border transition-colors"
            >
              {Object.values(VoiceName).map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full sm:w-1/2">
          <label htmlFor="speed-select" className="block text-sm font-medium text-slate-300 mb-1">
            Speech Speed
          </label>
          <div className="relative">
            <select
              id="speed-select"
              value={selectedSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value) as SpeechSpeed)}
              disabled={isLoading || isPlaying}
              className="block w-full rounded-lg border-slate-700 bg-slate-800 py-2.5 pl-3 pr-10 text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-900 disabled:text-slate-600 border transition-colors"
            >
              <option value={SpeechSpeed.Slow}>Slow (0.75x)</option>
              <option value={SpeechSpeed.Neutral}>Neutral (1.0x)</option>
              <option value={SpeechSpeed.Fast}>Fast (1.25x)</option>
              <option value={SpeechSpeed.VeryFast}>Very Fast (1.5x)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        onClick={onSpeak}
        disabled={disabled || isLoading || isPlaying}
        className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-semibold text-white shadow-md transition-all duration-200 
          ${disabled || isLoading || isPlaying ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-900/20 active:scale-[0.98]'}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Synthesizing...</span>
          </>
        ) : isPlaying ? (
          <>
             <span className="flex h-3 w-3 relative mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span>Synthesizing Complete</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.489.554 4.876 1.554 6.974.22.441.52.825.882 1.134.002.002.003.002.004.002.327.273.709.489 1.107.618 1.196.388 2.279.67 3.204.67 1.05 0 2.05-.333 2.87-.936l4.28-4.28c.944-.945 2.56-1.614 2.56-2.95V4.06zM18.5 4.5a.75.75 0 01.75.75 5.25 5.25 0 000 10.5.75.75 0 010 1.5 6.75 6.75 0 010-13.5.75.75 0 01-.75.75z" />
            </svg>
            <span>{hasAudio ? 'Generate New Version' : 'Speak Text'}</span>
          </>
        )}
      </button>

      {/* Media Player Controls (Visible when audio exists) */}
      {hasAudio && (
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Play/Pause Toggle */}
          <button
            onClick={isPlaying ? onPause : isPaused ? onResume : onReplay}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Progress Bar Container */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
             <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>{isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Finished'}</span>
                <span>{Math.round(progress)}%</span>
             </div>
             <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
               <div 
                 className="bg-indigo-500 h-full rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                 style={{ width: `${progress}%` }}
               ></div>
             </div>
          </div>

          {/* Replay (Restart) Button */}
          <button
            onClick={onReplay}
            disabled={isLoading}
            className="flex-shrink-0 p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Restart Audio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};