/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';

interface TranspilerViewerProps {
  pythonCode: string;
  cCode: string;
}

export const TranspilerViewer: React.FC<TranspilerViewerProps> = ({ pythonCode, cCode }) => {
  const [activeTarget, setActiveTarget] = useState<'python' | 'c'>('python');
  const [copied, setCopied] = useState(false);

  const currentCode = activeTarget === 'python' ? pythonCode : cCode;

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            MULTI-TARGET TRANSPILER (PYTHON 3 & ANSI C99)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Target toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setActiveTarget('python')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                activeTarget === 'python' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python 3
            </button>
            <button
              onClick={() => setActiveTarget('c')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                activeTarget === 'c' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ANSI C (C99)
            </button>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Target description bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/70 border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0">
        <span>
          {activeTarget === 'python'
            ? '🐍 Python 3 Target: Native standard library mappings with direct execution support'
            : '⚡ C (C99) Target: Native binary compilation for high performance'}
        </span>
        <span className="text-[9px] text-slate-500 font-mono">
          {activeTarget === 'python' ? 'python3 main.py' : 'gcc main.c -o main && ./main'}
        </span>
      </div>

      {/* Code Display */}
      <div className="flex-1 p-2.5 overflow-auto text-xs leading-5">
        <pre className="text-slate-200 font-mono whitespace-pre-wrap selection:bg-emerald-950 selection:text-emerald-200 text-xs">
          {currentCode}
        </pre>
      </div>
    </div>
  );
};
