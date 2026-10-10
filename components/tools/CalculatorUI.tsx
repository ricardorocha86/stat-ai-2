import React, { useEffect, useId, useRef, useState } from 'react';
import { parseDecimal, toInputText } from '../../services/probability/format';
import { CHART_COLORS } from './ProbabilityCharts';

// Building blocks shared by the probability calculators.

interface NumberFieldProps {
  label: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
}

// Text input that takes a decimal comma or point; the calculator keeps the last valid number.
export const NumberField: React.FC<NumberFieldProps> = ({ label, value, onChange, min, max, integer }) => {
  const id = useId();
  const [text, setText] = useState(() => toInputText(value));
  const focused = useRef(false);

  // Values set by the calculator (clamping, the z ↔ x link) show up unless the student is typing.
  useEffect(() => {
    if (!focused.current) setText(toInputText(value));
  }, [value]);

  // An empty field or a lone sign is a number being typed, not a mistake.
  const invalid = parseDecimal(text) === null && !/^[-+]?$/.test(text.trim());

  const handleChange = (next: string) => {
    setText(next);
    let number = parseDecimal(next);
    if (number === null) return;
    if (integer) number = Math.round(number);
    if (min !== undefined && number < min) number = min;
    if (max !== undefined && number > max) number = max;
    onChange(number);
  };

  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <input
        id={id}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={text}
        aria-invalid={invalid || undefined}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; setText(toInputText(value)); }}
        onChange={event => handleChange(event.target.value)}
        className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition-shadow focus:ring-2 ${
          invalid ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
        }`}
      />
    </label>
  );
};

export const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">{children}</div>
);

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: NoInfer<T>; label: React.ReactNode }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
}

export const Segmented = <T extends string>({ label, options, value, onChange }: SegmentedProps<T>) => (
  <div role="group" aria-label={label} className="mb-3 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        className={`flex-auto rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
          option.value === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>
);

export const FormCard: React.FC<{ title: string; description: React.ReactNode; children: React.ReactNode }> = ({ title, description, children }) => (
  <Card>
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    <p className="mb-4 mt-1 text-sm text-slate-500">{description}</p>
    {children}
  </Card>
);

export const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">{children}</p>
);

export const ResultMain: React.FC<{ label: React.ReactNode; value: React.ReactNode }> = ({ label, value }) => (
  <div className="mb-4 flex flex-col gap-1" aria-live="polite">
    <span className="text-sm font-semibold text-slate-500">{label}</span>
    <span className="break-words font-mono text-2xl font-semibold text-blue-700 sm:text-3xl">{value}</span>
  </div>
);

export const ResultGrid: React.FC<{ items: [React.ReactNode, React.ReactNode][]; large?: boolean }> = ({ items, large }) => (
  <dl className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-2">
    {items.map(([label, value], i) => (
      <div key={i} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <dt className="mb-0.5 text-xs font-semibold text-slate-500">{label}</dt>
        <dd className={`break-words font-mono text-slate-800 ${large ? 'text-base font-semibold' : 'text-sm'}`}>{value}</dd>
      </div>
    ))}
  </dl>
);

export type LegendKind = 'curve' | 'shade' | 'mark' | 'reject';
const LEGEND_COLORS: Record<LegendKind, string> = {
  curve: CHART_COLORS.curve,
  shade: CHART_COLORS.shade,
  mark: CHART_COLORS.mark,
  reject: CHART_COLORS.reject,
};

export const Legend: React.FC<{ items: { label: React.ReactNode; kind?: LegendKind; color?: string }[] }> = ({ items }) => (
  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
    {items.map((item, i) => (
      <span key={i} className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: item.color ?? LEGEND_COLORS[item.kind ?? 'curve'] }} />
        {item.label}
      </span>
    ))}
  </div>
);

// Form and chart side by side on wide screens, results underneath.
export const SplitLayout: React.FC<{ form: React.ReactNode; chart: React.ReactNode; results?: React.ReactNode }> = ({ form, chart, results }) => (
  <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    {form}
    {chart}
    {results && <div className="min-w-0 xl:col-span-2">{results}</div>}
  </div>
);

export const Badge: React.FC<{ tone: 'good' | 'bad'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone === 'good' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{children}</span>
);

export interface CalculatorTab<T extends string> { id: T; label: string }

export const TabBar = <T extends string>({ tabs, active, onChange }: { tabs: CalculatorTab<NoInfer<T>>[]; active: T; onChange: (tab: NoInfer<T>) => void }) => (
  <div role="tablist" aria-label="Ferramentas da calculadora" className="mb-5 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
    {tabs.map(tab => (
      <button
        key={tab.id}
        role="tab"
        type="button"
        aria-selected={tab.id === active}
        onClick={() => onChange(tab.id)}
        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          tab.id === active ? 'bg-[--accent] text-white shadow' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
