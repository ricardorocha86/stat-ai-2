
import React, { useState, useEffect } from 'react';
import { GoogleIcon, StatAiIcon, StarIcon, ChevronRightIcon, ExclamationTriangleIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
}

const TOTAL_COVERS = 107;

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [coverIndex, setCoverIndex] = useState<number>(1);
  const [rating, setRating] = useState<number>(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Função auxiliar para gerar URL
  const getCoverUrl = (index: number) => {
    const paddedIndex = String(index).padStart(3, '0');
    return `/capas/capa_statai_${paddedIndex}.jpg`;
  };

  // Inicializa com capa aleatória
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TOTAL_COVERS) + 1;
    setCoverIndex(randomIndex);
  }, []);

  // PRECARREGAMENTO (Preloading)
  useEffect(() => {
    const imgCurrent = new Image();
    imgCurrent.src = getCoverUrl(coverIndex);

    const nextIndex = coverIndex >= TOTAL_COVERS ? 1 : coverIndex + 1;
    const imgNext = new Image();
    imgNext.src = getCoverUrl(nextIndex);
  }, [coverIndex]);

  const handleNextCover = () => {
    setIsImageLoaded(false);
    setImageError(false);
    setRating(0);
    setCoverIndex((prev) => (prev >= TOTAL_COVERS ? 1 : prev + 1));
  };

  const handleRate = (stars: number) => {
    setRating(stars);
  };

  const currentCoverUrl = getCoverUrl(coverIndex);

  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row overflow-hidden font-sans bg-slate-50">
      
      {/* LADO ESQUERDO (Topo no mobile): Área da Imagem */}
      <div className="relative w-full lg:w-[65%] h-[35%] lg:h-full flex items-center justify-center p-4 lg:p-16 bg-slate-100 flex-shrink-0">
        
        {/* Número da imagem (Temporário) */}
        <div className="absolute top-2 right-2 text-[10px] text-slate-400 opacity-60 font-mono select-none pointer-events-none">
            #{coverIndex}
        </div>

        {/* Moldura da Imagem */}
        <div className="relative flex items-center justify-center w-full h-full max-h-[90%] lg:max-h-[75vh] max-w-[90%]">
            {!imageError ? (
                <img 
                    key={currentCoverUrl}
                    src={currentCoverUrl}
                    alt="Capa Artística"
                    className={`w-auto h-auto max-w-full max-h-full object-contain shadow-2xl rounded-lg transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => {
                        setImageError(true);
                        setIsImageLoaded(true); 
                    }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 bg-slate-200 w-full h-full rounded-lg">
                    <ExclamationTriangleIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm">Imagem indisponível</p>
                </div>
            )}
        </div>

        {/* Logo discreto no topo - Escondido em telas pequenas para economizar espaço */}
        <div className="absolute top-4 left-4 lg:top-8 lg:left-8 hidden lg:block">
             <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <StatAiIcon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-slate-700 font-bold tracking-tight text-lg">Stat-AI</span>
             </div>
        </div>

        {/* Barra de Controles */}
        <div className="absolute bottom-4 lg:bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-300 rounded-full px-4 py-2 lg:px-6 lg:py-3 flex items-center gap-4 lg:gap-6 shadow-xl scale-75 lg:scale-100 origin-bottom">
                
                {/* Votação */}
                <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star}
                            onClick={() => handleRate(star)}
                            className="group focus:outline-none transition-transform active:scale-110"
                        >
                            <StarIcon 
                                className={`w-5 h-5 transition-colors ${star <= rating ? 'text-yellow-500 drop-shadow-sm' : 'text-slate-400 group-hover:text-slate-600'}`} 
                                filled={star <= rating} 
                            />
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-slate-300"></div>

                {/* Navegação */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Próxima capa</span>
                    <button 
                        onClick={handleNextCover}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                        title="Próxima Capa"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* LADO DIREITO (Baixo no mobile): Login */}
      <div className="w-full lg:w-[35%] h-[65%] lg:h-full flex flex-col justify-center px-8 sm:px-14 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-2xl z-10 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto py-8 lg:py-0">
            <div className="mb-6 lg:mb-10 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-600 text-white mb-4 lg:mb-6 lg:hidden shadow-lg shadow-blue-200">
                    <StatAiIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 mb-2 lg:mb-3 tracking-tight">Bem-vindo</h1>
                <p className="text-slate-500 text-sm lg:text-lg">Faça login para acessar o portal do aluno.</p>
            </div>

            {/* Botão de Login */}
            <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-4 bg-blue-600 text-white font-bold py-3 lg:py-4 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 group text-sm lg:text-base"
            >
                <div className="bg-white p-1 rounded-full">
                    <GoogleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <span>Entrar com Google</span>
            </button>
            
            <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] lg:text-xs text-slate-400 font-semibold tracking-wide uppercase">Stat-AI V2.0 - Portal de Estatística</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
