/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CompilerPerformanceMetrics, PhaseTiming } from '../compiler/types';
import {
  Activity,
  Zap,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
  BarChart3,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { CompilerEngine } from '../compiler/engine';

interface CompilerPerformanceViewerProps {
  performanceMetrics: CompilerPerformanceMetrics;
  sourceCode: string;
  targetTriple?: string;
  onBenchmarkUpdate?: (metrics: CompilerPerformanceMetrics) => void;
}

const PHASE_COLORS: Record<string, string> = {
  Lexing: '#10b981', // emerald-500
  Parsing: '#f59e0b', // amber-500
  'Semantic Analysis': '#06b6d4', // cyan-500
  Optimization: '#8b5cf6', // purple-500
};

interface BenchmarkStats {
  iterations: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  throughputKTokensSec: number;
}

export const CompilerPerformanceViewer: React.FC<CompilerPerformanceViewerProps> = ({
  performanceMetrics,
  sourceCode,
  targetTriple = 'x86_64-linux',
}) => {
  const [activeMetricView, setActiveMetricView] = useState<'duration' | 'percentage'>('duration');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkStats, setBenchmarkStats] = useState<BenchmarkStats | null>(null);

  // Prepare chart data for Recharts
  const chartData = performanceMetrics.phases.map((p) => ({
    name: p.name,
    shortName: p.name === 'Semantic Analysis' ? 'Semantic' : p.name,
    durationMs: p.durationMs,
    percentage: p.percentage,
    description: p.description,
    itemsProcessed: p.itemsProcessed,
    itemUnit: p.itemUnit,
    color: PHASE_COLORS[p.name] || '#3b82f6',
  }));

  // Find max phase duration
  const maxPhase = [...performanceMetrics.phases].sort((a, b) => b.durationMs - a.durationMs)[0];

  // Run multi-iteration benchmark
  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const iterations = 100;
      const times: number[] = [];
      const tStart = performance.now();

      for (let i = 0; i < iterations; i++) {
        const iterStart = performance.now();
        CompilerEngine.compile(sourceCode, targetTriple);
        const iterEnd = performance.now();
        times.push(iterEnd - iterStart);
      }

      const tTotal = performance.now() - tStart;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = tTotal / iterations;
      const tokens = performanceMetrics.tokensCount;
      const throughputKTokens = avg > 0 ? (tokens / avg) * 1000 : 0;

      setBenchmarkStats({
        iterations,
        avgTimeMs: +avg.toFixed(3),
        minTimeMs: +min.toFixed(3),
        maxTimeMs: +max.toFixed(3),
        throughputKTokensSec: Math.round(throughputKTokens),
      });

      setIsBenchmarking(false);
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md font-mono">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            COMPILER PERFORMANCE PROFILER
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Unit */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setActiveMetricView('duration')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeMetricView === 'duration'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Time (ms)
            </button>
            <button
              onClick={() => setActiveMetricView('percentage')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeMetricView === 'percentage'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Share (%)
            </button>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded text-[10px] border border-slate-700 transition-all"
            title="Run 100x compilations to compute statistical averages"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>{isBenchmarking ? 'Profiling...' : 'Benchmark 100x'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Total Compile Time</span>
          </div>
          <div className="text-base font-bold text-emerald-300 font-mono">
            {performanceMetrics.totalTimeMs.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">End-to-End Pipeline</span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Throughput Rate</span>
          </div>
          <div className="text-base font-bold text-amber-300 font-mono">
            {performanceMetrics.throughputLinesPerSec.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">lines/s</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">{performanceMetrics.linesCount} lines source</span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Processed Nodes</span>
          </div>
          <div className="text-base font-bold text-cyan-300 font-mono">
            {performanceMetrics.tokensCount} <span className="text-[10px] font-normal text-slate-400">tok / {performanceMetrics.astNodesCount} AST</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Syntactic Elements</span>
        </div>

        <div className="p-2 bg-slate-900 rounded border border-slate-800">
          <div className="text-slate-400 text-[10px] mb-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>Heaviest Phase</span>
          </div>
          <div className="text-base font-bold text-purple-300 font-mono truncate">
            {maxPhase?.name || 'Parsing'}
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">
            {maxPhase?.durationMs.toFixed(3)} ms ({maxPhase?.percentage}%)
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Recharts Bar Chart Section */}
        <div className="p-3 bg-slate-950 rounded border border-slate-800 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">
                Phase Latency Distribution (Recharts Telemetry)
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {activeMetricView === 'duration' ? 'Metric: Duration (milliseconds)' : 'Metric: Pipeline Ratio (%)'}
            </span>
          </div>

          <div className="w-full h-48 sm:h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  unit={activeMetricView === 'duration' ? 'ms' : '%'}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow-xl text-xs font-mono space-y-1 z-50">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                            <span className="font-bold text-slate-100 flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: data.color }}
                              />
                              {data.name}
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              {data.durationMs.toFixed(3)} ms
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {data.description}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>Pipeline Share:</span>
                            <span className="text-amber-300 font-bold">{data.percentage}%</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Throughput Item:</span>
                            <span className="text-cyan-300 font-bold">{data.itemsProcessed} {data.itemUnit}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={activeMetricView === 'duration' ? 'durationMs' : 'percentage'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={55}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phase Breakdown Detail Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-0.5">
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              Compilation Phase Breakdown
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Measured using window.performance high-resolution timer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {performanceMetrics.phases.map((phase) => {
              const color = PHASE_COLORS[phase.name] || '#10b981';
              return (
                <div
                  key={phase.name}
                  className="p-2.5 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="font-bold text-slate-100 text-[11px]">{phase.name}</div>
                        <div className="text-[10px] text-slate-400 leading-snug">{phase.description}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-200 text-xs">{phase.durationMs.toFixed(3)} ms</div>
                      <div className="text-[10px] text-amber-400 font-medium">{phase.percentage}% of total</div>
                    </div>
                  </div>

                  {/* Visual percentage meter */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, Math.min(100, phase.percentage))}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-900">
                    <span>Processed Load:</span>
                    <span className="font-semibold text-slate-300 font-mono">
                      {phase.itemsProcessed} {phase.itemUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistical Benchmark Panel (if run) */}
        {benchmarkStats && (
          <div className="p-2.5 bg-slate-950 rounded border border-emerald-800/40 bg-emerald-950/10 space-y-1.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100x Benchmark Statistics (Statistical Variance)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {benchmarkStats.iterations} iterations completed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Average Latency</span>
                <span className="font-bold text-emerald-300 text-xs font-mono">{benchmarkStats.avgTimeMs} ms</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Fastest Run (Min)</span>
                <span className="font-bold text-cyan-300 text-xs font-mono">{benchmarkStats.minTimeMs} ms</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Peak Run (Max)</span>
                <span className="font-bold text-amber-300 text-xs font-mono">{benchmarkStats.maxTimeMs} ms</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Token Throughput</span>
                <span className="font-bold text-purple-300 text-xs font-mono">{benchmarkStats.throughputKTokensSec.toLocaleString()} tok/s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
