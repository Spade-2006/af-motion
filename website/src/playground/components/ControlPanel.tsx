import React from "react";
import { cn } from "@/utils/cn";

export interface SliderControlProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly unit?: string;
  readonly onChange: (value: number) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-slate-300">
          {label}
        </label>
        <span className="font-mono text-[11px] text-cyan-300">
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full min-h-[24px] py-2 bg-transparent rounded-full appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      />
    </div>
  );
};

export interface SelectControlProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly onChange: (value: string) => void;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  id,
  label,
  value,
  options,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-[#0d1018] border border-white/[0.1] px-2.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export interface ToggleControlProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export const ToggleControl: React.FC<ToggleControlProps> = ({
  id,
  label,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-300 cursor-pointer">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
          checked ? "bg-indigo-600" : "bg-white/[0.12]"
        )}
      >
        <span
          className={cn(
            "block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4.5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
};

export const ControlSection: React.FC<{
  readonly title: string;
  readonly children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="space-y-3.5 pb-4 border-b border-white/[0.06] last:border-b-0 last:pb-0">
    <h4 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
      {title}
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);
