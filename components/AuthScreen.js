import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sparkles } from 'lucide-react';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sahkoo524@gmail.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => { setErrorMsg(''); setSuccessMsg(''); };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();
    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
    const targetRole = (isMasterAdmin || cleanEmail === ADMIN_EMAIL.toLowerCase()) ? 'teacher' : 'student';

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { role: targetRole, full_name: fullName } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            role: targetRole,
            full_name: fullName,
          });
        }
        if (data.session) {
          setSuccessMsg('Account created successfully!');
          if (onAuthSuccess) onAuthSuccess(data.session.user);
        } else {
          setSuccessMsg('Account created! Please sign in with your credentials.');
          setIsSignUp(false);
        }
      } else {
        // Sign In
        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // Master Admin Bypass if credentials match sahkoo524@gmail.com / admin123
        if (error && isMasterAdmin) {
          const mockAdminUser = {
            id: 'admin-master-bypass-id',
            email: cleanEmail,
            user_metadata: { role: 'teacher', full_name: 'System Admin' }
          };

          await supabase.from('profiles').upsert({
            id: 'admin-master-bypass-id',
            email: cleanEmail,
            role: 'teacher',
            full_name: 'System Admin',
          });

          if (onAuthSuccess) {
            onAuthSuccess(mockAdminUser);
          }
          return;
        }

        if (error) throw error;

        if (data.user && onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col text-slate-100 font-sans">
      {/* TOP HEADER */}
      <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-2xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-black flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-black text-white text-lg tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Agaicode
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">
                Evaluation Portal
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        <div className="w-full lg:w-6/12 xl:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/60">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 top-10 w-48 h-48 bg-indigo-800/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
              Agaicode Assessment Engine
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Evaluation<br />
              <span className="text-indigo-400">Portal</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg">
              Sign in to start your developer assessment. The system enforces
              real-time verification and single-attempt rules per session.
            </p>

            <div className="mt-10 flex flex-col gap-3.5 max-w-md">
              {[
                { icon: '🛡️', text: 'Anti-cheat protection active' },
                { icon: '⏱️', text: '45-minute live exam timer' },
                { icon: '📊', text: 'Instant results and review' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3.5 text-sm sm:text-base text-slate-200 bg-slate-800/40 border border-slate-700/40 rounded-2xl px-5 py-3.5 shadow-sm">
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <span className="font-medium">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-10 border-t border-slate-800/60 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm text-slate-400 font-medium">Supabase Auth — Connected</span>
          </div>
        </div>

        <div className="w-full lg:w-6/12 xl:w-7/12 bg-slate-950 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 xl:p-24">
          <div className="w-full max-w-xl bg-slate-900/60 border border-indigo-500/30 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8">
              {isSignUp ? 'Register to access your assessment portal.' : 'Enter your credentials to continue.'}
            </p>

            <div className="flex bg-slate-950/80 border border-indigo-500/20 p-2 rounded-2xl mb-8">
              {['Sign In', 'Register'].map((label, i) => {
                const active = i === 0 ? !isSignUp : isSignUp;
                return (
                  <button key={label} type="button"
                    onClick={() => { setIsSignUp(i === 1); reset(); }}
                    className={`flex-1 py-3.5 text-sm sm:text-base font-extrabold rounded-xl transition-all duration-200 cursor-pointer
                      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
                    {label}
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-300 text-sm font-semibold break-words">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-sm font-semibold break-words">
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5 sm:space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5">Full Name</label>
                  <input type="text" required placeholder="e.g. Amjad Ali"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl text-white placeholder-slate-600 text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5">Email Address</label>
                <input type="email" required placeholder="student@agaicode.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl text-white placeholder-slate-600 text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2.5">Password</label>
                <input type="password" required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl text-white placeholder-slate-600 text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-extrabold py-4 sm:py-5 rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-2 cursor-pointer">
                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}