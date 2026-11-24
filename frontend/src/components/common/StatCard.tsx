import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: 'blue' | 'purple' | 'green' | 'amber' | 'cyan';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  glowColor?: 'blue' | 'purple' | 'mint' | 'orange' | 'none';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'blue',
  trend,
  glowColor = 'none',
}) => {
  const iconColorStyles = {
    blue: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
    green: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/20',
  }[iconColor];

  return (
    <Card hoverEffect glowColor={glowColor} className="p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-gray-900 dark:text-white font-mono">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl border backdrop-blur-md shrink-0 ${iconColorStyles}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                trend.isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
