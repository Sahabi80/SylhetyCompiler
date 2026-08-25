/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scope, SymbolTableEntry } from '../compiler/types';
import { Table, ShieldCheck, Database, Hash, MapPin, CheckCircle2 } from 'lucide-react';

interface SymbolTableViewerProps {
  rootScope: Scope;
}

export const SymbolTableViewer: React.FC<SymbolTableViewerProps> = ({ rootScope }) => {
  const [selectedScopeId, setSelectedScopeId] = useState<number>(0);

  // Flatten all scopes for easy tab switching
  const allScopes: Scope[] = [];
  const collectScopes = (scope: Scope) => {
    allScopes.push(scope);
    for (const child of scope.children) {
      collectScopes(child);
    }
  };
  collectScopes(rootScope);

  const activeScope = allScopes.find((s) => s.id === selectedScopeId) || rootScope;
  const symbolsList: SymbolTableEntry[] = Array.from(activeScope.symbols.values());

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Table className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            SYMBOL TABLE & SCOPE ENVIRONMENT
          </span>
        </div>

        {/* Scope Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {allScopes.map((scope) => (
            <button
              key={scope.id}
              onClick={() => setSelectedScopeId(scope.id)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap ${
                activeScope.id === scope.id
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {scope.name} (#{scope.id})
            </button>
          ))}
        </div>
      </div>

      {/* Scope Summary Banner */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/60 border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Scope: <strong className="text-emerald-400">{activeScope.name}</strong>
          </span>
          <span>
            Symbols: <strong className="text-slate-200">{symbolsList.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[9px] uppercase">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>CSE-4114 Type Safe</span>
        </div>
      </div>

      {/* Symbols Table */}
      <div className="flex-1 overflow-auto p-2.5 text-xs">
        {symbolsList.length === 0 ? (
          <div className="text-slate-500 italic p-3 text-center text-xs">
            No symbols declared in this active scope.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="pb-1 pl-1">IDENTIFIER</th>
                <th className="pb-1">TYPE</th>
                <th className="pb-1">MUTABILITY</th>
                <th className="pb-1">OFFSET</th>
                <th className="pb-1">DEPTH</th>
                <th className="pb-1">LOC</th>
                <th className="pb-1 pr-1">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {symbolsList.map((sym, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 text-slate-300 transition-colors text-[11px]">
                  <td className="py-1 pl-1 font-bold text-emerald-400 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-slate-500" />
                    <span>{sym.name}</span>
                  </td>
                  <td className="py-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                      {sym.type || 'unknown'}
                    </span>
                  </td>
                  <td className="py-1">
                    {sym.isConst ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-950 text-amber-300 border border-amber-800/60">
                        Const
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Mutable</span>
                    )}
                  </td>
                  <td className="py-1 text-slate-400 font-mono text-[10px]">
                    <span className="flex items-center gap-0.5">
                      <Hash className="w-2.5 h-2.5 text-slate-600" />
                      +{sym.memoryOffset ?? 0}B
                    </span>
                  </td>
                  <td className="py-1 text-slate-400 text-[10px]">Lvl {sym.scopeLevel}</td>
                  <td className="py-1 text-slate-400 font-mono text-[10px]">
                    L{sym.loc.line}:C{sym.loc.column}
                  </td>
                  <td className="py-1 pr-1">
                    {sym.isInitialized ? (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Init OK
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px]">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
