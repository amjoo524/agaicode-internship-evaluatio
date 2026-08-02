import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TeacherDashboard({ userProfile }) {
  const [submissions, setSubmissions] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  // Form states for Add Student modal
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newSubject, setNewSubject] = useState('HTML');
  const [newScore, setNewScore] = useState('18');
  const [newTotal, setNewTotal] = useState('20');

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch test submissions
      const { data: subData, error: subError } = await supabase
        .from('test_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (subError) throw subError;

      // 2. Fetch profiles to resolve student names
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');

      if (!profError && profData) {
        const pMap = {};
        profData.forEach((p) => {
          pMap[p.id] = p;
        });
        setProfilesMap(pMap);
      }

      setSubmissions(subData || []);
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
      setError(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();

    // Subscribe to realtime updates on test_submissions table
    const channel = supabase
      .channel('test_submissions_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_submissions' },
        (payload) => {
          setSubmissions((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add manual student submission record
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg('');
    try {
      const scoreNum = Number(newScore);
      const totalNum = Number(newTotal);

      const { data, error: insertErr } = await supabase.from('test_submissions').insert([
        {
          student_name: newStudentName.trim(),
          category: newSubject,
          score: scoreNum,
          total_questions: totalNum,
          tab_switch_count: 0,
          submitted_at: new Date().toISOString(),
        },
      ]).select();

      if (insertErr) throw insertErr;

      setAddMsg('Student record added successfully!');
      setNewStudentName('');
      setNewStudentEmail('');
      setShowAddModal(false);
      fetchSubmissions();
    } catch (err) {
      console.error('Failed to add student record:', err);
      setAddMsg(`Error: ${err.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  // Helper to generate initials from full name or email
  const getInitials = (name, email) => {
    const target = name || email || 'ST';
    const parts = target.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.substring(0, 2).toUpperCase();
  };

  // Gradient background mapping for avatar initials
  const getAvatarGradient = (initials) => {
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

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    const prof = profilesMap[sub.user_id];
    const studentName = sub.student_name || prof?.full_name || prof?.email || 'Unknown Student';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const subject = sub.category || sub.selected_category || 'General';
    const matchesCategory =
      categoryFilter === 'ALL' || subject.toUpperCase() === categoryFilter.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  // Analytics Metrics
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

  const highestScore =
    totalSubmissions > 0
      ? Math.max(
          ...submissions.map((sub) =>
            sub.total_questions ? Math.round((sub.score / sub.total_questions) * 100) : 0
          )
        )
      : 0;

  const getGradeBadge = (score, total) => {
    if (!total) return { label: 'N/A', style: 'bg-slate-800 text-slate-400 border-slate-700' };
    const pct = Math.round((score / total) * 100);
    if (pct >= 85) return { label: 'A+', style: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40' };
    if (pct >= 70) return { label: 'A', style: 'bg-blue-950/70 text-blue-400 border-blue-500/40' };
    if (pct >= 50) return { label: 'B', style: 'bg-amber-950/70 text-amber-400 border-amber-500/40' };
    if (pct >= 40) return { label: 'C', style: 'bg-orange-950/70 text-orange-400 border-orange-500/40' };
    return { label: 'F', style: 'bg-red-950/70 text-red-400 border-red-500/40' };
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-100 font-sans p-2 sm:p-4">

      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow accent background */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rounded-full mb-3">
            Teacher Operations Center
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Student Assessment Analytics
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
            Real-time tracking of student scores and anti-cheat metrics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <span className="text-sm">＋</span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* ── METRICS GRID (4 SUMMARY CARDS) ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Submissions */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Total Submissions
          </p>
          <p className="text-3xl sm:text-4xl font-black text-white">{totalSubmissions}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">All time</p>
        </div>

        {/* Card 2: Class Average */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Class Average
          </p>
          <p className="text-3xl sm:text-4xl font-black text-indigo-400">{avgPercentage}%</p>
          <p className="text-xs text-slate-500 font-medium mt-1">MCQ scores</p>
        </div>

        {/* Card 3: Highest Score */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Highest Score
          </p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-400">{highestScore}%</p>
          <p className="text-xs text-slate-500 font-medium mt-1">This session</p>
        </div>

        {/* Card 4: Live Status */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Live Status
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-extrabold text-emerald-400">Live Sync</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ──────────────────────────── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="w-full sm:w-80 relative flex items-center">
          <span className="absolute left-3.5 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Filters and count */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-extrabold text-slate-300 outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JS">JavaScript</option>
            <option value="React">React</option>
            <option value="Next.js">Next.js</option>
          </select>

          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Showing {filteredSubmissions.length} results
          </span>
        </div>
      </div>

      {/* ── SUBMISSIONS TABLE ──────────────────────────────────────── */}
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
            <p className="text-xs text-slate-500 mt-1">
              No test submissions match your search filter yet.
            </p>
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
                  <th className="py-4 px-5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {filteredSubmissions.map((sub) => {
                  const prof = profilesMap[sub.user_id];
                  const studentName =
                    sub.student_name || prof?.full_name || prof?.email || 'Student';
                  const studentEmail = prof?.email || (sub.student_name ? `${sub.student_name.toLowerCase().replace(/\s+/g, '')}@agaicode.com` : 'student@agaicode.com');
                  const initials = getInitials(studentName, studentEmail);
                  const gradient = getAvatarGradient(initials);
                  const total = sub.total_questions || 20;
                  const pct = Math.round((sub.score / total) * 100);
                  const grade = getGradeBadge(sub.score, total);
                  const tabSwitches = sub.tab_switch_count ?? 0;
                  const category = sub.category || sub.selected_category || 'HTML';
                  const formattedDate = new Date(sub.submitted_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={sub.id || sub.submitted_at} className="hover:bg-slate-800/40 transition-colors">
                      {/* Student Info with Initials Avatar */}
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

                      {/* Subject Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-block px-3 py-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs rounded-lg uppercase tracking-wider">
                          {category}
                        </span>
                      </td>

                      {/* Score Ratio & Percentage */}
                      <td className="py-4 px-5">
                        <div className="font-black text-white text-sm">
                          {sub.score} / {total}
                        </div>
                        <div className="text-xs font-bold text-emerald-400">{pct}%</div>
                      </td>

                      {/* Grade Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-black border ${grade.style}`}
                        >
                          {grade.label}
                        </span>
                      </td>

                      {/* Anti-Cheat Status */}
                      <td className="py-4 px-5">
                        {tabSwitches > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg">
                            ⚠️ {tabSwitches} Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold">
                            ✓ Clean
                          </span>
                        )}
                      </td>

                      {/* Submitted Timestamp */}
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

      {/* ── ADD STUDENT MODAL ────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-1">Add Student Record</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">
              Manually log a student evaluation score into the database.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anmool Fatima"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Subject / Category
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                  <option value="JS">JavaScript</option>
                  <option value="React">React</option>
                  <option value="Next.js">Next.js</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Score
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={newTotal}
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTotal}
                    onChange={(e) => setNewTotal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                {addLoading ? 'Adding...' : 'Save Student Record'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
