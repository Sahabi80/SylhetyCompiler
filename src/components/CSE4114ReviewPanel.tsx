/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CSE4114_REVIEWS, ReviewRequirement } from '../data/cse4114_specs';
import { CompilerEngine } from '../compiler/engine';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Play, Sparkles, Shield, X, Award } from 'lucide-react';

interface CSE4114ReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTestCode: (code: string) => void;
}

export const CSE4114ReviewPanel: React.FC<CSE4114ReviewPanelProps> = ({
  isOpen,
  onClose,
  onLoadTestCode,
}) => {
  const [testResults, setTestResults] = useState<Record<string, 'passed' | 'failed' | 'pending'>>({});
  const [activeReviewTab, setActiveReviewTab] = useState<1 | 2 | 3>(1);
  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const filteredTests = CSE4114_REVIEWS.filter((r) => r.reviewNumber === activeReviewTab);

  const runSingleTest = (req: ReviewRequirement) => {
    try {
      const res = CompilerEngine.compile(req.testCode);
      const passed = req.validationCheck(res);
      setTestResults((prev) => ({
        ...prev,
        [req.id]: passed ? 'passed' : 'failed',
      }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [req.id]: 'failed',
      }));
    }
  };

  const runAllTests = () => {
    setIsRunningTests(true);
    const newResults: Record<string, 'passed' | 'failed'> = {};
    let allPassed = true;

    for (const req of CSE4114_REVIEWS) {
      try {
        const res = CompilerEngine.compile(req.testCode);
        const passed = req.validationCheck(res);
        newResults[req.id] = passed ? 'passed' : 'failed';
        if (!passed) allPassed = false;
      } catch (e) {
        newResults[req.id] = 'failed';
        allPassed = false;
      }
    }

    setTestResults(newResults);
    setIsRunningTests(false);

    if (allPassed) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const totalPassed = Object.values(testResults).filter((s) => s === 'passed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                CSE-4114: COMPILER DESIGN AND CONSTRUCTION SESSIONAL
              </h2>
              <p className="text-[10px] text-slate-400">
                Official Review 1, Review 2 & Review 3 Automated Evaluation Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isRunningTests ? 'EVALUATING...' : 'RUN ALL TESTS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Review Milestones Navigation */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[11px] shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveReviewTab(1)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeReviewTab === 1
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Review 1: Lexer, Parser & Semantic
            </button>
            <button
              onClick={() => setActiveReviewTab(2)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeReviewTab === 2
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Review 2: TAC Codegen & Recovery
            </button>
            <button
              onClick={() => setActiveReviewTab(3)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeReviewTab === 3
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              Review 3: Loops & LLVM IR
            </button>
          </div>

          <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
            PASSED: {totalPassed} / {CSE4114_REVIEWS.length} TESTS
          </div>
        </div>

        {/* Tests List */}
        <div className="flex-1 p-3 overflow-auto space-y-2 text-xs">
          {filteredTests.map((req) => {
            const status = testResults[req.id] || 'pending';

            return (
              <div
                key={req.id}
                className="p-2.5 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0"></div>
                    )}
                    <span className="font-bold text-xs text-slate-100">{req.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onLoadTestCode(req.testCode);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                    >
                      Load in Editor
                    </button>
                    <button
                      onClick={() => runSingleTest(req)}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pl-6">{req.description}</p>

                <div className="pl-6 pt-0.5">
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800/80 font-mono text-[10px] text-slate-300">
                    <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Test Payload:</span>
                    {req.testCode}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
