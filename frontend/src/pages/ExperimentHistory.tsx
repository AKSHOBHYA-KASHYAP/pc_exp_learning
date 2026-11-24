import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PlaceholderNotice } from '../components/common/PlaceholderNotice';
import { SAMPLE_EXPERIMENTS } from '../data/sampleData';
import { ExperimentRun } from '../types';
import { api } from '../services/api';
import { History, Search, Filter, Play, ExternalLink, Download, RefreshCw } from 'lucide-react';

export const ExperimentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterWorkload, setFilterWorkload] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<ExperimentRun | null>(null);
  const [experiments, setExperiments] = useState<ExperimentRun[]>(SAMPLE_EXPERIMENTS);
  const [hasRealRuns, setHasRealRuns] = useState<boolean>(false);

  const loadHistory = () => {
    api.getExperimentHistory()
      .then((realRuns) => {
        if (realRuns && realRuns.length > 0) {
          const mapped: ExperimentRun[] = realRuns.map((r) => ({
            id: r.id,
            name: `Matrix Multiply (${r.config.matrix_size}x${r.config.matrix_size})`,
            workload: 'matrix_multiply',
            workloadName: 'Matrix Multiplication',
            matrixSize: r.config.matrix_size,
            threads: r.config.threads,
            scheduling: r.config.scheduling as any,
            chunkSize: r.config.chunk_size,
            repetitions: r.config.repetitions,
            sequentialTimeMs: r.sequential_time_ms || 0,
            parallelTimeMs: r.parallel_time_ms || 0,
            speedup: r.speedup || 1.0,
            efficiency: r.efficiency || 100.0,
            gflops: r.gflops || 0,
            timestamp: r.created_at.replace('T', ' ').slice(0, 19),
            status: r.status === 'completed' ? 'completed' : 'failed',
          }));
          setExperiments(mapped);
          setHasRealRuns(true);
        }
      })
      .catch(() => {
        // Fallback to sample if backend is offline
        setExperiments(SAMPLE_EXPERIMENTS);
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = experiments.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWorkload = filterWorkload === 'all' || exp.workload === filterWorkload;
    return matchesSearch && matchesWorkload;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <History size={24} className="text-apple-blue" />
              Experiment History & Benchmarks
            </h1>
            {hasRealRuns ? (
              <Badge variant="green" dot>Live Backend Runs</Badge>
            ) : (
              <Badge variant="amber">Sample Database</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Query past parallel execution runs, audit speedup metrics, and compare scheduling strategies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={loadHistory}
          >
            Refresh
          </Button>
          <Button
            variant="glass"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => navigate('/reports')}
          >
            Export All
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Play size={14} fill="currentColor" />}
            onClick={() => navigate('/lab')}
          >
            New Run
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search experiments by ID (e.g. EXP-9842) or workload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 outline-none focus:border-apple-blue text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-gray-400 shrink-0" />
          <select
            value={filterWorkload}
            onChange={(e) => setFilterWorkload(e.target.value)}
            className="text-xs rounded-xl px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-200 outline-none"
          >
            <option value="all">All Workloads</option>
            <option value="matrix_multiply">Matrix Multiplication</option>
            <option value="monte_carlo_pi">Monte Carlo Pi</option>
            <option value="mandelbrot">Mandelbrot Fractal</option>
          </select>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 uppercase text-[10px]">
                <th className="pb-3">Run ID</th>
                <th className="pb-3">Workload</th>
                <th className="pb-3">Threads</th>
                <th className="pb-3">Schedule</th>
                <th className="pb-3 text-right">Seq. Time</th>
                <th className="pb-3 text-right">Par. Time</th>
                <th className="pb-3 text-right">Speedup</th>
                <th className="pb-3 text-right">Efficiency</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 font-bold text-apple-blue">{exp.id}</td>
                  <td className="py-3 font-sans text-gray-800 dark:text-gray-200">
                    <div>{exp.name}</div>
                    <span className="text-[10px] text-gray-400 font-mono">{exp.timestamp}</span>
                  </td>
                  <td className="py-3 text-gray-700 dark:text-gray-300">{exp.threads}T</td>
                  <td className="py-3">
                    <Badge variant="gray" size="sm">
                      {exp.scheduling} {exp.chunkSize ? `(${exp.chunkSize})` : ''}
                    </Badge>
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">{exp.sequentialTimeMs.toFixed(1)} ms</td>
                  <td className="py-3 text-right font-bold text-gray-900 dark:text-white">{exp.parallelTimeMs.toFixed(1)} ms</td>
                  <td className="py-3 text-right font-bold text-emerald-500">{exp.speedup.toFixed(2)}x</td>
                  <td className="py-3 text-right text-apple-blue">{exp.efficiency.toFixed(1)}%</td>
                  <td className="py-3 text-center">
                    <Badge variant="amber" size="sm">Sample</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      <button
                        onClick={() => setSelectedRun(exp)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-apple-blue hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal / Drawer Sheet */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl apple-glass-card p-6 space-y-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-apple-blue font-bold">{selectedRun.id}</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedRun.name}</h3>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-gray-400 block text-[10px]">Threads</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">{selectedRun.threads} Threads</span>
              </div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-gray-400 block text-[10px]">Scheduling</span>
                <span className="font-bold text-sm capitalize text-gray-900 dark:text-white">{selectedRun.scheduling}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-gray-400 block text-[10px]">Speedup</span>
                <span className="font-bold text-sm text-emerald-500">{selectedRun.speedup.toFixed(2)}x</span>
              </div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-gray-400 block text-[10px]">Parallel Efficiency</span>
                <span className="font-bold text-sm text-apple-blue">{selectedRun.efficiency.toFixed(1)}%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="glass" size="sm" onClick={() => setSelectedRun(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Play size={14} fill="currentColor" />}
                onClick={() => {
                  setSelectedRun(null);
                  navigate('/lab');
                }}
              >
                Load in Lab
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
