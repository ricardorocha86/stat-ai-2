import React, { useEffect, useRef, useState } from 'react';
import { loadSigmaGameSession } from '../../services/sigmaGameService';
import { validGameSnapshot, type GameSaveSession, type GameSaveStatus, type GameSnapshot } from '../../services/gameSaveSession';

const CHANNEL = 'statai-sigma-v1';
const STATUS_TEXT: Record<GameSaveStatus, string> = {
  ready: 'Pronto para começar',
  saving: 'Salvando na sua conta…',
  saved: 'Progresso salvo na sua conta',
  offline: 'Sem conexão. O progresso fica neste aparelho até sincronizar.',
  error: 'Sincronização pendente. Tentaremos novamente automaticamente.',
};

type GameWindow = Window & { statAiSigma?: { capture: () => GameSnapshot; toggleMute: () => void } };

export default function SigmaGamePage({ userId }: { userId: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSaveSession | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GameSaveStatus>('ready');

  useEffect(() => {
    let active = true;
    let session: GameSaveSession | null = null;
    // Retain the DOM node for the cleanup, before React removes the iframe ref.
    let gameFrame: HTMLIFrameElement | null = null;
    setReady(false);
    setFrameReady(false);
    setError(null);
    const capture = () => {
      const frame = gameFrame || frameRef.current;
      const snapshot = (frame?.contentWindow as GameWindow | null)?.statAiSigma?.capture();
      if (snapshot && session) session.update(snapshot);
      void session?.flush();
    };
    const message = (event: MessageEvent) => {
      const frame = frameRef.current;
      if (!active || !session || event.origin !== window.location.origin || event.source !== frame?.contentWindow
        || event.data?.channel !== CHANNEL) return;
      gameFrame = frame;
      if (event.data.type === 'ready') {
        frame.contentWindow?.postMessage({ channel: CHANNEL, type: 'init', snapshot: session.initial }, window.location.origin);
      } else if (event.data.type === 'started') {
        setMuted(Boolean(event.data.muted));
        setFrameReady(true);
      } else if (event.data.type === 'audio' && typeof event.data.muted === 'boolean') {
        setMuted(event.data.muted);
      } else if (event.data.type === 'save' && validGameSnapshot(event.data.snapshot)) {
        session.update(event.data.snapshot);
      }
    };
    window.addEventListener('message', message);
    window.addEventListener('pagehide', capture);
    const onVisibility = () => { if (document.visibilityState === 'hidden') capture(); };
    document.addEventListener('visibilitychange', onVisibility);
    loadSigmaGameSession(userId, next => { if (active) setStatus(next); }).then(loaded => {
      if (!active) { loaded.dispose(); return; }
      session = loaded;
      sessionRef.current = loaded;
      setReady(true);
    }).catch(() => {
      if (active) setError('Não foi possível carregar o progresso da sua conta. Confira a conexão e tente novamente.');
    });
    return () => {
      active = false;
      capture();
      session?.dispose();
      sessionRef.current = null;
      window.removeEventListener('message', message);
      window.removeEventListener('pagehide', capture);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId, attempt]);

  const saveNow = () => {
    const snapshot = (frameRef.current?.contentWindow as GameWindow | null)?.statAiSigma?.capture();
    if (snapshot) sessionRef.current?.update(snapshot);
    void sessionRef.current?.flush();
    frameRef.current?.focus();
  };

  const fullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current.requestFullscreen();
      frameRef.current?.focus();
    } catch { frameRef.current?.focus(); }
  };

  const toggleMute = () => {
    (frameRef.current?.contentWindow as GameWindow | null)?.statAiSigma?.toggleMute();
  };

  return (
    <section className="mx-auto flex max-w-[1440px] flex-col gap-4 p-3 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">O Reino dos Dados</h2>
          <p className="mt-1 text-sm text-slate-600">Explore Datália e aprenda estatística em uma aventura 2D.</p>
        </div>
        <button type="button" onClick={saveNow} disabled={!frameReady} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">Salvar agora</button>
      </div>
      <p role="status" className={`text-sm ${status === 'error' || status === 'offline' ? 'text-amber-800' : 'text-slate-600'}`}>
        {ready ? STATUS_TEXT[status] : 'Carregando o progresso da sua conta…'}
      </p>
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Tentar novamente</button>
        </div>
      ) : (
        <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-slate-700 bg-[#07060c] shadow-xl" style={{ height: 'min(72dvh, 820px)', minHeight: 320 }}>
          {ready && <iframe ref={frameRef} src="/games/lenda-de-sigma/index.html" title="A Lenda de Sigma — O Reino dos Dados" className="h-full w-full border-0" allow="autoplay; fullscreen; gamepad" allowFullScreen />}
          {!frameReady && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">Preparando a aventura…</div>}
          <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={toggleMute} disabled={!frameReady} aria-label={muted ? 'Ativar som do jogo' : 'Silenciar jogo'} aria-pressed={muted} title="Silenciar ou ativar som (V)" className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:hidden">{muted ? 'Ativar som' : 'Silenciar'}</button>
            <button type="button" onClick={fullscreen} disabled={!frameReady} aria-label="Alternar tela cheia do jogo" className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:hidden">⛶ Tela cheia</button>
          </div>
        </div>
      )}
      <p className="text-xs leading-relaxed text-slate-500">Clique no jogo para usar o teclado. Mova com as setas ou WASD; Z ataca e confirma. De frente para um bloco, pressione Z para puxá-lo uma casa e recuar junto. X pula, C usa o item, Q troca o item e Enter abre o menu. V silencia ou ativa o som; M abre o mapa. Ajuste os volumes em Enter → Sistema. No celular, use os controles de toque. O progresso é salvo automaticamente; ao voltar, escolha Continuar. Combates e enigmas em andamento recomeçam na sala.</p>
    </section>
  );
}
