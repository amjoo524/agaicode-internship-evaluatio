'use client';
import React, { useState } from 'react';
import {
  Globe,
  Palette,
  Zap,
  Atom,
  Triangle,
  Flame,
  Trophy,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookOpen,
  Eye,
  LogOut,
  Sparkles,
  LayoutDashboard,
  History,
  ChevronRight,
  Target,
  FileText,
  ExternalLink,
  Code2,
  Lightbulb,
  Bell,
  Clock,
  Trash2
} from 'lucide-react';
import TopicSelectionModal from './TopicSelectionModal';
import UserAnalyticsReport from './UserAnalyticsReport';

export interface StudentSubmissionRecord {
  id?: string;
  submitted_at: string;
  student_name: string;
  category: string;
  score: number;
  total_questions: number;
  self_rating?: number;
}

export interface NotificationItem {
  id: string | number;
  type: string;
  title: string;
  message: string;
  studentName?: string;
  category?: string;
  timestamp: string;
  read: boolean;
}

interface StudentDashboardProps {
  userProfile: any;
  submissions: StudentSubmissionRecord[];
  onSelectSubject: (subject: string, topics: string[]) => void;
  onSignOut: () => void;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
  onClearNotifications?: () => void;
  submissionToastMsg?: string | null;
  onDismissToast?: () => void;
}

const SUBJECT_CONFIGS: Record<string, { name: string; desc: string; icon: any; color: string; bg: string; border: string }> = {
  HTML: {
    name: 'HTML5',
    desc: 'Semantics, Elements, Forms & Accessibility',
    icon: Globe,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  CSS: {
    name: 'CSS3',
    desc: 'Flexbox, Grid, Animations & Responsive Design',
    icon: Palette,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  JS: {
    name: 'JavaScript',
    desc: 'ES6+, DOM, Async/Await, Scope & Closures',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  React: {
    name: 'React.js',
    desc: 'Hooks, State Management, Virtual DOM & Lifecycle',
    icon: Atom,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  'Next.js': {
    name: 'Next.js',
    desc: 'App Router, Server Components, SSR & API Routes',
    icon: Triangle,
    color: 'text-white',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
};

const STUDY_RESOURCES = [
  {
    title: 'HTML5 Semantic Reference & Cheat Sheet',
    category: 'HTML',
    desc: 'Complete overview of semantic elements (<header>, <article>, <section>), form validation attributes, and accessibility standards.',
    linkText: 'Read HTML Guide',
  },
  {
    title: 'CSS Flexbox & Grid Master Guide',
    category: 'CSS',
    desc: 'Visual reference guide covering container properties, alignment tricks, responsive grid templates, and CSS custom properties.',
    linkText: 'Read CSS Guide',
  },
  {
    title: 'Modern JavaScript ES6+ Quick Reference',
    category: 'JS',
    desc: 'Essential snippets for arrow functions, array methods (map, filter, reduce), promises, async/await, and DOM manipulation.',
    linkText: 'Read JS Guide',
  },
  {
    title: 'React 18 Hooks & State Patterns',
    category: 'React',
    desc: 'Best practices for useState, useEffect, custom hooks, prop drilling solutions, and component lifecycle management.',
    linkText: 'Read React Guide',
  },
  {
    title: 'Next.js App Router Architecture Guide',
    category: 'Next.js',
    desc: 'Deep dive into file-based routing, Server Components vs Client Components, data fetching strategies, and API route handlers.',
    linkText: 'Read Next.js Guide',
  },
];

export default function StudentDashboard({
  userProfile,
  submissions = [],
  onSelectSubject,
  onSignOut,
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  submissionToastMsg,
  onDismissToast,
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'resources'>('dashboard');
  const [modalSubject, setModalSubject] = useState<string | null>(null);
  const [reviewSubmission, setReviewSubmission] = useState<StudentSubmissionRecord | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Calculate high-level statistics
  const totalAttempted = submissions.length;
  const totalScore = submissions.reduce((acc, curr) => acc + curr.score, 0);
  const totalMaxScore = submissions.reduce((acc, curr) => acc + curr.total_questions, 0);
  const avgPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const passedTestsCount = submissions.filter(
    (sub) => (sub.total_questions > 0 ? (sub.score / sub.total_questions) * 100 : 0) >= 70
  ).length;

  // Topic Proficiency breakdown
  const topicStats: Record<string, { totalScore: number; totalQuestions: number; attempts: number }> = {};
  submissions.forEach((sub) => {
    const cat = sub.category || 'HTML';
    if (!topicStats[cat]) {
      topicStats[cat] = { totalScore: 0, totalQuestions: 0, attempts: 0 };
    }
    topicStats[cat].totalScore += sub.score;
    topicStats[cat].totalQuestions += sub.total_questions;
    topicStats[cat].attempts += 1;
  });

  const subjectNames = ['HTML', 'CSS', 'JS', 'React', 'Next.js'];

  // Handle modal trigger
  const handleOpenSubjectModal = (subjectKey: string) => {
    setModalSubject(subjectKey);
  };

  const handleModalConfirm = (subject: string, selectedTopics: string[]) => {
    setModalSubject(null);
    onSelectSubject(subject, selectedTopics);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Real-time Submission Success Toast */}
      {submissionToastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/50 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-bounce max-w-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Evaluation Submitted Successfully!</h4>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{submissionToastMsg}</p>
          </div>
          <button onClick={onDismissToast} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                SkillPortal <span className="text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">STUDENT</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Test History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Resources</span>
          </button>
        </nav>

        {/* Right Side: Active Streak, Notifications & Logout Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300">5 Day Streak</span>
          </div>

          {/* Student Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown && onMarkAllRead) onMarkAllRead();
              }}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl border border-slate-800 transition-all cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 bg-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce shadow-md">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-xl">
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Evaluation Alerts</h4>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-bold text-slate-300">No new notifications</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Test submission confirmations will be logged here.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 transition-colors ${
                          !item.read ? 'bg-indigo-500/5' : 'bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            {item.category || 'Submission Confirmation'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 leading-snug">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white">{userProfile?.full_name || 'Student User'}</span>
              <span className="block text-[10px] text-slate-400">{userProfile?.email || 'student@portal.com'}</span>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="p-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Main Content area - Rendered based on activeTab */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* VIEW 1: MAIN DASHBOARD */}
        {(activeTab === 'dashboard' || activeTab === 'analytics' || activeTab === 'history') && (
          <>
            {/* 1. Welcome & Profile Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Welcome Back
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Ready for your next challenge, {userProfile?.full_name?.split(' ')[0] || 'Student'}?
                  </h1>
                  <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
                    Select a subject below to test your technical skills, improve your topic proficiency, and view detailed analytical reports.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Overall Mastery</span>
                      <span className="text-xl font-black text-white">{avgPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Performance & Progress Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tests</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mt-3">{totalAttempted}</p>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Completed evaluations</span>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-400 mt-3">{avgPercentage}%</p>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Accuracy rate across all tests</span>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passed Tests</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mt-3">{passedTestsCount}</p>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Score ≥ 70%</span>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Practice</span>
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mt-3">{totalAttempted - passedTestsCount}</p>
                <span className="text-[11px] text-rose-400 font-semibold mt-1 block">Score &lt; 70%</span>
              </div>
            </div>
          </>
        )}

        {/* VIEW SPECIFIC CONTENT */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> Select Subject Assessment
                </h2>
                <p className="text-xs text-slate-400">Click any subject card to configure topic areas and begin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjectNames.map((key) => {
                const cfg = SUBJECT_CONFIGS[key];
                const IconComp = cfg.icon;
                const subStat = topicStats[key];
                const topicAvg =
                  subStat && subStat.totalQuestions > 0
                    ? Math.round((subStat.totalScore / subStat.totalQuestions) * 100)
                    : 0;

                return (
                  <div
                    key={key}
                    onClick={() => handleOpenSubjectModal(key)}
                    className="group bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/20 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3.5 rounded-2xl border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                          {subStat ? `${subStat.attempts} Attempt(s)` : 'New Test'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {cfg.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cfg.desc}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Proficiency</span>
                        <span className="text-sm font-extrabold text-white">
                          {subStat ? `${topicAvg}%` : 'Not Attempted'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="px-3.5 py-2 bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>Select Topics</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: ANALYTICS (FULL VIEW) OR DASHBOARD INCLUDED */}
        {(activeTab === 'dashboard' || activeTab === 'analytics') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Progress Line Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Score Progress Trend
                  </h3>
                  <p className="text-xs text-slate-400">Historical performance over recent attempts</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Analytics
                </span>
              </div>

              {submissions.length > 0 ? (
                <div className="h-56 w-full relative flex items-end pt-6 pb-2 px-2 border-b border-l border-slate-800/80">
                  <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" preserveAspectRatio="none">
                    {(() => {
                      const points = submissions
                        .slice(0, 10)
                        .reverse()
                        .map((sub, i, arr) => {
                          const pct = sub.total_questions > 0 ? (sub.score / sub.total_questions) * 100 : 0;
                          const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                          const y = 100 - pct;
                          return { x, y, pct, cat: sub.category };
                        });

                      if (points.length === 1) {
                        return (
                          <circle cx={`${points[0].x}%`} cy={`${points[0].y}%`} r="6" fill="#6366f1" />
                        );
                      }

                      const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`, '');

                      return (
                        <>
                          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="#6366f1" stroke="#020617" strokeWidth="2" />
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                  <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
                  No test data yet. Take your first test to see performance trends!
                </div>
              )}
            </div>

            {/* Topic-wise Strength / Weakness Bar Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" /> Topic Proficiency Matrix
                  </h3>
                  <p className="text-xs text-slate-400">Strengths & areas needing practice</p>
                </div>
              </div>

              <div className="space-y-3.5 my-auto">
                {subjectNames.map((subj) => {
                  const stat = topicStats[subj];
                  const pct = stat && stat.totalQuestions > 0 ? Math.round((stat.totalScore / stat.totalQuestions) * 100) : 0;
                  const isStrong = pct >= 70;

                  return (
                    <div key={subj} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">{subj}</span>
                        <span className={isStrong ? 'text-emerald-400' : pct > 0 ? 'text-amber-400' : 'text-slate-500'}>
                          {stat ? `${pct}%` : 'No Data'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isStrong ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: TEST HISTORY TABLE */}
        {(activeTab === 'dashboard' || activeTab === 'history') && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Recent Test History
                </h3>
                <p className="text-xs text-slate-400">Review past answer submissions and performance breakdown</p>
              </div>
            </div>

            {submissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Subject</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Score</th>
                      <th className="py-4 px-6">Percentage</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {submissions.map((sub, idx) => {
                      const pct = sub.total_questions > 0 ? Math.round((sub.score / sub.total_questions) * 100) : 0;
                      const isPassed = pct >= 70;
                      const dateFormatted = new Date(sub.submitted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={sub.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {sub.category || 'HTML'}
                          </td>
                          <td className="py-4 px-6 text-slate-400">{dateFormatted}</td>
                          <td className="py-4 px-6 font-mono font-bold text-slate-200">
                            {sub.score} / {sub.total_questions}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-white">{pct}%</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isPassed
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {isPassed ? 'PASSED' : 'NEEDS PRACTICE'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setReviewSubmission(sub)}
                              className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg font-bold text-xs transition-all border border-indigo-500/20 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs font-mono">
                No recent test attempts recorded yet.
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Student Study Guides & Documentation
              </h2>
              <p className="text-xs text-slate-400">Hand-curated learning materials to boost your test performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {STUDY_RESOURCES.map((res, i) => (
                <div
                  key={i}
                  className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {res.category}
                      </span>
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                    <h3 className="text-base font-bold text-white">{res.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{res.desc}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">Verified Reference</span>
                    <button
                      type="button"
                      onClick={() => alert(`Opening resource: ${res.title}`)}
                      className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{res.linkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Topic Selection Modal */}
      {modalSubject && (
        <TopicSelectionModal
          isOpen={Boolean(modalSubject)}
          subject={modalSubject}
          onClose={() => setModalSubject(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      {/* Review Analytics Modal */}
      {reviewSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
            <button
              onClick={() => setReviewSubmission(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            >
              ✕
            </button>
            <UserAnalyticsReport
              user={{
                name: reviewSubmission.student_name,
                email: userProfile?.email || 'student@portal.com',
              }}
              score={reviewSubmission.score}
              totalQuestions={reviewSubmission.total_questions}
              submittedAt={reviewSubmission.submitted_at}
              category={reviewSubmission.category || 'HTML'}
              status="Completed"
              onBack={() => setReviewSubmission(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
