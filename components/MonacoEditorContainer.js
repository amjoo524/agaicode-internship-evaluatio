'use client';
import dynamic from 'next/dynamic';
import React, { memo } from 'react';

const CodeEditorDynamic = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-indigo-400 font-mono text-xs animate-pulse space-y-2 border border-slate-800 rounded-xl">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span>⚡ Loading High-Performance Code Workspace...</span>
    </div>
  ),
});

const MonacoEditorContainer = memo(function MonacoEditorContainer(props) {
  return <CodeEditorDynamic {...props} />;
});

export default MonacoEditorContainer;
