import React, { useState } from 'react';
import { fmt } from '../../../services/probability/format';
import { NumberField, Segmented } from '../CalculatorUI';
import { CHART_COLORS } from '../ProbabilityCharts';
import { ActionButton, Callout, Definition, PlayCard, Stepper, Tex, TheoryCard, ToggleChip, fracTex, pct, texNum } from './PlaygroundUI';

// Section 3: the classical, frequentist and axiomatic definitions of probability.

const ProbabilityReadout: React.FC<{ event: string; favorable: number; total: number }> = ({ event, favorable, total }) => {
  const p = total > 0 ? favorable / total : NaN;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4" aria-live="polite">
      <Tex block className="text-xl">{`P(${event}) = \\dfrac{n(${event})}{n(S)} = ${fracTex(favorable, total)}`}</Tex>
      {total > 0 && <p className="text-center font-mono text-lg font-semibold text-blue-700">{fmt(p, 4)} &nbsp;≈&nbsp; {pct(p)}</p>}
    </div>
  );
};

/* ============================================================
   CLÁSSICA
   ============================================================ */

const FRUITS = [
  { id: 'apple', name: 'Maçã', emoji: '🍎' },
  { id: 'banana', name: 'Banana', emoji: '🍌' },
  { id: 'orange', name: 'Laranja', emoji: '🍊' },
] as const;
type FruitId = typeof FRUITS[number]['id'];

const FruitBowlPlay: React.FC = () => {
  const [counts, setCounts] = useState<Record<FruitId, number>>({ apple: 5, banana: 3, orange: 2 });
  const [chosen, setChosen] = useState<Set<FruitId>>(() => new Set<FruitId>(['banana']));
  const [drawn, setDrawn] = useState<number | null>(null);

  const tiles = FRUITS.flatMap(fruit => Array.from({ length: counts[fruit.id] }, () => fruit));
  const favorable = tiles.filter(fruit => chosen.has(fruit.id)).length;
  const setCount = (id: FruitId, value: number) => { setCounts(current => ({ ...current, [id]: value })); setDrawn(null); };
  const toggle = (id: FruitId) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChosen(next);
  };
  const eventName = chosen.size === 0
    ? 'nenhuma fruta escolhida'
    : FRUITS.filter(fruit => chosen.has(fruit.id)).map(fruit => fruit.name.toLowerCase()).join(' ou ');
  const drawnFruit = drawn !== null ? tiles[drawn] : null;

  return (
    <PlayCard title="Fruteira: sorteie uma fruta sem olhar" description="Cada fruta tem a mesma chance de ser pega. Mude a quantidade de cada tipo e escolha o evento.">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          {FRUITS.map(fruit => (
            <Stepper key={fruit.id} label={<>{fruit.emoji} {fruit.name}s</>} value={counts[fruit.id]} min={0} max={12} onChange={value => setCount(fruit.id, value)} />
          ))}
          <p className="pt-2 text-sm font-semibold text-slate-600">Evento E: sortear…</p>
          <div className="flex flex-wrap gap-2">
            {FRUITS.map(fruit => (
              <ToggleChip key={fruit.id} active={chosen.has(fruit.id)} onClick={() => toggle(fruit.id)}>{fruit.emoji} {fruit.name}</ToggleChip>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex min-h-[7rem] flex-wrap content-start gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3" aria-label={`Fruteira com ${tiles.length} frutas`}>
            {tiles.length === 0 && <p className="text-sm text-slate-500">A fruteira está vazia: sem resultados possíveis, a fórmula não se aplica.</p>}
            {tiles.map((fruit, i) => (
              <span
                key={i}
                title={fruit.name}
                className={`flex h-11 w-11 items-center justify-center rounded-lg text-2xl transition ${
                  chosen.has(fruit.id) ? 'bg-amber-200 ring-2 ring-amber-500' : 'bg-white opacity-60 ring-1 ring-slate-200'
                } ${drawn === i ? 'scale-125 opacity-100 ring-4 ring-blue-600' : ''}`}
              >
                {fruit.emoji}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-600">E = sortear {eventName}</p>
          <ProbabilityReadout event="E" favorable={favorable} total={tiles.length} />
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton variant="primary" disabled={tiles.length === 0} onClick={() => setDrawn(Math.floor(Math.random() * tiles.length))}>Sortear uma fruta</ActionButton>
            {drawnFruit && (
              <p className={`text-sm font-semibold ${chosen.has(drawnFruit.id) ? 'text-green-700' : 'text-red-700'}`} aria-live="polite">
                Saiu {drawnFruit.emoji} {drawnFruit.name}: E {chosen.has(drawnFruit.id) ? 'ocorreu' : 'não ocorreu'}.
              </p>
            )}
          </div>
        </div>
      </div>
    </PlayCard>
  );
};

type DiceEvent = 'sum' | 'atLeast' | 'double' | 'six';

const DICE_EVENTS: Record<DiceEvent, { label: string; test: (i: number, j: number, k: number) => boolean; name: (k: number) => string; usesK: boolean }> = {
  sum: { label: 'Soma = k', test: (i, j, k) => i + j === k, name: k => `soma igual a ${k}`, usesK: true },
  atLeast: { label: 'Soma ≥ k', test: (i, j, k) => i + j >= k, name: k => `soma maior ou igual a ${k}`, usesK: true },
  double: { label: 'Faces iguais', test: (i, j) => i === j, name: () => 'as duas faces iguais', usesK: false },
  six: { label: 'Pelo menos um 6', test: (i, j) => i === 6 || j === 6, name: () => 'pelo menos um 6', usesK: false },
};
const FACES = [1, 2, 3, 4, 5, 6];
const SUMS = Array.from({ length: 11 }, (_, i) => i + 2);
const waysToSum = (s: number) => 6 - Math.abs(s - 7);

const TwoDicePlay: React.FC = () => {
  const [eventId, setEventId] = useState<DiceEvent>('sum');
  const [k, setK] = useState(7);
  const event = DICE_EVENTS[eventId];
  const favorable = FACES.reduce((count, i) => count + FACES.filter(j => event.test(i, j, k)).length, 0);

  return (
    <PlayCard title="Dois dados: 36 resultados igualmente prováveis" description="Cada célula é um resultado (1º dado, 2º dado). As células do evento ficam pintadas.">
      <Segmented label="Evento" value={eventId} onChange={setEventId} options={Object.entries(DICE_EVENTS).map(([value, item]) => ({ value: value as DiceEvent, label: item.label }))} />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <table className="mx-auto border-separate border-spacing-1 text-center font-mono" aria-label="Resultados de dois dados">
            <thead>
              <tr>
                <th className="text-[11px] font-semibold leading-tight text-slate-400">1º \ 2º</th>
                {FACES.map(j => <th key={j} className="h-8 w-10 text-sm font-bold text-emerald-700 sm:w-12">{j}</th>)}
              </tr>
            </thead>
            <tbody>
              {FACES.map(i => (
                <tr key={i}>
                  <th className="w-8 text-sm font-bold text-blue-700">{i}</th>
                  {FACES.map(j => {
                    const on = event.test(i, j, k);
                    return (
                      <td key={j} className={`h-10 w-10 rounded-md text-sm transition sm:h-12 sm:w-12 ${on ? 'bg-amber-300 font-bold text-slate-900 ring-2 ring-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="sr-only">({i}, {j}), soma </span>{i + j}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-center text-xs text-slate-500">O número em cada célula é a soma das faces.</p>
        </div>
        <div className="space-y-3">
          {event.usesK && (
            <Stepper label={<>Valor de <b>k</b></>} value={k} min={2} max={12} onChange={setK} />
          )}
          <p className="text-sm text-slate-600">E = {event.name(k)}</p>
          <ProbabilityReadout event="E" favorable={favorable} total={36} />
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-600">Quantas células dão cada soma (clique para escolher)</p>
            <div className="grid grid-cols-11 gap-1 text-center font-mono text-xs">
              {SUMS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setEventId('sum'); setK(s); }}
                  aria-label={`Soma ${s}: ${waysToSum(s)} de 36`}
                  className={`rounded-md border py-1 ${eventId === 'sum' && k === s ? 'border-amber-500 bg-amber-100' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                >
                  <span className="block font-bold text-slate-800">{s}</span>
                  <span className="block text-slate-500">{waysToSum(s)}</span>
                </button>
              ))}
            </div>
          </div>
          <Callout tone="warn">
            Cuidado: as <b>somas</b> 2, 3, …, 12 não são igualmente prováveis (a soma 7 aparece em 6 células; a soma 2, em uma só). Por isso
            {' '}<Tex>{'P(\\text{soma} = 7) = \\tfrac{6}{36}'}</Tex>, e não <Tex>{'\\tfrac{1}{11}'}</Tex>. A definição clássica só vale contando resultados equiprováveis.
          </Callout>
        </div>
      </div>
    </PlayCard>
  );
};

const ClassicalPart: React.FC = () => (
  <div className="space-y-6">
    <TheoryCard title="Definição clássica (Laplace)">
      <p>
        Quando o espaço amostral <Tex>S</Tex> é <b>finito</b> e todos os seus resultados são <b>igualmente prováveis</b> (equiprováveis),
        a probabilidade de um evento <Tex>A</Tex> é a fração dos resultados que são favoráveis a ele:
      </p>
      <Tex block className="text-xl">{'P(A) = \\dfrac{n(A)}{n(S)} = \\dfrac{\\text{número de resultados favoráveis a } A}{\\text{número total de resultados possíveis}}'}</Tex>
      <p>
        Exemplo: no lançamento de um dado, <Tex>{'P(\\text{par}) = \\tfrac{3}{6} = 0{,}5'}</Tex>. A definição <b>não</b> serve quando os
        resultados têm chances diferentes: sortear um adulto e classificar o estado nutricional tem 4 resultados, mas
        {' '}<Tex>{'P(\\text{obesidade})'}</Tex> não é <Tex>{'\\tfrac{1}{4}'}</Tex>.
      </p>
    </TheoryCard>
    <FruitBowlPlay />
    <TwoDicePlay />
  </div>
);

/* ============================================================
   FREQUENTISTA
   ============================================================ */

type FrequencyId = 'coin' | 'die' | 'overweight' | 'mystery';
interface FrequencyExperiment {
  label: string;
  event: string;
  p?: number;
  // What each repetition shows in the recent-results strip.
  outcome: (hit: boolean) => string;
}

const FREQUENCY_EXPERIMENTS: Record<FrequencyId, FrequencyExperiment> = {
  coin: { label: 'Moeda honesta', event: 'sair cara', p: 1 / 2, outcome: hit => (hit ? 'CA' : 'CO') },
  die: { label: 'Dado', event: 'sair 6', p: 1 / 6, outcome: hit => (hit ? '6' : String(1 + Math.floor(Math.random() * 5))) },
  overweight: { label: 'Excesso de peso', event: 'o adulto sorteado ter excesso de peso', p: 0.61, outcome: hit => (hit ? 'Sim' : 'Não') },
  mystery: { label: 'Moeda viciada misteriosa', event: 'sair cara', outcome: hit => (hit ? 'CA' : 'CO') },
};

const MAX_TRIALS = 10000;
const EXTRA_RUNS = 4;
const randomHiddenP = () => Math.round((0.15 + Math.random() * 0.7) * 100) / 100;

// Each run keeps the running count of successes: cumulative[i] = successes in the first i repetitions.
const extendRun = (cumulative: number[], times: number, p: number, onTrial?: (hit: boolean) => void) => {
  const next = cumulative.slice();
  let hits = next[next.length - 1];
  for (let t = 0; t < times; t++) {
    const hit = Math.random() < p;
    if (hit) hits++;
    next.push(hits);
    onTrial?.(hit);
  }
  return next;
};

const FrequencyChart: React.FC<{ runs: number[][]; p: number | null; showExtra: boolean }> = ({ runs, p, showExtra }) => {
  const W = 720, H = 300, L = 58, R = 20, T = 16, B = 44;
  const n = runs[0].length - 1;
  const xMax = Math.max(n, 10);
  const xs = (x: number) => L + (x / xMax) * (W - L - R);
  const ys = (y: number) => T + (1 - y) * (H - T - B);
  const step = Math.max(1, Math.floor(n / 600));
  const path = (cumulative: number[]) => {
    if (n === 0) return '';
    const points: string[] = [];
    for (let i = 1; i <= n; i += step) points.push(`${xs(i).toFixed(1)},${ys(cumulative[i] / i).toFixed(1)}`);
    if ((n - 1) % step !== 0) points.push(`${xs(n).toFixed(1)},${ys(cumulative[n] / n).toFixed(1)}`);
    return 'M' + points.join(' L');
  };
  // Round tick steps (1, 2 or 5 times a power of ten), about four of them.
  const magnitude = 10 ** Math.floor(Math.log10(xMax / 4));
  const tickStep = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= xMax / 4.5) ?? 10 * magnitude;
  const xTicks = Array.from({ length: Math.floor(xMax / tickStep) + 1 }, (_, j) => j * tickStep);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Frequência relativa ao longo das repetições" className="block h-auto w-full">
        {[0, 0.25, 0.5, 0.75, 1].map(y => (
          <g key={y}>
            <line x1={L} x2={W - R} y1={ys(y)} y2={ys(y)} stroke="#e5e7eb" strokeDasharray="3 3" />
            <text x={L - 8} y={ys(y) + 4} textAnchor="end" fontSize={13} fontFamily="ui-monospace, monospace" fill="#6b7280">{fmt(y, 2)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={ys(0)} y2={ys(0)} stroke="#94a3b8" />
        {xTicks.map((x, i) => (
          <text key={i} x={xs(x)} y={H - B + 18} textAnchor="middle" fontSize={13} fontFamily="ui-monospace, monospace" fill="#475569">{x}</text>
        ))}
        <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={13} fill="#475569">número de repetições (n)</text>
        <text x={14} y={(T + H - B) / 2} textAnchor="middle" fontSize={13} fill="#475569" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>f / n</text>
        {showExtra && runs.slice(1).map((run, i) => <path key={i} d={path(run)} fill="none" stroke="#94a3b8" strokeWidth={1.3} opacity={0.75} />)}
        {p !== null && (
          <g>
            <line x1={L} x2={W - R} y1={ys(p)} y2={ys(p)} stroke={CHART_COLORS.mark} strokeWidth={1.8} strokeDasharray="6 4" />
            <text x={W - R - 4} y={ys(p) - 6} textAnchor="end" fontSize={14} fontWeight={700} fontFamily="ui-monospace, monospace" fill={CHART_COLORS.mark}>p = {fmt(p, 4)}</text>
          </g>
        )}
        <path d={path(runs[0])} fill="none" stroke={CHART_COLORS.curve} strokeWidth={2.4} strokeLinejoin="round" />
        {n === 0 && <text x={(L + W - R) / 2} y={(T + H - B) / 2} textAnchor="middle" fontSize={15} fill="#64748b">Clique em “+1”, “+10”… para começar as repetições</text>}
      </svg>
    </div>
  );
};

const FrequencyPlay: React.FC = () => {
  const [experimentId, setExperimentId] = useState<FrequencyId>('coin');
  const [hiddenP, setHiddenP] = useState(randomHiddenP);
  const [revealed, setRevealed] = useState(false);
  const [runs, setRuns] = useState<number[][]>(() => Array.from({ length: 1 + EXTRA_RUNS }, () => [0]));
  const [recent, setRecent] = useState<{ label: string; hit: boolean }[]>([]);
  const [showExtra, setShowExtra] = useState(false);

  const experiment = FREQUENCY_EXPERIMENTS[experimentId];
  const p = experiment.p ?? hiddenP;
  const pKnown = experiment.p !== undefined || revealed;
  const n = runs[0].length - 1;
  const f = runs[0][n];

  const reset = () => { setRuns(Array.from({ length: 1 + EXTRA_RUNS }, () => [0])); setRecent([]); };
  const chooseExperiment = (id: FrequencyId) => {
    setExperimentId(id);
    if (id === 'mystery') { setHiddenP(randomHiddenP()); setRevealed(false); }
    reset();
  };
  const add = (times: number) => {
    const count = Math.min(times, MAX_TRIALS - n);
    if (count <= 0) return;
    const latest: { label: string; hit: boolean }[] = [];
    const main = extendRun(runs[0], count, p, hit => { latest.push({ label: experiment.outcome(hit), hit }); });
    setRuns([main, ...runs.slice(1).map(run => extendRun(run, count, p))]);
    setRecent(current => [...current, ...latest.slice(-30)].slice(-30));
  };

  return (
    <PlayCard title="Repita o experimento muitas vezes" description="A cada repetição, a frequência relativa f/n é recalculada. Observe o que acontece com a linha azul quando n cresce.">
      <Segmented label="Experimento" value={experimentId} onChange={chooseExperiment} options={Object.entries(FREQUENCY_EXPERIMENTS).map(([value, item]) => ({ value: value as FrequencyId, label: item.label }))} />
      <p className="mb-3 text-sm text-slate-600">
        Evento: <b>{experiment.event}</b>.{' '}
        {experimentId === 'overweight' && 'A probabilidade usada no sorteio (0,61) é ilustrativa, próxima da proporção de adultos com excesso de peso nas capitais brasileiras.'}
        {experimentId === 'mystery' && (revealed ? `A probabilidade escondida era ${fmt(hiddenP, 2)}.` : 'Ninguém sabe a probabilidade de cara: tente estimá-la pelas repetições e depois revele.')}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {[1, 10, 100, 1000].map(times => (
          <ActionButton key={times} variant={times === 1 ? 'primary' : 'secondary'} disabled={n >= MAX_TRIALS} onClick={() => add(times)}>+{times}</ActionButton>
        ))}
        <ActionButton onClick={reset}>Reiniciar</ActionButton>
        {experimentId === 'mystery' && (
          <ActionButton onClick={() => setRevealed(true)} disabled={revealed}>Revelar a probabilidade</ActionButton>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showExtra} onChange={event => setShowExtra(event.target.checked)} className="h-4 w-4 accent-blue-600" />
          Mostrar mais {EXTRA_RUNS} sequências
        </label>
      </div>

      <FrequencyChart runs={runs} p={pKnown ? p : null} showExtra={showExtra} />

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <dl className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"><dt className="text-xs font-semibold text-slate-500">repetições n</dt><dd className="font-mono text-lg font-semibold">{n}</dd></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"><dt className="text-xs font-semibold text-slate-500">ocorrências f</dt><dd className="font-mono text-lg font-semibold">{f}</dd></div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2"><dt className="text-xs font-semibold text-slate-500">f / n</dt><dd className="font-mono text-lg font-semibold text-blue-700">{n > 0 ? fmt(f / n, 4) : '—'}</dd></div>
        </dl>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-500">Últimos resultados</p>
          <div className="flex min-h-[2rem] flex-wrap gap-1">
            {recent.map((item, i) => (
              <span key={i} className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${item.hit ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
      {n >= 1000 && pKnown && (
        <div className="mt-3">
          <Callout tone="good">
            Depois de {n} repetições, <Tex>{`f/n = ${texNum(f / n)}`}</Tex> está a {fmt(Math.abs(f / n - p), 4)} de <Tex>{`p = ${texNum(p)}`}</Tex>.
            Com poucas repetições a frequência oscila bastante; com muitas, ela se estabiliza perto da probabilidade.
          </Callout>
        </div>
      )}
      {n >= MAX_TRIALS && <p className="mt-2 text-xs text-slate-500">Limite de {MAX_TRIALS} repetições atingido. Use “Reiniciar” para começar outra sequência.</p>}
    </PlayCard>
  );
};

const FrequentistPart: React.FC = () => (
  <div className="space-y-6">
    <TheoryCard title="Definição frequentista (empírica)">
      <p>
        Repetimos o experimento <Tex>n</Tex> vezes, nas mesmas condições, e contamos em quantas delas o evento <Tex>A</Tex> ocorreu
        (a frequência <Tex>f</Tex>). A probabilidade é o valor do qual a <b>frequência relativa</b> se aproxima quando <Tex>n</Tex> fica muito grande:
      </p>
      <Tex block className="text-xl">{'P(A) \\approx \\dfrac{f}{n} \\quad\\text{para } n \\text{ grande} \\qquad\\qquad P(A) = \\lim_{n \\to \\infty} \\dfrac{f}{n}'}</Tex>
      <p>
        Ela é usada quando não dá para supor resultados equiprováveis. A proporção de pacientes com anemia em um ambulatório, por exemplo,
        só pode ser conhecida observando muitos pacientes: se 45 de 300 prontuários indicam anemia, estimamos <Tex>{'P(\\text{anemia}) \\approx \\tfrac{45}{300} = 0{,}15'}</Tex>.
      </p>
    </TheoryCard>
    <FrequencyPlay />
  </div>
);

/* ============================================================
   AXIOMÁTICA
   ============================================================ */

const STATUS_OUTCOMES = ['Baixo peso', 'Eutrofia', 'Sobrepeso', 'Obesidade'];
const MODEL_PRESETS: { label: string; values: number[] }[] = [
  { label: 'Equiprovável (1/4 cada)', values: [0.25, 0.25, 0.25, 0.25] },
  { label: 'Proporções observadas', values: [0.03, 0.36, 0.37, 0.24] },
  { label: 'Soma maior que 1', values: [0.1, 0.4, 0.45, 0.3] },
  { label: 'Valor negativo', values: [-0.1, 0.5, 0.35, 0.25] },
];
const SEGMENT_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444'];
const TOLERANCE = 1e-6;

const AxiomCheck: React.FC<{ ok: boolean; title: React.ReactNode; children: React.ReactNode }> = ({ ok, title, children }) => (
  <li className={`rounded-xl border px-4 py-3 ${ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
    <p className={`font-semibold ${ok ? 'text-green-800' : 'text-red-800'}`}>{ok ? '✓' : '✗'} {title}</p>
    <div className="mt-1 text-sm text-slate-700">{children}</div>
  </li>
);

const AxiomsPlay: React.FC = () => {
  const [values, setValues] = useState<number[]>(MODEL_PRESETS[1].values);
  const [event, setEvent] = useState<Set<number>>(() => new Set([2, 3]));

  const total = values.reduce((sum, v) => sum + v, 0);
  const negatives = STATUS_OUTCOMES.filter((_, i) => values[i] < 0);
  const axiom1 = negatives.length === 0;
  const axiom2 = Math.abs(total - 1) < TOLERANCE;
  const valid = axiom1 && axiom2;
  const chosen = [...event].sort((a, b) => a - b);
  const pEvent = chosen.reduce((sum, i) => sum + values[i], 0);
  const scale = Math.max(1, values.reduce((sum, v) => sum + Math.max(v, 0), 0));

  const setValue = (index: number, value: number) => setValues(current => current.map((v, i) => (i === index ? value : v)));
  const normalize = () => {
    if (!axiom1 || total <= 0) return;
    const rounded = values.map(v => Math.round((v / total) * 10000) / 10000);
    rounded[rounded.length - 1] = Math.round((1 - rounded.slice(0, -1).reduce((sum, v) => sum + v, 0)) * 10000) / 10000;
    setValues(rounded);
  };
  const toggle = (index: number) => {
    const next = new Set(event);
    if (next.has(index)) next.delete(index); else next.add(index);
    setEvent(next);
  };

  return (
    <PlayCard title="Monte um modelo de probabilidade" description="Experimento: sortear um adulto e classificar o estado nutricional. Dê uma probabilidade para cada resultado e veja se as escolhas obedecem aos axiomas.">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Modelos prontos:</span>
        {MODEL_PRESETS.map(preset => (
          <button key={preset.label} type="button" onClick={() => setValues(preset.values)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-blue-400 hover:text-blue-700">
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          {STATUS_OUTCOMES.map((outcome, i) => (
            <div key={outcome} className="grid grid-cols-[minmax(0,1fr)_7rem] items-end gap-3">
              <label className="block text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: SEGMENT_COLORS[i] }} />P({outcome})</span>
                <input type="range" min={0} max={1} step={0.01} value={Math.min(Math.max(values[i], 0), 1)} onChange={event => setValue(i, Number(event.target.value))} className="mt-1 w-full accent-blue-600" aria-label={`P(${outcome})`} />
              </label>
              <NumberField label="valor" value={values[i]} onChange={value => setValue(i, value)} />
            </div>
          ))}

          <div>
            <div className="relative h-9 overflow-hidden rounded-lg border border-slate-300 bg-slate-100" aria-hidden="true">
              {(() => {
                let left = 0;
                return values.map((v, i) => {
                  const width = (Math.max(v, 0) / scale) * 100;
                  const segment = <span key={i} className="absolute inset-y-0 transition-all" style={{ left: `${left}%`, width: `${width}%`, background: SEGMENT_COLORS[i] }} />;
                  left += width;
                  return segment;
                });
              })()}
              <span className="absolute inset-y-0 w-0.5 bg-slate-900" style={{ left: `${(1 / scale) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">A barra empilha as probabilidades; a linha preta marca o valor 1.</p>
          </div>
          <ActionButton onClick={normalize} disabled={!axiom1 || total <= 0 || axiom2} title="Divide cada valor pela soma">Ajustar para somar 1</ActionButton>
        </div>

        <div className="space-y-3">
          <div className={`rounded-xl px-4 py-3 text-center text-lg font-bold ${valid ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} aria-live="polite">
            {valid ? 'Modelo válido: é uma probabilidade' : 'Isto não é uma probabilidade'}
          </div>
          <ol className="space-y-2">
            <AxiomCheck ok={axiom1} title={<>Axioma 1: <Tex>{'P(A) \\geq 0'}</Tex></>}>
              {axiom1 ? 'Nenhuma probabilidade é negativa.' : `Valor negativo em: ${negatives.join(', ')}.`}
            </AxiomCheck>
            <AxiomCheck ok={axiom2} title={<>Axioma 2: <Tex>{'P(S) = 1'}</Tex></>}>
              <Tex>{`P(S) = ${values.map(v => texNum(v)).join(' + ').replace(/\+ -/g, '- ')} = ${texNum(total)}`}</Tex>
              {!axiom2 && <> — a soma de todos os resultados precisa ser 1.</>}
            </AxiomCheck>
            <AxiomCheck ok title={<>Axioma 3: eventos disjuntos somam</>}>
              <p className="mb-2">Escolha os resultados de um evento E:</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {STATUS_OUTCOMES.map((outcome, i) => (
                  <ToggleChip key={outcome} active={event.has(i)} onClick={() => toggle(i)}>{outcome}</ToggleChip>
                ))}
              </div>
              {chosen.length === 0 ? (
                <Tex>{'P(\\varnothing) = 0'}</Tex>
              ) : (
                <Tex>{`P(E) = ${chosen.map(i => `P(\\text{${STATUS_OUTCOMES[i]}})`).join(' + ')} = ${texNum(pEvent)}`}</Tex>
              )}
              <p className="mt-1 text-xs text-slate-500">Os resultados não acontecem juntos (são disjuntos), por isso a probabilidade da união é a soma.</p>
            </AxiomCheck>
          </ol>
        </div>
      </div>
    </PlayCard>
  );
};

const AxiomaticPart: React.FC = () => (
  <div className="space-y-6">
    <TheoryCard title="Definição axiomática (Kolmogorov, 1933)">
      <p>
        Em vez de dizer <i>como</i> calcular, a definição axiomática diz quais <b>regras</b> qualquer probabilidade precisa obedecer.
        Uma probabilidade é uma função <Tex>P</Tex> que associa a cada evento <Tex>A</Tex> de <Tex>S</Tex> um número <Tex>P(A)</Tex> tal que:
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Definition term="Axioma 1 — não negatividade"><Tex block>{'P(A) \\geq 0'}</Tex></Definition>
        <Definition term="Axioma 2 — evento certo"><Tex block>{'P(S) = 1'}</Tex></Definition>
        <Definition term="Axioma 3 — aditividade">
          <p className="text-sm">Se <Tex>{'A \\cap B = \\varnothing'}</Tex> (eventos disjuntos):</p>
          <Tex block>{'P(A \\cup B) = P(A) + P(B)'}</Tex>
        </Definition>
      </div>
      <p>
        As definições clássica e frequentista obedecem a esses três axiomas. E todas as propriedades da próxima seção (complementar,
        vazio, união…) são consequências deles.
      </p>
    </TheoryCard>
    <AxiomsPlay />
  </div>
);

/* ---------- section ---------- */

type Approach = 'classical' | 'frequentist' | 'axiomatic';

const COMPARISON: { name: string; idea: string; when: string; limit: string }[] = [
  { name: 'Clássica', idea: 'Contar os resultados favoráveis entre resultados igualmente possíveis.', when: 'Dados, moedas, sorteios em que os resultados são simétricos.', limit: 'Exige espaço amostral finito e resultados equiprováveis.' },
  { name: 'Frequentista', idea: 'Proporção de vezes que o evento ocorre em muitas repetições.', when: 'Dados observados: pesquisas, prontuários, experimentos.', limit: 'Dá uma estimativa, que depende de muitas repetições nas mesmas condições.' },
  { name: 'Axiomática', idea: 'Regras que toda probabilidade deve cumprir.', when: 'É a base da teoria e vale junto com as outras duas.', limit: 'Não diz qual número usar, só quais atribuições são válidas.' },
];

const DefinitionsSection: React.FC = () => {
  const [approach, setApproach] = useState<Approach>('classical');
  return (
    <div className="space-y-6">
      <p className="text-[15px] text-slate-700">
        Existem três formas clássicas de definir probabilidade. Todas dão um número entre 0 e 1, mas cada uma responde de um jeito à pergunta
        “de onde vem esse número?”.
      </p>
      <Segmented label="Definição" value={approach} onChange={setApproach} options={[
        { value: 'classical', label: 'Clássica' },
        { value: 'frequentist', label: 'Frequentista' },
        { value: 'axiomatic', label: 'Axiomática' },
      ]} />
      {approach === 'classical' && <ClassicalPart />}
      {approach === 'frequentist' && <FrequentistPart />}
      {approach === 'axiomatic' && <AxiomaticPart />}

      <TheoryCard title="Comparando as três definições">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-semibold">Definição</th>
                <th className="py-2 pr-3 font-semibold">Ideia</th>
                <th className="py-2 pr-3 font-semibold">Quando usar</th>
                <th className="py-2 font-semibold">Limitação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON.map(row => (
                <tr key={row.name}>
                  <td className="py-2 pr-3 font-bold text-slate-800">{row.name}</td>
                  <td className="py-2 pr-3">{row.idea}</td>
                  <td className="py-2 pr-3">{row.when}</td>
                  <td className="py-2">{row.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout>
          A Aula 13 apresenta também a abordagem <b>subjetiva</b>, baseada na experiência ou no julgamento de especialistas, para quando não
          há equiprobabilidade nem repetições disponíveis. Ela também precisa respeitar os axiomas.
        </Callout>
      </TheoryCard>
    </div>
  );
};

export default DefinitionsSection;
