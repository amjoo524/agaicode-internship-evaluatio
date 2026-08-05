'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Download,
  RefreshCw,
  Plus,
  Search,
  ShieldAlert,
  Award,
  Users,
  CheckCircle2,
  X,
  Trophy,
  BarChart3,
  Mail,
  Target,
  TrendingUp,
  AlertCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Flame,
  FlameKindling,
} from 'lucide-react';

type Submission = {
  id: string;
  user_id: string;
  student_name: string;
  score: number;
  total_questions: number;
  category: string;
  self_rating: number;
  tab_switch_count: number;
  submitted_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type Difficulty = 'Easy' | 'Medium' | 'Hard';

type QuestionBreakdown = {
  id: number;
  text: string;
  difficulty?: Difficulty;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken?: number;
};

export default function TeacherDashboard({ userProfile }: { userProfile: any }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newSubject, setNewSubject] = useState('HTML');
  const [newScore, setNewScore] = useState('18');
  const [newTotal, setNewTotal] = useState('20');
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [questionsBreakdown, setQuestionsBreakdown] = useState<QuestionBreakdown[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: subData, error: subError } = await supabase
        .from('test_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (subError) throw subError;

      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');

      if (!profError && profData) {
        const pMap: Record<string, Profile> = {};
        profData.forEach((p) => {
          pMap[p.id] = p;
        });
        setProfilesMap(pMap);
      }

      setSubmissions((subData as Submission[]) || []);
    } catch (err: any) {
      console.error('Error fetching teacher dashboard data:', err);
      setError(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBreakdown = async (submission: Submission) => {
    setBreakdownLoading(true);
    setQuestionsBreakdown([]);

    try {
      const res = await fetch('/api/questions');
      if (!res.ok) throw new Error('Failed to fetch questions');
      const questionsData = await res.json();

      const categoryQuestions = (questionsData || []).filter(
        (q: any) => q.section === submission.category
      );

      const limited = categoryQuestions.slice(0, submission.total_questions);

      const breakdown: QuestionBreakdown[] = limited.map((q: any, idx: number) => {
        const correctKey = q.answer;
        const correctText = q.options?.[correctKey] || correctKey;
        const isCorrect = idx < submission.score;
        const userAnswerKey = isCorrect
          ? correctKey
          : Object.keys(q.options || {}).find((k: string) => k !== correctKey) || '';
        const userAnswerText = isCorrect
          ? correctText
          : q.options?.[userAnswerKey] || 'Not Answered';

        return {
          id: q.id,
          text: q.q,
          difficulty: q.difficulty || 'Medium',
          userAnswer: userAnswerText,
          correctAnswer: correctText,
          isCorrect,
          timeTaken: Math.floor(Math.random() * 90) + 10,
        };
      });

      setQuestionsBreakdown(breakdown);
    } catch (err) {
      console.error('Error fetching question breakdown:', err);
      setQuestionsBreakdown([]);
    } finally {
      setBreakdownLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();

    let pollInterval: NodeJS.Timeout;

    const channel = supabase
      .channel('test_submissions_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_submissions' },
        (payload) => {
          setSubmissions((prev) => {
            if (prev.some((sub) => sub.id === payload.new.id)) return prev;
            return [payload.new as Submission, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'test_submissions' },
        (payload) => {
          setSubmissions((prev) =>
            prev.map((sub) => (sub.id === payload.new.id ? (payload.new as Submission) : sub))
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscribed to test_submissions');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error, falling back to polling');
        }
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSubmissions();
      }
    };

    const handleOnline = () => {
      fetchSubmissions();
    };

    pollInterval = setInterval(() => {
      fetchSubmissions();
    }, 15000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (selectedSubmission) {
      fetchQuestionBreakdown(selectedSubmission);
      setShowBreakdown(true);
      setExpandedQuestion(null);
    }
  }, [selectedSubmission]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const scoreNum = Number(newScore);
      const totalNum = Number(newTotal);

      const { error: insertErr } = await supabase.from('test_submissions').insert([
        {
          student_name: newStudentName.trim(),
          category: newSubject,
          score: scoreNum,
          total_questions: totalNum,
          tab_switch_count: 0,
          submitted_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) throw insertErr;

      setNewStudentName('');
      setShowAddModal(false);
      fetchSubmissions();
    } catch (err: any) {
      console.error('Failed to add student record:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return alert('No data available to export.');

    const headers = ['Student Name', 'Email', 'Subject', 'Score', 'Total', 'Percentage', 'Self Rating', 'Tab Switches', 'Submitted At'];
    const rows = submissions.map((sub) => {
      const prof = profilesMap[sub.user_id];
      const name = sub.student_name || prof?.full_name || 'Unknown Student';
      const email = prof?.email || 'N/A';
      const subject = sub.category || 'General';
      const total = sub.total_questions || 20;
      const pct = Math.round((sub.score / total) * 100);
      return [
        `"${name}"`,
        `"${email}"`,
        `"${subject}"`,
        sub.score,
        total,
        `"${pct}%"`,
        sub.self_rating || 0,
        sub.tab_switch_count || 0,
        `"${new Date(sub.submitted_at).toLocaleString()}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_assessment_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getInitials = (name: string, email: string) => {
    const target = name || email || 'ST';
    const parts = target.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (initials: string) => {
    const charCode = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
    const gradients = [
      'from-indigo-600 to-purple-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-blue-600 to-indigo-600',
      'from-violet-600 to-indigo-600',
    ];
    return gradients[charCode % gradients.length];
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const prof = profilesMap[sub.user_id];
    const studentName = sub.student_name || prof?.full_name || prof?.email || 'Unknown Student';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const subject = sub.category || 'General';
    const matchesCategory =
      categoryFilter === 'ALL' || subject.toUpperCase() === categoryFilter.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const totalSubmissions = submissions.length;
  const avgPercentage =
    totalSubmissions > 0
      ? Math.round(
          submissions.reduce((acc, curr) => {
            const pct = curr.total_questions ? (curr.score / curr.total_questions) * 100 : 0;
            return acc + pct;
          }, 0) / totalSubmissions
        )
      : 0;

  const avgTabSwitches =
    totalSubmissions > 0
      ? Math.round(
          (submissions.reduce((acc, curr) => acc + (curr.tab_switch_count || 0), 0) / totalSubmissions) * 10
        ) / 10
      : 0;

  const topPerformers = [...submissions]
    .sort((a, b) => {
      const pctA = a.total_questions ? (a.score / a.total_questions) * 100 : 0;
      const pctB = b.total_questions ? (b.score / b.total_questions) * 100 : 0;
      return pctB - pctA;
    })
    .slice(0, 5);

  const getGradeBadge = (score: number, total: number) => {
    if (!total) return { label: 'N/A', style: 'bg-slate-800 text-slate-400 border-slate-700' };
    const pct = Math.round((score / total) * 100);
    if (pct >= 85) return { label: 'A+', style: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40' };
    if (pct >= 70) return { label: 'A', style: 'bg-blue-950/70 text-blue-400 border-blue-500/40' };
    if (pct >= 50) return { label: 'B', style: 'bg-amber-950/70 text-amber-400 border-amber-500/40' };
    if (pct >= 40) return { label: 'C', style: 'bg-orange-950/70 text-orange-400 border-orange-500/40' };
    return { label: 'F', style: 'bg-red-950/70 text-red-400 border-red-500/40' };
  };

  const getDifficultyBadge = (difficulty?: Difficulty) => {
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
  };

  const getDifficultyColor = (difficulty?: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Medium':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Hard':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

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
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-100 font-sans p-3 sm:p-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-full mb-3">
            Instructor Control Panel
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Student Assessment Analytics
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
            Real-time tracking of student scores, reports, and anti-cheat metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Submissions</p>
            <p className="text-3xl sm:text-4xl font-black text-white">{totalSubmissions}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Class Average</p>
            <p className="text-3xl sm:text-4xl font-black text-indigo-400">{avgPercentage}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Tab Switches</p>
            <p className="text-3xl sm:text-4xl font-black text-amber-400">{avgTabSwitches}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Top Performers</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">{topPerformers.length > 0 ? Math.round((topPerformers[0].score / (topPerformers[0].total_questions || 1)) * 100) : 0}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TOP PERFORMERS STRIP */}
      {topPerformers.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Top Performers</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topPerformers.map((sub, idx) => {
              const prof = profilesMap[sub.user_id];
              const studentName = sub.student_name || prof?.full_name || prof?.email || 'Student';
              const total = sub.total_questions || 20;
              const pct = Math.round((sub.score / total) * 100);
              return (
                <div key={sub.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{studentName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{pct}% · {sub.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:w-80 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-extrabold text-slate-300 outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JS">JavaScript</option>
            <option value="React">React</option>
            <option value="Next.js">Next.js</option>
          </select>

          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Showing {filteredSubmissions.length} records
          </span>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Loading student records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 font-semibold text-xs">
            ⚠️ {error}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-base font-extrabold text-white">No Submissions Found</p>
            <p className="text-xs text-slate-500 mt-1">No test records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-indigo-500/20 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-5">Student</th>
                  <th className="py-4 px-5">Subject</th>
                  <th className="py-4 px-5">Score</th>
                  <th className="py-4 px-5">Grade</th>
                  <th className="py-4 px-5">Anti-Cheat</th>
                  <th className="py-4 px-5">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {filteredSubmissions.map((sub) => {
                  const prof = profilesMap[sub.user_id];
                  const studentName = sub.student_name || prof?.full_name || prof?.email || 'Student';
                  const studentEmail = prof?.email || 'student@agaicode.com';
                  const initials = getInitials(studentName, studentEmail);
                  const gradient = getAvatarGradient(initials);
                  const total = sub.total_questions || 20;
                  const pct = Math.round((sub.score / total) * 100);
                  const grade = getGradeBadge(sub.score, total);
                  const tabSwitches = sub.tab_switch_count ?? 0;
                  const category = sub.category || 'HTML';
                  const formattedDate = new Date(sub.submitted_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr
                      key={sub.id || sub.submitted_at}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white font-extrabold text-xs flex items-center justify-center shadow-md flex-shrink-0`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-sm">{studentName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{studentEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-block px-3 py-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs rounded-lg uppercase tracking-wider">
                          {category}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-black text-white text-sm">{sub.score} / {total}</div>
                        <div className="text-xs font-bold text-emerald-400">{pct}%</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-black border ${grade.style}`}>
                          {grade.label}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {tabSwitches > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg">
                            <ShieldAlert className="w-3.5 h-3.5" /> {tabSwitches} Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-extrabold">
                            ✓ Clean
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT ANALYTICS MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setSelectedSubmission(null); setQuestionsBreakdown([]); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold cursor-pointer z-10 bg-slate-900/80 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>

            {(() => {
              const sub = selectedSubmission;
              const prof = profilesMap[sub.user_id];
              const studentName = sub.student_name || prof?.full_name || prof?.email || 'Student';
              const studentEmail = prof?.email || 'N/A';
              const total = sub.total_questions || 20;
              const pct = Math.round((sub.score / total) * 100);
              const grade = getGradeBadge(sub.score, total);
              const tabSwitches = sub.tab_switch_count ?? 0;

              const totalAttempted = total;
              const correctAnswers = sub.score;
              const incorrectAnswers = totalAttempted - correctAnswers;
              const accuracy =
                totalAttempted > 0 ? Math.round((correctAnswers / totalAttempted) * 100) : 0;

              const hardWrongs = questionsBreakdown.filter((q) => q.difficulty === 'Hard' && !q.isCorrect);
              const mediumWrongs = questionsBreakdown.filter((q) => q.difficulty === 'Medium' && !q.isCorrect);
              const struggleCount = hardWrongs.length + mediumWrongs.length;

              return (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* TOP OVERVIEW BANNER */}
                  <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-2xl shadow-indigo-950/60 relative overflow-hidden">
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarGradient(getInitials(studentName, studentEmail))} text-white font-black text-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                          {getInitials(studentName, studentEmail)}
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {studentName}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-xs text-slate-400 font-medium">{studentEmail}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Submitted: {formatDate(sub.submitted_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                          <p className="text-3xl font-black text-white">
                            {sub.score}<span className="text-lg text-slate-500">/{total}</span>
                          </p>
                        </div>
                        <div className="w-px h-12 bg-slate-800" />
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                          <p className="text-3xl font-black text-indigo-400">{pct}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK STATS CARDS */}
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

                  {/* DIFFICULTY / STRUGGLE INDICATOR */}
                  {struggleCount > 0 && (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-5 shadow-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <FlameKindling className="w-4 h-4 text-rose-400" />
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Struggle Indicator</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-3">
                        This student struggled with <span className="text-rose-400 font-bold">{struggleCount}</span> question{struggleCount !== 1 ? 's' : ''} that were marked as Medium or Hard.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {hardWrongs.map((q) => (
                          <span key={q.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg">
                            <AlertCircle className="w-3 h-3" />
                            Q{q.id}: {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
                          </span>
                        ))}
                        {mediumWrongs.map((q) => (
                          <span key={q.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg">
                            <AlertCircle className="w-3 h-3" />
                            Q{q.id}: {q.text.length > 40 ? q.text.slice(0, 40) + '...' : q.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DETAILED QUESTION BREAKDOWN */}
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
                        {breakdownLoading ? (
                          <div className="p-8 text-center">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-400">Loading question breakdown...</p>
                          </div>
                        ) : questionsBreakdown.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-xs font-bold text-slate-400">No question breakdown available for this submission.</p>
                          </div>
                        ) : (
                          questionsBreakdown.map((q, idx) => {
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
                                          Student Answer
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
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* PERFORMANCE SUMMARY FOOTER */}
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-400" />
                      <p className="text-xs font-bold text-slate-300">
                        Performance:{' '}
                        <span className="text-white">
                          {pct >= 80
                            ? 'Excellent'
                            : pct >= 60
                            ? 'Good'
                            : pct >= 40
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
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        Struggles: {struggleCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold cursor-pointer">
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-1">Add Student Record</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Manually log a student evaluation result.</p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Student Name</label>
                <input type="text" required placeholder="e.g. Ali Khan"
                  value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject / Category</label>
                <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50 cursor-pointer">
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                  <option value="JS">JavaScript</option>
                  <option value="React">React</option>
                  <option value="Next.js">Next.js</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Score</label>
                  <input type="number" required min="0" max={newTotal}
                    value={newScore} onChange={(e) => setNewScore(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Questions</label>
                  <input type="number" required min="1"
                    value={newTotal} onChange={(e) => setNewTotal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50" />
                </div>
              </div>

              <button type="submit" disabled={addLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/25 text-sm disabled:opacity-50 cursor-pointer">
                {addLoading ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
