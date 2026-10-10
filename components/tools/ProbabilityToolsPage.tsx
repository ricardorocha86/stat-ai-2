import React from 'react';
import { Course, Lesson } from '../../types';
import { CALCULATORS, CalculatorCard, DISTRIBUTIONS, NORMAL_ID } from '../../data/probabilityDistributions';
import { BookOpenIcon } from '../Icons';
import DistributionCalculator from './DistributionCalculator';
import NormalCalculator from './NormalCalculator';

interface ProbabilityToolsPageProps {
  calculatorId: string | null;
  onSelectCalculator: (id: string | null) => void;
  course: Course;
  onOpenLesson: (lesson: Lesson) => void;
}

const GROUPS: { kind: CalculatorCard['kind']; title: string; description: React.ReactNode }[] = [
  {
    kind: 'discrete',
    title: 'Discretas',
    description: <>Variáveis aleatórias que assumem valores em um conjunto enumerável — usam função <b>massa</b> e a probabilidade é a soma dos pontos.</>,
  },
  {
    kind: 'continuous',
    title: 'Contínuas',
    description: <>Variáveis aleatórias que assumem valores em um intervalo de números reais — usam função <b>densidade</b> e a probabilidade é a área sob a curva.</>,
  },
];

const KIND_STYLES = {
  discrete: { bar: 'bg-sky-500', preview: 'text-sky-500', notation: 'text-sky-700', badge: 'border-sky-200 bg-sky-50 text-sky-700', hover: 'hover:border-sky-400' },
  continuous: { bar: 'bg-blue-600', preview: 'text-blue-600', notation: 'text-blue-700', badge: 'border-blue-200 bg-blue-50 text-blue-700', hover: 'hover:border-blue-500' },
};

export const getCalculatorName = (id: string | null) => CALCULATORS.find(card => card.id === id)?.name ?? null;

const lessonLabel = (number: number) => `Aula ${String(number).padStart(2, '0')}`;

const Hub: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => (
  <div className="space-y-10">
    <header>
      <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">Calculadoras de Probabilidade</h1>
      <p className="mt-1 max-w-3xl text-[--text-secondary]">
        Coleção de calculadoras para estudantes e professores de Estatística. Escolha uma distribuição para calcular probabilidades, quantis, momentos e ver as relações com outras distribuições.
      </p>
    </header>

    {GROUPS.map(group => {
      const cards = CALCULATORS.filter(card => card.kind === group.kind);
      const styles = KIND_STYLES[group.kind];
      return (
        <section key={group.kind} aria-labelledby={`tools-${group.kind}`}>
          <h2 id={`tools-${group.kind}`} className="flex flex-wrap items-center gap-3 text-xl font-bold text-[--text-primary]">
            <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${styles.badge}`}>{group.title}</span>
            {cards.length} distribuições
          </h2>
          <p className="mb-4 mt-1 max-w-3xl text-sm text-slate-500">{group.description}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.hover}`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} aria-hidden="true" />
                <span className={`mb-3 block rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-2 ${styles.preview}`} aria-hidden="true">
                  <svg viewBox="0 0 100 50" className="block h-14 w-full">{card.preview}</svg>
                </span>
                <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                  {card.name}
                  {card.tag && <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">{card.tag}</span>}
                  {card.lessonNumbers && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      {card.lessonNumbers.map(lessonLabel).join(' e ')}
                    </span>
                  )}
                </span>
                <span className={`mt-1 block font-mono text-sm ${styles.notation}`}>{card.notation}</span>
                <span className="mt-2 block text-sm leading-snug text-slate-600">{card.summary}</span>
              </button>
            ))}
          </div>
        </section>
      );
    })}

    <p className="border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
      Cada calculadora oferece: cálculo de probabilidades, quantis (inverso), parâmetros e momentos, e relações entre distribuições — sempre com visualização didática que reage aos parâmetros.
    </p>
  </div>
);

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
              {GROUPS.map(group => (
                <optgroup key={group.kind} label={group.title}>
                  {CALCULATORS.filter(item => item.kind === group.kind).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              ))}
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
