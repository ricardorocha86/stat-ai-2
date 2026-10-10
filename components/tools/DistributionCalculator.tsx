import React, { useMemo, useState } from 'react';
import { Distribution, MomentValue, Params } from '../../data/probabilityDistributions';
import { fmt, fmtOdds, fmtPct, fmtPrecise, fmtSci } from '../../services/probability/format';
import { ContinuousChart, ChartMark, ChartShade, DiscreteChart } from './ProbabilityCharts';
import { Card, FieldRow, FormCard, Legend, NumberField, ResultGrid, ResultMain, Segmented, SplitLayout, TabBar } from './CalculatorUI';

// Generic calculator for every distribution except the Normal: probabilities and quantiles,
// both driven by the same parameters.

type Tab = 'prob' | 'quantile';
const TABS: { id: Tab; label: string }[] = [
  { id: 'prob', label: 'Probabilidades' },
  { id: 'quantile', label: 'Quantis (inverso)' },
];

type ProbMode = 'eq' | 'lt' | 'gt' | 'between' | 'outside';
type QuantileMode = 'lower' | 'upper' | 'central';

const DISCRETE_MODES: { value: ProbMode; label: string }[] = [
  { value: 'eq', label: 'P(X = k)' },
  { value: 'lt', label: 'P(X ≤ k)' },
  { value: 'gt', label: 'P(X ≥ k)' },
  { value: 'between', label: 'P(a ≤ X ≤ b)' },
];
const CONTINUOUS_MODES: { value: ProbMode; label: string }[] = [
  { value: 'lt', label: 'P(X ≤ x)' },
  { value: 'gt', label: 'P(X ≥ x)' },
  { value: 'between', label: 'P(a ≤ X ≤ b)' },
  { value: 'outside', label: 'P(X ≤ a ou X ≥ b)' },
];
const QUANTILE_MODES: { value: QuantileMode; label: string }[] = [
  { value: 'lower', label: 'P(X ≤ x) = p' },
  { value: 'upper', label: 'P(X ≥ x) = p' },
  { value: 'central', label: 'Faixa central com prob. p' },
];

// Very wide discrete supports (a Poisson with a huge λ) would draw thousands of sticks.
const MAX_STICKS = 400;

const fmtMoment = (value: MomentValue, digits = 6) => typeof value === 'string' ? value : fmt(value, digits);

const DistributionCalculator: React.FC<{ distribution: Distribution }> = ({ distribution: dist }) => {
  const isDisc = dist.type === 'discrete';
  const [tab, setTab] = useState<Tab>('prob');
  const [params, setParams] = useState<Params>(() => Object.fromEntries(dist.params.map(p => [p.id, p.def])));

  // Starting points for the events: the median and the quartiles of the default distribution.
  const [probMode, setProbMode] = useState<ProbMode>(isDisc ? 'eq' : 'lt');
  const [probInputs, setProbInputs] = useState(() => {
    const q = (p: number, fallback: number) => {
      const value = dist.quantile(params, p);
      return isDisc ? Math.round(value) : (Number.isFinite(value) ? +value.toFixed(4) : fallback);
    };
    return { x: q(0.5, 0), a: q(0.25, -1), b: q(0.75, 1) };
  });
  const [quantileMode, setQuantileMode] = useState<QuantileMode>('lower');
  const [quantileP, setQuantileP] = useState(0.95);

  const invalid = dist.validate?.(params) ?? null;

  const paramSummary = dist.params.map(p => `${p.label.replace(/^([^\s—]+)\s.*/, '$1')} = ${fmt(params[p.id], 4)}`).join('; ');
  const chartLabel = `Gráfico da distribuição ${dist.name}`;

  const discreteRange = useMemo(() => {
    if (dist.type !== 'discrete' || invalid) return { kMin: 0, kMax: 0 };
    const { kMin, kMax } = dist.plotRange(params);
    if (kMax - kMin <= MAX_STICKS) return { kMin, kMax };
    const lo = Math.max(kMin, dist.quantile(params, 0.0005));
    return { kMin: lo, kMax: Math.min(kMax, dist.quantile(params, 0.9995), lo + MAX_STICKS) };
  }, [dist, params, invalid]);

  const paramFields = (
    <FieldRow>
      {dist.params.map(p => (
        <NumberField
          key={p.id}
          label={p.label}
          value={params[p.id]}
          min={p.min}
          max={p.max}
          integer={p.integer}
          onChange={value => setParams(current => ({ ...current, [p.id]: value }))}
        />
      ))}
    </FieldRow>
  );

  // One chart for every tab: the shaded event, marks and reference lines change per tab.
  const renderChart = (options: { shades?: ChartShade[]; shadeKs?: number[]; marks?: ChartMark[]; info: string[] }) => {
    const info = options.info.map((t, i) => ({ t, soft: i > 0 }));
    if (dist.type === 'discrete') {
      return (
        <DiscreteChart
          label={chartLabel}
          pmf={k => dist.pmf(params, k)}
          kMin={discreteRange.kMin}
          kMax={discreteRange.kMax}
          shadeKs={options.shadeKs ? new Set(options.shadeKs) : null}
          marks={(options.marks ?? []).map(mark => ({ k: mark.x, label: mark.label }))}
          info={info}
        />
      );
    }
    const range = dist.plotRange(params);
    const support = dist.support(params);
    return (
      <ContinuousChart
        label={chartLabel}
        curves={[{ f: x => dist.pdf(params, x) }]}
        xRange={[range.xMin, range.xMax]}
        supportMin={support.xMin}
        supportMax={support.xMax}
        shades={options.shades}
        marks={options.marks}
        info={info}
      />
    );
  };

  const kRange = (from: number, to: number) => {
    const ks: number[] = [];
    for (let k = Math.max(from, discreteRange.kMin); k <= Math.min(to, discreteRange.kMax); k++) ks.push(k);
    return ks;
  };

  /* ---------- Probabilidades ---------- */
  const renderProbability = () => {
    const cdf = (x: number) => dist.cdf(params, x);
    let p: number, formula: string;
    let shades: ChartShade[] = [], shadeKs: number[] | undefined, marks: ChartMark[] = [];
    let [a, b] = [probInputs.a, probInputs.b];
    if (a > b) [a, b] = [b, a];
    const x = probInputs.x;

    if (dist.type === 'discrete') {
      if (probMode === 'eq') {
        p = dist.pmf(params, x);
        formula = `P(X = ${x})`;
        shadeKs = [x];
        marks = [{ x, label: `k = ${x}` }];
      } else if (probMode === 'lt') {
        p = cdf(x);
        formula = `P(X ≤ ${x})`;
        shadeKs = kRange(-Infinity, x);
        marks = [{ x, label: `≤ ${x}` }];
      } else if (probMode === 'gt') {
        p = 1 - cdf(x - 1);
        formula = `P(X ≥ ${x})`;
        shadeKs = kRange(x, Infinity);
        marks = [{ x, label: `≥ ${x}` }];
      } else {
        p = cdf(b) - cdf(a - 1);
        formula = `P(${a} ≤ X ≤ ${b})`;
        shadeKs = kRange(a, b);
      }
    } else if (probMode === 'lt') {
      p = cdf(x);
      formula = `P(X ≤ ${fmt(x, 4)})`;
      shades = [{ from: -Infinity, to: x }];
      marks = [{ x, label: `x = ${fmt(x, 3)}` }];
    } else if (probMode === 'gt') {
      p = 1 - cdf(x);
      formula = `P(X ≥ ${fmt(x, 4)})`;
      shades = [{ from: x, to: Infinity }];
      marks = [{ x, label: `x = ${fmt(x, 3)}` }];
    } else if (probMode === 'between') {
      p = cdf(b) - cdf(a);
      formula = `P(${fmt(a, 4)} ≤ X ≤ ${fmt(b, 4)})`;
      shades = [{ from: a, to: b }];
      marks = [{ x: a, label: `a = ${fmt(a, 3)}` }, { x: b, label: `b = ${fmt(b, 3)}` }];
    } else {
      p = cdf(a) + (1 - cdf(b));
      formula = `P(X ≤ ${fmt(a, 4)} ou X ≥ ${fmt(b, 4)})`;
      shades = [{ from: -Infinity, to: a }, { from: b, to: Infinity }];
      marks = [{ x: a, label: `a = ${fmt(a, 3)}` }, { x: b, label: `b = ${fmt(b, 3)}` }];
    }

    const moments = dist.moments(params);
    const single = probMode !== 'between' && probMode !== 'outside';
    const setInput = (key: 'x' | 'a' | 'b') => (value: number) => setProbInputs(current => ({ ...current, [key]: value }));

    return (
      <SplitLayout
        form={
          <FormCard title={`Probabilidade — ${dist.name}`} description={dist.description}>
            {paramFields}
            <Segmented label="Evento" options={isDisc ? DISCRETE_MODES : CONTINUOUS_MODES} value={probMode} onChange={setProbMode} />
            <FieldRow>
              {single ? (
                <NumberField label={isDisc ? 'k' : 'x'} value={probInputs.x} integer={isDisc} onChange={setInput('x')} />
              ) : (
                <>
                  <NumberField label="a (inferior)" value={probInputs.a} integer={isDisc} onChange={setInput('a')} />
                  <NumberField label="b (superior)" value={probInputs.b} integer={isDisc} onChange={setInput('b')} />
                </>
              )}
            </FieldRow>
          </FormCard>
        }
        chart={
          <Card>
            {renderChart({ shades, shadeKs, marks, info: [paramSummary, `${formula} = ${fmt(p, 6)} (${fmtPct(p)})`] })}
            <Legend items={[{ label: isDisc ? 'Massa de probabilidade' : 'Densidade' }, { label: 'Probabilidade', kind: 'shade' }]} />
          </Card>
        }
        results={
          <Card>
            <ResultMain label={formula} value={fmt(p, 6)} />
            <ResultGrid items={[
              ['Probabilidade (10 casas)', fmtPrecise(p, 10)],
              ['Em porcentagem', fmtPct(p)],
              ['Notação científica', fmtSci(p)],
              ['Complementar', fmtPrecise(1 - p, 10)],
              ['Odds favoráveis', fmtOdds(p)],
              ['Esperança / Variância', <>E[X] = {fmtMoment(moments.mean, 4)}<br />Var = {fmtMoment(moments.variance, 4)}</>],
            ]} />
          </Card>
        }
      />
    );
  };

  /* ---------- Quantis ---------- */
  const renderQuantile = () => {
    const p = Math.min(Math.max(quantileP, 0), 1);
    const variable = isDisc ? 'k' : 'x';
    let value = 0, lo = 0, hi = 0, formula: string;
    let shades: ChartShade[] = [], shadeKs: number[] | undefined, marks: ChartMark[] = [];
    const label = (v: number) => isDisc ? `${variable} = ${v}` : fmt(v, 4);

    if (quantileMode === 'lower') {
      value = dist.quantile(params, p);
      formula = `${variable} : P(X ≤ ${variable}) = ${fmt(p, 4)}`;
      if (isDisc) shadeKs = kRange(-Infinity, value);
      else shades = [{ from: -Infinity, to: value }];
      marks = [{ x: value, label: label(value) }];
    } else if (quantileMode === 'upper') {
      value = dist.quantile(params, 1 - p);
      if (dist.type === 'discrete' && value > dist.plotRange(params).kMin) {
        // Smallest k with P(X ≥ k) ≤ p: P(X ≤ k − 1) ≥ 1 − p, so k = quantile(1 − p) + 1.
        value = Math.min(value + 1, dist.plotRange(params).kMax);
      }
      formula = `${variable} : P(X ≥ ${variable}) = ${fmt(p, 4)}`;
      if (isDisc) shadeKs = kRange(value, Infinity);
      else shades = [{ from: value, to: Infinity }];
      marks = [{ x: value, label: label(value) }];
    } else {
      const alpha = 1 - p;
      lo = dist.quantile(params, alpha / 2);
      hi = dist.quantile(params, 1 - alpha / 2);
      value = hi;
      formula = `P(lo ≤ X ≤ hi) = ${fmt(p, 4)}`;
      if (isDisc) {
        shadeKs = kRange(lo, hi);
        marks = [{ x: lo, label: `lo = ${lo}` }, { x: hi, label: `hi = ${hi}` }];
      } else {
        shades = [{ from: lo, to: hi }];
        marks = [{ x: lo, label: fmt(lo, 3) }, { x: hi, label: fmt(hi, 3) }];
      }
    }

    const central = quantileMode === 'central';
    return (
      <SplitLayout
        form={
          <FormCard title="Quantil — inverso da distribuição" description="Dado p, encontre o valor x (ou k) tal que P(X ≤ x) = p. Para distribuições discretas, x é inteiro.">
            {paramFields}
            <Segmented label="Tipo de quantil" options={QUANTILE_MODES} value={quantileMode} onChange={setQuantileMode} />
            <FieldRow>
              <NumberField label="Probabilidade p" value={quantileP} min={0} max={1} onChange={setQuantileP} />
            </FieldRow>
          </FormCard>
        }
        chart={
          <Card>
            {renderChart({ shades, shadeKs, marks, info: [paramSummary, `p = ${fmt(p, 6)}`] })}
            <Legend items={[{ label: isDisc ? 'Massa de probabilidade' : 'Densidade' }, { label: 'Área = p', kind: 'shade' }]} />
          </Card>
        }
        results={
          <Card>
            <ResultMain label={formula} value={central ? `[ ${fmt(lo, 4)} ; ${fmt(hi, 4)} ]` : (isDisc ? String(value) : fmt(value, 6))} />
            <ResultGrid items={[
              ['Valor (10 casas)', central ? <>lo = {fmtPrecise(lo, 10)}<br />hi = {fmtPrecise(hi, 10)}</> : fmtPrecise(value, 10)],
              ['Limite inferior (modo central)', central ? fmtPrecise(lo, 10) : '—'],
              ['Limite superior (modo central)', central ? fmtPrecise(hi, 10) : '—'],
              ['Verificação F(x)', central
                ? `F(hi) − F(lo) = ${fmtPrecise(dist.cdf(params, hi) - dist.cdf(params, lo), 8)}`
                : `F(${isDisc ? value : fmt(value, 3)}) = ${fmtPrecise(dist.cdf(params, value), 8)}`],
            ]} />
          </Card>
        }
      />
    );
  };

  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {invalid ? (
        <SplitLayout
          form={
            <FormCard title="Ajuste os parâmetros" description={invalid}>
              {paramFields}
            </FormCard>
          }
          chart={null}
        />
      ) : tab === 'prob' ? renderProbability() : renderQuantile()}
    </div>
  );
};

export default DistributionCalculator;
