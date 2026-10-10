import React, { useState } from 'react';
import { normalCDF, normalPDF, normalQuantile, Phi, tCDF, tPDF, tQuantile, SQRT_2PI } from '../../services/probability/mathLib';
import { fmt, fmtOdds, fmtPct, fmtPrecise, fmtSci } from '../../services/probability/format';
import { CHART_COLORS, ChartMark, ChartShade, ContinuousChart } from './ProbabilityCharts';
import { Badge, Card, FieldRow, FormCard, Hint, Legend, NumberField, ResultGrid, ResultMain, Segmented, SplitLayout, TabBar } from './CalculatorUI';

// The Normal calculator: probabilities, quantiles, z-scores, confidence intervals,
// hypothesis tests, sample size, curve comparison and an interactive z table.

type Tab = 'prob' | 'quantile' | 'zscore' | 'ci' | 'ht' | 'sample' | 'compare' | 'ztable';
const TABS: { id: Tab; label: string }[] = [
  { id: 'prob', label: 'Probabilidades' },
  { id: 'quantile', label: 'Quantis (inverso)' },
  { id: 'zscore', label: 'Z-Score' },
  { id: 'ci', label: 'Intervalo de Confiança' },
  { id: 'ht', label: 'Teste de Hipótese' },
  { id: 'sample', label: 'Tamanho de Amostra' },
  { id: 'compare', label: 'Comparar Normais' },
  { id: 'ztable', label: 'Tabela Z' },
];

const SIGMA_PROBLEM = 'O desvio padrão precisa ser maior que zero.';
const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100) / 100;

/* ---------- chart: Normal curves with μ ± kσ ticks ---------- */

interface NormalCurve { mu: number; sigma: number; color?: string; strokeWidth?: number; fillOpacity?: number }

const NormalChart: React.FC<{ label: string; curves: NormalCurve[]; shades?: ChartShade[]; marks?: ChartMark[]; info: { t: string; soft?: boolean }[] }> = ({ label, curves, shades = [], marks = [], info }) => {
  let xMin = Infinity, xMax = -Infinity;
  curves.forEach(curve => {
    xMin = Math.min(xMin, curve.mu - 4 * curve.sigma);
    xMax = Math.max(xMax, curve.mu + 4 * curve.sigma);
  });
  shades.forEach(shade => {
    if (Number.isFinite(shade.from)) xMin = Math.min(xMin, shade.from);
    if (Number.isFinite(shade.to)) xMax = Math.max(xMax, shade.to);
  });
  marks.forEach(mark => {
    if (Number.isFinite(mark.x)) { xMin = Math.min(xMin, mark.x); xMax = Math.max(xMax, mark.x); }
  });
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  const pad = (xMax - xMin) * 0.04;

  const first = curves[0];
  const ticks = first ? [-3, -2, -1, 0, 1, 2, 3].map(k => ({
    x: first.mu + k * first.sigma,
    value: first.mu + k * first.sigma,
    label: k === 0 ? 'μ' : `μ${k > 0 ? '+' : '−'}${Math.abs(k) === 1 ? '' : Math.abs(k)}σ`,
  })) : undefined;

  return (
    <ContinuousChart
      label={label}
      curves={curves.map(curve => ({
        f: x => normalPDF(x, curve.mu, curve.sigma),
        color: curve.color,
        strokeWidth: curve.strokeWidth,
        fillOpacity: curve.fillOpacity,
      }))}
      xRange={[xMin - pad, xMax + pad]}
      shades={shades}
      marks={marks}
      referenceLines={first ? [{ x: first.mu }] : []}
      xTicks={ticks}
      info={info}
    />
  );
};

const Problem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card><p role="alert" className="text-sm font-medium text-amber-700">{children}</p></Card>
);

/* ============================================================
   PROBABILIDADES
   ============================================================ */

type ProbMode = 'lt' | 'gt' | 'between' | 'outside';

const ProbabilityTab: React.FC = () => {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [mode, setMode] = useState<ProbMode>('lt');
  const [x, setX] = useState(1);
  const [rawA, setA] = useState(-1);
  const [rawB, setB] = useState(1);

  const form = (
    <FormCard title="P( evento ) — calcule a probabilidade" description={<>Dados <b>μ</b> e <b>σ</b>, escolha o evento de interesse. A área correspondente é sombreada no gráfico.</>}>
      <FieldRow>
        <NumberField label="Média μ" value={mu} onChange={setMu} />
        <NumberField label="Desvio padrão σ" value={sigma} onChange={setSigma} />
      </FieldRow>
      <Segmented label="Evento" value={mode} onChange={setMode} options={[
        { value: 'lt', label: 'P(X ≤ x)' },
        { value: 'gt', label: 'P(X ≥ x)' },
        { value: 'between', label: 'P(a ≤ X ≤ b)' },
        { value: 'outside', label: 'P(X ≤ a ou X ≥ b)' },
      ]} />
      <FieldRow>
        {mode === 'lt' || mode === 'gt' ? (
          <NumberField label="x" value={x} onChange={setX} />
        ) : (
          <>
            <NumberField label="a (inferior)" value={rawA} onChange={setA} />
            <NumberField label="b (superior)" value={rawB} onChange={setB} />
          </>
        )}
      </FieldRow>
    </FormCard>
  );
  if (!(sigma > 0)) return <SplitLayout form={form} chart={<Problem>{SIGMA_PROBLEM}</Problem>} />;

  const [a, b] = rawA > rawB ? [rawB, rawA] : [rawA, rawB];
  let p: number, formula: string, shades: ChartShade[], marks: ChartMark[];
  if (mode === 'lt') {
    p = normalCDF(x, mu, sigma);
    formula = `P(X ≤ ${fmt(x, 4)})`;
    shades = [{ from: -Infinity, to: x }];
    marks = [{ x, label: `x = ${fmt(x, 3)}` }];
  } else if (mode === 'gt') {
    p = 1 - normalCDF(x, mu, sigma);
    formula = `P(X ≥ ${fmt(x, 4)})`;
    shades = [{ from: x, to: Infinity }];
    marks = [{ x, label: `x = ${fmt(x, 3)}` }];
  } else if (mode === 'between') {
    p = normalCDF(b, mu, sigma) - normalCDF(a, mu, sigma);
    formula = `P(${fmt(a, 4)} ≤ X ≤ ${fmt(b, 4)})`;
    shades = [{ from: a, to: b }];
    marks = [{ x: a, label: `a = ${fmt(a, 3)}` }, { x: b, label: `b = ${fmt(b, 3)}` }];
  } else {
    p = normalCDF(a, mu, sigma) + (1 - normalCDF(b, mu, sigma));
    formula = `P(X ≤ ${fmt(a, 4)} ou X ≥ ${fmt(b, 4)})`;
    shades = [{ from: -Infinity, to: a }, { from: b, to: Infinity }];
    marks = [{ x: a, label: `a = ${fmt(a, 3)}` }, { x: b, label: `b = ${fmt(b, 3)}` }];
  }
  const single = mode === 'lt' || mode === 'gt';

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          <NormalChart label="Curva normal com a área da probabilidade" curves={[{ mu, sigma }]} shades={shades} marks={marks} info={[
            { t: `μ = ${fmt(mu, 6)}; σ = ${fmt(sigma, 6)}` },
            { t: `Pico f(μ) = ${fmt(1 / (sigma * SQRT_2PI), 4)}`, soft: true },
            { t: `P = ${fmt(p, 6)} (${fmtPct(p)})`, soft: true },
          ]} />
          <Legend items={[{ label: 'Densidade N(μ, σ²)' }, { label: 'Área = probabilidade', kind: 'shade' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label={formula} value={fmt(p, 6)} />
          <ResultGrid items={[
            ['Probabilidade (10 casas)', fmtPrecise(p, 10)],
            ['Em porcentagem', fmtPct(p)],
            ['Notação científica', fmtSci(p)],
            ['Probabilidade complementar', fmtPrecise(1 - p, 10)],
            ['z equivalente (z = (x−μ)/σ)', single
              ? `z = ${fmt((x - mu) / sigma, 6)}`
              : <>z<sub>a</sub> = {fmt((a - mu) / sigma, 4)} · z<sub>b</sub> = {fmt((b - mu) / sigma, 4)}</>],
            ['Odds favoráveis', fmtOdds(p)],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   QUANTIS
   ============================================================ */

type QuantileMode = 'lower' | 'upper' | 'central';

const QuantileTab: React.FC = () => {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [mode, setMode] = useState<QuantileMode>('lower');
  const [rawP, setP] = useState(0.975);

  const form = (
    <FormCard title="Quantil — inverso da Normal" description={<>Dado um valor de probabilidade, encontre o ponto <b>x</b> correspondente. Útil para construir tabelas críticas de <i>z</i>.</>}>
      <FieldRow>
        <NumberField label="Média μ" value={mu} onChange={setMu} />
        <NumberField label="Desvio padrão σ" value={sigma} onChange={setSigma} />
      </FieldRow>
      <Segmented label="Tipo de quantil" value={mode} onChange={setMode} options={[
        { value: 'lower', label: 'P(X ≤ x) = p → x' },
        { value: 'upper', label: 'P(X ≥ x) = p → x' },
        { value: 'central', label: 'Faixa central com prob. p → ± limite' },
      ]} />
      <FieldRow>
        <NumberField label="Probabilidade p" value={rawP} min={0} max={1} onChange={setP} />
      </FieldRow>
      <Hint>Dica: para o valor crítico z<sub>α/2</sub> de 95%, use <i>Faixa central</i> com p = 0,95.</Hint>
    </FormCard>
  );
  if (!(sigma > 0)) return <SplitLayout form={form} chart={<Problem>{SIGMA_PROBLEM}</Problem>} />;

  const p = Math.min(Math.max(rawP, 0), 1);
  let value: number, lo = 0, hi = 0, formula: string, shades: ChartShade[], marks: ChartMark[];
  if (mode === 'lower') {
    value = normalQuantile(p, mu, sigma);
    formula = `x : P(X ≤ x) = ${fmt(p, 6)}`;
    shades = [{ from: -Infinity, to: value }];
    marks = [{ x: value, label: `x = ${fmt(value, 4)}` }];
  } else if (mode === 'upper') {
    value = normalQuantile(1 - p, mu, sigma);
    formula = `x : P(X ≥ x) = ${fmt(p, 6)}`;
    shades = [{ from: value, to: Infinity }];
    marks = [{ x: value, label: `x = ${fmt(value, 4)}` }];
  } else {
    const alpha = 1 - p;
    lo = normalQuantile(alpha / 2, mu, sigma);
    hi = normalQuantile(1 - alpha / 2, mu, sigma);
    value = hi;
    formula = `P(lo ≤ X ≤ hi) = ${fmt(p, 6)}`;
    shades = [{ from: lo, to: hi }];
    marks = [{ x: lo, label: `lo = ${fmt(lo, 3)}` }, { x: hi, label: `hi = ${fmt(hi, 3)}` }];
  }
  const central = mode === 'central';

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          <NormalChart label="Curva normal com a área p" curves={[{ mu, sigma }]} shades={shades} marks={marks} info={[
            { t: `μ = ${fmt(mu, 6)}; σ = ${fmt(sigma, 6)}` },
            { t: `p = ${fmt(p, 6)}`, soft: true },
          ]} />
          <Legend items={[{ label: 'Densidade' }, { label: 'Área = p', kind: 'shade' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label={formula} value={central ? `[ ${fmt(lo, 4)} ; ${fmt(hi, 4)} ]` : fmt(value, 6)} />
          <ResultGrid items={[
            ['Valor x (10 casas)', central ? <>lo = {fmtPrecise(lo, 10)}<br />hi = {fmtPrecise(hi, 10)}</> : fmtPrecise(value, 10)],
            ['z (padronizado)', central ? `z = ± ${fmt((hi - mu) / sigma, 6)}` : `z = ${fmt((value - mu) / sigma, 6)}`],
            ['Limite inferior (modo central)', central ? fmtPrecise(lo, 10) : '—'],
            ['Limite superior (modo central)', central ? fmtPrecise(hi, 10) : '—'],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   Z-SCORE
   ============================================================ */

const zInterpretation = (z: number) => {
  const az = Math.abs(z);
  if (az < 0.5) return 'Próximo da média (muito típico)';
  if (az < 1) return 'Dentro de 1σ (~68% das observações)';
  if (az < 2) return 'Entre 1σ e 2σ (~27% das observações)';
  if (az < 3) return 'Entre 2σ e 3σ (raro, ~4,3%)';
  return 'Além de 3σ (muito raro, < 0,3%)';
};

const ZScoreTab: React.FC = () => {
  const [mu, setMuValue] = useState(100);
  const [sigma, setSigmaValue] = useState(15);
  const [x, setXValue] = useState(130);
  const [z, setZValue] = useState(2);

  // x and z stay linked: editing one recomputes the other, as do μ and σ (from x).
  const syncFromX = (nextX: number, nextMu = mu, nextSigma = sigma) => {
    if (nextSigma > 0) setZValue(+((nextX - nextMu) / nextSigma).toFixed(8));
  };
  const setMu = (value: number) => { setMuValue(value); syncFromX(x, value, sigma); };
  const setSigma = (value: number) => { setSigmaValue(value); syncFromX(x, mu, value); };
  const setX = (value: number) => { setXValue(value); syncFromX(value); };
  const setZ = (value: number) => { setZValue(value); setXValue(+(mu + value * sigma).toFixed(8)); };

  const form = (
    <FormCard title="Z-Score — padronização" description={<>Converta entre uma observação <b>x</b> de N(μ, σ²) e seu correspondente padronizado <b>z</b> = (x − μ) / σ.</>}>
      <FieldRow>
        <NumberField label="Média μ" value={mu} onChange={setMu} />
        <NumberField label="Desvio padrão σ" value={sigma} onChange={setSigma} />
      </FieldRow>
      <FieldRow>
        <NumberField label="Observação x" value={x} onChange={setX} />
        <NumberField label="↔ z equivalente" value={z} onChange={setZ} />
      </FieldRow>
      <Hint>Edite <b>x</b> e o <b>z</b> se ajusta automaticamente (e vice-versa).</Hint>
    </FormCard>
  );
  if (!(sigma > 0)) return <SplitLayout form={form} chart={<Problem>{SIGMA_PROBLEM}</Problem>} />;

  const zValue = (x - mu) / sigma;
  const cdf = normalCDF(x, mu, sigma);

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          <NormalChart
            label="Curva normal com a observação x"
            curves={[{ mu, sigma }]}
            shades={[{ from: -Infinity, to: x, tone: 'soft' }]}
            marks={[{ x, label: `x = ${fmt(x, 3)} (z = ${fmt(zValue, 2)})` }]}
            info={[{ t: `μ = ${fmt(mu, 6)}; σ = ${fmt(sigma, 6)}` }, { t: `Φ(z) = ${fmt(cdf, 6)}`, soft: true }]}
          />
          <Legend items={[{ label: 'N(μ, σ²)' }, { label: 'x (observação)', kind: 'mark' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label="z = (x − μ) / σ" value={fmt(zValue, 6)} />
          <ResultGrid items={[
            ['Percentil de x (= Φ(z))', `${fmtPrecise(cdf * 100, 4)} %`],
            ['P(X ≤ x) — 10 casas', fmtPrecise(cdf, 10)],
            ['P(X ≥ x)', fmtPrecise(1 - cdf, 10)],
            ['Densidade f(x)', fmtPrecise(normalPDF(x, mu, sigma), 10)],
            ['Distância em desvios padrão', `${fmt(zValue, 4)} σ`],
            ['Interpretação', zInterpretation(zValue)],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   INTERVALO DE CONFIANÇA
   ============================================================ */

type InferenceMode = 'mean-z' | 'mean-t' | 'prop';

const ConfidenceIntervalTab: React.FC = () => {
  const [mode, setMode] = useState<InferenceMode>('mean-z');
  const [mean, setMean] = useState(50);
  const [sd, setSd] = useState(10);
  const [n, setN] = useState(30);
  const [successes, setSuccesses] = useState(60);
  const [propN, setPropN] = useState(100);
  const [confidence, setConfidence] = useState(95);

  const form = (
    <FormCard title="Intervalo de Confiança" description="Construa IC para a média (σ conhecido → z; σ desconhecido → t) ou para uma proporção.">
      <Segmented label="Tipo de intervalo" value={mode} onChange={setMode} options={[
        { value: 'mean-z', label: 'Média (σ conhecido)' },
        { value: 'mean-t', label: 'Média (σ desconhecido)' },
        { value: 'prop', label: 'Proporção' },
      ]} />
      <FieldRow>
        {mode === 'prop' ? (
          <>
            <NumberField label="Sucessos x" value={successes} min={0} integer onChange={setSuccesses} />
            <NumberField label="Tamanho n" value={propN} min={1} integer onChange={setPropN} />
          </>
        ) : (
          <>
            <NumberField label="Média amostral x̄" value={mean} onChange={setMean} />
            <NumberField label={mode === 'mean-t' ? 'Desvio padrão amostral s' : 'Desvio padrão populacional σ'} value={sd} onChange={setSd} />
            <NumberField label="Tamanho da amostra n" value={n} min={mode === 'mean-t' ? 2 : 1} integer onChange={setN} />
          </>
        )}
      </FieldRow>
      <FieldRow>
        <NumberField label="Nível de confiança (%)" value={confidence} min={0} max={100} onChange={setConfidence} />
      </FieldRow>
    </FormCard>
  );
  if (mode !== 'prop' && !(sd > 0)) return <SplitLayout form={form} chart={<Problem>{SIGMA_PROBLEM}</Problem>} />;

  const conf = clampPercent(confidence);
  const alpha = 1 - conf;
  let estimate: number, se: number, critical: number, df: number | null = null, title: string, equation: React.ReactNode;
  if (mode === 'mean-z') {
    estimate = mean;
    se = sd / Math.sqrt(n);
    critical = normalQuantile(1 - alpha / 2);
    title = `IC ${fmt(conf * 100, 2)}% para μ`;
    equation = <>x̄ ± z<sub>α/2</sub> · σ/√n</>;
  } else if (mode === 'mean-t') {
    const size = Math.max(n, 2);
    estimate = mean;
    se = sd / Math.sqrt(size);
    df = size - 1;
    critical = tQuantile(1 - alpha / 2, df);
    title = `IC ${fmt(conf * 100, 2)}% para μ`;
    equation = <>x̄ ± t<sub>α/2, n−1</sub> · s/√n</>;
  } else {
    const pHat = successes / propN;
    estimate = pHat;
    se = Math.sqrt(pHat * (1 - pHat) / propN);
    critical = normalQuantile(1 - alpha / 2);
    title = `IC ${fmt(conf * 100, 2)}% para p`;
    equation = <>p̂ ± z<sub>α/2</sub> · √(p̂(1−p̂)/n)</>;
  }
  const margin = critical * se;
  const lo = estimate - margin, hi = estimate + margin;

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          {se > 0 ? (
            <NormalChart
              label="Distribuição amostral com a área de confiança"
              curves={[{ mu: estimate, sigma: se }]}
              shades={[{ from: lo, to: hi }]}
              marks={[{ x: lo, label: fmt(lo, 4) }, { x: hi, label: fmt(hi, 4) }]}
              info={[
                { t: `Estimativa = ${fmt(estimate, 6)} ± ${fmt(margin, 6)}` },
                { t: `SE = ${fmt(se, 6)}; crítico = ${fmt(critical, 6)}`, soft: true },
                { t: `Confiança = ${fmt(conf * 100, 2)}%`, soft: true },
              ]}
            />
          ) : (
            <p className="text-sm text-slate-500">Com p̂ = 0 ou p̂ = 1 o erro padrão é zero e não há curva para desenhar.</p>
          )}
          <Legend items={[{ label: 'Distribuição amostral' }, { label: 'Área de confiança', kind: 'shade' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label={title} value={`[ ${fmt(lo, 6)} ; ${fmt(hi, 6)} ]`} />
          <ResultGrid items={[
            ['Estimativa pontual', fmtPrecise(estimate, 10)],
            ['Erro padrão (SE)', fmtPrecise(se, 10)],
            ['Valor crítico', fmtPrecise(critical, 10)],
            ['Margem de erro (E)', fmtPrecise(margin, 10)],
            ['Limite inferior', fmtPrecise(lo, 10)],
            ['Limite superior', fmtPrecise(hi, 10)],
            ['Graus de liberdade', df === null ? '—' : String(df)],
            ['Fórmula aplicada', equation],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   TESTE DE HIPÓTESE
   ============================================================ */

type Tail = 'two' | 'left' | 'right';

const HypothesisTestTab: React.FC = () => {
  const [mode, setMode] = useState<InferenceMode>('mean-z');
  const [tail, setTail] = useState<Tail>('two');
  const [mu0, setMu0] = useState(100);
  const [mean, setMean] = useState(103);
  const [sd, setSd] = useState(15);
  const [n, setN] = useState(40);
  const [p0, setP0] = useState(0.5);
  const [successes, setSuccesses] = useState(60);
  const [propN, setPropN] = useState(100);
  const [alphaPercent, setAlphaPercent] = useState(5);

  const form = (
    <FormCard title="Teste de Hipótese" description="Teste z para a média (σ conhecido), teste t (σ desconhecido) ou teste z para uma proporção. Mostra estatística, p-valor e regiões críticas.">
      <Segmented label="Tipo de teste" value={mode} onChange={setMode} options={[
        { value: 'mean-z', label: 'z para média' },
        { value: 'mean-t', label: 't para média' },
        { value: 'prop', label: 'z para proporção' },
      ]} />
      <Segmented label="Hipótese alternativa" value={tail} onChange={setTail} options={[
        { value: 'two', label: 'Bicaudal H₁: ≠' },
        { value: 'left', label: 'Cauda esquerda H₁: <' },
        { value: 'right', label: 'Cauda direita H₁: >' },
      ]} />
      <FieldRow>
        {mode === 'prop' ? (
          <>
            <NumberField label="p₀ (sob H₀)" value={p0} min={0} max={1} onChange={setP0} />
            <NumberField label="Sucessos x" value={successes} min={0} integer onChange={setSuccesses} />
            <NumberField label="n" value={propN} min={1} integer onChange={setPropN} />
          </>
        ) : (
          <>
            <NumberField label="Valor sob H₀ μ₀" value={mu0} onChange={setMu0} />
            <NumberField label="Média amostral x̄" value={mean} onChange={setMean} />
            <NumberField label={mode === 'mean-t' ? 's (desvio padrão amostral)' : 'σ (populacional)'} value={sd} onChange={setSd} />
            <NumberField label="n" value={n} min={mode === 'mean-t' ? 2 : 1} integer onChange={setN} />
          </>
        )}
      </FieldRow>
      <FieldRow>
        <NumberField label="Nível α (%)" value={alphaPercent} min={0} max={100} onChange={setAlphaPercent} />
      </FieldRow>
    </FormCard>
  );
  const seProblem = mode === 'prop' ? (p0 > 0 && p0 < 1 ? null : 'p₀ precisa estar entre 0 e 1 (sem os extremos).') : (sd > 0 ? null : SIGMA_PROBLEM);
  if (seProblem) return <SplitLayout form={form} chart={<Problem>{seProblem}</Problem>} />;

  const alpha = clampPercent(alphaPercent);
  let stat: number, se: number, df: number | null = null;
  if (mode === 'prop') {
    se = Math.sqrt(p0 * (1 - p0) / propN);
    stat = (successes / propN - p0) / se;
  } else {
    const size = mode === 'mean-t' ? Math.max(n, 2) : n;
    se = sd / Math.sqrt(size);
    stat = (mean - mu0) / se;
    if (mode === 'mean-t') df = size - 1;
  }
  const cdf = (v: number) => df === null ? Phi(v) : tCDF(v, df);
  const inverse = (p: number) => df === null ? normalQuantile(p) : tQuantile(p, df);

  const pValue = tail === 'two' ? 2 * (1 - cdf(Math.abs(stat))) : tail === 'left' ? cdf(stat) : 1 - cdf(stat);
  let critLo: number | null = null, critHi: number | null = null, critText: string;
  if (tail === 'two') {
    critLo = inverse(alpha / 2);
    critHi = inverse(1 - alpha / 2);
    critText = `± ${fmt(critHi, 6)}`;
  } else if (tail === 'left') {
    critLo = inverse(alpha);
    critText = fmt(critLo, 6);
  } else {
    critHi = inverse(1 - alpha);
    critText = fmt(critHi, 6);
  }
  const reject = pValue < alpha;
  const statLabel = df === null ? 'z' : 't';
  const shades: ChartShade[] = [];
  if (critLo !== null) shades.push({ from: -Infinity, to: critLo, tone: 'reject' });
  if (critHi !== null) shades.push({ from: critHi, to: Infinity, tone: 'reject' });
  const marks = [{ x: stat, label: `${statLabel} = ${fmt(stat, 3)}` }];
  const statInfo = { t: `Estatística = ${fmt(stat, 4)}; p = ${fmt(pValue, 6)}`, soft: true };

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          {df === null ? (
            <NormalChart label="Distribuição sob H₀ com a região de rejeição" curves={[{ mu: 0, sigma: 1 }]} shades={shades} marks={marks} info={[{ t: 'Distribuição padrão sob H₀' }, statInfo]} />
          ) : (
            <ContinuousChart
              label="Distribuição t sob H₀ com a região de rejeição"
              curves={[{ f: v => tPDF(v, df as number) }]}
              xRange={[Math.min(-4, stat - 0.8, (critLo ?? 0) - 0.5), Math.max(4, stat + 0.8, (critHi ?? 0) + 0.5)]}
              shades={shades}
              marks={marks}
              info={[{ t: `Distribuição t com ${df} graus de liberdade` }, statInfo]}
            />
          )}
          <Legend items={[{ label: 'Distribuição sob H₀' }, { label: 'Região de rejeição', kind: 'reject' }, { label: 'Estatística observada', kind: 'mark' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label={`Estatística (${statLabel})`} value={fmt(stat, 6)} />
          <ResultGrid items={[
            ['Estatística (10 casas)', fmtPrecise(stat, 10)],
            ['p-valor', fmt(pValue, 6)],
            ['p-valor (10 casas)', fmtPrecise(pValue, 10)],
            ['Valor(es) crítico(s)', critText],
            ['Erro padrão (SE)', fmtPrecise(se, 10)],
            ['Graus de liberdade', df === null ? '—' : String(df)],
            ['Decisão (α)', reject ? <Badge tone="bad">Rejeita H₀</Badge> : <Badge tone="good">Não rejeita H₀</Badge>],
            ['Interpretação', reject
              ? `Há evidência estatística contra H₀ ao nível α = ${fmt(alpha * 100, 2)}%.`
              : `Não há evidência estatística suficiente contra H₀ ao nível α = ${fmt(alpha * 100, 2)}%.`],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   TAMANHO DE AMOSTRA
   ============================================================ */

const SampleSizeTab: React.FC = () => {
  const [mode, setMode] = useState<'mean' | 'prop'>('mean');
  const [sigma, setSigma] = useState(10);
  const [pHat, setPHat] = useState(0.5);
  const [margin, setMargin] = useState(2);
  const [confidence, setConfidence] = useState(95);

  const form = (
    <FormCard title="Tamanho de Amostra" description={<>Qual <b>n</b> mínimo para garantir uma margem de erro <b>E</b> com o nível de confiança desejado?</>}>
      <Segmented label="Parâmetro" value={mode} onChange={setMode} options={[
        { value: 'mean', label: 'Para a média' },
        { value: 'prop', label: 'Para a proporção' },
      ]} />
      <FieldRow>
        {mode === 'mean'
          ? <NumberField label="Desvio padrão σ (estimado)" value={sigma} onChange={setSigma} />
          : <NumberField label="p̂ estimado (use 0,5 se desconhecido)" value={pHat} min={0} max={1} onChange={setPHat} />}
      </FieldRow>
      <FieldRow>
        <NumberField label="Margem de erro E" value={margin} onChange={setMargin} />
        <NumberField label="Confiança (%)" value={confidence} min={0} max={100} onChange={setConfidence} />
      </FieldRow>
    </FormCard>
  );
  const problem = !(margin > 0) ? 'A margem de erro precisa ser maior que zero.'
    : mode === 'mean' && !(sigma > 0) ? SIGMA_PROBLEM : null;
  if (problem) return <SplitLayout form={form} chart={<Problem>{problem}</Problem>} />;

  const conf = clampPercent(confidence);
  const z = normalQuantile(1 - (1 - conf) / 2);
  const sizeFor = (E: number) => mode === 'mean' ? Math.pow(z * sigma / E, 2) : z * z * pHat * (1 - pHat) / (E * E);
  const nRaw = sizeFor(margin);
  const n = Math.ceil(nRaw);

  return (
    <SplitLayout
      form={form}
      chart={
        <Card>
          <ContinuousChart
            label="Tamanho de amostra em função da margem de erro"
            curves={[{ f: sizeFor, fill: false }]}
            xRange={[margin * 0.3, margin * 3]}
            yFormat={v => String(Math.round(v))}
            marks={[{ x: margin }]}
            point={{ x: margin, y: n, label: `n = ${n}; E = ${fmt(margin, 4)}` }}
            info={[
              { t: 'n versus E (margem de erro)' },
              { t: `${mode === 'mean' ? `σ = ${fmt(sigma, 4)}` : `p̂ = ${fmt(pHat, 4)}`} · confiança ${fmt(conf * 100, 2)}%`, soft: true },
            ]}
            xTitle="Margem de erro E"
          />
          <Legend items={[{ label: 'n × Margem de erro' }, { label: 'Ponto escolhido', kind: 'mark' }]} />
        </Card>
      }
      results={
        <Card>
          <ResultMain label="Tamanho mínimo (n)" value={String(n)} />
          <ResultGrid items={[
            ['n calculado (não arredondado)', fmtPrecise(nRaw, 6)],
            ['z crítico (1−α/2)', fmtPrecise(z, 10)],
            ['Fórmula aplicada', mode === 'mean' ? <>n = (z<sub>α/2</sub> · σ / E)²</> : <>n = z²<sub>α/2</sub> · p̂ · (1 − p̂) / E²</>],
            ['Recomendação', n < 30 ? 'Considere usar t-Student' : 'Aproximação Normal adequada'],
          ]} />
        </Card>
      }
    />
  );
};

/* ============================================================
   COMPARAR NORMAIS
   ============================================================ */

const COMPARE_COLORS = [CHART_COLORS.curve, '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2', '#65a30d'];
const EXAMPLE_CURVES = [{ mu: 0, sigma: 1 }, { mu: 0, sigma: 2 }, { mu: 2, sigma: 1 }];

const CompareTab: React.FC = () => {
  // Each curve keeps an id so editing one row never moves another row's typing.
  const [curves, setCurves] = useState(() => EXAMPLE_CURVES.map((curve, i) => ({ ...curve, id: i })));
  const nextId = React.useRef(EXAMPLE_CURVES.length);
  const update = (id: number, key: 'mu' | 'sigma', value: number) =>
    setCurves(current => current.map(curve => curve.id === id ? { ...curve, [key]: value } : curve));
  const colorOf = (index: number) => COMPARE_COLORS[index % COMPARE_COLORS.length];
  const drawable = curves.filter(curve => curve.sigma > 0);

  return (
    <SplitLayout
      form={
        <FormCard title="Comparar Normais" description="Adicione várias N(μ, σ²) e veja como mudam de forma e posição.">
          <div className="space-y-2">
            {curves.map((curve, index) => (
              <div key={curve.id} className="grid grid-cols-[1rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <span className="mb-3 h-4 w-4 rounded" style={{ background: colorOf(index) }} aria-hidden="true" />
                <NumberField label={<>μ<span className="sr-only"> da curva {index + 1}</span></>} value={curve.mu} onChange={value => update(curve.id, 'mu', value)} />
                <NumberField label={<>σ<span className="sr-only"> da curva {index + 1}</span></>} value={curve.sigma} onChange={value => update(curve.id, 'sigma', value)} />
                <button
                  type="button"
                  onClick={() => setCurves(current => current.filter(item => item.id !== curve.id))}
                  aria-label={`Remover curva ${index + 1}`}
                  title="Remover"
                  className="h-9 w-9 rounded-lg border border-slate-300 text-lg text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setCurves(current => [...current, { mu: 0, sigma: 1, id: nextId.current++ }])} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700">
              + Adicionar curva
            </button>
            <button type="button" onClick={() => setCurves(EXAMPLE_CURVES.map(curve => ({ ...curve, id: nextId.current++ })))} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Restaurar exemplo
            </button>
          </div>
          <Hint>Os eixos se reescalonam automaticamente para abranger todas as curvas (μ ± 4σ).</Hint>
        </FormCard>
      }
      chart={
        <Card>
          {drawable.length > 0 ? (
            <NormalChart
              label="Curvas normais comparadas"
              curves={curves.map((curve, index) => ({ ...curve, color: colorOf(index), strokeWidth: 2.4, fillOpacity: 0.5 })).filter(curve => curve.sigma > 0)}
              info={[{ t: 'Comparação direta — eixos com escala real' }]}
            />
          ) : (
            <p className="text-sm text-slate-500">Adicione uma curva com σ maior que zero para ver o gráfico.</p>
          )}
          <Legend items={curves.map((curve, index) => ({ label: `N(${fmt(curve.mu, 3)}; ${fmt(curve.sigma * curve.sigma, 3)})`, color: colorOf(index) }))} />
        </Card>
      }
    />
  );
};

/* ============================================================
   TABELA Z
   ============================================================ */

type TableSide = 'lower' | 'upper' | 'central';

const ZTableTab: React.FC = () => {
  const [side, setSide] = useState<TableSide>('lower');
  const [range, setRange] = useState<'pos' | 'neg'>('pos');
  const [selected, setSelected] = useState<number | null>(null);

  // Rows hold z to one decimal; columns add the second decimal (away from zero).
  const rows = Array.from({ length: 35 }, (_, i) => range === 'pos' ? i / 10 : -(34 - i) / 10);
  const cellZ = (row: number, column: number) => +(range === 'pos' ? row + column / 100 : row - column / 100).toFixed(2);
  const valueOf = (z: number) => side === 'lower' ? Phi(z) : side === 'upper' ? 1 - Phi(z) : Phi(Math.abs(z)) - Phi(-Math.abs(z));
  const label = (z: number, digits: number) => (z < 0 || Object.is(z, -0) ? '−' : '') + Math.abs(z).toFixed(digits).replace('.', ',');

  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-800">Tabela Z interativa — Φ(z) = P(Z ≤ z)</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">Clique numa célula para ver os detalhes da probabilidade. Linhas: z até a 1ª decimal. Colunas: 2ª decimal.</p>
      <div className="flex flex-wrap gap-3">
        <Segmented label="Probabilidade da tabela" value={side} onChange={setSide} options={[
          { value: 'lower', label: 'P(Z ≤ z)' },
          { value: 'upper', label: 'P(Z ≥ z)' },
          { value: 'central', label: 'P(−z ≤ Z ≤ z)' },
        ]} />
        <Segmented label="Sinal de z" value={range} onChange={value => { setRange(value); setSelected(null); }} options={[
          { value: 'pos', label: 'z positivos (0,00 a 3,49)' },
          { value: 'neg', label: 'z negativos (−3,49 a 0,00)' },
        ]} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-center font-mono text-xs">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-1.5 text-blue-700">z</th>
              {Array.from({ length: 10 }, (_, c) => (
                <th key={c} scope="col" className="border-b border-r border-slate-200 bg-slate-100 px-2 py-1.5 text-blue-700">0,0{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row}>
                <th scope="row" className="sticky left-0 border-b border-r border-slate-200 bg-slate-100 px-2 py-1 text-blue-700">{label(range === 'neg' ? -Math.abs(row) : row, 1)}</th>
                {Array.from({ length: 10 }, (_, c) => {
                  const z = cellZ(row, c);
                  const isSelected = selected === z;
                  return (
                    <td key={c} className="border-b border-r border-slate-200 p-0">
                      <button
                        type="button"
                        onClick={() => setSelected(z)}
                        aria-label={`z = ${label(z, 2)}`}
                        aria-pressed={isSelected}
                        className={`w-full px-2 py-1 ${isSelected ? 'bg-amber-500 font-semibold text-white' : 'text-slate-800 hover:bg-blue-50'}`}
                      >
                        {valueOf(z).toFixed(4).replace('.', ',')}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div aria-live="polite" className="mt-3 min-h-[3.75rem] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-600">
        {selected === null ? 'Selecione uma célula para ver detalhes.' : (
          <>
            <div>z = <b className="text-blue-700">{label(selected, 2)}</b></div>
            <div>Φ(z) = P(Z ≤ z) = <b className="text-blue-700">{fmtPrecise(Phi(selected), 10)}</b></div>
            <div>P(Z ≥ z) = <b className="text-blue-700">{fmtPrecise(1 - Phi(selected), 10)}</b></div>
            <div>P(−|z| ≤ Z ≤ |z|) = <b className="text-blue-700">{fmtPrecise(Phi(Math.abs(selected)) - Phi(-Math.abs(selected)), 10)}</b></div>
            <div>P(|Z| ≥ |z|) (bicaudal) = <b className="text-blue-700">{fmtPrecise(2 * (1 - Phi(Math.abs(selected))), 10)}</b></div>
          </>
        )}
      </div>
    </Card>
  );
};

/* ============================================================ */

const TAB_CONTENT: Record<Tab, React.FC> = {
  prob: ProbabilityTab,
  quantile: QuantileTab,
  zscore: ZScoreTab,
  ci: ConfidenceIntervalTab,
  ht: HypothesisTestTab,
  sample: SampleSizeTab,
  compare: CompareTab,
  ztable: ZTableTab,
};

const NormalCalculator: React.FC = () => {
  const [tab, setTab] = useState<Tab>('prob');
  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {/* Every tab stays mounted so its inputs survive switching tabs. */}
      {TABS.map(({ id }) => {
        const Content = TAB_CONTENT[id];
        return <div key={id} hidden={id !== tab}><Content /></div>;
      })}
    </div>
  );
};

export default NormalCalculator;
