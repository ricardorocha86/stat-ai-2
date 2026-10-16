import React, { useRef, useState } from 'react';
import { Course, Lesson } from '../../types';
import { BookOpenIcon } from '../Icons';
import SetsSection from './playground/SetsSection';
import ExperimentSection from './playground/ExperimentSection';
import DefinitionsSection from './playground/DefinitionsSection';
import PropertiesSection from './playground/PropertiesSection';

// Probability playground: theory and interactive pieces for the first ideas of probability,
// from sets to the properties that follow from the axioms.

type SectionId = 'sets' | 'events' | 'definitions' | 'properties';

const SECTIONS: { id: SectionId; title: string; summary: string; Component: React.FC }[] = [
  { id: 'sets', title: 'Conjuntos', summary: 'União, interseção, complementar, diferença e De Morgan', Component: SetsSection },
  { id: 'events', title: 'Experimento e eventos', summary: 'Experimento aleatório, espaço amostral e tipos de evento', Component: ExperimentSection },
  { id: 'definitions', title: 'Definições de probabilidade', summary: 'Clássica, frequentista e axiomática', Component: DefinitionsSection },
  { id: 'properties', title: 'Propriedades', summary: 'Complementar, vazio, espaço todo, união e outras', Component: PropertiesSection },
];

// The lesson that teaches these ideas.
const LESSON_NUMBER = 13;

interface ProbabilityPlaygroundPageProps {
  course: Course;
  onOpenLesson: (lesson: Lesson) => void;
}

const ProbabilityPlaygroundPage: React.FC<ProbabilityPlaygroundPageProps> = ({ course, onOpenLesson }) => {
  const [sectionId, setSectionId] = useState<SectionId>('sets');
  const topRef = useRef<HTMLDivElement>(null);
  const index = SECTIONS.findIndex(section => section.id === sectionId);
  const section = SECTIONS[index];
  const next = SECTIONS[index + 1];
  const lesson = course.units.flatMap(unit => unit.lessons).find(item => item.number === LESSON_NUMBER);

  const go = (id: SectionId, scroll: boolean) => {
    setSectionId(id);
    if (scroll) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">Playground de Probabilidade</h1>
          <p className="mt-1 max-w-3xl text-[--text-secondary]">
            Os primeiros conceitos de probabilidade com um pouco de teoria e muitas peças para mexer: conjuntos, experimentos aleatórios,
            eventos, as definições de probabilidade e suas propriedades, com exemplos de dados, moedas e do dia a dia da Nutrição.
          </p>
          {lesson && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              Visto no curso:
              <button
                type="button"
                onClick={() => onOpenLesson(lesson)}
                className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                <BookOpenIcon className="h-3.5 w-3.5" />
                Aula {String(LESSON_NUMBER).padStart(2, '0')} — {lesson.title}
              </button>
            </div>
          )}
        </header>

        <nav aria-label="Seções do playground" className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {SECTIONS.map((item, i) => {
            const active = item.id === sectionId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id, false)}
                aria-current={active ? 'step' : undefined}
                className={`flex min-w-0 items-start gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  active ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{item.title}</span>
                  <span className={`mt-0.5 block text-xs leading-snug ${active ? 'text-blue-100' : 'text-slate-500'}`}>{item.summary}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section.Component key={section.id} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {index > 0 ? (
            <button type="button" onClick={() => go(SECTIONS[index - 1].id, true)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              ← {SECTIONS[index - 1].title}
            </button>
          ) : <span />}
          {next && (
            <button type="button" onClick={() => go(next.id, true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
              Próximo: {next.title} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProbabilityPlaygroundPage;
