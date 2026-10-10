import React, { useState } from 'react';
import { getCourseProgress, getCourseStars, getLessonProgress, getLessonStars } from '../services/progressService';
import { Course, Lesson, StudentProgress, UserProfile } from '../types';
import { BookOpenIcon, OwlIcon, PaperAirplaneIcon, StarIcon } from './Icons';

interface HomePageProps {
  course: Course;
  onSelectLesson: (lesson: Lesson) => void;
  studentProgress: StudentProgress;
  userProfile: UserProfile | null;
  onAskTutor: (question: string) => void;
}

const lessonLabel = (lesson: Lesson) =>
  (lesson.number !== undefined ? `Aula ${String(lesson.number).padStart(2, '0')} — ` : '') + lesson.title;

const verifiedLabel = (completed: number, total: number) =>
  `${completed} de ${total} ${total === 1 ? 'exercício verificado' : 'exercícios verificados'}`;

const Stars: React.FC<{ count: number }> = ({ count }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${count} de 3 estrelas`}>
    {[1, 2, 3].map(i => (
      <StarIcon key={i} filled={i <= count} className={`h-4 w-4 ${i <= count ? 'text-yellow-400' : 'text-slate-300'}`} />
    ))}
  </span>
);

const HomePage: React.FC<HomePageProps> = ({ course, onSelectLesson, studentProgress, userProfile, onAskTutor }) => {
  const [question, setQuestion] = useState('');

  const lessons = course.units.flatMap(unit => unit.lessons).filter(lesson => lesson.kind !== 'reference');
  const referenceLesson = course.units.flatMap(unit => unit.lessons).find(lesson => lesson.kind === 'reference');
  const lastLesson = lessons.find(lesson => lesson.id === userProfile?.lastLessonId);
  const currentLesson = lastLesson || lessons[0];
  const nextLesson = lastLesson ? lessons[lessons.indexOf(lastLesson) + 1] : undefined;
  const currentProgress = currentLesson ? getLessonProgress(currentLesson, studentProgress) : undefined;

  const { completedCount, totalCount } = getCourseProgress(course, studentProgress);
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const { stars, maxStars } = getCourseStars(course, studentProgress);
  const firstName = (userProfile?.name || '').trim().split(/\s+/)[0];

  const unitSummaries = course.units
    .map(unit => {
      const unitLessons = unit.lessons.filter(lesson => getLessonProgress(lesson, studentProgress).totalCount > 0);
      return {
        unit,
        completed: unitLessons.reduce((total, lesson) => total + getLessonProgress(lesson, studentProgress).completedCount, 0),
        total: unitLessons.reduce((total, lesson) => total + getLessonProgress(lesson, studentProgress).totalCount, 0),
        stars: unitLessons.reduce((total, lesson) => total + getLessonStars(lesson, studentProgress), 0),
        maxStars: unitLessons.length * 3,
      };
    })
    .filter(summary => summary.total > 0);

  const handleAsk = (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    onAskTutor(question.trim());
    setQuestion('');
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[--text-primary]">
            {firstName ? `Olá, ${firstName}! 👋` : 'Olá! 👋'}
          </h1>
          <p className="mt-1 text-[--text-secondary]">Que bom ter você no Stat-AI 2.0. Vamos estudar estatística?</p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {currentLesson && (
            <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-6 text-white shadow-lg lg:col-span-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                  {lastLesson ? 'Continue de onde parou' : 'Comece por aqui'}
                </p>
                <h2 className="mt-2 text-2xl font-bold">{lessonLabel(currentLesson)}</h2>
                <p className="mt-1 text-sm text-blue-100">
                  {course.units.find(unit => unit.lessons.includes(currentLesson))?.title}
                </p>
                {currentProgress && currentProgress.totalCount > 0 && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-blue-100">
                    <Stars count={getLessonStars(currentLesson, studentProgress)} />
                    {verifiedLabel(currentProgress.completedCount, currentProgress.totalCount)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onSelectLesson(currentLesson)}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 shadow hover:bg-blue-50"
                >
                  {lastLesson ? 'Continuar aula' : 'Começar a primeira aula'}
                </button>
                {nextLesson && (
                  <button onClick={() => onSelectLesson(nextLesson)} className="text-left text-sm font-medium text-blue-100 hover:text-white">
                    Próxima: {lessonLabel(nextLesson)} →
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suas estrelas</p>
              <p className="mt-2 flex items-center gap-2 text-4xl font-bold text-slate-800">
                <StarIcon filled className="h-9 w-9 text-yellow-400" />
                {stars}
                <span className="text-lg font-medium text-slate-400">de {maxStars}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Cada aula vale até 3 estrelas pelos exercícios verificados.</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-600">Exercícios verificados</span>
                <span className="font-semibold text-slate-800">{completedCount} de {totalCount}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <OwlIcon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Qual é a sua dúvida?</h2>
              <p className="text-sm text-slate-500">O Stat responde com base nas aulas do curso.</p>
            </div>
          </div>
          <form onSubmit={handleAsk} className="relative mt-4">
            <label htmlFor="home-question" className="sr-only">Sua dúvida de estatística</label>
            <input
              id="home-question"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ex.: Quando uso a mediana em vez da média?"
              className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-14 text-sm shadow-inner outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              aria-label="Perguntar ao Stat"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </section>

        {unitSummaries.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-[--text-primary]">Seu progresso por unidade</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unitSummaries.map(summary => (
                <div key={summary.unit.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-800">{summary.unit.title}</h3>
                    <span className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-slate-600">
                      <StarIcon filled className="h-4 w-4 text-yellow-400" />{summary.stars}/{summary.maxStars}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.round((summary.completed / summary.total) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{verifiedLabel(summary.completed, summary.total)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {referenceLesson && (
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-sm text-slate-600">
              <BookOpenIcon className="h-6 w-6 flex-shrink-0 text-slate-400" />
              <span>O curso é baseado no livro <strong>Estatística Aplicada</strong>, de Renan Mercuri Pinto.</span>
            </p>
            <button onClick={() => onSelectLesson(referenceLesson)} className="flex-shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Ver referências →
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
