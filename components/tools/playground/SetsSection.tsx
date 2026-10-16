import React, { useState } from 'react';
import { Segmented } from '../CalculatorUI';
import { ActionButton, Callout, Definition, PlayCard, Region, REGION_BIT, REGION_LABEL, RegionButtons, REGIONS, SetLine, Tex, TheoryCard, VennDiagram, inMask } from './PlaygroundUI';

// Section 1: sets, the operations between them and De Morgan's laws, on a Venn diagram.

interface SetElement { name: string; inA: boolean; inB: boolean }

type ContextId = 'foods' | 'dice';
interface SetContext {
  id: ContextId;
  label: string;
  noun: string;
  universe: string;
  aName: string;
  bName: string;
  // Predicates that finish "Alimentos que ...".
  a: string;
  b: string;
  notA: string;
  notB: string;
  elements: SetElement[];
}

const CONTEXTS: Record<ContextId, SetContext> = {
  foods: {
    id: 'foods',
    label: 'Cardápio',
    noun: 'Alimentos',
    universe: 'os 12 alimentos do cardápio',
    aName: 'alimentos fonte de proteína',
    bName: 'alimentos de origem vegetal',
    a: 'são fonte de proteína',
    b: 'são de origem vegetal',
    notA: 'não são fonte de proteína',
    notB: 'não são de origem vegetal',
    elements: [
      { name: 'Feijão', inA: true, inB: true },
      { name: 'Lentilha', inA: true, inB: true },
      { name: 'Tofu', inA: true, inB: true },
      { name: 'Frango', inA: true, inB: false },
      { name: 'Ovo', inA: true, inB: false },
      { name: 'Peixe', inA: true, inB: false },
      { name: 'Arroz', inA: false, inB: true },
      { name: 'Maçã', inA: false, inB: true },
      { name: 'Banana', inA: false, inB: true },
      { name: 'Cenoura', inA: false, inB: true },
      { name: 'Manteiga', inA: false, inB: false },
      { name: 'Mel', inA: false, inB: false },
    ],
  },
  dice: {
    id: 'dice',
    label: 'Dado',
    noun: 'Números',
    universe: 'as 6 faces de um dado',
    aName: 'números pares',
    bName: 'números maiores que 3',
    a: 'são pares',
    b: 'são maiores que 3',
    notA: 'não são pares',
    notB: 'não são maiores que 3',
    elements: [1, 2, 3, 4, 5, 6].map(face => ({ name: String(face), inA: face % 2 === 0, inB: face > 3 })),
  },
};

const regionOf = (element: SetElement): Region => element.inA ? (element.inB ? 'ab' : 'a') : (element.inB ? 'b' : 'n');

const itemsByRegion = (context: SetContext) => {
  const items: Record<Region, string[]> = { a: [], ab: [], b: [], n: [] };
  context.elements.forEach(element => items[regionOf(element)].push(element.name));
  return items;
};

const elementsIn = (context: SetContext, mask: number) =>
  context.elements.filter(element => inMask(mask, regionOf(element))).map(element => element.name);

interface Operation {
  id: string;
  tex: string;
  mask: number;
  name: string;
  keyword?: string;
  reading: (context: SetContext) => string;
}

const OPERATIONS: Operation[] = [
  { id: 'A', tex: 'A', mask: 3, name: 'Conjunto A', reading: c => `${c.noun} que ${c.a}.` },
  { id: 'B', tex: 'B', mask: 6, name: 'Conjunto B', reading: c => `${c.noun} que ${c.b}.` },
  { id: 'union', tex: 'A \\cup B', mask: 7, name: 'União', keyword: 'ou', reading: c => `${c.noun} que ${c.a} ou ${c.b} (ou as duas coisas).` },
  { id: 'inter', tex: 'A \\cap B', mask: 2, name: 'Interseção', keyword: 'e', reading: c => `${c.noun} que ${c.a} e também ${c.b}.` },
  { id: 'compA', tex: '\\overline{A}', mask: 12, name: 'Complementar de A', keyword: 'não', reading: c => `${c.noun} que ${c.notA}.` },
  { id: 'compB', tex: '\\overline{B}', mask: 9, name: 'Complementar de B', keyword: 'não', reading: c => `${c.noun} que ${c.notB}.` },
  { id: 'diffAB', tex: 'A - B', mask: 1, name: 'Diferença', keyword: 'mas não', reading: c => `${c.noun} que ${c.a}, mas ${c.notB}.` },
  { id: 'diffBA', tex: 'B - A', mask: 4, name: 'Diferença', keyword: 'mas não', reading: c => `${c.noun} que ${c.b}, mas ${c.notA}.` },
  { id: 'neither', tex: '\\overline{A \\cup B}', mask: 8, name: 'Nem A nem B', keyword: 'nem… nem', reading: c => `${c.noun} que ${c.notA} e ${c.notB}.` },
];

// Every way of painting the four regions, with the usual name of the set it gives.
const REGION_NAMES: Record<number, { tex: string; text: string }> = {
  0: { tex: '\\varnothing', text: 'nenhuma região: o conjunto vazio' },
  1: { tex: 'A - B = A \\cap \\overline{B}', text: 'está em A, mas não em B' },
  2: { tex: 'A \\cap B', text: 'está em A e em B ao mesmo tempo' },
  3: { tex: 'A', text: 'está em A (estando ou não em B)' },
  4: { tex: 'B - A = \\overline{A} \\cap B', text: 'está em B, mas não em A' },
  5: { tex: '(A - B) \\cup (B - A)', text: 'está em exatamente um dos dois' },
  6: { tex: 'B', text: 'está em B (estando ou não em A)' },
  7: { tex: 'A \\cup B', text: 'está em pelo menos um dos dois' },
  8: { tex: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}', text: 'não está em A nem em B' },
  9: { tex: '\\overline{B}', text: 'não está em B' },
  10: { tex: '(A \\cap B) \\cup (\\overline{A} \\cap \\overline{B})', text: 'está nos dois ou em nenhum' },
  11: { tex: 'A \\cup \\overline{B}', text: 'está em A ou não está em B' },
  12: { tex: '\\overline{A}', text: 'não está em A' },
  13: { tex: '\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}', text: 'não está nos dois ao mesmo tempo' },
  14: { tex: '\\overline{A} \\cup B', text: 'não está em A ou está em B' },
  15: { tex: 'S', text: 'todas as regiões: o conjunto universo' },
};

const CHALLENGES: { tex: string; mask: number }[] = [
  { tex: 'A \\cup B', mask: 7 },
  { tex: 'A \\cap B', mask: 2 },
  { tex: '\\overline{A}', mask: 12 },
  { tex: '\\overline{B}', mask: 9 },
  { tex: 'A - B', mask: 1 },
  { tex: 'B - A', mask: 4 },
  { tex: 'A \\cap \\overline{B}', mask: 1 },
  { tex: '\\overline{A} \\cap B', mask: 4 },
  { tex: '\\overline{A \\cup B}', mask: 8 },
  { tex: '\\overline{A} \\cap \\overline{B}', mask: 8 },
  { tex: '\\overline{A \\cap B}', mask: 13 },
  { tex: '\\overline{A} \\cup B', mask: 14 },
  { tex: 'A \\cup \\overline{B}', mask: 11 },
  { tex: '(A - B) \\cup (B - A)', mask: 5 },
  { tex: '(A \\cap B) \\cup \\overline{A \\cup B}', mask: 10 },
];

const ContextLegend: React.FC<{ context: SetContext }> = ({ context }) => (
  <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><b className="text-slate-700">S</b> = {context.universe}</p>
    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"><b className="text-blue-700">A</b> = {context.aName}</p>
    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"><b className="text-emerald-700">B</b> = {context.bName}</p>
  </div>
);

/* ---------- operations on the diagram ---------- */

const OperationsPlay: React.FC = () => {
  const [contextId, setContextId] = useState<ContextId>('foods');
  const [operationId, setOperationId] = useState('union');
  const context = CONTEXTS[contextId];
  const operation = OPERATIONS.find(item => item.id === operationId) ?? OPERATIONS[0];
  const result = elementsIn(context, operation.mask);

  return (
    <PlayCard title="Operações no diagrama de Venn" description="Escolha uma operação: a região correspondente é pintada e os elementos que pertencem a ela ficam em destaque.">
      <Segmented label="Exemplo" value={contextId} onChange={setContextId} options={[
        { value: 'foods', label: 'Cardápio (alimentos)' },
        { value: 'dice', label: 'Lançamento de um dado' },
      ]} />
      <ContextLegend context={context} />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Operação">
        {OPERATIONS.map(item => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === operation.id}
            onClick={() => setOperationId(item.id)}
            className={`flex min-w-[5.5rem] flex-col items-center rounded-xl border-2 px-3 py-2 transition ${
              item.id === operation.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <Tex className="text-lg text-slate-900">{item.tex}</Tex>
            <span className="mt-0.5 text-[11px] font-semibold text-slate-500">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <VennDiagram ariaLabel={`Diagrama de Venn com ${operation.name} pintada`} highlighted={operation.mask} items={itemsByRegion(context)} />
        </div>
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <SetLine name={operation.tex} elements={result} />
            <p className="mt-2 text-sm text-slate-600">
              <Tex>{`n(${operation.tex}) = ${result.length}`}</Tex> de <Tex>{`n(S) = ${context.elements.length}`}</Tex> elementos
            </p>
          </div>
          <p className="text-[15px] italic text-slate-700">{operation.reading(context)}</p>
          {operation.keyword && (
            <p className="text-sm text-slate-600">
              Palavra-chave: <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-semibold text-white">{operation.keyword}</span>
            </p>
          )}
          {operation.id === 'inter' && result.length > 0 && (
            <Callout>Como <Tex>{'A \\cap B \\neq \\varnothing'}</Tex>, os conjuntos <b>não são disjuntos</b>: há elementos que estão nos dois.</Callout>
          )}
          {(operation.id === 'compA' || operation.id === 'compB') && (
            <Callout>O complementar depende do universo: é tudo o que está em <Tex>S</Tex> e fica de fora do conjunto.</Callout>
          )}
        </div>
      </div>
    </PlayCard>
  );
};

/* ---------- painting regions ---------- */

const randomChallenge = (current: number) => {
  let next = current;
  while (next === current) next = Math.floor(Math.random() * CHALLENGES.length);
  return next;
};

const PaintPlay: React.FC = () => {
  const [mode, setMode] = useState<'free' | 'challenge'>('free');
  const [mask, setMask] = useState(0);
  const [challenge, setChallenge] = useState(0);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const toggle = (region: Region) => {
    setMask(current => current ^ REGION_BIT[region]);
    setChecked(false);
  };
  const target = CHALLENGES[challenge];
  const correct = mask === target.mask;
  const missing = REGIONS.filter(region => inMask(target.mask, region) && !inMask(mask, region));
  const extra = REGIONS.filter(region => !inMask(target.mask, region) && inMask(mask, region));

  const check = () => {
    if (!checked) setScore(current => ({ right: current.right + (correct ? 1 : 0), total: current.total + 1 }));
    setChecked(true);
  };
  const nextChallenge = () => {
    setChallenge(randomChallenge(challenge));
    setMask(0);
    setChecked(false);
  };

  const named = REGION_NAMES[mask];

  return (
    <PlayCard title="Pinte as regiões" description="Clique nas regiões do diagrama (ou nos botões abaixo dele) para pintá-las. No modo livre, o playground diz qual conjunto você pintou; no desafio, você pinta o conjunto pedido.">
      <Segmented label="Modo" value={mode} onChange={next => { setMode(next); setMask(0); setChecked(false); }} options={[
        { value: 'free', label: 'Modo livre' },
        { value: 'challenge', label: 'Desafio' },
      ]} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
            <VennDiagram ariaLabel="Diagrama de Venn para pintar" highlighted={mask} onToggleRegion={toggle} />
          </div>
          <RegionButtons mask={mask} onToggle={toggle} />
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton onClick={() => { setMask(0); setChecked(false); }}>Limpar</ActionButton>
            <ActionButton onClick={() => { setMask(15); setChecked(false); }}>Pintar tudo</ActionButton>
          </div>
        </div>

        <div className="space-y-3" aria-live="polite">
          {mode === 'free' ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Você pintou</p>
              <Tex block className="text-xl">{named.tex}</Tex>
              <p className="text-[15px] text-slate-700">Quem {named.text}.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-700">Pinte o conjunto</p>
                <Tex block className="text-2xl">{target.tex}</Tex>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton variant="primary" onClick={check}>Conferir</ActionButton>
                <ActionButton onClick={() => { setMask(target.mask); setChecked(true); }}>Ver resposta</ActionButton>
                <ActionButton onClick={nextChallenge}>Novo desafio</ActionButton>
              </div>
              {checked && (correct ? (
                <Callout tone="good"><b>Isso mesmo!</b> <Tex>{`${target.tex} = ${REGION_NAMES[target.mask].tex}`}</Tex>: quem {REGION_NAMES[target.mask].text}.</Callout>
              ) : (
                <Callout tone="warn">
                  <b>Ainda não.</b>
                  {missing.length > 0 && <> Faltou pintar: {missing.map(region => REGION_LABEL[region]).join(', ')}.</>}
                  {extra.length > 0 && <> Pintou a mais: {extra.map(region => REGION_LABEL[region]).join(', ')}.</>}
                </Callout>
              ))}
              {score.total > 0 && <p className="text-sm text-slate-500">Acertos: {score.right} de {score.total}</p>}
            </>
          )}
        </div>
      </div>
    </PlayCard>
  );
};

/* ---------- De Morgan ---------- */

const MiniVenn: React.FC<{ mask: number; tex: string }> = ({ mask, tex }) => (
  <figure className="flex min-w-0 flex-col items-center">
    <div className="w-full rounded-lg border border-slate-200 bg-white p-1">
      <VennDiagram ariaLabel={`Região ${tex}`} highlighted={mask} compact />
    </div>
    <figcaption className="mt-1 text-center"><Tex>{tex}</Tex></figcaption>
  </figure>
);

const Operator: React.FC<{ children: string }> = ({ children }) => (
  <div className="flex items-center justify-center pb-6 text-2xl text-slate-500"><Tex>{children}</Tex></div>
);

const DE_MORGAN = {
  union: {
    law: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}',
    left: [{ mask: 7, tex: 'A \\cup B' }, { mask: 8, tex: '\\overline{A \\cup B}' }],
    right: [{ mask: 12, tex: '\\overline{A}' }, { mask: 9, tex: '\\overline{B}' }, { mask: 8, tex: '\\overline{A} \\cap \\overline{B}' }],
    rightOperator: '\\cap',
    reading: 'Não ser (fonte de proteína ou de origem vegetal) é o mesmo que não ser fonte de proteína e também não ser de origem vegetal: no cardápio, Manteiga e Mel.',
  },
  intersection: {
    law: '\\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}',
    left: [{ mask: 2, tex: 'A \\cap B' }, { mask: 13, tex: '\\overline{A \\cap B}' }],
    right: [{ mask: 12, tex: '\\overline{A}' }, { mask: 9, tex: '\\overline{B}' }, { mask: 13, tex: '\\overline{A} \\cup \\overline{B}' }],
    rightOperator: '\\cup',
    reading: 'Não ser (fonte de proteína e de origem vegetal ao mesmo tempo) é o mesmo que deixar de ter pelo menos uma das duas características: todo o cardápio, menos Feijão, Lentilha e Tofu.',
  },
};

const DeMorganPlay: React.FC = () => {
  const [law, setLaw] = useState<keyof typeof DE_MORGAN>('union');
  const current = DE_MORGAN[law];
  return (
    <PlayCard title="Leis de De Morgan, passo a passo" description="Os dois lados da lei pintam exatamente a mesma região.">
      <Segmented label="Lei" value={law} onChange={setLaw} options={[
        { value: 'union', label: 'Complementar da união' },
        { value: 'intersection', label: 'Complementar da interseção' },
      ]} />
      <Tex block className="mb-3 text-xl">{current.law}</Tex>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">Lado esquerdo: primeiro a operação, depois o complementar</p>
          <div className="grid grid-cols-[1fr_2rem_1fr_2rem_1fr] gap-2">
            <MiniVenn {...current.left[0]} />
            <Operator>{'\\rightarrow'}</Operator>
            <MiniVenn {...current.left[1]} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">Lado direito: primeiro os complementares, depois a operação trocada</p>
          <div className="grid grid-cols-[1fr_2rem_1fr_2rem_1fr] gap-2">
            <MiniVenn {...current.right[0]} />
            <Operator>{current.rightOperator}</Operator>
            <MiniVenn {...current.right[1]} />
            <Operator>=</Operator>
            <MiniVenn {...current.right[2]} />
          </div>
        </div>
      </div>
      <div className="mt-4"><Callout tone="good">{current.reading}</Callout></div>
    </PlayCard>
  );
};

/* ---------- section ---------- */

const SetsSection: React.FC = () => (
  <div className="space-y-6">
    <TheoryCard title="Conjuntos: a linguagem da probabilidade">
      <p>
        Um <b>conjunto</b> é uma coleção de objetos, chamados <b>elementos</b>. Na probabilidade, os conjuntos reúnem os resultados possíveis de um
        experimento, por isso as operações com conjuntos vão aparecer o tempo todo.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Definition term={<>Pertinência: <Tex>{'x \\in A'}</Tex> ou <Tex>{'x \\notin A'}</Tex></>}>
          Indica se um elemento pertence ou não ao conjunto. Se <Tex>A</Tex> é o conjunto dos alimentos fonte de proteína, então Feijão <Tex>{'\\in A'}</Tex> e Maçã <Tex>{'\\notin A'}</Tex>.
        </Definition>
        <Definition term={<>Conjunto universo <Tex>S</Tex></>}>
          Contém todos os elementos considerados no problema, por exemplo os 12 alimentos de um cardápio. Em probabilidade ele é o <b>espaço amostral</b>.
        </Definition>
        <Definition term={<>Conjunto vazio <Tex>{'\\varnothing'}</Tex></>}>
          O conjunto sem nenhum elemento, também escrito <Tex>{'\\{\\,\\}'}</Tex>. Exemplo: os alimentos do cardápio que são de origem vegetal e têm colesterol.
        </Definition>
        <Definition term={<>Subconjunto <Tex>{'A \\subset B'}</Tex></>}>
          Todo elemento de <Tex>A</Tex> também é elemento de <Tex>B</Tex>. Exemplo: <Tex>{'\\{\\text{Feijão}, \\text{Lentilha}\\} \\subset A'}</Tex>. O número de elementos de <Tex>A</Tex> é escrito <Tex>{'n(A)'}</Tex>.
        </Definition>
      </div>
    </TheoryCard>

    <TheoryCard title="Operações entre conjuntos">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-500">
              <th className="py-2 pr-3 font-semibold">Operação</th>
              <th className="py-2 pr-3 font-semibold">Notação</th>
              <th className="py-2 pr-3 font-semibold">Quem está nela</th>
              <th className="py-2 font-semibold">Palavra-chave</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[15px]">
            <tr><td className="py-2 pr-3 font-semibold">União</td><td className="pr-3"><Tex>{'A \\cup B'}</Tex></td><td className="pr-3">quem está em <Tex>A</Tex> ou em <Tex>B</Tex> (ou nos dois)</td><td>“ou”</td></tr>
            <tr><td className="py-2 pr-3 font-semibold">Interseção</td><td className="pr-3"><Tex>{'A \\cap B'}</Tex></td><td className="pr-3">quem está em <Tex>A</Tex> e em <Tex>B</Tex> ao mesmo tempo</td><td>“e”</td></tr>
            <tr><td className="py-2 pr-3 font-semibold">Complementar</td><td className="pr-3"><Tex>{'\\overline{A}'}</Tex></td><td className="pr-3">quem está em <Tex>S</Tex>, mas não em <Tex>A</Tex></td><td>“não”</td></tr>
            <tr><td className="py-2 pr-3 font-semibold">Diferença</td><td className="pr-3"><Tex>{'A - B'}</Tex></td><td className="pr-3">quem está em <Tex>A</Tex>, mas não em <Tex>B</Tex></td><td>“mas não”</td></tr>
          </tbody>
        </table>
      </div>
      <Tex block>{'A \\cup B = \\{x : x \\in A \\text{ ou } x \\in B\\} \\qquad A \\cap B = \\{x : x \\in A \\text{ e } x \\in B\\}'}</Tex>
      <p>
        O complementar também aparece como <Tex>{'A^c'}</Tex> ou <Tex>{"A'"}</Tex>. Repare que <Tex>{'A - B = A \\cap \\overline{B}'}</Tex>.
        Quando <Tex>{'A \\cap B = \\varnothing'}</Tex>, os conjuntos não têm elementos em comum e são chamados <b>disjuntos</b>.
      </p>
    </TheoryCard>

    <OperationsPlay />
    <PaintPlay />

    <TheoryCard title="Leis de De Morgan">
      <p>O complementar de uma união é a interseção dos complementares, e o complementar de uma interseção é a união dos complementares:</p>
      <Tex block className="text-lg">{'\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B} \\qquad\\qquad \\overline{A \\cap B} = \\overline{A} \\cup \\overline{B}'}</Tex>
      <p>Em palavras: ao “negar” uma frase com <b>ou</b>, ela vira uma frase com <b>e</b>, e vice-versa. Essas leis serão úteis para calcular probabilidades de “nenhum dos dois”.</p>
    </TheoryCard>

    <DeMorganPlay />
  </div>
);

export default SetsSection;
