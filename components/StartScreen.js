import React from 'react';
import {
  Zap,
  HelpCircle,
  Gauge,
  ArrowRight,
  Clock,
  CheckSquare,
  Settings,
  BookOpen,
  ArrowLeft,
  Tag
} from 'lucide-react';

export default function StartScreen({
  selectedCategory = 'HTML',
  selectedTopics = [],
  questionLimit,
  setQuestionLimit,
  selfRating,
  setSelfRating,
  onStart,
  onStartQuiz,
  onBackToDashboard,
}) {
  const handleStartSubmit = (e) => {
    e.preventDefault();
    const startFn = onStart || onStartQuiz;
    if (typeof startFn === 'function') {
      startFn();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col lg:flex-row m-0 p-0">
      {/* Left side - Information & Guidelines */}
      <div className="w-full lg:w-1/2 p-8 lg:p-20 pt-12 lg:pt-20 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-slate-800/60">
        <div className="flex items-center gap-3 mb-6">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4" /> Evaluation Module
          </div>
        </div>

        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
          {selectedCategory} <br className="hidden lg:block" /> Assessment Test
        </h1>

        <p className="text-slate-400 text-base mt-6 max-w-md">
          Review your selected topics and configure test parameters before beginning your evaluation.
        </p>

        {/* Selected Topics Summary Badge Box */}
        <div className="mt-8 bg-indigo-950/30 rounded-2xl border border-indigo-500/30 p-6 max-w-md">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4" /> Selected Assessment Topics
          </div>
          {selectedTopics && selectedTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">All topics included for {selectedCategory}</p>
          )}
        </div>

        {/* Guidelines Section */}
        <div className="mt-8 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 max-w-md">
          <h3 className="text-lg font-bold text-slate-200 mb-5 border-b border-slate-800 pb-3">
            Assessment Guidelines
          </h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Timed Evaluation:</strong> You have 90 seconds per question. Time is tracked automatically.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Final Submission:</strong> Once started, you cannot pause. Your score is recorded immediately upon completion.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - Configuration Form */}
      <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center bg-[#020617]">
        <form onSubmit={handleStartSubmit} className="space-y-8 max-w-2xl w-full mx-auto">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">Exam Parameters</h2>
            </div>
            <p className="text-sm text-slate-400">
              Set your target question count and self-rating before starting.
            </p>
          </div>

          {/* Question Limit Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Number of Questions
            </label>
            <div className="flex flex-wrap gap-3">
              {[20, 30, 40, 50, 'ALL'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQuestionLimit(opt)}
                  className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    questionLimit === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                      : 'border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  {opt === 'ALL' ? 'All' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge Rating Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" /> Knowledge Rating
              </span>
              <span className="text-sm font-bold text-indigo-400">{selfRating}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selfRating}
              onChange={(e) => setSelfRating(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer 
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-5 
              [&::-webkit-slider-thumb]:h-5 
              [&::-webkit-slider-thumb]:bg-indigo-500 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:cursor-pointer 
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:w-5 
              [&::-moz-range-thumb]:h-5 
              [&::-moz-range-thumb]:bg-indigo-500 
              [&::-moz-range-thumb]:border-0 
              [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:cursor-pointer 
              [&::-moz-range-thumb]:shadow-lg"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 text-lg shadow-xl shadow-indigo-950/50 cursor-pointer"
          >
            <span>Take Assessment Test</span> <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}