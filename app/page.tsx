'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

import Header from '../components/Header';
import AuthScreen from '../components/AuthScreen';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import ResultScreen from '../components/ResultScreen';
import LockScreen from '../components/LockScreen';
import TeacherDashboard from '../components/TeacherDashboard';

const MAX_WARNINGS = 5;

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [step, setStep] = useState<'start' | 'quiz' | 'result'>('start');
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

  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [isAttemptLocked, setIsAttemptLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(false);
  const submissionSavedRef = useRef(false);

  const resetSubmissionRef = () => {
    submissionSavedRef.current = false;
  };

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isExamLocked, setIsExamLocked] = useState(false);

  const checkUserStatus = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      setUserProfile(null);
      setAuthLoading(false);
      return;
    }

    setCheckingLock(true);
    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let profileData = prof;

      if (profErr || !prof) {
        profileData = {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.user_metadata?.role || 'student',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        };
      }

      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sahkoo524@gmail.com').toLowerCase();
      if (currentUser.email?.toLowerCase() === adminEmail || profileData?.email?.toLowerCase() === adminEmail) {
        profileData = {
          ...profileData,
          role: 'teacher',
          full_name: profileData?.full_name || 'System Admin',
        };
      }

      setUserProfile(profileData);
      setStudentName(profileData.full_name || '');

      if (profileData.role === 'student') {
        const { data: submissions, error: subErr } = await supabase
          .from('test_submissions')
          .select('submitted_at')
          .eq('user_id', currentUser.id)
          .order('submitted_at', { ascending: false })
          .limit(1);

        if (!subErr && submissions && submissions.length > 0) {
          const lastTime = submissions[0].submitted_at;
          setLastSubmittedAt(lastTime);
          const lockDuration = 24 * 60 * 60 * 1000;
          const timePassed = Date.now() - new Date(lastTime).getTime();

          if (timePassed < lockDuration) {
            setIsAttemptLocked(true);
          } else {
            setIsAttemptLocked(false);
          }
        } else if (!subErr) {
          setLastSubmittedAt(null);
          setIsAttemptLocked(false);
        } else {
          console.error('Failed to check submissions:', subErr);
        }
      }
    } catch (err) {
      console.error('Error fetching user status:', err);
    } finally {
      setCheckingLock(false);
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      checkUserStatus(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      checkUserStatus(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [checkUserStatus]);

  useEffect(() => {
    Promise.all([
      fetch('/api/questions').then((res) => {
        if (!res.ok) throw new Error('Could not establish connection to the Academy API.');
        return res.json();
      }),
      fetch('/api/englishQuestions').then((res) => {
        if (!res.ok) throw new Error('Could not establish connection to the English Questions API.');
        return res.json();
      }),
    ])
      .then(([techQuestions, englishQuestions]) => {
        setQuizQuestions([...techQuestions, ...englishQuestions]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'An unexpected error occurred.');
        setLoading(false);
      });
  }, []);

  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const quizData = activeQuizQuestions;

  const saveSubmissionToSupabase = useCallback(
    async (finalScore: number, questionsCount: number) => {
      if (!user) return;
      if (submissionSavedRef.current) return;
      submissionSavedRef.current = true;

      const nowISO = new Date().toISOString();
      const payload = {
        user_id: user.id,
        score: finalScore,
        total_questions: questionsCount,
        submitted_at: nowISO,
        student_name: studentName || userProfile?.full_name || user.email,
        category: selectedCategory,
        self_rating: selfRating,
        tab_switch_count: tabSwitchCount,
      };

      try {
        const { error } = await supabase.from('test_submissions').insert([payload]);
        if (error) {
          await supabase.from('test_submissions').insert([
            {
              user_id: user.id,
              score: finalScore,
              total_questions: questionsCount,
              submitted_at: nowISO,
              student_name: studentName || userProfile?.full_name || user.email,
              category: selectedCategory,
            },
          ]);
        }
        setLastSubmittedAt(nowISO);
        setIsAttemptLocked(true);
      } catch (err) {
        console.error('Failed to record test submission:', err);
      }
    },
    [user, studentName, userProfile, selectedCategory, selfRating, tabSwitchCount]
  );

  const handleFinalSubmit = useCallback(() => {
    saveSubmissionToSupabase(score, quizData.length);
    setStep('start');
  }, [saveSubmissionToSupabase, score, quizData]);

  const handleAutoSubmit = useCallback(() => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    saveSubmissionToSupabase(finalScore, quizData.length);
    setStep('result');
    setShowWarning(false);
  }, [quizData, selectedAnswers, saveSubmissionToSupabase]);

  const handleCheatAttempt = useCallback(
    (reason: string) => {
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
    },
    [step, handleAutoSubmit]
  );

  // ==========================================
  // ONLY TAB SWITCH & MINIMIZE DETECTION ACTIVE (Copy/Paste & Shortcuts removed)
  // ==========================================
  useEffect(() => {
    if (step !== 'quiz') return;

    const handleBlur = () => handleCheatAttempt('Tab switched or browser lost focus');
    const handleVisibility = () => {
      if (document.hidden) handleCheatAttempt('Tab switched or browser minimized');
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [step, handleCheatAttempt]);

  const handleSelectOption = (optionKey: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQIndex]: optionKey });
  };

  const handleSubjectiveAnswer = (text: string) => {
    setSubjectiveAnswers({ ...subjectiveAnswers, [currentQIndex]: text });
  };

  const handleNext = () => {
    const currentQ = quizData[currentQIndex];

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
      saveSubmissionToSupabase(finalScore, quizData.length);
      setStep('result');
    }
  };

  const handleTimeUp = () => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && selectedAnswers[index] === q.answer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    saveSubmissionToSupabase(finalScore, quizData.length);
    setStep('result');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    resetSubmissionRef();
    setStep('start');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-100/70 p-10 border border-gray-100 text-center animate-fadeIn">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Initializing Academy Portal...</h2>
          <p className="text-gray-500 text-sm">Verifying authentication & question bank...</p>
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

  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={(authUser: any) => {
          setUser(authUser);
          checkUserStatus(authUser);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans w-full">
      {user && <Header userProfile={userProfile} onSignOut={handleSignOut} />}

      <main className="w-full flex-1 flex flex-col">
        
        {showWarning && (
          <div className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 text-white font-bold text-center text-sm shadow-lg ${isExamLocked ? 'bg-red-600' : 'bg-orange-500'}`}>
            {warningMessage}
            {!isExamLocked && (
              <button onClick={() => setShowWarning(false)} className="ml-4 underline text-white/80 font-normal text-xs">
                Dismiss
              </button>
            )}
          </div>
        )}

        {step === 'quiz' && tabSwitchCount > 0 && (
          <div className="fixed top-4 right-4 z-40 bg-red-100 border border-red-300 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
            ⚠️ Warnings: {tabSwitchCount} / {MAX_WARNINGS}
          </div>
        )}

        {userProfile?.role === 'teacher' ? (
          <TeacherDashboard userProfile={userProfile} />
        ) : isAttemptLocked && step === 'start' ? (
          <LockScreen lastSubmittedAt={lastSubmittedAt} userProfile={userProfile} checkingLock={checkingLock} onRefreshCheck={() => checkUserStatus(user)} />
        ) : (
          <>
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
                  if (isAttemptLocked) return;
                  const categoryQuestions = selectedCategory === 'ALL' ? quizQuestions : quizQuestions.filter((q) => q.section === selectedCategory);
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
                  setScore(0);
                  resetSubmissionRef();
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
                 studentName={studentName || userProfile?.full_name || 'Student'}
                 onSubmitFinal={handleFinalSubmit}
               />
             )}
          </>
        )}
      </main>
    </div>
  );
}