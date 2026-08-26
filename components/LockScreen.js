'use client';
import { useState, useEffect } from 'react';

export default function LockScreen({ lastSubmittedAt, userProfile, checkingLock, onRefreshCheck }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    if (!lastSubmittedAt) return;

    const lockDuration = 12 * 60 * 60 * 1000; // 12 Hours in milliseconds
    const unlockTime = new Date(lastSubmittedAt).getTime() + lockDuration;

    const updateTimer = () => {
      const now = Date.now();
      const diff = unlockTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onRefreshCheck) onRefreshCheck();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, totalMs: diff });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastSubmittedAt, onRefreshCheck]);

  const pad = (num) => String(num).padStart(2, '0');

  const formattedLastSubmission = lastSubmittedAt
    ? new Date(lastSubmittedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  return (
    <div className="min-h-[80vh] w-full flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[750px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl text-center animate-fadeIn">
        
        {/* Lock Icon Badge */}
        <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-amber-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h2 className="text-3xl font-black text-white mb-3">
          Evaluation Lock Active
        </h2>
        <p className="text-slate-300 text-sm lg:text-base font-medium mb-8 px-4 leading-relaxed">
          Hello <span className="font-bold text-white">{userProfile?.full_name || 'Student'}</span>! You have already completed an evaluation test within the last 12 hours. Per company policy, candidates are allowed strictly <span className="font-bold text-indigo-400">one attempt per 12 hours</span>.
        </p>

        {/* Countdown Timer Display */}
        <div className="bg-slate-950/80 text-white rounded-2xl p-6 shadow-xl mb-8 border border-slate-800/80">
          <p className="text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            Time Remaining Until Next Attempt
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
              <span className="text-4xl lg:text-5xl font-black text-amber-400 font-mono">
                {pad(timeLeft.hours)}
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase mt-2">Hours</p>
            </div>
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
              <span className="text-4xl lg:text-5xl font-black text-amber-400 font-mono">
                {pad(timeLeft.minutes)}
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase mt-2">Minutes</p>
            </div>
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
              <span className="text-4xl lg:text-5xl font-black text-amber-400 font-mono">
                {pad(timeLeft.seconds)}
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase mt-2">Seconds</p>
            </div>
          </div>
        </div>

        {/* Info Details */}
        <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/80 text-sm text-slate-300 text-left space-y-3 mb-8">
          <div className="flex justify-between border-b border-slate-800/60 pb-3">
            <span className="font-semibold text-slate-400">Last Test Submitted:</span>
            <span className="font-bold text-slate-200">{formattedLastSubmission}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">Attempt Policy:</span>
            <span className="font-bold text-indigo-400">Strict 12-Hour Cooldown</span>
          </div>
        </div>

        <button
          onClick={onRefreshCheck}
          disabled={checkingLock}
          className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-950 flex items-center justify-center gap-2.5 cursor-pointer ${checkingLock ? 'opacity-55 cursor-not-allowed' : ''}`}
        >
          <svg className={`w-5 h-5 ${checkingLock ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{checkingLock ? 'Checking Status...' : 'Refresh Status'}</span>
        </button>

      </div>
    </div>
  );
}