export type SchedulingType = 'static' | 'dynamic' | 'guided' | 'auto';

export type WorkloadType = 'matrix_multiply' | 'vector_add' | 'monte_carlo_pi' | 'mandelbrot' | 'nbody';

export interface ExperimentRun {
  id: string;
  name: string;
  workload: WorkloadType;
  workloadName: string;
  matrixSize: number;
  threads: number;
  scheduling: SchedulingType;
  chunkSize?: number;
  repetitions: number;
  sequentialTimeMs: number;
  parallelTimeMs: number;
  speedup: number;
  efficiency: number;
  gflops?: number;
  timestamp: string;
  status: 'completed' | 'running' | 'failed' | 'simulated';
  cpuModel?: string;
  compiler?: string;
}

export interface ThreadTelemetry {
  threadId: number;
  coreId: number;
  utilization: number; // 0-100%
  iterationsProcessed: number;
  status: 'active' | 'idle' | 'waiting';
  temperature?: number;
}

export interface AIRecommendation {
  workload: string;
  recommendedThreads: number;
  recommendedScheduling: SchedulingType;
  recommendedChunkSize?: number;
  predictedSpeedup: number;
  predictedParallelTimeMs: number;
  efficiencyScore: number;
  rationale: string;
  confidence: number;
}

export interface SystemHardwareInfo {
  cpuModel: string;
  architecture: string;
  physicalCores: number;
  logicalCores: number;
  maxClockGhz: number;
  l3CacheMb: number;
  openmpVersion: string;
  gccVersion: string;
  platform: string;
}

export interface CPUInfoModel {
  physical_cores: number;
  logical_cores: number;
  max_threads: number;
  current_frequency_mhz?: number | null;
  cpu_percent: number;
  model_name: string;
  architecture: string;
}

export interface SystemInfoModel {
  os: string;
  platform: string;
  architecture: string;
  processor: string;
  python_version: string;
  gcc_version: string;
  openmp_supported: boolean;
  execution_mode: string;
  cpu: CPUInfoModel;
  compiler_path: string;
  engine_ready: boolean;
}

export interface ExperimentRunRequest {
  workload?: WorkloadType;
  matrix_size: number;
  threads: number;
  scheduling: SchedulingType | 'all' | 'sequential';
  chunk_size: number;
  repetitions: number;
  run_sequential?: boolean;
}

export interface BenchmarkResultItem {
  name: string;
  scheduling: string;
  threads: number;
  chunk_size: number;
  time_ms: number;
  speedup: number;
  efficiency: number;
  gflops: number;
  checksum: number;
  is_valid: boolean;
  max_diff: number;
}

export interface ExperimentResponse {
  id: string;
  status: 'queued' | 'compiling' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  config: ExperimentRunRequest;
  results: BenchmarkResultItem[];
  sequential_time_ms?: number | null;
  parallel_time_ms?: number | null;
  speedup?: number | null;
  efficiency?: number | null;
  gflops?: number | null;
  is_valid: boolean;
  error_message?: string | null;
  execution_environment?: string;
}
