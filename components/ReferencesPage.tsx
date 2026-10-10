import React, { useState } from 'react';
import { BookOpenIcon } from './Icons';

// Data from the book's cataloguing page (CIP) and its store page on Clube de Autores.
const BOOK = {
  title: 'Estatística Aplicada',
  author: 'Renan Mercuri Pinto',
  edition: '2ª edição (2020)',
  publisher: 'Edição do Autor, Americana–SP',
  pages: '162 páginas',
  isbn: '978-85-540942-4-9',
  coverUrl: 'https://dxkck1miuebqc.cloudfront.net/books/312422/preview/cover_front_big.jpg',
  storeUrl: 'https://clubedeautores.com.br/livro/estatistica-aplicada-3',
};

const ReferencesPage: React.FC = () => {
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-10">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
          <div className="mx-auto w-44 flex-shrink-0 sm:mx-0 sm:w-52">
            {coverFailed ? (
              <div className="flex aspect-[148/210] w-full flex-col items-center justify-center gap-2 rounded-lg bg-slate-100 p-4 text-center text-slate-500">
                <BookOpenIcon className="h-10 w-10" />
                <span className="text-sm font-semibold">{BOOK.title}</span>
              </div>
            ) : (
              <img
                src={BOOK.coverUrl}
                alt={`Capa do livro ${BOOK.title}, de ${BOOK.author}`}
                onError={() => setCoverFailed(true)}
                className="w-full rounded-lg shadow-lg ring-1 ring-slate-200"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Livro-base do curso</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">{BOOK.title}</h2>
            <p className="mt-1 text-lg text-slate-600">{BOOK.author}</p>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Edição</dt><dd className="font-medium text-slate-800">{BOOK.edition}</dd></div>
              <div><dt className="text-slate-500">Publicação</dt><dd className="font-medium text-slate-800">{BOOK.publisher}</dd></div>
              <div><dt className="text-slate-500">Extensão</dt><dd className="font-medium text-slate-800">{BOOK.pages}</dd></div>
              <div><dt className="text-slate-500">ISBN</dt><dd className="font-medium text-slate-800">{BOOK.isbn}</dd></div>
            </dl>
            <a
              href={BOOK.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              Comprar o livro no Clube de Autores
            </a>
          </div>
        </section>

        <section className="space-y-3 text-slate-700">
          <h3 className="text-xl font-bold text-slate-900">Sobre o material da plataforma</h3>
          <p>
            O conteúdo do Stat-AI 2.0 é uma reconstrução, aula a aula, do livro <strong>{BOOK.title}</strong>, de {BOOK.author}.
            Cada aula da plataforma corresponde a uma seção do livro: os textos, os exemplos e os exercícios foram
            reorganizados a partir dele, e os gabaritos seguem o material indicado pelo próprio autor.
          </p>
          <p>
            A plataforma acrescenta ao livro os gráficos interativos, a correção de respostas com IA, o tutor de dúvidas
            e o material interativo. Para estudar com o texto completo e na ordem original, recomendamos o livro.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Como citar</h3>
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            PINTO, Renan Mercuri. <strong>Estatística aplicada</strong>. 2. ed. Americana: Edição do autor, 2020. 162 p. ISBN {BOOK.isbn}.
          </p>
          <p className="text-xs text-slate-500">Todos os direitos do livro são reservados ao autor.</p>
        </section>
      </div>
    </div>
  );
};

export default ReferencesPage;
