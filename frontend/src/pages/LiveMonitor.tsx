import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PlaceholderNotice } from '../components/common/PlaceholderNotice';
import { Activity, Cpu, Play, Pause, RefreshCw, Zap, Flame, HardDrive } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface StreamPoint {
  time: string;
  totalCpu: number;
  throughputGflops: number;
  memoryBandwidthGbps: number;
}

export const LiveMonitor: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  // Core utilization state
  const [coreLoads, setCoreLoads] = useState<number[]>([
    82, 78, 85, 91, 74, 88, 79, 83, 14, 22, 18, 12, 19, 25, 16, 21
  ]);

  // Time-series stream buffer
  const [streamData, setStreamData] = useState<StreamPoint[]>([
    { time: '12:00:01', totalCpu: 68, throughputGflops: 3.4, memoryBandwidthGbps: 28.5 },
    { time: '12:00:02', totalCpu: 72, throughputGflops: 3.5, memoryBandwidthGbps: 30.2 },
    { time: '12:00:03', totalCpu: 79, throughputGflops: 3.8, memoryBandwidthGbps: 32.1 },
    { time: '12:00:04', totalCpu: 84, throughputGflops: 3.9, memoryBandwidthGbps: 34.0 },
    { time: '12:00:05', totalCpu: 82, throughputGflops: 3.7, memoryBandwidthGbps: 31.8 },
    { time: '12:00:06', totalCpu: 88, throughputGflops: 4.1, memoryBandwidthGbps: 35.4 },
    { time: '12:00:07', totalCpu: 85, throughputGflops: 4.0, memoryBandwidthGbps: 33.9 },
  ]);

  // Periodic simulated ticker when streaming is active
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      // Update core loads
      setCoreLoads((prev) =>
        prev.map((val, idx) => {
          if (idx < 8) {
            return Math.min(100, Math.max(40, Math.floor(val + (Math.random() * 16 - 8))));
          } else {
            return Math.min(100, Math.max(5, Math.floor(val + (Math.random() * 12 - 6))));
          }
        })
      );

      // Append new stream point
      setStreamData((prev) => {
        const nextCpu = Math.floor(65 + Math.random() * 25);
        const nextGflops = Number((3.2 + Math.random() * 0.9).toFixed(2));
        const nextBw = Number((28 + Math.random() * 8).toFixed(1));

        const updated = [...prev.slice(-14), {
          time: timeStr,
          totalCpu: nextCpu,
          throughputGflops: nextGflops,
          memoryBandwidthGbps: nextBw,
        }];
        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const avgLoad = Math.round(coreLoads.reduce((a, b) => a + b, 0) / coreLoads.length);
  const currentGflops = streamData[streamData.length - 1]?.throughputGflops || 3.8;
  const currentBw = streamData[streamData.length - 1]?.memoryBandwidthGbps || 32.0;

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={24} className="text-emerald-500 animate-pulse" />
              Live Performance Monitor
            </h1>
            <Badge variant="green" dot>
              {isStreaming ? 'Streaming Live (1.2s)' : 'Paused'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time multi-core thread load, throughput (GFLOPS), memory bus bandwidth, and thermal telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isStreaming ? 'secondary' : 'primary'}
            size="sm"
            icon={isStreaming ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            onClick={() => setIsStreaming(!isStreaming)}
          >
            {isStreaming ? 'Pause Stream' : 'Resume Stream'}
          </Button>
          <Button
            variant="glass"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => {
              setCoreLoads(Array.from({ length: 16 }, () => Math.floor(50 + Math.random() * 40)));
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Real-time KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-apple-blue border border-blue-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400">Total CPU Usage</div>
            <div className="text-xl font-bold font-mono text-gray-900 dark:text-white">{avgLoad}%</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400">Throughput</div>
            <div className="text-xl font-bold font-mono text-amber-400">{currentGflops} GFLOPS</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400">DRAM Bandwidth</div>
            <div className="text-xl font-bold font-mono text-purple-400">{currentBw} GB/s</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400">Package Temp</div>
            <div className="text-xl font-bold font-mono text-rose-400">62.4 °C</div>
          </div>
        </Card>
      </div>

      {/* Multi-Core Utilization Meters Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              OpenMP Core Thread Affinity & Utilization (16 Threads)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Per-core workload distribution and thread synchronization barriers
            </p>
          </div>
          <Badge variant="blue" size="sm">SMP Architecture</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {coreLoads.map((load, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-gray-400 mb-2">
                <span>Core {i}</span>
                <span className={load > 85 ? 'text-rose-400 font-bold' : load > 60 ? 'text-amber-400' : 'text-emerald-400'}>
                  {load}%
                </span>
              </div>

              {/* Vertical or Horizontal fill bar */}
              <div className="h-16 w-full bg-black/10 dark:bg-black/30 rounded-lg p-0.5 flex flex-col justify-end">
                <div
                  className={`w-full rounded transition-all duration-300 ${
                    load > 85
                      ? 'bg-gradient-to-t from-rose-500 to-amber-500'
                      : load > 60
                      ? 'bg-gradient-to-t from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-t from-apple-blue to-apple-teal'
                  }`}
                  style={{ height: `${load}%` }}
                />
              </div>

              <div className="mt-2 text-[10px] text-center font-mono text-gray-400">
                {i < 8 ? 'Physical' : 'Logical SMT'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Real-time Streaming Area Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Throughput & Compute Intensity Timeline
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live moving window (GFLOPS and CPU load)
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">Buffer: 15 samples</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={streamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071E3" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0071E3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gflopsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30D158" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#30D158" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#86868B" fontSize={11} tickLine={false} />
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
              />
              <Area
                type="monotone"
                dataKey="totalCpu"
                name="CPU Utilization (%)"
                stroke="#0071E3"
                strokeWidth={2}
                fill="url(#cpuGradient)"
              />
              <Area
                type="monotone"
                dataKey="memoryBandwidthGbps"
                name="DRAM Bandwidth (GB/s)"
                stroke="#30D158"
                strokeWidth={2}
                fill="url(#gflopsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
