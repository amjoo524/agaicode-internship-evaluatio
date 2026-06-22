export default function ResultScreen({
  studentName,
  score,
  totalQuestions,
  selfRating,
  questions,
  selectedAnswers,
  subjectiveAnswers,
  tabSwitchCount,
}) {
  const mcqQuestions = questions.filter((q) => q.type !== 'subjective');
  const subjectiveQs = questions.filter((q) => q.type === 'subjective');
  const mcqTotal = mcqQuestions.length;

  const actualPercentage = Math.round((score / mcqTotal) * 100);

  const getGrade = (pct) => {
    if (pct >= 85) return { grade: 'A+', color: 'bg-green-500' };
    if (pct >= 70) return { grade: 'A',  color: 'bg-emerald-500' };
    if (pct >= 50) return { grade: 'B',  color: 'bg-blue-500' };
    if (pct >= 40) return { grade: 'C',  color: 'bg-yellow-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  const result = getGrade(actualPercentage);

  return (
    <div className="py-4 animate-fadeIn">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <h1 className="text-5xl mb-2">🎉</h1>
        <h2 className="text-3xl font-black text-gray-900 mb-1">Assessment Complete!</h2>
        <p className="text-gray-500 font-medium">
          Thank you,{' '}
          <span className="font-bold text-gray-900">{studentName}</span>
        </p>
      </div>

      {/* ── Score Card ────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto border border-gray-200/60 shadow-sm mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-1">
          MCQ Score (Section A)
        </p>
        <div className="text-5xl font-black text-gray-900 text-center mb-4">
          {score}{' '}
          <span className="text-2xl text-gray-400 font-normal">/ {mcqTotal}</span>
        </div>

        <div className="flex items-center justify-center gap-3 border-b border-gray-200/60 pb-4 mb-4">
          <span className="text-gray-600 font-semibold text-sm">Grade:</span>
          <span className={`text-white font-bold px-4 py-1 rounded-full text-sm shadow-sm ${result.color}`}>
            {result.grade}
          </span>
        </div>

        <div className="space-y-2 text-sm font-medium text-gray-600">
          <div className="flex justify-between">
            <span>Self-Confidence Rating:</span>
            <span className="font-bold text-indigo-600">{selfRating}%</span>
          </div>
          <div className="flex justify-between">
            <span>Actual Score:</span>
            <span className="font-bold text-emerald-600">{actualPercentage}%</span>
          </div>
          <div className="flex justify-between">
            <span>Tab Switches Detected:</span>
            <span className={`font-bold ${tabSwitchCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {tabSwitchCount > 0 ? `⚠️ ${tabSwitchCount} time(s)` : '✓ None'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Anti-Cheat Report ─────────────────────────────────────────────── */}
      {tabSwitchCount > 0 && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-orange-50 border border-orange-200
          rounded-xl text-sm text-orange-800">
          <p className="font-bold mb-1">🚫 Anti-Cheat Report</p>
          <p>
            This student switched tabs{' '}
            <span className="font-bold">{tabSwitchCount} time(s)</span>{' '}
            during the exam. Please review their answers carefully.
          </p>
        </div>
      )}

      {/* ── Section B: Subjective Answers ─────────────────────────────────── */}
      {subjectiveQs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            📝 Section B — Written Answers
          </h3>
          <div className="space-y-4">
            {subjectiveQs.map((q) => {
              const qIndex = questions.indexOf(q);
              const answer = subjectiveAnswers[qIndex];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <p className="font-bold text-gray-800 mb-2 text-sm">{q.q}</p>
                  {answer ? (
                    <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap
                      bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">
                      {answer}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No answer provided.</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 italic">
                    💡 Expected: {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section A: MCQ Review ─────────────────────────────────────────── */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          🔍 Section A — Answer Review
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {mcqQuestions.map((q) => {
            const qIndex = questions.indexOf(q);
            const isCorrect = selectedAnswers[qIndex] === q.answer;
            const userAns = selectedAnswers[qIndex];

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border text-left
                  ${isCorrect
                    ? 'bg-green-50/40 border-green-200'
                    : 'bg-red-50/40 border-red-200'
                  }`}
              >
                <p className="font-bold text-gray-900 mb-1 text-sm">{q.q}</p>

                <p className="text-sm text-gray-600">
                  Your Answer:{' '}
                  <span className={isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {userAns
                      ? `${userAns} — ${q.options[userAns]}`
                      : 'Not answered'}
                  </span>
                </p>

                {!isCorrect && (
                  <p className="text-sm text-green-700 font-medium mt-0.5">
                    Correct Answer:{' '}
                    <span className="font-bold">
                      {q.answer} — {q.options[q.answer]}
                    </span>
                  </p>
                )}

                <p className="text-xs text-gray-500 italic mt-2 bg-white/60 p-2 rounded border border-gray-100">
                  💡 {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
