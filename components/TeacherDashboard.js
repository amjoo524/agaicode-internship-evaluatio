import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Download, RefreshCw, Plus, Search, ShieldAlert, Award, Users, CheckCircle2 } from 'lucide-react';

export default function TeacherDashboard({ userProfile }) {
  const [submissions, setSubmissions] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Form states for Add Student modal
  const [newStudentName, setNewStudentName] = useState('');
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

    let pollInterval;

    const channel = supabase
      .channel('test_submissions_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_submissions' },
        (payload) => {
          setSubmissions((prev) => {
            if (prev.some((sub) => sub.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'test_submissions' },
        (payload) => {
          setSubmissions((prev) =>
            prev.map((sub) => (sub.id === payload.new.id ? payload.new : sub))
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

  // Add manual student submission record
  const handleAddStudent = async (e) => {
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
    } catch (err) {
      console.error('Failed to add student record:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setAddLoading(false);
    }
  };

  // Export Results to CSV
  const exportToCSV = () => {
    if (submissions.length === 0) return alert('No data available to export.');
    
    const headers = ['Student Name', 'Email', 'Subject', 'Score', 'Total', 'Percentage', 'Tab Switches', 'Submitted At'];
    const rows = submissions.map(sub => {
      const prof = profilesMap[sub.user_id];
      const name = sub.student_name || prof?.full_name || 'Unknown Student';
      const email = prof?.email || 'N/A';
      const subject = sub.category || sub.selected_category || 'General';
      const total = sub.total_questions || 20;
      const pct = Math.round((sub.score / total) * 100);
      return [
        `"${name}"`,
        `"${email}"`,
        `"${subject}"`,
        sub.score,
        total,
        `"${pct}%"`,
        sub.tab_switch_count || 0,
        `"${new Date(sub.submitted_at).toLocaleString()}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_assessment_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Highest Score</p>
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">{highestScore}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Live Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-extrabold text-emerald-400">Sync Active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      </div>

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
                  const category = sub.category || sub.selected_category || 'HTML';
                  const formattedDate = new Date(sub.submitted_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
                  });

                  return (
                    <tr key={sub.id || sub.submitted_at} className="hover:bg-slate-800/40 transition-colors">
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