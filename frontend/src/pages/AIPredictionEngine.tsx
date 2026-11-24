import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Slider } from '../components/common/Slider';
import { api } from '../services/api';
import {
  Sparkles,
  Brain,
  Cpu,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Play,
  BarChart3,
  Layers,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

type OptimizationObjective = 'min_time' | 'max_speedup' | 'high_efficiency' | 'balanced';

export const AIPredictionEngine: React.FC = () => {
  // Phase 6 Workflow State
  const [selectedSize, setSelectedSize] = useState<number>(1000);
  const [objective, setObjective] = useState<OptimizationObjective>('balanced');
  const [isAdvising, setIsAdvising] = useState<boolean>(false);
  const [objectiveRecommendation, setObjectiveRecommendation] = useState<any>(null);

  // Execution & Validation State
  const [isExecutingRecommended, setIsExecutingRecommended] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);

  // Phase 5 Custom Predictor Inputs
  const [customDim, setCustomDim] = useState<number>(1000);
  const [customThreads, setCustomThreads] = useState<number>(8);
  const [customStrategy, setCustomStrategy] = useState<string>('guided');
  const [customChunk, setCustomChunk] = useState<number>(16);
  const [isPredictingCustom, setIsPredictingCustom] = useState<boolean>(false);
  const [customPrediction, setCustomPrediction] = useState<any>(null);

  // Model & Retraining State
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainNotice, setRetrainNotice] = useState<string | null>(null);

  // Load Status and Initial Recommendation
  const loadStatusAndHistory = async () => {
    try {
      const [status, valids] = await Promise.all([
        api.getMLStatus(),
        api.getRecentValidations(10),
      ]);
      setMlStatus(status);
      setValidationHistory(valids);
    } catch (err) {
      console.warn('Failed to load ML status or validations:', err);
    }
  };

  const fetchObjectiveRecommendation = async (size: number, obj: OptimizationObjective) => {
    setIsAdvising(true);
    try {
      const res = await api.recommendByObjective(size, obj);
      setObjectiveRecommendation(res);
    } catch (err) {
      console.warn('Failed to fetch objective recommendation:', err);
    } finally {
      setIsAdvising(false);
    }
  };

  const runCustomPredict = async () => {
    setIsPredictingCustom(true);
    try {
      const res = await api.predictPerformance({
        matrix_size: customDim,
        threads: customThreads,
        scheduling: customStrategy,
        chunk_size: customChunk,
      });
      setCustomPrediction(res);
    } catch (err) {
      console.warn('Custom inference error:', err);
    } finally {
      setIsPredictingCustom(false);
    }
  };

  useEffect(() => {
    loadStatusAndHistory();
    fetchObjectiveRecommendation(selectedSize, objective);
    runCustomPredict();
  }, []);

  const handleObjectiveChange = (newObj: OptimizationObjective) => {
    setObjective(newObj);
    fetchObjectiveRecommendation(selectedSize, newObj);
  };

  const handleSizeChange = (newSize: number) => {
    setSelectedSize(newSize);
    fetchObjectiveRecommendation(newSize, objective);
  };

  const handleExecuteRecommended = async () => {
    if (!objectiveRecommendation?.recommended) return;
    const rec = objectiveRecommendation.recommended;
    setIsExecutingRecommended(true);
    setExecutionResult(null);

    try {
      const res = await api.executeRecommended({
        matrix_size: selectedSize,
        threads: rec.threads,
        scheduling: rec.scheduling,
        chunk_size: rec.chunk_size || 16,
        objective: objective,
        predicted_time_ms: rec.predicted_time_ms,
        predicted_speedup: rec.predicted_speedup,
        predicted_efficiency: rec.predicted_efficiency,
      });
      setExecutionResult(res);
      // Refresh validation log
      const valids = await api.getRecentValidations(10);
      setValidationHistory(valids);
    } catch (err: any) {
      alert(`Failed to execute recommended configuration: ${err.message}`);
    } finally {
      setIsExecutingRecommended(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainNotice('Retraining Linear Regression, Decision Tree, and Random Forest on SQLite empirical benchmarks...');
    try {
      const res = await api.trainMLModels();
      setRetrainNotice(`Retraining complete! Best Model: ${res.best_model} (Trained on ${res.training_samples} samples).`);
      await loadStatusAndHistory();
      await fetchObjectiveRecommendation(selectedSize, objective);
    } catch (err) {
      setRetrainNotice(`Retraining failed: ${String(err)}`);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={24} className="text-purple-400" />
              AI Intelligent Execution Advisor
            </h1>
            <Badge variant="purple" size="md">Phase 6 Integrated Engine</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Recommend optimal parallel configurations based on user optimization objectives, execute real C/OpenMP binaries, and validate predictions.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={<RefreshCw size={14} className={isRetraining ? 'animate-spin' : ''} />}
          loading={isRetraining}
          onClick={handleRetrain}
          className="self-start sm:self-auto"
        >
          {isRetraining ? 'Retraining Models...' : 'Retrain ML Engine'}
        </Button>
      </div>

      {retrainNotice && (
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-purple-400 flex-shrink-0" />
            <span>{retrainNotice}</span>
          </div>
          <button onClick={() => setRetrainNotice(null)} className="text-purple-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* PHASE 6 HERO: OBJECTIVE-BASED RECOMMENDATION & ONE-CLICK EXECUTION */}
      <Card glowColor="purple" className="p-6 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Target size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Intelligent Configuration Advisor
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select your problem dimensions and target goal. The AI evaluates hardware constraints and predicts the winning OpenMP parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Host Hardware:</span>
            <Badge variant="blue" size="md">
              <Cpu size={12} className="mr-1" />
              {objectiveRecommendation?.hardware_logical_cpus || 16} Logical Cores Available
            </Badge>
          </div>
        </div>

        {/* User Workflow Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
          {/* Dimension Selector (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              1. Computational Workload Dimension
            </label>
            <Slider
              label="Matrix Dimension (N × N)"
              min={100}
              max={2000}
              step={50}
              value={selectedSize}
              onChange={handleSizeChange}
              unit="x"
              marks={[100, 250, 500, 1000, 1500, 2000]}
            />
          </div>

          {/* Optimization Objective Selector (7 cols) */}
          <div className="md:col-span-7 space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              2. Select Optimization Objective
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'balanced', label: 'Balanced Sweet-Spot', desc: 'Max speedup w/ >55% eff' },
                { id: 'min_time', label: 'Minimum Time', desc: 'Lowest wall-clock latency' },
                { id: 'max_speedup', label: 'Max Speedup', desc: 'Peak scaling factor' },
                { id: 'high_efficiency', label: 'High Efficiency', desc: 'Conserve CPU resources' },
              ].map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleObjectiveChange(obj.id as OptimizationObjective)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    objective === obj.id
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-semibold shadow-glow-purple'
                      : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <div className="font-bold">{obj.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{obj.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendation Result Box */}
        {objectiveRecommendation && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/30 border border-purple-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Award size={20} className="text-amber-400" />
                  <div>
                    <span className="text-xs uppercase font-mono text-gray-400">Primary Recommendation</span>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{objectiveRecommendation.recommended.threads} OpenMP Threads</span>
                      <span className="text-gray-400 font-normal">·</span>
                      <span className="capitalize text-purple-400">{objectiveRecommendation.recommended.scheduling}</span>
                      <span className="text-xs text-gray-400 font-normal">(Chunk {objectiveRecommendation.recommended.chunk_size})</span>
                    </h3>
                  </div>
                </div>

                <Button
                  variant="primary"
                  icon={<Play size={16} />}
                  loading={isExecutingRecommended}
                  onClick={handleExecuteRecommended}
                  className="shadow-glow-purple sm:self-auto self-start"
                >
                  {isExecutingRecommended ? 'Executing on C Engine...' : 'Execute Recommended Configuration'}
                </Button>
              </div>

              {/* 4 Metric Prediction Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-mono text-gray-400">Predicted Time</span>
                  <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                    {objectiveRecommendation.recommended.predicted_time_ms} ms
                  </div>
                  <span className="text-[10px] text-gray-400">
                    CI: [{objectiveRecommendation.recommended.confidence_interval_ms?.[0]}, {objectiveRecommendation.recommended.confidence_interval_ms?.[1]}]
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-mono text-gray-400">Predicted Speedup</span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {objectiveRecommendation.recommended.predicted_speedup}x
                  </div>
                  <span className="text-[10px] text-emerald-500">vs Single-Thread</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-mono text-gray-400">Predicted Efficiency</span>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                    {objectiveRecommendation.recommended.predicted_efficiency}%
                  </div>
                  <span className="text-[10px] text-purple-400">E = S(p)/p</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-mono text-gray-400">Throughput</span>
                  <div className="text-lg font-bold font-mono text-teal-400 mt-0.5">
                    {objectiveRecommendation.recommended.predicted_gflops}
                  </div>
                  <span className="text-[10px] text-teal-500">GFLOPS</span>
                </div>
              </div>

              {/* AI Explanation Text */}
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-gray-300 leading-relaxed">
                <strong className="text-purple-400">Model Rationale:</strong> {objectiveRecommendation.explanation}
              </div>
            </div>

            {/* LIVE PREDICTION VALIDATION RESULT */}
            {executionResult && (
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Physical Execution Completed & Prediction Validated
                    </h4>
                  </div>
                  <Badge variant="green" size="md">
                    {executionResult.error_percent}% Prediction Error
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">Execution Latency</span>
                    <div className="text-sm font-bold font-mono text-white mt-1">
                      {executionResult.actual_time_ms} ms
                    </div>
                    <span className="text-[10px] text-blue-400">Predicted: {executionResult.predicted_time_ms} ms</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">Measured Speedup</span>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                      {executionResult.actual_speedup}x
                    </div>
                    <span className="text-[10px] text-emerald-500">Predicted: {executionResult.predicted_speedup}x</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">Measured Efficiency</span>
                    <div className="text-sm font-bold font-mono text-purple-400 mt-1">
                      {executionResult.actual_efficiency}%
                    </div>
                    <span className="text-[10px] text-purple-400">Predicted: {executionResult.predicted_efficiency}%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">CPU Core Utilization</span>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                      {executionResult.cpu_utilization_percent}%
                    </div>
                    <span className="text-[10px] text-gray-400">{executionResult.throughput_gflops} GFLOPS</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-300">
                  Validation record stored in SQLite (Experiment: <span className="font-mono text-white">{executionResult.experiment_id}</span>).
                </p>
              </div>
            )}

            {/* Alternative Configurations Table */}
            {objectiveRecommendation.alternatives?.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-gray-400 block">
                  Ranked Alternative Configurations Evaluated by AI:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {objectiveRecommendation.alternatives.map((alt: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-gray-200">
                        <span>{alt.threads} Threads ({alt.scheduling})</span>
                        <span className="font-mono text-emerald-400">{alt.predicted_speedup}x</span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex justify-between">
                        <span>Latency: {alt.predicted_time_ms} ms</span>
                        <span>Eff: {alt.predicted_efficiency}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* RECENT PREDICTION VALIDATIONS TABLE */}
      {validationHistory.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Empirical Validation Records (Predicted vs Real C Executions)
              </h3>
              <p className="text-xs text-gray-500">
                Audit trail comparing AI predictions directly against measured GCC OpenMP executions in SQLite.
              </p>
            </div>
            <Badge variant="green" size="sm">SQLite Ground Truth</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-gray-500">
                  <th className="pb-2">Size</th>
                  <th className="pb-2">Threads</th>
                  <th className="pb-2">Strategy</th>
                  <th className="pb-2">Objective</th>
                  <th className="pb-2 text-right">Predicted Time</th>
                  <th className="pb-2 text-right">Actual Time</th>
                  <th className="pb-2 text-right">Predicted Speedup</th>
                  <th className="pb-2 text-right">Actual Speedup</th>
                  <th className="pb-2 text-right">Error %</th>
                  <th className="pb-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {validationHistory.map((v: any) => (
                  <tr key={v.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-mono">{v.matrix_size}×{v.matrix_size}</td>
                    <td className="py-2.5 font-mono font-bold text-purple-400">{v.threads}T</td>
                    <td className="py-2.5 capitalize">{v.scheduling}</td>
                    <td className="py-2.5 capitalize text-gray-400">{v.optimization_objective}</td>
                    <td className="py-2.5 text-right font-mono text-blue-400">{v.predicted_time_ms} ms</td>
                    <td className="py-2.5 text-right font-mono text-gray-900 dark:text-white font-bold">{v.actual_time_ms} ms</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{v.predicted_speedup}x</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400 font-bold">{v.actual_speedup}x</td>
                    <td className="py-2.5 text-right font-mono">
                      <span className={v.error_percent <= 25 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {v.error_percent}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500 text-[10px]">{v.created_at.slice(11, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PHASE 5 MODEL COMPARISON & CUSTOM INFERENCE TOOL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Custom Predictor Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu size={16} className="text-blue-400" />
              Hypothetical Parameter Predictor
            </h3>

            <Slider
              label="Matrix Dimension"
              min={100}
              max={2000}
              step={50}
              value={customDim}
              onChange={setCustomDim}
              unit="x"
              marks={[100, 500, 1000, 2000]}
            />

            <Slider
              label="Worker Threads"
              min={1}
              max={24}
              step={1}
              value={customThreads}
              onChange={setCustomThreads}
              unit="T"
              marks={[1, 4, 8, 16, 24]}
            />

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Strategy
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['static', 'dynamic', 'guided'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCustomStrategy(s)}
                    className={`py-2 px-3 rounded-xl border text-center capitalize transition-all ${
                      customStrategy === s
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                        : 'border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              loading={isPredictingCustom}
              onClick={runCustomPredict}
              className="w-full"
            >
              Predict Custom Execution
            </Button>
          </Card>

          {/* Model Comparison Table */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-mono">
              ML Model Validation Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-gray-500">
                    <th className="pb-2">Model</th>
                    <th className="pb-2 text-right">CV R²</th>
                    <th className="pb-2 text-right">CV MAE</th>
                    <th className="pb-2 text-right">Unseen R²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {mlStatus?.model_comparison &&
                    Object.entries(mlStatus.model_comparison).map(([name, data]: [string, any]) => (
                      <tr key={name} className={name === 'Random Forest' ? 'bg-purple-500/10 font-semibold' : ''}>
                        <td className="py-2 text-gray-900 dark:text-white flex items-center gap-1">
                          {name === 'Random Forest' && <Sparkles size={12} className="text-purple-400" />}
                          {name}
                        </td>
                        <td className="py-2 text-right font-mono text-emerald-400">{data.cv_r2}</td>
                        <td className="py-2 text-right font-mono text-gray-400">{data.cv_mae_ms} ms</td>
                        <td className="py-2 text-right font-mono text-purple-400">{data.unseen_r2}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Custom Predictor Output Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {customPrediction && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    Prediction for {customDim}×{customDim} ({customThreads}T · {customStrategy})
                  </h3>
                  <span className="text-xs text-gray-400">
                    Sequential Baseline: {customPrediction.sequential_baseline_time_ms} ms
                  </span>
                </div>
                <Badge variant="blue" size="md">{customPrediction.confidence_percent}% Confidence</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <span className="text-[10px] uppercase text-gray-400">Latency</span>
                  <div className="text-lg font-bold font-mono text-blue-400">{customPrediction.predicted_time_ms} ms</div>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <span className="text-[10px] uppercase text-gray-400">Speedup</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">{customPrediction.predicted_speedup}x</div>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <span className="text-[10px] uppercase text-gray-400">Efficiency</span>
                  <div className="text-lg font-bold font-mono text-purple-400">{customPrediction.predicted_efficiency}%</div>
                </div>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                  <span className="text-[10px] uppercase text-gray-400">GFLOPS</span>
                  <div className="text-lg font-bold font-mono text-teal-400">{customPrediction.predicted_gflops}</div>
                </div>
              </div>

              {customPrediction.actual_comparison && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span>
                    <strong>Exact Match in DB:</strong> Real runtime: {customPrediction.actual_comparison.actual_time_ms} ms
                  </span>
                  <Badge variant="green" size="sm">{customPrediction.actual_comparison.error_percent}% Error</Badge>
                </div>
              )}

              {customPrediction.extrapolation_warning && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <span>{customPrediction.extrapolation_warning}</span>
                </div>
              )}
            </Card>
          )}

          {/* Random Forest Feature Importance */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 font-mono">
              Key Scalability Drivers (Feature Importance)
            </h3>
            <div className="space-y-2.5 text-xs">
              {mlStatus?.feature_importances?.slice(0, 4).map((f: any, i: number) => (
                <div key={f.feature}>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-mono text-[11px]">{f.feature}</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{f.importance}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-blue-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, f.importance)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
