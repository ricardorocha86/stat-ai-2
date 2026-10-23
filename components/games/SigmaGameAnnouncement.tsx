import React from 'react';

// Destaque da página inicial anunciando o jogo A Lenda de Sigma.
// O cenário (céu do título, montanhas em sino e os seis Cristais da Razão) é desenhado em CSS/SVG.

const STARS = [[6, 12], [14, 30], [22, 8], [31, 22], [40, 6], [48, 34], [57, 14], [66, 26], [74, 9], [83, 20], [91, 32], [96, 11], [36, 40], [70, 42], [12, 46]];
const CRYSTALS = ['#5ad04a', '#7ae4ff', '#ffc84a', '#ff6a5a', '#7ab8ff', '#ff9ae6'];

// curva normal como silhueta das montanhas (pontos de uma gaussiana)
const bell = (cx: number, sd: number, h: number, base: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= 400; x += 8) pts.push(`${x},${(base - h * Math.exp(-(((x - cx) / sd) ** 2) / 2)).toFixed(1)}`);
  return `M0,120 L${pts.join(' L')} L400,120 Z`;
};

export default function SigmaGameAnnouncement({ onPlay }: { onPlay: () => void }) {
  return (
    <section
      aria-label="Novidade: novo jogo A Lenda de Sigma"
      className="relative overflow-hidden rounded-2xl shadow-lg"
      style={{ background: 'linear-gradient(180deg, #070420 0%, #22145a 45%, #6a2a7a 78%, #c86a7a 100%)' }}
    >
      <style>{`
        @keyframes sigma-twinkle { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }
        @keyframes sigma-float { 0%, 100% { transform: translateY(0) rotate(45deg) } 50% { transform: translateY(-6px) rotate(45deg) } }
        @media (prefers-reduced-motion: reduce) { .sigma-anim { animation: none !important } }
      `}</style>
      {/* estrelas e lua */}
      {STARS.map(([x, y], i) => (
        <span key={i} aria-hidden="true" className="sigma-anim absolute rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, width: i % 4 ? 2 : 3, height: i % 4 ? 2 : 3, animation: `sigma-twinkle ${2 + (i % 5) * 0.6}s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
      <span aria-hidden="true" className="absolute hidden rounded-full sm:block" style={{ left: '52%', top: '10%', width: 30, height: 30, background: '#fff4dc', boxShadow: '0 0 30px 10px rgba(255,232,192,.35)' }} />
      {/* montanhas em forma de sino de Gauss */}
      <svg aria-hidden="true" viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full">
        <path d={bell(90, 46, 70, 112)} fill="#3a2a6a" />
        <path d={bell(290, 60, 86, 112)} fill="#34266a" />
        <path d="M0,120 L0,104 Q100,92 200,102 T400,98 L400,120 Z" fill="#1c3a3a" />
      </svg>

      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-950 shadow">
            ✨ Novidade · novo jogo
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-indigo-100">A Lenda de </span>
            <span className="bg-gradient-to-b from-yellow-100 to-amber-500 bg-clip-text text-transparent">Sigma</span>
          </h2>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-pink-300">O Reino dos Dados</p>
          <p className="mt-3 text-sm leading-relaxed text-indigo-100">
            Uma aventura para aprender Estatística jogando. Escolha herói ou heroína, enfrente os chefes de cada templo
            com média, mediana, desvio-padrão e probabilidade, e recupere os Cristais da Razão.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:items-end">
          {/* os seis Cristais da Razão */}
          <div aria-hidden="true" className="flex gap-3">
            {CRYSTALS.map((c, i) => (
              <span key={c} className="sigma-anim block h-4 w-4 rounded-sm"
                style={{ background: `linear-gradient(135deg, #ffffff 0%, ${c} 45%, ${c} 100%)`, boxShadow: `0 0 12px ${c}`, animation: `sigma-float ${2.4 + i * 0.25}s ease-in-out ${i * 0.2}s infinite`, transform: 'rotate(45deg)' }} />
            ))}
          </div>
          <button
            onClick={onPlay}
            className="rounded-xl bg-gradient-to-b from-yellow-300 to-amber-500 px-6 py-3 text-base font-bold text-indigo-950 shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-yellow-200"
          >
            Jogar agora →
          </button>
          <p className="text-xs text-indigo-200">O progresso fica salvo na sua conta.</p>
        </div>
      </div>
    </section>
  );
}
