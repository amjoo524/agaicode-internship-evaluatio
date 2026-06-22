'use client';
import { useState, useEffect, useCallback } from 'react';

import quizQuestions from '@/data/questions.json';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import ResultScreen from '../components/ResultScreen';

const MAX_WARNINGS = 3; // 3 warnings ke baad auto-submit

export default function Home() {
  const [step, setStep] = useState('start');
  const [studentName, setStudentName] = useState('');
  const [selfRating, setSelfRating] = useState(50);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});

  // ── Anti-Cheat State ──────────────────────────────────────────────────────
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isExamLocked, setIsExamLocked] = useState(false);

  const quizData = Array.isArray(quizQuestions) ? quizQuestions : [];

  // ── Anti-Cheat: Tab Switch Detector ──────────────────────────────────────
  const handleBlur = useCallback(() => {
    if (step !== 'quiz') return;

    const newCount = tabSwitchCount + 1;
    setTabSwitchCount(newCount);

    if (newCount >= MAX_WARNINGS) {
      setWarningMessage(
        `FINAL WARNING! You have switched tabs ${newCount} times. Your exam is now being auto-submitted.`
      );
      setShowWarning(true);
      setIsExamLocked(true);
      // Auto submit after 3 seconds
      setTimeout(() => {
        handleAutoSubmit();
      }, 3000);
    } else {
      setWarningMessage(
        `⚠️ Tab switch detected! Warning ${newCount} of ${MAX_WARNINGS}. Switching tabs again may result in auto-submission.`
      );
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
    }
  }, [step, tabSwitchCount]);

  useEffect(() => {
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [handleBlur]);

  // ── Auto Submit ───────────────────────────────────────────────────────────
  const handleAutoSubmit = () => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setStep('result');
    setShowWarning(false);
  };

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
            selfRating={selfRating}
            setSelfRating={setSelfRating}
            onStart={() => {
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
          />
        )}

      </div>
    </div>
  );
}
