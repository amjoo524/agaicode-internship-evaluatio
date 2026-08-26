'use client';
import React, { useRef, useEffect, useCallback, memo } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditorSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-indigo-400 font-mono text-xs animate-pulse space-y-2 border border-slate-800 rounded-xl">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    <span>⚡ Loading HTML Workspace...</span>
  </div>
);

const HtmlEditor = memo(function HtmlEditor({
  theme = 'vs-dark',
  initialValue = '',
  fontSize = 13,
  onChange,
  onRunCode,
  editorRef,
  monacoRef,
  codeRef,
  questionId,
}) {
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const roRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (roRef.current) roRef.current.disconnect();
    };
  }, []);

  const handleEditorChange = useCallback(
    (value, event) => {
      const val = value || '';
      if (codeRef) codeRef.current = val;

      const isPaste = event?.changes?.some(
        (c) => (c.text && c.text.length > 1) || c.rangeLength > 1
      );

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(
        () => {
          if (onChange) onChange(val);
        },
        isPaste ? 400 : 300
      );
    },
    [onChange, codeRef]
  );

  const handleMount = (editor, monaco) => {
    if (editorRef) editorRef.current = editor;
    if (monacoRef) monacoRef.current = monaco;
    if (codeRef) codeRef.current = editor.getValue();

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      if (roRef.current) roRef.current.disconnect();
      const ro = new ResizeObserver(() => editor.layout());
      ro.observe(containerRef.current);
      roRef.current = ro;
    }

    // Keybindings: Ctrl+S & Ctrl+Enter -> Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onRunCode) onRunCode();
      editor.getAction('editor.action.formatDocument')?.run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunCode) onRunCode();
    });

    // Dedicated HTML Emmet expansion engine
    const runEmmetExpansion = () => {
      const model = editor.getModel();
      if (!model) return false;

      const pos = editor.getPosition();
      const lineContent = model.getLineContent(pos.lineNumber);
      const textBeforeCursor = lineContent.substring(0, pos.column - 1);
      const trimmedLine = lineContent.trim();

      // Guard 1: Disable HTML tag expansion inside <style> blocks
      const fullTextUntilCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: pos.lineNumber,
        endColumn: pos.column,
      });
      const lastStyleOpen = fullTextUntilCursor.lastIndexOf('<style');
      const lastStyleClose = fullTextUntilCursor.lastIndexOf('</style>');
      if (lastStyleOpen > -1 && lastStyleOpen > lastStyleClose) {
        return false;
      }

      const tokenMatch = textBeforeCursor.match(/([!a-zA-Z0-9_.\-]+)$/);
      if (!tokenMatch) return false;

      const token = tokenMatch[1];
      const tokenStartCol = pos.column - token.length;

      // Guard 2: Prevent CSS properties or inline CSS tokens from triggering HTML tag creation
      const COMMON_CSS_TOKENS = [
        'color', 'background', 'background-color', 'border', 'border-radius',
        'margin', 'padding', 'display', 'position', 'width', 'height',
        'font-size', 'font-weight', 'text-align', 'flex', 'grid', 'gap',
        'opacity', 'z-index', 'cursor', 'top', 'bottom', 'left', 'right',
        'overflow', 'justify-content', 'align-items', 'red', 'green', 'blue', 'none', 'block'
      ];
      if (COMMON_CSS_TOKENS.includes(token.toLowerCase()) || textBeforeCursor.includes(':') || textBeforeCursor.includes('style=')) {
        return false;
      }

      // Rule 1: "!" → HTML5 Boilerplate
      if (token === '!' || trimmedLine === '!') {
        const boilerplate = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>`;
        const range = new monaco.Range(
          pos.lineNumber,
          trimmedLine === '!' ? 1 : tokenStartCol,
          pos.lineNumber,
          lineContent.length + 1
        );
        editor.executeEdits('emmet', [{ range, text: boilerplate, forceMoveMarkers: true }]);
        editor.setPosition({ lineNumber: pos.lineNumber + 7, column: 3 });
        editor.focus();
        return true;
      }

      // Rule 2: ".classname" → <div class="classname"></div>
      const classOnly = token.match(/^\.([a-zA-Z0-9_-]+)$/);
      if (classOnly) {
        const cls = classOnly[1];
        const tag = `<div class="${cls}"></div>`;
        const range = new monaco.Range(pos.lineNumber, tokenStartCol, pos.lineNumber, pos.column);
        editor.executeEdits('emmet', [{ range, text: tag, forceMoveMarkers: true }]);
        const cursorCol = tokenStartCol + `<div class="${cls}">`.length;
        editor.setPosition({ lineNumber: pos.lineNumber, column: cursorCol });
        editor.focus();
        return true;
      }

      // Rule 3: "tag.class" → <tag class="class"></tag>
      const tagClass = token.match(/^([a-z][a-zA-Z0-9]*)\.([a-zA-Z0-9_-]+)$/i);
      if (tagClass) {
        const tagName = tagClass[1];
        const cls = tagClass[2];
        const tag = `<${tagName} class="${cls}"></${tagName}>`;
        const range = new monaco.Range(pos.lineNumber, tokenStartCol, pos.lineNumber, pos.column);
        editor.executeEdits('emmet', [{ range, text: tag, forceMoveMarkers: true }]);
        const cursorCol = tokenStartCol + `<${tagName} class="${cls}">`.length;
        editor.setPosition({ lineNumber: pos.lineNumber, column: cursorCol });
        editor.focus();
        return true;
      }

      // Rule 4: plain "tagname" → <tagname></tagname> (strictly validated against known HTML tags)
      const VALID_HTML_TAGS = [
        'div','span','p','h1','h2','h3','h4','h5','h6','button','input','a','img','ul','li','ol',
        'table','tr','td','th','form','label','section','header','footer','nav','main','article','aside',
        'style','script','head','body','html','title','meta','link','br','hr','iframe','canvas','svg',
        'code','pre','blockquote','select','option','textarea','b','i','strong','em','u','small','mark'
      ];
      const SELF_CLOSING = ['br','hr','img','input','meta','link','area','base','col','embed','param','source','track','wbr'];
      const tagOnly = token.match(/^([a-z][a-zA-Z0-9]*)$/i);
      if (tagOnly && VALID_HTML_TAGS.includes(token.toLowerCase())) {
        const tagName = tagOnly[1];
        const isSelfClosing = SELF_CLOSING.includes(tagName.toLowerCase());
        const tag = isSelfClosing ? `<${tagName} />` : `<${tagName}></${tagName}>`;
        const range = new monaco.Range(pos.lineNumber, tokenStartCol, pos.lineNumber, pos.column);
        editor.executeEdits('emmet', [{ range, text: tag, forceMoveMarkers: true }]);
        const cursorCol = isSelfClosing
          ? tokenStartCol + `<${tagName} `.length
          : tokenStartCol + `<${tagName}>`.length;
        editor.setPosition({ lineNumber: pos.lineNumber, column: cursorCol });
        editor.focus();
        return true;
      }

      return false;
    };

    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            const handled = runEmmetExpansion();
            if (handled) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
          }
        },
        true
      );
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative gpu-accelerated">
      <Editor
        key={questionId}
        height="100%"
        language="html"
        theme={theme}
        defaultValue={initialValue}
        onChange={handleEditorChange}
        loading={<CodeEditorSkeleton />}
        onMount={handleMount}
        options={{
          fontSize: fontSize,
          minimap: { enabled: false },
          automaticLayout: false,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          wordBasedSuggestions: 'currentDocument',
          snippetSuggestions: 'inline',
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          folding: false,
          hover: { enabled: true },
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
        }}
      />
    </div>
  );
});

export default HtmlEditor;
