import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementDisplayState,
  Achievements,
  AchievementMilestone,
  ArtifactData,
  CardMarcoArtifact,
  SeloArtifact,
  AnotacaoArtifact,
  CartaArtifact,
  DiplomaArtifact,
  UserProfile,
} from '../types';
import {
  XCircleIcon,
  CubeIcon,
  StarIcon,
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  TrophyIcon,
  PaperAirplaneIcon,
  DownloadIcon,
} from './Icons';

interface AchievementModalProps {
  achievementData: AchievementDisplayState;
  onClose: () => void;
  achievements: Achievements;
  onRetry: () => void;
  onRegenerate: () => void;
  userProfile: UserProfile;
}

const achievementSteps: { milestone: AchievementMilestone; icon: React.ReactNode; title: string }[] = [
  { milestone: 10, icon: <CubeIcon className="w-6 h-6" />, title: 'Card' },
  { milestone: 20, icon: <SparklesIcon className="w-6 h-6" />, title: 'Selo' },
  { milestone: 30, icon: <BoltIcon className="w-6 h-6" />, title: 'Anotação' },
  { milestone: 40, icon: <PaperAirplaneIcon className="w-6 h-6" />, title: 'Carta' },
  { milestone: 50, icon: <TrophyIcon className="w-6 h-6" />, title: 'Diploma' },
];

const stageLabels: Record<number, string> = {
  10: 'Escrevendo o reconhecimento do Prof. Ricardo',
  20: 'Forjando o selo de mestria',
  30: 'Registrando anotação no caderno do mentor',
  40: 'Compondo a carta do Prof. Ricardo',
  50: 'Outorgando o diploma de domínio sustentado',
};

const photoSrc = (profile: UserProfile): string | null => {
  if (!profile?.photoBase64) return null;
  const value = profile.photoBase64;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  return `data:${profile.photoMimeType || 'image/png'};base64,${value}`;
};

const initialsOf = (name: string | undefined): string => {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '·';
};

const PhotoAvatar: React.FC<{ profile: UserProfile; size: number; className?: string }> = ({ profile, size, className }) => {
  const src = photoSrc(profile);
  const style = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={profile.name || 'Aluna'}
        style={style}
        className={`rounded-full object-cover border-2 border-amber-300/70 shadow-lg ${className || ''}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`rounded-full bg-slate-700 border-2 border-amber-300/70 shadow-lg flex items-center justify-center font-bold text-amber-200 ${className || ''}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initialsOf(profile?.name)}</span>
    </div>
  );
};

// ---------------- Artifact renderers ----------------

const CardMarcoView: React.FC<{ data: CardMarcoArtifact; profile: UserProfile }> = ({ data, profile }) => (
  <div className="bg-slate-50 text-slate-900 rounded-xl p-8 shadow-xl flex flex-col items-center text-center gap-5">
    <PhotoAvatar profile={profile} size={104} />
    <div>
      <p className="uppercase tracking-[0.2em] text-xs text-slate-500 mb-2">Marco de Trabalho</p>
      <h3 className="text-2xl font-bold text-slate-800">{data.titulo}</h3>
    </div>
    <p className="text-slate-700 text-sm font-medium leading-relaxed">{data.reconhecimento}</p>
    <p className="text-slate-600 text-sm leading-relaxed">{data.corpo}</p>
    <div className="w-12 h-px bg-slate-300" />
    <p className="text-slate-700 text-sm italic leading-relaxed">{data.projecao}</p>
    <p className="text-xs text-slate-400 mt-2">— Prof. Ricardo</p>
  </div>
);

const SeloView: React.FC<{ data: SeloArtifact; profile: UserProfile }> = ({ data, profile }) => (
  <div className="bg-gradient-to-br from-amber-50 to-amber-100 text-slate-900 rounded-xl p-7 shadow-xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, #d97706 0, transparent 40%), radial-gradient(circle at 80% 90%, #b45309 0, transparent 40%)' }} />
    <div className="relative">
      <div className="absolute inset-0 rounded-full border-4 border-amber-500/50" />
      <PhotoAvatar profile={profile} size={120} className="!border-amber-500" />
    </div>
    <p className="relative uppercase tracking-[0.25em] text-[10px] text-amber-700 font-bold">Selo de Mestria</p>
    <h3 className="relative text-xl font-bold text-amber-900">{data.titulo_selo}</h3>
    <div className="relative w-full space-y-3 text-sm leading-relaxed">
      <p className="text-slate-800"><span className="font-semibold text-amber-800">Virtude reconhecida.</span> {data.virtude_reconhecida}</p>
      <p className="text-slate-700"><span className="font-semibold text-amber-800">Princípio.</span> {data.principio}</p>
      <p className="text-slate-700"><span className="font-semibold text-amber-800">Convite.</span> {data.convite}</p>
    </div>
    <p className="relative text-xs text-amber-800/70 mt-2">— Prof. Ricardo</p>
  </div>
);

const AnotacaoView: React.FC<{ data: AnotacaoArtifact; profile: UserProfile }> = ({ data, profile }) => (
  <div className="bg-[#f7f2e7] text-slate-800 rounded-xl p-7 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(transparent 95%, rgba(120,80,40,0.08) 100%)', backgroundSize: '100% 28px' }}>
    <div className="absolute top-0 right-6 flex flex-col items-center">
      <div className="w-12 h-16 bg-amber-700 rounded-b-md shadow-md" />
      <PhotoAvatar profile={profile} size={56} className="!border-amber-700 -mt-3" />
    </div>
    <p className="text-xs text-amber-900/70 font-mono mb-3">{data.data_simbolica}</p>
    <p className="font-serif text-lg text-slate-800 leading-relaxed italic">{data.abertura}</p>
    <p className="font-serif text-base text-slate-700 leading-relaxed mt-4">{data.observacao}</p>
    <p className="font-serif text-base text-slate-800 leading-relaxed mt-4 italic">{data.fechamento}</p>
    <div className="mt-6 text-right">
      <p className="font-serif italic text-slate-700">— Prof. Ricardo</p>
    </div>
  </div>
);

const CartaView: React.FC<{ data: CartaArtifact; profile: UserProfile }> = ({ data, profile }) => (
  <div className="bg-white text-slate-800 rounded-xl p-8 shadow-xl">
    <div className="flex items-center gap-4 border-b border-slate-200 pb-5 mb-5">
      <PhotoAvatar profile={profile} size={64} className="!border-slate-300" />
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Para</p>
        <p className="text-base font-semibold text-slate-800">{profile.name || 'Aluna'}</p>
      </div>
    </div>
    <p className="font-serif text-lg text-slate-800 mb-4">{data.saudacao}</p>
    <div className="space-y-4 font-serif text-base text-slate-700 leading-relaxed">
      {data.paragrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
    <p className="font-serif text-base text-slate-800 mt-6">{data.fecho}</p>
    <p className="font-serif text-base font-semibold text-slate-800 mt-2">{data.assinatura}</p>
  </div>
);

const DiplomaView: React.FC<{ data: DiplomaArtifact; profile: UserProfile; printRef?: React.Ref<HTMLDivElement> }> = ({ data, profile, printRef }) => (
  <div
    ref={printRef}
    className="bg-[#fbf7ec] text-slate-900 rounded-xl p-10 shadow-xl border-8 border-double border-amber-700/30 text-center"
  >
    <div className="border border-amber-700/30 rounded-md p-8 flex flex-col items-center gap-4">
      <p className="font-serif uppercase tracking-[0.35em] text-xs text-amber-800">Stat-AI · Portal de Estatística</p>
      <PhotoAvatar profile={profile} size={120} className="!border-amber-700" />
      <p className="font-serif text-sm text-slate-700">Outorgado a</p>
      <h3 className="font-serif text-3xl font-bold text-slate-900">{profile.name || 'Aluna'}</h3>
      <div className="w-32 h-px bg-amber-700/40 my-1" />
      <h4 className="font-serif text-lg font-semibold text-amber-900 leading-tight max-w-md">
        {data.titulo_concedido}
      </h4>
      <p className="font-serif text-sm text-slate-700 leading-relaxed max-w-md">{data.considerando}</p>
      <p className="font-serif text-sm italic text-slate-800 max-w-md">{data.outorga}</p>
      <p className="font-mono text-xs text-slate-600 mt-3">{data.data_simbolica}</p>
      <p className="font-serif text-base font-semibold text-slate-800 mt-1">Prof. Ricardo</p>
    </div>
  </div>
);

const ArtifactView: React.FC<{ artifact: ArtifactData; profile: UserProfile; printRef?: React.Ref<HTMLDivElement> }> = ({
  artifact,
  profile,
  printRef,
}) => {
  switch (artifact.kind) {
    case 'card_marco':
      return <CardMarcoView data={artifact} profile={profile} />;
    case 'selo':
      return <SeloView data={artifact} profile={profile} />;
    case 'anotacao':
      return <AnotacaoView data={artifact} profile={profile} />;
    case 'carta':
      return <CartaView data={artifact} profile={profile} />;
    case 'diploma':
      return <DiplomaView data={artifact} profile={profile} printRef={printRef} />;
    default:
      return null;
  }
};

// ---------------- Audio player ----------------

const AudioPlayer: React.FC<{ src: string; transcript: string }> = ({ src, transcript }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const hasTranscript = transcript.trim().length > 0;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isPlaying ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
          }`}
          aria-label={isPlaying ? 'Pausar' : 'Tocar áudio do Prof. Ricardo'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-200">Mensagem do Prof. Ricardo</p>
          <p className="text-xs text-slate-400">Toque para ouvir</p>
        </div>
        {hasTranscript && (
          <button
            onClick={() => setShowTranscript((s) => !s)}
            className="text-xs text-slate-300 hover:text-amber-200 underline decoration-dotted"
          >
            {showTranscript ? 'Ocultar transcricao' : 'Ver transcricao'}
          </button>
        )}
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
      {hasTranscript && showTranscript && (
        <p className="text-sm text-slate-200 leading-relaxed border-l-2 border-amber-400/60 pl-3 italic">
          {transcript}
        </p>
      )}
    </div>
  );
};

// ---------------- Main modal ----------------

const AchievementModal: React.FC<AchievementModalProps> = ({
  achievementData,
  onClose,
  achievements,
  onRetry,
  onRegenerate,
  userProfile,
}) => {
  const [timer, setTimer] = useState(0);
  const diplomaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: number | undefined;
    if (achievementData.isLoading) {
      setTimer(0);
      interval = window.setInterval(() => setTimer((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [achievementData.isLoading]);

  const isLoading = achievementData.isLoading;
  const error = achievementData.error;
  const artifact = achievementData.artifact;
  const audioUrl = achievementData.audioUrl;

  const handleDiplomaDownload = async () => {
    if (achievementData.kind !== 'diploma' || !diplomaRef.current) return;
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(diplomaRef.current, { scale: 2, backgroundColor: '#fbf7ec' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const w = pageW - 20;
      const h = w * ratio;
      const y = Math.max(10, (pageH - h) / 2);
      pdf.addImage(imgData, 'PNG', 10, y, w, Math.min(h, pageH - 20));
      pdf.save(`diploma-statai-${userProfile.name?.split(' ')[0] || 'aluno'}.pdf`);
    } catch (e) {
      console.error('Erro ao gerar PDF do diploma:', e);
    }
  };

  const loadingMessage = 'O Prof. Ricardo está preparando uma mensagem especial para você.';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl text-white relative transform animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute -top-3 -right-3 text-slate-400 hover:text-white transition-colors z-10">
          <XCircleIcon className="w-9 h-9 bg-slate-800 rounded-full" />
        </button>

        <div className="p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
          {/* Tracker */}
          <div>
            <h3 className="text-center font-bold text-lg text-amber-300 mb-1">Marcos com o Prof. Ricardo</h3>
            <p className="text-center text-sm text-slate-400 mb-5">
              Você completou {achievementData.milestone} exercícios.
            </p>
            <div className="flex items-center justify-between">
              {achievementSteps.map((step, index) => {
                const isUnlocked = !!achievements[step.milestone];
                const isCurrent = step.milestone === achievementData.milestone;
                const iconBg = isCurrent ? 'bg-amber-400 animate-pulse-glow' : isUnlocked ? 'bg-green-500' : 'bg-slate-600';
                const iconText = isCurrent ? 'text-slate-900' : isUnlocked ? 'text-white' : 'text-slate-400';
                const line = isUnlocked ? 'bg-green-500' : 'bg-slate-600';
                return (
                  <React.Fragment key={step.milestone}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg} transition-colors duration-500`}>
                        {isUnlocked && !isCurrent ? (
                          <CheckIcon className="w-7 h-7 text-white" />
                        ) : (
                          React.cloneElement(step.icon as React.ReactElement<{ className?: string }>, {
                            className: `w-7 h-7 ${iconText}`,
                          })
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-semibold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {step.milestone}
                      </span>
                    </div>
                    {index < achievementSteps.length - 1 && (
                      <div className={`flex-1 h-1 rounded-full mx-2 ${line} transition-colors duration-500`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="w-full border-t border-slate-700/50" />

          {isLoading ? (
            <div className="bg-slate-800/60 rounded-xl p-10 text-center min-h-[18rem] flex items-center justify-center">
              <div>
                <span className="text-5xl animate-pulse">✦</span>
                <p className="mt-4 font-semibold text-slate-200">{loadingMessage}</p>
                <p className="mt-2 text-slate-500 font-mono text-xs">{timer}s</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/40 rounded-xl p-10 text-center min-h-[14rem] flex items-center justify-center">
              <div>
                <XCircleIcon className="w-12 h-12 text-red-400 mx-auto" />
                <p className="mt-4 font-semibold text-slate-100">Não consegui gerar a recompensa</p>
                <p className="mt-1 text-sm text-slate-300 max-w-md mx-auto">{error}</p>
                <button
                  onClick={onRetry}
                  className="mt-6 bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Tentar de novo
                </button>
              </div>
            </div>
          ) : artifact || audioUrl ? (
            <div className="flex flex-col gap-5">
              {artifact && achievementData.milestone !== 10 && (
                <ArtifactView artifact={artifact} profile={userProfile} printRef={diplomaRef} />
              )}

              {audioUrl && (
                <AudioPlayer src={audioUrl} transcript={achievementData.transcricao || ''} />
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-700/50">
                {achievementData.kind === 'diploma' && (
                  <button
                    onClick={handleDiplomaDownload}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Baixar diploma (PDF)
                  </button>
                )}
                <button
                  onClick={onRegenerate}
                  disabled={achievementData.isRegenerating}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {achievementData.isRegenerating ? 'Gerando outra versão…' : 'Gerar outra versão'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <style>{`
          @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scale-in { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards }
          .animate-scale-in { animation: scale-in 0.3s ease-out forwards }
        `}</style>
      </div>
    </div>
  );
};

export default AchievementModal;


