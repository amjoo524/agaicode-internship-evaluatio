'use client';
import { useState } from 'react';
import {
  User,
  Mail,
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Question {
  id: number;
  text: string;
  difficulty?: Difficulty;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface UserAnalyticsReportProps {
  user: {
    name: string;
    email: string;
  };
  score: number;
  totalQuestions: number;
  submittedAt: string;
  status?: 'Present' | 'Completed';
  questions: Question[];
}

function getDifficultyColor(difficulty?: Difficulty) {
  switch (difficulty) {
    case 'Easy':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Hard':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
}

function getDifficultyBadge(difficulty?: Difficulty) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border';
  switch (difficulty) {
    case 'Easy':
      return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`;
    case 'Medium':
      return `${base} bg-amber-500/10 text-amber-400 border-amber-500/30`;
    case 'Hard':
      return `${base} bg-rose-500/10 text-rose-400 border-rose-500/30`;
    default:
      return `${base} bg-slate-500/10 text-slate-400 border-slate-500/30`;
  }
}

export default function UserAnalyticsReport({
  user,
  score,
  totalQuestions,
  submittedAt,
  status = 'Completed',
  questions,
}: UserAnalyticsReportProps) {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const totalAttempted = questions.length;
  const correctAnswers = questions.filter((q) => q.isCorrect).length;
  const incorrectAnswers = totalAttempted - correctAnswers;
  const accuracy =
    totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const hardQuestions = questions.filter((q) => q.difficulty === 'Hard' && !q.isCorrect);
  const mediumQuestions = questions.filter((q) => q.difficulty === 'Medium' && !q.isCorrect);
  const easyQuestions = questions.filter((q) => q.difficulty === 'Easy' && !q.isCorrect);

  const struggleCount = hardQuestions.length + mediumQuestions.length;

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 font-sans p-3 sm:p-6">
      {/* ── TOP OVERVIEW BANNER ─────────────────────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {user.name || 'Student'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                    status === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {status}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Submitted: {formatDate(submittedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
              <p className="text-3xl font-black text-white">
                {score}<span className="text-lg text-slate-500">/{totalQuestions}</span>
              </p>
            </div>
            <div className="w-px h-12 bg-slate-800" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
              <p className="text-3xl font-black text-indigo-400">{percentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attempted</p>
            <p className="text-3xl sm:text-4xl font-black text-white">{totalAttempted}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Correct</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">{correctAnswers}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Incorrect</p>
            <p className="text-3xl sm:text-4xl font-black text-rose-400">{incorrectAnswers}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-3xl sm:text-4xl font-black text-amber-400">{accuracy}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── DIFFICULTY / STRUGGLE INDICATOR ─────────────────────────────── */}
      {struggleCount > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Struggle Indicator</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-3">
            You struggled with <span className="text-rose-400 font-bold">{struggleCount}</span> question{struggleCount !== 1 ? 's' : ''} that were marked as Medium or Hard.
          </p>
          <div className="flex flex-wrap gap-2">
            {hardQuestions.map((q) => (
              <span key={q.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg">
                <AlertCircle className="w-3 h-3" />
                Q{q.id}: {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
              </span>
            ))}
            {mediumQuestions.map((q) => (
              <span key={q.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg">
                <AlertCircle className="w-3 h-3" />
                Q{q.id}: {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAILED QUESTION BREAKDOWN ─────────────────────────────────── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Question Breakdown</h3>
          </div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            {showBreakdown ? 'Hide' : 'Show'}
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showBreakdown && (
          <div className="divide-y divide-slate-800/60">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestion === q.id;
              const isWrong = !q.isCorrect;
              const isHardWrong = q.difficulty === 'Hard' && isWrong;

              return (
                <div
                  key={q.id}
                  className={`transition-colors ${
                    isHardWrong
                      ? 'bg-rose-500/5'
                      : isWrong
                      ? 'bg-amber-500/5'
                      : 'bg-slate-950/20'
                  }`}
                >
                  <div
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    className="p-4 sm:p-5 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          q.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            Q{idx + 1}
                          </span>
                          {q.difficulty && (
                            <span className={getDifficultyBadge(q.difficulty)}>
                              {q.difficulty === 'Hard' && <Flame className="w-3 h-3" />}
                              {q.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-200 leading-snug">
                          {q.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {q.timeTaken && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(q.timeTaken)}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Your Answer
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              q.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {q.userAnswer || 'Not Answered'}
                          </p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Correct Answer
                          </p>
                          <p className="text-sm font-bold text-emerald-400">{q.correctAnswer}</p>
                        </div>
                      </div>

                      {isWrong && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <p className="text-[11px] font-semibold text-amber-300">
                            Incorrect answer{q.difficulty ? ` on a ${q.difficulty} question` : ''}. Review the concept to improve.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PERFORMANCE SUMMARY FOOTER ──────────────────────────────────── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400" />
          <p className="text-xs font-bold text-slate-300">
            Performance:{' '}
            <span className="text-white">
              {percentage >= 80
                ? 'Excellent'
                : percentage >= 60
                ? 'Good'
                : percentage >= 40
                ? 'Average'
                : 'Needs Improvement'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Correct: {correctAnswers}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            Incorrect: {incorrectAnswers}
          </span>
          {struggleCount > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Struggles: {struggleCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
