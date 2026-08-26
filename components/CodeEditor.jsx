'use client';
import React, { memo } from 'react';
import HtmlEditor from './editors/HtmlEditor';
import CssEditor from './editors/CssEditor';
import JsEditor from './editors/JsEditor';

const CodeEditor = memo(function CodeEditor(props) {
  const lang = (props.language || '').toLowerCase();

  if (lang === 'html') {
    return <HtmlEditor {...props} />;
  }

  if (lang === 'css') {
    return <CssEditor {...props} />;
  }

  return <JsEditor {...props} />;
});

export default CodeEditor;
