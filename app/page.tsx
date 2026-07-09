'use client';
import { useState, useEffect, useCallback } from 'react';

import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import ResultScreen from '../components/ResultScreen';

const MAX_WARNINGS = 2; // Stricter: 2 warnings ke baad auto-submit

export default function Home() {
  const [step, setStep] = useState('start');
  const [studentName, setStudentName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selfRating, setSelfRating] = useState(50);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[]>([]);
  const [questionLimit, setQuestionLimit] = useState<number | 'ALL'>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Anti-Cheat State ──────────────────────────────────────────────────────
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isExamLocked, setIsExamLocked] = useState(false);

  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const quizData = activeQuizQuestions;
  const examDuration = quizData.length * 90; // Exactly 1.5 minutes (90s) per question

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => {
        if (!res.ok) throw new Error('Could not establish connection to the Academy API.');
        return res.json();
      })
      .then((data) => {
        setQuizQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'An unexpected error occurred.');
        setLoading(false);
      });
  }, []);

  // ── Auto Submit ───────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setStep('result');
    setShowWarning(false);
  }, [quizData, selectedAnswers]);

  // ── Anti-Cheat: Heavy Cheat Detector ─────────────────────────────────────
  const handleCheatAttempt = useCallback((reason: string) => {
    if (step !== 'quiz') return;

    setTabSwitchCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= MAX_WARNINGS) {
        setWarningMessage(
          `🚨 FINAL WARNING! Cheat attempt detected: ${reason}. Auto-submitting in 5 seconds...`
        );
        setShowWarning(true);
        setIsExamLocked(true);
        setTimeout(() => {
          handleAutoSubmit();
        }, 5000);
      } else {
        setWarningMessage(
          `⚠️ Cheat attempt detected! Warning ${nextCount} of ${MAX_WARNINGS}: ${reason}.`
        );
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
      return nextCount;
    });
  }, [step, handleAutoSubmit]);

  useEffect(() => {
    if (step !== 'quiz') return;

    const handleBlur = () => handleCheatAttempt("Tab switched or browser lost focus");
    const handleVisibility = () => {
      if (document.hidden) handleCheatAttempt("Tab switched or browser minimized");
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleCheatAttempt("Right-click context menu disabled");
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        handleCheatAttempt("F12 Developer Tools blocked");
      }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleCheatAttempt("Copy shortcut blocked");
      }
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handleCheatAttempt("Paste shortcut blocked");
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        handleCheatAttempt("View Source blocked");
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        handleCheatAttempt("Inspect Element blocked");
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [step, handleCheatAttempt]);

  // ── Answer Handlers ───────────────────────────────────────────────────────
  const handleSelectOption = (optionKey: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQIndex]: optionKey });
  };

  const handleSubjectiveAnswer = (text: string) => {
    setSubjectiveAnswers({ ...subjectiveAnswers, [currentQIndex]: text });
  };

  const handleNext = () => {
    const currentQ = quizData[currentQIndex];

    // MCQ validation
    if (currentQ.type !== 'subjective' && !selectedAnswers[currentQIndex]) {
      alert('Please select an answer before moving next!');
      return;
    }

    if (currentQIndex < quizData.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      let finalScore = 0;
      quizData.forEach((q, index) => {
        if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
          finalScore += 1;
        }
      });
      setScore(finalScore);
      setStep('result');
    }
  };

  // ── Timer Auto Submit ─────────────────────────────────────────────────────
  const handleTimeUp = () => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setStep('result');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-100/70 p-10 border border-gray-100 text-center animate-fadeIn">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connecting to Academy API...</h2>
          <p className="text-gray-500 text-sm">Fetching latest assessment questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-100/70 p-10 border border-gray-100 text-center animate-fadeIn">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">API Connection Failed</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all cursor-pointer shadow-md hover:shadow-indigo-100"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">

      {/* ── Anti-Cheat Warning Banner ── */}
      {showWarning && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 text-white font-bold text-center text-sm shadow-lg
          ${isExamLocked ? 'bg-red-600' : 'bg-orange-500'}`}>
          {warningMessage}
          {!isExamLocked && (
            <button
              onClick={() => setShowWarning(false)}
              className="ml-4 underline text-white/80 font-normal text-xs"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* ── Tab Switch Counter Badge (visible during quiz) ── */}
      {step === 'quiz' && tabSwitchCount > 0 && (
        <div className="fixed top-4 right-4 z-40 bg-red-100 border border-red-300
          text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
          ⚠️ Warnings: {tabSwitchCount} / {MAX_WARNINGS}
        </div>
      )}

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl shadow-gray-100/70
        p-6 md:p-10 border border-gray-100">

        {step === 'start' && (
          <StartScreen
            studentName={studentName}
            setStudentName={setStudentName}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            questionLimit={questionLimit}
            setQuestionLimit={setQuestionLimit}
            selfRating={selfRating}
            setSelfRating={setSelfRating}
            onStart={() => {
              const categoryQuestions = selectedCategory === 'ALL'
                ? quizQuestions
                : quizQuestions.filter((q) => q.section === selectedCategory);
              
              const shuffled = shuffleArray(categoryQuestions);
              const limitNum = questionLimit === 'ALL' ? shuffled.length : Number(questionLimit);
              const subset = shuffled.slice(0, Math.min(limitNum, shuffled.length));

              setActiveQuizQuestions(subset);
              setTabSwitchCount(0);
              setIsExamLocked(false);
              setShowWarning(false);
              setSelectedAnswers({});
              setSubjectiveAnswers({});
              setCurrentQIndex(0);
              setStep('quiz');
            }}
          />
        )}

        {step === 'quiz' && (
          <QuizScreen
            currentQuestion={quizData[currentQIndex]}
            totalQuestions={quizData.length}
            currentIndex={currentQIndex}
            selectedAnswer={selectedAnswers[currentQIndex]}
            subjectiveAnswer={subjectiveAnswers[currentQIndex] || ''}
            onSelectOption={handleSelectOption}
            onSubjectiveAnswer={handleSubjectiveAnswer}
            onNext={handleNext}
            onTimeUp={handleTimeUp}
            isLocked={isExamLocked}
            tabSwitchCount={tabSwitchCount}
            maxWarnings={MAX_WARNINGS}
            examDuration={examDuration}
          />
        )}

        {step === 'result' && (
          <ResultScreen
            studentName={studentName}
            score={score}
            totalQuestions={quizData.length}
            selfRating={selfRating}
            questions={quizData}
            selectedAnswers={selectedAnswers}
            subjectiveAnswers={subjectiveAnswers}
            tabSwitchCount={tabSwitchCount}
            selectedCategory={selectedCategory}
          />
        )}

      </div>
    </div>
  );
}
