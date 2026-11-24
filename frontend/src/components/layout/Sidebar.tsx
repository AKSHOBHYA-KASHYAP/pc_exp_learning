import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  GitBranch,
  Activity,
  Sparkles,
  LineChart,
  History,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const navigationItems = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard, badge: null },
    { name: 'Parallel Execution Lab', path: '/lab', icon: Cpu, badge: 'Core' },
    { name: 'Scheduling Strategies', path: '/scheduling', icon: GitBranch, badge: null },
    { name: 'Live Performance Monitor', path: '/monitor', icon: Activity, badge: 'Live' },
    { name: 'AI Prediction Engine', path: '/ai-engine', icon: Sparkles, badge: 'AI' },
    { name: 'Scalability Analytics', path: '/analytics', icon: LineChart, badge: null },
    { name: 'Experiment History', path: '/history', icon: History, badge: '5' },
    { name: 'Reports & Exports', path: '/reports', icon: FileSpreadsheet, badge: null },
    { name: 'Settings', path: '/settings', icon: Settings, badge: null },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out flex flex-col justify-between apple-glass border-r border-black/5 dark:border-white/10 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0071E3] via-[#5E5CE6] to-[#AF52DE] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Layers size={22} className="transform -rotate-6" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Parallel<span className="text-[#2997FF]">X</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500 dark:text-gray-400">
                    Team 7 · OpenMP
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-500/10 text-apple-blue dark:bg-blue-500/15 dark:text-[#2997FF] shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? 'text-apple-blue dark:text-[#2997FF]' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />

                    {!collapsed && (
                      <span className="flex-1 whitespace-nowrap truncate">{item.name}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          item.badge === 'Live'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse'
                            : item.badge === 'AI'
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-apple-blue dark:bg-[#2997FF] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-black/5 dark:border-white/10">
        <div
          className={`rounded-xl p-2.5 transition-colors bg-black/5 dark:bg-white/5 flex items-center ${
            collapsed ? 'justify-center' : 'gap-2.5'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Terminal size={16} />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                C + OpenMP Engine
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Phase 1 Active
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
