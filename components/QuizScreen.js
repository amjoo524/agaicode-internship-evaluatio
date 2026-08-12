'use client';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, Eye } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('code'); 
  const timerRef = useRef(null);

  useEffect(() => {
    if (totalQuestions) {
      setTimeLeft(totalQuestions * SECONDS_PER_QUESTION);
    }
  }, [totalQuestions]);

  useEffect(() => {
    setActiveTab('code');
  }, [currentIndex]);

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
              <h3>CSS Live Preview Output</h3>
              <p>This is a sample text to test your CSS styles (e.g. colors, margins, fonts).</p>
              <div class="box" style="padding:10px; border:2px dashed #6366f1; margin-top:10px;">Sample Box Element</div>
            </div>
          </body>
        </html>
      `;
    } else if (section === 'HTML') {
      return `
        <!DOCTYPE html>
        <html>
          <head><style>body { background:#ffffff; color:#111827; padding:16px; font-family:sans-serif; }</style></head>
          <body>${userCode}</body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
          <head><style>body { background:#0f172a; color:#f8fafc; padding:16px; font-family:monospace; font-size:13px; }</style></head>
          <body>
            <strong>JS Execution Output Log:</strong>
            <pre id="console-output" style="margin-top:10px; color:#38bdf8;"></pre>
            <script>
              try {
                const consoleLog = (...args) => {
                  document.getElementById('console-output').innerText += args.join(' ') + '\\n';
                };
                console.log = consoleLog;
                ${userCode}
              } catch(err) {
                document.getElementById('console-output').innerHTML += '<span style="color:#f43f5e;">Error: ' + err.message + '</span>';
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
            <div className="space-y-2 h-full flex flex-col flex-1">
              <div className="flex items-center justify-between text-xs font-medium px-1">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold ${
                      activeTab === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Code Editor
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold ${
                      activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </button>
                </div>
                <span className="font-mono text-indigo-400 text-xs">
                  ⚡ Auto-closing tags & VS Code features active
                </span>
              </div>

              <div className={`border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex-1 min-h-[220px] ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                <Editor
                  key={`editor-${currentIndex}`}
                  height="220px"
                  defaultLanguage={currentQuestion.section === 'HTML' ? 'html' : currentQuestion.section === 'CSS' ? 'css' : 'javascript'}
                  theme="vs-dark"
                  value={subjectiveAnswer || ''}
                  onChange={(value) => onSubjectiveAnswer(value || '')}
                  onMount={(editor, monaco) => {
                    // --- VS Code-style '!' + Enter -> HTML boilerplate ---
                    // Only fires when the suggestion widget is NOT visible, so it
                    // never steals Enter away from accepting an IntelliSense suggestion.
                    editor.addCommand(monaco.KeyCode.Enter, () => {
                      const position = editor.getPosition();
                      const model = editor.getModel();
                      const lineContent = model.getLineContent(position.lineNumber);

                      if (lineContent.trim() === '!') {
                        const boilerplate = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`;
                        const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, lineContent.length + 1);
                        editor.executeEdits('boilerplate', [{ range, text: boilerplate }]);
                        // Drop the cursor right inside <body> so you can start typing immediately
                        editor.setPosition({ lineNumber: position.lineNumber + 7, column: 3 });
                        editor.focus();
                        return;
                      }
                      // Default Enter action fallback (keeps normal newline + auto-indent)
                      editor.trigger('keyboard', 'type', { text: '\n' });
                    }, '!suggestWidgetVisible');

                    // --- VS Code-style auto-closing HTML tags ---
                    // Typing "<div>" auto-inserts "</div>" right after the cursor,
                    // just like real VS Code. Only runs for HTML questions since
                    // CSS/JS don't have tags to close.
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

                      // Matches "<tagname ...>" ending exactly where we just typed '>'
                      const tagMatch = textBeforeCursor.match(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^<>]*)?>$/);
                      if (!tagMatch) return;

                      const tagName = tagMatch[1];
                      const isSelfClosing =
                        textBeforeCursor.trim().endsWith('/>') ||
                        VOID_TAGS.includes(tagName.toLowerCase());
                      if (isSelfClosing) return;

                      // Don't double up if a matching closing tag already exists right after
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
                      // Keep the cursor sitting between the opening and closing tag
                      editor.setPosition(position);
                    });
                  }}
                  options={{
                    readOnly: isLocked,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    fontSize: 13,
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
                  }}
                />
              </div>

              <div className={`border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white flex-1 min-h-[220px] ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                <iframe
                  title="Live Preview Output"
                  srcDoc={getPreviewSource()}
                  className="w-full h-full min-h-[220px] border-0 bg-white"
                  sandbox="allow-scripts"
                />
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