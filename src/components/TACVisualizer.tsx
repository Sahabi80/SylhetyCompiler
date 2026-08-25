/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ControlFlowGraph, TACInstruction } from '../compiler/types';
import { Network, GitFork, ArrowDown, Hash, ListOrdered, CheckCircle2 } from 'lucide-react';

interface TACVisualizerProps {
  tac: TACInstruction[];
  cfg: ControlFlowGraph;
}

export const TACVisualizer: React.FC<TACVisualizerProps> = ({ tac, cfg }) => {
  const [viewMode, setViewMode] = useState<'tac' | 'cfg'>('tac');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-200">
            3-ADDRESS CODE & CONTROL FLOW GRAPH
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setViewMode('tac')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === 'tac' ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-2.5 h-2.5" />
            <span>TAC / QUADRUPLES</span>
          </button>
          <button
            onClick={() => setViewMode('cfg')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === 'cfg' ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-2.5 h-2.5" />
            <span>CFG BLOCKS</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2.5 text-xs">
        {viewMode === 'tac' ? (
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
              <span>Total TAC Instructions: <strong className="text-amber-400">{tac.length}</strong></span>
              <span className="text-slate-500 font-mono">Quadruples IR (Op, Arg1, Arg2, Res)</span>
            </div>

            {tac.length === 0 ? (
              <div className="text-slate-500 italic text-center p-3 text-xs">No TAC instructions generated.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="pb-1 pl-1 font-mono">#ID</th>
                    <th className="pb-1">OP</th>
                    <th className="pb-1">ARG 1</th>
                    <th className="pb-1">ARG 2</th>
                    <th className="pb-1">RESULT</th>
                    <th className="pb-1 pr-1">COMMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {tac.map((inst) => {
                    const isLabel = inst.op === 'LABEL' || inst.op === 'FUNC_START';
                    const isBranch = ['GOTO', 'IF_GOTO', 'IF_FALSE_GOTO', 'RETURN'].includes(inst.op);

                    return (
                      <tr
                        key={inst.id}
                        className={`hover:bg-slate-800/40 transition-colors text-[11px] ${
                          isLabel ? 'bg-amber-950/20 text-amber-300 font-bold' : isBranch ? 'text-cyan-300' : 'text-slate-300'
                        }`}
                      >
                        <td className="py-1 pl-1 text-slate-500 font-mono text-[10px]">[{inst.id}]</td>
                        <td className="py-1">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isLabel ? 'bg-amber-900/60 text-amber-200' : isBranch ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-200'
                          }`}>
                            {inst.op}
                          </span>
                        </td>
                        <td className="py-1 text-emerald-400">{inst.arg1 || '-'}</td>
                        <td className="py-1 text-indigo-400">{inst.arg2 || '-'}</td>
                        <td className="py-1 text-amber-300 font-bold">{inst.result || '-'}</td>
                        <td className="py-1 pr-1 text-slate-500 italic text-[10px]">{inst.comment || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
              <span>Basic Blocks: <strong className="text-amber-400">{cfg.blocks.length}</strong></span>
              <span className="text-slate-500">Partitioned by Leaders</span>
            </div>

            {cfg.blocks.length === 0 ? (
              <div className="text-slate-500 italic text-center p-3 text-xs">No basic blocks available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {cfg.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-2.5 bg-slate-950 rounded border border-slate-800 hover:border-amber-500/50 transition-colors shadow-sm relative text-xs"
                  >
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                      <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-500" />
                        {block.label} ({block.id})
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {block.instructions.length} insts
                      </span>
                    </div>

                    {/* Block Instructions */}
                    <div className="space-y-0.5 my-1.5 bg-slate-900 p-1.5 rounded border border-slate-800/80 font-mono text-[10px]">
                      {block.instructions.map((i) => (
                        <div key={i.id} className="text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-600 select-none text-[9px]">[{i.id}]</span>
                          <span className="text-cyan-400 font-bold">{i.op}</span>
                          {i.arg1 && <span className="text-emerald-400">{i.arg1}</span>}
                          {i.arg2 && <span className="text-indigo-400">{i.arg2}</span>}
                          {i.result && <span className="text-amber-300 font-semibold">=&gt; {i.result}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Predecessors & Successors */}
                    <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60 font-mono">
                      <div>
                        Pred:{' '}
                        <span className="text-slate-300 font-bold">
                          {block.predecessors.length > 0 ? block.predecessors.join(', ') : 'Entry'}
                        </span>
                      </div>
                      <div>
                        Succ:{' '}
                        <span className="text-cyan-300 font-bold">
                          {block.successors.length > 0 ? block.successors.join(', ') : 'Exit'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
