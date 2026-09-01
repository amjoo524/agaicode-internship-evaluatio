'use client';
import React from 'react';

interface CodeBoxProps {
  code: string;
  className?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

export const CodeBox: React.FC<CodeBoxProps> = ({
  code,
  className = '',
  showLineNumbers = false,
  filename = 'main.js',
}) => {
  if (!code) return null;

  const highlightLine = (line: string) => {
    if (!line) return line;

    // Tokenizer regex matching comments, strings, keywords, numbers, functions, operators, identifiers
    const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|switch|case|break|try|catch|class|import|export|from|async|await|typeof|instanceof|new|this|true|false|null|undefined|in|of)\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|[&&||||!|?|:|=|===|==|!==|!=|\+|\-|\*|\/|>|<|>=|<=]+|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|[^\s\w]+)/g;

    const keywords = new Set([
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'switch', 'case',
      'break', 'try', 'catch', 'class', 'import', 'export', 'from', 'async', 'await',
      'typeof', 'instanceof', 'new', 'this', 'true', 'false', 'null', 'undefined', 'in', 'of'
    ]);

    const operators = new Set([
      '&&', '||', '!', '?', ':', '=', '===', '==', '!==', '!=', '+', '-', '*', '/', '>', '<', '>=', '<='
    ]);

    const tokens: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    tokenRegex.lastIndex = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      const matchText = match[0];
      const matchIdx = match.index;

      if (matchIdx > lastIndex) {
        tokens.push(line.slice(lastIndex, matchIdx));
      }

      lastIndex = tokenRegex.lastIndex;

      if (matchText.startsWith('//') || matchText.startsWith('/*')) {
        tokens.push(
          <span key={matchIdx} className="text-slate-500 italic">
            {matchText}
          </span>
        );
      } else if (
        (matchText.startsWith('"') && matchText.endsWith('"')) ||
        (matchText.startsWith("'") && matchText.endsWith("'")) ||
        (matchText.startsWith('`') && matchText.endsWith('`'))
      ) {
        tokens.push(
          <span key={matchIdx} className="text-emerald-400 font-medium">
            {matchText}
          </span>
        );
      } else if (keywords.has(matchText)) {
        tokens.push(
          <span key={matchIdx} className="text-sky-400 font-extrabold">
            {matchText}
          </span>
        );
      } else if (!isNaN(Number(matchText))) {
        tokens.push(
          <span key={matchIdx} className="text-amber-400 font-semibold">
            {matchText}
          </span>
        );
      } else if (operators.has(matchText)) {
        tokens.push(
          <span key={matchIdx} className="text-rose-400 font-bold">
            {matchText}
          </span>
        );
      } else if (line.slice(matchIdx).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/)) {
        tokens.push(
          <span key={matchIdx} className="text-cyan-300 font-semibold">
            {matchText}
          </span>
        );
      } else {
        tokens.push(
          <span key={matchIdx} className="text-slate-200">
            {matchText}
          </span>
        );
      }
    }

    if (lastIndex < line.length) {
      tokens.push(line.slice(lastIndex));
    }

    return tokens;
  };

  const lines = code.split('\n');

  return (
    <div className={`bg-[#0f172a] border border-slate-800/90 rounded-2xl p-4 shadow-xl overflow-x-auto my-2 gpu-accelerated ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-1 text-slate-300 font-bold text-[11px]">{filename}</span>
        </div>
        <span className="text-[10px] font-mono font-extrabold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
          Code Snippet
        </span>
      </div>

      {/* Code Area */}
      <pre className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-semibold text-slate-200">
        {lines.map((line, idx) => (
          <div key={idx} className="table-row">
            {showLineNumbers && (
              <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-xs">
                {idx + 1}
              </span>
            )}
            <span className="table-cell">{highlightLine(line)}</span>
          </div>
        ))}
      </pre>
    </div>
  );
};

export function QuestionTextRenderer({ text }: { text: string }) {
  if (!text) return null;

  // Check if text has code block embedded via \n\n or code patterns
  const doubleNewlineIdx = text.indexOf('\n\n');
  const hasCodeKeywords = /let\s+|const\s+|var\s+|console\.log|function\s+|if\s*\(|return\s+/i.test(text);

  if (doubleNewlineIdx !== -1 && hasCodeKeywords) {
    const prompt = text.slice(0, doubleNewlineIdx).trim();
    const code = text.slice(doubleNewlineIdx + 2).trim();

    return (
      <div className="space-y-2">
        <p className="text-sm lg:text-base font-bold text-white leading-relaxed">
          {prompt}
        </p>
        <CodeBox code={code} showLineNumbers={true} />
      </div>
    );
  }

  // Standalone text question
  return (
    <p className="text-sm lg:text-base font-bold text-white leading-relaxed whitespace-pre-wrap font-mono">
      {text}
    </p>
  );
}
