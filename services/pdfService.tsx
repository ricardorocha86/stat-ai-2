import React from 'react';
import { PdfTemplate } from '../components/PdfTemplate';
import { Exercise } from '../types';

type PdfSolutionDetail = 'none' | 'hint' | 'guide' | 'full';

const paginateExercises = (printDocument: Document, heightPt: number): HTMLElement[] => {
  const source = printDocument.querySelector<HTMLElement>('.pdf-document')!;
  // Keep one stylesheet set; duplicating it on every page makes a complete workbook slow.
  for (const style of Array.from(source.querySelectorAll('style, link[rel="stylesheet"]'))) {
    printDocument.head.appendChild(style);
  }
  const cover = source.querySelector('.cover')!;
  const header = source.querySelector('.main-header')!;
  const exercises = Array.from(source.querySelectorAll('.exercise'));
  source.remove();
  const pages: HTMLElement[] = [];
  const maxHeight = heightPt * 4 / 3;
  const newPage = (withHeader: boolean) => {
    const page = printDocument.createElement('div');
    page.className = 'pdf-document';
    if (withHeader) page.appendChild(header.cloneNode(true));
    printDocument.body.appendChild(page);
    pages.push(page);
    return page;
  };
  newPage(false).appendChild(cover.cloneNode(true));
  let page = newPage(true);
  const addBlock = (block: HTMLElement) => {
    page.appendChild(block);
    if (page.getBoundingClientRect().height <= maxHeight) return;
    block.remove();
    page = newPage(true);
    page.appendChild(block);
    if (page.getBoundingClientRect().height > maxHeight) {
      throw new Error('Um bloco de conteúdo excede a área de impressão.');
    }
  };
  for (const exercise of exercises) {
    let heading: HTMLElement | null = exercise.querySelector('.exercise-header')!.cloneNode(true) as HTMLElement;
    const badge = exercise.querySelector('.badges')!;
    if (badge.textContent?.trim()) heading.appendChild(badge.cloneNode(true));
    const appendParts = (container: Element, sectionHeading?: Element) => {
      let label = sectionHeading;
      const children = Array.from(container.children);
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        const block = printDocument.createElement('div');
        block.className = 'print-block';
        if (heading) { block.appendChild(heading); heading = null; }
        if (label) { block.appendChild(label.cloneNode(true)); label = undefined; }
        block.appendChild(child.cloneNode(true));
        const next = children[index + 1];
        if (child.tagName === 'P' && (child.textContent?.length || 0) < 250 &&
            next?.querySelector('table, img')) {
          block.appendChild(next.cloneNode(true));
          index++;
        }
        addBlock(block);
      }
    };
    appendParts(exercise.querySelector('.statement .lesson-content')!);
    for (const part of exercise.querySelectorAll('.solution-part')) {
      appendParts(part.querySelector('.lesson-content')!, part.querySelector('h4')!);
    }
  }
  return pages;
};

export const exportExercisesPdf = async (
  title: string, subtitle: string, exercises: Exercise[], solutionDetail: PdfSolutionDetail,
): Promise<void> => {
  const [ReactDOMServer, { jsPDF }, { default: html2canvas }] = await Promise.all([
    import('react-dom/server'), import('jspdf'), import('html2canvas'),
  ]);
  // Use a document so KaTeX, tables and the print stylesheet are present before rendering.
  const frame = document.createElement('iframe');
  frame.title = 'Preparação do PDF';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0';
  document.body.appendChild(frame);
  let renderFrame: HTMLIFrameElement | undefined;
  try {
    const printDocument = frame.contentDocument;
    if (!printDocument) throw new Error('Não foi possível preparar o PDF.');
    const markup = ReactDOMServer.renderToStaticMarkup(
      <PdfTemplate title={title} subtitle={subtitle} exercises={exercises} solutionDetail={solutionDetail} />,
    );
    printDocument.open();
    printDocument.write('<!doctype html><html><head></head><body>' + markup + '</body></html>');
    printDocument.close();
    const base = printDocument.createElement('base');
    base.href = document.baseURI;
    printDocument.head.prepend(base);
    const printStyles = printDocument.querySelector('.pdf-document style');
    for (const stylesheet of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      printDocument.querySelector('.pdf-document')!.insertBefore(stylesheet.cloneNode(true), printStyles);
    }
    // Force layout before awaiting fonts; reserve image dimensions in every page clone.
    printDocument.body.getBoundingClientRect();
    await printDocument.fonts.ready;
    await Promise.all(Array.from(printDocument.images, async image => {
      await image.decode();
      image.width = image.naturalWidth;
      image.height = image.naturalHeight;
    }));
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', compress: true });
    const pages = paginateExercises(printDocument, doc.internal.pageSize.getHeight() - 80);
    await Promise.all(Array.from(printDocument.images, image => image.decode()));
    // Capture one page at a time so html2canvas does not clone an entire workbook for each page.
    renderFrame = document.createElement('iframe');
    renderFrame.title = 'Renderização do PDF';
    renderFrame.setAttribute('aria-hidden', 'true');
    renderFrame.style.cssText = frame.style.cssText;
    document.body.appendChild(renderFrame);
    const renderDocument = renderFrame.contentDocument!;
    renderDocument.open();
    renderDocument.write('<!doctype html><html><head>' + printDocument.head.innerHTML + '</head><body></body></html>');
    renderDocument.close();
    for (const [index, page] of pages.entries()) {
      if (index > 0) doc.addPage();
      const target = page.cloneNode(true) as HTMLElement;
      renderDocument.body.replaceChildren(target);
      target.getBoundingClientRect();
      await renderDocument.fonts.ready;
      await Promise.all(Array.from(renderDocument.images, image => image.decode()));
      const canvas = await html2canvas(target, {
        useCORS: true, backgroundColor: '#ffffff', scale: 2, logging: false,
        windowWidth: 900,
      });
      const width = doc.internal.pageSize.getWidth() - 80;
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 40, 40, width, canvas.height * width / canvas.width);
    }
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#64748b');
      doc.text('Página ' + page + ' de ' + pageCount, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    }
    const fileName = (title || 'exercicios').replace(/[ /]/g, '_').toLowerCase();
    doc.save(fileName + '.pdf');
  } finally { renderFrame?.remove(); frame.remove(); }
};
