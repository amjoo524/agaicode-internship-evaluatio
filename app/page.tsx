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
import StudentDashboard, { StudentSubmissionRecord } from '../components/StudentDashboard';
import StudentNavbar from '../components/StudentNavbar';

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

  const [step, setStep] = useState<'dashboard' | 'start' | 'quiz' | 'result'>('dashboard');
  const [studentName, setStudentName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('HTML');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
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

  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmissionRecord[]>([]);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [isAttemptLocked, setIsAttemptLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(false);
  const submissionSavedRef = useRef(false);

  // Notification System State & Session Persistence
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('portal_notifications') : null;
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [submissionToastMsg, setSubmissionToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('portal_notifications', JSON.stringify(notifications));
      }
    } catch (e) {}
  }, [notifications]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

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

      if (profileData.role === 'student' && currentUser?.id) {
        try {
          const { data: submissions, error: subErr } = await supabase
            .from('test_submissions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('submitted_at', { ascending: false });

          if (!subErr && submissions && submissions.length > 0) {
            setStudentSubmissions(submissions);
            const lastTime = submissions[0].submitted_at;
            setLastSubmittedAt(lastTime);
            const lockDuration = 12 * 60 * 60 * 1000;
            const timePassed = Date.now() - new Date(lastTime).getTime();

            if (timePassed < lockDuration) {
              setIsAttemptLocked(true);
            } else {
              setIsAttemptLocked(false);
            }
          } else {
            setStudentSubmissions(submissions || []);
            setLastSubmittedAt(null);
            setIsAttemptLocked(false);
            if (subErr && subErr.message) {
              console.warn('Submissions query note:', subErr.message);
            }
          }
        } catch (e) {
          setStudentSubmissions([]);
          setLastSubmittedAt(null);
          setIsAttemptLocked(false);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const currentUser = session?.user || null;
        setUser(currentUser);
        checkUserStatus(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUserStatus]);

  const fetchCategoryQuestions = useCallback(async (category: string) => {
    if (category === 'JS') {
      // Fetch EXCLUSIVELY from javascript.json — never from questions.json
      const jsRes = await fetch('/api/javascriptQuestions');
      if (!jsRes.ok) throw new Error('Could not establish connection to JavaScript Questions API.');
      return await jsRes.json();
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
      // HTML, CSS, React, Next.js — fetch questions.json and filter strictly by section
      const res = await fetch('/api/questions');
      if (!res.ok) throw new Error('Could not establish connection to Academy Questions API.');
      const all = await res.json();
      const filtered = all.filter((q: any) => q.section === category);
      if (filtered.length === 0) {
        return all;
      }
      return filtered;
    }
  }, []);

  useEffect(() => {
    fetchCategoryQuestions('ALL')
      .then((allQuestions) => {
        setQuizQuestions(allQuestions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Initial fetch warning, using fallback:', err);
        setQuizQuestions([]);
        setLoading(false);
      });
  }, [fetchCategoryQuestions]);

  // Session state persistence helpers to survive browser reloads on review/result screen
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem('portal_quiz_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.step && parsed.step !== 'dashboard') {
          setStep(parsed.step);
          if (parsed.activeQuizQuestions) setActiveQuizQuestions(parsed.activeQuizQuestions);
          if (parsed.currentQIndex !== undefined) setCurrentQIndex(parsed.currentQIndex);
          if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
          if (parsed.subjectiveAnswers) setSubjectiveAnswers(parsed.subjectiveAnswers);
          if (parsed.score !== undefined) setScore(parsed.score);
          if (parsed.studentName) setStudentName(parsed.studentName);
          if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
          if (parsed.selectedTopics) setSelectedTopics(parsed.selectedTopics);
        }
      }
    } catch (e) {
      console.warn('Session restoration notice:', e);
    }
  }, []);

  useEffect(() => {
    try {
      if (step === 'quiz' || step === 'result') {
        sessionStorage.setItem('portal_quiz_state', JSON.stringify({
          step,
          activeQuizQuestions,
          currentQIndex,
          selectedAnswers,
          subjectiveAnswers,
          score,
          studentName,
          selectedCategory,
          selectedTopics,
        }));
      } else if (step === 'dashboard') {
        sessionStorage.removeItem('portal_quiz_state');
      }
    } catch (e) {
      // Storage quota or restriction ignored
    }
  }, [step, activeQuizQuestions, currentQIndex, selectedAnswers, subjectiveAnswers, score, studentName, selectedCategory, selectedTopics]);

  const isTeacher = userProfile?.role === 'teacher';
  const quizData = activeQuizQuestions.length > 0 ? activeQuizQuestions : quizQuestions;

  const saveSubmissionToSupabase = useCallback(
    async (finalScore: number, questionsCount: number) => {
      if (submissionSavedRef.current) return;
      if (!user || userProfile?.role === 'teacher') return;

      submissionSavedRef.current = true;
      const nowISO = new Date().toISOString();

      const payload: StudentSubmissionRecord = {
        submitted_at: nowISO,
        student_name: studentName || userProfile?.full_name || user.email,
        category: selectedCategory,
        score: finalScore,
        total_questions: questionsCount,
        self_rating: selfRating,
      };

      try {
        const { error } = await supabase.from('test_submissions').insert([
          {
            user_id: user.id,
            score: finalScore,
            total_questions: questionsCount,
            submitted_at: nowISO,
            student_name: payload.student_name,
            category: selectedCategory,
            self_rating: selfRating,
            tab_switch_count: 0,
          },
        ]);
        if (error) {
          await supabase.from('test_submissions').insert([
            {
              user_id: user.id,
              score: finalScore,
              total_questions: questionsCount,
              submitted_at: nowISO,
              student_name: payload.student_name,
              category: selectedCategory,
            },
          ]);
        }
        setLastSubmittedAt(nowISO);
        setIsAttemptLocked(true);
        setStudentSubmissions((prev) => [payload, ...prev]);

        // Generate Real-time Session Notifications strictly separated by target role
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        const adminNotif = {
          id: Date.now(),
          type: 'submission',
          targetRole: 'admin',
          title: 'New Student Submission',
          message: `${payload.student_name} has completed their ${selectedCategory} evaluation test successfully!`,
          studentName: payload.student_name,
          category: selectedCategory,
          timestamp: timeStr,
          read: false,
        };

        const genericConfirmationMsg = `Your ${selectedCategory} test has been submitted successfully! Head over to your dashboard to view your detailed performance breakdown and review answers.`;

        const studentNotif = {
          id: Date.now() + 1,
          type: 'submission',
          targetRole: 'student',
          targetUserId: user.id,
          title: 'Evaluation Confirmed',
          message: genericConfirmationMsg,
          studentName: payload.student_name,
          category: selectedCategory,
          timestamp: timeStr,
          read: false,
        };

        setNotifications((prev) => [adminNotif, studentNotif, ...prev]);
        setSubmissionToastMsg(genericConfirmationMsg);
      } catch (err) {
        console.error('Failed to record test submission:', err);
      }
    },
    [user, studentName, userProfile, selectedCategory, selfRating]
  );

  const handleFinalSubmit = useCallback(() => {
    saveSubmissionToSupabase(score, quizData.length);
    try { sessionStorage.removeItem('portal_quiz_state'); } catch (e) {}
    setStep('dashboard');
  }, [saveSubmissionToSupabase, score, quizData]);

  const checkIsAnswerCorrect = (q: any, selected: any) => {
    if (!q || selected === undefined || selected === null) return false;
    if (q.type === 'short_code' || q.type === 'subjective') {
      if (typeof selected === 'string' && typeof q.answer === 'string') {
        const normalize = (str: string) =>
          str
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/["']/g, "'")
            .replace(/;\s*/g, ';')
            .replace(/;$/, '');

        const normSel = normalize(selected);
        const normAns = normalize(q.answer);

        if (normSel === normAns) return true;
        if (normSel.includes(normAns) || normAns.includes(normSel)) return true;

        const keyKeywords = q.answer
          .toLowerCase()
          .split(/[\s;{}<>]+/)
          .filter((k: string) => k.length > 2);
        if (keyKeywords.length > 0 && keyKeywords.every((kw: string) => normSel.includes(kw))) {
          return true;
        }
      }
      return false;
    }
    if (q.type === 'drag_drop' || q.type === 'drag-and-drop') {
      if (typeof selected !== 'object' || selected === null) return false;
      const targetZones = q.dropZones || [];
      if (targetZones.length === 0) return Object.keys(selected).length > 0;

      if (q.answer && typeof q.answer === 'object') {
        const entries = Object.entries(q.answer);
        if (entries.length === 0) return false;
        let correctCount = 0;
        entries.forEach(([zKey, expectedItem]) => {
          if (selected[zKey] === expectedItem || selected[Number(zKey)] === expectedItem) {
            correctCount++;
          } else if (selected[expectedItem as string] === zKey) {
            correctCount++;
          }
        });
        // 4 zones => min 2 correct; 2 or 3 zones => min 1 correct
        const requiredMin = entries.length >= 4 ? 2 : Math.max(1, Math.floor(entries.length / 2));
        return correctCount >= requiredMin;
      }
      if (Array.isArray(q.dragItems) && q.dragItems.length >= targetZones.length) {
        let correctCount = 0;
        targetZones.forEach((_: any, idx: number) => {
          if (selected[idx] === q.dragItems[idx]) correctCount++;
        });
        const requiredMin = targetZones.length >= 4 ? 2 : Math.max(1, Math.floor(targetZones.length / 2));
        return correctCount >= requiredMin;
      }
      const requiredMin = targetZones.length >= 4 ? 2 : Math.max(1, Math.floor(targetZones.length / 2));
      return Object.keys(selected).length >= requiredMin;
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
        const userAns = q.type === 'subjective' || q.type === 'short_code' ? subjectiveAnswers[index] : selectedAnswers[index];
        if (checkIsAnswerCorrect(q, userAns)) {
          finalScore += 1;
        }
      });
      setScore(finalScore);
      saveSubmissionToSupabase(finalScore, quizData.length);
      setStep('result');
    }
  }, [quizData, currentQIndex, selectedAnswers, subjectiveAnswers, saveSubmissionToSupabase]);

  const handleTimeUp = useCallback(() => {
    let finalScore = 0;
    quizData.forEach((q, index) => {
      const userAns = q.type === 'subjective' || q.type === 'short_code' ? subjectiveAnswers[index] : selectedAnswers[index];
      if (checkIsAnswerCorrect(q, userAns)) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    saveSubmissionToSupabase(finalScore, quizData.length);
    setStep('result');
  }, [quizData, selectedAnswers, subjectiveAnswers, saveSubmissionToSupabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setStep('dashboard');
  };

  const handleSelectSubjectFromDashboard = useCallback((subject: string, topics: string[]) => {
    setSelectedCategory(subject);
    setSelectedTopics(topics);
    setStep('start');
  }, []);

  const handleStart = useCallback(async () => {
    try {
      let loadedCategoryQuestions: any[] = [];

      loadedCategoryQuestions = await fetchCategoryQuestions(selectedCategory);

      if (!loadedCategoryQuestions || loadedCategoryQuestions.length === 0) {
        alert('No questions available for the selected subject. Please try again or choose a different subject.');
        return;
      }

      // Strict Topic-Based Question Filtering
      if (selectedTopics && selectedTopics.length > 0) {
        const TOPIC_KEYWORD_MAP: Record<string, string[]> = {
          // HTML
          'HTML Elements & Attributes': ['element', 'attribute', 'tag', 'h1', 'p', 'head', 'body', 'doctype', 'html', 'id', 'class', 'title', 'heading'],
          'Forms & Input Validation': ['form', 'input', 'button', 'label', 'select', 'textarea', 'placeholder', 'required', 'validation', 'submit', 'type', 'value', 'method', 'action'],
          'Semantic Layouts & Headings': ['semantic', 'header', 'footer', 'nav', 'main', 'article', 'section', 'aside', 'heading', 'h1', 'h2', 'h3', 'structure', 'layout'],
          'Tables, Lists & Media': ['table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'img', 'video', 'audio', 'src', 'alt', 'caption', 'list', 'media'],
          'Links, Iframes & Metadata': ['link', 'a', 'href', 'target', 'iframe', 'meta', 'charset', 'viewport', 'head', 'anchor', 'metadata'],

          // CSS
          'Selectors, Specificity & Cascade': ['selector', 'specificity', 'cascade', 'class', 'id', 'pseudo', 'hover', 'active', 'focus', 'element'],
          'Box Model, Margins & Padding': ['box model', 'margin', 'padding', 'border', 'content-box', 'border-box', 'width', 'height', 'box-sizing'],
          'Flexbox Layouts': ['flex', 'flexbox', 'justify-content', 'align-items', 'flex-direction', 'flex-wrap', 'flex-grow'],
          'CSS Grid Systems': ['grid', 'grid-template', 'grid-column', 'gap', 'fr', 'grid-row', 'grid-area'],
          'Colors, Gradients & Typography': ['color', 'background', 'font', 'gradient', 'text-align', 'line-height', 'font-family', 'font-size'],
          'Transitions & Animations': ['transition', 'animation', '@keyframes', 'transform', 'duration', 'ease', 'rotate', 'scale'],

          // JS
          'Variables, Data Types & Operators': ['var', 'let', 'const', 'data type', 'primitive', 'operator', 'typeof', 'string', 'number', 'boolean', 'null', 'undefined', 'remainder', '%'],
          'ES6+ Functions, Arrow & Scope': ['function', 'arrow', 'scope', 'closure', 'default parameter', 'this', 'return', 'block-scoped'],
          'DOM Selection & Event Handling': ['dom', 'querySelector', 'getElementById', 'addEventListener', 'event', 'click', 'target', 'element', 'document'],
          'Arrays, Objects & Destructuring': ['array', 'object', 'destructuring', 'map', 'filter', 'reduce', 'push', 'pop', 'keys', 'values', 'spread', '...'],
          'Async JS, Promises & Fetch API': ['async', 'await', 'promise', 'fetch', 'then', 'catch', 'resolve', 'reject', 'api', 'json'],

          // React
          'JSX Syntax & Rendering Rules': ['jsx', 'rendering', 'element', 'expression', 'fragment', 'react'],
          'Components, Props & State': ['component', 'props', 'state', 'functional', 'parent', 'child', 'children'],
          'useState & useEffect Hooks': ['usestate', 'useeffect', 'hook', 'side effect', 'dependency', 'state update'],
          'Event Handling & Form State': ['onclick', 'onchange', 'onsubmit', 'event', 'controlled', 'uncontrolled', 'handler'],
          'Conditional & List Rendering': ['conditional', 'ternary', '&&', 'map', 'key', 'list', 'render'],

          // Next.js
          'App Router & Routing': ['app router', 'route', 'page', 'layout', 'params', 'searchparams', 'navigation'],
          'Server & Client Components': ['server component', 'client component', 'use client', 'ssr', 'csr', 'rsc'],
          'Data Fetching & Revalidation': ['fetch', 'revalidate', 'cache', 'isr', 'ssg'],
          'API Routes & Server Actions': ['api route', 'route.ts', 'server action', 'post', 'get', 'response'],
          'Metadata & SEO Optimization': ['metadata', 'seo', 'opengraph', 'head', 'generatemetadata'],
        };

        const activeKeywords = selectedTopics.flatMap((t) => TOPIC_KEYWORD_MAP[t] || [t.toLowerCase()]);

        const filteredByTopics = loadedCategoryQuestions.filter((q: any) => {
          const qTopic = (q.topic || q.subtopic || q.category || q.section || '').toLowerCase();
          const qText = (q.q || q.question || q.code || '').toLowerCase();
          const qExpl = (q.explanation || '').toLowerCase();
          const qTags = Array.isArray(q.tags) ? q.tags.map((t: any) => String(t).toLowerCase()) : [];

          const directTitleMatch = selectedTopics.some((t) => {
            const lowT = t.toLowerCase();
            return qTopic.includes(lowT) || lowT.includes(qTopic);
          });

          if (directTitleMatch) return true;

          return activeKeywords.some((kw) => {
            const lowKw = kw.toLowerCase();
            return (
              qTopic.includes(lowKw) ||
              qText.includes(lowKw) ||
              qExpl.includes(lowKw) ||
              qTags.some((tag: string) => tag.includes(lowKw))
            );
          });
        });

        if (filteredByTopics.length > 0) {
          const targetLimit = questionLimit === 'ALL' ? loadedCategoryQuestions.length : Number(questionLimit);
          if (filteredByTopics.length < targetLimit) {
            const remainingPool = loadedCategoryQuestions.filter((q: any) => !filteredByTopics.includes(q));
            const shuffledRemaining = shuffleArray(remainingPool);
            const needed = targetLimit - filteredByTopics.length;
            loadedCategoryQuestions = [...filteredByTopics, ...shuffledRemaining.slice(0, needed)];
          } else {
            loadedCategoryQuestions = filteredByTopics;
          }
        }
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
      console.error('handleStart error:', err);
      alert(err.message || 'Failed to load test questions. Please check your internet connection and try again.');
    }
  }, [selectedCategory, selectedTopics, questionLimit, fetchCategoryQuestions]);

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

  // Filter notifications strictly by recipient role
  const adminNotifications = notifications.filter(
    (n) => n.targetRole === 'admin' || (!n.targetRole && isTeacher)
  );

  const studentNotifications = notifications.filter(
    (n) => (n.targetRole === 'student' && (!n.targetUserId || n.targetUserId === user?.id)) || (!n.targetRole && !isTeacher)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {isTeacher ? (
        <Header
          userProfile={userProfile}
          onSignOut={handleSignOut}
          notifications={adminNotifications}
          onMarkAllRead={handleMarkAllRead}
          onClearNotifications={handleClearNotifications}
        />
      ) : (
        step !== 'dashboard' && (
          <StudentNavbar
            userProfile={userProfile}
            onSignOut={handleSignOut}
            notifications={studentNotifications}
            onMarkAllRead={handleMarkAllRead}
            onClearNotifications={handleClearNotifications}
            inQuiz={true}
          />
        )
      )}

      <main className="flex-1 flex flex-col justify-center items-center w-full">
        {isTeacher ? (
          <TeacherDashboard userProfile={userProfile} />
        ) : (
          <>
            {step === 'dashboard' && (
              <StudentDashboard
                userProfile={userProfile}
                submissions={studentSubmissions}
                onSelectSubject={handleSelectSubjectFromDashboard}
                onSignOut={handleSignOut}
                notifications={studentNotifications}
                onMarkAllRead={handleMarkAllRead}
                onClearNotifications={handleClearNotifications}
                submissionToastMsg={submissionToastMsg}
                onDismissToast={() => setSubmissionToastMsg(null)}
              />
            )}

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
                selectedCategory={selectedCategory}
                selectedTopics={selectedTopics}
                questionLimit={questionLimit}
                setQuestionLimit={setQuestionLimit}
                selfRating={selfRating}
                setSelfRating={setSelfRating}
                onStart={handleStart}
                onStartQuiz={handleStart}
                onBackToDashboard={() => setStep('dashboard')}
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