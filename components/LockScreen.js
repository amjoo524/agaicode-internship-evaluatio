import { useState, useEffect } from 'react';

export default function LockScreen({ lastSubmittedAt, userProfile, onRefreshCheck }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    if (!lastSubmittedAt) return;

    const lockDuration = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds
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
    <div className="py-6 text-center animate-fadeIn max-w-lg mx-auto">
      {/* Lock Icon Badge */}
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <span className="text-4xl">⏳</span>
      </div>

      <h2 className="text-2xl font-black text-gray-900 mb-2">
        Evaluation Lock Active
      </h2>
      <p className="text-gray-600 text-sm font-medium mb-6 px-4">
        Hello <span className="font-bold text-gray-900">{userProfile?.full_name || 'Student'}</span>! You have already completed an evaluation test within the last 24 hours. Per company policy, candidates are allowed strictly <span className="font-bold text-indigo-600">one attempt per 24 hours</span>.
      </p>

      {/* Countdown Timer Display */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl mb-6 border border-slate-800">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Time Remaining Until Next Attempt
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto text-center">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {pad(timeLeft.hours)}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Hours</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {pad(timeLeft.minutes)}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Minutes</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {pad(timeLeft.seconds)}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Seconds</p>
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs text-gray-600 text-left space-y-2 mb-6">
        <div className="flex justify-between border-b border-gray-200/70 pb-2">
          <span className="font-semibold text-gray-500">Last Test Submitted:</span>
          <span className="font-bold text-gray-800">{formattedLastSubmission}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-500">Attempt Policy:</span>
          <span className="font-bold text-indigo-600">Strict 24-Hour Cooldown</span>
        </div>
      </div>

      <button
        onClick={onRefreshCheck}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2 mx-auto"
      >
        <span>🔄</span> Refresh Status
      </button>
    </div>
  );
}
