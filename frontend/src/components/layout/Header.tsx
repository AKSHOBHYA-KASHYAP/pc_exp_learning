import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/useTheme';
import { Sun, Moon, Cpu, Play, Bell, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [cpuStatus, setCpuStatus] = useState<string>('12 Cores / 16 Threads');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    api.getCpuInfo()
      .then((cpu) => {
        setCpuStatus(`${cpu.physical_cores} Cores / ${cpu.logical_cores} Threads`);
        setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/lab':
        return 'Parallel Execution Lab';
      case '/scheduling':
        return 'Scheduling Strategies';
      case '/monitor':
        return 'Live Performance Monitor';
      case '/ai-engine':
        return 'AI Prediction Engine';
      case '/analytics':
        return 'Scalability Analytics';
      case '/history':
        return 'Experiment History';
      case '/reports':
        return 'Reports & Exports';
      case '/settings':
        return 'System & Environment Settings';
      default:
        return 'ParallelX Platform';
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 transition-all duration-300 ease-in-out apple-glass border-b border-black/5 dark:border-white/10 flex items-center justify-between px-6 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/10 text-apple-blue dark:bg-blue-500/15 dark:text-[#2997FF] border border-blue-500/20">
          <ShieldCheck size={12} />
          Case Study 7
        </span>
      </div>

      {/* Right: Quick actions, system indicators, theme toggle */}
      <div className="flex items-center gap-3">
        {/* Core status badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 font-mono">
          <Cpu size={14} className="text-apple-blue dark:text-apple-teal" />
          <span>{cpuStatus}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        </div>

        {/* Quick Launch Lab Button if not currently on /lab */}
        {location.pathname !== '/lab' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/lab')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-apple-blue to-apple-indigo text-white shadow-sm hover:shadow-glow-blue transition-all"
          >
            <Play size={13} fill="currentColor" />
            <span>Open Lab</span>
          </motion.button>
        )}

        {/* Theme switch button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 border border-black/5 dark:border-white/10 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400 transition-transform rotate-0" />
          ) : (
            <Moon size={17} className="text-blue-600 transition-transform rotate-0" />
          )}
        </motion.button>

        {/* Notification pill */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/10 transition-colors"
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-apple-blue animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
};
