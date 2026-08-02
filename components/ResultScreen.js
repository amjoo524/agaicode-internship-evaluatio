export default function ResultScreen({ studentName, onSubmitFinal }) {

  const handleFinalSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in!");
        return;
      }

      // 1. Supabase me test data save/update karo
      const { error } = await supabase
        .from('test_results') // Apne table ka naam likhein
        .insert([
          {
            user_id: user.id,
            score: score,
            total_questions: totalQuestions,
            percentage: actualPercentage,
            answers: selectedAnswers,
            tab_switches: tabSwitchCount,
            submitted_at: new Date().toISOString()
          }
        ]);

      // 2. User ki profile me last_test_at update karo (24-hour restriction ke liye)
      await supabase
        .from('profiles')
        .update({ last_test_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      alert("Test submitted successfully!");

      // 3. User ko redirect karo dashboard par
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Submission Error:", err.message);
      alert("Submit karne me error aya: " + err.message);
    }
  };
  return (
    <div className="py-8 animate-fadeIn max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
        🎯
      </div>

      <h2 className="text-3xl font-black text-gray-900 mb-2">
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
        onClick={onSubmitFinal}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-base"
      >
        Submit & Exit Test
      </button>
    </div>
  );
}