import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 mb-8 bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-900/50 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.489.554 4.876 1.554 6.974.22.441.52.825.882 1.134.002.002.003.002.004.002.327.273.709.489 1.107.618 1.196.388 2.279.67 3.204.67 1.05 0 2.05-.333 2.87-.936l4.28-4.28c.944-.945 2.56-1.614 2.56-2.95V4.06zM18.5 4.5a.75.75 0 01.75.75 5.25 5.25 0 000 10.5.75.75 0 010 1.5 6.75 6.75 0 010-13.5.75.75 0 01-.75.75z" />
              <path d="M18.75 1.5a.75.75 0 000 1.5c3.037 0 5.578 2.228 6.096 5.127a.75.75 0 101.476-.264C25.728 4.232 22.583 1.5 18.75 1.5zM18.75 21a.75.75 0 010 1.5c3.833 0 6.978-2.732 7.572-6.363a.75.75 0 00-1.476-.264c-.518 2.899-3.059 5.127-6.096 5.127z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SinoVoice</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Chinese Text-to-Speech</p>
          </div>
        </div>
      </div>
    </header>
  );
};