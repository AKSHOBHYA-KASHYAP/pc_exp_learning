import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ParallelLab } from './pages/ParallelLab';
import { SchedulingStrategies } from './pages/SchedulingStrategies';
import { LiveMonitor } from './pages/LiveMonitor';
import { AIPredictionEngine } from './pages/AIPredictionEngine';
import { ScalabilityAnalytics } from './pages/ScalabilityAnalytics';
import { ExperimentHistory } from './pages/ExperimentHistory';
import { ReportsExports } from './pages/ReportsExports';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewDashboard />} />
            <Route path="overview" element={<Navigate to="/" replace />} />
            <Route path="lab" element={<ParallelLab />} />
            <Route path="scheduling" element={<SchedulingStrategies />} />
            <Route path="monitor" element={<LiveMonitor />} />
            <Route path="ai-engine" element={<AIPredictionEngine />} />
            <Route path="analytics" element={<ScalabilityAnalytics />} />
            <Route path="history" element={<ExperimentHistory />} />
            <Route path="reports" element={<ReportsExports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
