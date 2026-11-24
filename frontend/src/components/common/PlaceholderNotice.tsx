import React from 'react';
import { Info } from 'lucide-react';

interface PlaceholderNoticeProps {
  phase?: string;
  message?: string;
  className?: string;
}

export const PlaceholderNotice: React.FC<PlaceholderNoticeProps> = ({
  phase = 'Phase 1 UI Foundation',
  message = 'Sample metrics and charts shown below are demonstrative placeholders for the frontend layout. In Phase 2, real OpenMP C executions and ML benchmarks will populate this view.',
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 backdrop-blur-md ${className}`}
    >
      <Info size={15} className="shrink-0 text-amber-500" />
      <div className="flex-1">
        <span className="font-semibold uppercase tracking-wider text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
          {phase}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};
