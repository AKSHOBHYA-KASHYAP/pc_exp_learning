import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-b from-[#2997FF] to-[#0071E3] text-white shadow-sm hover:shadow-glow-blue border border-white/20 active:brightness-95',
    secondary:
      'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/15 border border-transparent dark:border-white/5',
    glass:
      'bg-white/40 dark:bg-white/5 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm',
    danger:
      'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm hover:shadow-[0_0_20px_-3px_rgba(244,63,94,0.4)] border border-white/20',
  }[variant];

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  );
};
