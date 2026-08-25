/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProgramNode } from '../compiler/types';
import { ChevronRight, ChevronDown, FolderTree, Code, Eye } from 'lucide-react';

interface ASTVisualizerProps {
  ast: ProgramNode | null;
}

const TreeNode: React.FC<{ node: any; label: string; depth?: number }> = ({ node, label, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 3);

  if (node === null || node === undefined) {
    return (
      <div className="pl-4 py-0.5 text-slate-500 font-mono text-xs">
        <span className="text-slate-400 font-medium">{label}:</span> <span className="italic">null</span>
      </div>
    );
  }

  if (typeof node !== 'object') {
    return (
      <div className="pl-4 py-0.5 text-slate-300 font-mono text-xs hover:bg-slate-800/40 rounded">
        <span className="text-slate-400 font-medium">{label}:</span>{' '}
        <span className="text-emerald-400 font-semibold">{JSON.stringify(node)}</span>
      </div>
    );
  }

  if (Array.isArray(node)) {
    return (
      <div className="pl-3 py-0.5">
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-emerald-300 font-mono text-xs py-0.5 select-none"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <span className="font-semibold text-amber-400">{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">[{node.length} items]</span>
        </div>
        {expanded && (
          <div className="pl-2 border-l border-slate-800/80 space-y-0.5">
            {node.map((item, idx) => (
              <TreeNode key={idx} node={item} label={`[${idx}]`} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const nodeType = node.type || 'Object';
  const keys = Object.keys(node).filter((k) => k !== 'type' && k !== 'loc');

  return (
    <div className="pl-3 py-0.5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 cursor-pointer text-slate-200 hover:text-emerald-300 font-mono text-xs py-0.5 select-none"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold text-[11px]">
          {nodeType}
        </span>
        {label !== nodeType && <span className="text-slate-400 font-medium ml-1">({label})</span>}
        {node.identifier && <span className="text-cyan-400 font-mono font-bold">id: &quot;{node.identifier}&quot;</span>}
        {node.name && <span className="text-cyan-400 font-mono font-bold">name: &quot;{node.name}&quot;</span>}
        {node.operator && <span className="text-amber-400 font-mono font-bold">op: &apos;{node.operator}&apos;</span>}
        {node.dataType && <span className="text-indigo-400 text-[10px] bg-indigo-950 px-1 rounded">type: {node.dataType}</span>}
      </div>

      {expanded && (
        <div className="pl-2 border-l border-slate-800/80 space-y-0.5">
          {keys.map((k) => (
            <TreeNode key={k} node={node[k]} label={k} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ASTVisualizer: React.FC<ASTVisualizerProps> = ({ ast }) => {
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">AST PARSER HIERARCHY</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === 'tree' ? 'bg-emerald-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-2.5 h-2.5" />
            <span>TREE</span>
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === 'json' ? 'bg-emerald-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-2.5 h-2.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2.5 overflow-auto font-mono text-xs">
        {!ast ? (
          <div className="text-slate-500 italic p-3 text-center text-xs">
            No valid AST generated yet.
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-0.5">
            <TreeNode node={ast} label="Program" depth={0} />
          </div>
        ) : (
          <pre className="text-slate-300 text-xs leading-5 whitespace-pre-wrap">
            {JSON.stringify(ast, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
