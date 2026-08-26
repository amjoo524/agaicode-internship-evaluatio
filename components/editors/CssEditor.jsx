'use client';
import React, { useRef, useEffect, useCallback, memo } from 'react';
import Editor from '@monaco-editor/react';

let cssCompletionsRegistered = false;
let cssDefaultsConfigured = false;

const CodeEditorSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-indigo-400 font-mono text-xs animate-pulse space-y-2 border border-slate-800 rounded-xl">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    <span>⚡ Loading CSS Workspace...</span>
  </div>
);

const CssEditor = memo(function CssEditor({
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

    // Configure built-in CSS language defaults strictly for CSS
    if (!cssDefaultsConfigured && monaco.languages.css) {
      try {
        monaco.languages.css.cssDefaults.set({
          validate: true,
          lint: {
            compatibleVendorPrefix: 'ignore',
            ieStrict: 'ignore',
            vendorPrefix: 'warning',
            asterisk: 'ignore',
            emptyRules: 'ignore',
            starPropertyName: 'ignore',
          },
          completion: {
            showSnippetSuggestions: 'none',
            showModules: true,
            showCSSVariables: true,
          },
          hover: {
            enable: true,
            documentation: 'all',
            annotations: 'all',
          },
        });
        cssDefaultsConfigured = true;
      } catch (e) {
        // cssDefaults safety fallback
      }
    }

    // Register pure CSS property and value completion provider
    if (!cssCompletionsRegistered) {
      const CSS_PROPS = [
        ['display', ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'none']],
        ['position', ['static', 'relative', 'absolute', 'fixed', 'sticky']],
        ['z-index', ['0', '1', '2', '999']],
        ['top', []], ['right', []], ['bottom', []], ['left', []],
        ['float', ['left', 'right', 'none']],
        ['clear', ['left', 'right', 'both', 'none']],
        ['overflow', ['visible', 'hidden', 'scroll', 'auto', 'clip']],
        ['visibility', ['visible', 'hidden', 'collapse']],
        ['cursor', ['pointer', 'default', 'wait', 'text', 'move', 'not-allowed']],
        ['width', ['auto', '100%', '50%', '300px', '100px']],
        ['min-width', []], ['max-width', []],
        ['height', ['auto', '100%', '50%', '300px', '100px']],
        ['min-height', []], ['max-height', []],
        ['margin', []], ['margin-top', []], ['margin-right', []], ['margin-bottom', []], ['margin-left', []],
        ['padding', []], ['padding-top', []], ['padding-right', []], ['padding-bottom', []], ['padding-left', []],
        ['box-sizing', ['content-box', 'border-box']],
        ['border', ['0', '1px solid', '2px solid', 'none', 'dotted', 'dashed']],
        ['border-width', ['0', '1px', '2px', '3px']],
        ['border-style', ['none', 'dotted', 'dashed', 'solid', 'double']],
        ['border-color', ['red', 'blue', 'green', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#6366f1']],
        ['border-radius', ['0', '4px', '8px', '12px', '50%']],
        ['background', []],
        ['background-color', ['red', 'blue', 'green', 'orange', 'yellow', 'pink', 'purple', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#6366f1']],
        ['color', ['red', 'blue', 'green', 'orange', 'yellow', 'pink', 'purple', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#333', '#6366f1']],
        ['font-family', ['Arial', 'Helvetica', 'sans-serif', 'Georgia', 'serif', 'monospace']],
        ['font-size', ['12px', '14px', '16px', '18px', '20px', '24px', '1rem', '2rem']],
        ['font-weight', ['100', '300', '400', '500', '600', '700', 'bold', 'normal']],
        ['font-style', ['normal', 'italic']],
        ['line-height', ['1', '1.2', '1.5', '1.6', 'normal']],
        ['letter-spacing', ['normal', '1px', '2px', '-1px']],
        ['text-align', ['left', 'right', 'center', 'justify', 'start', 'end']],
        ['text-decoration', ['none', 'underline', 'line-through']],
        ['text-transform', ['none', 'capitalize', 'uppercase', 'lowercase']],
        ['flex', ['1', '0', 'auto', 'none']],
        ['flex-direction', ['row', 'row-reverse', 'column', 'column-reverse']],
        ['flex-wrap', ['nowrap', 'wrap']],
        ['justify-content', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']],
        ['align-items', ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']],
        ['gap', []], ['row-gap', []], ['column-gap', []],
        ['grid-template-columns', []], ['grid-template-rows', []],
        ['transform', ['translateX()', 'translateY()', 'translate()', 'scale()', 'rotate()', 'none']],
        ['transition', []],
        ['opacity', []],
        ['box-shadow', ['none', '0 1px 2px', '0 2px 4px', '0 4px 8px']],
      ];

      const seen = new Set();
      const CSS_UNIQUE = CSS_PROPS.filter(([name]) => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

      monaco.languages.registerCompletionItemProvider('css', {
        provideCompletionItems: (model, position) => {
          if (model.getLanguageId() !== 'css') return { suggestions: [] };

          const textUntil = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const suggestions = [];

          // Property value context
          const valueMatch = textUntil.match(/([a-zA-Z-]+)\s*:\s*([a-zA-Z-]*)$/);
          if (valueMatch) {
            const propName = valueMatch[1];
            const partial = (valueMatch[2] || '').toLowerCase();
            const prop = CSS_UNIQUE.find(([n]) => n === propName);
            if (prop) {
              for (const val of prop[1]) {
                if (val.toLowerCase().startsWith(partial)) {
                  suggestions.push({
                    label: val,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: val,
                    detail: `Value of ${propName}`,
                  });
                }
              }
            }
          }

          // Property name context
          const propMatch = textUntil.match(/([a-zA-Z-]*)$/);
          if (propMatch && suggestions.length === 0) {
            const partial = (propMatch[1] || '').toLowerCase();
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            };

            for (const [name, values] of CSS_UNIQUE) {
              if (name.toLowerCase().startsWith(partial)) {
                suggestions.push({
                  label: name,
                  kind: monaco.languages.CompletionItemKind.Property,
                  insertText: `${name}: $1;`,
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  range: range,
                  sortText: `0_${name}`,
                  detail: 'CSS Property',
                  documentation: values.length > 0
                    ? { value: `Common values: ${values.join(', ')}` }
                    : 'Accepts custom CSS values',
                });
              }
            }
          }

          return { suggestions };
        },
        triggerCharacters: [':', '{', ';', ' '],
        allCommitCharacters: false,
      });
      cssCompletionsRegistered = true;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative gpu-accelerated">
      <Editor
        key={questionId}
        height="100%"
        language="css"
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
          snippetSuggestions: 'none', // Strictly disable snippets to prevent Emmet/HTML tags
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

export default CssEditor;
