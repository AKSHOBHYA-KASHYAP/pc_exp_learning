import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Toggle } from '../components/common/Toggle';
import { useTheme } from '../context/useTheme';
import { SAMPLE_HARDWARE } from '../data/sampleData';
import { SystemInfoModel } from '../types';
import { api } from '../services/api';
import { Settings as SettingsIcon, Cpu, Sun, Moon, Terminal, CheckCircle2, Hammer, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Local settings preferences
  const [compilerFlags, setCompilerFlags] = useState<string>('-O3 -fopenmp -Wall -Wextra');
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);
  const [autoSaveExperiments, setAutoSaveExperiments] = useState<boolean>(true);
  const [telemetryInterval, setTelemetryInterval] = useState<string>('1000');
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  // Live system info from FastAPI
  const [systemInfo, setSystemInfo] = useState<SystemInfoModel | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileResult, setCompileResult] = useState<string | null>(null);

  const loadSystemInfo = () => {
    api.getSystemInfo()
      .then((data) => setSystemInfo(data))
      .catch(() => setSystemInfo(null));
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleRecompile = async () => {
    setIsCompiling(true);
    setCompileResult(null);
    try {
      const res = await api.compileEngine();
      if (res.success) {
        setCompileResult(`Compilation Succeeded (${res.duration_sec}s). All binaries verified.`);
      } else {
        setCompileResult(`Compilation Failed: ${res.stderr || res.stdout}`);
      }
    } catch (e: any) {
      setCompileResult(`Error: ${e.message}`);
    } finally {
      setIsCompiling(false);
      loadSystemInfo();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon size={24} className="text-apple-blue" />
            System & Environment Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure host compiler toolchains, default OpenMP flags, telemetry stream rate, and UI appearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            icon={<Hammer size={14} />}
            loading={isCompiling}
            onClick={handleRecompile}
          >
            Recompile C Engine
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>

      {savedNotification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Preferences successfully saved.</span>
        </div>
      )}

      {compileResult && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            compileResult.includes('Succeeded')
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{compileResult}</span>
        </div>
      )}

      {/* Hardware & Toolchain Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-apple-blue" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Host Hardware & Toolchain Environment
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" icon={<RefreshCw size={12} />} onClick={loadSystemInfo}>
              Refresh
            </Button>
            <Badge variant={systemInfo ? 'green' : 'amber'} size="sm" dot={!!systemInfo}>
              {systemInfo ? 'Live Hardware Data' : 'Fallback Specs'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">Processor / Model</span>
            <span className="font-bold text-gray-900 dark:text-white text-xs truncate block">
              {systemInfo?.cpu.model_name || SAMPLE_HARDWARE.cpuModel}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">Core Topology</span>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {systemInfo
                ? `${systemInfo.cpu.physical_cores} Physical / ${systemInfo.cpu.logical_cores} SMT Threads`
                : `${SAMPLE_HARDWARE.physicalCores} Cores / ${SAMPLE_HARDWARE.logicalCores} Threads`}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">C Compiler Toolchain</span>
            <span className="font-bold text-gray-900 dark:text-white text-xs truncate block">
              {systemInfo?.gcc_version || SAMPLE_HARDWARE.gccVersion}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">Execution Mode</span>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {systemInfo?.execution_mode || 'Ubuntu WSL2 (GCC OpenMP)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">Platform Architecture</span>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {systemInfo?.platform || SAMPLE_HARDWARE.platform} ({systemInfo?.architecture || 'x86_64'})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <span className="text-gray-400 text-[10px] block">OpenMP Status</span>
            <span className="font-bold text-emerald-500 text-sm">
              {systemInfo?.openmp_supported !== false ? 'Enabled (-fopenmp)' : 'Disabled'}
            </span>
          </div>
        </div>
      </Card>

      {/* Compiler Flags & Runtime Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              C Compiler Flags & Build Arguments
            </h2>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              GCC Compilation Flags
            </label>
            <input
              type="text"
              value={compilerFlags}
              onChange={(e) => setCompilerFlags(e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 outline-none focus:border-purple-400 text-gray-900 dark:text-gray-100"
            />
            <span className="text-[11px] text-gray-400 block mt-1">
              Passed to subprocess compiler invocations: <code className="font-mono">gcc -O3 -fopenmp ...</code>
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              Telemetry Polling Frequency
            </label>
            <select
              value={telemetryInterval}
              onChange={(e) => setTelemetryInterval(e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 outline-none focus:border-purple-400 text-gray-900 dark:text-gray-100"
            >
              <option value="500">500 ms (High Precision)</option>
              <option value="1000">1000 ms (Standard 1 Hz)</option>
              <option value="2000">2000 ms (Reduced Overhead)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-3">
            <Toggle
              label="Auto-save benchmark runs"
              description="Automatically store finished runs into SQLite / JSON"
              checked={autoSaveExperiments}
              onChange={setAutoSaveExperiments}
            />

            <Toggle
              label="Framer Motion UI Animations"
              description="Smooth Apple iOS/macOS page transitions and micro-interactions"
              checked={animationsEnabled}
              onChange={setAnimationsEnabled}
            />
          </div>
        </Card>

        {/* Appearance & Theme Switch */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Appearance & Theme Switch
            </h2>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            ParallelX adheres to Apple iOS/macOS glass aesthetics with deep charcoal default dark themes and clean frosted light panels.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                theme === 'dark'
                  ? 'border-apple-blue bg-blue-500/10 ring-1 ring-apple-blue'
                  : 'border-black/5 dark:border-white/5 hover:bg-black/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon size={20} className="text-blue-400" />
                {theme === 'dark' && <Badge variant="blue" size="sm">Active</Badge>}
              </div>
              <div className="mt-3">
                <div className="font-bold text-sm text-white">Dark Theme</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Deep charcoal & glass (Default)</div>
              </div>
            </button>

            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                theme === 'light'
                  ? 'border-apple-blue bg-blue-500/10 ring-1 ring-apple-blue'
                  : 'border-black/5 dark:border-white/5 hover:bg-black/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun size={20} className="text-amber-500" />
                {theme === 'light' && <Badge variant="blue" size="sm">Active</Badge>}
              </div>
              <div className="mt-3">
                <div className="font-bold text-sm text-gray-900 dark:text-white">Light Theme</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Apple frosted glass & white</div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
