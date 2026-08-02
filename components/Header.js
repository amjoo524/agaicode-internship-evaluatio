import { LogOut, GraduationCap, ShieldCheck, Sparkles, Bell } from 'lucide-react';

export default function Header({ userProfile, onSignOut }) {
  if (!userProfile) return null;

  const isTeacher = userProfile.role === 'teacher';
  const name = userProfile.full_name || userProfile.email || 'User';

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-2xl sticky top-0 z-50 mb-8 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
        
        {/* ── Brand / Logo Section ── */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-black flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white text-lg tracking-tight leading-none bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Agaicode
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">
              Evaluation Portal
            </p>
          </div>
        </div>

        {/* ── Center / Extra Info (Fills empty space recommended) ── */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online • Secure Proctoring Active</span>
        </div>

        {/* ── User Profile & Actions ── */}
        <div className="flex items-center gap-3">
          
          {/* Notification Button (Added for better utility) */}
          <button 
            className="p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          </button>

          {/* User Info Box */}
          <div className="flex flex-col items-start bg-slate-900/90 border border-slate-800/90 px-4 py-2 rounded-2xl shadow-inner">
            <p className="text-xs font-bold text-indigo-200 tracking-wide text-left leading-tight">
              {name}
            </p>
            
            {/* Role Badge */}
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isTeacher
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {isTeacher ? (
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                )}
                {isTeacher ? 'Teacher' : 'Student'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

        </div>
      </div>
    </header>
  );
}