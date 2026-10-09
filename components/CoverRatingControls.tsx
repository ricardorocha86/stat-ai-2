import React, { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon, StarIcon } from './Icons';
import { loadOwnCoverRating, saveCoverRating, subscribeCoverRating, type CoverRatingSummary } from '../services/coverRatingService';
import './cover-rating.css';

interface CoverRatingControlsProps {
  coverNumber: number;
  onNext: () => void;
  imageAvailable: boolean;
}

const numberFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const CoverRatingControls: React.FC<CoverRatingControlsProps> = ({ coverNumber, onNext, imageAvailable }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [summary, setSummary] = useState<CoverRatingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState(0);
  const [clickFeedback, setClickFeedback] = useState(false);
  const mounted = useRef(true);
  const saving = useRef(false);

  useEffect(() => {
    if (celebration === 0) return;
    const timer = window.setTimeout(() => setClickFeedback(false), 1000);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    loadOwnCoverRating(coverNumber)
      .then(score => { if (active) setRating(score); })
      .catch(() => { if (active) setError('Não foi possível carregar sua nota. Você pode tentar avaliar novamente.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [coverNumber]);

  const hasRating = rating > 0;
  useEffect(() => {
    if (!hasRating) return;
    return subscribeCoverRating(coverNumber, setSummary, () => {
      setError('Não foi possível atualizar a média agora.');
    });
  }, [coverNumber, hasRating]);

  const handleRate = async (score: number) => {
    if (saving.current || isLoading || !imageAvailable) return;
    saving.current = true;
    const previousRating = rating;
    setRating(score);
    setHoveredRating(0);
    setClickFeedback(true);
    setCelebration(value => value + 1);
    setIsSaving(true);
    setError(null);
    try {
      await saveCoverRating(coverNumber, score);
    } catch {
      if (mounted.current) {
        setRating(previousRating);
        setClickFeedback(false);
        setError('Não foi possível salvar a nota. Tente novamente.');
      }
    } finally {
      saving.current = false;
      if (mounted.current) setIsSaving(false);
    }
  };

  const disabled = isLoading || isSaving || !imageAvailable;
  const showAverage = hasRating && !isSaving && !clickFeedback && summary !== null && summary.count > 0;
  const visibleRating = showAverage ? summary.average : hasRating ? rating : hoveredRating;
  const summaryId = 'cover-rating-summary-' + coverNumber;
  const summaryLabel = showAverage
    ? 'Média ' + numberFormat.format(summary.average) + ' · '
      + summary.count.toLocaleString('pt-BR') + (summary.count === 1 ? ' voto' : ' votos')
    : '';

  return (
    <div className="cover-rating-panel rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm lg:px-4 lg:py-3">
      <div className="flex items-center justify-center gap-3">
        <div role="group" aria-label={'Avaliar capa ' + coverNumber} className={'cover-rating-stars relative flex gap-0.5 ' + (showAverage ? 'cover-rating-stars-rated ' : '') + (clickFeedback ? 'cover-rating-stars-feedback' : '')} onMouseLeave={() => setHoveredRating(0)}>
          {[1, 2, 3, 4, 5].map(stars => {
            const fill = Math.max(0, Math.min(1, visibleRating - stars + 1)) * 100;
            return (
              <button
                key={stars}
                type="button"
                disabled={disabled}
                aria-label={'Dar ' + stars + (stars === 1 ? ' estrela' : ' estrelas')}
                aria-pressed={rating === stars}
                aria-describedby={showAverage && !error ? summaryId : undefined}
                onClick={() => void handleRate(stars)}
                onMouseEnter={() => { if (!disabled && !hasRating) setHoveredRating(stars); }}
                onFocus={() => { if (!disabled && !hasRating) setHoveredRating(stars); }}
                onBlur={() => setHoveredRating(0)}
                className="relative flex h-9 w-8 items-center justify-center rounded-lg transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span key={celebration} aria-hidden="true" className={'relative block h-5 w-5 ' + (clickFeedback && stars <= rating ? 'cover-rating-star-saved' : '')} style={{ animationDelay: (stars - 1) * 35 + 'ms' }}>
                  <StarIcon className="h-5 w-5 text-slate-400" />
                  <span className={'cover-rating-fill absolute inset-y-0 left-0 overflow-hidden ' + (isSaving || clickFeedback ? 'cover-rating-fill-selected' : '')} style={{ width: fill + '%' }}>
                    <StarIcon className="h-5 w-5 max-w-none text-amber-400" filled />
                  </span>
                </span>
                {clickFeedback && stars === rating && (
                  <span key={'click-' + celebration} aria-hidden="true" className="cover-rating-click-effect">
                    <i /><i /><i /><i />
                  </span>
                )}
              </button>
            );
          })}
          {showAverage && !error && (
            <span id={summaryId} role="tooltip" className="cover-rating-tooltip">
              {summaryLabel}
            </span>
          )}
        </div>
        <div aria-hidden="true" className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 lg:inline">Próxima capa</span>
          <button type="button" onClick={onNext} aria-label="Próxima capa" title="Próxima capa" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{summaryLabel}</span>
      {error && <p role="alert" className="cover-rating-error">{error}</p>}
    </div>
  );
};

export default CoverRatingControls;
