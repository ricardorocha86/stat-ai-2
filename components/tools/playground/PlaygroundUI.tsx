import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { fmt } from '../../../services/probability/format';

// Shared pieces of the probability playground: formulas, theory boxes, controls and the Venn diagram.

export const Tex: React.FC<{ children: string; block?: boolean; className?: string }> = ({ children, block = false, className = '' }) => {
  const html = useMemo(() => katex.renderToString(children, { displayMode: block, throwOnError: false }), [children, block]);
  // Positioned, so KaTeX's absolutely placed MathML copy stays inside scrolling boxes.
  return block
    ? <div className={`relative overflow-x-auto ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
    : <span className={`relative ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

// \dfrac{6}{36} = \dfrac{1}{6}, or just the fraction when it does not simplify.
export const fracTex = (num: number, den: number) => {
  if (den === 0) return '\\text{indefinido}';
  const g = gcd(num, den) || 1;
  const base = `\\dfrac{${num}}{${den}}`;
  if (num === 0 || g === 1) return base;
  return den / g === 1 ? `${base} = ${num / g}` : `${base} = \\dfrac{${num / g}}{${den / g}}`;
};

export const pct = (p: number) => `${fmt(p * 100, 2)}%`;
export const texNum = (n: number, digits = 4) => fmt(n, digits).replace(',', '{,}');

/* ---------- layout blocks ---------- */

const Pill: React.FC<{ tone: 'theory' | 'play'; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
    tone === 'theory' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
  }`}>{children}</span>
);

export const TheoryCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 border-l-4 border-l-indigo-500 bg-white p-5 shadow-sm sm:p-6">
    <Pill tone="theory">Teoria</Pill>
    <h3 className="mt-2 text-xl font-bold text-slate-800">{title}</h3>
    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
  </section>
);

export const PlayCard: React.FC<{ title: string; description?: React.ReactNode; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-5 shadow-sm sm:p-6">
    <Pill tone="play">Experimente</Pill>
    <h3 className="mt-2 text-xl font-bold text-slate-800">{title}</h3>
    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

export const Definition: React.FC<{ term: React.ReactNode; children: React.ReactNode }> = ({ term, children }) => (
  <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
    <p className="font-semibold text-blue-900">{term}</p>
    <div className="mt-1 text-slate-700">{children}</div>
  </div>
);

export const Callout: React.FC<{ tone?: 'info' | 'warn' | 'good'; children: React.ReactNode }> = ({ tone = 'info', children }) => {
  const styles = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warn: 'border-amber-300 bg-amber-50 text-amber-900',
    good: 'border-green-200 bg-green-50 text-green-900',
  }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</div>;
};

// A button-like chip that can be switched on and off.
export const ToggleChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string; size?: 'md' | 'lg' }> = ({ active, onClick, children, ariaLabel, size = 'md' }) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={ariaLabel}
    onClick={onClick}
    className={`rounded-xl border-2 font-semibold transition ${size === 'lg' ? 'min-w-[3.5rem] px-4 py-3 text-lg' : 'px-3 py-1.5 text-sm'} ${
      active ? 'border-amber-500 bg-amber-100 text-amber-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
    }`}
  >
    {children}
  </button>
);

export const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary'; disabled?: boolean; title?: string }> = ({ onClick, children, variant = 'secondary', disabled, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
      variant === 'primary' ? 'bg-blue-600 text-white shadow hover:bg-blue-700' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

export const Slider: React.FC<{ label: React.ReactNode; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; display?: React.ReactNode }> = ({ label, value, min, max, step = 1, onChange, display }) => (
  <label className="block">
    <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-slate-600">
      <span>{label}</span>
      <span className="font-mono text-base font-semibold text-slate-800">{display ?? value}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={event => onChange(Number(event.target.value))}
      className="mt-1 w-full accent-blue-600"
    />
  </label>
);

export const Stepper: React.FC<{ label: React.ReactNode; value: number; min: number; max: number; onChange: (value: number) => void }> = ({ label, value, min, max, onChange }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <span className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuir" className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30">−</button>
      <span className="w-8 text-center font-mono text-lg font-semibold text-slate-800" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Aumentar" className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30">+</button>
    </span>
  </div>
);

// "S = {1, 2, 3}" with the left side as a formula.
export const SetLine: React.FC<{ name: string; elements: string[]; className?: string }> = ({ name, elements, className = '' }) => (
  <p className={`flex flex-wrap items-baseline gap-x-1.5 text-base text-slate-800 ${className}`}>
    <Tex>{`${name} =`}</Tex>
    {elements.length === 0
      ? <Tex>{'\\varnothing'}</Tex>
      : <span className="font-mono">{'{ '}{elements.join(', ')}{' }'}</span>}
  </p>
);

/* ============================================================
   VENN DIAGRAM — two events inside the sample space S
   ============================================================ */

// The four pieces of S that two sets cut out.
export type Region = 'a' | 'ab' | 'b' | 'n';
export const REGIONS: Region[] = ['a', 'ab', 'b', 'n'];
export const REGION_BIT: Record<Region, number> = { a: 1, ab: 2, b: 4, n: 8 };
export const REGION_LABEL: Record<Region, string> = {
  a: 'Só A',
  ab: 'A e B',
  b: 'Só B',
  n: 'Fora de A e de B',
};
export const inMask = (mask: number, region: Region) => (mask & REGION_BIT[region]) !== 0;

// Overlapping circles, separate circles (disjoint), or one inside the other.
export type VennLayout = 'overlap' | 'disjoint' | 'aInB' | 'bInA';

interface Circle { cx: number; cy: number; r: number }
interface Point { x: number; y: number }
interface Geometry {
  A: Circle;
  B: Circle;
  paths: Partial<Record<Region, string>>;
  anchors: Record<Region, Point>;
}

const VIEW_W = 480, VIEW_H = 300;
const FRAME = { x: 10, y: 10, w: 460, h: 280 };
const CY = 155;
const FRAME_PATH = `M${FRAME.x},${FRAME.y} h${FRAME.w} v${FRAME.h} h${-FRAME.w} Z`;
const circlePath = ({ cx, cy, r }: Circle) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;
// Corners of S, outside both circles, for the elements in no set.
const OUTSIDE_SLOTS: Point[] = [{ x: 62, y: 274 }, { x: 418, y: 274 }, { x: 418, y: 34 }, { x: 110, y: 34 }, { x: 40, y: 155 }, { x: 440, y: 155 }];
const OUTSIDE_VALUE: Point = { x: 414, y: 258 };

const overlapGeometry = (): Geometry => {
  const A = { cx: 185, cy: CY, r: 105 };
  const B = { cx: 295, cy: CY, r: 105 };
  const r = A.r;
  const h = Math.sqrt(r * r - ((B.cx - A.cx) / 2) ** 2);
  const mx = (A.cx + B.cx) / 2;
  const top = `${mx},${CY - h}`, bottom = `${mx},${CY + h}`;
  const union = `M${top} A${r},${r} 0 1 0 ${bottom} A${r},${r} 0 1 0 ${top} Z`;
  return {
    A, B,
    paths: {
      a: `M${top} A${r},${r} 0 1 0 ${bottom} A${r},${r} 0 0 1 ${top} Z`,
      ab: `M${top} A${r},${r} 0 0 1 ${bottom} A${r},${r} 0 0 1 ${top} Z`,
      b: `M${top} A${r},${r} 0 1 1 ${bottom} A${r},${r} 0 0 0 ${top} Z`,
      n: `${FRAME_PATH} ${union}`,
    },
    anchors: { a: { x: 135, y: CY }, ab: { x: mx, y: CY }, b: { x: 345, y: CY }, n: OUTSIDE_VALUE },
  };
};

const GEOMETRY: Record<VennLayout, Geometry> = {
  overlap: overlapGeometry(),
  disjoint: (() => {
    const A = { cx: 132, cy: CY, r: 92 }, B = { cx: 348, cy: CY, r: 92 };
    return {
      A, B,
      paths: { a: circlePath(A), b: circlePath(B), n: `${FRAME_PATH} ${circlePath(A)} ${circlePath(B)}` },
      anchors: { a: { x: A.cx, y: CY }, ab: { x: 240, y: CY }, b: { x: B.cx, y: CY }, n: OUTSIDE_VALUE },
    };
  })(),
  aInB: (() => {
    const B = { cx: 265, cy: CY, r: 122 }, A = { cx: 215, cy: 160, r: 62 };
    return {
      A, B,
      paths: { ab: circlePath(A), b: `${circlePath(B)} ${circlePath(A)}`, n: `${FRAME_PATH} ${circlePath(B)}` },
      anchors: { a: { x: A.cx, y: A.cy }, ab: { x: A.cx, y: A.cy }, b: { x: 335, y: CY }, n: OUTSIDE_VALUE },
    };
  })(),
  bInA: (() => {
    const A = { cx: 215, cy: CY, r: 122 }, B = { cx: 265, cy: 160, r: 62 };
    return {
      A, B,
      paths: { a: `${circlePath(A)} ${circlePath(B)}`, ab: circlePath(B), n: `${FRAME_PATH} ${circlePath(A)}` },
      anchors: { a: { x: 145, y: CY }, ab: { x: B.cx, y: B.cy }, b: { x: B.cx, y: B.cy }, n: OUTSIDE_VALUE },
    };
  })(),
};

// A region a layout leaves out is empty: the lens of disjoint sets, the crescent of a subset.
export const layoutHasRegion = (layout: VennLayout, region: Region) => Boolean(GEOMETRY[layout].paths[region]);

// Where the elements of one region go: a vertical stack inside it, or the corners of S.
const itemSlots = (layout: VennLayout, region: Region, count: number): Point[] => {
  if (region === 'n') return OUTSIDE_SLOTS.slice(0, count);
  const { A, B, anchors } = GEOMETRY[layout];
  const gap = count > 4 ? 30 : 38;
  return Array.from({ length: count }, (_, i) => {
    const y = anchors[region].y + (i - (count - 1) / 2) * gap;
    if (layout !== 'overlap' || region === 'ab') return { x: anchors[region].x, y };
    // The crescents keep a constant width, so their middle follows the circles.
    const half = Math.sqrt(Math.max(0, A.r * A.r - (y - CY) ** 2));
    return { x: region === 'a' ? (A.cx + B.cx) / 2 - half : (A.cx + B.cx) / 2 + half, y };
  });
};

export const VENN_COLORS = {
  a: '#2563eb',
  b: '#059669',
  highlight: 'rgba(251, 191, 36, 0.62)',
  base: { a: 'rgba(59, 130, 246, 0.10)', ab: 'rgba(79, 70, 229, 0.16)', b: 'rgba(16, 185, 129, 0.11)', n: '#ffffff' } as Record<Region, string>,
};

interface VennDiagramProps {
  ariaLabel: string;
  layout?: VennLayout;
  // Bit mask (REGION_BIT) of the shaded regions.
  highlighted?: number;
  onToggleRegion?: (region: Region) => void;
  // Elements written inside each region.
  items?: Partial<Record<Region, string[]>>;
  // A main number and a caption for each region.
  values?: Partial<Record<Region, [string, string?]>>;
  // Small copies, as in the De Morgan comparison: thicker lines and bigger letters.
  compact?: boolean;
  className?: string;
}

export const VennDiagram: React.FC<VennDiagramProps> = ({ ariaLabel, layout = 'overlap', highlighted = 0, onToggleRegion, items, values, compact, className = '' }) => {
  const geometry = GEOMETRY[layout];
  const { A, B } = geometry;
  const interactive = Boolean(onToggleRegion);
  const stroke = compact ? 4 : 2.5;
  const letter = compact ? 40 : 24;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={ariaLabel} className={`block h-auto w-full select-none ${className}`}>
      {REGIONS.map(region => {
        const d = geometry.paths[region];
        if (!d) return null;
        const on = inMask(highlighted, region);
        return (
          <path
            key={region}
            d={d}
            fillRule="evenodd"
            fill={on ? VENN_COLORS.highlight : VENN_COLORS.base[region]}
            className={`transition-[fill] duration-300 ${interactive ? 'cursor-pointer outline-none hover:opacity-75 focus-visible:[stroke:#d97706] focus-visible:[stroke-width:4]' : ''}`}
            {...(interactive ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': REGION_LABEL[region],
              'aria-pressed': on,
              onClick: () => onToggleRegion?.(region),
              onKeyDown: (event: React.KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggleRegion?.(region); }
              },
            } : {})}
          />
        );
      })}
      <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={10} fill="none" stroke="#475569" strokeWidth={compact ? 3 : 2} pointerEvents="none" />
      <circle cx={A.cx} cy={A.cy} r={A.r} fill="none" stroke={VENN_COLORS.a} strokeWidth={stroke} pointerEvents="none" />
      <circle cx={B.cx} cy={B.cy} r={B.r} fill="none" stroke={VENN_COLORS.b} strokeWidth={stroke} pointerEvents="none" />

      <g pointerEvents="none" fontFamily="Inter, sans-serif" fontWeight={800}>
        <text x={compact ? 30 : 26} y={compact ? 52 : 38} fontSize={compact ? 36 : 20} fill="#475569" textAnchor="middle">S</text>
        <text x={A.cx - A.r * 0.78} y={A.cy - A.r * 0.78} fontSize={letter} fill={VENN_COLORS.a} textAnchor="middle">A</text>
        <text x={B.cx + B.r * 0.78} y={B.cy - B.r * 0.78} fontSize={letter} fill={VENN_COLORS.b} textAnchor="middle">B</text>
      </g>

      {items && REGIONS.map(region => {
        const list = items[region] ?? [];
        const on = inMask(highlighted, region);
        return itemSlots(layout, region, list.length).map((slot, i) => (
          <text
            key={region + i}
            x={slot.x}
            y={slot.y + 5}
            textAnchor="middle"
            fontSize={15}
            fontFamily="Inter, sans-serif"
            fontWeight={on ? 700 : 500}
            fill={on ? '#0f172a' : '#64748b'}
            stroke="white"
            strokeWidth={on ? 0 : 3}
            paintOrder="stroke"
            pointerEvents="none"
          >
            {list[i]}
          </text>
        ));
      })}

      {values && REGIONS.map(region => {
        const value = values[region];
        if (!value) return null;
        const { x, y } = geometry.anchors[region];
        return (
          <g key={region} pointerEvents="none" fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" textAnchor="middle">
            <text x={x} y={y + (value[1] ? -2 : 7)} fontSize={24} fontWeight={700} fill="#0f172a" stroke="white" strokeWidth={4} paintOrder="stroke">{value[0]}</text>
            {value[1] && <text x={x} y={y + 20} fontSize={15} fontWeight={600} fill="#334155" stroke="white" strokeWidth={3} paintOrder="stroke">{value[1]}</text>}
          </g>
        );
      })}
    </svg>
  );
};

// Accessible switches under a paintable diagram, one per region.
export const RegionButtons: React.FC<{ mask: number; onToggle: (region: Region) => void }> = ({ mask, onToggle }) => (
  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Regiões do diagrama">
    {REGIONS.map(region => (
      <ToggleChip key={region} active={inMask(mask, region)} onClick={() => onToggle(region)}>{REGION_LABEL[region]}</ToggleChip>
    ))}
  </div>
);
