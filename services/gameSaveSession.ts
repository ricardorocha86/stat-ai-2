// Account-scoped recovery and ordered writes, independent of the game renderer.
export interface GameSnapshot {
  progress: string | null;
  settings: string | null;
}

export interface GameSave extends GameSnapshot {
  schemaVersion: 1;
  modifiedAt: number;
  revision: string;
}

export type GameSaveStatus = 'ready' | 'saving' | 'saved' | 'offline' | 'error';
interface CachedSave extends GameSave { pending: boolean }

export interface GameSaveSession {
  initial: GameSnapshot;
  update: (snapshot: GameSnapshot) => void;
  flush: () => Promise<void>;
  dispose: () => void;
}

export function validGameSnapshot(value: unknown): value is GameSnapshot {
  if (!value || typeof value !== 'object') return false;
  const { progress, settings } = value as GameSnapshot;
  if ((progress !== null && typeof progress !== 'string') || (settings !== null && typeof settings !== 'string')) return false;
  if (new TextEncoder().encode((progress || '') + (settings || '')).length > 800_000) return false;
  try {
    if (progress !== null) {
      const p = JSON.parse(progress);
      if (!p || typeof p !== 'object' || !Number.isFinite(p.hp) || !Number.isFinite(p.maxHp)
        || !p.items || !p.flags || !p.stats || !Array.isArray(p.crystals)) return false;
    }
    if (settings !== null) {
      const s = JSON.parse(settings);
      if (!s || typeof s !== 'object' || !Number.isFinite(s.m) || !Number.isFinite(s.s)) return false;
    }
    return true;
  } catch { return false; }
}

export function validGameSave(value: unknown): value is GameSave {
  const save = value as GameSave | null;
  return validGameSnapshot(value) && save.schemaVersion === 1
    && Number.isFinite(save.modifiedAt) && typeof save.revision === 'string';
}

interface SessionOptions {
  userId: string;
  read: () => Promise<GameSave | null>;
  write: (save: GameSave) => Promise<void>;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  onStatus: (status: GameSaveStatus) => void;
}

export async function createGameSaveSession({ userId, read, write, storage, onStatus }: SessionOptions): Promise<GameSaveSession> {
  const cacheKey = `statai:game:lenda-de-sigma:v1:${userId}`;
  let cached: CachedSave | null = null;
  try {
    const data: unknown = JSON.parse(storage.getItem(cacheKey) || 'null');
    if (validGameSave(data) && typeof (data as CachedSave).pending === 'boolean') cached = data as CachedSave;
  } catch { /* A blocked or full local store must not prevent cloud saves. */ }

  let remote: GameSave | null = null;
  let loadFailed = false;
  try {
    remote = await read();
    if (remote !== null && !validGameSave(remote)) throw new Error('O salvamento desta conta está em um formato inválido.');
  } catch (error) {
    if (!cached) throw error; // Never replace an unread cloud save with an empty game.
    loadFailed = true;
  }

  let current: GameSnapshot = cached?.pending && (!remote || cached.modifiedAt >= remote.modifiedAt)
    ? cached : (loadFailed ? cached! : remote || { progress: null, settings: null });
  let pending: GameSave | null = current === cached && cached?.pending ? cached : null;
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const report = (status: GameSaveStatus) => { if (!disposed) onStatus(status); };
  const cache = (save: GameSave, dirty: boolean) => {
    try { storage.setItem(cacheKey, JSON.stringify({ ...save, pending: dirty })); } catch { /* Cloud remains available. */ }
  };
  if (validGameSave(current)) cache(current, Boolean(pending));

  const flush = (): Promise<void> => {
    clearTimeout(timer);
    if (inFlight) return inFlight;
    if (!pending) return Promise.resolve();
    const writing = pending;
    report('saving');
    let succeeded = false;
    inFlight = write(writing).then(() => {
      succeeded = true;
      if (pending?.revision === writing.revision) {
        pending = null;
        cache(writing, false);
        report('saved');
      }
    }).catch(() => {
      // Keep the exact latest state for retry, including a deliberately cleared save.
      report(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
    }).finally(() => {
      inFlight = null;
      if (succeeded && pending) void flush();
    });
    return inFlight;
  };

  const update = (snapshot: GameSnapshot) => {
    if (!validGameSnapshot(snapshot)) { report('error'); return; }
    if (snapshot.progress === current.progress && snapshot.settings === current.settings) return;
    current = { progress: snapshot.progress, settings: snapshot.settings };
    pending = { ...current, schemaVersion: 1, modifiedAt: Date.now(), revision: crypto.randomUUID() };
    cache(pending, true);
    report(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'saving');
    clearTimeout(timer);
    timer = setTimeout(() => { void flush(); }, 1000);
  };

  report(loadFailed ? 'offline' : pending ? 'saving' : current.progress ? 'saved' : 'ready');
  if (pending) timer = setTimeout(() => { void flush(); }, 0);
  const retry = setInterval(() => { if (pending) void flush(); }, 15_000);
  const reconnect = () => { void flush(); };
  if (typeof window !== 'undefined') window.addEventListener('online', reconnect);

  return {
    initial: { progress: current.progress, settings: current.settings },
    update,
    flush,
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(retry);
      if (typeof window !== 'undefined') window.removeEventListener('online', reconnect);
      void flush();
    },
  };
}
