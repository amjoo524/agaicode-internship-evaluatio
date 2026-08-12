'use client';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
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
  CheckCircle2
} from 'lucide-react';

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
  } catch (e) {
    console.error("Audio Context error:", e);
  }
};

const WARNING_MESSAGES = [
  "⚠️ Warning 1/5: Please focus on the test window and avoid switching tabs.",
  "⚠️ Warning 2/5: Tab switching is monitored, please stay on screen.",
  "⚠️ Warning 3/5: Be careful, you are getting closer to the warning limit.",
  "⚠️ Warning 4/5: Second last warning! Please stay focused on the test.",
  "🚨 Final Warning (5/5): One more switch and your test will be auto-submitted!"
];

// Tags that never need a closing pair (self-closing / void elements)
const VOID_TAGS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
];

const HTML_KNOWN_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button',
  'ul', 'ol', 'li', 'form', 'input', 'label', 'textarea', 'select', 'option',
  'img', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'code', 'pre', 'b', 'i',
  'strong', 'em', 'small', 'mark', 'hr', 'br', 'canvas', 'svg', 'audio', 'video'
]);

const parseEmmetSingle = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const emmetRegex = /^([a-zA-Z0-9-]*)(?:#([a-zA-Z0-9-_]+))?((?:\.[a-zA-Z0-9-_]+)+)?$/;
  const match = trimmed.match(emmetRegex);
  if (!match) return null;

  let [, tagName, idName, rawClasses] = match;

  if (!tagName && (idName || rawClasses)) {
    tagName = 'div';
  }

  if (!tagName) return null;

  const lowerTag = tagName.toLowerCase();
  const hasMeta = Boolean(idName || rawClasses);

  if (!hasMeta && !HTML_KNOWN_TAGS.has(lowerTag)) {
    return null;
  }

  let classes = [];
  if (rawClasses) {
    classes = rawClasses.split('.').filter(Boolean);
  }

  let attrs = [];
  if (idName) attrs.push(`id="${idName}"`);
  if (classes.length > 0) attrs.push(`class="${classes.join(' ')}"`);

  if (lowerTag === 'a' && !attrs.some(a => a.startsWith('href'))) {
    attrs.push('href="#"');
  } else if (lowerTag === 'img' && !attrs.some(a => a.startsWith('src'))) {
    attrs.push('src="" alt=""');
  } else if (lowerTag === 'input' && !attrs.some(a => a.startsWith('type'))) {
    attrs.push('type="text"');
  } else if (lowerTag === 'form' && !attrs.some(a => a.startsWith('action'))) {
    attrs.push('action=""');
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  const isVoid = VOID_TAGS.includes(lowerTag);
  const openTag = `${lowerTag}${attrStr}`;

  return {
    tagName: lowerTag,
    openTag,
    isVoid,
    code: isVoid ? `<${openTag} />` : `<${openTag}></${lowerTag}>`,
    cursorOffset: isVoid ? `<${openTag} />`.length : `<${openTag}>`.length
  };
};

const parseEmmetAbbr = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed === '!') {
    const code = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`;
    return { code, cursorLineOffset: 7, cursorCol: 3, isSnippet: true };
  }

  const childMatch = trimmed.match(/^([a-zA-Z0-9.#-_]+)>([a-zA-Z0-9.#-_]+)$/);
  if (childMatch) {
    const parentParsed = parseEmmetSingle(childMatch[1]);
    const childParsed = parseEmmetSingle(childMatch[2]);
    if (parentParsed && childParsed) {
      const code = `<${parentParsed.openTag}>\n  ${childParsed.code}\n</${parentParsed.tagName}>`;
      return {
        code,
        cursorLineOffset: 1,
        cursorCol: 3 + childParsed.cursorOffset,
        isSnippet: true
      };
    }
  }

  const single = parseEmmetSingle(trimmed);
  if (!single) return null;
  return {
    code: single.code,
    cursorLineOffset: 0,
    cursorCol: single.cursorOffset,
    isSnippet: false
  };
};

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
  maxWarnings = 5,
}) {
  const SECONDS_PER_QUESTION = 110; 
  const calculatedTotalTime = (totalQuestions || 1) * SECONDS_PER_QUESTION;

  const [timeLeft, setTimeLeft] = useState(calculatedTotalTime);
  const [latestWarningText, setLatestWarningText] = useState('');
  const [activeTab, setActiveTab] = useState('split'); 
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [formattedToast, setFormattedToast] = useState(false);

  const timerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (totalQuestions) {
      setTimeLeft(totalQuestions * SECONDS_PER_QUESTION);
    }
  }, [totalQuestions]);

  useEffect(() => {
    setActiveTab('split');
  }, [currentIndex]);

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      setFormattedToast(true);
      setTimeout(() => setFormattedToast(false), 2000);
    }
  };

  const handleResetCode = () => {
    if (confirm('Are you sure you want to clear your code?')) {
      onSubjectiveAnswer('');
    }
  };

  const progressPercentage = (currentIndex / totalQuestions) * 100;
  const isSubjective = currentQuestion?.type === 'subjective';
  const isDragAndDrop = currentQuestion?.type === 'drag-and-drop';
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isTimeLow = timeLeft <= 300; 

  const renderCodeWithBlank = () => {
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

    const DropZone = () => (
      <span
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBlankClick}
        className={`inline-flex items-center justify-center min-w-[140px] h-[32px] px-3 mx-1 rounded-lg font-mono text-xs font-bold border-2 border-dashed transition-all whitespace-nowrap
          ${!selectedAnswer
            ? 'bg-slate-900/60 border-indigo-500/50 text-indigo-400 cursor-pointer hover:border-indigo-400 hover:bg-slate-900/80 animate-pulse'
            : 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/50 cursor-default'
          }`}
      >
        {selectedAnswer ? selectedAnswer : 'Drop / Click here 🎯'}
      </span>
    );

    return (
      <div className="inline-flex flex-wrap items-center leading-relaxed font-mono text-sm text-slate-300">
        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;
          return (
            <span key={index} className="inline-flex items-center flex-wrap">
              <span className="text-slate-300 break-all">{part}</span>
              {!isLast && <DropZone />}
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
    if (tabSwitchCount > 0 && tabSwitchCount <= maxWarnings) {
      const idx = Math.min(tabSwitchCount - 1, WARNING_MESSAGES.length - 1);
      setLatestWarningText(WARNING_MESSAGES[idx]);
      if (tabSwitchCount > 1) {
        playAlarmSound();
      }
    }
  }, [tabSwitchCount, maxWarnings]);

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

  const getPreviewSource = () => {
    const userCode = subjectiveAnswer || '';
    const section = currentQuestion?.section;

    if (section === 'CSS') {
      return `
        <!DOCTYPE html>
        <html>
          <head><style>${userCode}</style></head>
          <body style="background:#ffffff; color:#111827; padding:16px; font-family:sans-serif;">
            <div class="preview-container">
              <h3 style="margin-top:0; color:#4f46e5; font-size:15px; font-weight:bold;">CSS Live Preview Output</h3>
              <p style="color:#4b5563; font-size:13px;">This sample element tests your CSS styles (classes, colors, margins, fonts):</p>
              <div class="box" style="padding:12px; border:2px dashed #6366f1; border-radius:8px; margin-top:10px;">Sample Box Element (.box)</div>
              <button class="btn" style="margin-top:10px; padding:6px 12px; background:#6366f1; color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Sample Button (.btn)</button>
            </div>
          </body>
        </html>
      `;
    } else if (section === 'HTML') {
      return `
        <!DOCTYPE html>
        <html>
          <head><style>body { background:#ffffff; color:#111827; padding:16px; font-family:sans-serif; line-height:1.5; }</style></head>
          <body>${userCode}</body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { background:#090d16; color:#f8fafc; padding:14px; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:12px; margin:0; }
              .log-entry { margin-bottom: 6px; padding: 6px 10px; border-radius: 6px; border-left: 3px solid #6366f1; background: rgba(30, 41, 59, 0.6); }
              .log-warn { border-left-color: #f59e0b; color: #fbbf24; background: rgba(245, 158, 11, 0.15); }
              .log-error { border-left-color: #ef4444; color: #f87171; background: rgba(239, 68, 68, 0.15); }
              .log-info { border-left-color: #3b82f6; color: #60a5fa; }
              pre { margin:0; white-space: pre-wrap; word-break: break-word; }
            </style>
          </head>
          <body>
            <div style="font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; margin-bottom:10px; display:flex; justify-content:space-between; border-b: 1px solid #1e293b; padding-bottom:6px;">
              <span>⚡ Console Output</span>
              <span>JS Sandbox</span>
            </div>
            <div id="console-output"></div>
            <script>
              const outputContainer = document.getElementById('console-output');
              const formatArg = (arg) => {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
                }
                return String(arg);
              };
              const appendLog = (args, type = 'log') => {
                const div = document.createElement('div');
                div.className = 'log-entry log-' + type;
                const pre = document.createElement('pre');
                pre.textContent = args.map(formatArg).join(' ');
                div.appendChild(pre);
                outputContainer.appendChild(div);
              };
              console.log = (...args) => appendLog(args, 'log');
              console.info = (...args) => appendLog(args, 'info');
              console.warn = (...args) => appendLog(args, 'warn');
              console.error = (...args) => appendLog(args, 'error');
              
              try {
                ${userCode}
              } catch(err) {
                appendLog(['Runtime Error:', err.message], 'error');
              }
            </script>
          </body>
        </html>
      `;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 p-3 lg:p-6 flex flex-col justify-center items-center overflow-hidden">
      <div className="w-full max-w-[1100px] h-[92vh] max-h-[780px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 lg:p-7 shadow-2xl relative backdrop-blur-xl flex flex-col justify-between">

        <div className="flex-shrink-0">
          {tabSwitchCount > 0 && (
            <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-amber-400 text-xs lg:text-sm font-bold">
                  {latestWarningText} <span className="text-slate-400 font-normal">({tabSwitchCount}/{maxWarnings})</span>
                </p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: maxWarnings }).map((_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < tabSwitchCount ? 'bg-amber-500' : 'bg-slate-800'}`} />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} <span className="text-slate-600">/</span> {totalQuestions}
            </span>

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
              🛡️ Flexible Session
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-1.5 rounded-full mb-3 overflow-hidden p-0.5">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${getSectionBadgeStyle(currentQuestion.section)}`}>
                {currentQuestion.section}
              </span>
              {isSubjective && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg uppercase tracking-wider">
                  Coding Workspace & Live Preview
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Progress: {Math.round(progressPercentage)}%
            </span>
          </div>

          <h2 className="text-base lg:text-lg font-bold mb-3 text-white leading-snug">
            {currentQuestion.q}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto my-1 pr-1 custom-scrollbar flex flex-col">
          {isDragAndDrop && (
            <div className="flex flex-col flex-1 min-h-0 space-y-4">

              {/* Code Snippet Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex-shrink-0">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800/80 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    {currentQuestion.section === 'HTML' ? 'index.html' : currentQuestion.section === 'CSS' ? 'styles.css' : currentQuestion.section === 'English' ? 'sentence.txt' : 'index.js'}
                  </span>
                  <div className="w-10"></div>
                </div>
                <div className="p-4 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
                  {renderCodeWithBlank()}
                </div>
              </div>

              {/* Options Chips */}
              <div className="flex-shrink-0">
                <p className="text-xs text-slate-400 font-medium mb-3 select-none flex items-center gap-1.5">
                  <span className="text-xs">💡</span>
                  <span>Drag an option into the blank space or click a chip to select instantly</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(currentQuestion.options)
                    ? currentQuestion.options
                    : Object.values(currentQuestion.options || {})
                  ).map((option) => {
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
                        className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold border-2 transition-all select-none whitespace-nowrap
                          ${isPlaced
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-500/30'
                            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-200 shadow-md cursor-grab active:cursor-grabbing active:scale-[0.97] hover:-translate-y-0.5 hover:border-indigo-500/50'
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

          {isSubjective && (
            <div className={`space-y-2 flex flex-col flex-1 min-h-0 ${isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 border border-indigo-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl' : ''}`}>
              {/* Editor Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium px-2 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                {/* Tab Selectors */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('split')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${
                      activeTab === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Side-by-Side Split View"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${
                      activeTab === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Code Editor Only"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${
                      activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Live Preview Only"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Editor Action Controls */}
                <div className="flex items-center gap-1.5">
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
                    title="Editor Keyboard Shortcuts"
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

              {/* Shortcuts Helper Modal / Banner */}
              {showShortcuts && (
                <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 space-y-2 animate-fadeIn shadow-xl">
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      ⚡ Monaco Emmet & VS Code Shortcuts
                    </span>
                    <button type="button" onClick={() => setShowShortcuts(false)} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">Dismiss</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">.box</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">&lt;div class="box"&gt;&lt;/div&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">button.btn</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">&lt;button class="btn"&gt;&lt;/button&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">#main</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">&lt;div id="main"&gt;&lt;/div&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">p</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">&lt;p&gt;&lt;/p&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">ul&gt;li</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">&lt;ul&gt;&lt;li&gt;&lt;/li&gt;&lt;/ul&gt;</p>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">!</span> + <span className="text-indigo-300">Enter</span>
                      <p className="text-slate-400 text-[10px]">HTML5 Boilerplate</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Code & Preview Main Display Container */}
              <div className="flex-1 min-h-[220px] flex flex-col md:flex-row gap-2.5 overflow-hidden">
                {/* Monaco Editor Component */}
                <div className={`border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[220px] transition-all
                  ${activeTab === 'code' ? 'w-full block' : activeTab === 'split' ? 'w-full md:w-1/2 block' : 'hidden'}`}>
                  <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Monaco Editor Pro ({currentQuestion.section})
                    </span>
                    <span className="text-[10px] text-slate-500">VS Code Engine</span>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <Editor
                      key={`editor-${currentIndex}-${editorFontSize}`}
                      height="100%"
                      defaultLanguage={currentQuestion.section === 'HTML' ? 'html' : currentQuestion.section === 'CSS' ? 'css' : 'javascript'}
                      theme="monaco-dark-pro"
                      value={subjectiveAnswer || ''}
                      onChange={(value) => onSubjectiveAnswer(value || '')}
                      onMount={(editor, monaco) => {
                        editorRef.current = editor;
                        monacoRef.current = monaco;

                        monaco.editor.defineTheme('monaco-dark-pro', {
                          base: 'vs-dark',
                          inherit: true,
                          rules: [
                            { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                            { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                            { token: 'string', foreground: 'ce9178' },
                            { token: 'number', foreground: 'b5cea8' },
                            { token: 'tag', foreground: '4ec9b0' },
                            { token: 'attribute.name', foreground: '9cdcfe' },
                          ],
                          colors: {
                            'editor.background': '#090d16',
                            'editor.lineHighlightBackground': '#1e293b60',
                            'editorLineNumber.foreground': '#475569',
                            'editorLineNumber.activeForeground': '#818cf8',
                            'editorIndentGuide.background': '#1e293b',
                            'editorIndentGuide.activeBackground': '#4338ca',
                          }
                        });
                        monaco.editor.setTheme('monaco-dark-pro');

                        // --- Emmet Completion Provider ---
                        if (typeof window !== 'undefined' && !window.__emmet_provider_registered) {
                          window.__emmet_provider_registered = true;
                          monaco.languages.registerCompletionItemProvider('html', {
                            triggerCharacters: ['.', '#', '>', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 's', 't', 'u'],
                            provideCompletionItems: (model, position) => {
                              const lineContent = model.getLineContent(position.lineNumber);
                              const textUntilPosition = lineContent.substring(0, position.column - 1);
                              const match = textUntilPosition.match(/([a-zA-Z0-9.#-_>!]+)$/);
                              if (!match) return { suggestions: [] };

                              const abbr = match[1];
                              const emmetResult = parseEmmetAbbr(abbr);
                              if (!emmetResult) return { suggestions: [] };

                              const range = {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column - abbr.length,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column,
                              };

                              return {
                                suggestions: [
                                  {
                                    label: `⚡ Emmet: ${emmetResult.code.replace(/\n/g, ' ')}`,
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: emmetResult.code,
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    detail: `Expand '${abbr}' abbreviation`,
                                    range: range,
                                  }
                                ]
                              };
                            }
                          });
                        }

                        // --- VS Code & Emmet-style Enter command ---
                        editor.addCommand(monaco.KeyCode.Enter, () => {
                          const position = editor.getPosition();
                          const model = editor.getModel();
                          const lineContent = model.getLineContent(position.lineNumber);
                          const textBeforeCursor = lineContent.substring(0, position.column - 1);

                          const match = textBeforeCursor.match(/([a-zA-Z0-9.#-_>!]+)$/);
                          if (match && currentQuestion?.section === 'HTML') {
                            const abbr = match[1];
                            const emmetResult = parseEmmetAbbr(abbr);
                            if (emmetResult) {
                              const startCol = position.column - abbr.length;
                              const range = new monaco.Range(position.lineNumber, startCol, position.lineNumber, position.column);

                              editor.executeEdits('emmet-expand', [{ range, text: emmetResult.code }]);

                              if (emmetResult.cursorLineOffset > 0) {
                                editor.setPosition({
                                  lineNumber: position.lineNumber + emmetResult.cursorLineOffset,
                                  column: emmetResult.cursorCol
                                });
                              } else {
                                editor.setPosition({
                                  lineNumber: position.lineNumber,
                                  column: startCol + emmetResult.cursorCol
                                });
                              }
                              editor.focus();
                              return;
                            }
                          }

                          editor.trigger('keyboard', 'type', { text: '\n' });
                        }, '!suggestWidgetVisible');

                        editor.onDidType((typedText) => {
                          if (typedText !== '>') return;
                          if (currentQuestion?.section !== 'HTML') return;

                          const position = editor.getPosition();
                          const model = editor.getModel();
                          const textBeforeCursor = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                          });

                          const tagMatch = textBeforeCursor.match(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^<>]*)?>$/);
                          if (!tagMatch) return;

                          const tagName = tagMatch[1];
                          const isSelfClosing =
                            textBeforeCursor.trim().endsWith('/>') ||
                            VOID_TAGS.includes(tagName.toLowerCase());
                          if (isSelfClosing) return;

                          const textAfterCursor = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: model.getLineMaxColumn(position.lineNumber),
                          });
                          if (textAfterCursor.trimStart().toLowerCase().startsWith(`</${tagName.toLowerCase()}>`)) return;

                          editor.executeEdits('auto-close-tag', [{
                            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                            text: `</${tagName}>`,
                          }]);
                          editor.setPosition(position);
                        });
                      }}
                      options={{
                        readOnly: isLocked,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        fontSize: editorFontSize,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        autoClosingDelete: 'always',
                        autoClosingOvertype: 'always',
                        autoSurround: 'languageDefined',
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        quickSuggestions: true,
                        formatOnType: true,
                        formatOnPaste: true,
                        snippetSuggestions: 'inline',
                        matchBrackets: 'always',
                        bracketPairColorization: { enabled: true },
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        renderLineHighlight: 'all',
                      }}
                    />
                  </div>
                </div>

                {/* Live Preview Container */}
                <div className={`border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white flex-1 flex flex-col min-h-[220px] transition-all
                  ${activeTab === 'preview' ? 'w-full block' : activeTab === 'split' ? 'w-full md:w-1/2 block' : 'hidden'}`}>
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live Output Preview
                    </span>
                    <span className="text-[10px] text-slate-500">Interactive IFrame</span>
                  </div>
                  <div className="flex-1 h-full min-h-0 bg-white">
                    <iframe
                      title="Live Preview Output"
                      srcDoc={getPreviewSource()}
                      className="w-full h-full min-h-[200px] border-0 bg-white"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-3 border-t border-slate-800/60 mt-2">
          {!isLocked ? (
            <button type="button" onClick={onNext}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl
                transition-all shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer">
              {isLastQuestion ? '✓ Finish & Submit Assessment' : 'Next Question →'}
            </button>
          ) : (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
              <p className="text-rose-400 font-bold text-xs">
                🚫 Assessment limit reached (5 warnings). Auto-submitting evaluation...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}