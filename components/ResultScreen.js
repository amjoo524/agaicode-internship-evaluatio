export default function ResultScreen({ studentName, onSubmitFinal }) {
  return (
    <div className="py-8 animate-fadeIn max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15h.01M12 9v4" />
        </svg>
      </div>

      <h2 className="text-3xl font-black text-white-600 mb-2">
        Thank You, <span className="text-indigo-600">{studentName || "Student"}</span>!
      </h2>

      {/* Result wait message */}
      <p className="text-indigo-600 font-semibold text-sm mb-4">
        Your test is ready for final submission. We truly appreciate your time and effort!
      </p>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 text-left mb-8 shadow-sm">
        <h4 className="font-bold text-indigo-900 text-sm mb-1">
          ✨ What happens next?
        </h4>
        <p className="text-xs text-indigo-700/80 leading-normal">
          Your answers have been saved. Your teacher will evaluate your test and share the marks soon. Keep learning and growing!
        </p>
      </div>

      <button
        type="button"
        onClick={onSubmitFinal}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-base cursor-pointer"
      >
        Submit & Exit Test
      </button>
    </div>
  );
}