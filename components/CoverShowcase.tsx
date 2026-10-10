import React, { useEffect, useState } from 'react';
import CoverRatingControls from './CoverRatingControls';
import { ExclamationTriangleIcon } from './Icons';
import { TOTAL_COVERS } from '../services/coverRatingService';

interface CoverShowcaseProps {
  frameClassName: string;
  controlsClassName?: string;
}

const getCoverUrl = (index: number) => `capas/capa_statai_${String(index).padStart(3, '0')}.jpg`;

// A random artistic cover to rate before moving on to the next one (login page and home).
const CoverShowcase: React.FC<CoverShowcaseProps> = ({ frameClassName, controlsClassName = '' }) => {
  const [coverIndex, setCoverIndex] = useState(() => Math.floor(Math.random() * TOTAL_COVERS) + 1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Preload the next cover so "Próxima capa" feels instant.
  useEffect(() => {
    const nextCover = new Image();
    nextCover.src = getCoverUrl(coverIndex >= TOTAL_COVERS ? 1 : coverIndex + 1);
  }, [coverIndex]);

  const handleNextCover = () => {
    setIsImageLoaded(false);
    setImageError(false);
    setCoverIndex(previous => (previous >= TOTAL_COVERS ? 1 : previous + 1));
  };

  const coverUrl = getCoverUrl(coverIndex);

  return (
    <>
      <div className={`relative flex items-center justify-center ${frameClassName}`}>
        {!imageError ? (
          <img
            key={coverUrl}
            src={coverUrl}
            alt="Capa Artística"
            className={`h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setIsImageLoaded(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-slate-200 text-slate-400">
            <ExclamationTriangleIcon className="mb-2 h-12 w-12" />
            <p className="text-sm">Imagem indisponível</p>
          </div>
        )}
      </div>
      <div className={controlsClassName}>
        <CoverRatingControls key={coverIndex} coverNumber={coverIndex} onNext={handleNextCover} imageAvailable={isImageLoaded && !imageError} />
      </div>
    </>
  );
};

export default CoverShowcase;
