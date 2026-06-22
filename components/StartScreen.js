export default function StartScreen({ studentName, setStudentName, selfRating, setSelfRating, onStart }) {
  return (
    <div className="text-center animate-fadeIn">
      <h1 className="text-4xl font-black text-indigo-600 mb-2 tracking-tight">Agaicode Technologies</h1>
      <p className="text-gray-500 font-medium mb-8">Web Development Internship Written Evaluation</p>
      
      <form onSubmit={(e) => { e.preventDefault(); onStart(); }} className="space-y-6 text-left max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Student Full Name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            How much would you rate your knowledge in HTML & CSS?
          </label>
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <input
              type="range"
              min="0"
              max="100"
              value={selfRating}
              onChange={(e) => setSelfRating(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xl font-black text-indigo-600 min-w-[60px] text-right">{selfRating}%</span>
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          Start Assessment Test
        </button>
      </form>
    </div>
  );
}