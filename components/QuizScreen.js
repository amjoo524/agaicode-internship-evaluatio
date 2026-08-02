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
    console.error("Audio Context error:", e);
  }
};

const WARNING_MESSAGES = [
  "⚠️ Warning 1: Tab switch detect ho gaya hai! Dhyan se exam do.",
  "🚨 Warning 2: Bar bar tab mat badlo, teacher monitor kar rahe hain!",
  "❌ Final Warning: Agli baar tab switch kiya toh test auto-submit ho jayega!"
];

const getSectionBadgeStyle = (section) => {
  switch (section) {
    case 'HTML': return 'text-orange-400 bg-orange-500/10 border border-orange-500/30';
    case 'CSS': return 'text-blue-400 bg-blue-500/10 border border-blue-500/30';
    case 'JS': return 'text-amber-400 bg-amber-500/10 border border-amber-500/30';
    case 'React': return 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30';
    case 'Next.js': return 'text-slate-300 bg-slate-800 border border-slate-700';
    default: return 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30';
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
  const SECONDS_PER_QUESTION = 110; 
  const calculatedTotalTime = (totalQuestions || 1) * SECONDS_PER_QUESTION;

  const [timeLeft, setTimeLeft] = useState(calculatedTotalTime);
  const [latestWarningText, setLatestWarningText] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (totalQuestions) {
      setTimeLeft(totalQuestions * SECONDS_PER_QUESTION);
    }
  }, [totalQuestions]);

  const progressPercentage = (currentIndex / totalQuestions) * 100;
  const isSubjective = currentQuestion?.type === 'subjective';
  const isDragAndDrop = currentQuestion?.type === 'drag-and-drop';
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isTimeLow = timeLeft <= 300; 

  const renderCodeWithBlank = () => {
    if (!currentQuestion || !currentQuestion.code) return null;
    const parts = currentQuestion.code.split('[BLANK]');
    return (
      <div className="inline-flex flex-wrap items-center leading-loose">
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <span key={index} className="inline-flex items-center flex-wrap">
              <span className="text-slate-300">{part}</span>
              {!isLast && (
                <div
                  onDragOver={(e) => !isLocked && e.preventDefault()}
                  onDrop={(e) => {
                    if (isLocked) return;
                    e.preventDefault();
                    const option = e.dataTransfer.getData('text/plain');
                    if (option) {
                      onSelectOption(option);
                    }
                  }}
                  onClick={() => {
                    if (isLocked) return;
                    if (selectedAnswer) {
                      onSelectOption('');
                    }
                  }}
                  className={`inline-flex items-center justify-center min-w-[110px] h-[32px] px-3 mx-2 rounded-lg font-bold text-xs transition-all border-2 cursor-pointer
                    ${!selectedAnswer 
                      ? 'bg-slate-900 border-dashed border-indigo-500/50 text-indigo-400 select-none animate-pulse' 
                      : 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500'
                    }`}
                >
                  {selectedAnswer ? selectedAnswer : 'Drop / Click 🎯'}
                </div>
              )}
            </span>
          );
        })}
      </div>
    );
  };

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

  useEffect(() => {
    if (tabSwitchCount > 0) {
      const idx = Math.min(tabSwitchCount - 1, WARNING_MESSAGES.length - 1);
      setLatestWarningText(WARNING_MESSAGES[idx]);
      playAlarmSound();
    }
  }, [tabSwitchCount]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const getOptionStyle = (key) => {
    return selectedAnswer === key
      ? 'border-indigo-500 bg-indigo-500/15 font-semibold text-white ring-2 ring-indigo-500/30 shadow-md'
      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:border-slate-700';
  };

  const getLetterStyle = (key) => {
    return selectedAnswer === key
      ? 'bg-indigo-600 text-white border-indigo-500'
      : 'border-slate-700 text-slate-400 bg-slate-800/60';
  };

  const handleSelect = (key) => {
    if (isLocked) return;
    onSelectOption(key);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 p-3 lg:p-6 flex flex-col justify-center items-center overflow-hidden">
      <div className="w-full max-w-[1100px] h-[92vh] max-h-[780px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 lg:p-7 shadow-2xl relative backdrop-blur-xl flex flex-col justify-between">

        {/* ── TOP SECTION (Fixed Content) ─────────────────────────────────── */}
        <div className="flex-shrink-0">
          {/* Warning Banner */}
          {tabSwitchCount > 0 && (
            <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚨</span>
                <p className="text-rose-400 text-xs lg:text-sm font-bold">
                  {latestWarningText} <span className="text-slate-400 font-normal">({tabSwitchCount}/{maxWarnings} warnings)</span>
                </p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: maxWarnings }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < tabSwitchCount ? 'bg-rose-500' : 'bg-slate-800'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} <span className="text-slate-600">/</span> {totalQuestions}
            </span>

            {/* Big Timer */}
            <div className={`flex items-center gap-2.5 px-5 py-1.5 rounded-xl font-black border tracking-wider
              transition-all duration-300 text-2xl
              ${isTimeLow
                ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 animate-pulse shadow-lg shadow-rose-950'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950'
              }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
              </svg>
              <span>{formatTime(timeLeft)}</span>
            </div>

            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
              🛡️ Secure Session
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mb-3 overflow-hidden p-0.5">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Section Header */}
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${getSectionBadgeStyle(currentQuestion.section)}`}>
                {currentQuestion.section}
              </span>
              {isSubjective && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg uppercase tracking-wider">
                  Section B
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Progress: {Math.round(progressPercentage)}%
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-base lg:text-lg font-bold mb-3 text-white leading-snug">
            {currentQuestion.q}
          </h2>
        </div>

        {/* ── MIDDLE SECTION (Options / Code / Textarea) ──────────────────── */}
        <div className="flex-1 overflow-y-auto my-1 pr-1 custom-scrollbar">
          {/* Drag and Drop */}
          {isDragAndDrop && (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800/80 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    {currentQuestion.section === 'HTML' ? 'index.html' : currentQuestion.section === 'CSS' ? 'styles.css' : 'index.js'}
                  </span>
                  <div className="w-10"></div>
                </div>
                <div className="p-3 font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
                  {renderCodeWithBlank()}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium select-none flex items-center gap-1.5">
                  💡 Drag an option into the blank space or click to select instantly:
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((option) => {
                    const isPlaced = selectedAnswer === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        draggable={!isLocked}
                        onDragStart={(e) => {
                          if (isLocked) return;
                          e.dataTransfer.setData('text/plain', option);
                        }}
                        onClick={() => handleSelect(option)}
                        disabled={isLocked}
                        className={`px-3 py-2 rounded-lg font-mono text-xs font-bold border transition-all select-none
                          ${isPlaced
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-200 shadow-md cursor-grab active:cursor-grabbing hover:-translate-y-0.5'
                          }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MCQ Options */}
          {!isSubjective && !isDragAndDrop && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button key={key} onClick={() => handleSelect(key)}
                  disabled={isLocked}
                  className={`w-full text-left px-4 py-2.5 border rounded-xl transition-all duration-200
                    flex items-center gap-3 ${getOptionStyle(key)}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center
                    text-xs font-bold border transition-all flex-shrink-0 shadow-sm ${getLetterStyle(key)}`}>
                    {key}
                  </span>
                  <span className="text-xs lg:text-sm font-medium">{value}</span>
                </button>
              ))}
            </div>
          )}

          {/* Subjective Textarea */}
          {isSubjective && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                ✏️ Provide your detailed written response below:
              </p>
              <textarea
                value={subjectiveAnswer}
                onChange={(e) => onSubjectiveAnswer(e.target.value)}
                disabled={isLocked}
                placeholder="Write your structured solution here..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-800 rounded-xl text-xs
                  text-slate-200 font-mono leading-relaxed resize-none outline-none
                  focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                  bg-slate-950 placeholder-slate-600 shadow-inner"
              />
            </div>
          )}
        </div>

        {/* ── BOTTOM SECTION (Fixed Next Button / Footer) ─────────────────── */}
        <div className="flex-shrink-0 pt-3 border-t border-slate-800/60 mt-2">
          {!isLocked ? (
            <button onClick={onNext}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl
                transition-all shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 text-sm sm:text-base">
              {isLastQuestion ? '✓ Finish & Submit Assessment' : 'Next Question →'}
            </button>
          ) : (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
              <p className="text-rose-400 font-bold text-xs">
                🚫 Assessment session locked due to safety breaches. Auto-submitting evaluation...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}