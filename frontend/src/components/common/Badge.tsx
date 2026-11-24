import React from 'react';

export type BadgeVariant = 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string; border: string }> = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-600 dark:text-blue-400',
      dotColor: 'bg-blue-500',
      border: 'border-blue-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-600 dark:text-purple-400',
      dotColor: 'bg-purple-500',
      border: 'border-purple-500/20',
    },
    green: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      dotColor: 'bg-emerald-500',
      border: 'border-emerald-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      dotColor: 'bg-amber-500',
      border: 'border-amber-500/20',
    },
    red: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-600 dark:text-rose-400',
      dotColor: 'bg-rose-500',
      border: 'border-rose-500/20',
    },
    gray: {
      bg: 'bg-gray-500/10 dark:bg-gray-500/15',
      text: 'text-gray-600 dark:text-gray-400',
      dotColor: 'bg-gray-400',
      border: 'border-gray-500/20',
    },
  };

  const style = variantStyles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-colors ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} animate-pulse`} />}
      {children}
    </span>
  );
};
