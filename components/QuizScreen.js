'use client';
import { useState, useEffect, useRef } from 'react';

const EXAM_DURATION = 45 * 60;

const FUNNY_WARNINGS = [
  { emoji: '🕵️', title: 'Caught You!', msg: " Google pe answers nahi milenge, humne check kar liya pehle se! 😂" },
  { emoji: '👀', title: 'Aye Aye Aye!', msg: "Tab switch? Seriously? Teacher dekh raha hai... aur hum bhi! 🫵" },
  { emoji: '🚨', title: 'ALARM ALARM!', msg: "Arey yaar! Answers bahar se nahi aate, dimaag se aate hain. Apna dimaag use karo! 🧠" },
  { emoji: '😤', title: 'Caught Red-Handed!', msg: "Tab switch karte waqt pakde gaye! Sharam karo thodi... ya nahi? 😏" },
  { emoji: '🤦', title: 'Beta...',  msg: "Tab switch karke answer dhundhna? Hum 2024 mein hain, cheating detect hoti hai! 😅" },
];

export default function QuizScreen({
  currentQuestion,
  totalQuestions,
  currentIndex,
  selectedAnswer,
  subjectiveAnswer,
  onSelectOption,
  onSubjectiveAnswer,
  onNext,
  onTimeUp,
  isLocked,
  tabSwitchCount,
  maxWarnings,
}) {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const timerRef = useRef(null);

  const progressPercentage = (currentIndex / totalQuestions) * 100;
  const isSubjective = currentQuestion?.type === 'subjective';
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isTimeLow = timeLeft <= 5 * 60;

  // ── Reset on question change ───────────────────────────────────────────────
  useEffect(() => {
    setRevealed(false);
  }, [currentIndex]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Show cheat modal when tabSwitchCount increases ─────────────────────────
  useEffect(() => {
    if (tabSwitchCount > 0) {
      const idx = Math.min(tabSwitchCount - 1, FUNNY_WARNINGS.length - 1);
      setCurrentWarning(FUNNY_WARNINGS[idx]);
      setShowCheatModal(true);
    }
  }, [tabSwitchCount]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Option styles ──────────────────────────────────────────────────────────
  const getOptionStyle = (key) => {
    if (!revealed) {
      return selectedAnswer === key
        ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-900 ring-2 ring-indigo-600/20'
        : 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300';
    }
    if (key === currentQuestion.answer) return 'border-green-500 bg-green-50 text-green-900 font-semibold';
    if (key === selectedAnswer) return 'border-red-400 bg-red-50 text-red-900 font-semibold';
    return 'border-gray-200 text-gray-400';
  };

  const getLetterStyle = (key) => {
    if (!revealed) {
      return selectedAnswer === key
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'border-gray-300 text-gray-500 bg-white';
    }
    if (key === currentQuestion.answer) return 'bg-green-500 text-white border-green-500';
    if (key === selectedAnswer) return 'bg-red-400 text-white border-red-400';
    return 'border-gray-200 text-gray-400 bg-white';
  };

  const handleSelect = (key) => {
    if (revealed || isLocked) return;
    onSelectOption(key);
    setRevealed(true);
  };

  return (
    <div className="animate-fadeIn relative">

      {/* ── BLUR OVERLAY + CHEAT MODAL ─────────────────────────────────────── */}
      {showCheatModal && currentWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '1rem' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center
            border-2 border-red-200 animate-bounce-once">

            {/* Emoji */}
            <div className="text-6xl mb-3">{currentWarning.emoji}</div>

            {/* Title */}
            <h2 className="text-2xl font-black text-red-600 mb-2">{currentWarning.title}</h2>

            {/* Funny message */}
            <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">
              {currentWarning.msg}
            </p>

            {/* Warning count */}
            <div className="flex justify-center gap-1.5 mb-5">
              {Array.from({ length: maxWarnings }).map((_, i) => (
                <div key={i}
                  className={`w-3 h-3 rounded-full ${i < tabSwitchCount ? 'bg-red-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-5">
              Warning {tabSwitchCount} of {maxWarnings} — {maxWarnings - tabSwitchCount} remaining
            </p>

            {/* Dismiss button */}
            {!isLocked && (
              <button
                onClick={() => setShowCheatModal(false)}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl
                  hover:bg-indigo-700 transition-all text-sm">
                Okay okay, samajh gaya! 🙈
              </button>
            )}

            {isLocked && (
              <div className="py-3 bg-red-600 text-white font-bold rounded-xl text-sm">
                🚫 Exam auto-submitting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">

        {/* Question counter */}
        <span className="text-xs font-semibold text-gray-400">
          {currentIndex + 1} / {totalQuestions}
        </span>

        {/* ⏱️ BIG TIMER */}
        <div className={`flex items-center gap-2 px-5 py-2 rounded-full font-black border-2
          transition-all duration-300
          ${isTimeLow
            ? 'bg-red-50 border-red-400 text-red-600 animate-pulse scale-105'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}
          style={{ fontSize: '22px', letterSpacing: '0.05em' }}>
          <span style={{ fontSize: '20px' }}>{isTimeLow ? '🔴' : '⏱️'}</span>
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Warning dots */}
        {tabSwitchCount > 0 ? (
          <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200
            px-2.5 py-1.5 rounded-full">
            ⚠️ {tabSwitchCount}/{maxWarnings}
          </span>
        ) : (
          <span className="text-xs text-green-500 font-semibold">✓ Clean</span>
        )}
      </div>

      {/* ── PROGRESS BAR ──────────────────────────────────────────────────── */}
      <div className="w-full bg-gray-100 h-2.5 rounded-full mb-5 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* ── SECTION HEADER ────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider
            ${currentQuestion.section === 'CSS'
              ? 'text-purple-600 bg-purple-50'
              : 'text-indigo-600 bg-indigo-50'}`}>
            {currentQuestion.section}
          </span>
          {isSubjective && (
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1
              rounded-md uppercase tracking-wider">
              Section B
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-400">
          Q {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* ── QUESTION TEXT ─────────────────────────────────────────────────── */}
      <h2 className="text-xl font-bold mb-6 text-gray-900 leading-snug">
        {currentQuestion.q}
      </h2>

      {/* ── MCQ OPTIONS ───────────────────────────────────────────────────── */}
      {!isSubjective && (
        <>
          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button key={key} onClick={() => handleSelect(key)}
                disabled={revealed || isLocked}
                className={`w-full text-left px-5 py-4 border rounded-xl transition-all
                  flex items-center gap-4 ${getOptionStyle(key)}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold border transition-all flex-shrink-0 ${getLetterStyle(key)}`}>
                  {key}
                </span>
                <span>{value}</span>
              </button>
            ))}
          </div>

          {revealed && (
            <div className={`mt-5 p-4 rounded-xl border text-sm leading-relaxed
              ${selectedAnswer === currentQuestion.answer
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'}`}>
              <p className="font-bold mb-1">
                {selectedAnswer === currentQuestion.answer ? '✓ Correct!' : '✗ Wrong!'}
                {selectedAnswer !== currentQuestion.answer && (
                  <span className="font-normal"> Correct: <b>{currentQuestion.answer}</b></span>
                )}
              </p>
              <p className="text-gray-600 mt-1">💡 {currentQuestion.explanation}</p>
            </div>
          )}
        </>
      )}

      {/* ── SUBJECTIVE TEXTAREA ───────────────────────────────────────────── */}
      {isSubjective && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            ✏️ Write your answer below — you can write code or explanation.
          </p>
          <textarea
            value={subjectiveAnswer}
            onChange={(e) => onSubjectiveAnswer(e.target.value)}
            disabled={isLocked}
            placeholder={`Write your answer here...\n\nExample:\n<tag> content </tag>`}
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
              text-gray-800 font-mono leading-relaxed resize-none outline-none
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
              bg-gray-50 placeholder-gray-300"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Use proper HTML/CSS syntax</span>
            <span>{subjectiveAnswer?.length || 0} chars</span>
          </div>
        </div>
      )}

      {/* ── NEXT BUTTON ───────────────────────────────────────────────────── */}
      {(isSubjective || revealed) && !isLocked && (
        <button onClick={onNext}
          className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 rounded-xl
            hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          {isLastQuestion ? '✓ Finish & Submit Test' : 'Next Question →'}
        </button>
      )}

      {/* ── LOCKED ────────────────────────────────────────────────────────── */}
      {isLocked && (
        <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-xl text-center">
          <p className="text-red-700 font-bold text-sm">
            🚫 Exam locked. Auto-submitting...
          </p>
        </div>
      )}

    </div>
  );
}