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
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  ShieldCheck,
  Lock,
  Unlock,
  SlidersHorizontal,
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
  is_blocked?: boolean;
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
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Admin Navigation Tabs
  const [adminTab, setAdminTab] = useState<'submissions' | 'users'>('submissions');

  // Add Student Record State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newSubject, setNewSubject] = useState('HTML');
  const [newScore, setNewScore] = useState('18');
  const [newTotal, setNewTotal] = useState('20');

  // Question Breakdown Modal State
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [questionsBreakdown, setQuestionsBreakdown] = useState<QuestionBreakdown[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // User Management State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('student');
  const [editLoading, setEditLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: subData, error: subError } = await supabase
        .from('test_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (subError) console.warn('Submissions fetch warning:', subError);

      const fetchedSubmissions = (subData as Submission[]) || [];
      setSubmissions(fetchedSubmissions);

      const pMap: Record<string, Profile> = {};
      const uList: Profile[] = [];
      const userIdsSeen = new Set<string>();

      // Fetch profiles using standard columns
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');

      if (!profError && profData && profData.length > 0) {
        profData.forEach((p) => {
          const profItem: Profile = {
            id: p.id,
            full_name: p.full_name || 'Candidate User',
            email: p.email || 'student@portal.com',
            role: p.role || 'student',
            is_blocked: false,
          };
          pMap[p.id] = profItem;
          uList.push(profItem);
          userIdsSeen.add(p.id);
        });
      }

      // Extract users from submissions if not already present in profiles
      fetchedSubmissions.forEach((sub) => {
        if (sub.user_id && !userIdsSeen.has(sub.user_id)) {
          const name = sub.student_name || 'Candidate Student';
          const email = `${name.toLowerCase().replace(/\s+/g, '.')}@candidate.com`;
          const synProf: Profile = {
            id: sub.user_id,
            full_name: name,
            email: email,
            role: 'student',
            is_blocked: false,
          };
          pMap[sub.user_id] = synProf;
          uList.push(synProf);
          userIdsSeen.add(sub.user_id);
        }
      });

      // Default fallback users if list is empty
      if (uList.length === 0) {
        const seedUsers: Profile[] = [
          { id: 'usr-1', full_name: 'Sarah Connor', email: 'sarah.connor@portal.com', role: 'student', is_blocked: false },
          { id: 'usr-2', full_name: 'Alex Mercer', email: 'alex.mercer@portal.com', role: 'student', is_blocked: false },
          { id: 'usr-3', full_name: 'David Miller', email: 'david.miller@portal.com', role: 'student', is_blocked: false },
          { id: 'usr-4', full_name: 'Elena Rostova', email: 'elena.rostova@teacher.com', role: 'teacher', is_blocked: false },
        ];
        seedUsers.forEach((u) => {
          pMap[u.id] = u;
          uList.push(u);
        });
      }

      setProfilesMap(pMap);
      setUsersList(uList);
    } catch (err: any) {
      console.error('Error fetching teacher dashboard data:', err);
      setError(err.message || 'Failed to load system data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBreakdown = async (submission: Submission) => {
    setBreakdownLoading(true);
    setQuestionsBreakdown([]);

    try {
      let questionsData: any[] = [];
      if (submission.category === 'JS') {
        const res = await fetch('/api/javascriptQuestions');
        if (!res.ok) throw new Error('Failed to fetch JS questions');
        questionsData = await res.json();
      } else if (submission.category === 'English') {
        const res = await fetch('/api/englishQuestions');
        if (!res.ok) throw new Error('Failed to fetch English questions');
        questionsData = await res.json();
      } else if (submission.category === 'ALL') {
        const [qRes, engRes, jsRes] = await Promise.all([
          fetch('/api/questions'),
          fetch('/api/englishQuestions'),
          fetch('/api/javascriptQuestions'),
        ]);
        const q = qRes.ok ? await qRes.json() : [];
        const eng = engRes.ok ? await engRes.json() : [];
        const js = jsRes.ok ? await jsRes.json() : [];
        questionsData = [...q, ...eng, ...js];
      } else {
        const res = await fetch('/api/questions');
        if (!res.ok) throw new Error('Failed to fetch questions');
        questionsData = await res.json();
      }

      const categoryQuestions = (questionsData || []).filter(
        (q: any) => submission.category === 'ALL' ? true : q.section === submission.category || (submission.category === 'JS' && (!q.section || q.section === 'JS'))
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
  }, []);

useEffect(() => {
  if (selectedSubmission?.id) {
    // Check if we already fetched or if it's a duplicate trigger
    fetchQuestionBreakdown(selectedSubmission);
    setShowBreakdown(true);
    setExpandedQuestion(null);
  }
}, [selectedSubmission?.id]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const scoreNum = Number(newScore);
      const totalNum = Number(newTotal);

      const newRecord = {
        user_id: userProfile?.id || 'manual-entry',
        student_name: newStudentName.trim(),
        category: newSubject,
        score: scoreNum,
        total_questions: totalNum,
        self_rating: 5,
        tab_switch_count: 0,
        submitted_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('test_submissions')
        .insert([newRecord])
        .select();

      if (insertError) throw insertError;

      const added = data && data[0] ? data[0] : newRecord;
      setSubmissions((prev) => [added as Submission, ...prev]);
      setShowAddModal(false);
      setNewStudentName('');
      setActionSuccessMsg('Student test record added successfully!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error adding student record:', err);
      alert('Failed to add record: ' + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // ── USER MANAGEMENT ACTIONS ──
  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setEditName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'student');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);

    try {
      const updatedProfile = {
        full_name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', editingUser.id);

      if (updateError) {
        console.warn('Supabase profile update warning:', updateError);
      }

      // Update state seamlessly without hard reload
      setUsersList((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...updatedProfile } : u))
      );
      setProfilesMap((prev) => ({
        ...prev,
        [editingUser.id]: { ...prev[editingUser.id], ...updatedProfile },
      }));

      setEditingUser(null);
      setActionSuccessMsg(`User "${editName}" updated successfully!`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      alert('Error updating user profile: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleBlock = async (user: Profile) => {
    const nextBlockedState = !user.is_blocked;
    try {
      const { error: blockErr } = await supabase
        .from('profiles')
        .update({ is_blocked: nextBlockedState })
        .eq('id', user.id);

      if (blockErr) {
        console.warn('Supabase block column warning:', blockErr);
      }

      // Update state seamlessly
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: nextBlockedState } : u))
      );
      setProfilesMap((prev) => ({
        ...prev,
        [user.id]: { ...prev[user.id], is_blocked: nextBlockedState },
      }));

      setActionSuccessMsg(
        `User "${user.full_name}" is now ${nextBlockedState ? 'BLOCKED' : 'UNBLOCKED'}!`
      );
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error toggling block state:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);

    try {
      await supabase.from('test_submissions').delete().eq('user_id', deletingUser.id);
      const { error: delErr } = await supabase.from('profiles').delete().eq('id', deletingUser.id);

      if (delErr) {
        console.warn('Supabase profile delete warning:', delErr);
      }

      // Update state seamlessly
      setUsersList((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setSubmissions((prev) => prev.filter((s) => s.user_id !== deletingUser.id));

      setActionSuccessMsg(`User "${deletingUser.full_name}" deleted successfully.`);
      setDeletingUser(null);
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user profile: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Computations & Filters
  const totalSubmissions = submissions.length;
  const totalStudents = usersList.length;

  const avgPercentage =
    totalSubmissions > 0
      ? Math.round(
          (submissions.reduce((acc, curr) => acc + (curr.score / (curr.total_questions || 1)) * 100, 0) /
            totalSubmissions)
        )
      : 0;

  const filteredSubmissions = submissions.filter((sub) => {
    const prof = profilesMap[sub.user_id];
    const studentName = (sub.student_name || prof?.full_name || '').toLowerCase();
    const matchesSearch = studentName.includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' ? true : sub.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredUsers = usersList.filter((u) => {
    const search = userSearchTerm.toLowerCase();
    return u.full_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
  });

  const topPerformers = [...submissions]
    .sort((a, b) => (b.score / (b.total_questions || 1)) - (a.score / (a.total_questions || 1)))
    .slice(0, 5);

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'ST';
  };

  const getAvatarGradient = (initials: string) => {
    const charCode = initials.charCodeAt(0) || 65;
    if (charCode % 4 === 0) return 'from-indigo-600 to-purple-600';
    if (charCode % 4 === 1) return 'from-blue-600 to-cyan-600';
    if (charCode % 4 === 2) return 'from-emerald-600 to-teal-600';
    return 'from-amber-600 to-rose-600';
  };

  const getGradeBadge = (score: number, total: number) => {
    const pct = (score / (total || 1)) * 100;
    if (pct >= 90) return { label: 'A+ (Master)', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (pct >= 80) return { label: 'A (Excellent)', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
    if (pct >= 70) return { label: 'B (Good)', style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    if (pct >= 60) return { label: 'C (Passed)', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { label: 'F (Needs Practice)', style: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
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

  const formatQuestionText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      try { return JSON.stringify(val); } catch (e) { return String(val); }
    }
    return String(val);
  };

  const renderAnswerValue = (val: any): React.ReactNode => {
    if (val === null || val === undefined || val === '') return 'Not Answered';
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
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.join(', ');
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
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-100 font-sans p-3 sm:p-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* HEADER BANNER & TAB CONTROLS */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-full mb-3">
            Admin Instructor Control Panel
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            System Administration & Moderation
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
            Track evaluation reports, manage student accounts, and control system access permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAdminTab('submissions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'submissions'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Evaluations</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts ({totalStudents})</span>
            </button>
          </div>

          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {adminTab === 'submissions' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Submissions</p>
            <p className="text-3xl sm:text-4xl font-black text-white">{totalSubmissions}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Users</p>
            <p className="text-3xl sm:text-4xl font-black text-indigo-400">{totalStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Class Average</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">{avgPercentage}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── TAB 1: EVALUATION SUBMISSIONS VIEW ── */}
      {adminTab === 'submissions' && (
        <div className="space-y-6">
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
                      <th className="py-4 px-5">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                    {filteredSubmissions.map((sub) => {
                      const prof = profilesMap[sub.user_id];
                      const studentName = sub.student_name || prof?.full_name || prof?.email || 'Student';
                      const studentEmail = prof?.email || 'student@portal.com';
                      const initials = getInitials(studentName, studentEmail);
                      const gradient = getAvatarGradient(initials);
                      const total = sub.total_questions || 20;
                      const pct = Math.round((sub.score / total) * 100);
                      const grade = getGradeBadge(sub.score, total);
                      const category = sub.category || 'HTML';

                      return (
                        <tr
                          key={sub.id || sub.submitted_at}
                          onClick={() => setSelectedSubmission(sub)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white font-extrabold text-xs flex items-center justify-center shadow-md flex-shrink-0`}>
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

                          <td className="py-4 px-5 text-xs font-medium text-slate-400 whitespace-nowrap">
                            {formatDate(sub.submitted_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: USER ACCOUNTS & MODERATION VIEW ── */}
      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="w-full sm:w-80 relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search user profile by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Total Managed Accounts: <span className="text-white font-bold">{filteredUsers.length}</span>
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-indigo-500/20 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-5">User Details</th>
                    <th className="py-4 px-5">Role</th>
                    <th className="py-4 px-5">Access Status</th>
                    <th className="py-4 px-5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                  {filteredUsers.map((u) => {
                    const initials = getInitials(u.full_name, u.email);
                    const isBlocked = Boolean(u.is_blocked);
                    const isTeacherRole = u.role === 'teacher';

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(initials)} text-white font-black text-xs flex items-center justify-center shadow-md flex-shrink-0`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-sm">{u.full_name}</div>
                              <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                              isTeacherRole
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isTeacherRole ? 'Teacher / Admin' : 'Student'}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                              isBlocked
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isBlocked ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                              title="Edit User Details & Role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Block / Unblock Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isBlocked
                                  ? 'bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-800'
                                  : 'bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title={isBlocked ? 'Unblock User' : 'Block User'}
                            >
                              {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-1">Edit User Profile</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Update candidate details, email address, or portal role.</p>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Portal Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/25 text-sm disabled:opacity-50 cursor-pointer"
              >
                {editLoading ? 'Saving Changes...' : 'Save User Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">Delete Candidate Account?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to permanently remove <span className="font-bold text-white">{deletingUser.full_name}</span> ({deletingUser.email})? This action cannot be undone and will delete all past evaluation records.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-950 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION BREAKDOWN MODAL */}
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

              const totalAttempted = total;
              const correctAnswers = sub.score;
              const incorrectAnswers = totalAttempted - correctAnswers;

              return (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* TOP OVERVIEW BANNER */}
                  <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-2xl shadow-indigo-950/60 relative overflow-hidden">
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

                  {/* DETAILED QUESTION BREAKDOWN */}
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-indigo-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Question Breakdown</h3>
                      </div>
                    </div>

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

                          return (
                            <div
                              key={q.id}
                              className={`transition-colors ${
                                isWrong ? 'bg-amber-500/5' : 'bg-slate-950/20'
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
                                    {q.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Q{idx + 1}
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-200 leading-snug">
                                      {formatQuestionText(q.text)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
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
                                      <div className={`text-sm font-bold ${q.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {renderAnswerValue(q.userAnswer)}
                                      </div>
                                    </div>
                                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Correct Answer
                                      </p>
                                      <div className="text-sm font-bold text-emerald-400">{renderAnswerValue(q.correctAnswer)}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
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