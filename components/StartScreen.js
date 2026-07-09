const categories = [
  { id: 'HTML', name: 'HTML', desc: 'HyperText Markup Language', icon: '🌐', activeColor: 'bg-orange-600 text-white border-orange-600 ring-4 ring-orange-100' },
  { id: 'CSS', name: 'CSS', desc: 'Cascading Style Sheets', icon: '🎨', activeColor: 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100' },
  { id: 'JS', name: 'JavaScript', desc: 'JS Basics, ES6+ & Async', icon: '⚡', activeColor: 'bg-amber-500 text-amber-950 border-amber-500 ring-4 ring-amber-100' },
  { id: 'React', name: 'React', desc: 'Hooks & Component Lifecycle', icon: '⚛️', activeColor: 'bg-cyan-600 text-white border-cyan-600 ring-4 ring-cyan-100' },
  { id: 'Next.js', name: 'Next.js', desc: 'App Router, SSR & Routing', icon: '▲', activeColor: 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-200' },
  { id: 'ALL', name: 'Full Stack', desc: 'All subjects combined', icon: '🚀', activeColor: 'bg-purple-600 text-white border-purple-600 ring-4 ring-purple-100' },
];

export default function StartScreen({
  studentName,
  setStudentName,
  selectedCategory,
  setSelectedCategory,
  questionLimit,
  setQuestionLimit,
  selfRating,
  setSelfRating,
  onStart
}) {
  const getRatingLabel = () => {
    switch (selectedCategory) {
      case 'HTML': return 'HTML';
      case 'CSS': return 'CSS';
      case 'JS': return 'JavaScript';
      case 'React': return 'React';
      case 'Next.js': return 'Next.js';
      default: return 'Full Stack Web Development';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-indigo-600 mb-2 tracking-tight">Agaicode Technologies</h1>
        <p className="text-gray-500 font-medium">Web Development Internship Written Evaluation</p>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); onStart(); }} className="space-y-8 text-left max-w-xl mx-auto">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Student Full Name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Test Subject</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col p-4 border rounded-xl text-left transition-all cursor-pointer shadow-sm relative overflow-hidden group hover:-translate-y-0.5 ${
                    isSelected 
                      ? `${cat.activeColor} scale-[1.01] border-transparent font-semibold` 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 bg-white text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm leading-tight">{cat.name}</span>
                  <span className={`text-xs mt-1 leading-snug ${isSelected ? 'opacity-90' : 'text-gray-400'}`}>
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Number of Questions</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: '20 Questions', value: 20 },
              { label: '30 Questions', value: 30 },
              { label: '40 Questions', value: 40 },
              { label: '50 Questions', value: 50 },
              { label: 'All Questions', value: 'ALL' },
            ].map((opt) => {
              const isSelected = questionLimit === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuestionLimit(opt.value)}
                  className={`py-3 px-2 border rounded-xl text-center text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold ring-4 ring-indigo-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-700 bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            How much would you rate your knowledge in {getRatingLabel()}?
          </label>
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <input
              type="range"
              min="0"
              max="100"
              value={selfRating}
              onChange={(e) => setSelfRating(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xl font-black text-indigo-600 min-w-[60px] text-right">{selfRating}%</span>
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-100 cursor-pointer">
          Start Assessment Test
        </button>
      </form>
    </div>
  );
}