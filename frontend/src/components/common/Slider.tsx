import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  disabled?: boolean;
  marks?: number[];
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit = '',
  disabled = false,
  marks,
}) => {
  // Clamped percentage of current value along [min, max]
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, value - step);
    onChange(Number(next.toFixed(4)));
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = Math.min(max, value + step);
    onChange(Number(next.toFixed(4)));
  };

  return (
    <div className="w-full space-y-2 select-none">
      {/* Label and Stepper Header */}
      <div className="flex justify-between items-center text-sm">
        {label && (
          <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            {label}
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            disabled={disabled || value <= min}
            onClick={handleDecrement}
            className="w-5 h-5 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Decrement"
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>

          <span className="font-mono font-semibold text-apple-blue dark:text-apple-teal px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-teal-500/10 text-xs min-w-[50px] text-center border border-blue-500/20 dark:border-teal-500/20">
            {value} {unit}
          </span>

          <button
            type="button"
            disabled={disabled || value >= max}
            onClick={handleIncrement}
            className="w-5 h-5 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Increment"
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Slider Track with Native Range and Tick Marks */}
      <div className="relative flex items-center py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="apple-range-slider relative z-10 w-full cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, #0071E3 0%, #0071E3 ${percentage}%, rgba(140, 140, 145, 0.25) ${percentage}%, rgba(140, 140, 145, 0.25) 100%)`
          }}
        />
      </div>

      {/* Proportional Absolute-Positioned Marks & Ticks */}
      {marks && marks.length > 0 && (
        <div className="relative w-full h-6 mt-0.5">
          {marks.map((mark) => {
            const markPct = Math.max(0, Math.min(100, ((mark - min) / (max - min)) * 100));

            // Prevent clipping on the extreme left and right boundaries
            let alignClass = '-translate-x-1/2 text-center';
            if (markPct < 6) {
              alignClass = 'translate-x-0 text-left';
            } else if (markPct > 94) {
              alignClass = '-translate-x-full text-right';
            }

            const isSelected = mark === value;
            const isPassed = mark <= value;

            return (
              <div
                key={mark}
                onClick={() => !disabled && onChange(mark)}
                style={{ left: `${markPct}%` }}
                className={`absolute top-0 flex flex-col items-center cursor-pointer group transition-all ${alignClass}`}
              >
                {/* Visual Tick Pin */}
                <div
                  className={`w-1 h-1.5 rounded-full mb-1 transition-all duration-150 ${
                    isSelected
                      ? 'bg-apple-blue dark:bg-apple-teal scale-125'
                      : isPassed
                      ? 'bg-blue-400/80 dark:bg-teal-400/80'
                      : 'bg-gray-300 dark:bg-white/20'
                  } group-hover:bg-apple-blue group-hover:scale-125`}
                />
                {/* Mark Label */}
                <span
                  className={`text-[10px] font-mono leading-none transition-colors ${
                    isSelected
                      ? 'font-bold text-apple-blue dark:text-apple-teal'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                  }`}
                >
                  {mark}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
