import React, { useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Course, Exercise, Lesson, Unit } from '../types';
import { DownloadIcon, PlusIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import { PdfTemplate } from './PdfTemplate';


interface ExerciseListProps {
  lesson: Lesson;
  unit: Unit | null;
  course: Course;
}

type PdfScope = 'lesson' | 'unit' | 'course';
type PdfSolutionDetail = 'none' | 'hint' | 'guide' | 'full';

const DifficultyBadge: React.FC<{ difficulty: Exercise['difficulty'] }> = ({ difficulty }) => {
  const colorMap = {
    'Fácil': 'bg-green-100 text-green-800 border border-green-200',
    'Médio': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Difícil': 'bg-red-100 text-red-800 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorMap[difficulty]}`}>{difficulty}</span>;
}

const TypeBadge: React.FC<{ type: Exercise['type'] }> = ({ type }) => {
    return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">{type}</span>;
}

const ExerciseCard: React.FC<{ exercise: Exercise, index: number }> = ({ exercise, index }) => {
    return (
        <div className="bg-[--bg-card] p-5 rounded-lg border border-[--border-color] shadow-sm transition-shadow hover:shadow-lg break-inside-avoid">
            <h3 className="font-bold text-lg text-[--text-primary] mb-2">Exercício {index + 1}</h3>
            <div className="text-[--text-secondary] text-sm prose max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-code:bg-[--bg-code] prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.problemStatement}</ReactMarkdown>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <DifficultyBadge difficulty={exercise.difficulty} />
                <TypeBadge type={exercise.type} />
            </div>
            <div className="mt-5 space-y-2">
                <details className="group">
                    <summary className="text-sm font-semibold text-[--accent] hover:text-[--accent-hover] cursor-pointer list-none flex items-center gap-1.5">
                        <span className="group-open:rotate-90 transition-transform duration-200">&#9656;</span> Dica
                    </summary>
                    <div className="mt-2 p-3 bg-[--bg-main] rounded-md border border-[--border-color] text-sm text-[--text-secondary] prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.hint}</ReactMarkdown>
                    </div>
                </details>
                 <details className="group">
                    <summary className="text-sm font-semibold text-[--accent] hover:text-[--accent-hover] cursor-pointer list-none flex items-center gap-1.5">
                        <span className="group-open:rotate-90 transition-transform duration-200">&#9656;</span> Guia Inicial
                    </summary>
                    <div className="mt-2 p-3 bg-[--bg-main] rounded-md border border-[--border-color] text-sm text-[--text-secondary] prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.startingGuide}</ReactMarkdown>
                    </div>
                </details>
                 <details className="group">
                    <summary className="text-sm font-semibold text-[--accent] hover:text-[--accent-hover] cursor-pointer list-none flex items-center gap-1.5">
                        <span className="group-open:rotate-90 transition-transform duration-200">&#9656;</span> Solução Completa
                    </summary>
                    <div className="mt-2 p-3 bg-[--bg-main] rounded-md border border-[--border-color] text-sm text-[--text-secondary] prose max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{exercise.solution.fullSolution}</ReactMarkdown>
                    </div>
                </details>
            </div>
        </div>
    )
}

const ExerciseList: React.FC<ExerciseListProps> = ({ lesson, unit, course }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [scope, setScope] = useState<PdfScope>('lesson');
  const [solutionDetail, setSolutionDetail] = useState<PdfSolutionDetail>('full');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = () => {
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

    setTimeout(async () => {
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const staticMarkup = ReactDOMServer.renderToStaticMarkup(
                <PdfTemplate title={title} subtitle={subtitle} exercises={exercisesToExport} solutionDetail={solutionDetail} />
            );

            await doc.html(staticMarkup, {
                callback: (doc) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 2; i <= pageCount; i++) { // Start from page 2
                        doc.setPage(i);
                        doc.setFont('Times-Roman', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor('#64748b');
                        const text = `Página ${i} de ${pageCount}`;
                        const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
                        const textX = (doc.internal.pageSize.getWidth() - textWidth) / 2;
                        doc.text(text, textX, doc.internal.pageSize.getHeight() - 20);
                    }
                    const fileName = (title || 'exercicios').replace(/[ /]/g, '_').toLowerCase();
                    doc.save(`${fileName}.pdf`);
                },
                margin: [40, 40, 40, 40],
                html2canvas: { useCORS: true },
                autoPaging: 'text',
                width: 595.28 - 80,
                windowWidth: 595.28 - 80,
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
        } finally {
            setIsExportingPdf(false);
        }
    }, 100);
  };

  return (
    <>
      <div className="flex-1 p-6 lg:p-8 bg-transparent overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-end items-center">
               <div className="relative">
                  <button onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-2 bg-[--bg-card] border border-[--border-color] text-[--text-primary] px-4 py-2 rounded-lg hover:bg-[--bg-card-hover] transition-colors text-sm font-medium shadow-sm">
                      <DownloadIcon className="w-4 h-4" />
                      Baixar PDF
                  </button>
                  {isExportOpen && (
                      <div className="absolute right-0 mt-2 w-72 bg-[--bg-card] rounded-lg shadow-lg border border-[--border-color] z-10 p-4">
                          <div className="space-y-4">
                              <div>
                                  <label className="text-sm font-medium text-[--text-primary] block mb-1.5">Conteúdo</label>
                                  <select value={scope} onChange={e => setScope(e.target.value as PdfScope)} className="w-full border-[--border-color] rounded-md text-sm shadow-sm">
                                      <option value="lesson">Esta Aula</option>
                                      <option value="unit">Esta Unidade</option>
                                      <option value="course">Curso Completo</option>
                                  </select>
                              </div>
                               <div>
                                  <label className="text-sm font-medium text-[--text-primary] block mb-1.5">Gabarito</label>
                                  <select value={solutionDetail} onChange={e => setSolutionDetail(e.target.value as PdfSolutionDetail)} className="w-full border-[--border-color] rounded-md text-sm shadow-sm">
                                      <option value="none">Apenas Enunciados</option>
                                      <option value="hint">Enunciados + Dicas</option>
                                      <option value="guide">Enunciados + Dicas + Guia</option>
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
                <ExerciseCard key={ex.id} exercise={ex} index={index} />
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