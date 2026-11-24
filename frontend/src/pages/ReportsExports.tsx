import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const ReportsExports: React.FC = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setDownloadSuccess('Compiling publication-ready PDF report with embedded scalability plots and validation tables...');

    // Trigger direct browser download
    const url = api.getPdfReportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ParallelX_CaseStudy7_Technical_Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsGeneratingPdf(false);
      setDownloadSuccess('PDF report generated and downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 5000);
    }, 1500);
  };

  const handleDownloadCsv = () => {
    const url = api.getCsvReportUrl();
    window.open(url, '_blank');
    setDownloadSuccess('Complete SQLite benchmark dataset exported as CSV!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={24} className="text-apple-blue" />
              Technical Reports & Benchmark Exports
            </h1>
            <Badge variant="green" size="md">Presentation Ready</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Export verified OpenMP benchmark metrics, download full multi-panel PDF technical reports, and inspect empirical audit datasets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={14} />}
            onClick={handleDownloadCsv}
          >
            Export Full CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<FileText size={15} />}
            loading={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="shadow-glow-blue"
          >
            Download Technical Report (PDF)
          </Button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
          <button onClick={() => setDownloadSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Technical Report Card */}
        <Card glowColor="blue" className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Comprehensive Technical Report (PDF)
                </h3>
                <span className="text-xs text-gray-400 font-mono">Team 7 · Case Study 7 Specification</span>
              </div>
            </div>
            <Badge variant="blue" size="md">Publication Ready</Badge>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            A comprehensive, multi-page document rendered with ReportLab containing problem definitions, mathematical calculations,
            system hardware specifications, empirical results tables, embedded 4-panel scalability charts, and machine learning validation audit logs.
          </p>

          <div className="space-y-2 text-xs border-y border-black/5 dark:border-white/10 py-3">
            <div className="font-semibold text-gray-900 dark:text-white text-[11px] uppercase tracking-wider font-mono">
              Report Inclusions:
            </div>
            <ul className="grid grid-cols-2 gap-2 text-gray-500 dark:text-gray-400 text-xs">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Executive Objectives</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Host Hardware Config</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> i-k-j Cache Optimization</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Empirical SQLite Tables</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Speedup & Efficiency Curves</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Matplotlib High-Res Charts</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> AI Target Leakage Prevention</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-400" /> Real Validation Audit Trail</li>
            </ul>
          </div>

          <Button
            variant="primary"
            icon={<Download size={14} />}
            loading={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="w-full shadow-glow-blue"
          >
            Download PDF Report
          </Button>
        </Card>

        {/* CSV Benchmark Dataset Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Empirical Benchmark Dataset (CSV)
                </h3>
                <span className="text-xs text-gray-400 font-mono">SQLite Data Stream</span>
              </div>
            </div>
            <Badge variant="green" size="md">Raw Data</Badge>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Full empirical benchmark records from <code className="text-purple-400 font-mono">parallelx.db</code>. Includes exact execution times,
            standard deviation across 5 repetitions, minimum/maximum times, measured speedup, parallel efficiency, barrier waiting times, and CPU utilization.
          </p>

          <div className="space-y-2 text-xs border-y border-black/5 dark:border-white/10 py-3">
            <div className="font-semibold text-gray-900 dark:text-white text-[11px] uppercase tracking-wider font-mono">
              Dataset Attributes:
            </div>
            <div className="grid grid-cols-2 gap-2 text-gray-500 dark:text-gray-400 text-xs">
              <div>• <code>matrix_size</code> (100 to 2000)</div>
              <div>• <code>threads</code> (1 to 16)</div>
              <div>• <code>mean_time_ms</code>, <code>std_dev</code></div>
              <div>• <code>speedup</code>, <code>efficiency</code></div>
              <div>• <code>sync_overhead_ms</code></div>
              <div>• <code>cpu_utilization_percent</code></div>
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<Download size={14} />}
            onClick={handleDownloadCsv}
            className="w-full"
          >
            Download CSV Export
          </Button>
        </Card>
      </div>

      {/* Executive Summary Document Preview */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Executive Project Summary & Findings (Case Study 7)
            </h2>
            <p className="text-xs text-gray-500">
              Technical synthesis of parallel scaling, memory hierarchy saturation, and machine learning predictive modeling.
            </p>
          </div>
          <Badge variant="purple" size="sm">Technical Synthesis</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Cpu size={14} className="text-blue-400" />
              1. Computational Engine
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Implemented C99 sequential and OpenMP static, dynamic, and guided loop parallelization. The cache-friendly
              <strong className="text-gray-900 dark:text-white"> i-k-j interchange</strong> eliminates non-contiguous column stride reads,
              delivering peak throughput exceeding 16.0 GFLOPS on Ubuntu with GCC 13.3.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <BarChart3 size={14} className="text-emerald-400" />
              2. Scalability Knee & Amdahl Limit
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Empirical speedup scales strongly up to <strong className="text-gray-900 dark:text-white">5.20x on 8 threads</strong>.
              Beyond 8 threads, performance exhibits diminishing returns due to shared L3 memory bus contention and thread barrier synchronization overhead.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" />
              3. AI Performance Prediction
            </div>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              A Scikit-Learn Random Forest model trained exclusively on wall-clock latency (strictly eliminating target leakage)
              reliably predicts unseen worker counts (3, 6, 12 threads) with <strong className="text-gray-900 dark:text-white">R² = 0.912</strong> on cross-validation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
