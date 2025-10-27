import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';
import { ExclamationTriangleIcon } from './Icons';

interface LessonViewerProps {
  filePath: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ filePath }) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLessonContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setMarkdown(text);
      } catch (e: any) {
        console.error("Failed to load lesson content:", e);
        setError("Não foi possível carregar o conteúdo da aula. Verifique o caminho do arquivo e tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    if (filePath) {
      loadLessonContent();
    }
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-[--bg-main] flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-[--bg-main] flex justify-center items-center text-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800">Erro ao Carregar</h3>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 bg-[--bg-main] overflow-y-auto h-screen">
      <article className="prose lg:prose-xl max-w-4xl mx-auto bg-[--bg-card] p-8 rounded-lg shadow-md border border-[--border-color]
        prose-headings:text-[--text-primary] prose-p:text-[--text-secondary] prose-strong:text-[--text-primary]
        prose-a:text-[--accent] prose-blockquote:border-[--accent] prose-blockquote:text-slate-600
        prose-code:bg-[--bg-code] prose-code:text-slate-800 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md
        prose-li:marker:text-[--accent]
        prose-table:border prose-table:border-collapse prose-table:border-[--border-color]
        prose-th:border prose-th:p-2 prose-th:bg-slate-50 prose-th:border-[--border-color] prose-th:text-[--text-primary]
        prose-td:border prose-td:p-2 prose-td:border-[--border-color]
        prose-img:rounded-lg prose-img:shadow-sm prose-img:border prose-img:border-[--border-color]"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
};

export default LessonViewer;
