'use strict';
// The parent owns authentication, cloud access and the per-account local backup.
// This game uses only hydrated memory, never the original shared localStorage key.
(function (G) {
  const channel = 'statai-sigma-v1';
  const SAVE = 'lendaSigma_save_v1', SETTINGS = 'lendaSigma_settings_v1';
  const values = new Map();
  let initialized = false;
  let resolveInit;
  const hydrated = new Promise(resolve => { resolveInit = resolve; });
  const snapshot = () => ({ progress: values.get(SAVE) || null, settings: values.get(SETTINGS) || null });
  const send = type => parent.postMessage({ channel, type, snapshot: snapshot() }, location.origin);
  G.storage = {
    getItem: key => values.get(key) || null,
    setItem(key, value) {
      if (!initialized || (key !== SAVE && key !== SETTINGS)) return;
      values.set(key, value);
      send('save');
    },
    removeItem(key) {
      if (!initialized || (key !== SAVE && key !== SETTINGS)) return;
      values.delete(key);
      send('save');
    },
  };
  window.statAiSigma = {
    capture() {
      if (initialized && G.P && ['play', 'gameover', 'ending'].includes(G.state) && !G.trans) G.saveGame();
      return snapshot();
    },
  };
  addEventListener('message', event => {
    if (initialized || event.source !== parent || event.origin !== location.origin
      || event.data?.channel !== channel || event.data.type !== 'init') return;
    const data = event.data.snapshot;
    if (!data || (data.progress !== null && typeof data.progress !== 'string')
      || (data.settings !== null && typeof data.settings !== 'string')) return;
    if (data.progress !== null) values.set(SAVE, data.progress);
    if (data.settings !== null) values.set(SETTINGS, data.settings);
    initialized = true;
    resolveInit();
  });
  const boot = G.boot;
  G.boot = () => hydrated.then(() => { boot(); if (G.touch) G.touch.apply(); send('started'); });
  addEventListener('load', () => {
    if (parent === window) {
      const hint = document.createElement('p');
      hint.textContent = 'Entre no Stat AI e abra Jogos → A Lenda de Sigma para jogar com seu progresso salvo.';
      hint.style.cssText = 'position:fixed;color:#eee;font:16px sans-serif;padding:24px;text-align:center';
      document.body.appendChild(hint);
    } else send('ready');
  });
})(window.G);
