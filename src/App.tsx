/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAutoSave } from './hooks/useAutoSave';
import { CompilerEngine } from './compiler/engine';
import { Interpreter, InterpreterOutput, DebugPauseInfo, DebugAction } from './compiler/interpreter';
import { DialectMapper, DialectType } from './compiler/dialect_mapper';
import { SAMPLE_PROGRAMS, SampleProgram } from './data/sample_programs';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { TerminalConsole } from './components/TerminalConsole';
import { ASTVisualizer } from './components/ASTVisualizer';
import { SymbolTableViewer } from './components/SymbolTableViewer';
import { LLVMViewer } from './components/LLVMViewer';
import { TACVisualizer } from './components/TACVisualizer';
import { OptimizationInspector } from './components/OptimizationInspector';
import { TranspilerViewer } from './components/TranspilerViewer';
import { CompilerPerformanceViewer } from './components/CompilerPerformanceViewer';
import { CSE4114ReviewPanel } from './components/CSE4114ReviewPanel';
import { GrammarModal } from './components/GrammarModal';
import { PatternLibraryModal } from './components/PatternLibraryModal';
import {
  Terminal,
  FolderTree,
  Table,
  Cpu,
  GitFork,
  Sparkles,
  FileCode,
  Layers,
  Activity,
} from 'lucide-react';

export type WorkspaceTab =
  | 'console'
  | 'ast'
  | 'symbols'
  | 'tac'
  | 'llvm'
  | 'optimizer'
  | 'transpilers'
  | 'performance';

export default function App() {
  // Auto-Save Source Code Hook
  const {
    code: sourceCode,
    setCode: setSourceCode,
    isSaving: isAutoSaving,
    lastSavedAt,
    saveNow,
    clearSavedCode,
  } = useAutoSave(SAMPLE_PROGRAMS[0].code, {
    key: 'sylhetilang_autosave_code',
    delayMs: 1500,
  });

  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const [currentDialect, setCurrentDialect] = useState<DialectType>('sylheti');
  const [selectedTarget, setSelectedTarget] = useState<string>('x86_64-linux');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('console');

  // Breakpoints & Interactive Debugging State
  const [breakpoints, setBreakpoints] = useState<Set<number>>(() => new Set());
  const [pausedState, setPausedState] = useState<DebugPauseInfo | null>(null);
  const debugActionResolverRef = useRef<((action: DebugAction) => void) | null>(null);
  const activeInterpreterRef = useRef<Interpreter | null>(null);

  // Compilation & Execution State
  const [compilationResult, setCompilationResult] = useState(() =>
    CompilerEngine.compile(sourceCode, 'x86_64-linux')
  );
  const [interpreterOutput, setInterpreterOutput] = useState<InterpreterOutput | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Modals
  const [isGrammarOpen, setIsGrammarOpen] = useState(false);
  const [isCSEChecklistOpen, setIsCSEChecklistOpen] = useState(false);
  const [isPatternLibraryOpen, setIsPatternLibraryOpen] = useState(false);

  // Toggle Breakpoint on Line Number
  const handleToggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  }, []);

  const handleClearBreakpoints = useCallback(() => {
    setBreakpoints(new Set());
  }, []);

  // Handle Debug Action (Continue, Step, Stop)
  const handleDebugAction = useCallback((action: DebugAction) => {
    if (action === 'stop') {
      if (activeInterpreterRef.current) {
        activeInterpreterRef.current.stop();
      }
      setPausedState(null);
      if (debugActionResolverRef.current) {
        debugActionResolverRef.current('stop');
        debugActionResolverRef.current = null;
      }
      return;
    }

    if (debugActionResolverRef.current) {
      const resolver = debugActionResolverRef.current;
      debugActionResolverRef.current = null;
      setPausedState(null);
      resolver(action);
    }
  }, []);

  // Keyboard Shortcuts for Debugging (F5, F10, Shift+F5) and Palette (Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPatternLibraryOpen((prev) => !prev);
        return;
      }

      // Continue / Run (F5)
      if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault();
        if (pausedState) {
          handleDebugAction('continue');
        } else {
          handleRun();
        }
        return;
      }

      // Step Over (F10)
      if (e.key === 'F10') {
        e.preventDefault();
        if (pausedState) {
          handleDebugAction('step');
        }
        return;
      }

      // Stop (Shift + F5)
      if (e.key === 'F5' && e.shiftKey) {
        e.preventDefault();
        handleDebugAction('stop');
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pausedState, handleDebugAction]);

  // Theme State: 'dark' (default) or 'light' (high-contrast presentation mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sylhet_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sylhet_theme', nextTheme);
      } catch {}
      return nextTheme;
    });
  }, []);

  // Re-compile whenever code or target triple changes
  useEffect(() => {
    const result = CompilerEngine.compile(sourceCode, selectedTarget);
    setCompilationResult(result);
  }, [sourceCode, selectedTarget]);

  // Run or Debug the code via Virtual Machine
  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setPausedState(null);
    setActiveTab('console');

    // Make sure we have latest compilation
    const result = CompilerEngine.compile(sourceCode, selectedTarget);
    setCompilationResult(result);

    if (result.hasErrors) {
      setIsRunning(false);
      return;
    }

    const interpreter = new Interpreter(async (promptText) => {
      const inputVal = window.prompt(promptText || 'ইনপুট মান প্রদান করুন:') || '0';
      return inputVal;
    });

    activeInterpreterRef.current = interpreter;

    // Hook breakpoint pause handler
    const output = await interpreter.run(
      result.optimizedAst || result.ast!,
      breakpoints,
      async (pauseInfo) => {
        setPausedState(pauseInfo);
        return new Promise<DebugAction>((resolve) => {
          debugActionResolverRef.current = resolve;
        });
      }
    );

    setInterpreterOutput(output);
    setPausedState(null);
    activeInterpreterRef.current = null;
    debugActionResolverRef.current = null;
    setIsRunning(false);
  }, [sourceCode, selectedTarget, breakpoints]);

  // Run automatically on first mount
  useEffect(() => {
    handleRun();
  }, []);

  // Dialect conversion
  const handleDialectChange = (newDialect: DialectType) => {
    if (newDialect === currentDialect) return;
    const translated = DialectMapper.translate(sourceCode, currentDialect, newDialect);
    setSourceCode(translated);
    setCurrentDialect(newDialect);
  };

  // Sample load
  const handleSelectSample = (sample: SampleProgram) => {
    setSelectedSampleId(sample.id);
    setSourceCode(sample.code);
    setCurrentDialect('sylheti');
  };

  // Reset code
  const handleResetCode = () => {
    const defaultSample = SAMPLE_PROGRAMS[0];
    setSelectedSampleId(defaultSample.id);
    setSourceCode(defaultSample.code);
    setCurrentDialect('sylheti');
    clearSavedCode();
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-200 ${
        theme === 'light'
          ? 'theme-light bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Header */}
      <Header
        currentDialect={currentDialect}
        onDialectChange={handleDialectChange}
        selectedSampleId={selectedSampleId}
        onSelectSample={handleSelectSample}
        onRun={handleRun}
        isRunning={isRunning}
        onOpenGrammar={() => setIsGrammarOpen(true)}
        onOpenCSEChecklist={() => setIsCSEChecklistOpen(true)}
        onOpenPatternLibrary={() => setIsPatternLibraryOpen(true)}
        onResetCode={handleResetCode}
        selectedTarget={selectedTarget}
        onTargetChange={setSelectedTarget}
        hasErrors={compilationResult.hasErrors}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row p-2 gap-2 overflow-hidden">
        {/* Left Column: Code Editor */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col min-h-0">
          <CodeEditor
            code={sourceCode}
            onChange={setSourceCode}
            diagnostics={compilationResult.diagnostics}
            isAutoSaving={isAutoSaving}
            lastSavedAt={lastSavedAt}
            onOpenPatternLibrary={() => setIsPatternLibraryOpen(true)}
            currentDialect={currentDialect}
            onRun={handleRun}
            isRunning={isRunning}
            breakpoints={breakpoints}
            onToggleBreakpoint={handleToggleBreakpoint}
            onClearBreakpoints={handleClearBreakpoints}
            pausedAtLine={pausedState?.line}
          />
        </div>

        {/* Right Column: Multi-Stage Compiler Inspector */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
          {/* Workspace Tabs Navigation */}
          <div className="flex items-center px-1.5 py-1 bg-slate-950 border-b border-slate-800 overflow-x-auto text-[11px] font-mono scrollbar-none gap-0.5 shrink-0">
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'console'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>TERMINAL</span>
            </button>

            <button
              onClick={() => setActiveTab('ast')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'ast'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span>AST</span>
            </button>

            <button
              onClick={() => setActiveTab('symbols')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'symbols'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>SYMBOLS</span>
            </button>

            <button
              onClick={() => setActiveTab('tac')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'tac'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-3 h-3" />
              <span>TAC / CFG</span>
            </button>

            <button
              onClick={() => setActiveTab('llvm')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'llvm'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>LLVM IR</span>
            </button>

            <button
              onClick={() => setActiveTab('optimizer')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'optimizer'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>OPTIMIZER</span>
            </button>

            <button
              onClick={() => setActiveTab('transpilers')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'transpilers'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>PYTHON / C</span>
            </button>

            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>PERFORMANCE</span>
            </button>
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'console' && (
              <TerminalConsole
                output={interpreterOutput}
                diagnostics={compilationResult.diagnostics}
                isRunning={isRunning}
                onRun={handleRun}
                onClear={() => setInterpreterOutput(null)}
                sourceCode={sourceCode}
                dialect={currentDialect}
                targetTriple={selectedTarget}
                performanceMetrics={compilationResult.performanceMetrics}
                pausedState={pausedState}
                onDebugAction={handleDebugAction}
                breakpoints={breakpoints}
                onToggleBreakpoint={handleToggleBreakpoint}
                onClearBreakpoints={handleClearBreakpoints}
              />
            )}

            {activeTab === 'ast' && (
              <ASTVisualizer ast={compilationResult.optimizedAst || compilationResult.ast} />
            )}

            {activeTab === 'symbols' && (
              <SymbolTableViewer rootScope={compilationResult.symbolTable} />
            )}

            {activeTab === 'tac' && (
              <TACVisualizer tac={compilationResult.tac} cfg={compilationResult.cfg} />
            )}

            {activeTab === 'llvm' && (
              <LLVMViewer
                llvmIR={compilationResult.llvmIR}
                selectedTarget={selectedTarget}
                onTargetChange={setSelectedTarget}
              />
            )}

            {activeTab === 'optimizer' && (
              <OptimizationInspector
                metrics={compilationResult.optimizationMetrics}
                originalAst={compilationResult.ast}
                optimizedAst={compilationResult.optimizedAst || null}
              />
            )}

            {activeTab === 'transpilers' && (
              <TranspilerViewer
                pythonCode={compilationResult.pythonCode}
                cCode={compilationResult.cCode}
              />
            )}

            {activeTab === 'performance' && (
              <CompilerPerformanceViewer
                performanceMetrics={compilationResult.performanceMetrics}
                sourceCode={sourceCode}
                targetTriple={selectedTarget}
              />
            )}
          </div>
        </div>
      </div>

      {/* CSE-4114 Review Checklist Modal */}
      <CSE4114ReviewPanel
        isOpen={isCSEChecklistOpen}
        onClose={() => setIsCSEChecklistOpen(false)}
        onLoadTestCode={(code) => setSourceCode(code)}
      />

      {/* Grammar & EBNF Modal */}
      <GrammarModal
        isOpen={isGrammarOpen}
        onClose={() => setIsGrammarOpen(false)}
      />

      {/* Code Patterns Library Modal / Command Palette */}
      <PatternLibraryModal
        isOpen={isPatternLibraryOpen}
        onClose={() => setIsPatternLibraryOpen(false)}
        onInsertPattern={(snippet) => {
          setSourceCode((prev) => {
            if (!prev.trim()) return snippet;
            return prev.endsWith('\n') ? prev + snippet : prev + '\n' + snippet;
          });
        }}
        currentDialect={currentDialect}
      />
    </div>
  );
}
