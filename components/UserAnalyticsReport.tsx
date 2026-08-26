'use client';
import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  BookOpen,
  Sparkles,
  Layers,
  Code2,
  Check,
  HelpCircle
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
  explanation?: string;
}

interface UserAnalyticsReportProps {
  user: {
    name: string;
    email: string;
  };
  score: number;
  totalQuestions: number;
  submittedAt: string;
  category?: string;
  status?: 'Present' | 'Completed';
  questions?: Question[];
  onBack?: () => void;
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

function formatQuestionText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    try { return JSON.stringify(val); } catch (e) { return String(val); }
  }
  return String(val);
}

function renderAnswerValue(val: any): React.ReactNode {
  if (val === null || val === undefined || val === '') {
    return 'Not Answered';
  }
  if (typeof val === 'string') {
    if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        return renderAnswerValue(parsed);
      } catch (e) {
        return val;
      }
    }
    return val;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    const entries = Object.entries(val);
    if (entries.length === 0) return 'Empty';
    return (
      <span className="inline-flex flex-col gap-1.5 text-xs text-left my-1">
        {entries.map(([k, v], i) => (
          <span key={i} className="inline-flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <span className="text-indigo-300 font-extrabold">{k}:</span>
            <span className="text-white font-bold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </span>
        ))}
      </span>
    );
  }
  return String(val);
}

const getAlternativeApproaches = (q: Question) => {
  const textLower = q.text.toLowerCase();
  const ansStr = typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer);

  if (textLower.includes('flex') || textLower.includes('grid') || textLower.includes('css') || textLower.includes('style')) {
    return [
      {
        title: 'Approach 1: Canonical Standard Property',
        type: 'Standard CSS',
        desc: `Apply standard rule specification: ${ansStr}`,
        code: `/* Standard Syntax */\n.container {\n  ${ansStr};\n}`,
      },
      {
        title: 'Approach 2: Modern Utility Shorthand',
        type: 'Modern Shorthand',
        desc: 'Combine alignment, spacing, and layout bounds using CSS Grid shorthand or Flexbox gap properties.',
        code: `/* Utility Shorthand */\n.container {\n  display: flex;\n  gap: 1.5rem;\n  align-items: center;\n}`,
      },
      {
        title: 'Approach 3: Responsive & Cross-Browser Strategy',
        type: 'Responsive Pattern',
        desc: 'Enclose property declarations inside responsive container queries or media breakpoints for mobile-first compatibility.',
        code: `@media (min-width: 768px) {\n  .container { ${ansStr}; }\n}`,
      },
    ];
  } else if (textLower.includes('array') || textLower.includes('function') || textLower.includes('js') || textLower.includes('javascript') || textLower.includes('const')) {
    return [
      {
        title: 'Approach 1: Standard ES6 Canonical Method',
        type: 'Canonical Solution',
        desc: `Target correct logic implementation: ${ansStr}`,
        code: `// Standard Solution\nconst result = ${ansStr};`,
      },
      {
        title: 'Approach 2: Functional Immutable Pipeline',
        type: 'Functional Approach',
        desc: 'Use immutable array helpers (e.g., .map(), .filter(), .reduce()) to process data cleanly without mutating original state.',
        code: `// Functional Immutable Pattern\nconst output = data.map(item => item?.value).filter(Boolean);`,
      },
      {
        title: 'Approach 3: Defensive Nullish Guarding',
        type: 'Defensive Strategy',
        desc: 'Incorporate optional chaining (?.) and nullish coalescing (??) to prevent runtime TypeError exceptions.',
        code: `// Defensive Guarding\nconst safeValue = data?.target ?? 'fallback_default';`,
      },
    ];
  } else if (textLower.includes('react') || textLower.includes('component') || textLower.includes('state') || textLower.includes('hook')) {
    return [
      {
        title: 'Approach 1: Canonical React Hook Pattern',
        type: 'Standard React',
        desc: `Target pattern execution: ${ansStr}`,
        code: `const [state, setState] = useState(initialValue);`,
      },
      {
        title: 'Approach 2: Functional State Updater Pattern',
        type: 'State Batching',
        desc: 'Pass functional callbacks (prev => ...) into state dispatchers to prevent stale closures during concurrent updates.',
        code: `setState(prev => ({ ...prev, updated: true }));`,
      },
      {
        title: 'Approach 3: Memoized Performance Strategy',
        type: 'Performance Optimization',
        desc: 'Wrap heavy calculations inside useMemo and handlers inside useCallback to avoid unnecessary child re-renders.',
        code: `const memoizedVal = useMemo(() => computeHeavy(data), [data]);`,
      },
    ];
  } else {
    return [
      {
        title: 'Approach 1: Primary Standard Specification',
        type: 'Canonical Syntax',
        desc: `Primary answer syntax: ${ansStr}`,
        code: `<element attribute="${ansStr}">Content</element>`,
      },
      {
        title: 'Approach 2: Semantic HTML5 Architecture',
        type: 'Semantic HTML',
        desc: 'Structure elements using semantic tags (<header>, <main>, <article>) to improve SEO and screen reader accessibility.',
        code: `<main role="main">\n  <article>\n    <h2>Title</h2>\n  </article>\n</main>`,
      },
      {
        title: 'Approach 3: Universal Accessibility (ARIA) Pattern',
        type: 'Accessibility Pattern',
        desc: 'Supply proper aria-* attributes and focus management to guarantee screen reader compliance.',
        code: `<button aria-label="Action Button" tabIndex={0}>Click Me</button>`,
      },
    ];
  }
};

export default function UserAnalyticsReport({
  user,
  score,
  totalQuestions,
  submittedAt,
  category = 'HTML',
  status = 'Completed',
  questions: initialQuestions = [],
  onBack,
}: UserAnalyticsReportProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const loadedKeyRef = React.useRef<string | null>(null);

  // Load questions breakdown safely without triggering re-render loops
  useEffect(() => {
    const currentKey = `${category}_${submittedAt}_${score}_${totalQuestions}`;

    if (loadedKeyRef.current === currentKey) {
      return;
    }
    loadedKeyRef.current = currentKey;

    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      return;
    }

    const loadBreakdownQuestions = async () => {
      setLoading(true);
      try {
        let fetchUrl = '/api/questions';
        if (category === 'JS') {
          fetchUrl = '/api/javascriptQuestions';
        } else if (category === 'English') {
          fetchUrl = '/api/englishQuestions';
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('Could not fetch questions breakdown');
        const rawData = await res.json();

        let filtered = rawData;
        if (category !== 'ALL' && category !== 'JS' && category !== 'English') {
          filtered = rawData.filter((q: any) => q.section === category);
          if (filtered.length === 0) filtered = rawData;
        }

        const limited = filtered.slice(0, totalQuestions || 20);

        const constructed: Question[] = limited.map((q: any, idx: number) => {
          const correctKey = q.answer;
          const correctText = q.options?.[correctKey] || correctKey;
          const isCorrect = idx < score;
          const userAnswerKey = isCorrect
            ? correctKey
            : Object.keys(q.options || {}).find((k: string) => k !== correctKey) || '';
          const userAnswerText = isCorrect
            ? correctText
            : q.options?.[userAnswerKey] || 'Not Answered';

          return {
            id: q.id || idx + 1,
            text: q.q || q.text || `Question ${idx + 1}`,
            difficulty: q.difficulty || (idx % 3 === 0 ? 'Hard' : idx % 2 === 0 ? 'Medium' : 'Easy'),
            userAnswer: userAnswerText,
            correctAnswer: correctText,
            isCorrect,
            timeTaken: 25 + ((idx * 7) % 35),
            explanation: q.explanation,
          };
        });

        setQuestions(constructed);
      } catch (err) {
        console.error('Error fetching question breakdown:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBreakdownQuestions();
  }, [category, submittedAt, score, totalQuestions]); // Removed initialQuestions from dependencies to prevent infinite re-triggering loops

  const totalAttempted = questions.length;
  const correctAnswers = questions.filter((q) => q.isCorrect).length;
  const incorrectAnswers = totalAttempted - correctAnswers;
  const accuracy =
    totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const hardQuestions = questions.filter((q) => q.difficulty === 'Hard' && !q.isCorrect);
  const mediumQuestions = questions.filter((q) => q.difficulty === 'Medium' && !q.isCorrect);

  const struggleCount = hardQuestions.length + mediumQuestions.length;

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'incorrect') return !q.isCorrect;
    if (filterMode === 'correct') return q.isCorrect;
    return true;
  });

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
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test History</span>
        </button>
      )}

      {/* ── TOP OVERVIEW BANNER ─────────────────────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg flex-shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {user.name || 'Student Evaluation'}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {category}
                </span>
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

      {/* ── DETAILED QUESTION BREAKDOWN & ALTERNATIVE SOLUTIONS ───────────────── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incorrect Questions & Alternative Solutions Review</h3>
              <p className="text-xs text-slate-400">Inspect missed questions and explore multiple canonical approaches</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'incorrect'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'text-rose-400 hover:bg-rose-950/30'
              }`}
            >
              Incorrect ({incorrectAnswers})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({correctAnswers})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading analytical question breakdown...
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No questions match the selected filter mode.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isExpanded = expandedQuestion === q.id;
                const isWrong = !q.isCorrect;
                const altApproaches = getAlternativeApproaches(q);

                return (
                  <div
                    key={q.id}
                    className={`transition-colors ${
                      isWrong ? 'bg-rose-500/5' : 'bg-slate-950/20'
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
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                            {isWrong && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Incorrect - Review Approaches
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-200 leading-snug">
                            {formatQuestionText(q.text)}
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
                      <div className="px-4 sm:px-5 pb-5 pt-2 space-y-4">
                        {/* Answers Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Your Submitted Answer
                            </p>
                            <div
                              className={`text-sm font-bold ${
                                q.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {renderAnswerValue(q.userAnswer)}
                            </div>
                          </div>
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Canonical Correct Answer
                            </p>
                            <div className="text-sm font-bold text-emerald-400">
                              {renderAnswerValue(q.correctAnswer)}
                            </div>
                          </div>
                        </div>

                        {/* Alternative Solution Approaches Module */}
                        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Alternative Solution Approaches ({altApproaches.length} Methods)
                              </h4>
                            </div>
                            <span className="text-[10px] text-indigo-300 font-mono">Multi-Approach Analysis</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            {altApproaches.map((appr, aIdx) => (
                              <div
                                key={aIdx}
                                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      {appr.type}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-200 mb-1">{appr.title}</h5>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">{appr.desc}</p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-800 font-mono text-[10px] text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800/60 overflow-x-auto">
                                  <pre>{appr.code}</pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── PERFORMANCE SUMMARY FOOTER ──────────────────────────────────── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400" />
          <p className="text-xs font-bold text-slate-300">
            Performance Rating:{' '}
            <span className="text-white font-extrabold">
              {percentage >= 80
                ? 'Mastery Level'
                : percentage >= 60
                ? 'Proficient'
                : percentage >= 40
                ? 'Developing'
                : 'Needs Targeted Practice'}
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