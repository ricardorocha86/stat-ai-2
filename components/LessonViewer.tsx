import React, { useEffect, useState } from 'react';
import Loader from './Loader';
import MarkdownRenderer from './MarkdownRenderer';
import { ExclamationTriangleIcon } from './Icons';

const LessonViewer: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setMarkdown('');
    fetch('/' + filePath.replace(/^\//, ''), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Não foi possível carregar o material desta aula.');
        return response.text();
      })
      .then(setMarkdown)
      .catch(error => { if (error.name !== 'AbortError') setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [filePath]);

  const basePath = '/' + filePath.slice(0, filePath.lastIndexOf('/') + 1);
  if (isLoading) return <div className="flex justify-center p-10"><Loader /></div>;
  if (error) return (
    <div role="alert" className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
      <ExclamationTriangleIcon className="mb-2 h-6 w-6" />{error}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <article className="mx-auto max-w-4xl min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        <MarkdownRenderer
          content={markdown}
          basePath={basePath}
          className="prose max-w-none break-words prose-headings:text-slate-800 prose-p:text-slate-700 prose-table:my-0 prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-2 prose-td:border prose-td:border-slate-200 prose-td:p-2"
        />
      </article>
    </div>
  );
};

export default LessonViewer;
