'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import MonacoEditorContainer from './MonacoEditorContainer';
import {
  Code2,
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  CheckCircle2,
  Play,
  Terminal,
  Trash2,
  PlayCircle,
  X
} from 'lucide-react';

const BADGE_STYLES = {
  HTML: 'text-orange-400 bg-orange-500/10 border border-orange-500/30',
  CSS: 'text-blue-400 bg-blue-500/10 border border-blue-500/30',
  JS: 'text-amber-400 bg-amber-500/10 border border-amber-500/30',
  React: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30',
  'Next.js': 'text-slate-300 bg-slate-800 border border-slate-700',
  DEFAULT: 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30',
};

const getSectionBadgeStyle = (section) => BADGE_STYLES[section] || BADGE_STYLES.DEFAULT;

// ==========================================
// ISOLATED TIMER COMPONENT (PREVENTS PAGE LAG)
// ==========================================
const TimerBadge = memo(function TimerBadge({ totalQuestions, onTimeUp }) {
  const SECONDS_PER_QUESTION = 110;
  const calculatedTotalTime = useMemo(
    () => (totalQuestions || 1) * SECONDS_PER_QUESTION,
    [totalQuestions]
  );

  const [timeLeft, setTimeLeft] = useState(calculatedTotalTime);
  const timerRef = useRef(null);

  useEffect(() => {
    if (totalQuestions) {
      setTimeLeft(totalQuestions * SECONDS_PER_QUESTION);
    }
  }, [totalQuestions]);

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
  }, [onTimeUp]);

  const formatTime = useCallback((seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }, []);

  const isTimeLow = timeLeft <= 300;

  return (
    <div className={`flex items-center gap-2 font-mono text-sm font-bold px-3.5 py-1.5 rounded-xl border transition-all gpu-accelerated ${isTimeLow
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 animate-pulse'
        : 'bg-slate-800/80 text-slate-200 border-slate-700/80'
      }`}>
      <span>⏱️</span>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
});

// ==========================================
// MEMOIZED OPTION BUTTON COMPONENT
// ==========================================
const OptionButton = memo(function OptionButton({
  optionKey,
  optionValue,
  isSelected,
  isLocked,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(optionKey)}
      disabled={isLocked}
      className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer gpu-accelerated ${isSelected
          ? 'border-indigo-500 bg-indigo-500/15 font-semibold text-white ring-2 ring-indigo-500/30 shadow-md'
          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:border-slate-700'
        }`}
    >
      <span
        className={`w-6 h-6 rounded-lg border text-xs font-extrabold flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
            ? 'bg-indigo-600 text-white border-indigo-500'
            : 'border-slate-700 text-slate-400 bg-slate-800/60'
          }`}
      >
        {optionKey}
      </span>
      <span className="text-xs lg:text-sm font-medium">{optionValue}</span>
    </button>
  );
});

// ==========================================
// ULTRA-COMPACT SCROLL-FREE DRAG & DROP MATCHER UI
// ==========================================
const DragDropMatcher = memo(function DragDropMatcher({
  dropZones = [],
  dragItems = [],
  matchingMapping = {},
  activeDragItem,
  isLocked,
  onMatchZone,
  onUnmatchZone,
  onSelectActiveItem,
}) {
  return (
    <div className="w-full space-y-3 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-3.5 sm:p-4 rounded-2xl shadow-xl gpu-accelerated">
      {/* Top Banner / Instruction Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-indigo-400 font-bold flex items-center gap-1">
            <span>🎯</span> Instructions:
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Drag option into matching target zone or click option first then click target box.
          </span>
          <span className="text-slate-400 text-[11px] sm:hidden">
            Click option then click target.
          </span>
        </div>

        {activeDragItem && (
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold animate-pulse">
            <span>Selected: "{activeDragItem}"</span>
            <button
              type="button"
              onClick={() => onSelectActiveItem(null)}
              className="text-emerald-400 hover:text-white ml-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Screen-Fitting Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        {/* Left Column: Target Zones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              🎯 Target Matching Zones ({dropZones.length})
            </span>
          </div>

          <div className="space-y-2">
            {dropZones.map((zone, idx) => {
              const matchedItem = matchingMapping[idx];

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const item = e.dataTransfer.getData('text/plain');
                    if (item) onMatchZone(idx, item);
                  }}
                  onClick={() => {
                    if (activeDragItem) {
                      onMatchZone(idx, activeDragItem);
                    }
                  }}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${matchedItem
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow'
                      : activeDragItem
                        ? 'bg-slate-900 border-indigo-400/80 ring-2 ring-indigo-500/30 cursor-pointer animate-pulse'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-white truncate" title={zone}>
                      {zone}
                    </span>
                  </div>

                  <div className="flex-shrink-0 min-w-[130px] max-w-[180px]">
                    {matchedItem ? (
                      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-mono text-xs font-bold shadow">
                        <span className="truncate">{matchedItem}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnmatchZone(idx);
                          }}
                          className="p-0.5 hover:bg-white/20 rounded text-white cursor-pointer flex-shrink-0"
                          title="Remove match"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-2.5 py-1 rounded-lg border border-dashed flex items-center justify-center text-[11px] font-mono font-medium transition-all ${activeDragItem
                            ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 cursor-pointer'
                            : 'border-slate-800 text-slate-500'
                          }`}
                      >
                        {activeDragItem ? '👉 Click to Place' : 'Drop / Click'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Options Pool */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              📦 Available Options ({dragItems.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl min-h-[140px] items-start align-content-start">
            {dragItems.map((item, idx) => {
              const isPlaced = Object.values(matchingMapping).includes(item);
              const isActive = activeDragItem === item;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isLocked || isPlaced}
                  draggable={!isLocked && !isPlaced}
                  onDragStart={(e) => {
                    if (isLocked || isPlaced) return;
                    e.dataTransfer.setData('text/plain', item);
                  }}
                  onClick={() => {
                    if (isPlaced) return;
                    onSelectActiveItem(isActive ? null : item);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all border flex items-center gap-1.5 cursor-grab active:cursor-grabbing ${isPlaced
                      ? 'bg-slate-900/40 text-slate-600 border-slate-800/80 line-through opacity-40 cursor-not-allowed'
                      : isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 ring-2 ring-emerald-500/40 shadow'
                        : 'bg-slate-900 text-indigo-300 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 hover:text-white'
                    }`}
                >
                  <span>{item}</span>
                  {isPlaced && <span className="text-[9px] text-slate-500">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

function QuizScreen({
  currentQuestion,
  totalQuestions,
  currentIndex,
  selectedAnswer,
  subjectiveAnswer,
  onSelectOption,
  onSubjectiveAnswer,
  onNext,
  onTimeUp,
  isLocked = false,
}) {
  if (!currentQuestion) {
    return (
      <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex items-center justify-center">
        <p className="text-indigo-400 font-mono animate-pulse">Loading question...</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('split');
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [formattedToast, setFormattedToast] = useState(false);

  // Drag Drop Matching active item selection state
  const [activeDragItem, setActiveDragItem] = useState(null);

  // Real-time Live JS Compiler State
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [lastExecutionTime, setLastExecutionTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Debounced iframe srcDoc state for HTML / CSS Live Preview (min 600ms debounce)
  const [debouncedSrcDoc, setDebouncedSrcDoc] = useState('');

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const codeRef = useRef(subjectiveAnswer || currentQuestion?.starterCode || '');

  // Question Type & Section Flags (Memoized to prevent forced layout reflows)
  const isSubjective = useMemo(
    () => currentQuestion?.type === 'subjective' || currentQuestion?.type === 'short_code',
    [currentQuestion?.type]
  );

  const isDragDropMatching = useMemo(
    () => currentQuestion?.type === 'drag_drop' || Boolean(currentQuestion?.dragItems && currentQuestion?.dropZones),
    [currentQuestion?.type, currentQuestion?.dragItems, currentQuestion?.dropZones]
  );

  const isDragAndDropFillBlank = useMemo(
    () => (currentQuestion?.type === 'drag-and-drop') || (Boolean(currentQuestion?.options) && (currentQuestion?.q?.includes('[BLANK]') || currentQuestion?.code?.includes('[BLANK]'))),
    [currentQuestion?.type, currentQuestion?.options, currentQuestion?.q, currentQuestion?.code]
  );

  const isStandardQuiz = useMemo(
    () => !isSubjective && !isDragDropMatching && !isDragAndDropFillBlank,
    [isSubjective, isDragDropMatching, isDragAndDropFillBlank]
  );

  // FIX 2: Helper function to generate clean white (#ffffff) iframe preview source
  const getPreviewSource = useCallback((userCode = '', section = 'JS') => {
    const code = userCode || '';

    if (section === 'HTML') {
      return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 12px; background: #ffffff; }
    </style>
  </head>
  <body>
    ${code}
  </body>
</html>`;
    }

    if (section === 'CSS') {
      return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 12px; background: #ffffff; }
      ${code}
    </style>
  </head>
  <body></body>
</html>`;
    }

    // JS section preview wrapper
    return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 12px; background: #ffffff; 
             font-family: monospace; font-size: 13px; color: #111; }
    </style>
  </head>
  <body>
    <div id="out"></div>
    <script>
      console.log = (...args) => {
        const out = document.getElementById('out');
        if (out) out.innerHTML += args.join(' ') + '<br>';
      };
      ${code}
    </script>
  </body>
</html>`;
  }, []);

  // ISSUE 1: Section check (HTML/CSS vs JS)
  const isJsSection = useMemo(() => {
    const section = currentQuestion?.section;
    if (section === 'HTML' || section === 'CSS') return false;
    return true; // Default to JS Console for JS / unspecified sections
  }, [currentQuestion?.section]);

  // FIX 2: Debounce iframe srcDoc updates by 600ms minimum for clean preview
  useEffect(() => {
    if (isJsSection) return;

    const timer = setTimeout(() => {
      const rawCode = subjectiveAnswer || codeRef.current || currentQuestion?.starterCode || '';
      const section = currentQuestion?.section || 'JS';
      setDebouncedSrcDoc(getPreviewSource(rawCode, section));
    }, 600);

    return () => clearTimeout(timer);
  }, [subjectiveAnswer, currentQuestion, isJsSection, getPreviewSource]);

  useEffect(() => {
    setActiveTab('split');
    setActiveDragItem(null);
    codeRef.current = subjectiveAnswer || currentQuestion?.starterCode || '';
  }, [currentIndex, currentQuestion, subjectiveAnswer]);

  const formatArg = useCallback((arg) => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;
    if (typeof arg === 'symbol') return arg.toString();
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }, []);

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    const userCode = codeRef.current || editorRef.current?.getValue() || '';
    const section = currentQuestion?.section;

    const newLogs = [];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const startTime = performance.now();

    if (section === 'CSS' || section === 'HTML') {
      const duration = (performance.now() - startTime).toFixed(2);
      setLastExecutionTime(duration);
      setConsoleLogs([
        {
          type: 'info',
          message: `Live preview refreshed for ${section}.`,
          time: timestamp,
        },
      ]);
      setTimeout(() => setIsRunning(false), 150);
      return;
    }

    const customConsole = {
      log: (...args) => newLogs.push({ type: 'log', message: args.map(formatArg).join(' '), time: timestamp }),
      info: (...args) => newLogs.push({ type: 'info', message: args.map(formatArg).join(' '), time: timestamp }),
      warn: (...args) => newLogs.push({ type: 'warn', message: args.map(formatArg).join(' '), time: timestamp }),
      error: (...args) => newLogs.push({ type: 'error', message: args.map(formatArg).join(' '), time: timestamp }),
      table: (...args) => newLogs.push({ type: 'log', message: args.map(formatArg).join(' '), time: timestamp }),
    };

    try {
      const runFn = new Function('console', 'window', 'document', 'alert', 'prompt', `
        "use strict";
        ${userCode}
      `);

      const returnVal = runFn(
        customConsole,
        undefined,
        undefined,
        (msg) => customConsole.info('Alert:', msg),
        (msg) => customConsole.info('Prompt:', msg)
      );

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      setLastExecutionTime(duration);

      if (returnVal !== undefined && newLogs.length === 0) {
        newLogs.push({
          type: 'result',
          message: `Return Value: ${formatArg(returnVal)}`,
          time: timestamp,
        });
      } else if (newLogs.length === 0) {
        newLogs.push({
          type: 'info',
          message: 'Code executed successfully (no output printed to console).',
          time: timestamp,
        });
      }

      setConsoleLogs(newLogs);
    } catch (err) {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      setLastExecutionTime(duration);
      setConsoleLogs([
        ...newLogs,
        {
          type: 'error',
          message: `${err.name || 'RuntimeError'}: ${err.message}`,
          time: timestamp,
        },
      ]);
    } finally {
      setTimeout(() => setIsRunning(false), 150);
    }
  }, [currentQuestion, formatArg]);

  const handleFormatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      setFormattedToast(true);
      setTimeout(() => setFormattedToast(false), 2000);
    }
  }, []);

  const handleResetCode = useCallback(() => {
    if (confirm('Are you sure you want to reset your code?')) {
      const resetVal = currentQuestion?.starterCode || '';
      codeRef.current = resetVal;
      if (editorRef.current) {
        editorRef.current.setValue(resetVal);
      }
      onSubjectiveAnswer(resetVal);
      setConsoleLogs([]);
      setLastExecutionTime(null);
    }
  }, [currentQuestion, onSubjectiveAnswer]);

  const progressPercentage = useMemo(
    () => (currentIndex / totalQuestions) * 100,
    [currentIndex, totalQuestions]
  );

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const renderedBlankCode = useMemo(() => {
    if (!currentQuestion || (!currentQuestion.code && !currentQuestion.q)) return null;
    const text = currentQuestion.code || currentQuestion.q;
    const parts = text.split('[BLANK]');

    const handleDrop = (e) => {
      if (isLocked) return;
      e.preventDefault();
      const option = e.dataTransfer.getData('text/plain');
      if (option) {
        onSelectOption(option);
      }
    };

    const handleDragOver = (e) => {
      if (isLocked) return;
      e.preventDefault();
    };

    const handleBlankClick = () => {
      if (isLocked) return;
      if (selectedAnswer) {
        onSelectOption('');
      }
    };

    return (
      <div className="inline-flex flex-wrap items-center leading-relaxed font-mono text-sm text-slate-300">
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <span key={index} className="inline-flex items-center flex-wrap">
              <span className="text-slate-300 break-all">{part}</span>
              {!isLast && (
                <span
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleBlankClick}
                  className={`inline-flex items-center justify-center min-w-[140px] h-[32px] px-3 mx-1 rounded-lg font-mono text-xs font-bold border-2 border-dashed transition-all whitespace-nowrap gpu-accelerated
                    ${!selectedAnswer
                      ? 'bg-slate-900/60 border-indigo-500/50 text-indigo-400 cursor-pointer hover:border-indigo-400 hover:bg-slate-900/80 animate-pulse'
                      : 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/50 cursor-default'
                    }`}
                >
                  {selectedAnswer ? selectedAnswer : 'Drop / Click here 🎯'}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  }, [currentQuestion, selectedAnswer, isLocked, onSelectOption]);

  const formattedOptions = useMemo(() => {
    if (!currentQuestion?.options) return {};
    if (Array.isArray(currentQuestion.options)) {
      return currentQuestion.options.reduce((acc, opt, idx) => {
        const key = String.fromCharCode(65 + idx);
        acc[key] = opt;
        return acc;
      }, {});
    }
    return currentQuestion.options;
  }, [currentQuestion?.options]);

  const matchingMapping = useMemo(() => {
    if (typeof selectedAnswer === 'object' && selectedAnswer !== null) {
      return selectedAnswer;
    }
    if (typeof selectedAnswer === 'string' && selectedAnswer.startsWith('{')) {
      try {
        return JSON.parse(selectedAnswer);
      } catch (e) {
        return {};
      }
    }
    return {};
  }, [selectedAnswer]);

  const handleMatchZone = useCallback((zoneIdx, item) => {
    if (isLocked) return;
    onSelectOption({ ...matchingMapping, [zoneIdx]: item });
    setActiveDragItem(null);
  }, [isLocked, matchingMapping, onSelectOption]);

  const handleUnmatchZone = useCallback((zoneIdx) => {
    if (isLocked) return;
    const newMapping = { ...matchingMapping };
    delete newMapping[zoneIdx];
    onSelectOption(newMapping);
  }, [isLocked, matchingMapping, onSelectOption]);

  const handleNextClick = useCallback(() => {
    if (isSubjective) {
      const currentCode = codeRef.current || editorRef.current?.getValue() || '';
      onSubjectiveAnswer(currentCode);
    }
    onNext();
  }, [isSubjective, onSubjectiveAnswer, onNext]);

  const questionId = useMemo(
    () => currentQuestion?.id || currentIndex,
    [currentQuestion?.id, currentIndex]
  );

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 p-3 lg:p-6 flex flex-col justify-center items-center overflow-hidden">
      <div className="w-full max-w-[1100px] h-[92vh] max-h-[780px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 lg:p-6 shadow-2xl relative backdrop-blur-xl flex flex-col justify-between overflow-hidden gpu-accelerated">

        {/* HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Question {currentIndex + 1} of {totalQuestions}
            </span>

            {currentQuestion?.section && (
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${getSectionBadgeStyle(currentQuestion.section)}`}>
                {currentQuestion.section}
              </span>
            )}

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-bold border border-slate-700">
              {currentQuestion?.type || 'quiz'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* ISOLATED TIMER */}
            <TimerBadge totalQuestions={totalQuestions} onTimeUp={onTimeUp} />
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden my-2.5">
          <div
            className="bg-indigo-500 h-full transition-all duration-300 ease-out rounded-full gpu-accelerated"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* QUESTION CONTENT CONTAINER */}
        <div className={`flex-1 ${isDragDropMatching ? 'flex flex-col justify-start overflow-hidden my-1 space-y-2' : 'overflow-y-auto my-2 pr-1 space-y-4'}`}>
          <div className="space-y-1">
            <h2 className="text-sm lg:text-base font-bold text-white leading-relaxed">
              {currentQuestion?.q}
            </h2>

            {/* Coding snippets for standard quiz questions */}
            {currentQuestion?.code && !isDragAndDropFillBlank && !isSubjective && !isDragDropMatching && (
              <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto">
                <code>{currentQuestion.code}</code>
              </pre>
            )}
          </div>

          {/* 1. DRAG AND DROP MATCHING (`drag_drop`) */}
          {isDragDropMatching && (
            <DragDropMatcher
              dropZones={currentQuestion.dropZones || []}
              dragItems={currentQuestion.dragItems || []}
              matchingMapping={matchingMapping}
              activeDragItem={activeDragItem}
              isLocked={isLocked}
              onMatchZone={handleMatchZone}
              onUnmatchZone={handleUnmatchZone}
              onSelectActiveItem={setActiveDragItem}
            />
          )}

          {/* 2. DRAG AND DROP FILL-IN-THE-BLANK QUESTION TYPE (`drag-and-drop`) */}
          {isDragAndDropFillBlank && !isDragDropMatching && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl gpu-accelerated">
              <div className="text-xs text-slate-400 font-medium">
                💡 <span className="text-indigo-300 font-bold">Instruction:</span> Drag an option block or click on an option below to insert it into the snippet.
              </div>

              {renderedBlankCode}

              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Available Code Snippets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {formattedOptions && Object.entries(formattedOptions).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      draggable={!isLocked}
                      onDragStart={(e) => {
                        if (isLocked) return;
                        e.dataTransfer.setData('text/plain', val);
                      }}
                      onClick={() => onSelectOption(val)}
                      className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-grab active:cursor-grabbing border gpu-accelerated ${selectedAnswer === val
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50'
                          : 'bg-slate-900 text-indigo-300 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850'
                        }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. MULTIPLE CHOICE OPTIONS (`quiz` / `mcq` / Standard) */}
          {isStandardQuiz && formattedOptions && Object.keys(formattedOptions).length > 0 && (
            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(formattedOptions).map(([key, value]) => (
                <OptionButton
                  key={key}
                  optionKey={key}
                  optionValue={value}
                  isSelected={selectedAnswer === key}
                  isLocked={isLocked}
                  onSelect={onSelectOption}
                />
              ))}
            </div>
          )}

          {/* 4. SUBJECTIVE CODING / MONACO EDITOR SECTION (`short_code` / `subjective`) */}
          {isSubjective && (
            <div className={`space-y-2 flex flex-col flex-1 min-h-0 ${isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 border border-indigo-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl' : ''}`}>
              {/* Editor Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium px-2 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                {/* ISSUE 1: Dynamic Tab Selectors reflecting JS Console Output vs HTML/CSS Live Preview */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('split')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${activeTab === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Side-by-Side Split View"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    title="Code Editor Only"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    title={isJsSection ? "JS Execution Console" : "HTML/CSS Live Preview"}
                  >
                    {isJsSection ? <Terminal className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isJsSection ? 'Console Output' : 'Live Preview'}</span>
                  </button>
                </div>

                {/* Editor Action Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer text-xs active:scale-95 disabled:opacity-50"
                    title="Run Code (Ctrl+Enter or Ctrl+S)"
                  >
                    <Play className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>

                  {formattedToast && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 animate-fadeIn">
                      <CheckCircle2 className="w-3 h-3" /> Formatted!
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleFormatCode}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 rounded-lg border border-slate-800 transition-all font-semibold cursor-pointer"
                    title="Auto Format Code (Alt+Shift+F)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Format</span>
                  </button>

                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => setEditorFontSize(prev => Math.max(11, prev - 1))}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Decrease Font Size"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1 text-indigo-400">{editorFontSize}px</span>
                    <button
                      type="button"
                      onClick={() => setEditorFontSize(prev => Math.min(20, prev + 1))}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Increase Font Size"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-all cursor-pointer"
                    title="Reset Code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg border border-slate-800 transition-all cursor-pointer"
                    title="Editor & Emmet Shortcuts"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-all cursor-pointer"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Workspace"}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Shortcuts & Emmet Helper Banner */}
              {showShortcuts && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 space-y-2 animate-fadeIn shadow-xl">
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      ⚡ Monaco & Emmet Keyboard Shortcuts
                    </span>
                    <button type="button" onClick={() => setShowShortcuts(false)} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">Dismiss</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold">! + Enter / Tab</span>
                      <p className="text-slate-400 text-[10px]">HTML5 Boilerplate</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold">.classname + Enter / Tab</span>
                      <p className="text-slate-400 text-[10px]">&lt;div class="classname"&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold">tag + Enter / Tab</span>
                      <p className="text-slate-400 text-[10px]">&lt;tag&gt;&lt;/tag&gt; (p, h1, sec)</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold">tag.class + Enter / Tab</span>
                      <p className="text-slate-400 text-[10px]">&lt;tag class="class"&gt;</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Code & Preview Main Display Container */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[280px]">
                {(activeTab === 'split' || activeTab === 'code') && (
                  <div className={`flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${activeTab === 'code' ? 'lg:col-span-2' : ''}`}>
                    <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
                      <span>Code Workspace ({currentQuestion?.section || 'JS'})</span>
                      <span>Monaco Editor + Emmet</span>
                    </div>
                    <div className="flex-1 relative min-h-[220px]">
                      <MonacoEditorContainer
                        language={currentQuestion?.section === 'CSS' ? 'css' : currentQuestion?.section === 'HTML' ? 'html' : 'javascript'}
                        theme="vs-dark"
                        initialValue={subjectiveAnswer || currentQuestion?.starterCode || ''}
                        fontSize={editorFontSize}
                        onChange={onSubjectiveAnswer}
                        onRunCode={handleRunCode}
                        editorRef={editorRef}
                        monacoRef={monacoRef}
                        codeRef={codeRef}
                        questionId={questionId}
                      />
                    </div>
                  </div>
                )}

                {(activeTab === 'split' || activeTab === 'preview') && (
                  <div className={`flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${activeTab === 'preview' ? 'lg:col-span-2' : ''}`}>
                    {/* ISSUE 1: CONDITIONAL OUTPUT DISPLAY (JS Console vs HTML/CSS Live Preview) */}
                    {isJsSection ? (
                      /* JS SECTION CONSOLE PANEL */
                      <>
                        <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-white">Live Console / Execution Output</span>
                            {lastExecutionTime !== null && (
                              <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                                ⚡ {lastExecutionTime}ms
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                              ● Sandbox Ready
                            </span>
                            <button
                              type="button"
                              onClick={() => { setConsoleLogs([]); setLastExecutionTime(null); }}
                              className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Clear Output Console"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 p-3 bg-slate-950 font-mono text-xs overflow-y-auto space-y-2 max-h-[350px]">
                          {consoleLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 space-y-2">
                              <PlayCircle className="w-8 h-8 text-slate-700 animate-pulse" />
                              <p className="text-xs font-medium">Console output is ready.</p>
                              <p className="text-[11px] text-slate-600">
                                Click <span className="text-emerald-400 font-bold">'Run Code'</span> or press <span className="text-indigo-400 font-bold">Ctrl+S / Ctrl+Enter</span> to execute your code.
                              </p>
                            </div>
                          ) : (
                            consoleLogs.map((log, idx) => {
                              const isError = log.type === 'error';
                              const isWarn = log.type === 'warn';
                              const isResult = log.type === 'result';
                              const isInfo = log.type === 'info';

                              return (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${isError
                                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                      : isWarn
                                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                        : isResult
                                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                          : isInfo
                                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                                            : 'bg-slate-900/80 border-slate-800 text-slate-200'
                                    }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                                    <span className="uppercase tracking-wider font-extrabold">
                                      [{log.type}]
                                    </span>
                                    <span>{log.time}</span>
                                  </div>
                                  <pre className="whitespace-pre-wrap word-break break-all font-mono">
                                    {log.message}
                                  </pre>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    ) : (
                      /* HTML / CSS LIVE IFRAME PREVIEW PANEL */
                      <>
                        <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-white">Live {currentQuestion?.section || 'HTML/CSS'} Render Preview</span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded">
                            ● 600ms Debounced
                          </span>
                        </div>

                        <div className="flex-1 bg-slate-950 overflow-hidden relative">
                          <iframe
                            title="Live Code Preview"
                            srcDoc={debouncedSrcDoc}
                            className="w-full h-full border-0 bg-slate-950"
                            sandbox="allow-scripts"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
          <div className="text-xs text-slate-400">
            {isSubjective ? (
              <span className="text-indigo-400 font-medium">💡 Press Ctrl+S or Ctrl+Enter to execute JS code</span>
            ) : isDragDropMatching ? (
              <span className="text-indigo-400 font-medium">🎯 Match items from the pool with target zones above</span>
            ) : isDragAndDropFillBlank ? (
              <span className="text-indigo-400 font-medium">🎯 Drop or click the code block to fill the blank</span>
            ) : (
              <span>Select the correct option to proceed</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextClick}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs lg:text-sm rounded-xl transition-all shadow-lg shadow-indigo-900/40 active:scale-95 cursor-pointer gpu-accelerated"
          >
            {isLastQuestion ? 'Submit Assessment' : 'Next Question →'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default memo(QuizScreen);