import React from 'react';
import { Exercise } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

type PdfSolutionDetail = 'none' | 'hint' | 'guide' | 'full';

interface PdfTemplateProps {
  title: string;
  subtitle: string;
  exercises: Exercise[];
  solutionDetail: PdfSolutionDetail;
}

export const PdfTemplate: React.FC<PdfTemplateProps> = ({ title, subtitle, exercises, solutionDetail }) => {
    const difficultyColorMap = { 'Fácil': '#16a34a', 'Médio': '#d97706', 'Difícil': '#dc2626' };
    const difficultyBgColorMap = { 'Fácil': '#f0fdf4', 'Médio': '#fffbeb', 'Difícil': '#fef2f2' };

    const styles = `
        .pdf-document, .pdf-document * { box-sizing: border-box; }
        .pdf-document { width: 515.28pt; font: 12pt/1.5 Georgia, 'Times New Roman', serif; color: #1f2937; background: white; }
        .pdf-document .cover { text-align: center; display: flex; flex-direction: column; justify-content: center; height: 660pt; }
        .pdf-document .cover h1 { font-size: 28pt; color: #1e3a8a; font-weight: bold; margin: 0; }
        .pdf-document .cover h2 { font-size: 18pt; color: #4b5563; font-weight: normal; margin-top: 15pt; }
        .pdf-document .main-header { display: flex; justify-content: space-between; gap: 15pt; font-size: 9pt; color: #64748b; border-bottom: 1px solid #d1d5db; padding-bottom: 8pt; margin-bottom: 18pt; }
        .pdf-document .exercise-header { font-size: 16pt; color: #1e293b; margin: 18pt 0 8pt; font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 4pt; }
        .pdf-document .badges { margin: 8pt 0 12pt; }
        .pdf-document .badge { display: inline-block; padding: 2pt 10pt; font: 9pt Arial, sans-serif; border-radius: 12pt; }
        .pdf-document .solution-part { margin-top: 12pt; }
        .pdf-document h4 { font-size: 11pt; color: #374151; font-weight: bold; font-style: italic; margin: 12pt 0 4pt; }
        .pdf-document p, .pdf-document ul, .pdf-document ol, .pdf-document pre, .pdf-document table { margin: 0 0 10pt !important; padding: 0; }
        .pdf-document ul, .pdf-document ol { padding-left: 20pt; }
        .pdf-document li { margin-bottom: 4pt; }
        .pdf-document strong, .pdf-document b { font-weight: bold; }
        .pdf-document em, .pdf-document i { font-style: italic; }
        .pdf-document pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 10pt; padding: 8pt; background: #f1f5f9; }
        .pdf-document code { font-family: 'Courier New', monospace; font-size: 90%; }
        .pdf-document table { border-collapse: collapse; width: 100%; font-size: 10pt; }
        .pdf-document th, .pdf-document td { border: 1px solid #d1d5db; padding: 5pt 6pt; text-align: left; }
        .pdf-document th { background: #f3f4f6; font-weight: bold; }
        .pdf-document .overflow-x-auto { overflow: visible !important; padding-bottom: 3pt; }
        .pdf-document .print-resource { margin: 10pt 0; }
        .pdf-document img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
        .pdf-document figcaption { font-size: 9pt; color: #64748b; margin-top: 4pt; }
        .pdf-document .katex { font-size: 1em; }
        .pdf-document .katex-display { overflow: visible; margin: 8pt 0; }
        .pdf-document .print-block { display: flow-root; }
    `;

    const renderSolutions = (ex: Exercise) => {
        if (solutionDetail === 'none') return null;

        return (
             <div className="solution-block">
                { (solutionDetail === 'hint' || solutionDetail === 'guide' || solutionDetail === 'full') && ex.dica && (
                    <div className="solution-part">
                        <h4>Dica</h4>
                        <div className="solution-content"><MarkdownRenderer content={ex.dica || ''} basePath={ex.resourceBasePath} staticMode /></div>
                    </div>
                )}
                {(solutionDetail === 'guide' || solutionDetail === 'full') && ex.passo_inicial && (
                    <div className="solution-part">
                        <h4>Passo Inicial</h4>
                        <div className="solution-content"><MarkdownRenderer content={ex.passo_inicial || ''} basePath={ex.resourceBasePath} staticMode /></div>
                    </div>
                )}
                {solutionDetail === 'full' && ex.solucao_completa && (
                    <div className="solution-part">
                        <h4>Solução Completa</h4>
                        <div className="solution-content"><MarkdownRenderer content={ex.solucao_completa || ''} basePath={ex.resourceBasePath} staticMode /></div>
                    </div>
                )}
                {solutionDetail === 'full' && ex.resposta_final && (
                    <div className="solution-part">
                        <h4>Resposta final</h4>
                        <div className="solution-content"><MarkdownRenderer content={ex.resposta_final} basePath={ex.resourceBasePath} staticMode /></div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="pdf-document" lang="pt-BR">
                <style>{styles}</style>
                <div className="cover">
                    <h1>{title}</h1>
                    <h2>{subtitle}</h2>
                </div>

                <div className="main-header clearfix">
                    <span className="subtitle">{subtitle}</span>
                    <span className="title">{title}</span>
                </div>

                {exercises.map((ex, index) => (
                    <div key={ex.id} className="exercise">
                        <div className="exercise-header">{ex.titulo || (ex.categoria === 'multipla_escolha' ? 'Questão ' : 'Exercício ') + ex.numero}</div>
                        <div className="badges">
                           {ex.dificuldade && (
                               <span className="badge" style={{
                                   color: difficultyColorMap[ex.dificuldade] || '#000',
                                   backgroundColor: difficultyBgColorMap[ex.dificuldade] || '#fff',
                                   border: `1px solid ${difficultyColorMap[ex.dificuldade] || '#000'}`
                               }}>{ex.dificuldade}</span>
                           )}
                        </div>
                        <div className="statement">
                            <MarkdownRenderer content={ex.enunciado || ''} basePath={ex.resourceBasePath} staticMode />
                        </div>
                        {renderSolutions(ex)}
                    </div>
                ))}
        </div>
    );
};
