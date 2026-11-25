import { ExperimentRunRequest, ExperimentResponse, SystemInfoModel, CPUInfoModel } from '../types';

const API_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = 'ws://localhost:8000';

export const api = {
  async getSystemInfo(): Promise<SystemInfoModel> {
    const res = await fetch(`${API_BASE_URL}/api/system/info`);
    if (!res.ok) throw new Error(`Failed to fetch system info: ${res.statusText}`);
    return res.json();
  },

  async getCpuInfo(): Promise<CPUInfoModel> {
    const res = await fetch(`${API_BASE_URL}/api/system/cpu`);
    if (!res.ok) throw new Error(`Failed to fetch CPU info: ${res.statusText}`);
    return res.json();
  },

  async getLiveMetrics(): Promise<{
    total_cpu: number;
    per_cpu: number[];
    memory_percent: number;
    memory_used_gb: number;
    memory_total_gb: number;
    frequency_mhz?: number;
    core_count: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/system/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch live system metrics: ${res.statusText}`);
    return res.json();
  },

  async getEngineStatus(): Promise<{ engine_ready: boolean; compiler: string }> {
    const res = await fetch(`${API_BASE_URL}/api/engine/status`);
    if (!res.ok) throw new Error(`Failed to fetch engine status: ${res.statusText}`);
    return res.json();
  },

  async compileEngine(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/engine/compile`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to trigger compilation: ${res.statusText}`);
    return res.json();
  },

  async runExperiment(config: ExperimentRunRequest): Promise<ExperimentResponse> {
    const res = await fetch(`${API_BASE_URL}/api/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to start experiment');
    }
    return res.json();
  },

  async getExperiment(id: string): Promise<ExperimentResponse> {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch experiment: ${res.statusText}`);
    return res.json();
  },

  async getExperimentHistory(): Promise<ExperimentResponse[]> {
    const res = await fetch(`${API_BASE_URL}/api/experiments`);
    if (!res.ok) throw new Error(`Failed to fetch experiment history: ${res.statusText}`);
    return res.json();
  },

  async cancelExperiment(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/experiments/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to cancel experiment: ${res.statusText}`);
    return res.json();
  },

  /* Phase 4: Analytics & SQLite Framework */
  async getAnalyticsSummary(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/summary`);
    if (!res.ok) throw new Error(`Failed to fetch analytics summary: ${res.statusText}`);
    return res.json();
  },

  async getAnalyticsCurves(matrixSize?: number, scheduling?: string): Promise<any> {
    const params = new URLSearchParams();
    if (matrixSize) params.append('matrix_size', matrixSize.toString());
    if (scheduling) params.append('scheduling', scheduling);
    const res = await fetch(`${API_BASE_URL}/api/analytics/curves?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch analytics curves: ${res.statusText}`);
    return res.json();
  },

  async getAnalyticsRaw(limit: number = 100): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/raw?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch raw analytics: ${res.statusText}`);
    return res.json();
  },

  getExportCsvUrl(): string {
    return `${API_BASE_URL}/api/analytics/export.csv`;
  },

  async triggerBatchBenchmarks(sizes?: number[], threads?: number[], repetitions: number = 5): Promise<any> {
    const params = new URLSearchParams();
    params.append('repetitions', repetitions.toString());
    if (sizes) sizes.forEach(s => params.append('sizes', s.toString()));
    if (threads) threads.forEach(t => params.append('threads_list', t.toString()));

    const res = await fetch(`${API_BASE_URL}/api/analytics/batch?${params.toString()}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to trigger batch benchmarks: ${res.statusText}`);
    return res.json();
  },

  // Phase 5 ML Prediction API
  async getMLStatus(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/status`);
    if (!res.ok) throw new Error(`Failed to fetch ML status: ${res.statusText}`);
    return res.json();
  },

  async trainMLModels(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/train`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to trigger ML training: ${res.statusText}`);
    return res.json();
  },

  async predictPerformance(params: {
    matrix_size: number;
    threads: number;
    scheduling: string;
    chunk_size?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matrix_size: params.matrix_size,
        threads: params.threads,
        scheduling: params.scheduling,
        chunk_size: params.chunk_size ?? 16,
      }),
    });
    if (!res.ok) throw new Error(`Failed to predict parallel performance: ${res.statusText}`);
    return res.json();
  },

  async getMLRecommendation(matrix_size: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrix_size }),
    });
    if (!res.ok) throw new Error(`Failed to get ML recommendation: ${res.statusText}`);
    return res.json();
  },

  async getMLGeneralization(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/generalization`);
    if (!res.ok) throw new Error(`Failed to fetch generalization records: ${res.statusText}`);
    return res.json();
  },

  // Phase 6: Objective-Driven Recommendations & Real Validation Execution
  async recommendByObjective(matrix_size: number, objective: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/recommend-objective`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrix_size, objective }),
    });
    if (!res.ok) throw new Error(`Failed to get objective recommendation: ${res.statusText}`);
    return res.json();
  },

  async executeRecommended(params: {
    matrix_size: number;
    threads: number;
    scheduling: string;
    chunk_size: number;
    objective: string;
    predicted_time_ms: number;
    predicted_speedup: number;
    predicted_efficiency: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/ml/execute-recommended`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Failed to execute recommended experiment: ${res.statusText}`);
    return res.json();
  },

  async getRecentValidations(limit: number = 20): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/ml/validations?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch validation history: ${res.statusText}`);
    return res.json();
  },

  // Phase 7: Downloadable Reports (PDF & CSV)
  getPdfReportUrl(): string {
    return `${API_BASE_URL}/api/reports/download.pdf`;
  },

  getCsvReportUrl(): string {
    return `${API_BASE_URL}/api/reports/download.csv`;
  },
};
