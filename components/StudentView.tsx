import React, { useState } from 'react';
import { Lesson, Exercise, StudentProgress, StructuredLesson } from '../types';
import { evaluateStudentAnswer } from '../services/geminiService';
import { BookOpenIcon, SparklesIcon, CheckCircleIcon, PencilSquareIcon } from './Icons';
import Loader from './Loader';
import MarkdownRenderer from './MarkdownRenderer';
import { fireConfetti } from './Confetti';
import InteractiveMaterial from './InteractiveMaterial';
import LessonViewer from './LessonViewer';
import ExerciseHelp from './ExerciseHelp';

interface StudentExerciseCardProps {
  exercise: Exercise;
  isCompleted: boolean;
  onComplete: () => void;
}

const StudentExerciseCard: React.FC<StudentExerciseCardProps> = ({ exercise, isCompleted, onComplete }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ type: string; message: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const canCheck = exercise.categoria !== 'atividade' && exercise.correcao_automatica !== false && Boolean(exercise.solucao_completa);
  const heading = exercise.titulo || (exercise.categoria === 'multipla_escolha' ? 'Questão ' : 'Exercício ') + exercise.numero;
  const category = exercise.categoria === 'atividade' ? 'Atividade'
    : exercise.categoria === 'multipla_escolha' ? 'Múltipla escolha' : 'Exercício';
  const inputId = 'resposta-' + exercise.id;

  const handleCheckAnswer = async () => {
    if (!answer.trim()) {
      setFeedback({ type: 'error', message: 'Digite sua resposta antes de verificar.' });
      return;
    }
    if (!canCheck) return;
    setIsChecking(true);
    try {
      const result = await evaluateStudentAnswer(answer, exercise);
      const [status, ...rest] = result.split('\n');
      const normalized = status.trim().toLowerCase();
      const type = normalized === 'correto' ? 'correct'
        : normalized.startsWith('parcialmente') ? 'partial'
        : normalized === 'incorreto' ? 'incorrect' : 'error';
      setFeedback({ type, message: rest.join('\n') || result });
      if (type === 'correct' && !isCompleted) {
        await onComplete();
        fireConfetti();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível registrar a resposta. Tente novamente.' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="relative min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{category}</span>
        {isCompleted && <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700"><CheckCircleIcon className="h-4 w-4" />Completo</span>}
      </div>
      <h3 className="mb-3 text-lg font-bold text-slate-800">{heading}</h3>
      <MarkdownRenderer
        content={exercise.enunciado || ''}
        basePath={exercise.resourceBasePath}
        className="prose max-w-none break-words text-sm prose-th:border prose-th:p-2 prose-td:border prose-td:p-2"
      />
      {Boolean(exercise.pendencias?.length) && (
        <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {exercise.pendencias?.some(pending => pending.includes('Faltam os ramos'))
            ? 'Este exercício depende de uma figura que ainda precisa ser recuperada.'
            : 'A resolução deste exercício está em revisão por divergência entre o gráfico e o gabarito.'}
        </p>
      )}
      <label htmlFor={inputId} className="mb-2 mt-5 block text-sm font-medium text-slate-700">Sua resposta</label>
      <textarea
        id={inputId}
        value={answer}
        onChange={event => setAnswer(event.target.value)}
        placeholder="Digite sua resposta..."
        rows={4}
        disabled={isChecking || isCompleted}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {canCheck && (
          <button
            onClick={handleCheckAnswer}
            disabled={isChecking || isCompleted}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >{isChecking ? <Loader /> : isCompleted ? 'Verificado ✓' : 'Verificar resposta'}</button>
        )}
      </div>
      {!canCheck && <p className="mt-3 text-sm text-slate-500">{exercise.categoria === 'atividade' ? 'Atividade aberta: use o roteiro e os critérios para revisar sua entrega.' : 'Este exercício ainda não tem gabarito para correção automática.'}</p>}
      {feedback && (
        <div role="status" className={'mt-4 rounded-lg border p-4 ' + (feedback.type === 'correct' ? 'border-green-200 bg-green-50' : feedback.type === 'partial' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50')}>
          <p className="mb-2 font-semibold">{feedback.type === 'correct' ? 'Resposta correta' : feedback.type === 'partial' ? 'Resposta parcialmente correta' : feedback.type === 'incorrect' ? 'Revise sua resposta' : 'Não foi possível verificar'}</p>
          <MarkdownRenderer content={feedback.message} className="prose max-w-none text-sm" />
        </div>
      )}
      <ExerciseHelp key={exercise.id} exercise={exercise} />
    </section>
  );
};


// --- Main Student View ---
interface StudentViewProps {
    lesson: Lesson | null;
    studentProgress: StudentProgress;
    onCompleteExercise: (lessonId: string, exerciseId: string) => void;
    interactiveMaterial: StructuredLesson | null;
    onSetInteractiveMaterial: (content: StructuredLesson) => void;
    onClearInteractiveMaterial: () => void;
}
const StudentView: React.FC<StudentViewProps> = ({ lesson, studentProgress, onCompleteExercise, interactiveMaterial, onSetInteractiveMaterial, onClearInteractiveMaterial }) => {
  const [activeTab, setActiveTab] = useState<'professor' | 'exercises' | 'interactive'>('professor');

  if (!lesson) {
    return (
      <main className="flex flex-1 overflow-hidden items-center justify-center text-center p-8">
         <div>
            <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="text-2xl font-bold text-[--text-primary] mt-4">Selecione uma aula</h2>
            <p className="text-[--text-secondary] mt-1 max-w-md">Escolha uma aula na barra lateral para começar a praticar e aprimorar seus conhecimentos em estatística.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden h-full bg-[--bg-main]">
        <div className="flex-shrink-0 px-6 lg:px-8 py-3 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setActiveTab('professor')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeTab === 'professor'
                        ? 'bg-[--accent] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Material do Professor
                </button>
                <button
                    onClick={() => setActiveTab('exercises')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeTab === 'exercises'
                        ? 'bg-[--accent] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <PencilSquareIcon className="w-5 h-5" />
                    Exercícios
                </button>
                <button
                    onClick={() => setActiveTab('interactive')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeTab === 'interactive'
                        ? 'bg-[--accent] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <SparklesIcon className="w-5 h-5" />
                    Material Interativo
                </button>
            </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'professor' ? (
          <LessonViewer filePath={lesson.filePath} />
        ) : activeTab === 'exercises' ? (
          <div className="h-full relative">
              <div className="p-6 lg:p-8 bg-transparent overflow-y-auto h-full">
                  <div className="max-w-4xl mx-auto">
                      {lesson.exercises.length > 0 ? (
                          <div className="space-y-6">
                              {lesson.exercises.map((ex, index) => {
                                  const isCompleted = (studentProgress[lesson.id] || new Set()).has(ex.id);
                                  return (
                                      <StudentExerciseCard
                                          key={lesson.id + ex.id}
                                          exercise={ex}

                                          isCompleted={isCompleted}
                                          onComplete={() => onCompleteExercise(lesson.id, ex.id)}
                                      />
                                  );
                              })}
                          </div>
                      ) : (
                          <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-lg bg-white/50">
                              <h3 className="text-lg font-medium text-[--text-primary]">Ainda não há exercícios.</h3>
                              <p className="mt-1 text-sm text-[--text-secondary]">Peça ao seu professor para gerar alguns exercícios para esta aula.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        ) : (
          <InteractiveMaterial
              lesson={lesson}
              interactiveMaterial={interactiveMaterial}
              onSetInteractiveMaterial={onSetInteractiveMaterial}
              onClearInteractiveMaterial={onClearInteractiveMaterial}
          />
        )}
      </div>
    </main>
  );
};

export default StudentView;
