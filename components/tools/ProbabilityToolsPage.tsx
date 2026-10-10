import React, { useEffect, useRef, useState } from 'react';
import { Course, Lesson } from '../../types';
import { CALCULATORS, CalculatorCard, DISTRIBUTIONS, NORMAL_ID } from '../../data/probabilityDistributions';
import { BookOpenIcon, ChevronRightIcon } from '../Icons';
import DistributionCalculator from './DistributionCalculator';
import NormalCalculator from './NormalCalculator';

interface ProbabilityToolsPageProps {
  calculatorId: string | null;
  onSelectCalculator: (id: string | null) => void;
  course: Course;
  onOpenLesson: (lesson: Lesson) => void;
}

const KIND_LABEL = { discrete: 'Discreta', continuous: 'Contínua' };

const KIND_STYLES = {
  discrete: { bar: 'bg-sky-500', preview: 'text-sky-500', notation: 'text-sky-700', badge: 'border-sky-200 bg-sky-50 text-sky-700', hover: 'hover:border-sky-400' },
  continuous: { bar: 'bg-blue-600', preview: 'text-blue-600', notation: 'text-blue-700', badge: 'border-blue-200 bg-blue-50 text-blue-700', hover: 'hover:border-blue-500' },
};

export const getCalculatorName = (id: string | null) => CALCULATORS.find(card => card.id === id)?.name ?? null;

const lessonLabel = (number: number) => `Aula ${String(number).padStart(2, '0')}`;

const CalculatorCardButton: React.FC<{ card: CalculatorCard; onSelect: (id: string) => void }> = ({ card, onSelect }) => {
  const styles = KIND_STYLES[card.kind];
  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className={`group relative flex w-64 flex-none snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.hover}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} aria-hidden="true" />
      <span className={`mb-3 block rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-2 ${styles.preview}`} aria-hidden="true">
        <svg viewBox="0 0 100 50" className="block h-14 w-full">{card.preview}</svg>
      </span>
      <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
        {card.name}
        {card.tag && <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">{card.tag}</span>}
      </span>
      <span className={`mt-1 block font-mono text-sm ${styles.notation}`}>{card.notation}</span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>{KIND_LABEL[card.kind]}</span>
        {card.lessonNumbers && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            {card.lessonNumbers.map(lessonLabel).join(' e ')}
          </span>
        )}
      </span>
      <span className="mt-2 block text-sm leading-snug text-slate-600">{card.summary}</span>
    </button>
  );
};

// All calculators in one row, most used first: arrows page through it and the mouse can drag it.
const Hub: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const strip = stripRef.current;
    if (!strip) return;
    setEdges({ start: strip.scrollLeft <= 4, end: strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4 });
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, []);

  const page = (direction: 1 | -1) => {
    const strip = stripRef.current;
    if (strip) strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: 'smooth' });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !stripRef.current) return;
    drag.current = { x: event.clientX, left: stripRef.current.scrollLeft, moved: false };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    const strip = stripRef.current;
    if (!current || !strip || !(event.buttons & 1)) return;
    const dx = event.clientX - current.x;
    if (!current.moved && Math.abs(dx) > 5) {
      current.moved = true;
      // Capture only once it is a drag, so a plain click still reaches the card.
      strip.setPointerCapture(event.pointerId);
    }
    if (current.moved) strip.scrollLeft = current.left - dx;
  };

  // A drag that ends over a card must not open it.
  const handleClickCapture = (event: React.MouseEvent) => {
    if (drag.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current = null;
  };

  const arrow = (direction: 1 | -1) => {
    const hidden = direction === 1 ? edges.end : edges.start;
    return (
      <button
        type="button"
        onClick={() => page(direction)}
        aria-label={direction === 1 ? 'Ver mais calculadoras' : 'Ver calculadoras anteriores'}
        aria-hidden={hidden || undefined}
        tabIndex={hidden ? -1 : 0}
        className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:border-blue-500 hover:bg-blue-600 hover:text-white ${
          direction === 1 ? '-right-3' : '-left-3'
        } ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <ChevronRightIcon className={`h-5 w-5 ${direction === 1 ? '' : 'rotate-180'}`} />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">Calculadoras de Probabilidade</h1>
        <p className="mt-1 max-w-3xl text-[--text-secondary]">
          Coleção de calculadoras para estudantes e professores de Estatística, das distribuições mais usadas para as menos usadas. Escolha uma para calcular probabilidades e quantis, com gráfico.
        </p>
      </header>

      <section aria-label="Distribuições" className="relative">
        {arrow(-1)}
        <div
          ref={stripRef}
          onScroll={updateEdges}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClickCapture={handleClickCapture}
          className="flex cursor-grab select-none snap-x snap-proximity gap-4 overflow-x-auto px-1 pb-4 pt-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CALCULATORS.map(card => <CalculatorCardButton key={card.id} card={card} onSelect={onSelect} />)}
        </div>
        {arrow(1)}
        <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[--bg-main] to-transparent transition-opacity ${edges.start ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[--bg-main] to-transparent transition-opacity ${edges.end ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
      </section>

      <p className="border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
        Cada calculadora oferece cálculo de probabilidades e quantis (inverso), sempre com visualização didática que reage aos parâmetros. A Normal tem também z-score, intervalo de confiança, teste de hipótese, tamanho de amostra e a tabela Z.
      </p>
    </div>
  );
};

const ProbabilityToolsPage: React.FC<ProbabilityToolsPageProps> = ({ calculatorId, onSelectCalculator, course, onOpenLesson }) => {
  const card = CALCULATORS.find(item => item.id === calculatorId);
  const distribution = calculatorId ? DISTRIBUTIONS[calculatorId] : undefined;
  const isNormal = calculatorId === NORMAL_ID;

  if (!card || (!distribution && !isNormal)) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl"><Hub onSelect={onSelectCalculator} /></div>
      </div>
    );
  }

  const lessons = course.units.flatMap(unit => unit.lessons)
    .filter(lesson => lesson.number !== undefined && card.lessonNumbers?.includes(lesson.number));

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => onSelectCalculator(null)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            ← Todas as calculadoras
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Trocar distribuição
            <select
              value={card.id}
              onChange={event => onSelectCalculator(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {CALCULATORS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <header className="mb-5">
          <p className={`font-mono text-sm ${KIND_STYLES[card.kind].notation}`}>{card.notation}</p>
          <p className="mt-1 max-w-3xl text-[--text-secondary]">
            {isNormal ? 'Probabilidades, quantis, intervalos, testes — para estudar de verdade.' : distribution?.description}
          </p>
          {lessons.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              Visto no curso:
              {lessons.map(lesson => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onOpenLesson(lesson)}
                  className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  {lessonLabel(lesson.number as number)} — {lesson.title}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">Digite os números com vírgula ou ponto: 0,5 e 0.5 valem o mesmo.</p>
        </header>

        {isNormal ? <NormalCalculator /> : distribution && <DistributionCalculator key={distribution.id} distribution={distribution} />}

        <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
          {isNormal
            ? 'Cálculos com algoritmos de alta precisão (Marsaglia para Φ, Acklam + Newton para Φ⁻¹, fração contínua para t). Resultados a 10 casas decimais correspondem ao limite numérico de IEEE 754.'
            : 'Cálculos com algoritmos de alta precisão. Marsaglia (Φ), Acklam + Newton (Φ⁻¹), Lanczos (logΓ), Lentz (incompleta γ e β). Quantis discretos via busca binária na CDF.'}
        </p>
      </div>
    </div>
  );
};

export default ProbabilityToolsPage;
