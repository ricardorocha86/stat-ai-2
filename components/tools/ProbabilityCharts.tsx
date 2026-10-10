import React, { useId } from 'react';
import { fmt } from '../../services/probability/format';

// SVG charts for the probability calculators: a density curve (continuous) and sticks (discrete).

const W = 720, H = 380;
const MARGIN = { top: 30, right: 26, bottom: 60, left: 60 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const BOTTOM = MARGIN.top + IH;

export const CHART_COLORS = {
  curve: '#2563eb',
  shade: '#f59e0b',
  shadeFill: 'rgba(245, 158, 11, 0.32)',
  reject: '#ef4444',
  rejectFill: 'rgba(239, 68, 68, 0.22)',
  soft: '#3b82f6',
  softFill: 'rgba(59, 130, 246, 0.18)',
  mark: '#dc2626',
};

const SHADE_TONES = {
  shade: { fill: CHART_COLORS.shadeFill, stroke: CHART_COLORS.shade },
  reject: { fill: CHART_COLORS.rejectFill, stroke: CHART_COLORS.reject },
  soft: { fill: CHART_COLORS.softFill, stroke: CHART_COLORS.soft },
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export interface ChartInfoLine { t: string; soft?: boolean }
export interface ChartMark { x: number; label?: string }
export interface ChartReferenceLine { x: number; label?: string }

const r2 = (n: number) => Math.round(n * 100) / 100;

const YGrid: React.FC<{ yMax: number; yScale: (y: number) => number; format: (v: number) => string }> = ({ yMax, yScale, format }) => (
  <>
    {[0, 1, 2, 3, 4, 5].map(i => {
      const v = yMax * i / 5;
      const y = r2(yScale(v));
      return (
        <g key={i}>
          <line x1={MARGIN.left} x2={MARGIN.left + IW} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
          <text x={MARGIN.left - 6} y={y + 3.5} textAnchor="end" fontSize={12.5} fontFamily={MONO} fill="#6b7280">{format(v)}</text>
        </g>
      );
    })}
  </>
);

const AxisTick: React.FC<{ x: number; label: string; value?: string; highlight?: boolean }> = ({ x, label, value, highlight }) => (
  <g>
    <line x1={x} x2={x} y1={BOTTOM} y2={BOTTOM + 5} stroke="#94a3b8" />
    <text x={x} y={BOTTOM + 19} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={highlight ? CHART_COLORS.curve : '#475569'} fontWeight={highlight ? 600 : 400}>{label}</text>
    {value !== undefined && <text x={x} y={BOTTOM + 36} textAnchor="middle" fontSize={14} fontFamily={MONO} fill="#475569">{value}</text>}
  </g>
);

const Overlays: React.FC<{
  xScale: (x: number) => number;
  marks: ChartMark[];
  referenceLines: ChartReferenceLine[];
  info: ChartInfoLine[];
}> = ({ xScale, marks, referenceLines, info }) => {
  const inside = (sx: number) => sx >= MARGIN.left && sx <= MARGIN.left + IW;
  return (
    <>
      {referenceLines.map((line, i) => {
        const sx = r2(xScale(line.x));
        if (!inside(sx)) return null;
        return (
          <g key={'ref' + i}>
            <line x1={sx} x2={sx} y1={MARGIN.top} y2={BOTTOM} stroke={CHART_COLORS.curve} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.55} />
            {line.label && <text x={sx + 5} y={MARGIN.top + 30} fontSize={14} fontFamily={MONO} fontWeight={600} fill={CHART_COLORS.curve}>{line.label}</text>}
          </g>
        );
      })}
      {marks.map((mark, i) => {
        const sx = r2(xScale(mark.x));
        if (!inside(sx)) return null;
        return (
          <g key={'mark' + i}>
            <line x1={sx} x2={sx} y1={MARGIN.top} y2={BOTTOM} stroke={CHART_COLORS.mark} strokeWidth={1.8} strokeDasharray="4 4" />
            {mark.label && <text x={sx + 5} y={MARGIN.top + 16} fontSize={14} fontFamily={MONO} fontWeight={600} fill={CHART_COLORS.mark}>{mark.label}</text>}
          </g>
        );
      })}
      {info.map((line, i) => (
        <text key={'info' + i} x={MARGIN.left + 8} y={MARGIN.top + 16 + i * 18} fontSize={line.soft ? 13 : 14} fontFamily={MONO} fill={line.soft ? '#64748b' : '#1e293b'}>{line.t}</text>
      ))}
    </>
  );
};

const ChartFrame: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full">
      <rect x={MARGIN.left} y={MARGIN.top} width={IW} height={IH} fill="white" />
      {children}
    </svg>
  </div>
);

/* ============================================================
   CONTINUOUS — one or more curves, shaded areas, marks
   ============================================================ */

export interface ChartCurve {
  f: (x: number) => number;
  color?: string;
  strokeWidth?: number;
  // Area under the curve fades from the line colour; off for plain function plots.
  fill?: boolean;
  fillOpacity?: number;
}

export interface ChartShade {
  from: number;
  to: number;
  curve?: number;
  tone?: keyof typeof SHADE_TONES;
}

export interface ChartTick { x: number; label: string; value?: number }

interface ContinuousChartProps {
  label: string;
  curves: ChartCurve[];
  xRange: [number, number];
  supportMin?: number;
  supportMax?: number;
  shades?: ChartShade[];
  marks?: ChartMark[];
  referenceLines?: ChartReferenceLine[];
  xTicks?: ChartTick[];
  info?: ChartInfoLine[];
  yFormat?: (v: number) => string;
  point?: { x: number; y: number; label: string };
  xTitle?: string;
}

export const ContinuousChart: React.FC<ContinuousChartProps> = ({
  label, curves, xRange, supportMin = -Infinity, supportMax = Infinity, shades = [], marks = [],
  referenceLines = [], xTicks, info = [], yFormat = v => v.toFixed(3).replace('.', ','), point, xTitle,
}) => {
  const gradientId = useId().replace(/:/g, '');
  let [xMin, xMax] = xRange;
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) [xMin, xMax] = [-1, 1];
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  marks.forEach(mark => {
    if (Number.isFinite(mark.x)) { xMin = Math.min(xMin, mark.x); xMax = Math.max(xMax, mark.x); }
  });

  const SAMPLES = 320;
  const xAt = (i: number, n: number, from = xMin, to = xMax) => from + (to - from) * i / n;
  const inSupport = (x: number) => x >= supportMin && x <= supportMax;

  let yMax = 0;
  curves.forEach(curve => {
    for (let i = 0; i <= SAMPLES; i++) {
      const x = xAt(i, SAMPLES);
      if (!inSupport(x)) continue;
      const y = curve.f(x);
      if (Number.isFinite(y) && y > yMax) yMax = y;
    }
  });
  yMax *= 1.18;
  if (!Number.isFinite(yMax) || yMax === 0) yMax = 1;

  const xScale = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin)) * IW;
  const yScale = (y: number) => MARGIN.top + IH - (Math.min(Number.isFinite(y) ? y : yMax, yMax) / yMax) * IH;
  const pointAt = (x: number, f: (x: number) => number) => `${r2(xScale(x))},${r2(yScale(f(x)))}`;

  const curvePaths = curves.map(curve => {
    const points: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = xAt(i, SAMPLES);
      if (inSupport(x)) points.push(pointAt(x, curve.f));
    }
    const line = points.length ? 'M' + points.join(' L') : '';
    const left = r2(xScale(Math.max(xMin, supportMin)));
    const right = r2(xScale(Math.min(xMax, supportMax)));
    const area = points.length ? `M${left},${BOTTOM} L${points.join(' L')} L${right},${BOTTOM} Z` : '';
    return { line, area };
  });

  const shadePaths = shades.map(shade => {
    let from = Number.isFinite(shade.from) ? shade.from : xMin;
    let to = Number.isFinite(shade.to) ? shade.to : xMax;
    if (from > to) [from, to] = [to, from];
    from = Math.max(from, xMin, supportMin);
    to = Math.min(to, xMax, supportMax);
    if (to <= from) return null;
    const f = curves[shade.curve ?? 0].f;
    const points: string[] = [];
    for (let i = 0; i <= 200; i++) points.push(pointAt(xAt(i, 200, from, to), f));
    return { d: `M${r2(xScale(from))},${BOTTOM} L${points.join(' L')} L${r2(xScale(to))},${BOTTOM} Z`, tone: SHADE_TONES[shade.tone ?? 'shade'] };
  });

  const ticks: ChartTick[] = xTicks ?? Array.from({ length: 7 }, (_, i) => {
    const x = xAt(i, 6);
    return { x, label: fmt(x, 3) };
  });

  return (
    <ChartFrame label={label}>
      <defs>
        {curves.map((curve, i) => (
          <linearGradient key={i} id={`${gradientId}-${i}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={curve.color ?? CHART_COLORS.curve} stopOpacity={0.22} />
            <stop offset="100%" stopColor={curve.color ?? CHART_COLORS.curve} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <YGrid yMax={yMax} yScale={yScale} format={yFormat} />
      {curves.map((curve, i) => (
        <g key={i}>
          {curve.fill !== false && curvePaths[i].area && <path d={curvePaths[i].area} fill={`url(#${gradientId}-${i})`} opacity={curve.fillOpacity ?? 1} />}
          <path d={curvePaths[i].line} fill="none" stroke={curve.color ?? CHART_COLORS.curve} strokeWidth={curve.strokeWidth ?? 2.2} strokeLinejoin="round" />
        </g>
      ))}
      {shadePaths.map((shade, i) => shade && <path key={i} d={shade.d} fill={shade.tone.fill} stroke={shade.tone.stroke} strokeWidth={1.4} strokeLinejoin="round" />)}
      <line x1={MARGIN.left} x2={MARGIN.left + IW} y1={BOTTOM} y2={BOTTOM} stroke="#94a3b8" />
      {ticks.map((tick, i) => {
        const sx = r2(xScale(tick.x));
        if (sx < MARGIN.left - 0.5 || sx > MARGIN.left + IW + 0.5) return null;
        return <AxisTick key={i} x={sx} label={tick.label} value={tick.value !== undefined ? fmt(tick.value, 3) : undefined} highlight={Boolean(xTicks) && tick.value !== undefined} />;
      })}
      {xTitle && <text x={MARGIN.left + IW / 2} y={BOTTOM + 54} textAnchor="middle" fontSize={14} fontFamily={MONO} fill="#475569">{xTitle}</text>}
      <Overlays xScale={xScale} marks={marks} referenceLines={referenceLines} info={info} />
      {point && (
        <g>
          <circle cx={r2(xScale(point.x))} cy={r2(yScale(point.y))} r={5} fill={CHART_COLORS.mark} />
          <text x={r2(xScale(point.x)) + 7} y={r2(yScale(point.y)) - 5} fontSize={14} fontFamily={MONO} fontWeight={600} fill={CHART_COLORS.mark}>{point.label}</text>
        </g>
      )}
    </ChartFrame>
  );
};

/* ============================================================
   DISCRETE — sticks with a dot on top, highlighted values
   ============================================================ */

interface DiscreteChartProps {
  label: string;
  pmf: (k: number) => number;
  kMin: number;
  kMax: number;
  shadeKs?: Set<number> | null;
  marks?: { k: number; label?: string }[];
  referenceLines?: ChartReferenceLine[];
  info?: ChartInfoLine[];
}

export const DiscreteChart: React.FC<DiscreteChartProps> = ({ label, pmf, kMin, kMax, shadeKs = null, marks = [], referenceLines = [], info = [] }) => {
  const count = kMax - kMin + 1;
  const values: number[] = [];
  let yMax = 0;
  for (let k = kMin; k <= kMax; k++) {
    const y = pmf(k);
    values.push(y);
    if (Number.isFinite(y) && y > yMax) yMax = y;
  }
  yMax *= 1.18;
  if (!Number.isFinite(yMax) || yMax === 0) yMax = 1;

  const xMin = kMin - 0.5, xMax = kMax + 0.5;
  const xScale = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin)) * IW;
  const yScale = (y: number) => MARGIN.top + IH - (y / yMax) * IH;
  const stickWidth = Math.max(1.4, Math.min(3.4, 220 / count));
  const dotRadius = count > 60 ? 0 : (count > 35 ? 1.8 : 3);

  const tickStep = Math.max(1, Math.ceil(count / 12));
  const ticks: number[] = [];
  for (let k = kMin; k <= kMax; k += tickStep) ticks.push(k);
  if ((kMax - kMin) % tickStep !== 0) ticks.push(kMax);

  return (
    <ChartFrame label={label}>
      <YGrid yMax={yMax} yScale={yScale} format={v => v.toFixed(4).replace('.', ',')} />
      <line x1={MARGIN.left} x2={MARGIN.left + IW} y1={BOTTOM} y2={BOTTOM} stroke="#94a3b8" />
      {values.map((v, i) => {
        if (!Number.isFinite(v) || v <= 0) return null;
        const k = kMin + i;
        const color = shadeKs?.has(k) ? CHART_COLORS.shade : CHART_COLORS.curve;
        const x = r2(xScale(k)), y = r2(yScale(v));
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={BOTTOM} y2={y} stroke={color} strokeWidth={stickWidth} strokeLinecap="round" />
            {dotRadius > 0 && <circle cx={x} cy={y} r={dotRadius} fill={color} />}
          </g>
        );
      })}
      {ticks.map(k => <AxisTick key={k} x={r2(xScale(k))} label={String(k)} />)}
      <Overlays xScale={xScale} marks={marks.map(mark => ({ x: mark.k, label: mark.label }))} referenceLines={referenceLines} info={info} />
    </ChartFrame>
  );
};
