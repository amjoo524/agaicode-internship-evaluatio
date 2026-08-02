export default function Header({ userProfile, onSignOut }) {
  if (!userProfile) return null;

  const isTeacher = userProfile.role === 'teacher';

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-xl border-b border-indigo-500/20 shadow-lg px-4 py-3 sticky top-0 z-30 mb-6 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shadow-lg shadow-indigo-600/30 text-lg">
            A
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base leading-tight">
              Agaicode Technologies
            </h2>
            <p className="text-xs text-slate-400 font-medium">Evaluation Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">
              {userProfile.full_name || userProfile.email || 'User'}
            </p>
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isTeacher
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {isTeacher ? '👨‍🏫 Teacher' : '🎓 Student'}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-red-400 bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-800/60 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Sign Out"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
