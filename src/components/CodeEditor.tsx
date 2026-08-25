/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { CompilerDiagnostic } from '../compiler/types';
import { DialectType } from '../compiler/dialect_mapper';
import { CODE_PATTERNS, PATTERN_CATEGORIES } from '../data/code_patterns';
import { AiCodeAssistantModal, AiAssistantMode } from './AiCodeAssistantModal';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  Save,
  Cloud,
  RefreshCw,
  FolderCode,
  Sparkles,
  ChevronDown,
  CircleDot,
  ArrowRight,
  Trash2,
  Zap,
  BookOpen,
  Play,
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  diagnostics: CompilerDiagnostic[];
  isAutoSaving?: boolean;
  lastSavedAt?: Date | null;
  onOpenPatternLibrary?: () => void;
  currentDialect?: DialectType;
  onRun?: () => void;
  isRunning?: boolean;
  breakpoints?: Set<number>;
  onToggleBreakpoint?: (line: number) => void;
  onClearBreakpoints?: () => void;
  pausedAtLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  diagnostics,
  isAutoSaving,
  lastSavedAt,
  onOpenPatternLibrary,
  currentDialect = 'sylheti',
  onRun,
  isRunning = false,
  breakpoints = new Set(),
  onToggleBreakpoint,
  onClearBreakpoints,
  pausedAtLine = null,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [copied, setCopied] = useState(false);
  const [selectedDropdownPattern, setSelectedDropdownPattern] = useState<string>('');

  // AI Assistant State & Selection Tracking
  const [selection, setSelection] = useState<{ start: number; end: number; text: string }>({
    start: 0,
    end: 0,
    text: '',
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiModalMode, setAiModalMode] = useState<AiAssistantMode>('explain');

  const lines = code.split('\n');
  const errorLines = new Set(
    diagnostics.filter((d) => d.severity === 'error').map((d) => d.loc.line)
  );
  const warningLines = new Set(
    diagnostics.filter((d) => d.severity === 'warning').map((d) => d.loc.line)
  );

  const handleOpenAiAssistant = (mode: AiAssistantMode) => {
    setAiModalMode(mode);
    setIsAiModalOpen(true);
  };

  const handleApplyOptimization = (replacementCode: string) => {
    if (selection.text && selection.start !== selection.end) {
      const newCode =
        code.substring(0, selection.start) + replacementCode + code.substring(selection.end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selection.start;
          textareaRef.current.selectionEnd = selection.start + replacementCode.length;
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      onChange(replacementCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Open Pattern Command Palette with Ctrl+K / Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (onOpenPatternLibrary) {
        onOpenPatternLibrary();
      }
      return;
    }

    // Open Gemini AI Assistant with Ctrl+I / Cmd+I
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      handleOpenAiAssistant('explain');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleSelectOrChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const val = target.value;
    const selStart = target.selectionStart;
    const selEnd = target.selectionEnd;
    const textBefore = val.substring(0, selStart);
    const lineCount = (textBefore.match(/\n/g) || []).length + 1;
    const lastNewlineIdx = textBefore.lastIndexOf('\n');
    const colCount = lastNewlineIdx === -1 ? selStart + 1 : selStart - lastNewlineIdx;

    setCursorPos({ line: lineCount, column: colCount });
    const selectedText = val.substring(selStart, selEnd);
    setSelection({
      start: selStart,
      end: selEnd,
      text: selectedText,
    });
  };

  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(newCode);
    textareaRef.current.focus();
  };

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patternId = e.target.value;
    if (!patternId) return;

    const pattern = CODE_PATTERNS.find((p) => p.id === patternId);
    if (pattern) {
      const snippet = currentDialect === 'bangla' ? pattern.banglaCode : pattern.sylhetiCode;
      insertSnippet(snippet);
    }
    setSelectedDropdownPattern('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="font-mono text-slate-200 font-medium ml-1">program.syl</span>
          <span className="text-[9px] text-emerald-400/90 uppercase px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-800/40">
            UTF-8 {currentDialect === 'bangla' ? 'Bangla' : 'Sylheti'}
          </span>

          {/* Auto-Save Indicator */}
          {isAutoSaving ? (
            <span className="flex items-center gap-1 text-[9px] text-amber-300/90 px-1.5 py-0.2 bg-amber-950/40 rounded border border-amber-800/40">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
              <span>Saving...</span>
            </span>
          ) : lastSavedAt ? (
            <span
              className="hidden sm:flex items-center gap-1 text-[9px] text-emerald-400/80 px-1.5 py-0.2 bg-emerald-950/30 rounded border border-emerald-800/30"
              title={`Auto-saved to local storage at ${lastSavedAt.toLocaleTimeString()}`}
            >
              <Save className="w-2.5 h-2.5 text-emerald-400" />
              <span>Auto-saved</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Breakpoints Badge */}
          {breakpoints && breakpoints.size > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-950/70 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{breakpoints.size} Breakpoint{breakpoints.size > 1 ? 's' : ''}</span>
              {onClearBreakpoints && (
                <button
                  onClick={onClearBreakpoints}
                  className="ml-1 text-[9px] text-rose-400 hover:text-rose-100 hover:underline cursor-pointer"
                  title="সব ব্রেকপয়েন্ট ক্লিয়ার করুন (Clear all breakpoints)"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Diagnostic badge count */}
          {diagnostics.length > 0 && (
            <div className="flex items-center gap-1">
              {diagnostics.some((d) => d.severity === 'error') && (
                <span className="flex items-center gap-1 text-rose-400 text-[10px] bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800/60 font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  {diagnostics.filter((d) => d.severity === 'error').length} ERR
                </span>
              )}
              {diagnostics.some((d) => d.severity === 'warning') && (
                <span className="flex items-center gap-1 text-amber-400 text-[10px] bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {diagnostics.filter((d) => d.severity === 'warning').length} WARN
                </span>
              )}
            </div>
          )}

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors text-[10px]"
            title="কোড কপি করুন"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          {/* Dedicated Run Button inside Editor Header */}
          {onRun && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-all shadow-sm cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 text-white cursor-wait opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
              }`}
              title="কোড কম্পাইল ও রান করুন (F5)"
            >
              <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'চালানো হচ্ছে...' : 'চালান (RUN)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Snippet Chips & Pattern Dropdown Toolbar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto text-[10px] text-slate-400 scrollbar-none">
        {/* Pattern Library Dropdown */}
        <div className="flex items-center gap-1 shrink-0">
          <select
            value={selectedDropdownPattern}
            onChange={handleDropdownSelect}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-800/60 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-950 text-slate-300">
              ⚡ প্যাটার্ন ইনসার্ট করুন (Insert Pattern)...
            </option>
            {PATTERN_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
              <optgroup
                key={cat.id}
                label={`── ${cat.titleBangla} (${cat.titleEnglish}) ──`}
                className="bg-slate-900 font-bold text-slate-400"
              >
                {CODE_PATTERNS.filter((p) => p.category === cat.id).map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-slate-950 text-slate-200 font-normal"
                  >
                    {p.nameBangla} ({p.nameEnglish})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Modal Opener / Command Palette Button */}
        {onOpenPatternLibrary && (
          <button
            onClick={onOpenPatternLibrary}
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-700/60 text-[10px] transition-colors shrink-0 font-medium cursor-pointer"
            title="কোড প্যাটার্ন লাইব্রেরি খুলুন (Ctrl+K)"
          >
            <FolderCode className="w-3 h-3 text-emerald-400" />
            <span>লাইব্রেরি</span>
            <span className="text-[9px] opacity-70 bg-emerald-950 px-1 rounded border border-emerald-800">⌘K</span>
          </button>
        )}

        {/* Gemini AI Assistant Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleOpenAiAssistant(selection.text.trim() ? 'explain' : 'optimize')}
            className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 hover:from-emerald-900 hover:to-cyan-900 text-emerald-300 rounded border border-emerald-600/70 text-[10px] transition-all shrink-0 font-semibold cursor-pointer shadow-sm"
            title="Gemini AI দিয়ে সিলেক্টেড কোড বা সম্পূর্ণ প্রোগ্রাম ব্যাখ্যা/অপ্টিমাইজ করুন (Ctrl+I)"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>AI সহকারী</span>
            <span className="text-[9px] opacity-75 bg-emerald-950 px-1 rounded border border-emerald-800">⌘I</span>
          </button>
        </div>

        <span className="text-slate-600 font-mono text-[10px] shrink-0">|</span>

        {/* Quick Snippet Buttons */}
        <button
          onClick={() =>
            insertSnippet(
              currentDialect === 'bangla' ? 'ছাপাও("স্বাগতম!")\n' : 'কও("বালা আছনি?")\n'
            )
          }
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          {currentDialect === 'bangla' ? 'ছাপাও()' : 'কও()'}
        </button>
        <button
          onClick={() => insertSnippet('ধরি সংখ্যা = ১০\n')}
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          ধরি
        </button>
        <button
          onClick={() =>
            insertSnippet(
              currentDialect === 'bangla'
                ? 'যদি (শর্ত) {\n    \n} নইলে {\n    \n}\n'
                : 'যদি (শর্ত) {\n    \n} নইলে {\n    \n}\n'
            )
          }
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          যদি-নইলে
        </button>
        <button
          onClick={() =>
            insertSnippet(
              currentDialect === 'bangla'
                ? 'যতক্ষণ (কাউন্টার > ০) {\n    কাউন্টার--\n}\n'
                : 'যতক্ষণ (কাউন্টার বেশি ০) {\n    কাউন্টার--\n}\n'
            )
          }
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          যতক্ষণ
        </button>
        <button
          onClick={() =>
            insertSnippet(
              currentDialect === 'bangla'
                ? 'ঘুরুন (ধরি i = ০; i < ১০; i++) {\n    \n}\n'
                : 'ঘুরো (ধরি i = ০; i < ১০; i++) {\n    \n}\n'
            )
          }
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          ঘুরো (for)
        </button>
        <button
          onClick={() =>
            insertSnippet(
              currentDialect === 'bangla'
                ? 'ফাংশন যোগ(ক, খ) {\n    ফেরত ক + খ\n}\n'
                : 'কাম যোগ(ক, খ) {\n    ফেরত ক + খ\n}\n'
            )
          }
          className="px-1.5 py-0.2 bg-slate-900 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 rounded border border-slate-800 transition-colors shrink-0"
        >
          {currentDialect === 'bangla' ? 'ফাংশন' : 'কাম'}
        </button>
      </div>

      {/* Main Code Editing Canvas */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers & Breakpoints Gutter */}
        <div className="w-12 bg-slate-950 text-slate-600 select-none py-2.5 font-mono text-[11px] border-r border-slate-800/80 shrink-0">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isBreakpoint = breakpoints.has(lineNum);
            const isPaused = pausedAtLine === lineNum;
            const isError = errorLines.has(lineNum);
            const isWarning = warningLines.has(lineNum);
            const isCurrent = cursorPos.line === lineNum;

            return (
              <div
                key={i}
                onClick={() => onToggleBreakpoint?.(lineNum)}
                className={`group relative leading-5 h-5 px-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isPaused
                    ? 'bg-amber-500/25 text-amber-300 font-bold border-l-2 border-amber-400'
                    : isBreakpoint
                    ? 'bg-rose-950/40 text-rose-300 font-medium'
                    : isError
                    ? 'text-rose-400 font-bold bg-rose-950/30'
                    : isWarning
                    ? 'text-amber-400 font-bold bg-amber-950/30'
                    : isCurrent
                    ? 'text-slate-300 font-medium bg-slate-900/60'
                    : 'hover:bg-slate-900/80 hover:text-slate-400'
                }`}
                title={
                  isPaused
                    ? `⏸️ Paused at Line ${lineNum}`
                    : isBreakpoint
                    ? `🔴 Breakpoint set at Line ${lineNum} (Click to remove)`
                    : `Click to set breakpoint on Line ${lineNum}`
                }
              >
                {/* Breakpoint Dot / Paused Arrow Indicator */}
                <div className="w-3.5 flex items-center justify-center shrink-0">
                  {isPaused ? (
                    <span className="text-[10px] text-amber-400 font-bold animate-pulse">▶</span>
                  ) : isBreakpoint ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-950 border border-rose-300 shadow-sm block animate-in fade-in zoom-in duration-150"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-rose-500/40 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  )}
                </div>

                {/* Line Number & Diagnostic Pip */}
                <div className="flex items-center gap-1">
                  {isError && !isPaused && <span className="w-1 h-1 rounded-full bg-rose-500"></span>}
                  {isWarning && !isError && !isPaused && <span className="w-1 h-1 rounded-full bg-amber-500"></span>}
                  <span className="text-right font-mono text-[10px]">{lineNum}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            handleSelectOrChange(e);
          }}
          onSelect={handleSelectOrChange}
          onClick={handleSelectOrChange}
          onKeyUp={handleSelectOrChange}
          onKeyDown={handleKeyDown}
          placeholder="সিলেটি বা বাংলা ভাষায় কোড লিখুন... (ব্রেকপয়েন্ট দিতে লাইনের নাম্বারে ক্লিক করুন)"
          spellCheck={false}
          className="flex-1 w-full bg-transparent text-slate-100 p-2.5 leading-5 resize-none focus:outline-none font-mono text-xs selection:bg-emerald-900/60 selection:text-emerald-100 overflow-auto"
          style={{ tabSize: 4 }}
        />

        {/* Floating AI Selection Action Bar */}
        {selection.text.trim().length > 0 && (
          <div className="absolute top-2.5 right-4 z-20 flex items-center gap-1.5 bg-slate-950/95 border border-emerald-500/60 shadow-xl px-2.5 py-1 rounded-full text-xs animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md">
            <span className="text-[10px] text-emerald-300/90 font-mono flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">
                {selection.text.split('\n').length} line{selection.text.split('\n').length > 1 ? 's' : ''}
              </span>
            </span>
            <button
              onClick={() => handleOpenAiAssistant('explain')}
              className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[10px] font-semibold transition-colors shadow-sm cursor-pointer"
              title="সিলেক্ট করা কোড ব্লক ব্যাখ্যা করুন"
            >
              <BookOpen className="w-2.5 h-2.5" />
              <span>ব্যাখ্যা</span>
            </button>
            <button
              onClick={() => handleOpenAiAssistant('optimize')}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-[10px] font-semibold transition-colors shadow-sm cursor-pointer"
              title="সিলেক্ট করা কোড ব্লকের লজিক অপ্টিমাইজ করুন"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>অপ্টিমাইজ</span>
            </button>
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
          <span>Lines: {lines.length}</span>
          <span>Chars: {code.length}</span>
          {breakpoints && breakpoints.size > 0 && (
            <span className="text-rose-400 hidden sm:inline">
              Breakpoints: {Array.from(breakpoints).map(Number).sort((a, b) => a - b).join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pausedAtLine ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1 bg-amber-950/50 px-2 py-0.2 rounded border border-amber-800/60 animate-pulse">
              <span>⏸️ Paused at Line {pausedAtLine}</span>
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LSP Active
            </span>
          )}
        </div>
      </div>

      {/* Gemini AI Code Assistant Modal */}
      <AiCodeAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        selectedCode={selection.text}
        fullCode={code}
        currentDialect={currentDialect}
        initialMode={aiModalMode}
        onApplyOptimization={handleApplyOptimization}
      />
    </div>
  );
};

