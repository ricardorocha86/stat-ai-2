import React, { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  title: string;
}

const LessonResource: React.FC<Props> = ({ src, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(620);

  useEffect(() => {
    setHeight(620);
    const receiveSize = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'statai-resource-size') return;
      const nextHeight = Number(event.data.height);
      if (Number.isFinite(nextHeight)) setHeight(Math.max(280, Math.min(2400, Math.ceil(nextHeight))));
    };
    window.addEventListener('message', receiveSize);
    return () => window.removeEventListener('message', receiveSize);
  }, [src]);

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-downloads"
        className="block w-full border-0"
        style={{ height }}
      />
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        <span>{title}</span>
        <a href={src} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline">
          Abrir recurso em outra aba
        </a>
      </figcaption>
    </figure>
  );
};

export default LessonResource;
