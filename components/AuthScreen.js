import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sahkoo524@gmail.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => { setErrorMsg(''); setSuccessMsg(''); };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();
    const cleanEmail = email.trim();
    const targetRole = cleanEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'teacher' : 'student';
    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail, password,
          options: { data: { role: targetRole, full_name: fullName } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email: cleanEmail, role: targetRole, full_name: fullName,
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
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        if (data.user && onAuthSuccess) onAuthSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setAdminLoading(true);
    reset();
    try {
      // 1. Try direct login with teacher admin credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error) {
        // If account doesn't exist yet on Supabase, attempt signup automatically
        const { data: sd, error: se } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          options: { data: { role: 'teacher', full_name: 'System Admin' } },
        });

        if (se) {
          throw new Error(se.message || 'Teacher login failed. Please verify credentials.');
        }

        if (sd.user) {
          await supabase.from('profiles').upsert({
            id: sd.user.id,
            email: ADMIN_EMAIL,
            role: 'teacher',
            full_name: 'System Admin',
          });

          if (sd.session && onAuthSuccess) {
            onAuthSuccess(sd.session.user);
            return;
          }
        }

        // Retry sign in after signup
        const { data: rd, error: re } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

        if (re) throw re;
        if (rd.user && onAuthSuccess) {
          await supabase.from('profiles').upsert({
            id: rd.user.id,
            email: ADMIN_EMAIL,
            role: 'teacher',
            full_name: 'System Admin',
          });
          onAuthSuccess(rd.user);
        }
      } else if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: ADMIN_EMAIL,
          role: 'teacher',
          full_name: 'System Admin',
        });
        if (onAuthSuccess) onAuthSuccess(data.user);
      }
    } catch (err) {
      console.error('Teacher login error:', err);
      setErrorMsg(err.message || 'Teacher login failed. Please verify credentials.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans">

      {/* ── LEFT BRANDING PANEL ──────────────────────────────────── */}
      <div className="
        w-full lg:w-5/12 xl:w-4/12
        bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950
        flex flex-col justify-between
        p-6 sm:p-10 lg:p-14 xl:p-16
        relative overflow-hidden
        border-b lg:border-b-0 lg:border-r border-slate-800/60
      ">
        {/* Glow effects */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 top-10 w-40 h-40 bg-indigo-800/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 lg:mb-10">
            Agaicode Assessment Engine
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 lg:mb-6">
            Evaluation<br />
            <span className="text-indigo-400">Portal</span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm lg:text-base leading-relaxed max-w-sm">
            Sign in to start your developer assessment. The system enforces
            real-time verification and single-attempt rules per session.
          </p>

          {/* Feature pills */}
          <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col gap-2.5 sm:gap-3 max-w-xs">
            {[
              { icon: '🛡️', text: 'Anti-cheat protection active' },
              { icon: '⏱️', text: '45-minute live exam timer' },
              { icon: '📊', text: 'Instant results and review' },
            ].map((f) => (
              <div key={f.text}
                className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 bg-slate-800/40 border border-slate-700/40 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3">
                <span className="text-base flex-shrink-0">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom status */}
        <div className="relative z-10 pt-6 lg:pt-8 mt-6 lg:mt-8 border-t border-slate-800/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-slate-400 font-medium">Supabase Auth — Connected</span>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────── */}
      <div className="
        w-full lg:w-7/12 xl:w-8/12
        bg-slate-950
        flex flex-col justify-center items-center
        p-6 sm:p-10 lg:p-14 xl:p-20
      ">
        {/* Form Card Box with border around all 4 sides */}
        <div className="w-full max-w-md bg-slate-900/60 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8">
            {isSignUp
              ? 'Register to access your assessment portal.'
              : 'Enter your credentials to continue.'}
          </p>

          {/* Tab toggle */}
          <div className="flex bg-slate-950/80 border border-indigo-500/20 p-1.5 rounded-2xl mb-6 sm:mb-8">
            {['Sign In', 'Register'].map((label, i) => {
              const active = i === 0 ? !isSignUp : isSignUp;
              return (
                <button key={label} type="button"
                  onClick={() => { setIsSignUp(i === 1); reset(); }}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200
                    ${active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-500 hover:text-slate-300'}`}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs sm:text-sm font-semibold break-words">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm font-semibold break-words">
              ✅ {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <input type="text" required placeholder="e.g. Amjad Ali"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl
                    text-white placeholder-slate-600 text-sm outline-none
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">
                Email Address
              </label>
              <input type="email" required placeholder="student@agaicode.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl
                  text-white placeholder-slate-600 text-sm outline-none
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">
                Password
              </label>
              <input type="password" required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl
                  text-white placeholder-slate-600 text-sm outline-none
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99]
                text-white font-extrabold py-3.5 sm:py-4 rounded-2xl transition-all duration-200
                shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2
                text-sm disabled:opacity-50">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Admin login */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-indigo-500/20">
            <p className="text-xs text-slate-500 mb-2.5 sm:mb-3 font-medium uppercase tracking-wider">
              Instructor Access
            </p>
            <button type="button" onClick={handleAdminLogin} disabled={adminLoading}
              className="w-full flex items-center justify-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5
                bg-slate-950/80 hover:bg-slate-800 border border-indigo-500/30
                hover:border-indigo-500/60 text-indigo-300 rounded-2xl text-sm
                font-bold transition-all duration-200 disabled:opacity-50 shadow-md">
              {adminLoading
                ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                : <><span className="text-base">🔑</span><span>Sign in as Teacher</span></>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}