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

/** Renders inline backtick spans: `code` → styled badge */
function renderInlineCode(segment: string): React.ReactNode[] {
  const parts = segment.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="inline-block px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[0.82em] font-semibold mx-0.5 align-middle"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function QuestionTextRenderer({ text }: { text: string }) {
  if (!text) return null;

  // ── Parse markdown code fences  ```js ... ``` ──────────────────────────────
  const fenceRegex = /```(?:js|javascript)?\n?([\s\S]*?)```/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    // Text before the code block
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      // Split by newlines so each line can have inline code rendered
      const lines = before.split('\n');
      segments.push(
        <p key={`txt-${lastIndex}`} className="text-sm lg:text-base font-semibold text-white leading-relaxed whitespace-pre-wrap mb-2">
          {lines.map((line, li) => (
            <React.Fragment key={li}>
              {renderInlineCode(line)}
              {li < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }
    // The code block itself
    segments.push(
      <CodeBox key={`code-${match.index}`} code={match[1].trim()} showLineNumbers={true} />
    );
    lastIndex = fenceRegex.lastIndex;
  }

  // Remaining text after last code block
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    const lines = remaining.split('\n');
    segments.push(
      <p key={`txt-end`} className="text-sm lg:text-base font-semibold text-white leading-relaxed whitespace-pre-wrap mt-2">
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {renderInlineCode(line)}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  }

  // If no fences found, render as plain text with inline code highlighting
  if (segments.length === 0) {
    const lines = text.split('\n');
    return (
      <p className="text-sm lg:text-base font-semibold text-white leading-relaxed whitespace-pre-wrap">
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {renderInlineCode(line)}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-1">{segments}</div>;
}
