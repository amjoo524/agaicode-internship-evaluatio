'use client';
import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const SUBJECT_TOPICS: Record<string, { title: string; desc: string }[]> = {
  HTML: [
    { title: 'HTML Elements & Attributes', desc: 'Tags, attributes, structural markup' },
    { title: 'Forms & Input Validation', desc: 'Form controls, inputs, attributes' },
    { title: 'Semantic Layouts & Headings', desc: 'header, nav, main, article, section' },
    { title: 'Tables, Lists & Media', desc: 'table structure, img, video, audio' },
    { title: 'Links, Iframes & Metadata', desc: 'anchor tags, target, meta, head' },
  ],
  CSS: [
    { title: 'Selectors, Specificity & Cascade', desc: 'class, id, pseudo-classes' },
    { title: 'Box Model, Margins & Padding', desc: 'content, padding, border, margin' },
    { title: 'Flexbox Layouts', desc: 'display flex, justify-content, align-items' },
    { title: 'CSS Grid Systems', desc: 'grid-template-columns, gap, fr units' },
    { title: 'Colors, Gradients & Typography', desc: 'font-family, line-height, gradients' },
    { title: 'Transitions & Animations', desc: 'transform, transition, @keyframes' },
  ],
  JS: [
    { title: 'Variables, Data Types & Operators', desc: 'let, const, primitives, objects' },
    { title: 'ES6+ Functions, Arrow & Scope', desc: 'functions, arrow syntax, closures' },
    { title: 'DOM Selection & Event Handling', desc: 'querySelector, addEventListener' },
    { title: 'Arrays, Objects & Destructuring', desc: 'map, filter, reduce, spread' },
    { title: 'Async JS, Promises & Fetch API', desc: 'async/await, promises, fetch' },
  ],
  React: [
    { title: 'JSX Syntax & Rendering Rules', desc: 'JSX elements, embedding expressions' },
    { title: 'Components, Props & State', desc: 'Functional components, prop passing' },
    { title: 'useState & useEffect Hooks', desc: 'State management, side effects' },
    { title: 'Event Handling & Form State', desc: 'onClick, onChange, controlled inputs' },
    { title: 'Conditional & List Rendering', desc: 'Ternary operators, map key props' },
  ],
  'Next.js': [
    { title: 'App Router & Routing', desc: 'layout, page, loading, route handlers' },
    { title: 'Server & Client Components', desc: 'use client, SSR, Server Components' },
    { title: 'Data Fetching & Revalidation', desc: 'fetch options, ISR, revalidate' },
    { title: 'API Routes & Server Actions', desc: 'route.ts handlers, form actions' },
    { title: 'Metadata & SEO Optimization', desc: 'generateMetadata, OpenGraph' },
  ],
};

interface TopicSelectionModalProps {
  isOpen: boolean;
  subject: string;
  onClose: () => void;
  onConfirm: (subject: string, selectedTopics: string[]) => void;
}

export default function TopicSelectionModal({
  isOpen,
  subject,
  onClose,
  onConfirm,
}: TopicSelectionModalProps) {
  const topics = SUBJECT_TOPICS[subject] || SUBJECT_TOPICS['HTML'];
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Default to all topics selected
      setSelectedTopics(topics.map((t) => t.title));
    }
  }, [isOpen, subject, topics]);

  if (!isOpen) return null;

  const isAllSelected = selectedTopics.length === topics.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(topics.map((t) => t.title));
    }
  };

  const toggleTopic = (title: string) => {
    if (selectedTopics.includes(title)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== title));
    } else {
      setSelectedTopics([...selectedTopics, title]);
    }
  };

  const handleProceed = () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic area before proceeding.');
      return;
    }
    onConfirm(subject, selectedTopics);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {subject} Assessment Topics
              </h3>
              <p className="text-xs text-slate-400">Select specific topics to test your knowledge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Select All Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <span className="text-xs font-semibold text-slate-300">
              Selected ({selectedTopics.length} / {topics.length} topics)
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-500" /> Select All
                </>
              )}
            </button>
          </div>

          {/* Topic Checkboxes */}
          <div className="space-y-2.5">
            {topics.map((t) => {
              const isChecked = selectedTopics.includes(t.title);
              return (
                <div
                  key={t.title}
                  onClick={() => toggleTopic(t.title)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-sm'
                      : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:bg-slate-950/60'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 text-indigo-400 focus:outline-none cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-bold ${
                        isChecked ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer"
          >
            <span>Next: Exam Configuration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
