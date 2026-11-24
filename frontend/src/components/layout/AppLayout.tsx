import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0C] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Background subtle gradient ambient glows for Apple glass aesthetics */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-teal-500/10 blur-[130px]" />
      </div>

      {/* Translucent Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top Header Bar */}
      <Header sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content Area */}
      <main
        className={`relative z-10 pt-20 pb-12 px-6 sm:px-8 transition-all duration-300 ease-in-out min-h-screen ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
