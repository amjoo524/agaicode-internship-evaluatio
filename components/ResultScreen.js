'use client';
import React from 'react';
import { CheckCircle2, Sparkles, LayoutDashboard, Trophy, ArrowRight } from 'lucide-react';

export default function ResultScreen({ studentName, onSubmitFinal }) {
  return (
    <div className="py-8 px-4 animate-fadeIn max-w-xl mx-auto text-center font-sans">
      {/* Icon Badge */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-24 h-24 bg-slate-900 border-2 border-emerald-500/40 text-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-950/50">
          <CheckCircle2 className="w-12 h-12" />
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
        Thank You, <span className="text-indigo-400">{studentName || 'Student'}</span>!
      </h2>

      <p className="text-slate-400 text-sm font-medium mb-8">
        Your test has been evaluated and recorded securely into the academy portal.
      </p>

      {/* Quick Summary Card replacing old 'What Happens Next?' */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 text-left mb-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            Assessment Completed Successfully
          </span>
        </div>

        <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Great Job Completing Your Evaluation!</span>
        </h4>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          Your test answers have been processed. Detailed performance reports, topic breakdown charts, and step-by-step alternative solution explanations are now instantly available on your student dashboard.
        </p>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Instant Analytics Ready</span>
          <span className="text-emerald-400 font-bold">100% Score Generated</span>
        </div>
      </div>

      {/* Direct Quick-Action Link / Button */}
      <button
        type="button"
        onClick={onSubmitFinal}
        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Go to Dashboard & Review Answers</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}