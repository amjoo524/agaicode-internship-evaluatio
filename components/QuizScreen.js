'use client';
import { useState, useEffect, useRef } from 'react';

const playAlarmSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playBeep = (time, frequency, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, time);
      
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.02);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 880, 0.12);
    playBeep(now + 0.15, 660, 0.12);
    playBeep(now + 0.3, 880, 0.12);
    playBeep(now + 0.45, 660, 0.12);
  } catch (e) {
    console.error("Audio Context not supported or blocked:", e);
  }
};

const FUNNY_WARNINGS = [
  { emoji: '🕵️', title: 'Caught You!', msg: " Google pe answers nahi milenge, humne check kar liya pehle se! 😂" },
  { emoji: '👀', title: 'Aye Aye Aye!', msg: "Tab switch? Seriously? Teacher dekh raha hai... aur hum bhi! 🫵" },
  { emoji: '🚨', title: 'ALARM ALARM!', msg: "Arey yaar! Answers bahar se nahi aate, dimaag se aate hain. Apna dimaag use karo! 🧠" },
  { emoji: '😤', title: 'Caught Red-Handed!', msg: "Tab switch karte waqt pakde gaye! Sharam karo thodi... ya nahi? 😏" },
  { emoji: '🤦', title: 'Beta...',  msg: "Tab switch karke answer dhundhna? Hum 2024 mein hain, cheating detect hoti hai! 😅" },
];

const getSectionBadgeStyle = (section) => {
  switch (section) {
    case 'HTML': return 'text-orange-600 bg-orange-50 border border-orange-100';
    case 'CSS': return 'text-blue-600 bg-blue-50 border border-blue-100';
    case 'JS': return 'text-amber-700 bg-amber-50 border border-amber-100';
    case 'React': return 'text-cyan-600 bg-cyan-50 border border-cyan-100';
    case 'Next.js': return 'text-slate-800 bg-slate-100 border border-slate-200';
    default: return 'text-indigo-600 bg-indigo-50 border border-indigo-100';
  }
};

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
  
  // 🎯 Dynamic Time Calculation: 1 min 50 secs (110 seconds) per question
  const SECONDS_PER_QUESTION = 110; 
  const calculatedTotalTime = (totalQuestions || 1) * SECONDS_PER_QUESTION;

  const [timeLeft, setTimeLeft] = useState(calculatedTotalTime);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const timerRef = useRef(null);

  // Re-calculate timer if totalQuestions count changes
  useEffect(() => {
    if (totalQuestions) {
      setTimeLeft(totalQuestions * SECONDS_PER_QUESTION);
    }
  }, [totalQuestions]);

  const progressPercentage = (currentIndex / totalQuestions) * 100;
  const isSubjective = currentQuestion?.type === 'subjective';
  const isDragAndDrop = currentQuestion?.type === 'drag-and-drop';
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isTimeLow = timeLeft <= 5 * 60; // Low time warning if <= 5 minutes remaining

  const renderCodeWithBlank = () => {
    if (!currentQuestion || !currentQuestion.code) return null;
    const parts = currentQuestion.code.split('[BLANK]');
    return (
      <div className="inline-flex flex-wrap items-center leading-loose">
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <span key={index} className="inline-flex items-center flex-wrap">
              <span>{part}</span>
              {!isLast && (
                <div
                  onDragOver={(e) => !revealed && !isLocked && e.preventDefault()}
                  onDrop={(e) => {
                    if (revealed || isLocked) return;
                    e.preventDefault();
                    const option = e.dataTransfer.getData('text/plain');
                    if (option) {
                      onSelectOption(option);
                      setRevealed(true);
                    }
                  }}
                  onClick={() => {
                    if (revealed || isLocked) return;
                    if (selectedAnswer) {
                      onSelectOption('');
                      setRevealed(false);
                    }
                  }}
                  className={`inline-flex items-center justify-center min-w-[100px] h-[28px] px-2.5 mx-1.5 rounded-md font-bold text-xs transition-all border-2
                    ${!selectedAnswer 
                      ? 'bg-slate-800/80 border-dashed border-slate-500 text-slate-400 select-none' 
                      : revealed
                        ? selectedAnswer === currentQuestion.answer
                          ? 'bg-green-600 border-green-500 text-white shadow-sm shadow-green-900/30'
                          : 'bg-red-600 border-red-500 text-white shadow-sm shadow-red-900/30'
                        : 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-900/30 cursor-pointer hover:bg-indigo-500'
                    }`}
                >
                  {selectedAnswer ? selectedAnswer : 'Drop here'}
                </div>
              )}
            </span>
          );
        })}
      </div>
    );
  };

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
      playAlarmSound();
    }
  }, [tabSwitchCount]);

  // Updated formatTime to support Hours if total time exceeds 60 minutes
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
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

        {/* ⏱️ DYNAMIC TIMER */}
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
          <span className={`text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${getSectionBadgeStyle(currentQuestion.section)}`}>
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

      {/* ── DRAG AND DROP CODE EDITOR ── */}
      {isDragAndDrop && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-850 select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold">
                {currentQuestion.section === 'HTML' ? 'index.html' : currentQuestion.section === 'CSS' ? 'styles.css' : 'index.js'}
              </span>
              <div className="w-12"></div>
            </div>
            {/* Code Content */}
            <div className="p-6 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
              {renderCodeWithBlank()}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-semibold select-none">
              🤝 Drag an option into the blank area above or simply click it:
            </p>
            <div className="flex flex-wrap gap-3">
              {currentQuestion.options.map((option) => {
                const isPlaced = selectedAnswer === option;
                return (
                  <button
                    key={option}
                    type="button"
                    draggable={!revealed && !isLocked}
                    onDragStart={(e) => {
                      if (revealed || isLocked) return;
                      e.dataTransfer.setData('text/plain', option);
                    }}
                    onClick={() => {
                      if (revealed || isLocked) return;
                      onSelectOption(option);
                      setRevealed(true);
                    }}
                    disabled={revealed || isLocked}
                    className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold border transition-all select-none
                      ${isPlaced
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-inner'
                        : revealed
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm cursor-grab active:cursor-grabbing hover:-translate-y-0.5'
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
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
          </div>
        </div>
      )}

      {/* ── MCQ OPTIONS ───────────────────────────────────────────────────── */}
      {!isSubjective && !isDragAndDrop && (
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