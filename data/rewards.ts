import { RewardId } from '../types';

export interface Reward {
  id: RewardId;
  // Share of the verified exercises that unlocks the prize.
  percent: number;
  title: string;
  description: string;
  // Physical prizes and the grade bonus: the professor sees who opened them and marks them as delivered.
  delivered: 'app' | 'professor';
  // false while the prize content is not prepared yet; the silhouette shows "em breve".
  ready: boolean;
}

export const REWARDS: Reward[] = [
  {
    id: 'xarope',
    percent: 20,
    title: 'Professor Xarope',
    description: 'O tutor mal-humorado e sem filtro foi liberado. Escolha o 😤 no topo do chat.',
    delivered: 'app',
    ready: true,
  },
  {
    id: 'foto',
    percent: 40,
    title: 'Foto com o professor',
    description: '',
    delivered: 'app',
    ready: false,
  },
  {
    id: 'bombom',
    percent: 60,
    title: 'Vale-bombom Sonho de Valsa',
    description: 'Mostre esta tela ao professor e retire seu bombom.',
    delivered: 'professor',
    ready: true,
  },
  {
    id: 'bonus',
    percent: 80,
    title: '+0,2 na média final',
    description: 'Bônus de 0,2 ponto na média final da disciplina. Seu nome já está na lista do professor.',
    delivered: 'professor',
    ready: true,
  },
  {
    id: 'kitkat',
    percent: 100,
    title: 'Vale-KitKat',
    description: 'Mostre esta tela ao professor e retire seu KitKat.',
    delivered: 'professor',
    ready: true,
  },
];

// Rounded up, so each mark needs at least its share: 14, 28, 41, 55 and 68 of 68 exercises.
export const rewardThreshold = (reward: Reward, totalCount: number) =>
  Math.ceil((reward.percent / 100) * totalCount);

export const XAROPE_REWARD = REWARDS[0];
