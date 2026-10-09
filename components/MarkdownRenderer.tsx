import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './lesson-content.css';
import LessonResource from './LessonResource';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: Components;
  basePath?: string;
  staticMode?: boolean;
}

export const resolveLessonResource = (source: string, basePath?: string): string => {
  if (!basePath || /^(https?:|data:|#)/i.test(source)) return source;
  return new URL(source, 'https://lesson.local' + basePath).pathname;
};

// remark-math reads "R$ 3,75 ... R$ 4,10" as inline math; escape the currency sign.
const escapeCurrency = (text: string): string =>
  text.replace(/(^|[^\w$\\])R\$(?=[\s\d)])/g, (_, before) => before + 'R\\$');

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content, className, components, basePath, staticMode = false,
}) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex]}
    className={'lesson-content ' + (className || '')}
    components={{
      p: ({ node, children }) => node?.children.some(child => child.type === 'element' && child.tagName === 'img')
        ? <div className="my-4">{children}</div>
        : <p>{children}</p>,
      table: ({ children }) => (
        <div className="my-4 max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      ),
      img: ({ src, alt }) => {
        const url = resolveLessonResource(src || '', basePath);
        if (/^\/aulas\/.*\.html(?:[?#].*)?$/i.test(url)) {
          return staticMode
            ? <figure className="print-resource"><img src={url.replace(/\.html(?=[?#]|$)/i, '-print.png')} alt={alt || 'Gráfico'} loading="eager" /><figcaption>{alt || 'Gráfico'}</figcaption></figure>
            : <LessonResource src={url} title={alt || 'Recurso da aula'} />;
        }
        return <img src={url} alt={alt || ''} loading={staticMode ? 'eager' : 'lazy'} className="mx-auto h-auto max-w-full rounded-lg" />;
      },
      a: ({ href, children }) => <a href={resolveLessonResource(href || '', basePath)}>{children}</a>,
      ...components,
    }}
  >{escapeCurrency(content || '')}</ReactMarkdown>
);

export default MarkdownRenderer;
