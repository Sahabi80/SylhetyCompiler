/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CODE_PATTERNS,
  PATTERN_CATEGORIES,
  CodePattern,
} from '../data/code_patterns';
import { DialectType } from '../compiler/dialect_mapper';
import {
  Search,
  X,
  Code,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  FolderCode,
  Layers,
  Terminal,
  Hash,
  GitFork,
  RefreshCw,
  Zap,
  Globe,
} from 'lucide-react';

interface PatternLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPattern: (snippet: string) => void;
  currentDialect: DialectType;
}

export const PatternLibraryModal: React.FC<PatternLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertPattern,
  currentDialect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDialectPreview, setActiveDialectPreview] = useState<'sylheti' | 'bangla'>(
    currentDialect === 'bangla' ? 'bangla' : 'sylheti'
  );
  const [selectedPatternId, setSelectedPatternId] = useState<string>(CODE_PATTERNS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync dialect preview when currentDialect changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveDialectPreview(currentDialect === 'bangla' ? 'bangla' : 'sylheti');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentDialect]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered patterns based on search query and category
  const filteredPatterns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CODE_PATTERNS.filter((pattern) => {
      const matchCategory =
        selectedCategory === 'all' || pattern.category === selectedCategory;
      if (!matchCategory) return false;

      if (!q) return true;

      const matchName =
        pattern.nameBangla.toLowerCase().includes(q) ||
        pattern.nameEnglish.toLowerCase().includes(q) ||
        pattern.description.toLowerCase().includes(q);
      const matchTags = pattern.tags.some((t) => t.toLowerCase().includes(q));
      const matchCode =
        pattern.sylhetiCode.toLowerCase().includes(q) ||
        pattern.banglaCode.toLowerCase().includes(q);

      return matchName || matchTags || matchCode;
    });
  }, [searchQuery, selectedCategory]);

  // Keep selectedPatternId valid
  useEffect(() => {
    if (filteredPatterns.length > 0) {
      const exists = filteredPatterns.some((p) => p.id === selectedPatternId);
      if (!exists) {
        setSelectedPatternId(filteredPatterns[0].id);
      }
    }
  }, [filteredPatterns, selectedPatternId]);

  const activePattern = useMemo(() => {
    return (
      CODE_PATTERNS.find((p) => p.id === selectedPatternId) ||
      filteredPatterns[0] ||
      CODE_PATTERNS[0]
    );
  }, [selectedPatternId, filteredPatterns]);

  if (!isOpen) return null;

  const handleCopy = (codeToCopy: string, id: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (pattern: CodePattern) => {
    const snippet =
      activeDialectPreview === 'bangla' ? pattern.banglaCode : pattern.sylhetiCode;
    onInsertPattern(snippet);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'variables':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'conditionals':
        return <GitFork className="w-3.5 h-3.5 text-purple-400" />;
      case 'loops':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case 'functions':
        return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case 'builtins':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-400">
              <FolderCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  কোড প্যাটার্ন ও স্নিপেট লাইব্রেরি
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800 font-mono">
                  Command Palette (Ctrl+K)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সিলেটি ও প্রমিত বাংলা ভাষায় তৈরি সাধারণ কোড প্যাটার্ন তাৎক্ষণিক ইনসার্ট করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dialect Preview Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveDialectPreview('sylheti')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeDialectPreview === 'sylheti'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                সিলেটি (Sylheti)
              </button>
              <button
                onClick={() => setActiveDialectPreview('bangla')}
                className={`px-2 py-1 rounded transition-colors ${
                  activeDialectPreview === 'bangla'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                বাংলা (Bangla)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্যাটার্ন খুঁজুন (যেমন: for loop, if else, ফাংশন, recursion, math, ধরি, কও)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {PATTERN_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? CODE_PATTERNS.length
                  : CODE_PATTERNS.filter((p) => p.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors shrink-0 font-medium ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span>{cat.titleBangla}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Main Content: Split Master-Detail Layout */}
        <div className="flex-1 flex overflow-hidden min-h-[360px]">
          {/* Left Column: Patterns List */}
          <div className="w-5/12 border-r border-slate-800 overflow-y-auto p-2.5 space-y-1.5 bg-slate-950/40">
            {filteredPatterns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <p>কোনো কোড প্যাটার্ন পাওয়া যায়নি।</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-xs text-emerald-400 underline hover:text-emerald-300"
                >
                  সব প্যাটার্ন প্রদর্শন করুন
                </button>
              </div>
            ) : (
              filteredPatterns.map((pattern) => {
                const isSelected = pattern.id === selectedPatternId;
                return (
                  <div
                    key={pattern.id}
                    onClick={() => setSelectedPatternId(pattern.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-600/80 text-white shadow-sm'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(pattern.category)}
                        <h4 className="text-xs font-semibold">{pattern.nameBangla}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {pattern.nameEnglish}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {pattern.description}
                    </p>

                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {pattern.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Pattern Detail & Code Preview */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {activePattern ? (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                {/* Pattern Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {activePattern.nameBangla}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        ({activePattern.nameEnglish})
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activePattern.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        handleCopy(
                          activeDialectPreview === 'bangla'
                            ? activePattern.banglaCode
                            : activePattern.sylhetiCode,
                          activePattern.id
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-mono transition-colors"
                      title="Copy code to clipboard"
                    >
                      {copiedId === activePattern.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleInsert(activePattern)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-all shadow-md active:scale-95"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>এডিটরে ইনসার্ট করুন</span>
                    </button>
                  </div>
                </div>

                {/* Code Preview Frame */}
                <div className="mt-3 flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {activeDialectPreview === 'sylheti'
                          ? 'সিলেটি সংস্করণ (Sylheti Dialect)'
                          : 'বাংলা সংস্করণ (Bangla Dialect)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activePattern.category.toUpperCase()}
                    </span>
                  </div>

                  <pre className="p-3 text-xs font-mono text-emerald-300 leading-relaxed overflow-auto flex-1 select-text">
                    <code>
                      {activeDialectPreview === 'bangla'
                        ? activePattern.banglaCode
                        : activePattern.sylhetiCode}
                    </code>
                  </pre>
                </div>

                {/* Tags & Keywords Footnote */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-mono">কি-ওয়ার্ড:</span>
                    {activePattern.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="text-slate-500 font-mono text-[10px]">
                    Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 border border-slate-700">Esc</kbd> to exit
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
