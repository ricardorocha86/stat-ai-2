import React from 'react';
import { Exercise } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #1f2937;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            width: 515pt; /* A4 width (595pt) minus margins (40*2) */
        }
        .cover {
            text-align: center;
            page-break-after: always;
            padding-top: 300pt;
            padding-bottom: 300pt;
        }
        .cover h1 {
            font-size: 28pt;
            color: #1e3a8a;
            margin: 0;
            font-weight: bold;
        }
        .cover h2 {
            font-size: 18pt;
            color: #4b5563;
            font-weight: normal;
            margin-top: 15px;
        }
        .main-header {
            font-size: 9pt;
            color: #64748b;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 8px;
            margin-bottom: 24px;
        }
        .main-header .subtitle {
            float: left;
        }
        .main-header .title {
            float: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .exercise {
            margin-bottom: 24px;
            page-break-inside: avoid;
        }
        .exercise-header {
            font-size: 16pt;
            color: #1e293b;
            margin-top: 24px;
            margin-bottom: 8px;
            font-weight: bold;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
        }
        .badges {
            margin-top: 8px;
            margin-bottom: 12px;
        }
        .badge {
            display: inline-block;
            padding: 2px 10px;
            font-size: 9pt;
            border-radius: 12px;
            margin-right: 8px;
            font-family: Arial, Helvetica, sans-serif;
        }
        .solution-block {
            margin-top: 16px;
            background-color: #f8f9fa;
            border: 1px solid #e5e7eb;
            padding: 1px 16px 12px 16px;
            border-radius: 4px;
        }
        .solution-part {
            margin-top: 12px;
        }
        .solution-part h4 {
            font-size: 11pt;
            color: #374151;
            font-weight: bold;
            font-style: italic;
            margin: 0 0 4px 0;
        }
        /* Markdown styles */
        p, ul, ol, pre, table { margin: 0 0 12px 0 !important; padding: 0 !important; }
        ul, ol { padding-left: 25px !important; }
        li { margin-bottom: 5px !important; }
        strong, b { font-weight: bold !important; }
        em, i { font-style: italic !important; }
        code {
            font-family: 'Courier New', Courier, monospace !important;
            background-color: #e5e7eb !important;
            padding: 2px 5px !important;
            border-radius: 4px !important;
            font-size: 90% !important;
        }
        pre {
            background-color: #f1f3f5 !important;
            color: #111827 !important;
            padding: 12px !important;
            border-radius: 6px !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            font-size: 10pt !important;
        }
        pre code { background-color: transparent !important; padding: 0 !important; }
        table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 10pt !important;
        }
        th, td {
            border: 1px solid #d1d5db !important;
            padding: 6px 8px !important;
            text-align: left !important;
        }
        th { background-color: #f3f4f6 !important; font-weight: bold !important; }
    `;

    const renderSolutions = (ex: Exercise) => {
        if (solutionDetail === 'none') return null;

        return (
             <div className="solution-block">
                { (solutionDetail === 'hint' || solutionDetail === 'guide' || solutionDetail === 'full') && (
                    <div className="solution-part">
                        <h4>Dica</h4>
                        <div className="solution-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{ex.solution.hint}</ReactMarkdown></div>
                    </div>
                )}
                {(solutionDetail === 'guide' || solutionDetail === 'full') && (
                    <div className="solution-part">
                        <h4>Guia Inicial</h4>
                        <div className="solution-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{ex.solution.startingGuide}</ReactMarkdown></div>
                    </div>
                )}
                {solutionDetail === 'full' && (
                    <div className="solution-part">
                        <h4>Solução Completa</h4>
                        <div className="solution-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{ex.solution.fullSolution}</ReactMarkdown></div>
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <style>{styles}</style>
            </head>
            <body>
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
                        <div className="exercise-header">Exercício {index + 1}</div>
                        <div className="badges">
                           <span className="badge" style={{ color: difficultyColorMap[ex.difficulty], backgroundColor: difficultyBgColorMap[ex.difficulty], border: `1px solid ${difficultyColorMap[ex.difficulty]}` }}>{ex.difficulty}</span>
                           <span className="badge" style={{ color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}>{ex.type}</span>
                        </div>
                        <div className="statement">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{ex.problemStatement}</ReactMarkdown>
                        </div>
                        {renderSolutions(ex)}
                    </div>
                ))}
            </body>
        </html>
    );
};