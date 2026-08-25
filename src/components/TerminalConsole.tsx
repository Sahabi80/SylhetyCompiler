/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompilerDiagnostic, CompilerPerformanceMetrics } from '../compiler/types';
import { InterpreterOutput, DebugPauseInfo, DebugAction } from '../compiler/interpreter';
import {
  Terminal,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Layers,
  Trash2,
  ArrowRight,
  Download,
  Check,
  Bug,
  Play,
  StepForward,
  Square,
  Search,
  CircleDot,
  Eye,
} from 'lucide-react';

interface TerminalConsoleProps {
  output: InterpreterOutput | null;
  diagnostics: CompilerDiagnostic[];
  isRunning: boolean;
  onClear: () => void;
  onRun?: () => void;
  sourceCode?: string;
  dialect?: string;
  targetTriple?: string;
  performanceMetrics?: CompilerPerformanceMetrics;
  pausedState?: DebugPauseInfo | null;
  onDebugAction?: (action: DebugAction) => void;
  breakpoints?: Set<number>;
  onToggleBreakpoint?: (line: number) => void;
  onClearBreakpoints?: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  output,
  diagnostics,
  isRunning,
  onClear,
  onRun,
  sourceCode = '',
  dialect,
  targetTriple,
  performanceMetrics,
  pausedState,
  onDebugAction,
  breakpoints = new Set(),
  onToggleBreakpoint,
  onClearBreakpoints,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stdout' | 'diagnostics' | 'stack' | 'debugger'>('stdout');
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [varSearchQuery, setVarSearchQuery] = useState<string>('');
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

  const errorList = diagnostics.filter((d) => d.severity === 'error');
  const warningList = diagnostics.filter((d) => d.severity === 'warning');

  // Auto-switch to debugger tab whenever interpreter pauses at a breakpoint or step
  useEffect(() => {
    if (pausedState) {
      setActiveSubTab('debugger');
      setSelectedFrameIndex(Math.max(0, (pausedState.callStack?.length || 1) - 1));
    }
  }, [pausedState]);

  const sourceLines = sourceCode.split('\n');

  const getDataType = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) return 'তালিকা (array)';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'আস্তা (int)' : 'ভাংতি (float)';
    }
    if (typeof val === 'string') return 'লেখা (string)';
    if (typeof val === 'boolean') return 'সত্যমিছা (bool)';
    if (typeof val === 'object') return 'অবজেক্ট (object)';
    return typeof val;
  };

  const handleDownloadLogs = () => {
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleString();

    let report = `======================================================================\n`;
    report += ` SYLHETILANG & BANGLA COMPILER - SESSION LOG REPORT\n`;
    report += ` CSE-4114 Compiler Design Project\n`;
    report += ` Generated: ${dateStr} (${timestamp})\n`;
    report += ` Active Dialect: ${dialect || 'Bangla / Sylheti'}\n`;
    report += ` Target Architecture: ${targetTriple || 'x86_64-linux'}\n`;
    report += `======================================================================\n\n`;

    // Section 1: Source Code
    if (sourceCode) {
      report += `--- [1] SOURCE CODE ---\n`;
      report += `${sourceCode}\n\n`;
    }

    // Section 2: Pipeline Diagnostics
    report += `--- [2] COMPILER PIPELINE DIAGNOSTICS (${diagnostics.length} issues) ---\n`;
    if (diagnostics.length === 0) {
      report += `[OK] All pipeline stages (Lexing, Parsing, Semantic Analysis, Optimization, Codegen) passed with 0 errors/warnings.\n\n`;
    } else {
      diagnostics.forEach((d, idx) => {
        report += `[#${idx + 1}] [${d.stage.toUpperCase()}] ${d.severity.toUpperCase()} at Line ${d.loc.line}, Col ${d.loc.column}\n`;
        report += `     Message: ${d.message}\n`;
        if (d.suggestion) {
          report += `     Suggestion: ${d.suggestion}\n`;
        }
        report += `\n`;
      });
    }

    // Section 3: Performance Telemetry
    if (performanceMetrics) {
      report += `--- [3] COMPILER PERFORMANCE TELEMETRY ---\n`;
      report += `Total Pipeline Time: ${performanceMetrics.totalTimeMs.toFixed(3)} ms\n`;
      report += `Throughput: ${performanceMetrics.throughputLinesPerSec.toLocaleString()} lines/sec\n`;
      report += `Source Metrics: ${performanceMetrics.linesCount} lines | ${performanceMetrics.tokensCount} tokens | ${performanceMetrics.astNodesCount} AST nodes\n`;
      report += `Phases Breakdown:\n`;
      performanceMetrics.phases.forEach((p) => {
        report += `  - ${p.name.padEnd(20)}: ${p.durationMs.toFixed(3).padStart(7)} ms (${p.percentage.toString().padStart(5)}%) | ${p.itemsProcessed} ${p.itemUnit}\n`;
      });
      report += `\n`;
    }

    // Section 4: Execution & Runtime Console Output
    report += `--- [4] VIRTUAL MACHINE EXECUTION OUTPUT ---\n`;
    if (!output && !pausedState) {
      report += `[INFO] Program has not been executed yet in this session.\n\n`;
    } else {
      const activeOutput = output || {
        stdout: pausedState?.stdout || [],
        executionTimeMs: 0,
        totalSteps: pausedState?.totalSteps || 0,
        callStack: pausedState?.callStack || [],
      };

      report += `Execution Status: ${output?.error ? 'FAILED (Runtime Error)' : output?.isStopped ? 'TERMINATED' : pausedState ? 'PAUSED AT BREAKPOINT' : 'SUCCESS (Exit Code 0)'}\n`;
      report += `Execution Time: ${activeOutput.executionTimeMs} ms\n`;
      report += `Instructions Executed: ${activeOutput.totalSteps} steps\n\n`;

      report += `[STDOUT LOG]:\n`;
      if (activeOutput.stdout.length === 0) {
        report += `(No output produced)\n`;
      } else {
        activeOutput.stdout.forEach((line, idx) => {
          report += `[Line ${idx + 1}] ${line}\n`;
        });
      }
      report += `\n`;

      if (output?.error) {
        report += `[RUNTIME ERROR]:\n${output.error}\n\n`;
      }

      if (activeOutput.callStack && activeOutput.callStack.length > 0) {
        report += `[CALL STACK FRAMES]:\n`;
        activeOutput.callStack.forEach((frame, idx) => {
          report += `Frame #${idx}: ${frame.functionName}() at Line ${frame.line}\n`;
          report += `  Scope Variables:\n`;
          Object.entries(frame.variables).forEach(([k, v]) => {
            report += `    ${k}: ${JSON.stringify(v)}\n`;
          });
        });
        report += `\n`;
      }
    }

    report += `======================================================================\n`;
    report += ` END OF LOG REPORT\n`;
    report += `======================================================================\n`;

    // Trigger download
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sylhetilang-log-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    setTimeout(() => setHasDownloaded(false), 2000);
  };

  // Extract variables for currently inspected frame or paused state
  const inspectedVariables =
    pausedState?.callStack && pausedState.callStack[selectedFrameIndex]
      ? pausedState.callStack[selectedFrameIndex].variables
      : pausedState?.variables || (output?.callStack && output.callStack[0]?.variables) || {};

  const filteredVarEntries = Object.entries(inspectedVariables).filter(([key]) =>
    key.toLowerCase().includes(varSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Interactive Debugging Bar when Paused */}
      {pausedState && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/80 border-b border-amber-600/60 text-amber-200 text-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-semibold text-amber-100 flex items-center gap-1">
              <span>⏸️ লাইনে বিরতি: {pausedState.line}</span>
              <span className="text-[10px] text-amber-300/80 font-normal">({pausedState.statementType})</span>
            </span>
            <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-700/50 text-amber-300">
              ধাপ: {pausedState.totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDebugAction?.('continue')}
              className="flex items-center gap-1 px-2.5 py-0.8 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
              title="পরবর্তী ব্রেকপয়েন্ট পর্যন্ত চালান (F5)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>চালিয়ে যান (F5)</span>
            </button>

            <button
              onClick={() => onDebugAction?.('step')}
              className="flex items-center gap-1 px-2.5 py-0.8 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
              title="এক ধাপ সামনে এগোন (F10)"
            >
              <StepForward className="w-3 h-3" />
              <span>পরের ধাপ (F10)</span>
            </button>

            <button
              onClick={() => onDebugAction?.('stop')}
              className="flex items-center gap-1 px-2 py-0.8 bg-rose-700 hover:bg-rose-600 text-white rounded font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
              title="ডিবাগ থামান (Shift+F5)"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>থামান</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Console Content */}
      <div className="flex-1 p-2.5 overflow-auto text-xs leading-5">
        {/* Tab 1: Standard Output */}
        {activeSubTab === 'stdout' && (
          <div className="space-y-0.5">
            {isRunning && !pausedState && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs animate-pulse py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Executing virtual machine...</span>
              </div>
            )}

            {pausedState && (
              <div className="flex items-center justify-between p-2 bg-amber-950/40 border border-amber-800/50 rounded text-xs text-amber-200 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Execution paused at line {pausedState.line}. Click &apos;DEBUGGER&apos; tab to inspect variables.</span>
                </span>
                <button
                  onClick={() => setActiveSubTab('debugger')}
                  className="text-[10px] px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium"
                >
                  Inspect State →
                </button>
              </div>
            )}

            {!isRunning && !output && !pausedState && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <p className="text-slate-500 text-xs font-mono">
                  কোড চালানোর জন্য প্রস্তুত (Ready to execute Sylheti / Bangla code)
                </p>
                {onRun && (
                  <button
                    onClick={onRun}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>কোড চালান (RUN CODE)</span>
                    <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded border border-emerald-500/40">F5</span>
                  </button>
                )}
              </div>
            )}

            {/* Display stdout (from either active pausedState or completed output) */}
            {((output?.stdout && output.stdout.length > 0) || (pausedState?.stdout && pausedState.stdout.length > 0)) ? (
              (output?.stdout || pausedState?.stdout || []).map((line, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-slate-200 hover:bg-slate-900/60 px-1 py-0.5 rounded text-xs font-mono">
                  <span className="text-emerald-400 select-none font-bold">›</span>
                  <span className="whitespace-pre-wrap break-all">{line}</span>
                </div>
              ))
            ) : output && !output.error && (
              <div className="text-slate-500 text-xs italic py-1">
                // Process executed with no stdout output.
              </div>
            )}

            {output?.error && (
              <div className="mt-2 p-2 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-rose-200 mb-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>RUNTIME ERROR:</span>
                </div>
                <div className="text-rose-300 font-mono pl-5 text-[11px]">{output.error}</div>
              </div>
            )}

            {output?.isStopped && (
              <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <Square className="w-3 h-3 text-rose-400" />
                <span>Execution terminated by user.</span>
              </div>
            )}

            {output && !output.error && !output.isStopped && !isRunning && !pausedState && (
              <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                <span>Process terminated with exit status: 0 (OK)</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: DEBUGGER & STATE INSPECTOR */}
        {activeSubTab === 'debugger' && (
          <div className="space-y-3">
            {/* Breakpoints Sub-Section */}
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5 text-rose-400" />
                  <span>ব্রেকপয়েন্টসমূহ (Active Breakpoints - {breakpoints.size})</span>
                </span>
                {breakpoints.size > 0 && onClearBreakpoints && (
                  <button
                    onClick={onClearBreakpoints}
                    className="text-[10px] text-rose-400 hover:text-rose-200 underline"
                  >
                    সব মুছুন (Clear All)
                  </button>
                )}
              </div>

              {breakpoints.size === 0 ? (
                <div className="text-[11px] text-slate-500 italic py-1">
                  কোনো ব্রেকপয়েন্ট নির্ধারণ করা হয়নি। কোড এডিটরের লাইনের নাম্বারে ক্লিক করে ব্রেকপয়েন্ট যুক্ত করুন।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {Array.from(breakpoints)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((lineNum: number) => {
                      const codeLine = sourceLines[lineNum - 1] || '';
                      const isCurrent = pausedState?.line === lineNum;

                      return (
                        <div
                          key={lineNum}
                          className={`flex items-center justify-between p-1.5 rounded border text-[11px] font-mono ${
                            isCurrent
                              ? 'bg-amber-950/50 border-amber-600/70 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                            <span className="font-bold text-rose-300 shrink-0">Ln {lineNum}:</span>
                            <span className="text-slate-400 truncate text-[10px]">
                              {codeLine.trim() || '(empty line)'}
                            </span>
                          </div>
                          {onToggleBreakpoint && (
                            <button
                              onClick={() => onToggleBreakpoint(lineNum)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 ml-1 shrink-0"
                              title="ব্রেকপয়েন্ট মুছুন"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Scope Variables Inspector */}
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>চলকসমূহের অবস্থা ও মান (Scope Variables)</span>
                  </span>
                  {pausedState?.callStack && pausedState.callStack.length > 1 && (
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                      ফ্রেম #{selectedFrameIndex}: {pausedState.callStack[selectedFrameIndex]?.functionName}()
                    </span>
                  )}
                </div>

                {/* Variable Search Filter */}
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    value={varSearchQuery}
                    onChange={(e) => setVarSearchQuery(e.target.value)}
                    placeholder="চলক খুঁজুন (Search)..."
                    className="w-full bg-slate-950 text-slate-200 text-[10px] pl-6 pr-2 py-0.8 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3 h-3 text-slate-500 absolute left-1.5 top-1.5" />
                </div>
              </div>

              {filteredVarEntries.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic py-2">
                  {varSearchQuery
                    ? `'${varSearchQuery}' নামের কোনো চলক এই স্কোপে পাওয়া যায়নি।`
                    : pausedState
                    ? 'বর্তমান ফ্রেমের স্কোপে কোনো সক্রিয় লোকাল চলক সংজ্ঞায়িত নেই।'
                    : 'প্রোগ্রামটি রান বা ডিবাগ করলে চলকসমূহের লাইভ মান এখানে দেখা যাবে।'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="py-1 px-2">চলকের নাম (Identifier)</th>
                        <th className="py-1 px-2">ডাটা টাইপ (Type)</th>
                        <th className="py-1 px-2">বর্তমান মান (Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredVarEntries.map(([varName, varVal]) => {
                        const typeLabel = getDataType(varVal);
                        const isNum = typeof varVal === 'number';
                        const isStr = typeof varVal === 'string';
                        const isBool = typeof varVal === 'boolean';
                        const isArr = Array.isArray(varVal);

                        return (
                          <tr key={varName} className="hover:bg-slate-950/60 transition-colors">
                            <td className="py-1.5 px-2 font-bold text-emerald-300">
                              {varName}
                            </td>
                            <td className="py-1.5 px-2">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                                {typeLabel}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 font-semibold">
                              {isNum && <span className="text-emerald-400">{varVal}</span>}
                              {isStr && <span className="text-cyan-300">&quot;{varVal}&quot;</span>}
                              {isBool && (
                                <span className={varVal ? 'text-emerald-400' : 'text-rose-400'}>
                                  {varVal ? 'হাছা (true)' : 'মিছা (false)'}
                                </span>
                              )}
                              {isArr && (
                                <span className="text-purple-300 font-mono">
                                  [{varVal.map((v) => JSON.stringify(v)).join(', ')}]
                                </span>
                              )}
                              {!isNum && !isStr && !isBool && !isArr && (
                                <span className="text-slate-300">{JSON.stringify(varVal)}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Execution Snapshot Telemetry */}
            {pausedState && (
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>Current AST Node: <strong className="text-cyan-400">{pausedState.statementType}</strong></span>
                <span>Active Stack Depth: <strong className="text-purple-400">{pausedState.callStack?.length || 1} frame(s)</strong></span>
                <span>VM Instruction Step: <strong className="text-amber-400">{pausedState.totalSteps}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Compiler Diagnostics & Error Recovery */}
        {activeSubTab === 'diagnostics' && (
          <div className="space-y-1.5">
            {diagnostics.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 p-2.5 bg-emerald-950/30 rounded border border-emerald-900/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All pipeline stages verified without errors or warnings.</span>
              </div>
            ) : (
              diagnostics.map((diag, i) => {
                const isErr = diag.severity === 'error';
                return (
                  <div
                    key={i}
                    className={`p-2 rounded border ${
                      isErr
                        ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        {isErr ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-[11px] uppercase tracking-wider">
                          [{diag.stage.toUpperCase()}] {diag.severity.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                        Ln {diag.loc.line}, Col {diag.loc.column}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-200 pl-5 mb-0.5">{diag.message}</p>

                    {diag.suggestion && (
                      <div className="ml-5 mt-1 p-1.5 bg-slate-900/90 rounded border border-slate-800 text-[10px] text-cyan-300 flex items-center gap-1">
                        <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Fix hint: {diag.suggestion}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 4: Call Stack & Execution Frames */}
        {activeSubTab === 'stack' && (
          <div className="space-y-2">
            {((pausedState?.callStack && pausedState.callStack.length > 0) ||
              (output?.callStack && output.callStack.length > 0)) ? (
              (pausedState?.callStack || output?.callStack || []).map((frame, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedFrameIndex(idx)}
                  className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                    selectedFrameIndex === idx
                      ? 'bg-slate-900 border-cyan-700/80 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-300 font-medium mb-1.5 pb-1 border-b border-slate-800 text-[11px]">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Frame #{idx}: {frame.functionName}()
                      {selectedFrameIndex === idx && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-800">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Line {frame.line}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <span className="text-slate-500 text-[9px] uppercase tracking-wider block">Scope Variables:</span>
                    {Object.keys(frame.variables).length === 0 ? (
                      <span className="text-slate-600 italic">Empty frame</span>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-0.5">
                        {Object.entries(frame.variables).map(([k, v]) => (
                          <div key={k} className="p-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-400">{k}:</span>
                            <span className="text-slate-200 font-semibold">{JSON.stringify(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs italic py-2">
                // Run or debug a program with function calls to inspect execution frames & call stack.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
