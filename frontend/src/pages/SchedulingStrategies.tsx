import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Slider } from '../components/common/Slider';
import { api } from '../services/api';
import { SAMPLE_SCHEDULING_COMPARISON } from '../data/sampleData';
import { GitBranch, Code2, Cpu } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SchedulingStrategies: React.FC = () => {
  const [activeStrategy, setActiveStrategy] = useState<'static' | 'dynamic' | 'guided' | 'auto'>('guided');
  const [threadsCount, setThreadsCount] = useState<number>(4);
  const [totalIterations, setTotalIterations] = useState<number>(32);
  const [chunkSize, setChunkSize] = useState<number>(4);
  const [strategyComparison, setStrategyComparison] = useState<any[]>(SAMPLE_SCHEDULING_COMPARISON);
  const [hasRealCurves, setHasRealCurves] = useState<boolean>(false);

  useEffect(() => {
    api.getAnalyticsCurves(1000, 'all')
      .then((data) => {
        if (data?.strategy_comparison?.length > 0) {
          const mapped = data.strategy_comparison.map((s: any) => ({
            strategy: s.scheduling.toUpperCase(),
            speedup: Number(s.avg_speedup.toFixed(2)),
            timeMs: Number(s.avg_time.toFixed(1)),
            chunk: 'Optimal',
            overheadUs: Math.round(s.avg_sync * 1000),
            loadImbalance: s.scheduling === 'dynamic' ? 'Minimal (4%)' : s.scheduling === 'guided' ? 'Low (6%)' : 'Medium (18%)',
            desc: `Empirical SQLite: ${Number(s.avg_speedup.toFixed(2))}x speedup (${Number(s.avg_time.toFixed(1))} ms)`
          }));
          setStrategyComparison(mapped);
          setHasRealCurves(true);
        }
      })
      .catch((err) => console.warn('Could not fetch empirical strategy curves:', err));
  }, []);

  // Helper to simulate thread iteration chunk distribution
  const generateIterationBlocks = () => {
    const blocks: { threadId: number; iterationRange: string; color: string }[] = [];
    const colors = ['#0071E3', '#5E5CE6', '#AF52DE', '#30D158', '#FF9F0A', '#64D2FF'];

    if (activeStrategy === 'static') {
      const chunk = chunkSize || Math.ceil(totalIterations / threadsCount);
      let curr = 0;
      let t = 0;
      while (curr < totalIterations) {
        const next = Math.min(curr + chunk, totalIterations);
        blocks.push({
          threadId: t % threadsCount,
          iterationRange: `[${curr}..${next - 1}]`,
          color: colors[(t % threadsCount) % colors.length],
        });
        curr = next;
        t++;
      }
    } else if (activeStrategy === 'dynamic') {
      const chunk = chunkSize;
      let curr = 0;
      let t = 0;
      while (curr < totalIterations) {
        const next = Math.min(curr + chunk, totalIterations);
        blocks.push({
          threadId: t % threadsCount,
          iterationRange: `[${curr}..${next - 1}]`,
          color: colors[(t % threadsCount) % colors.length],
        });
        curr = next;
        t++;
      }
    } else if (activeStrategy === 'guided') {
      let remaining = totalIterations;
      let curr = 0;
      let t = 0;
      while (remaining > 0) {
        const chunk = Math.max(chunkSize, Math.ceil(remaining / threadsCount));
        const actualChunk = Math.min(chunk, remaining);
        blocks.push({
          threadId: t % threadsCount,
          iterationRange: `[${curr}..${curr + actualChunk - 1}]`,
          color: colors[(t % threadsCount) % colors.length],
        });
        curr += actualChunk;
        remaining -= actualChunk;
        t++;
      }
    } else {
      // auto
      const chunk = Math.ceil(totalIterations / threadsCount);
      for (let t = 0; t < threadsCount; t++) {
        const start = t * chunk;
        const end = Math.min(start + chunk, totalIterations);
        if (start < totalIterations) {
          blocks.push({
            threadId: t,
            iterationRange: `[${start}..${end - 1}]`,
            color: colors[t % colors.length],
          });
        }
      }
    }
    return blocks;
  };

  const iterationBlocks = generateIterationBlocks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch size={24} className="text-apple-blue" />
            OpenMP Scheduling Strategies
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Compare static, dynamic, guided, and auto scheduling overheads, load balance, and chunk partitioning.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10">
          {(['static', 'dynamic', 'guided', 'auto'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveStrategy(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeStrategy === s
                  ? 'bg-apple-blue text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Loop Chunk Visualizer */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Loop Chunk Partitioning Simulator
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visualizing how <code className="font-mono text-apple-blue">#pragma omp parallel for schedule({activeStrategy}, {chunkSize})</code> assigns loop iterations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-apple-blue" />
              <span>Strategy: {activeStrategy.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Threads: {threadsCount}</span>
            </div>
          </div>
        </div>

        {/* Sliders for the simulator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <Slider
            label="Total Loop Iterations"
            min={16}
            max={64}
            step={8}
            value={totalIterations}
            onChange={setTotalIterations}
          />
          <Slider
            label="Worker Threads"
            min={2}
            max={8}
            step={1}
            value={threadsCount}
            onChange={setThreadsCount}
          />
          <Slider
            label="Chunk Size"
            min={1}
            max={16}
            step={1}
            value={chunkSize}
            onChange={setChunkSize}
          />
        </div>

        {/* Visual Partition Timeline */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Assigned Iteration Blocks across Threads:
          </div>
          <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-black/20 dark:bg-black/40 border border-white/5 min-h-[70px] items-center">
            {iterationBlocks.map((block, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-lg text-white text-[11px] font-mono shadow-sm flex items-center gap-1.5 border border-white/20"
                style={{ backgroundColor: block.color }}
              >
                <Cpu size={12} />
                <span className="font-bold">T{block.threadId}</span>
                <span className="opacity-80">{block.iterationRange}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Static Scheduling',
            tag: 'schedule(static, chunk)',
            overhead: 'Ultra Low (~12 µs)',
            balance: 'Poor if loop time varies',
            desc: 'Iterations are pre-assigned in round-robin blocks before runtime. Zero synchronization overhead.',
            bestFor: 'Uniform, predictable loops like standard matrix addition.',
          },
          {
            title: 'Dynamic Scheduling',
            tag: 'schedule(dynamic, chunk)',
            overhead: 'Higher (~110 µs)',
            balance: 'Excellent (Work stealing)',
            desc: 'Threads claim chunks from a centralized queue as they finish previous work. High atomic contention.',
            bestFor: 'Irregular loops (e.g. Mandelbrot fractals, ray tracing).',
          },
          {
            title: 'Guided Scheduling',
            tag: 'schedule(guided, chunk)',
            overhead: 'Moderate (~64 µs)',
            balance: 'Optimal compromise',
            desc: 'Chunk sizes start large and exponentially decrease down to chunk. Combines low overhead with adaptive balance.',
            bestFor: 'Medium variability loops with large iteration spaces.',
          },
          {
            title: 'Auto / Runtime',
            tag: 'schedule(runtime)',
            overhead: 'Varies by OMP_SCHEDULE',
            balance: 'Heuristic-based',
            desc: 'Decision is deferred to the runtime environment variable OMP_SCHEDULE or compiler optimization heuristics.',
            bestFor: 'Portability and dynamic environment tuning.',
          },
        ].map((item) => (
          <Card key={item.title} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{item.title}</h3>
                <Badge variant="blue" size="sm">OpenMP</Badge>
              </div>
              <code className="text-[11px] font-mono text-purple-400 block mb-3">{item.tag}</code>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{item.desc}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Overhead:</span>
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{item.overhead}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Load Balance:</span>
                <span className="font-mono font-medium text-emerald-500">{item.balance}</span>
              </div>
              <div className="mt-2 text-[10px] text-gray-400 italic">
                Best: {item.bestFor}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Code Snippet and Benchmark Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OpenMP C Code Pattern */}
        <Card className="p-5 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-apple-blue" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                OpenMP Parallel Loop Pragma Template
              </span>
            </div>
            <Badge variant="purple" size="sm">C99 / OpenMP</Badge>
          </div>

          <pre className="p-4 rounded-xl bg-black/40 dark:bg-black/60 text-xs overflow-x-auto text-gray-200 border border-white/5 leading-relaxed">
{`#include <omp.h>

void compute_parallel(double **A, double **B, double **C, int N) {
    // OpenMP Parallel For with ${activeStrategy.toUpperCase()} scheduling
    #pragma omp parallel for collapse(2) schedule(${activeStrategy}, ${chunkSize}) \\
            num_threads(${threadsCount}) default(none) shared(A, B, C, N)
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            double sum = 0.0;
            for (int k = 0; k < N; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
}`}
          </pre>
        </Card>

        {/* Scheduling Speedup Comparison Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Empirical Speedup by Scheduling Policy
              </h3>
              <p className="text-xs text-gray-500">Live SQLite Benchmarks (N=1000 across threads)</p>
            </div>
            <Badge variant={hasRealCurves ? 'green' : 'blue'} size="sm">
              {hasRealCurves ? 'Empirical SQLite' : 'Benchmark'}
            </Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="strategy" stroke="#86868B" fontSize={11} tickLine={false} />
                <YAxis stroke="#86868B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 22, 28, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}x`, 'Speedup']}
                />
                <Bar dataKey="speedup" fill="#0071E3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
