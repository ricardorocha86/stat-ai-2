import React, { useState } from 'react';
import { Exercise } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ExerciseHelpProps {
  exercise: Exercise;
}

const ExerciseHelp: React.FC<ExerciseHelpProps> = ({ exercise }) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const stages = [
    { key: 'dica', label: 'Dica', content: exercise.dica },
    { key: 'passo_inicial', label: 'Como começar', content: exercise.passo_inicial },
    { key: 'solucao_completa', label: 'Resolução', content: exercise.solucao_completa },
    { key: 'resposta_final', label: 'Resposta final', content: exercise.resposta_final },
  ].filter(stage => Boolean(stage.content));

  if (stages.length === 0) return null;

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <p className="mb-3 text-sm text-slate-500">Abra as etapas de ajuda na ordem que aparecem.</p>
      <div className="flex flex-wrap gap-2">
        {stages.map((stage, index) => (
          <button
            key={stage.key}
            type="button"
            disabled={index > revealedCount}
            aria-expanded={index < revealedCount}
            aria-controls={exercise.id + '-help-' + stage.key}
            onClick={() => setRevealedCount(previous => Math.max(previous, index + 1))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >{stage.label}</button>
        ))}
        {revealedCount > 0 && (
          <button type="button" onClick={() => setRevealedCount(0)} className="px-3 py-2 text-sm text-slate-500 underline">
            Recolher ajuda
          </button>
        )}
      </div>
      {stages.map((stage, index) => (
        <section key={stage.key} id={exercise.id + '-help-' + stage.key} hidden={index >= revealedCount} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {index < revealedCount && <>
            <h4 className="mb-2 font-semibold text-slate-800">{stage.label}</h4>
            <MarkdownRenderer content={stage.content || ''} basePath={exercise.resourceBasePath} className="prose max-w-none break-words text-sm" />
          </>}
        </section>
      ))}
    </div>
  );
};

export default ExerciseHelp;
