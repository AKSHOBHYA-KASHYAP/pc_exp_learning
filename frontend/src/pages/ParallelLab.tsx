import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Toggle } from '../components/common/Toggle';
import { Slider } from '../components/common/Slider';
import { SchedulingType, WorkloadType } from '../types';
import { api } from '../services/api';
import { useExperimentWebSocket } from '../hooks/useExperimentWebSocket';
import {
  Play,
  RotateCcw,
  Cpu,
  Layers,
  Settings2,
  Zap,
  Terminal,
  Square,
  Server,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ParallelLab: React.FC = () => {
  // Configuration state
  const [workload, setWorkload] = useState<WorkloadType>('matrix_multiply');
  const [matrixSize, setMatrixSize] = useState<number>(500);
  const [threads, setThreads] = useState<number>(8);
  const [scheduling, setScheduling] = useState<SchedulingType>('guided');
  const [chunkSize, setChunkSize] = useState<number>(16);
  const [repetitions, setRepetitions] = useState<number>(1);
  const [runSequential, setRunSequential] = useState<boolean>(true);
  const [runParallel, setRunParallel] = useState<boolean>(true);
  const [customChunk, setCustomChunk] = useState<boolean>(false);

  // Real backend connection & experiment state
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    "[ParallelX System] Checking FastAPI backend connection at http://localhost:8000...",
  ]);

  const [latestResult, setLatestResult] = useState<{
    seqTimeMs: number;
    parTimeMs: number;
    speedup: number;
    efficiency: number;
    gflops: number;
    status: string;
    isValid: boolean;
  } | null>(null);

  // WebSocket hook for real-time updates
  const { status: wsStatus, logs: wsLogs, data: wsData } = useExperimentWebSocket(activeExperimentId);

  // Check backend health on mount
  useEffect(() => {
    api.getEngineStatus()
      .then(() => {
        setBackendOnline(true);
        setExecutionLogs((prev) => [
          ...prev,
          `[Backend Connected] FastAPI server online with GCC OpenMP Engine.`,
          `[Status] Ready to execute native Ubuntu/WSL benchmark kernels.`,
        ]);
      })
      .catch(() => {
        setBackendOnline(false);
        setExecutionLogs((prev) => [
          ...prev,
          `[Notice] FastAPI backend not detected at http://localhost:8000.`,
          `[Tip] Start backend: 'python -m uvicorn backend.app.main:app --port 8000 --reload'`,
        ]);
      });
  }, []);

  // Sync WebSocket data into latestResult when completed
  useEffect(() => {
    if (wsData && wsData.status === 'completed') {
      setIsRunning(false);
      setLatestResult({
        seqTimeMs: wsData.sequential_time_ms || 0,
        parTimeMs: wsData.parallel_time_ms || 0,
        speedup: wsData.speedup || 1.0,
        efficiency: wsData.efficiency || 100.0,
        gflops: wsData.gflops || 0,
        status: 'COMPLETED',
        isValid: wsData.is_valid,
      });
    } else if (wsData && wsData.status === 'failed') {
      setIsRunning(false);
    }
  }, [wsData]);

  // Append incoming WebSocket logs to the terminal
  useEffect(() => {
    if (wsLogs.length > 0) {
      setExecutionLogs((prev) => {
        const newLogs = wsLogs.filter((l) => !prev.includes(l));
        return newLogs.length > 0 ? [...prev, ...newLogs] : prev;
      });
    }
  }, [wsLogs]);

  const handleRunExperiment = async () => {
    setIsRunning(true);
    setLatestResult(null);
    setExecutionLogs((prev) => [
      ...prev,
      `[Dispatch] Submitting experiment: Size ${matrixSize}x${matrixSize}, Threads: ${threads}, Schedule: ${scheduling}`,
    ]);

    try {
      const exp = await api.runExperiment({
        workload,
        matrix_size: matrixSize,
        threads,
        scheduling,
        chunk_size: customChunk ? chunkSize : 16,
        repetitions,
        run_sequential: runSequential,
      });

      setActiveExperimentId(exp.id);
      setExecutionLogs((prev) => [
        ...prev,
        `[Accepted] Experiment enqueued with ID: ${exp.id}`,
      ]);
    } catch (err: any) {
      setIsRunning(false);
      setExecutionLogs((prev) => [
        ...prev,
        `[Error] Failed to initiate experiment: ${err.message}`,
      ]);
    }
  };

  const handleCancelExperiment = async () => {
    if (activeExperimentId) {
      try {
        await api.cancelExperiment(activeExperimentId);
        setIsRunning(false);
        setExecutionLogs((prev) => [...prev, `[Abort] Cancel request delivered to backend.`]);
      } catch (err: any) {
        setExecutionLogs((prev) => [...prev, `[Cancel Error] ${err.message}`]);
      }
    }
  };

  const resetDefaults = () => {
    setWorkload('matrix_multiply');
    setMatrixSize(500);
    setThreads(8);
    setScheduling('guided');
    setChunkSize(16);
    setRepetitions(1);
    setRunSequential(true);
    setRunParallel(true);
  };

  return (
    <div className="space-y-6">
      {/* Backend Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl apple-glass border border-black/5 dark:border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Server size={15} className={backendOnline ? 'text-emerald-500' : 'text-amber-500'} />
          <span className="font-semibold text-gray-800 dark:text-gray-200">FastAPI Subprocess Backend:</span>
          {backendOnline === true && (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected (127.0.0.1:8000) · Ubuntu WSL2 GCC Ready
            </span>
          )}
          {backendOnline === false && (
            <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">
              Offline (Start server: <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">python -m uvicorn backend.app.main:app --port 8000</code>)
            </span>
          )}
          {backendOnline === null && <span className="text-gray-400 font-mono">Probing connection...</span>}
        </div>

        <div className="flex items-center gap-2">
          {activeExperimentId && (
            <span className="font-mono text-apple-blue font-bold">
              {activeExperimentId}
            </span>
          )}
          <Badge variant={isRunning ? 'blue' : 'gray'} dot={isRunning}>
            {isRunning ? `State: ${wsStatus.toUpperCase()}` : 'Idle'}
          </Badge>
        </div>
      </div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Parallel Execution Lab
            </h1>
            <Badge variant="green">Live C + OpenMP</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real multi-threaded execution through FastAPI backend and GCC OpenMP binary subprocesses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm" icon={<RotateCcw size={14} />} onClick={resetDefaults}>
            Reset
          </Button>

          {isRunning ? (
            <Button
              variant="danger"
              size="md"
              icon={<Square size={14} fill="currentColor" />}
              onClick={handleCancelExperiment}
            >
              Cancel Run
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<Play size={16} fill="currentColor" />}
              onClick={handleRunExperiment}
              className="shadow-glow-blue"
            >
              Run Experiment
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Live Results & Console on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Workload Selection Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-apple-blue" />
                Computational Workload
              </h2>
              <span className="text-[11px] font-mono text-gray-400">Team 7 Suite</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'matrix_multiply', label: 'Matrix Multiplication', sub: 'O(N³) dense compute' },
                { id: 'vector_add', label: 'Vector Addition', sub: 'Memory-bandwidth bound' },
                { id: 'monte_carlo_pi', label: 'Monte Carlo π', sub: 'Embarrassingly parallel' },
                { id: 'mandelbrot', label: 'Mandelbrot Fractal', sub: 'Irregular loop iterations' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWorkload(item.id as WorkloadType)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    workload === item.id
                      ? 'border-apple-blue bg-blue-500/10 text-apple-blue dark:text-[#2997FF] shadow-sm font-medium'
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Matrix & Problem Size */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings2 size={16} className="text-purple-400" />
              Problem Dimensions & Scaling
            </h2>

            <Slider
              label="Matrix Dimension (N x N)"
              min={100}
              max={2000}
              step={50}
              value={matrixSize}
              onChange={setMatrixSize}
              unit="x"
              marks={[100, 250, 500, 1000, 1500, 2000]}
            />

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total Floating Point Operations:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {(2 * Math.pow(matrixSize, 3) / 1e9).toFixed(3)} GFLOP
              </span>
            </div>
          </Card>

          {/* Thread Configuration & Stepper */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Cpu size={16} className="text-emerald-400" />
                OpenMP Thread Pool
              </h2>
              <span className="text-xs font-mono text-apple-teal">16 Cores Detected</span>
            </div>

            <Slider
              label="Active OpenMP Threads (omp_set_num_threads)"
              min={1}
              max={16}
              step={1}
              value={threads}
              onChange={setThreads}
              unit="T"
              marks={[1, 2, 4, 8, 12, 16]}
            />

            {/* Visual Thread Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Thread Core Allocation Visualizer:</span>
                <span className="font-mono">{threads} Active</span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded-md flex items-center justify-center text-[10px] font-mono transition-all ${
                      i < threads
                        ? 'bg-gradient-to-t from-apple-blue to-apple-teal text-white font-bold shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-gray-400 border border-black/5 dark:border-white/5'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Scheduling Strategy & Execution Options */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Scheduling Strategy & Loops
            </h2>

            <div className="grid grid-cols-4 gap-2">
              {(['static', 'dynamic', 'guided', 'all'] as const).map((sched) => (
                <button
                  key={sched}
                  type="button"
                  onClick={() => setScheduling(sched as any)}
                  className={`py-2 px-1 text-center rounded-xl text-xs capitalize transition-all border ${
                    scheduling === sched
                      ? 'border-apple-blue bg-blue-500/10 text-apple-blue dark:text-[#2997FF] font-semibold'
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {sched === 'all' ? 'All (Compare)' : sched}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
              <Toggle
                label="Custom Chunk Size"
                description="Fine-tune loop iteration chunking"
                checked={customChunk}
                onChange={setCustomChunk}
              />

              {customChunk && (
                <div className="pt-2">
                  <Slider
                    label="Chunk Size"
                    min={1}
                    max={128}
                    step={1}
                    value={chunkSize}
                    onChange={setChunkSize}
                    marks={[1, 8, 16, 32, 64, 128]}
                  />
                </div>
              )}

              <Slider
                label="Benchmark Repetitions (Averaging)"
                min={1}
                max={5}
                step={1}
                value={repetitions}
                onChange={setRepetitions}
                unit="passes"
              />

              <div className="flex flex-col gap-2 pt-1">
                <Toggle
                  label="Sequential Baseline Execution"
                  description="Run single-threaded code for speedup baseline"
                  checked={runSequential}
                  onChange={setRunSequential}
                />
                <Toggle
                  label="Parallel OpenMP Execution"
                  description="Run multi-threaded kernel across thread pool"
                  checked={runParallel}
                  onChange={setRunParallel}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Execution Metrics, Live Console & Real-time Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Prominent Run & Status Banner */}
          <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-apple-blue dark:text-[#2997FF] font-semibold">
                  Execution State: {isRunning ? wsStatus.toUpperCase() : 'READY'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {isRunning ? `Benchmark Running (${wsStatus})...` : 'Ready to Execute'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target: {matrixSize}x{matrixSize} | {threads} Threads | {scheduling} scheduling
                </p>
              </div>

              {isRunning ? (
                <Button
                  variant="danger"
                  size="lg"
                  icon={<Square size={16} fill="currentColor" />}
                  onClick={handleCancelExperiment}
                  className="w-full sm:w-auto"
                >
                  Cancel Run
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play size={18} fill="currentColor" />}
                  onClick={handleRunExperiment}
                  className="w-full sm:w-auto shadow-glow-blue"
                >
                  Run Experiment
                </Button>
              )}
            </div>

            {/* State Indicator */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Phase: {isRunning ? wsStatus : latestResult ? 'Completed' : 'Idle'}</span>
                <span className="text-apple-blue font-bold">
                  {isRunning ? 'Executing C Subprocess' : latestResult?.isValid ? 'Verified PASS' : ''}
                </span>
              </div>
              <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-apple-blue via-apple-indigo to-apple-teal"
                  animate={{
                    width: isRunning ? '100%' : latestResult ? '100%' : '0%',
                    opacity: isRunning ? [0.6, 1, 0.6] : 1,
                  }}
                  transition={{
                    width: { duration: 0.4 },
                    opacity: isRunning ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 },
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Measured Real Results Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Speedup</span>
              <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                {latestResult ? `${latestResult.speedup.toFixed(2)}x` : '--'}
              </div>
              <span className="text-[10px] text-gray-400">vs Sequential</span>
            </Card>

            <Card className="p-4 text-center">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Efficiency</span>
              <div className="text-2xl font-bold font-mono text-apple-blue dark:text-[#2997FF] mt-1">
                {latestResult ? `${latestResult.efficiency.toFixed(1)}%` : '--'}
              </div>
              <span className="text-[10px] text-gray-400">S / P ratio</span>
            </Card>

            <Card className="p-4 text-center">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Parallel Time</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {latestResult ? `${latestResult.parTimeMs.toFixed(1)}ms` : '--'}
              </div>
              <span className="text-[10px] text-gray-400">Measured Wall-clock</span>
            </Card>

            <Card className="p-4 text-center">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Throughput</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {latestResult ? `${latestResult.gflops.toFixed(2)}` : '--'}
              </div>
              <span className="text-[10px] text-gray-400">GFLOPS</span>
            </Card>
          </div>

          {/* Execution Log & Terminal Console */}
          <Card className="p-5 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-apple-blue" />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Real-time Subprocess Output & WebSocket Telemetry
                </span>
              </div>
              <Badge variant={isRunning ? 'green' : 'gray'} size="sm" dot={isRunning}>
                {isRunning ? 'Live Stream' : 'Ready'}
              </Badge>
            </div>

            <div className="h-56 bg-black/40 dark:bg-black/60 rounded-xl p-3 text-xs overflow-y-auto space-y-1.5 border border-white/5 font-mono">
              {executionLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-gray-600 select-none">&gt;</span>
                  <span
                    className={
                      log.includes('[COMPLETED]') || log.includes('SUCCESS')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('[ERROR]') || log.includes('[Cancel Error]')
                        ? 'text-rose-400 font-semibold'
                        : log.includes('[RUNNING]')
                        ? 'text-apple-blue font-semibold'
                        : log.includes('[Notice]') || log.includes('[Tip]')
                        ? 'text-amber-400'
                        : 'text-gray-300'
                    }
                  >
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span>Backend: FastAPI 127.0.0.1:8000</span>
              <span>Subprocess: Controlled argv exec</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
