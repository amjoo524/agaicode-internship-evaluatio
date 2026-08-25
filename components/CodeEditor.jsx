'use client';
import React, { useRef, useEffect, useCallback, memo } from 'react';
import Editor from '@monaco-editor/react';

let cssCompletionsRegistered = false;
let cssDefaultsConfigured = false;

const CodeEditorSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-indigo-400 font-mono text-xs animate-pulse space-y-2 border border-slate-800 rounded-xl">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    <span>⚡ Loading High-Performance Code Workspace...</span>
  </div>
);

const CodeEditor = memo(
  function CodeEditor({
    language,
    theme = 'vs-dark',
    initialValue,
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

      // BULLETPROOF EMMET SHORTCUTS EXPANDER
      // ⚠️ ONLY runs in HTML mode — CSS/JS editors must NOT trigger Emmet
      const runEmmetExpansion = () => {
        const model = editor.getModel();
        if (!model) return false;
        // Guard: check language directly from the Monaco model (always current, never stale)
        const modelLanguage = model.getLanguageId();
        if (modelLanguage !== 'html') return false;

        const pos = editor.getPosition();
        const lineContent = model.getLineContent(pos.lineNumber);
        const textBeforeCursor = lineContent.substring(0, pos.column - 1);
        const trimmedLine = lineContent.trim();

        // Extract token immediately before cursor (e.g., "!", ".box", "div.container", "p", "h1")
        const tokenMatch = textBeforeCursor.match(/([!a-zA-Z0-9_.\-]+)$/);
        if (!tokenMatch) return false;

        const token = tokenMatch[1];
        const tokenStartCol = pos.column - token.length;

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

        // Rule 4: plain "tagname" → <tagname></tagname>
        const SELF_CLOSING = ['br','hr','img','input','meta','link','area','base','col','embed','param','source','track','wbr'];
        const tagOnly = token.match(/^([a-z][a-zA-Z0-9]*)$/i);
        if (tagOnly) {
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

      // 1. Native DOM Capturing Listener on Editor DOM Container (intercepts Enter & Tab BEFORE Monaco)
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
          true // Capturing phase
        );
      }

      // 2. Monaco keyboard event listener
      editor.onKeyDown((e) => {
        const isTab = e.keyCode === monaco.KeyCode.Tab || e.code === 'Tab' || e.browserEvent?.key === 'Tab';
        const isEnter = e.keyCode === monaco.KeyCode.Enter || e.code === 'Enter' || e.browserEvent?.key === 'Enter';

        if (isTab || isEnter) {
          const handled = runEmmetExpansion();
          if (handled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      });

      // 3. Monaco command fallback interceptors
      editor.addCommand(monaco.KeyCode.Tab, () => {
        const handled = runEmmetExpansion();
        if (!handled) {
          editor.trigger('keyboard', 'tab', {});
        }
      });

      editor.addCommand(monaco.KeyCode.Enter, () => {
        const handled = runEmmetExpansion();
        if (!handled) {
          editor.trigger('keyboard', 'type', { text: '\n' });
        }
      });

      // === CSS Language Support & IntelliSense ===
      // 1. Configure built-in CSS language defaults (cssDefaults / languageFeatures)
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
              showSnippetSuggestions: 'all',
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
          // cssDefaults may not be available in all environments
        }
      }

      // 2. Register CSS completion provider for property & value IntelliSense (once)
      if (!cssCompletionsRegistered) {
      const CSS_PROPS = [
        ['display', ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none', 'flow', 'flow-root', 'table', 'table-cell', 'list-item', 'contents', 'run-in']],
        ['position', ['static', 'relative', 'absolute', 'fixed', 'sticky']],
        ['z-index', ['0', '1', '2', '3', '999', '9999']],
        ['top', []], ['right', []], ['bottom', []], ['left', []],
        ['float', ['left', 'right', 'none', 'inline-start', 'inline-end']],
        ['clear', ['left', 'right', 'both', 'none']],
        ['overflow', ['visible', 'hidden', 'scroll', 'auto', 'clip']],
        ['overflow-x', ['visible', 'hidden', 'scroll', 'auto', 'clip']],
        ['overflow-y', ['visible', 'hidden', 'scroll', 'auto', 'clip']],
        ['visibility', ['visible', 'hidden', 'collapse']],
        ['cursor', ['pointer', 'default', 'wait', 'text', 'move', 'not-allowed', 'help', 'copy', 'grab', 'grabbing', 'zoom-in', 'zoom-out']],
        ['width', ['auto', '100%', '50%', '300px', '100px']],
        ['min-width', []], ['max-width', []],
        ['height', ['auto', '100%', '50%', '300px', '100px']],
        ['min-height', []], ['max-height', []],
        ['margin', []], ['margin-top', []], ['margin-right', []], ['margin-bottom', []], ['margin-left', []],
        ['padding', []], ['padding-top', []], ['padding-right', []], ['padding-bottom', []], ['padding-left', []],
        ['box-sizing', ['content-box', 'border-box']],
        ['border', ['0', '1px solid', '2px solid', 'none', 'dotted', 'dashed', 'solid', 'double']],
        ['border-width', ['0', '1px', '2px', '3px', '4px']],
        ['border-style', ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']],
        ['border-color', ['red', 'blue', 'green', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#333', '#6366f1', '#ef4444']],
        ['border-radius', ['0', '4px', '8px', '12px', '50%', '5px 10px']],
        ['border-top', []], ['border-right', []], ['border-bottom', []], ['border-left', []],
        ['border-top-left-radius', []], ['border-top-right-radius', []], ['border-bottom-left-radius', []], ['border-bottom-right-radius', []],
        ['background', []],
        ['background-color', ['red', 'blue', 'green', 'orange', 'yellow', 'pink', 'purple', 'cyan', 'magenta', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#6366f1']],
        ['background-image', ['linear-gradient()', 'radial-gradient()', 'url()', 'none']],
        ['background-size', ['cover', 'contain', 'auto', '100%']],
        ['background-position', ['top', 'bottom', 'left', 'right', 'center', '0 0', '50% 50%']],
        ['background-repeat', ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round']],
        ['background-attachment', ['scroll', 'fixed', 'local']],
        ['background-origin', ['box', 'border-box', 'padding-box', 'content-box']],
        ['background-clip', ['border-box', 'padding-box', 'content-box', 'text']],
        ['color', ['red', 'blue', 'green', 'orange', 'yellow', 'pink', 'purple', 'cyan', 'magenta', 'black', 'white', 'gray', 'transparent', '#000', '#fff', '#333', '#6366f1']],
        ['font-family', ['Arial', 'Helvetica', 'sans-serif', 'Georgia', 'serif', 'monospace', 'cursive', 'fantasy']],
        ['font-size', ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '1rem', '2rem']],
        ['font-weight', ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold', 'bolder', 'lighter']],
        ['font-style', ['normal', 'italic', 'oblique']],
        ['font-variant', ['normal', 'small-caps']],
        ['line-height', ['1', '1.2', '1.5', '1.6', 'normal']],
        ['letter-spacing', ['normal', '1px', '2px', '-1px']],
        ['word-spacing', []],
        ['text-align', ['left', 'right', 'center', 'justify', 'start', 'end']],
        ['text-decoration', ['none', 'underline', 'overline', 'line-through']],
        ['text-transform', ['none', 'capitalize', 'uppercase', 'lowercase']],
        ['text-indent', []],
        ['text-shadow', []],
        ['text-overflow', ['clip', 'ellipsis']],
        ['word-wrap', ['normal', 'break-word']],
        ['word-break', ['normal', 'break-all', 'keep-all']],
        ['white-space', ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line']],
        ['flex', ['1', '0', 'auto', 'none', '0 1 auto', '1 1 auto']],
        ['flex-direction', ['row', 'row-reverse', 'column', 'column-reverse']],
        ['flex-wrap', ['nowrap', 'wrap', 'wrap-reverse']],
        ['flex-flow', []],
        ['justify-content', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch']],
        ['align-items', ['stretch', 'flex-start', 'flex-end', 'center', 'baseline']],
        ['align-content', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'stretch']],
        ['align-self', ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch']],
        ['order', []], ['flex-grow', []], ['flex-shrink', []],
        ['gap', []], ['row-gap', []], ['column-gap', []],
        ['grid', []], ['grid-template-columns', []], ['grid-template-rows', []],
        ['grid-area', []], ['grid-column', []], ['grid-row', []],
        ['transform', ['translateX()', 'translateY()', 'translate()', 'scale()', 'scaleX()', 'scaleY()', 'rotate()', 'skew()', 'none']],
        ['transform-origin', []],
        ['transition', []], ['transition-property', []], ['transition-duration', []],
        ['transition-timing-function', ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out']],
        ['transition-delay', []],
        ['animation', []], ['animation-name', []], ['animation-duration', []],
        ['opacity', []],
        ['box-shadow', ['none', '0 1px 2px', '0 2px 4px', '0 4px 8px', 'inset']],
        ['filter', ['none', 'blur()', 'brightness()', 'contrast()', 'grayscale()', 'hue-rotate()', 'invert()', 'saturate()', 'sepia()']],
        ['outline', []], ['outline-color', []], ['outline-style', []], ['outline-width', []], ['outline-offset', []],
        ['content', ['""', 'normal', 'none']],
        ['list-style', []],
        ['list-style-type', ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha', 'none']],
        ['list-style-position', ['inside', 'outside']],
        ['table-layout', ['auto', 'fixed']],
        ['border-collapse', ['collapse', 'separate']],
        ['border-spacing', []],
        ['caption-side', ['top', 'bottom', 'left', 'right']],
        ['object-fit', ['fill', 'contain', 'cover', 'none', 'scale-down']],
        ['object-position', []],
        ['resize', ['none', 'both', 'horizontal', 'vertical']],
        ['user-select', ['none', 'text', 'all', 'element']],
        ['pointer-events', ['auto', 'none', 'visible', 'painted', 'fill', 'stroke']],
        ['appearance', ['none', 'auto']],
        ['will-change', ['auto', 'scroll-position', 'contents', 'transform', 'opacity']],
        ['writing-mode', ['horizontal-tb', 'vertical-rl', 'vertical-lr']],
      ];

      // Deduplicate
      const seen = new Set();
      const CSS_UNIQUE = CSS_PROPS.filter(([name]) => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

      monaco.languages.registerCompletionItemProvider('css', {
        provideCompletionItems: (model, position) => {
          const textUntil = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const suggestions = [];

          // Value context: detect "property:" pattern
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

          // Property context: always show property suggestions
          const propMatch = textUntil.match(/([a-zA-Z-]*)$/);
          if (propMatch && suggestions.length === 0) {
            const partial = (propMatch[1] || '').toLowerCase();
            for (const [name, values] of CSS_UNIQUE) {
              if (name.toLowerCase().startsWith(partial)) {
                suggestions.push({
                  label: name,
                  kind: monaco.languages.CompletionItemKind.Property,
                  insertText: `${name}: $1;`,
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  detail: 'CSS property',
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
          language={language}
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
            formatOnPaste: false,
            formatOnType: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: false, strings: false },
            wordBasedSuggestions: 'currentDocument',
            snippetSuggestions: 'inline',
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            folding: false, // Disabled for lag prevention
            hover: { enabled: true, validationHoverHelpIngutter: true }, // Enabled for CSS IntelliSense
            renderLineHighlight: 'none', // Disabled for lag prevention
            occurrencesHighlight: false, // Disabled for lag prevention
            selectionHighlight: false, // Disabled for lag prevention
            renderValidationDecorations: 'off', // Disabled for lag prevention
            links: false,
            contextmenu: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'off',
            smoothScrolling: false,
            lineNumbersMinChars: 3,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.questionId === nextProps.questionId &&
      prevProps.fontSize === nextProps.fontSize &&
      prevProps.language === nextProps.language
    );
  }
);

export default CodeEditor;
