'use client';
import React, { useRef, useEffect, useCallback, memo } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditorSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-indigo-400 font-mono text-xs animate-pulse space-y-2 border border-slate-800 rounded-xl">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    <span>⚡ Loading JavaScript Workspace...</span>
  </div>
);

const JsEditor = memo(function JsEditor({
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
  };

  return (
    <div ref={containerRef} className="w-full h-full relative gpu-accelerated">
      <Editor
        key={questionId}
        height="100%"
        language="javascript"
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

export default JsEditor;
