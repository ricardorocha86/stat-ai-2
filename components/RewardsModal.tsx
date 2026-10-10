import React, { useEffect, useRef, useState } from 'react';
import { REWARDS, Reward, rewardThreshold } from '../data/rewards';
import { RewardClaim, RewardId, USER_TYPE_LABELS } from '../types';
import { fetchAllRewardClaims, setRewardClaimDelivered } from '../services/firebaseService';
import { fireConfetti } from './Confetti';
import RewardArt from './RewardArt';
import { XMarkIcon } from './Icons';

interface RewardsModalProps {
  completedCount: number;
  totalCount: number;
  openedRewards: Set<RewardId>;
  onOpenReward: (rewardId: RewardId) => Promise<void>;
  onClose: () => void;
  studentName: string;
  // The professor's list of who opened the prizes delivered in person.
  showClaimsList: boolean;
}

// Rays behind the art, as in "Quem é esse Pokémon?": blue while hidden, the prize's colors once revealed.
type RayColors = { a: string; b: string };
const HIDDEN_RAYS: RayColors = { a: '#1e40af', b: '#2563eb' };
const REVEALED_RAYS: Record<RewardId, RayColors> = {
  xarope: { a: '#475569', b: '#64748b' },
  foto: { a: '#0284c7', b: '#38bdf8' },
  bombom: { a: '#db2777', b: '#f472b6' },
  bonus: { a: '#d97706', b: '#fbbf24' },
  kitkat: { a: '#b91c1c', b: '#ef4444' },
};

const raysStyle = ({ a, b }: RayColors) => ({ '--ray-a': a, '--ray-b': b } as React.CSSProperties);

const exercisesLabel = (count: number) => `${count} ${count === 1 ? 'exercício' : 'exercícios'}`;

const RewardCard: React.FC<{
  reward: Reward;
  threshold: number;
  completedCount: number;
  isOpened: boolean;
  onOpen: () => Promise<void>;
  studentName: string;
}> = ({ reward, threshold, completedCount, isOpened, onOpen, studentName }) => {
  // 'shaking' plays while the prize is saved; 'shown' runs the flash once it is revealed.
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'shown'>('idle');
  const [error, setError] = useState<string | null>(null);
  const reached = completedCount >= threshold;
  const isRevealed = isOpened && phase !== 'shaking';
  const remaining = threshold - completedCount;

  const handleReveal = async () => {
    setError(null);
    setPhase('shaking');
    try {
      await Promise.all([onOpen(), new Promise(resolve => setTimeout(resolve, 900))]);
      setPhase('shown');
      fireConfetti(90);
    } catch (revealError) {
      console.error('Erro ao abrir o prêmio:', revealError);
      setPhase('idle');
      setError('Não foi possível abrir agora. Tente de novo.');
    }
  };

  return (
    <article className="flex w-52 flex-shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-auto">
      <div className="relative aspect-square overflow-hidden" style={raysStyle(isRevealed ? REVEALED_RAYS[reward.id] : HIDDEN_RAYS)}>
        <div className="reward-rays absolute -inset-1/2" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 58%)' }} />
        <RewardArt
          id={reward.id}
          silhouette={!isRevealed}
          className={`relative h-full w-full p-3 ${phase === 'shaking' ? 'reward-shake' : ''} ${phase === 'shown' ? 'reward-pop' : ''}`}
        />
        {phase === 'shown' && <div className="reward-flash pointer-events-none absolute inset-0 bg-white" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {reward.percent}% · {exercisesLabel(threshold)}
        </p>
        <h3 className="font-bold leading-tight text-slate-800">{isRevealed ? reward.title : '???'}</h3>
        {isRevealed ? (
          <>
            <p className="text-sm text-slate-600">{reward.description}</p>
            {reward.delivered === 'professor' && (
              <p className="mt-auto rounded-lg border-2 border-dashed border-rose-300 bg-rose-50 px-2 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-rose-700">
                Vale para {studentName}
              </p>
            )}
          </>
        ) : !reached ? (
          <p className="text-sm text-slate-500">Faltam {exercisesLabel(remaining)}</p>
        ) : !reward.ready ? (
          <p className="w-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Chega em breve</p>
        ) : (
          <button
            onClick={handleReveal}
            disabled={phase === 'shaking'}
            className="mt-auto rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-3 py-2 text-sm font-bold text-white animate-pulse-glow hover:from-indigo-600 hover:to-purple-700 disabled:animate-none disabled:opacity-80"
          >
            {phase === 'shaking' ? 'Revelando…' : 'Revelar!'}
          </button>
        )}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
    </article>
  );
};

const ClaimsList: React.FC = () => {
  const [claims, setClaims] = useState<RewardClaim[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllRewardClaims()
      .then(setClaims)
      .catch(listError => {
        console.error('Erro ao carregar a lista de prêmios:', listError);
        setError('Não foi possível carregar a lista.');
      });
  }, []);

  const setDelivered = (claimId: string, delivered: boolean) =>
    setClaims(previous => previous && previous.map(claim => claim.id === claimId ? { ...claim, delivered } : claim));

  const handleToggle = async (claim: RewardClaim) => {
    setError(null);
    setDelivered(claim.id, !claim.delivered);
    try {
      await setRewardClaimDelivered(claim.id, !claim.delivered);
    } catch (saveError) {
      console.error('Erro ao marcar a entrega:', saveError);
      setDelivered(claim.id, claim.delivered);
      setError('Não foi possível salvar. Tente de novo.');
    }
  };

  if (!claims) return <p className="mt-3 text-sm text-slate-500">{error || 'Carregando…'}</p>;

  return (
    <div className="mt-3 space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {REWARDS.filter(reward => reward.delivered === 'professor').map(reward => {
        const rewardClaims = claims
          .filter(claim => claim.rewardId === reward.id)
          .sort((a, b) => (a.openedAt?.getTime() || 0) - (b.openedAt?.getTime() || 0));
        return (
          <div key={reward.id}>
            <h4 className="text-sm font-semibold text-slate-700">{reward.title} ({rewardClaims.length})</h4>
            {rewardClaims.length === 0 ? (
              <p className="text-sm text-slate-500">Ninguém abriu ainda.</p>
            ) : (
              <ul className="mt-1 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {rewardClaims.map(claim => (
                  <li key={claim.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                      <input type="checkbox" checked={claim.delivered} onChange={() => handleToggle(claim)} className="h-4 w-4" />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${claim.delivered ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{claim.name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {[claim.userType && USER_TYPE_LABELS[claim.userType], claim.email, claim.openedAt?.toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">{claim.delivered ? 'Entregue' : 'Pendente'}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

const RewardsModal: React.FC<RewardsModalProps> = ({
  completedCount, totalCount, openedRewards, onOpenReward, onClose, studentName, showClaimsList,
}) => {
  const [isClaimsListOpen, setIsClaimsListOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const percentage = totalCount > 0 ? Math.min(100, (completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rewards-title"
        onClick={event => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-slate-50 p-4 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="rewards-title" className="text-2xl font-black tracking-tight text-slate-900">Quem é esse prêmio?</h2>
            <p className="mt-1 text-sm text-slate-600">
              {completedCount} de {totalCount} exercícios verificados. Cada marco revela um prêmio.
            </p>
          </div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        <div className="mx-3 mb-12 mt-6">
          <div className="relative h-3 rounded-full bg-slate-200">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
            {REWARDS.map(reward => {
              const threshold = rewardThreshold(reward, totalCount);
              const reached = completedCount >= threshold;
              return (
                <div key={reward.id} className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${reward.percent}%` }}>
                  <span className={`h-5 w-5 rounded-full border-4 ${reached ? 'border-white bg-blue-600' : 'border-white bg-slate-300'} shadow`} />
                  <span className="absolute top-6 whitespace-nowrap text-center text-[11px] font-semibold leading-tight text-slate-600">
                    {reward.percent}%<br /><span className="font-normal text-slate-500">{threshold}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {REWARDS.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              threshold={rewardThreshold(reward, totalCount)}
              completedCount={completedCount}
              isOpened={openedRewards.has(reward.id)}
              onOpen={() => onOpenReward(reward.id)}
              studentName={studentName}
            />
          ))}
        </div>

        {showClaimsList && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <button onClick={() => setIsClaimsListOpen(open => !open)} aria-expanded={isClaimsListOpen} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              {isClaimsListOpen ? 'Esconder a lista do professor' : 'Lista do professor: quem abriu os prêmios'}
            </button>
            {isClaimsListOpen && <ClaimsList />}
          </section>
        )}
      </div>

      <style>{`
        .reward-rays {
          background: repeating-conic-gradient(var(--ray-a) 0deg 10deg, var(--ray-b) 10deg 20deg);
          animation: reward-spin 40s linear infinite;
        }
        @keyframes reward-spin { to { transform: rotate(360deg); } }
        @keyframes reward-shake {
          0%, 100% { transform: rotate(0) scale(1); }
          20% { transform: rotate(-7deg) scale(1.04); }
          40% { transform: rotate(6deg) scale(1.06); }
          60% { transform: rotate(-5deg) scale(1.08); }
          80% { transform: rotate(4deg) scale(1.1); }
        }
        .reward-shake { animation: reward-shake 0.45s ease-in-out infinite; }
        @keyframes reward-pop {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .reward-pop { animation: reward-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes reward-flash { from { opacity: 1; } to { opacity: 0; } }
        .reward-flash { animation: reward-flash 0.6s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .reward-rays, .reward-shake, .reward-pop { animation: none; }
          .reward-flash { display: none; }
        }
      `}</style>
    </div>
  );
};

export default RewardsModal;
