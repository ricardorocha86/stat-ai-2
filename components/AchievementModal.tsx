import React, { useState, useEffect } from 'react';
import { AchievementDisplayState, Achievements, AchievementMilestone } from '../types';
import { XCircleIcon, CubeIcon, StarIcon, CheckIcon, SparklesIcon, BoltIcon, TrophyIcon } from './Icons';

interface AchievementModalProps {
  achievementData: AchievementDisplayState;
  onClose: () => void;
  achievements: Achievements;
  onRetry: () => void;
}

const loadingDetails: { [key: number]: string } = {
    10: "Esboçando seu avatar digital...",
    20: "Aplicando cores vibrantes de pop art...",
    30: "Instalando upgrades de neon cyberpunk...",
    40: "Forjando sua armadura de fantasia épica...",
    50: "Canalizando poder cósmico em seu avatar...",
};

const achievementSteps: { milestone: AchievementMilestone; icon: React.ReactNode; title: string }[] = [
    { milestone: 10, icon: <CubeIcon className="w-6 h-6" />, title: "Esboço" },
    { milestone: 20, icon: <SparklesIcon className="w-6 h-6" />, title: "Pop Art" },
    { milestone: 30, icon: <BoltIcon className="w-6 h-6" />, title: "Cyberpunk" },
    { milestone: 40, icon: <TrophyIcon className="w-6 h-6" />, title: "Fantasia" },
    { milestone: 50, icon: <StarIcon className="w-6 h-6" />, title: "Cósmico" },
];

const AchievementModal: React.FC<AchievementModalProps> = ({ achievementData, onClose, achievements, onRetry }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (achievementData.isLoading) {
        setTimer(0);
        interval = window.setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [achievementData.isLoading]);


  const renderMedia = () => {
    if (achievementData.isLoading) {
        const detailMessage = loadingDetails[achievementData.milestone] || "Criando sua recompensa...";
        return (
            <div className="w-full h-full bg-slate-700/50 rounded-lg flex items-center justify-center min-h-[20rem] md:min-h-0">
                <div className="text-center p-4">
                    <span className="text-5xl animate-pulse">✨</span>
                    <p className="mt-4 font-semibold text-slate-300">{detailMessage}</p>
                    <p className="mt-1 text-sm text-slate-400">Isso pode levar alguns instantes.</p>
                    <p className="mt-2 text-slate-500 font-mono text-xs">Tempo: {timer}s</p>
                </div>
            </div>
        );
    }

    if (achievementData.error) {
        return (
            <div className="w-full h-full bg-red-900/50 rounded-lg flex items-center justify-center min-h-[20rem] md:min-h-0 text-center p-4">
                <div>
                    <XCircleIcon className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="mt-4 font-semibold text-slate-200">Ocorreu um Erro</p>
                    <p className="mt-1 text-sm text-slate-400 max-w-sm">{achievementData.error}</p>
                    <button
                        onClick={onRetry}
                        className="mt-6 bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }


    if (achievementData.type === 'image' && achievementData.contentBase64) {
        return (
            <img src={`data:image/png;base64,${achievementData.contentBase64}`} alt={achievementData.title} className="w-full h-full object-cover rounded-lg border-2 border-amber-400/50 shadow-lg" />
        );
    }
    
    // Fallback for failed generation
    return (
      <div className="w-full h-full bg-red-900/50 rounded-lg flex items-center justify-center min-h-[20rem] md:min-h-0 text-center p-4">
          <div>
              <span className="text-4xl">😢</span>
              <p className="mt-2 text-slate-300">Falha ao gerar a imagem da recompensa.</p>
              <button
                  onClick={onRetry}
                  className="mt-6 bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors"
              >
                  Tentar Novamente
              </button>
          </div>
      </div>
    );
  };


  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl text-white p-6 md:p-8 relative transform animate-scale-in flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute -top-3 -right-3 text-slate-400 hover:text-white transition-colors z-10">
            <XCircleIcon className="w-9 h-9 bg-slate-800 rounded-full" />
        </button>
        
        {/* Progress Tracker */}
        <div className="w-full">
            <h3 className="text-center font-bold text-lg text-amber-300 mb-1">Evolução do Avatar Digital</h3>
            <p className="text-center text-sm text-slate-400 mb-5">Sua evolução a cada marco de conhecimento.</p>
            <div className="flex items-center justify-between">
                {achievementSteps.map((step, index) => {
                    const isUnlocked = !!achievements[step.milestone];
                    const isCurrent = step.milestone === achievementData.milestone;
                    
                    const iconBgClass = isCurrent ? 'bg-amber-400 animate-pulse-glow' : isUnlocked ? 'bg-green-500' : 'bg-slate-600';
                    const iconTextClass = isCurrent ? 'text-slate-900' : isUnlocked ? 'text-white' : 'text-slate-400';
                    const lineClass = isUnlocked ? 'bg-green-500' : 'bg-slate-600';

                    return (
                        <React.Fragment key={step.milestone}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass} transition-colors duration-500`}>
                                    {isUnlocked && !isCurrent ? <CheckIcon className="w-7 h-7 text-white" /> : React.cloneElement(step.icon as React.ReactElement, { className: `w-7 h-7 ${iconTextClass}` })}
                                </div>
                                <span className={`mt-2 text-xs font-semibold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{step.milestone}</span>
                            </div>
                            {index < achievementSteps.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full mx-2 ${lineClass} transition-colors duration-500`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>

        <div className="w-full border-t border-slate-700/50"></div>

        <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column: Media */}
            <div className="w-full md:w-1/2 flex-shrink-0">
              {renderMedia()}
            </div>

            {/* Right Column: Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center">
                <div>
                    <div className="text-center md:text-left">
                      <h2 className="text-3xl font-bold text-amber-300">{achievementData.title || "Prêmio Desbloqueado!"}</h2>
                      <p className="text-slate-300 text-lg">Você completou {achievementData.milestone} exercícios!</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {achievementData.storyText && (
                           <blockquote className="border-l-4 border-slate-600 pl-4">
                             <p className="text-slate-200 text-base leading-relaxed italic">"{achievementData.storyText}"</p>
                           </blockquote>
                        )}
                    </div>
                </div>
            </div>
        </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
       `}</style>
      </div>
    </div>
  );
};

export default AchievementModal;