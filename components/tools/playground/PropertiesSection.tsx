import React, { useState } from 'react';
import { fmt, parseDecimal } from '../../../services/probability/format';
import { Segmented } from '../CalculatorUI';
import {
  ActionButton, Callout, PlayCard, Region, REGION_BIT, REGIONS, Slider, Tex, TheoryCard, VennDiagram, VennLayout,
  fracTex, inMask, layoutHasRegion, texNum,
} from './PlaygroundUI';

// Section 4: the properties that follow from the axioms, on a group where one person is drawn at random.

interface Counts { N: number; nA: number; nB: number; nAB: number }

interface Scenario extends Counts {
  id: string;
  label: string;
  place: string;
  noun: string;
  single: string;
  // "o paciente sorteado tem hipertensão" and "ter hipertensão".
  a: string;
  b: string;
  aInf: string;
  bInf: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'clinic', label: 'Ambulatório', place: 'um ambulatório de nutrição', noun: 'pacientes', single: 'paciente',
    a: 'tem hipertensão', b: 'tem diabetes', aInf: 'ter hipertensão', bInf: 'ter diabetes',
    N: 50, nA: 20, nB: 12, nAB: 6,
  },
  {
    id: 'students', label: 'Turma de Nutrição', place: 'uma turma de Nutrição', noun: 'estudantes', single: 'estudante',
    a: 'toma café da manhã todos os dias', b: 'pratica atividade física', aInf: 'tomar café da manhã todos os dias', bInf: 'praticar atividade física',
    N: 40, nA: 28, nB: 18, nAB: 14,
  },
  {
    id: 'labels', label: 'Rótulos de alimentos', place: 'uma prateleira de supermercado', noun: 'produtos', single: 'produto',
    a: 'tem a lupa “alto em sódio”', b: 'tem a lupa “alto em açúcar adicionado”', aInf: 'ter a lupa “alto em sódio”', bInf: 'ter a lupa “alto em açúcar adicionado”',
    N: 60, nA: 18, nB: 21, nAB: 3,
  },
];

// Keeps the four counts possible: max(0, n(A) + n(B) − N) ≤ n(A∩B) ≤ min(n(A), n(B)).
const clampCounts = ({ N, nA, nB, nAB }: Counts): Counts => {
  const a = Math.min(nA, N), b = Math.min(nB, N);
  return { N, nA: a, nB: b, nAB: Math.min(Math.max(nAB, Math.max(0, a + b - N)), Math.min(a, b)) };
};

const regionCounts = ({ N, nA, nB, nAB }: Counts): Record<Region, number> => ({
  a: nA - nAB, ab: nAB, b: nB - nAB, n: N - nA - nB + nAB,
});

const layoutFor = ({ nA, nB, nAB }: Counts): VennLayout =>
  nAB === 0 ? 'disjoint' : nAB === nA ? 'aInB' : nAB === nB ? 'bInA' : 'overlap';

const LAYOUT_CAPTION: Record<VennLayout, string> = {
  overlap: 'A e B têm elementos em comum.',
  disjoint: 'A ∩ B = ∅: A e B são mutuamente exclusivos, e o diagrama os separa.',
  aInB: 'Todo elemento de A também está em B: A ⊂ B.',
  bInA: 'Todo elemento de B também está em A: B ⊂ A.',
};

const t = (n: number) => texNum(n, 4);

interface Property {
  id: string;
  title: string;
  statement: string;
  mask: number;
  // Regions counted twice, as in P(A) + P(B).
  doubleMask?: number;
  why: React.ReactNode;
  calc: (c: Counts) => string[];
  action?: { label: string; apply: (c: Counts) => Counts; blocked?: (c: Counts) => string | null };
}

const probabilities = (c: Counts) => {
  const union = c.nA + c.nB - c.nAB;
  return { pA: c.nA / c.N, pB: c.nB / c.N, pAB: c.nAB / c.N, union, pUnion: union / c.N };
};

const PROPERTIES: Property[] = [
  {
    id: 'sure', title: 'Espaço amostral', statement: 'P(S) = 1', mask: 15,
    why: <>É o axioma 2: algum resultado sempre ocorre, então o evento <Tex>S</Tex> é certo.</>,
    calc: c => [`P(S) = \\dfrac{n(S)}{n(S)} = \\dfrac{${c.N}}{${c.N}} = 1`],
  },
  {
    id: 'empty', title: 'Evento impossível', statement: 'P(\\varnothing) = 0', mask: 0,
    why: <>Como <Tex>{'S \\cap \\varnothing = \\varnothing'}</Tex> e <Tex>{'S \\cup \\varnothing = S'}</Tex>, o axioma 3 dá <Tex>{'P(S) = P(S) + P(\\varnothing)'}</Tex>; logo <Tex>{'P(\\varnothing) = 0'}</Tex>. Nenhuma bolinha está no evento vazio.</>,
    calc: c => [`P(\\varnothing) = \\dfrac{0}{${c.N}} = 0`],
  },
  {
    id: 'bounds', title: 'Entre 0 e 1', statement: '0 \\leq P(A) \\leq 1', mask: 3,
    why: <>Como <Tex>{'\\varnothing \\subset A \\subset S'}</Tex>, a probabilidade de <Tex>A</Tex> fica entre <Tex>{'P(\\varnothing) = 0'}</Tex> e <Tex>{'P(S) = 1'}</Tex>. Probabilidade negativa ou maior que 1 indica erro de conta.</>,
    calc: c => [`0 \\leq P(A) = ${fracTex(c.nA, c.N)} = ${t(c.nA / c.N)} \\leq 1`],
  },
  {
    id: 'complement', title: 'Complementar', statement: 'P(\\overline{A}) = 1 - P(A)', mask: 12,
    why: <><Tex>A</Tex> e <Tex>{'\\overline{A}'}</Tex> são disjuntos e <Tex>{'A \\cup \\overline{A} = S'}</Tex>. Pelos axiomas 2 e 3, <Tex>{'P(A) + P(\\overline{A}) = 1'}</Tex>. Ajuda quando é mais fácil calcular o contrário do evento.</>,
    calc: c => {
      const pA = c.nA / c.N;
      return [`P(\\overline{A}) = 1 - P(A) = 1 - ${t(pA)} = ${t(1 - pA)}`, `\\text{conferindo: } ${fracTex(c.N - c.nA, c.N)}`];
    },
  },
  {
    id: 'union', title: 'União', statement: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', mask: 7, doubleMask: 2,
    why: <>Ao somar <Tex>P(A)</Tex> e <Tex>P(B)</Tex>, quem está nos dois eventos é contado <b>duas vezes</b> (bolinhas laranja-escuras); por isso subtraímos <Tex>{'P(A \\cap B)'}</Tex> uma vez. A mesma regra aparece na seção 4.5 da Aula 14.</>,
    calc: c => {
      const { pA, pB, pAB, union, pUnion } = probabilities(c);
      return [
        `P(A \\cup B) = ${t(pA)} + ${t(pB)} - ${t(pAB)} = ${t(pUnion)}`,
        `\\text{contando: } ${c.nA} + ${c.nB} - ${c.nAB} = ${union} \\;\\Rightarrow\\; ${fracTex(union, c.N)}`,
      ];
    },
  },
  {
    id: 'exclusive', title: 'União de exclusivos', statement: 'A \\cap B = \\varnothing \\Rightarrow P(A \\cup B) = P(A) + P(B)', mask: 7,
    why: <>Se <Tex>A</Tex> e <Tex>B</Tex> não podem ocorrer juntos, nada é contado duas vezes: <Tex>{'P(A \\cap B) = 0'}</Tex> e a regra da união vira o axioma 3.</>,
    calc: c => {
      const { pA, pB, pUnion } = probabilities(c);
      return c.nAB === 0
        ? [`P(A \\cup B) = ${t(pA)} + ${t(pB)} = ${t(pUnion)}`]
        : [
          `\\text{Agora } n(A \\cap B) = ${c.nAB} \\neq 0 \\text{: os eventos não são exclusivos.}`,
          `P(A) + P(B) = ${t(pA + pB)} \\;\\neq\\; P(A \\cup B) = ${t(pUnion)}`,
        ];
    },
    action: {
      label: 'Tornar A e B exclusivos',
      apply: c => ({ ...c, nAB: 0 }),
      blocked: c => (c.nA + c.nB > c.N ? `Impossível: n(A) + n(B) = ${c.nA + c.nB} passa de N = ${c.N}, então A e B precisam ter elementos em comum.` : null),
    },
  },
  {
    id: 'difference', title: 'Diferença', statement: 'P(A - B) = P(A) - P(A \\cap B)', mask: 1,
    why: <><Tex>A</Tex> se divide em duas partes disjuntas, <Tex>{'A - B'}</Tex> e <Tex>{'A \\cap B'}</Tex>. Pelo axioma 3, <Tex>{'P(A) = P(A - B) + P(A \\cap B)'}</Tex>.</>,
    calc: c => {
      const { pA, pAB } = probabilities(c);
      return [`P(A - B) = ${t(pA)} - ${t(pAB)} = ${t(pA - pAB)}`, `\\text{conferindo: } ${fracTex(c.nA - c.nAB, c.N)}`];
    },
  },
  {
    id: 'subset', title: 'Evento contido', statement: 'A \\subset B \\Rightarrow P(A) \\leq P(B)', mask: 6,
    why: <>Se <Tex>{'A \\subset B'}</Tex>, então <Tex>B</Tex> é formado por <Tex>A</Tex> e <Tex>{'B - A'}</Tex>, disjuntos: <Tex>{'P(B) = P(A) + P(B - A) \\geq P(A)'}</Tex>. Exemplo: ter obesidade está contido em ter excesso de peso.</>,
    calc: c => {
      const { pA, pB } = probabilities(c);
      return c.nAB === c.nA
        ? [`A \\subset B: \\quad P(A) = ${t(pA)} \\;\\leq\\; P(B) = ${t(pB)}`]
        : [`\\text{Agora A não está contido em B: há } ${c.nA - c.nAB} \\text{ elemento${c.nA - c.nAB === 1 ? '' : 's'} só em A.}`];
    },
    // A B smaller than A grows past it, so B keeps elements outside A.
    action: { label: 'Colocar A dentro de B', apply: c => ({ ...c, nB: c.nB >= c.nA ? c.nB : Math.min(c.N, c.nA + 6), nAB: c.nA }) },
  },
  {
    id: 'neither', title: 'Nenhum dos dois', statement: 'P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B)', mask: 8,
    why: <>Pela lei de De Morgan, <Tex>{'\\overline{A} \\cap \\overline{B} = \\overline{A \\cup B}'}</Tex>: “nenhum dos dois” é o complementar de “pelo menos um”.</>,
    calc: c => {
      const { pUnion, union } = probabilities(c);
      return [`P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B) = 1 - ${t(pUnion)} = ${t(1 - pUnion)}`, `\\text{conferindo: } ${fracTex(c.N - union, c.N)}`];
    },
  },
];

const DOT_STYLE: Record<Region, string> = {
  a: 'border-blue-400 bg-blue-100',
  ab: 'border-indigo-400 bg-indigo-200',
  b: 'border-emerald-400 bg-emerald-100',
  n: 'border-slate-300 bg-white',
};

const DotGrid: React.FC<{ counts: Record<Region, number>; mask: number; doubleMask?: number; noun: string }> = ({ counts, mask, doubleMask = 0, noun }) => {
  const dots = REGIONS.flatMap(region => Array.from({ length: counts[region] }, () => region));
  return (
    <div>
      <div className="grid w-fit grid-cols-10 gap-1.5" role="img" aria-label={`${dots.length} ${noun}, um por bolinha`}>
        {dots.map((region, i) => (
          <span
            key={i}
            className={`h-5 w-5 rounded-full border-2 transition-colors duration-300 ${
              inMask(doubleMask, region) ? 'border-orange-700 bg-orange-500' : inMask(mask, region) ? 'border-amber-600 bg-amber-400' : DOT_STYLE[region]
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded-full border-2 ${DOT_STYLE.a}`} />só A</span>
        <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded-full border-2 ${DOT_STYLE.ab}`} />A e B</span>
        <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded-full border-2 ${DOT_STYLE.b}`} />só B</span>
        <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded-full border-2 ${DOT_STYLE.n}`} />nenhum</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-amber-600 bg-amber-400" />no evento da propriedade</span>
        {doubleMask > 0 && <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-orange-700 bg-orange-500" />contado duas vezes</span>}
      </div>
    </div>
  );
};

const ExplorerPlay: React.FC<{ scenario: Scenario; counts: Counts; setCounts: (counts: Counts) => void }> = ({ scenario, counts, setCounts }) => {
  const [propertyId, setPropertyId] = useState('union');
  const property = PROPERTIES.find(item => item.id === propertyId) ?? PROPERTIES[0];
  const regions = regionCounts(counts);
  const layout = layoutFor(counts);
  const blocked = property.action?.blocked?.(counts) ?? null;
  const update = (patch: Partial<Counts>) => setCounts(clampCounts({ ...counts, ...patch }));

  const values: Partial<Record<Region, [string, string?]>> = {};
  REGIONS.forEach(region => {
    if (layoutHasRegion(layout, region)) values[region] = [String(regions[region]), fmt(regions[region] / counts.N, 3)];
  });
  if (layout === 'disjoint') values.ab = ['∅'];

  return (
    <PlayCard
      title="Explorador de propriedades"
      description={<>Sorteia-se ao acaso um dos {counts.N} {scenario.noun} de {scenario.place}. Cada um tem a mesma chance, então <Tex>{'P(E) = n(E)/N'}</Tex>. Escolha uma propriedade e mexa nas quantidades.</>}
    >
      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"><b className="text-blue-700">A</b>: o {scenario.single} sorteado {scenario.a}</p>
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"><b className="text-emerald-700">B</b>: o {scenario.single} sorteado {scenario.b}</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Propriedade">
        {PROPERTIES.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === property.id}
            onClick={() => setPropertyId(item.id)}
            className={`min-w-0 rounded-xl border-2 px-3 py-2 text-left transition ${
              item.id === property.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{item.title}</span>
            <Tex className="block overflow-x-auto text-sm text-slate-900">{item.statement}</Tex>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
            <VennDiagram ariaLabel={`Diagrama de Venn: ${property.title}`} layout={layout} highlighted={property.mask} values={values} />
            <p className="px-2 pb-1 text-center text-xs text-slate-500">Em cada região: quantidade e probabilidade. {LAYOUT_CAPTION[layout]}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-slate-600">Cada bolinha é um dos {counts.N} {scenario.noun}</p>
            <DotGrid counts={regions} mask={property.mask} doubleMask={property.doubleMask} noun={scenario.noun} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">{property.title}</p>
            <Tex block className="text-base sm:text-xl">{property.statement}</Tex>
            <p className="text-[15px] leading-relaxed text-slate-700">{property.why}</p>
            <div className="mt-3 space-y-1 rounded-lg bg-white/70 p-3">
              {property.calc(counts).map((line, i) => <Tex key={i} block className="text-sm sm:text-base">{line}</Tex>)}
            </div>
            {property.action && (
              <div className="mt-3">
                <ActionButton variant="primary" disabled={Boolean(blocked)} onClick={() => setCounts(clampCounts(property.action!.apply(counts)))}>{property.action.label}</ActionButton>
                {blocked && <p className="mt-2 text-sm text-amber-900">{blocked}</p>}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <Slider label={<>Total de {scenario.noun}, <Tex>{'N = n(S)'}</Tex></>} value={counts.N} min={10} max={100} onChange={N => update({ N })} />
            <Slider label={<Tex>{'n(A)'}</Tex>} value={counts.nA} min={0} max={counts.N} onChange={nA => update({ nA })} display={<>{counts.nA} <span className="text-sm text-slate-500">(P = {fmt(counts.nA / counts.N, 3)})</span></>} />
            <Slider label={<Tex>{'n(B)'}</Tex>} value={counts.nB} min={0} max={counts.N} onChange={nB => update({ nB })} display={<>{counts.nB} <span className="text-sm text-slate-500">(P = {fmt(counts.nB / counts.N, 3)})</span></>} />
            <Slider
              label={<Tex>{'n(A \\cap B)'}</Tex>}
              value={counts.nAB}
              min={Math.max(0, counts.nA + counts.nB - counts.N)}
              max={Math.min(counts.nA, counts.nB)}
              onChange={nAB => update({ nAB })}
              display={<>{counts.nAB} <span className="text-sm text-slate-500">(P = {fmt(counts.nAB / counts.N, 3)})</span></>}
            />
            <p className="text-xs text-slate-500">
              A interseção fica limitada: não pode passar de <Tex>{'\\min\\{n(A), n(B)\\}'}</Tex> nem ser menor que <Tex>{'n(A) + n(B) - N'}</Tex>.
            </p>
          </div>
        </div>
      </div>
    </PlayCard>
  );
};

/* ---------- quick exercise ---------- */

type QuestionKind = 'union' | 'complement' | 'neither' | 'onlyA' | 'intersection';
interface Question { kind: QuestionKind; pA: number; pB: number; pAB: number }

const QUESTION_KINDS: QuestionKind[] = ['union', 'complement', 'neither', 'onlyA', 'intersection'];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const steps = (from: number, to: number) => {
  const list: number[] = [];
  for (let v = Math.round(from * 20); v <= Math.round(to * 20); v++) list.push(v / 20);
  return list;
};

const newQuestion = (previous?: QuestionKind): Question => {
  const kind = pick(QUESTION_KINDS.filter(item => item !== previous));
  const pA = pick(steps(0.2, 0.6)), pB = pick(steps(0.2, 0.6));
  const pAB = pick(steps(Math.max(0.05, pA + pB - 0.95), Math.min(pA, pB) - 0.05));
  return { kind, pA, pB, pAB };
};

const questionParts = (q: Question, s: Scenario) => {
  const pUnion = q.pA + q.pB - q.pAB;
  const n = (v: number) => t(v);
  switch (q.kind) {
    case 'union': return {
      given: `P(A) = ${n(q.pA)},\\; P(B) = ${n(q.pB)},\\; P(A \\cap B) = ${n(q.pAB)}`,
      ask: `${s.aInf} ou ${s.bInf} (pelo menos uma das duas coisas)`, target: 'P(A \\cup B)', answer: pUnion,
      solution: [`P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = ${n(q.pA)} + ${n(q.pB)} - ${n(q.pAB)} = ${n(pUnion)}`],
    };
    case 'complement': return {
      given: `P(A) = ${n(q.pA)}`,
      ask: `não ${s.aInf}`, target: 'P(\\overline{A})', answer: 1 - q.pA,
      solution: [`P(\\overline{A}) = 1 - P(A) = 1 - ${n(q.pA)} = ${n(1 - q.pA)}`],
    };
    case 'neither': return {
      given: `P(A) = ${n(q.pA)},\\; P(B) = ${n(q.pB)},\\; P(A \\cap B) = ${n(q.pAB)}`,
      ask: `não ${s.aInf} nem ${s.bInf}`, target: 'P(\\overline{A} \\cap \\overline{B})', answer: 1 - pUnion,
      solution: [
        `P(A \\cup B) = ${n(q.pA)} + ${n(q.pB)} - ${n(q.pAB)} = ${n(pUnion)}`,
        `P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B) = 1 - ${n(pUnion)} = ${n(1 - pUnion)}`,
      ],
    };
    case 'onlyA': return {
      given: `P(A) = ${n(q.pA)},\\; P(A \\cap B) = ${n(q.pAB)}`,
      ask: `${s.aInf}, mas não ${s.bInf}`, target: 'P(A - B)', answer: q.pA - q.pAB,
      solution: [`P(A - B) = P(A) - P(A \\cap B) = ${n(q.pA)} - ${n(q.pAB)} = ${n(q.pA - q.pAB)}`],
    };
    case 'intersection': return {
      given: `P(A) = ${n(q.pA)},\\; P(B) = ${n(q.pB)},\\; P(A \\cup B) = ${n(pUnion)}`,
      ask: `${s.aInf} e ${s.bInf}`, target: 'P(A \\cap B)', answer: q.pAB,
      solution: [
        `P(A \\cup B) = P(A) + P(B) - P(A \\cap B) \\;\\Rightarrow\\; P(A \\cap B) = P(A) + P(B) - P(A \\cup B)`,
        `P(A \\cap B) = ${n(q.pA)} + ${n(q.pB)} - ${n(pUnion)} = ${n(q.pAB)}`,
      ],
    };
  }
};

// "0,35", "0.35" and "35%" all mean the same answer.
const parseAnswer = (text: string) => {
  const trimmed = text.trim();
  const percent = trimmed.endsWith('%');
  const value = parseDecimal(percent ? trimmed.slice(0, -1) : trimmed);
  return value === null ? null : (percent ? value / 100 : value);
};

const QuizPlay: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
  const [question, setQuestion] = useState<Question>(() => newQuestion());
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'right' | 'wrong' | 'invalid' | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const parts = questionParts(question, scenario);

  const check = () => {
    const value = parseAnswer(input);
    if (value === null) { setFeedback('invalid'); return; }
    const ok = Math.abs(value - parts.answer) < 0.0005;
    setFeedback(ok ? 'right' : 'wrong');
    setScore(current => ({ right: current.right + (ok ? 1 : 0), total: current.total + 1 }));
    if (ok) setShowSolution(true);
  };
  const next = () => {
    setQuestion(newQuestion(question.kind));
    setInput('');
    setFeedback(null);
    setShowSolution(false);
  };

  return (
    <PlayCard title="Teste rápido" description="Questões geradas na hora com as propriedades desta seção. Responda em decimal (0,35) ou em porcentagem (35%).">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-800">
        <p>
          Sorteia-se ao acaso um dos {scenario.noun} de {scenario.place}. Sejam <b className="text-blue-700">A</b>: “o {scenario.single} sorteado {scenario.a}” e
          {' '}<b className="text-emerald-700">B</b>: “o {scenario.single} sorteado {scenario.b}”.
        </p>
        <p className="mt-2">Sabe-se que <Tex>{parts.given}</Tex>.</p>
        <p className="mt-2 font-semibold">Qual é a probabilidade de o {scenario.single} sorteado {parts.ask}? <Tex>{`\\big(${parts.target}\\big)`}</Tex></p>
      </div>
      <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); check(); }}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Sua resposta
          <input
            value={input}
            onChange={event => { setInput(event.target.value); setFeedback(null); }}
            inputMode="decimal"
            autoComplete="off"
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <button type="submit" className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">Conferir</button>
        <ActionButton onClick={() => setShowSolution(true)}>Ver solução</ActionButton>
        <ActionButton onClick={next}>Nova questão</ActionButton>
        {score.total > 0 && <span className="ml-auto text-sm text-slate-500">Acertos: {score.right} de {score.total}</span>}
      </form>
      <div className="mt-3 space-y-3" aria-live="polite">
        {feedback === 'right' && <Callout tone="good"><b>Correto!</b> <Tex>{`${parts.target} = ${t(parts.answer)}`}</Tex></Callout>}
        {feedback === 'wrong' && <Callout tone="warn"><b>Ainda não.</b> Confira qual propriedade se aplica e tente de novo, ou veja a solução.</Callout>}
        {feedback === 'invalid' && <Callout tone="warn">Digite um número, como 0,35 ou 35%.</Callout>}
        {showSolution && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-sm font-semibold text-indigo-800">Solução</p>
            {parts.solution.map((line, i) => <Tex key={i} block>{line}</Tex>)}
          </div>
        )}
      </div>
    </PlayCard>
  );
};

/* ---------- section ---------- */

const SUMMARY: [string, string][] = [
  ['P(S) = 1', 'espaço amostral'],
  ['P(\\varnothing) = 0', 'evento impossível'],
  ['0 \\leq P(A) \\leq 1', 'limites'],
  ['P(\\overline{A}) = 1 - P(A)', 'complementar'],
  ['P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', 'união'],
  ['A \\cap B = \\varnothing \\Rightarrow P(A \\cup B) = P(A) + P(B)', 'exclusivos'],
  ['P(A - B) = P(A) - P(A \\cap B)', 'diferença'],
  ['A \\subset B \\Rightarrow P(A) \\leq P(B)', 'evento contido'],
  ['P(\\overline{A} \\cap \\overline{B}) = 1 - P(A \\cup B)', 'nenhum dos dois'],
];

const PropertiesSection: React.FC = () => {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [counts, setCounts] = useState<Counts>(() => clampCounts(SCENARIOS[0]));
  const scenario = SCENARIOS.find(item => item.id === scenarioId) ?? SCENARIOS[0];
  const chooseScenario = (id: string) => {
    const next = SCENARIOS.find(item => item.id === id) ?? SCENARIOS[0];
    setScenarioId(next.id);
    setCounts(clampCounts(next));
  };

  return (
    <div className="space-y-6">
      <TheoryCard title="Propriedades: consequências dos axiomas">
        <p>
          Os três axiomas bastam para demonstrar várias regras que facilitam as contas. As mais usadas estão no explorador abaixo, cada uma
          com o motivo de ela valer. A ideia que se repete é sempre a mesma: <b>quebrar um evento em partes disjuntas e somar</b> (axioma 3).
        </p>
      </TheoryCard>

      <Segmented label="Situação" value={scenarioId} onChange={chooseScenario} options={SCENARIOS.map(item => ({ value: item.id, label: item.label }))} />
      <ExplorerPlay scenario={scenario} counts={counts} setCounts={setCounts} />
      <QuizPlay scenario={scenario} />

      <TheoryCard title="Resumo das propriedades">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SUMMARY.map(([tex, name]) => (
            <div key={name} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Tex className="min-w-0 overflow-x-auto">{tex}</Tex>
              <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{name}</span>
            </div>
          ))}
        </div>
      </TheoryCard>
    </div>
  );
};

export default PropertiesSection;
