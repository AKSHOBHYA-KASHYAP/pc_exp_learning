import { ExperimentRun, AIRecommendation, SystemHardwareInfo } from '../types';

/**
 * PHASE 1 SAMPLE PLACEHOLDER DATA
 * Notice: This is simulated placeholder data for UI layout and preview verification only.
 * In Phase 2 and subsequent phases, actual C/OpenMP execution and ML predictions will be used.
 */

export const SAMPLE_HARDWARE: SystemHardwareInfo = {
  cpuModel: "Intel(R) Core(TM) i7 / AMD Ryzen (Simulated Preview)",
  architecture: "x86_64 / AVX2 Supported",
  physicalCores: 8,
  logicalCores: 16,
  maxClockGhz: 4.8,
  l3CacheMb: 24,
  openmpVersion: "OpenMP 4.5 / 5.0",
  gccVersion: "GCC 6.3.0+ (MinGW/Linux)",
  platform: "Local Host Environment"
};

export const SAMPLE_EXPERIMENTS: ExperimentRun[] = [
  {
    id: "EXP-9842",
    name: "Dense Matrix Multiply (1024x1024)",
    workload: "matrix_multiply",
    workloadName: "Matrix Multiplication (O(N³))",
    matrixSize: 1024,
    threads: 8,
    scheduling: "dynamic",
    chunkSize: 32,
    repetitions: 3,
    sequentialTimeMs: 4210.45,
    parallelTimeMs: 585.12,
    speedup: 7.19,
    efficiency: 89.9,
    gflops: 3.67,
    timestamp: "2026-11-18 12:15:30",
    status: "simulated",
  },
  {
    id: "EXP-9841",
    name: "Monte Carlo Pi Estimation (10M)",
    workload: "monte_carlo_pi",
    workloadName: "Monte Carlo π Simulation",
    matrixSize: 1000,
    threads: 16,
    scheduling: "static",
    repetitions: 5,
    sequentialTimeMs: 1850.20,
    parallelTimeMs: 135.40,
    speedup: 13.66,
    efficiency: 85.4,
    gflops: 2.15,
    timestamp: "2026-11-18 11:42:10",
    status: "simulated",
  },
  {
    id: "EXP-9840",
    name: "Dense Matrix Multiply (512x512)",
    workload: "matrix_multiply",
    workloadName: "Matrix Multiplication (O(N³))",
    matrixSize: 512,
    threads: 4,
    scheduling: "guided",
    chunkSize: 16,
    repetitions: 3,
    sequentialTimeMs: 530.12,
    parallelTimeMs: 145.24,
    speedup: 3.65,
    efficiency: 91.2,
    gflops: 3.71,
    timestamp: "2026-11-18 11:10:05",
    status: "simulated",
  },
  {
    id: "EXP-9839",
    name: "Mandelbrot Fractal Computation",
    workload: "mandelbrot",
    workloadName: "Mandelbrot Set Generation",
    matrixSize: 2048,
    threads: 8,
    scheduling: "dynamic",
    chunkSize: 16,
    repetitions: 2,
    sequentialTimeMs: 6420.00,
    parallelTimeMs: 890.50,
    speedup: 7.21,
    efficiency: 90.1,
    gflops: 4.10,
    timestamp: "2026-11-18 10:25:18",
    status: "simulated",
  },
  {
    id: "EXP-9838",
    name: "Dense Matrix Multiply (256x256)",
    workload: "matrix_multiply",
    workloadName: "Matrix Multiplication (O(N³))",
    matrixSize: 256,
    threads: 2,
    scheduling: "static",
    repetitions: 5,
    sequentialTimeMs: 68.40,
    parallelTimeMs: 36.20,
    speedup: 1.89,
    efficiency: 94.5,
    gflops: 3.40,
    timestamp: "2026-11-18 09:50:44",
    status: "simulated",
  }
];

export const SAMPLE_THREAD_SCALABILITY = [
  { threads: 1, idealSpeedup: 1, actualSpeedup: 1.0, efficiency: 100, amdahlCeiling: 1.0, timeMs: 4210 },
  { threads: 2, idealSpeedup: 2, actualSpeedup: 1.94, efficiency: 97.0, amdahlCeiling: 1.92, timeMs: 2170 },
  { threads: 4, idealSpeedup: 4, actualSpeedup: 3.76, efficiency: 94.0, amdahlCeiling: 3.64, timeMs: 1120 },
  { threads: 8, idealSpeedup: 8, actualSpeedup: 7.19, efficiency: 89.9, amdahlCeiling: 6.67, timeMs: 585 },
  { threads: 12, idealSpeedup: 12, actualSpeedup: 9.85, efficiency: 82.1, amdahlCeiling: 9.23, timeMs: 427 },
  { threads: 16, idealSpeedup: 16, actualSpeedup: 11.45, efficiency: 71.5, amdahlCeiling: 11.43, timeMs: 367 },
  { threads: 24, idealSpeedup: 24, actualSpeedup: 12.10, efficiency: 50.4, amdahlCeiling: 14.12, timeMs: 348 },
  { threads: 32, idealSpeedup: 32, actualSpeedup: 12.30, efficiency: 38.4, amdahlCeiling: 16.00, timeMs: 342 },
];

export const SAMPLE_SCHEDULING_COMPARISON = [
  { strategy: 'static', chunk: 'Default', speedup: 6.45, overheadUs: 12, loadImbalance: 'High (32%)', desc: 'Predictable work distribution with lowest scheduling overhead.' },
  { strategy: 'static', chunk: '32', speedup: 6.82, overheadUs: 28, loadImbalance: 'Medium (18%)', desc: 'Round-robin block distribution; reduces coarse imbalance.' },
  { strategy: 'dynamic', chunk: '16', speedup: 7.25, overheadUs: 110, loadImbalance: 'Minimal (4%)', desc: 'Lock-based work stealing/queue; ideal for non-uniform loops.' },
  { strategy: 'guided', chunk: '8', speedup: 7.42, overheadUs: 64, loadImbalance: 'Low (6%)', desc: 'Exponentially decreasing chunk sizes; balance between overhead and balance.' },
  { strategy: 'auto', chunk: 'Compiler', speedup: 6.90, overheadUs: 45, loadImbalance: 'Low (12%)', desc: 'Delegated to compiler/runtime heuristic.' },
];

export const SAMPLE_AI_RECOMMENDATION: AIRecommendation = {
  workload: "Dense Matrix Multiply (1024x1024)",
  recommendedThreads: 8,
  recommendedScheduling: "guided",
  recommendedChunkSize: 16,
  predictedSpeedup: 7.34,
  predictedParallelTimeMs: 573.5,
  efficiencyScore: 91.8,
  confidence: 94.2,
  rationale: "For a 1024x1024 double-precision matrix workload on this 8-core/16-thread host, scaling beyond 8 physical cores encounters memory bandwidth saturation and cache-line contention. The 'guided' schedule minimizes thread idle time during outer loop chunking."
};
