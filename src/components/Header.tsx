/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Sparkles, BookOpen, CheckCircle, RefreshCw, Globe, Cpu, Sun, Moon, FolderCode } from 'lucide-react';
import { SAMPLE_PROGRAMS, SampleProgram } from '../data/sample_programs';
import { DialectType } from '../compiler/dialect_mapper';
import { LLVM_TARGETS } from '../compiler/codegen_llvm';

interface HeaderProps {
  currentDialect: DialectType;
  onDialectChange: (dialect: DialectType) => void;
  selectedSampleId: string;
  onSelectSample: (sample: SampleProgram) => void;
  onRun: () => void;
  isRunning: boolean;
  onOpenGrammar: () => void;
  onOpenCSEChecklist: () => void;
  onOpenPatternLibrary?: () => void;
  onResetCode: () => void;
  selectedTarget: string;
  onTargetChange: (target: string) => void;
  hasErrors: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDialect,
  onDialectChange,
  selectedSampleId,
  onSelectSample,
  onRun,
  isRunning,
  onOpenGrammar,
  onOpenCSEChecklist,
  onOpenPatternLibrary,
  onResetCode,
  selectedTarget,
  onTargetChange,
  hasErrors,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 shrink-0 select-none">
      {/* Left: Brand & Badges */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm font-mono">
          সি
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="font-mono font-bold tracking-tight text-emerald-400 text-sm sm:text-base flex items-center gap-1.5">
            <span>SYLHET-IR</span>
            <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
              v2.4
            </span>
          </h1>
          <span className="hidden md:inline-block text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            [CSE-4114 Sessional]
          </span>
        </div>

        {/* Dense Status Tags */}
        <div className="hidden xl:flex items-center gap-3 pl-3 ml-2 border-l border-slate-800 text-[10px] font-mono uppercase tracking-wider">
          <span className="text-slate-500">
            Backend: <b className="text-slate-300 font-semibold">LLVM-16</b>
          </span>
          <span className="text-slate-500">
            Engine: <b className="text-slate-300 font-semibold">Native TAC</b>
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </span>
        </div>
      </div>

      {/* Right: Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sample Preset Selector */}
        <div className="relative">
          <select
            value={selectedSampleId}
            onChange={(e) => {
              const sample = SAMPLE_PROGRAMS.find((s) => s.id === e.target.value);
              if (sample) onSelectSample(sample);
            }}
            className="bg-slate-950 text-slate-300 text-xs rounded px-2.5 py-1 border border-slate-800 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-mono"
          >
            <option value="" disabled>-- কোড নমুনা --</option>
            {SAMPLE_PROGRAMS.map((sample) => (
              <option key={sample.id} value={sample.id} className="bg-slate-900 text-slate-200">
                {sample.titleBangla}
              </option>
            ))}
          </select>
        </div>

        {/* Dialect Switcher */}
        <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => onDialectChange('sylheti')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentDialect === 'sylheti'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="সিলেটি কথ্য রূপ (কও, রাখইন, হাছা/মিছা)"
          >
            সিলেটি
          </button>
          <button
            onClick={() => onDialectChange('bangla')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentDialect === 'bangla'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="শুদ্ধ বাংলা রূপ (ছাপাও, ধরি, সত্য/মিথ্যা)"
          >
            বাংলা
          </button>
          <button
            onClick={() => onDialectChange('phonetic')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentDialect === 'phonetic'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Romanized Phonetic (kwa, dhori, hasa)"
          >
            Phonetic
          </button>
        </div>

        {/* LLVM Target Triple Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={selectedTarget}
            onChange={(e) => onTargetChange(e.target.value)}
            className="bg-transparent text-[11px] text-slate-200 focus:outline-none cursor-pointer"
          >
            {Object.entries(LLVM_TARGETS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-slate-900 text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Grammar Button */}
        <button
          onClick={onOpenGrammar}
          className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-xs border border-slate-800 transition-colors font-mono"
          title="Grammar, Keywords & Dialect Dictionary"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">ব্যাকরণ</span>
        </button>

        {/* Code Patterns Library Button */}
        {onOpenPatternLibrary && (
          <button
            onClick={onOpenPatternLibrary}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 rounded text-xs border border-emerald-800/60 transition-colors font-mono"
            title="কোড প্যাটার্ন ও স্নিপেট লাইব্রেরি (Command Palette / Ctrl+K)"
          >
            <FolderCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">প্যাটার্ন</span>
            <span className="hidden md:inline text-[9px] opacity-70 bg-emerald-950 px-1 rounded border border-emerald-800">⌘K</span>
          </button>
        )}

        {/* CSE-4114 Sessional Evaluation Suite */}
        <button
          onClick={onOpenCSEChecklist}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 rounded text-xs border border-indigo-800/60 transition-colors font-mono"
          title="CSE-4114 Review 1, 2, 3 Sessional Checklist"
        >
          <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">CSE-4114</span>
        </button>

        {/* Theme Toggle Button (Dark / High-Contrast Light Mode) */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs border font-mono transition-colors ${
            theme === 'light'
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
          title={
            theme === 'dark'
              ? 'হালকা মোড চালু করুন (High-Contrast Light Theme for Presentations)'
              : 'ডার্ক মোড চালু করুন (Dark Slate Theme)'
          }
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline font-semibold">DARK</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-semibold">LIGHT</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onResetCode}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition-colors"
          title="কোড রিসেট করুন"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold font-mono tracking-wide transition-all shadow-sm ${
            isRunning
              ? 'bg-amber-600 text-white cursor-wait opacity-80'
              : hasErrors
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
          }`}
        >
          <Play className={`w-3 h-3 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'RUNNING...' : 'COMPILE & RUN'}</span>
        </button>
      </div>
    </header>
  );
};
