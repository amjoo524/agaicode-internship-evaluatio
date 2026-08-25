/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

import HeaderImport from '../components/Header';
import AuthScreenImport from '../components/AuthScreen';
import StartScreenImport from '../components/StartScreen';
import QuizScreenImport from '../components/QuizScreen';
import ResultScreenImport from '../components/ResultScreen';
import LockScreenImport from '../components/LockScreen';
import TeacherDashboard from '../components/TeacherDashboard';

const Header = HeaderImport as any;
const AuthScreen = AuthScreenImport as any;
const StartScreen = StartScreenImport as any;
const QuizScreen = QuizScreenImport as any;
const ResultScreen = ResultScreenImport as any;
const LockScreen = LockScreenImport as any;

const shuffleArray = (array: any[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

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

  const checkUserStatus = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      setUserProfile(null);
      setAuthLoading(false);
      return;
    }

    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'sahkoo524@gmail.com').toLowerCase();
    const isTeacher = currentUser.email?.toLowerCase() === adminEmail || currentUser.user_metadata?.role === 'teacher';

    const initialProfile = {
      id: currentUser.id,
      email: currentUser.email,
      role: isTeacher ? 'teacher' : 'student',
      full_name: currentUser.user_metadata?.full_name || (isTeacher ? 'System Admin' : currentUser.email?.split('@')[0]),
    };

    setUserProfile(initialProfile);
    setStudentName(initialProfile.full_name || '');
    setAuthLoading(false);

    setCheckingLock(true);
    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let profileData = prof;

      if (profErr || !prof) {
        profileData = initialProfile;
      } else {
        profileData = {
          ...prof,
          role: (currentUser.email?.toLowerCase() === adminEmail || prof.role === 'teacher' || isTeacher) ? 'teacher' : 'student',
          full_name: prof.full_name || initialProfile.full_name,
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

  const fetchCategoryQuestions = useCallback(async (category: string) => {
    if (category === 'JS') {
      const res = await fetch('/api/javascriptQuestions');
      if (!res.ok) throw new Error('Could not establish connection to JavaScript Questions API.');
      return await res.json();
    } else if (category === 'English') {
      const res = await fetch('/api/englishQuestions');
      if (!res.ok) throw new Error('Could not establish connection to English Questions API.');
      return await res.json();
    } else if (category === 'ALL') {
      const [techRes, engRes, jsRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/englishQuestions'),
        fetch('/api/javascriptQuestions'),
      ]);
      const tech = techRes.ok ? await techRes.json() : [];
      const eng = engRes.ok ? await engRes.json() : [];
      const js = jsRes.ok ? await jsRes.json() : [];
      return [...tech, ...eng, ...js];
    } else {
      const res = await fetch('/api/questions');
      if (!res.ok) throw new Error('Could not establish connection to Academy Questions API.');
      return await res.json();
    }
  }, []);

  useEffect(() => {
    fetchCategoryQuestions('ALL')
      .then((allQuestions) => {
        setQuizQuestions(allQuestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'An unexpected error occurred.');
        setLoading(false);
      });
  }, [fetchCategoryQuestions]);


  const isTeacher = userProfile?.role === 'teacher';

  const quizData = activeQuizQuestions.length > 0 ? activeQuizQuestions : quizQuestions;

  const saveSubmissionToSupabase = useCallback(
    async (finalScore: number, questionsCount: number) => {
      if (submissionSavedRef.current) return;
      if (!user || userProfile?.role === 'teacher') return;

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
        tab_switch_count: 0,
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
    [user, studentName, userProfile, selectedCategory, selfRating]
  );

  const handleFinalSubmit = useCallback(() => {
    saveSubmissionToSupabase(score, quizData.length);
    setStep('start');
  }, [saveSubmissionToSupabase, score, quizData]);

  const checkIsAnswerCorrect = (q: any, selected: any) => {
    if (!q || selected === undefined || selected === null) return false;
    if (q.type === 'short_code' || q.type === 'subjective') {
      if (typeof selected === 'string' && typeof q.answer === 'string') {
        const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').replace(/;$/, '');
        return normalize(selected) === normalize(q.answer) || selected.includes(q.answer.trim());
      }
      return false;
    }
    if (q.type === 'drag_drop' || q.type === 'drag-and-drop') {
      return typeof selected === 'object' && selected !== null && Object.keys(selected).length > 0;
    }
    if (q.answer === selected) return true;
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      if (q.options[q.answer] === selected) return true;
    }
    return false;
  };

  const handleSelectOption = useCallback((optionKey: any) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optionKey }));
  }, [currentQIndex]);

  const handleSubjectiveAnswer = useCallback((text: string) => {
    setSubjectiveAnswers((prev) => ({ ...prev, [currentQIndex]: text }));
  }, [currentQIndex]);

  const handleNext = useCallback(() => {
    const currentQ = quizData[currentQIndex];

    const isSubjectiveType = currentQ?.type === 'subjective' || currentQ?.type === 'short_code';
    if (!isSubjectiveType && !selectedAnswers[currentQIndex]) {
      alert('Please select an answer before moving next!');
      return;
    }

    if (currentQIndex < quizData.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      let finalScore = 0;
      quizData.forEach((q, index) => {
        if ((q.type !== 'subjective' && q.type !== 'short_code') && checkIsAnswerCorrect(q, selectedAnswers[index])) {
          finalScore += 1;
        }
      });
      setScore(finalScore);
      saveSubmissionToSupabase(finalScore, quizData.length);
      setStep('result');
    }
  }, [quizData, currentQIndex, selectedAnswers, saveSubmissionToSupabase]);

  const handleTimeUp = useCallback(() => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      if (q.type !== 'subjective' && checkIsAnswerCorrect(q, selectedAnswers[index])) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    saveSubmissionToSupabase(finalScore, quizData.length);
    setStep('result');
  }, [quizData, selectedAnswers, saveSubmissionToSupabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setStep('start');
  };

  const handleStart = useCallback(async () => {
    if (!studentName.trim()) {
      alert('Please enter your full name before starting the test.');
      return;
    }

    try {
      let loadedCategoryQuestions = quizQuestions;
      if (selectedCategory !== 'ALL') {
        loadedCategoryQuestions = await fetchCategoryQuestions(selectedCategory);
      }

      const shuffled = shuffleArray(loadedCategoryQuestions);

      let limitNum = shuffled.length;
      if (questionLimit !== 'ALL') {
        limitNum = Number(questionLimit);
      }

      const subset = shuffled.slice(0, Math.min(limitNum, shuffled.length));
      setActiveQuizQuestions(subset);
      setSelectedAnswers({});
      setSubjectiveAnswers({});
      setCurrentQIndex(0);
      setScore(0);
      resetSubmissionRef();
      setStep('quiz');
    } catch (err: any) {
      alert(err.message || 'Failed to load test questions.');
    }
  }, [studentName, quizQuestions, selectedCategory, questionLimit, fetchCategoryQuestions]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-center items-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-400 font-mono text-sm font-bold">Loading Portal...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-center items-center font-sans p-4">
        <div className="bg-rose-950/60 border border-rose-500/40 p-6 rounded-2xl max-w-md text-center">
          <p className="text-rose-400 font-bold mb-2">System Error</p>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 transition-colors"
          >
            Reload Test Portal
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(authUser: any) => { setUser(authUser); checkUserStatus(authUser); }} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        userProfile={userProfile}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col justify-center items-center">
        {isTeacher ? (
          <TeacherDashboard userProfile={userProfile} />
        ) : (
          <>
            {isAttemptLocked && step === 'start' && (
              <LockScreen
                userProfile={userProfile}
                lastSubmittedAt={lastSubmittedAt}
                checkingLock={checkingLock}
                onRefreshCheck={() => checkUserStatus(user)}
              />
            )}

            {!isAttemptLocked && step === 'start' && (
              <StartScreen
                studentName={studentName}
                setStudentName={setStudentName}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selfRating={selfRating}
                setSelfRating={setSelfRating}
                questionLimit={questionLimit}
                setQuestionLimit={setQuestionLimit}
                onStart={handleStart}
                onStartQuiz={handleStart}
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
                isLocked={false}
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