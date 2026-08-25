/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LLVM_TARGETS } from '../compiler/codegen_llvm';
import { Cpu, Copy, Check, Info, FileCode, Layers } from 'lucide-react';

interface LLVMViewerProps {
  llvmIR: string;
  selectedTarget: string;
  onTargetChange: (target: string) => void;
}

export const LLVMViewer: React.FC<LLVMViewerProps> = ({
  llvmIR,
  selectedTarget,
  onTargetChange,
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(llvmIR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetConfig = LLVM_TARGETS[selectedTarget] || LLVM_TARGETS['x86_64-linux'];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">
            LLVM IR TARGET CODEGEN (SSA FORM)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Triple Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 text-[10px]">
            <span className="text-slate-500">TRIPLE:</span>
            <select
              value={selectedTarget}
              onChange={(e) => onTargetChange(e.target.value)}
              className="bg-transparent text-[10px] text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {Object.entries(LLVM_TARGETS).map(([k, t]) => (
                <option key={k} value={k} className="bg-slate-900 text-slate-200">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY IR'}</span>
          </button>
        </div>
      </div>

      {/* Target Spec Information Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/70 border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Target: <strong className="text-cyan-300">{targetConfig.triple}</strong>
          </span>
          <span className="hidden md:inline">
            Layout: <span className="text-slate-500 font-mono text-[9px]">{targetConfig.dataLayout}</span>
          </span>
        </div>
        <div className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 uppercase font-semibold">
          SSA • LLVM 16
        </div>
      </div>

      {/* LLVM IR Code Body */}
      <div className="flex-1 p-2.5 overflow-auto text-xs leading-5">
        <pre className="text-slate-300 font-mono whitespace-pre-wrap selection:bg-cyan-950 selection:text-cyan-200 text-xs">
          {llvmIR.split('\n').map((line, idx) => {
            let className = 'text-slate-300';
            if (line.startsWith(';')) className = 'text-slate-500 italic';
            else if (line.startsWith('define')) className = 'text-emerald-400 font-semibold';
            else if (line.startsWith('declare')) className = 'text-indigo-400';
            else if (line.includes('alloca') || line.includes('store') || line.includes('load')) className = 'text-cyan-300';
            else if (line.includes('call @printf') || line.includes('call @puts')) className = 'text-amber-300 font-medium';
            else if (line.includes('br ') || line.includes('ret ')) className = 'text-rose-400 font-semibold';
            else if (line.endsWith(':')) className = 'text-yellow-400 font-bold bg-slate-800/50 px-1 rounded inline-block';

            return (
              <div key={idx} className={className}>
                {line || ' '}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};
