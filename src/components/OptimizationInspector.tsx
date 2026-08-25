/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OptimizationMetrics, ProgramNode } from '../compiler/types';
import { Sparkles, TrendingDown, CheckCircle, Zap, Layers, RefreshCw } from 'lucide-react';

interface OptimizationInspectorProps {
  metrics: OptimizationMetrics;
  originalAst: ProgramNode | null;
  optimizedAst: ProgramNode | null;
}

export const OptimizationInspector: React.FC<OptimizationInspectorProps> = ({
  metrics,
  originalAst,
  optimizedAst,
}) => {
  const nodeReduction = metrics.originalNodeCount > 0
    ? Math.max(0, Math.round(((metrics.originalNodeCount - metrics.optimizedNodeCount) / metrics.originalNodeCount) * 100))
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-200">
            OPTIMIZATION PIPELINE (O1 / O2 PASSES)
          </span>
        </div>

        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider font-semibold">
          Constant Folding & DCE Active
        </span>
      </div>

      {/* Metrics Stat Cards */}
      <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>কনস্ট্যান্ট ফোল্ডিং</span>
          </div>
          <div className="text-lg font-bold text-amber-300">{metrics.constantsFolded}</div>
          <span className="text-[9px] text-slate-500 uppercase">Arithmetic folded</span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <span>ডেড কোড অপসারণ</span>
          </div>
          <div className="text-lg font-bold text-rose-300">{metrics.deadCodeNodesRemoved}</div>
          <span className="text-[9px] text-slate-500 uppercase">Blocks pruned</span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>AST নোড হ্রাস</span>
          </div>
          <div className="text-lg font-bold text-cyan-300">{nodeReduction}%</div>
          <span className="text-[9px] text-slate-500 font-mono">
            {metrics.originalNodeCount} &rarr; {metrics.optimizedNodeCount} nodes
          </span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>কনস্ট্যান্ট প্রোপাগেশন</span>
          </div>
          <div className="text-lg font-bold text-emerald-300">{metrics.subexpressionsEliminated}</div>
          <span className="text-[9px] text-slate-500 uppercase">Subexpressions</span>
        </div>
      </div>

      {/* Side-by-side comparison explanation */}
      <div className="flex-1 p-3 overflow-auto space-y-3 text-xs">
        <div className="p-3 bg-slate-950 rounded border border-slate-800 leading-relaxed text-slate-300 space-y-1.5 text-xs">
          <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            অপটিমাইজেশন পাসের কার্যপদ্ধতি (Compiler Passes):
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
            <li>
              <strong>১. কনস্ট্যান্ট ফোল্ডিং (Constant Folding):</strong> কম্পাইল টাইমে গণনাযোগ্য এক্সপ্রেশন যেমন{' '}
              <code className="text-emerald-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">১০ + ২০ * ২</code> সরাসরি{' '}
              <code className="text-amber-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">৫০</code> এ রূপান্তরিত হয়।
            </li>
            <li>
              <strong>২. অ্যালজেব্রাইক সরলীকরণ (Algebraic Identities):</strong>{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">x + 0 &rarr; x</code>,{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">x * 1 &rarr; x</code>,{' '}
              <code className="text-cyan-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">x * 0 &rarr; 0</code> নির্দেশনাগুলো সরাসরি অপটিমাইজ করা হয়।
            </li>
            <li>
              <strong>৩. ডেড কোড এলিমিনেশন (Dead Code Elimination):</strong> মিথ্যা শর্তযুক্ত ব্লক{' '}
              <code className="text-rose-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">যদি (মিছা) &#123; ... &#125;</code> এবং ফাংশনে{' '}
              <code className="text-indigo-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">ফেরত</code> এর পরের অপরিবর্তনশীল কোড মুছে ফেলা হয়।
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
