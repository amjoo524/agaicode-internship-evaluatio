import {
  Globe, Palette, Zap, Atom, Triangle, Layers,
  Check, User, HelpCircle, Gauge, ArrowRight, ShieldAlert,
  Clock, MonitorOff, CheckSquare, Settings, MessageCircle
} from 'lucide-react';

const categories = [
  { id: 'HTML', name: 'HTML', desc: 'HyperText Markup Language', Icon: Globe, activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' },
  { id: 'CSS', name: 'CSS', desc: 'Cascading Style Sheets', Icon: Palette, activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' },
  { id: 'JS', name: 'JS', desc: 'JS Basics, ES6+ & Async', Icon: Zap, activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' },
  { id: 'React', name: 'React', desc: 'Hooks & Component Lifecycle', Icon: Atom, activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' },
  { id: 'Next.js', name: 'Next.js', desc: 'App Router, SSR & Routing', Icon: Triangle, activeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50' },
  { id: 'English', name: 'English & Grammar', desc: 'Tenses, Vocabulary & Structure', Icon: MessageCircle, activeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/50' },
  { id: 'ALL', name: 'Full Stack', desc: 'All subjects combined', Icon: Layers, activeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500' },
];

export default function StartScreen({
  studentName, setStudentName, selectedCategory, setSelectedCategory,
  questionLimit, setQuestionLimit, selfRating, setSelfRating, onStart
}) {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col lg:flex-row m-0 p-0">
      
      {/* left side - aligned to top */}
      <div className="w-full lg:w-1/2 p-8 lg:p-20 pt-12 lg:pt-20 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-slate-800/60">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 w-fit">
          <ShieldAlert className="w-4 h-4" /> Evaluation Module
        </div>
        
        <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Web Development <br className="hidden lg:block"/> Written Assessment
        </h1>
        
        <p className="text-slate-400 text-base mt-6 max-w-md">
          Configure your exam parameters on the right to start the evaluation. Make sure to double check your details.
        </p>

        {/* New Instructions Section */}
        <div className="mt-12 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 max-w-md">
          <h3 className="text-lg font-bold text-slate-200 mb-5 border-b border-slate-800 pb-3">Assessment Guidelines</h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
              <span><strong>Timed Evaluation:</strong> You have 90 seconds per question. Time is tracked automatically.</span>
            </li>
            <li className="flex items-start gap-3">
              <MonitorOff className="w-5 h-5 text-indigo-400 shrink-0" />
              <span><strong>Anti-Cheat Active:</strong> Switching tabs or minimizing the browser will auto-submit the exam after 2 warnings.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0" />
              <span><strong>Final Submission:</strong> Once started, you cannot pause. Your score is recorded immediately upon completion.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* right side - form full height */}
      <div className="w-full lg:w-1/2 p-8 lg:p-20 flex flex-col justify-center bg-[#020617]">
        <form onSubmit={(e) => { e.preventDefault(); onStart(); }} className="space-y-8 max-w-2xl w-full mx-auto">
          
          {/* New Header for the form side */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-2xl font-bold text-white">Exam Configuration</h2>
            </div>
            <p className="text-sm text-slate-400">Please fill in your details and select the test parameters below before starting.</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <User className="w-4 h-4 text-indigo-400" /> Student Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/40 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400" /> Select Test Subject
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.Icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      isSelected ? cat.activeColor : 'border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <span className={`font-bold text-sm block truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Number of Questions
            </label>
            <div className="flex flex-wrap gap-3">
              {[20, 30, 40, 50, 'ALL'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQuestionLimit(opt)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all border ${
                    questionLimit === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  {opt === 'ALL' ? 'All' : opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-400" /> Knowledge Rating
              </span>
              <span className="text-sm font-bold text-indigo-400">{selfRating}%</span>
            </div>
           <input
              type="range"
              min="0"
              max="100"
              value={selfRating}
              onChange={(e) => setSelfRating(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-5 
              [&::-webkit-slider-thumb]:h-5 
              [&::-webkit-slider-thumb]:bg-indigo-500 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:cursor-pointer 
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:w-5 
              [&::-moz-range-thumb]:h-5 
              [&::-moz-range-thumb]:bg-indigo-500 
              [&::-moz-range-thumb]:border-0 
              [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:cursor-pointer 
              [&::-moz-range-thumb]:shadow-lg"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 text-lg"
          >
            Start Assessment Test <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}