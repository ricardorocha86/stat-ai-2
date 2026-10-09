import React, { useState } from 'react';
import { Course, Exercise, Lesson, Unit } from '../types';
import { DownloadIcon, PlusIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';
import ExerciseHelp from './ExerciseHelp';
import { exportExercisesPdf } from '../services/pdfService';


interface ExerciseListProps {
  lesson: Lesson;
  unit: Unit | null;
  course: Course;
}

type PdfScope = 'lesson' | 'unit' | 'course';
type PdfSolutionDetail = 'none' | 'hint' | 'guide' | 'full';

const DifficultyBadge: React.FC<{ difficulty?: Exercise['dificuldade'] }> = ({ difficulty }) => {
  if (!difficulty) return null;
  const colorMap = {
    'Fácil': 'bg-green-100 text-green-800 border border-green-200',
    'Médio': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Difícil': 'bg-red-100 text-red-800 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorMap[difficulty]}`}>{difficulty}</span>;
}



const ExerciseCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => (
  <section className="min-w-0 overflow-hidden rounded-2xl border border-[--border-color] bg-[--bg-card] p-4 shadow-sm sm:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <h3 className="text-xl font-bold text-[--text-primary]">
        {exercise.titulo || (exercise.categoria === 'multipla_escolha' ? 'Questão ' : 'Exercício ') + exercise.numero}
      </h3>
      <DifficultyBadge difficulty={exercise.dificuldade} />
    </div>
    <MarkdownRenderer content={exercise.enunciado || ''} basePath={exercise.resourceBasePath} className="prose max-w-none break-words text-[--text-secondary]" />
    <ExerciseHelp key={exercise.id} exercise={exercise} />
  </section>
);

const ExerciseList: React.FC<ExerciseListProps> = ({ lesson, unit, course }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [scope, setScope] = useState<PdfScope>('lesson');
  const [solutionDetail, setSolutionDetail] = useState<PdfSolutionDetail>('full');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    let exercisesToExport: Exercise[] = [];
    let title = '';
    let subtitle = course.title;

    switch (scope) {
        case 'lesson':
            exercisesToExport = lesson.exercises;
            title = lesson.title;
            subtitle = `${unit?.title || ''}`;
            break;
        case 'unit':
            if (unit) {
                exercisesToExport = unit.lessons.flatMap(l => l.exercises);
                title = unit.title;
            }
            break;
        case 'course':
            exercisesToExport = course.units.flatMap(u => u.lessons.flatMap(l => l.exercises));
            title = course.title;
            subtitle = 'Todos os exercícios';
            break;
    }

    if (exercisesToExport.length === 0) {
        alert("Não há exercícios para exportar nesta seleção.");
        return;
    }

    setIsExportingPdf(true);
    setIsExportOpen(false);

    try {
      await exportExercisesPdf(title, subtitle, exercisesToExport, solutionDetail);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      <div className="flex-1 p-6 lg:p-8 bg-transparent overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-end items-center">
               <div className="relative">
                  <button disabled={isExportingPdf} onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-2 bg-[--bg-card] border border-[--border-color] text-[--text-primary] px-4 py-2 rounded-lg hover:bg-[--bg-card-hover] transition-colors text-sm font-medium shadow-sm">
                      <DownloadIcon className="w-4 h-4" />
                      {isExportingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
                  </button>
                  {isExportOpen && (
                      <div className="absolute right-0 mt-2 w-72 bg-[--bg-card] rounded-lg shadow-lg border border-[--border-color] z-10 p-4">
                          <div className="space-y-4">
                              <div>
                                  <label htmlFor="pdf-scope" className="text-sm font-medium text-[--text-primary] block mb-1.5">Conteúdo</label>
                                  <select id="pdf-scope" value={scope} onChange={e => setScope(e.target.value as PdfScope)} className="w-full border-[--border-color] rounded-md text-sm shadow-sm">
                                      <option value="lesson">Esta Aula</option>
                                      <option value="unit">Esta Parte</option>
                                      <option value="course">Curso Completo</option>
                                  </select>
                              </div>
                               <div>
                                  <label htmlFor="pdf-detail" className="text-sm font-medium text-[--text-primary] block mb-1.5">Gabarito</label>
                                  <select id="pdf-detail" value={solutionDetail} onChange={e => setSolutionDetail(e.target.value as PdfSolutionDetail)} className="w-full border-[--border-color] rounded-md text-sm shadow-sm">
                                      <option value="none">Apenas Enunciados</option>
                                      <option value="hint">Enunciados + Dicas</option>
                                      <option value="guide">Enunciados + Dicas + Passo Inicial</option>
                                      <option value="full">Gabarito Completo</option>
                                  </select>
                              </div>
                              <button onClick={handleExportPdf} disabled={isExportingPdf} className="w-full bg-[--accent] text-white font-semibold py-2 rounded-md hover:bg-[--accent-hover] transition-colors text-sm disabled:bg-slate-400">
                                  {isExportingPdf ? 'Gerando...' : 'Exportar PDF'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {lesson.exercises.length > 0 ? (
            <div className="space-y-6">
              {lesson.exercises.map((ex, index) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-[--border-color] rounded-lg bg-white/50">
              <PlusIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-lg font-medium text-[--text-primary]">Nenhum exercício ainda</h3>
              <p className="mt-1 text-sm text-[--text-secondary]">Use o painel de chat para gerar o primeiro exercício para esta aula.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExerciseList;
