import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
  glowColor?: 'blue' | 'purple' | 'mint' | 'orange' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glass = true,
  glowColor = 'none',
  ...props
}) => {
  const glowClasses = {
    blue: 'hover:shadow-glow-blue',
    purple: 'hover:shadow-glow-purple',
    mint: 'hover:shadow-glow-mint',
    orange: 'hover:shadow-[0_0_25px_-5px_rgba(255,159,10,0.35)]',
    none: '',
  }[glowColor];

  return (
    <div
      className={`rounded-2xl transition-all duration-300 relative overflow-hidden ${
        glass ? 'apple-glass-card' : 'bg-white dark:bg-[#141519] border border-gray-200 dark:border-white/10'
      } ${hoverEffect ? 'apple-glass-card-hover cursor-pointer' : ''} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
