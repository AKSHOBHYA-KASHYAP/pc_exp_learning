import React from 'react';

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
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        {label && <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>}
        <span className="font-mono font-semibold text-apple-blue dark:text-apple-teal px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-teal-500/10">
          {value} {unit}
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0071E3] dark:accent-[#2997FF] focus:outline-none"
          style={{
            background: `linear-gradient(to right, #0071E3 0%, #0071E3 ${percentage}%, rgba(255,255,255,0.12) ${percentage}%, rgba(255,255,255,0.12) 100%)`
          }}
        />
      </div>
      {marks && (
        <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 px-0.5">
          {marks.map((mark) => (
            <span
              key={mark}
              onClick={() => !disabled && onChange(mark)}
              className={`cursor-pointer hover:text-apple-blue transition-colors ${
                mark === value ? 'font-bold text-apple-blue dark:text-apple-teal' : ''
              }`}
            >
              {mark}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
