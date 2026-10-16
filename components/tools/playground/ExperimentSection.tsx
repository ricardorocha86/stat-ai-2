import React, { useState } from 'react';
import { Segmented } from '../CalculatorUI';
import { ActionButton, Callout, Definition, PlayCard, SetLine, Tex, TheoryCard, ToggleChip } from './PlaygroundUI';

// Section 2: random experiments, sample spaces and events.

/* ---------- random or deterministic ---------- */

interface Situation { text: string; random: boolean; why: string }

const SITUATIONS: Situation[] = [
  { text: 'Sortear um paciente da fila do ambulatório e anotar o tipo sanguíneo dele.', random: true, why: 'Sabemos os resultados possíveis (A, B, AB, O), mas não qual será o do paciente sorteado.' },
  { text: 'Calcular as calorias de 10 g de gordura pura usando 9 kcal por grama.', random: false, why: 'A conta sempre dá 90 kcal: não há incerteza no resultado.' },
  { text: 'Medir a glicemia de jejum de um voluntário escolhido ao acaso.', random: true, why: 'O valor varia de pessoa para pessoa, e não dá para saber antes qual será.' },
  { text: 'Calcular o IMC de uma pessoa com 70 kg e 1,75 m de altura.', random: false, why: 'Com o peso e a altura dados, o IMC é sempre 70 ÷ 1,75² ≈ 22,9 kg/m².' },
  { text: 'Contar quantos dos próximos 20 pacientes chegam com excesso de peso.', random: true, why: 'Pode dar qualquer número de 0 a 20, e só saberemos depois de observar.' },
  { text: 'Lançar um dado e observar a face voltada para cima.', random: true, why: 'Os resultados possíveis são 1 a 6, mas não sabemos qual sairá.' },
  { text: 'Aquecer água pura ao nível do mar e anotar a temperatura em que ela ferve.', random: false, why: 'Nessas condições a água ferve sempre a 100 °C.' },
];

const ClassifyPlay: React.FC = () => {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => SITUATIONS.map(() => null));
  const answered = answers.filter(answer => answer !== null).length;
  const right = answers.filter((answer, i) => answer !== null && answer === SITUATIONS[i].random).length;

  return (
    <PlayCard title="Aleatório ou determinístico?" description="Classifique cada situação. Depois de responder, aparece a explicação.">
      <ol className="space-y-3">
        {SITUATIONS.map((situation, i) => {
          const answer = answers[i];
          const done = answer !== null;
          const ok = answer === situation.random;
          const choose = (value: boolean) => setAnswers(current => current.map((item, j) => (j === i ? value : item)));
          return (
            <li key={i} className={`rounded-xl border p-3 ${done ? (ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-[15px] text-slate-800"><span className="mr-1 font-semibold text-slate-400">{i + 1}.</span>{situation.text}</p>
                <div className="flex gap-2">
                  {[true, false].map(value => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => choose(value)}
                      aria-pressed={answer === value}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                        answer === value ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {value ? 'Aleatório' : 'Determinístico'}
                    </button>
                  ))}
                </div>
              </div>
              {done && (
                <p className={`mt-2 text-sm ${ok ? 'text-green-800' : 'text-red-800'}`} aria-live="polite">
                  <b>{ok ? 'Certo! ' : 'Não é bem assim. '}</b>
                  É {situation.random ? 'aleatório' : 'determinístico'}: {situation.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-600">Acertos: <b>{right}</b> de {answered} respondidas ({SITUATIONS.length} no total)</p>
        <ActionButton onClick={() => setAnswers(SITUATIONS.map(() => null))}>Recomeçar</ActionButton>
      </div>
    </PlayCard>
  );
};

/* ---------- build an event ---------- */

type ExperimentId = 'die' | 'coins' | 'nutrition';
interface Experiment {
  label: string;
  description: string;
  outcomes: string[];
  // Relative chances used when the experiment is run.
  weights: number[];
  presets: { label: string; event: string[] }[];
  note?: string;
}

const EXPERIMENTS: Record<ExperimentId, Experiment> = {
  die: {
    label: 'Lançar um dado',
    description: 'Lançar um dado comum e observar a face de cima.',
    outcomes: ['1', '2', '3', '4', '5', '6'],
    weights: [1, 1, 1, 1, 1, 1],
    presets: [
      { label: 'Sair número par', event: ['2', '4', '6'] },
      { label: 'Sair maior que 4', event: ['5', '6'] },
      { label: 'Sair 3', event: ['3'] },
      { label: 'Sair 7', event: [] },
      { label: 'Sair de 1 a 6', event: ['1', '2', '3', '4', '5', '6'] },
    ],
  },
  coins: {
    label: 'Lançar duas moedas',
    description: 'Lançar uma moeda duas vezes e anotar as faces em ordem (CA = cara, CO = coroa).',
    outcomes: ['CACA', 'CACO', 'COCA', 'COCO'],
    weights: [1, 1, 1, 1],
    presets: [
      { label: 'Faces iguais', event: ['CACA', 'COCO'] },
      { label: 'Pelo menos uma cara', event: ['CACA', 'CACO', 'COCA'] },
      { label: 'Cara e depois coroa', event: ['CACO'] },
      { label: 'Três caras', event: [] },
    ],
  },
  nutrition: {
    label: 'Estado nutricional',
    description: 'Sortear um adulto e classificar o estado nutricional pelo IMC.',
    outcomes: ['Baixo peso', 'Eutrofia', 'Sobrepeso', 'Obesidade'],
    weights: [3, 36, 37, 24],
    presets: [
      { label: 'Excesso de peso', event: ['Sobrepeso', 'Obesidade'] },
      { label: 'Eutrofia', event: ['Eutrofia'] },
      { label: 'Não ter obesidade', event: ['Baixo peso', 'Eutrofia', 'Sobrepeso'] },
    ],
    note: 'Aqui os quatro resultados não são igualmente prováveis: o sorteio usa proporções ilustrativas, parecidas com as de adultos brasileiros (3%, 36%, 37% e 24%).',
  },
};

const drawOutcome = (experiment: Experiment) => {
  const total = experiment.weights.reduce((sum, w) => sum + w, 0);
  let u = Math.random() * total;
  for (let i = 0; i < experiment.outcomes.length; i++) {
    u -= experiment.weights[i];
    if (u < 0) return experiment.outcomes[i];
  }
  return experiment.outcomes[experiment.outcomes.length - 1];
};

const EVENT_KINDS = {
  impossible: { label: 'Evento impossível', tone: 'border-red-300 bg-red-50 text-red-800', text: 'Não tem nenhum resultado: E = ∅. Ele nunca ocorre.' },
  simple: { label: 'Evento simples', tone: 'border-sky-300 bg-sky-50 text-sky-800', text: 'Tem exatamente um resultado do espaço amostral.' },
  compound: { label: 'Evento composto', tone: 'border-indigo-300 bg-indigo-50 text-indigo-800', text: 'Tem dois ou mais resultados.' },
  sure: { label: 'Evento certo', tone: 'border-green-300 bg-green-50 text-green-800', text: 'Tem todos os resultados: E = S. Ele sempre ocorre.' },
};

const EventPlay: React.FC = () => {
  const [experimentId, setExperimentId] = useState<ExperimentId>('die');
  const [event, setEvent] = useState<Set<string>>(() => new Set(['2', '4', '6']));
  const [last, setLast] = useState<string | null>(null);
  const [tally, setTally] = useState({ runs: 0, hits: 0 });

  const experiment = EXPERIMENTS[experimentId];
  const resetRuns = () => { setLast(null); setTally({ runs: 0, hits: 0 }); };
  const chooseExperiment = (id: ExperimentId) => {
    setExperimentId(id);
    setEvent(new Set(EXPERIMENTS[id].presets[0].event));
    resetRuns();
  };
  const setEventTo = (outcomes: string[]) => { setEvent(new Set(outcomes)); resetRuns(); };
  const toggle = (outcome: string) => {
    const next = new Set(event);
    if (next.has(outcome)) next.delete(outcome); else next.add(outcome);
    setEvent(next);
    resetRuns();
  };
  const run = (times: number) => {
    let hits = 0, outcome = '';
    for (let i = 0; i < times; i++) {
      outcome = drawOutcome(experiment);
      if (event.has(outcome)) hits++;
    }
    setLast(outcome);
    setTally(current => ({ runs: current.runs + times, hits: current.hits + hits }));
  };

  const inEvent = experiment.outcomes.filter(outcome => event.has(outcome));
  const outside = experiment.outcomes.filter(outcome => !event.has(outcome));
  const kind = inEvent.length === 0 ? 'impossible' : inEvent.length === experiment.outcomes.length ? 'sure' : inEvent.length === 1 ? 'simple' : 'compound';
  const occurred = last !== null && event.has(last);

  return (
    <PlayCard title="Monte um evento" description="Escolha um experimento e clique nos resultados para colocá-los no evento E (ou use um dos exemplos prontos). Depois, realize o experimento e veja se E ocorreu.">
      <Segmented label="Experimento" value={experimentId} onChange={chooseExperiment} options={[
        { value: 'die', label: EXPERIMENTS.die.label },
        { value: 'coins', label: EXPERIMENTS.coins.label },
        { value: 'nutrition', label: EXPERIMENTS.nutrition.label },
      ]} />
      <p className="mb-3 text-sm text-slate-600">{experiment.description}</p>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Espaço amostral S — clique para montar o evento E</p>
        <div className="flex flex-wrap gap-2">
          {experiment.outcomes.map(outcome => (
            <ToggleChip key={outcome} size="lg" active={event.has(outcome)} onClick={() => toggle(outcome)} ariaLabel={`${outcome}${event.has(outcome) ? ', no evento' : ''}`}>
              <span className={last === outcome ? 'underline decoration-4 underline-offset-4' : ''}>{outcome}</span>
            </ToggleChip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Exemplos:</span>
          {experiment.presets.map(preset => (
            <button key={preset.label} type="button" onClick={() => setEventTo(preset.event)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:border-blue-400 hover:text-blue-700">
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="space-y-2" aria-live="polite">
          <SetLine name="S" elements={experiment.outcomes} />
          <SetLine name="E" elements={inEvent} />
          <SetLine name="\overline{E}" elements={outside} />
          <p className="text-sm text-slate-600"><Tex>{`n(E) = ${inEvent.length}`}</Tex> resultado{inEvent.length === 1 ? '' : 's'} de <Tex>{`n(S) = ${experiment.outcomes.length}`}</Tex></p>
          <div className={`rounded-xl border px-4 py-3 ${EVENT_KINDS[kind].tone}`}>
            <p className="font-bold">{EVENT_KINDS[kind].label}</p>
            <p className="text-sm">{EVENT_KINDS[kind].text}</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="primary" onClick={() => run(1)}>Realizar o experimento</ActionButton>
            <ActionButton onClick={() => run(10)}>Realizar 10 vezes</ActionButton>
          </div>
          <div className="mt-3 min-h-[4.5rem]" aria-live="polite">
            {last === null ? (
              <p className="text-sm text-slate-600">O evento <b>ocorre</b> quando o resultado observado pertence a ele.</p>
            ) : (
              <>
                <p className="text-lg text-slate-800">
                  {tally.runs > 1 ? 'Último resultado' : 'Resultado'}: <b className="font-mono">{last}</b>
                </p>
                <p className={`font-semibold ${occurred ? 'text-green-700' : 'text-red-700'}`}>
                  {last} {occurred ? '∈' : '∉'} E, então o evento E {occurred ? 'ocorreu' : 'não ocorreu'}.
                </p>
              </>
            )}
          </div>
          {tally.runs > 0 && (
            <p className="mt-2 border-t border-amber-200 pt-2 text-sm text-slate-700">
              Em {tally.runs} realizaç{tally.runs === 1 ? 'ão' : 'ões'}, E ocorreu <b>{tally.hits}</b> {tally.hits === 1 ? 'vez' : 'vezes'}.
            </p>
          )}
        </div>
      </div>
      {experiment.note && <div className="mt-4"><Callout tone="warn">{experiment.note}</Callout></div>}
    </PlayCard>
  );
};

/* ---------- section ---------- */

const DICTIONARY: [string, string, string][] = [
  ['A \\cup B', 'União', 'ocorre A ou ocorre B (pelo menos um deles)'],
  ['A \\cap B', 'Interseção', 'ocorrem A e B ao mesmo tempo'],
  ['\\overline{A}', 'Complementar', 'A não ocorre'],
  ['A - B', 'Diferença', 'ocorre A, mas B não ocorre'],
  ['A \\cap B = \\varnothing', 'Disjuntos', 'A e B são mutuamente exclusivos: não podem ocorrer juntos'],
  ['A \\subset B', 'Subconjunto', 'se A ocorre, então B também ocorre'],
  ['S', 'Universo', 'evento certo: sempre ocorre'],
  ['\\varnothing', 'Vazio', 'evento impossível: nunca ocorre'],
];

const ExperimentSection: React.FC = () => (
  <div className="space-y-6">
    <TheoryCard title="Experimento aleatório">
      <p>
        Um <b>experimento</b> é qualquer processo de observação ou medida. Ele é <b>aleatório</b> quando, mesmo repetido nas mesmas condições,
        pode dar resultados diferentes. Ele tem três características:
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li>pode ser <b>repetido</b> quantas vezes quisermos, nas mesmas condições;</li>
        <li>conhecemos <b>todos os resultados possíveis</b> antes de realizá-lo;</li>
        <li>não sabemos <b>qual</b> resultado vai ocorrer em uma realização específica.</li>
      </ul>
      <p>
        Já um experimento <b>determinístico</b> dá sempre o mesmo resultado nas mesmas condições: calcular o valor energético de 10 g de
        carboidrato (4 kcal/g) dá sempre 40 kcal.
      </p>
    </TheoryCard>

    <ClassifyPlay />

    <TheoryCard title="Espaço amostral e eventos">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Definition term={<>Espaço amostral <Tex>S</Tex></>}>
          O conjunto de <b>todos</b> os resultados possíveis do experimento. No lançamento de um dado, <Tex>{'S = \\{1, 2, 3, 4, 5, 6\\}'}</Tex>.
          Em alguns livros ele é chamado de <Tex>{'\\Omega'}</Tex> (ômega).
        </Definition>
        <Definition term="Evento">
          Qualquer <b>subconjunto</b> do espaço amostral, geralmente indicado por letras maiúsculas (<Tex>{'A, B, E, \\dots'}</Tex>).
          “Sair número par” é o evento <Tex>{'A = \\{2, 4, 6\\}'}</Tex>. Dizemos que <b>o evento ocorreu</b> quando o resultado observado pertence a ele.
        </Definition>
      </div>
      <p>Os eventos recebem nomes conforme a quantidade de resultados que contêm:</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.values(EVENT_KINDS).map(kind => (
          <div key={kind.label} className={`rounded-xl border px-3 py-2 text-sm ${kind.tone}`}>
            <p className="font-bold">{kind.label}</p>
            <p>{kind.text}</p>
          </div>
        ))}
      </div>
    </TheoryCard>

    <EventPlay />

    <TheoryCard title="Eventos são conjuntos">
      <p>
        Como eventos são subconjuntos de <Tex>S</Tex>, as operações da seção de conjuntos viram frases sobre o experimento. Com o dado,
        se <Tex>{'A = \\{2, 4, 6\\}'}</Tex> (par) e <Tex>{'B = \\{4, 5, 6\\}'}</Tex> (maior que 3), então <Tex>{'A \\cap B = \\{4, 6\\}'}</Tex> é “sair par
        e maior que 3”.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b-2 border-slate-200 text-sm text-slate-500">
              <th className="py-2 pr-3 font-semibold">Conjuntos</th>
              <th className="py-2 pr-3 font-semibold">Nome</th>
              <th className="py-2 font-semibold">Linguagem de eventos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DICTIONARY.map(([tex, name, text]) => (
              <tr key={tex}>
                <td className="py-2 pr-3"><Tex>{tex}</Tex></td>
                <td className="py-2 pr-3 font-semibold text-slate-700">{name}</td>
                <td className="py-2">{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TheoryCard>
  </div>
);

export default ExperimentSection;
