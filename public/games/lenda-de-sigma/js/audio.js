'use strict';
// =====================================================================
//  Áudio: efeitos sonoros sintetizados (WebAudio) e sequenciador de
//  músicas chiptune originais.
// =====================================================================
(function (G) {
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 0;
    let s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const oct = +m[3];
    const midi = (oct + 1) * 12 + s;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(seq) {
    const out = [];
    for (const tok of seq.trim().split(/\s+/)) {
      if (!tok || tok === '|') continue;
      const [n, l] = tok.split(':');
      out.push({ n, f: freq(n), l: l ? +l : 1 });
    }
    return out;
  }

  // ------------------- músicas (composições originais) -------------------
  const T = {};
  T.title = { bpm: 84, spb: 2, ch: [
    { w: 'square', v: 0.055, s: 'C5:4 G4:2 C5:2 E5:4 D5:2 C5:2 D5:4 G4:2 B4:2 D5:6 .:2 E5:4 D5:2 E5:2 F5:4 E5:2 D5:2 E5:2 C5:2 D5:2 B4:2 C5:8' +
      ' A4:4 C5:2 E5:2 G5:4 F5:2 E5:2 F5:4 D5:2 F5:2 A5:6 .:2 G5:4 E5:2 C5:2 F5:4 D5:2 B4:2 C5:3 D5:1 B4:2 G4:2 C5:8' },
    { w: 'triangle', v: 0.14, s: 'C3:8 A2:8 G2:8 G2:8 C3:8 F2:8 G2:8 C3:8 A2:8 E2:8 F2:8 D2:8 E2:8 F2:8 G2:8 C3:8' },
    { w: 'square', v: 0.02, s: 'C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 E4 C4 A3 C4 E4 C4 G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3 C4 E4 G4 E4 C4 E4 G4 E4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3 C4 E4 G4 E4 C4 E4 G4 C5' +
      ' A3 C4 E4 C4 A3 C4 E4 C4 E3 G3 B3 G3 E3 G3 B3 G3 F3 A3 C4 A3 F3 A3 C4 A3 D3 F3 A3 F3 D3 F3 A3 F3 E3 G3 C4 G3 E3 G3 C4 G3 F3 A3 D4 A3 F3 A3 D4 A3 G3 B3 D4 B3 G3 B3 D4 B3 C4 E4 G4 E4 C4 G3 C4 .' }
  ] };
  T.field = { bpm: 132, spb: 2, ch: [
    { w: 'square', v: 0.05, s: 'E5:2 G5:2 C6:3 B5:1 A5:2 G5:2 E5:4 F5:2 A5:2 G5:2 E5:2 D5:6 .:2 E5:2 G5:2 C6:3 D6:1 E6:2 D6:2 C6:2 A5:2 B5:2 G5:2 A5:2 B5:2 C6:6 .:2' +
      ' A5:3 G5:1 F5:2 E5:2 D5:2 E5:2 F5:4 G5:3 F5:1 E5:2 D5:2 C5:2 D5:2 E5:4 F5:2 E5:2 D5:2 C5:2 B4:2 C5:2 D5:4 E5:2 D5:2 C5:2 B4:2 C5:4 G4:4' },
    { w: 'triangle', v: 0.13, s: 'C3:2 G3:2 C4:2 G3:2 F3:2 C4:2 F3:2 C4:2 F3:2 A3:2 C4:2 A3:2 G3:2 D4:2 G3:2 B3:2 C3:2 G3:2 C4:2 G3:2 A2:2 E3:2 A3:2 E3:2 G2:2 D3:2 G3:2 D3:2 C3:2 G3:2 C4:4' +
      ' F3:2 C4:2 F3:2 C4:2 D3:2 A3:2 D4:2 A3:2 G3:2 D4:2 G3:2 D4:2 C3:2 G3:2 C4:2 G3:2 F3:2 C4:2 F3:2 C4:2 G3:2 D4:2 G3:2 D4:2 A3:2 E4:2 G3:2 D4:2 C3:2 G3:2 C3:4' },
    { w: 'noise', v: 0.05, s: 'K:2 x:2 S:2 x:2 K:2 x:2 S:2 x:2 K:2 x:2 S:2 x:2 K:2 x:2 S:2 x:1 x:1' }
  ] };
  T.village = { bpm: 100, spb: 2, ch: [
    { w: 'triangle', v: 0.16, s: 'A4:2 C5:2 F5:4 E5:2 D5:2 C5:4 Bb4:2 D5:2 G5:3 F5:1 E5:4 C5:4 A4:2 C5:2 F5:3 G5:1 A5:2 G5:2 F5:4 D5:2 E5:2 F5:2 G5:2 F5:8' },
    { w: 'square', v: 0.03, s: 'F3:2 A3:2 C4:2 A3:2 C3:2 E3:2 G3:2 E3:2 Bb2:2 D3:2 F3:2 D3:2 C3:2 E3:2 G3:2 C4:2 F3:2 A3:2 C4:2 A3:2 D3:2 F3:2 A3:2 F3:2 Bb2:2 D3:2 C3:2 E3:2 F3:2 C3:2 F3:4' },
    { w: 'noise', v: 0.025, s: 'x:2 .:2 x:2 x:2' }
  ] };
  T.forest = { bpm: 96, spb: 2, ch: [
    { w: 'triangle', v: 0.16, s: 'D5:3 E5:1 F5:2 A5:2 G5:3 F5:1 E5:4 C5:3 D5:1 E5:2 G5:2 F5:4 D5:4 D5:3 E5:1 F5:2 A5:2 C6:3 Bb5:1 A5:4 G5:2 F5:2 E5:2 C5:2 D5:8' },
    { w: 'square', v: 0.025, s: 'D3:2 A3:2 D4:2 A3:2 C3:2 G3:2 C4:2 G3:2 Bb2:2 F3:2 Bb3:2 F3:2 A2:2 E3:2 A3:2 E3:2 D3:2 A3:2 D4:2 A3:2 F3:2 C4:2 F4:2 C4:2 Bb2:2 F3:2 C3:2 G3:2 D3:2 A3:2 D3:4' },
    { w: 'noise', v: 0.02, s: 'x:4 x:2 x:2' }
  ] };
  T.desert = { bpm: 112, spb: 2, ch: [
    { w: 'square', v: 0.045, s: 'E5:2 F5:1 G#5:1 A5:2 G#5:2 F5:2 E5:2 F5:4 D5:2 E5:1 F5:1 G#5:2 F5:2 E5:4 .:4 B5:2 A5:1 G#5:1 A5:2 F5:2 G#5:2 E5:2 F5:4 E5:2 D5:2 C5:2 B4:2 E5:8' },
    { w: 'triangle', v: 0.14, s: 'E3:2 E3:1 E3:1 B3:2 E3:2 F3:2 F3:1 F3:1 C4:2 F3:2 E3:2 E3:1 E3:1 B3:2 E3:2 E3:2 B2:2 E3:4 E3:2 E3:1 E3:1 B3:2 E3:2 D3:2 D3:1 D3:1 A3:2 D3:2 F3:2 F3:1 F3:1 C4:2 B3:2 E3:2 B2:2 E3:4' },
    { w: 'noise', v: 0.04, s: 'K:2 x:1 x:1 S:2 x:2 K:1 K:1 x:2 S:2 x:1 x:1' }
  ] };
  T.snow = { bpm: 88, spb: 2, ch: [
    { w: 'triangle', v: 0.17, s: 'E5:2 B4:2 G5:4 F#5:2 D5:2 A4:4 G4:2 B4:2 E5:3 D5:1 C5:4 B4:4 E5:2 B4:2 G5:4 A5:2 F#5:2 D5:4 C5:2 E5:2 D5:2 F#5:2 E5:8' },
    { w: 'square', v: 0.018, s: 'E4 B4 G4 B4 E4 B4 G4 B4 D4 A4 F#4 A4 D4 A4 F#4 A4 C4 G4 E4 G4 C4 G4 E4 G4 B3 F#4 D#4 F#4 B3 F#4 D#4 F#4 E4 B4 G4 B4 E4 B4 G4 B4 D4 A4 F#4 A4 D4 A4 F#4 A4 C4 G4 E4 G4 D4 A4 F#4 A4 E4 B4 G4 B4 E4 B4 G4 B4' }
  ] };
  T.volcano = { bpm: 120, spb: 2, ch: [
    { w: 'sawtooth', v: 0.03, s: 'C5:2 Eb5:2 G5:2 F#5:2 G5:4 .:4 Bb4:2 C5:2 Eb5:2 D5:2 C5:4 .:4 Ab4:2 C5:2 Eb5:2 Ab5:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2 F5:2 D5:2 C5:8' },
    { w: 'triangle', v: 0.16, s: 'C3:1 C3:1 C4:2 C3:1 C3:1 Bb3:2 C3:1 C3:1 C4:2 G3:2 Bb2:2 Bb2:1 Bb2:1 Bb3:2 Bb2:2 Ab2:2 Ab2:1 Ab2:1 Ab3:2 Ab2:2 G2:2 G2:1 G2:1 G3:2 G2:2 Ab2:2 Ab3:2 Ab2:2 G2:2 G2:2 G3:2 C3:4' },
    { w: 'noise', v: 0.05, s: 'K:2 x:1 K:1 S:2 x:2' }
  ] };
  T.castle = { bpm: 96, spb: 2, ch: [
    { w: 'square', v: 0.045, s: 'D5:2 F5:2 A5:4 G#5:2 A5:2 F5:4 E5:2 G5:2 Bb5:4 A5:8 D5:2 F5:2 A5:3 C6:1 Bb5:2 A5:2 G5:4 F5:2 E5:2 D5:2 C#5:2 D5:8' },
    { w: 'triangle', v: 0.15, s: 'D3:2 A3:2 D3:2 A3:2 D3:2 A3:2 D3:2 A3:2 C3:2 G3:2 C3:2 G3:2 A2:2 E3:2 A2:2 C#3:2 Bb2:2 F3:2 Bb2:2 F3:2 G2:2 D3:2 G2:2 D3:2 A2:2 E3:2 A2:2 E3:2 D3:2 A3:2 D3:4' },
    { w: 'noise', v: 0.035, s: 'K:4 S:4 K:2 K:2 S:4' }
  ] };
  T.dungeon = { bpm: 108, spb: 2, ch: [
    { w: 'square', v: 0.035, s: 'A4:3 C5:1 E5:2 A5:2 G5:2 E5:2 D5:4 F5:3 E5:1 D5:2 C5:2 B4:4 E4:4 A4:3 C5:1 E5:2 A5:2 B5:2 C6:2 B5:2 G5:2 A5:2 F5:2 E5:2 D5:2 E5:8' },
    { w: 'triangle', v: 0.15, s: 'A2:2 A3:2 A2:2 A3:2 E2:2 E3:2 E2:2 E3:2 F2:2 F3:2 F2:2 F3:2 E2:2 E3:2 G#2:2 B2:2 A2:2 A3:2 A2:2 A3:2 G2:2 G3:2 G2:2 G3:2 F2:2 F3:2 D2:2 D3:2 E2:2 E3:2 E2:2 E3:2' },
    { w: 'noise', v: 0.03, s: 'K:4 x:2 x:2 S:4 x:2 x:2' }
  ] };
  T.cave = { bpm: 70, spb: 2, ch: [
    { w: 'triangle', v: 0.17, s: 'E4:4 .:4 G4:4 .:4 F#4:4 .:4 B3:8 E4:4 .:4 D4:4 .:4 C4:6 B3:2 .:8' },
    { w: 'sawtooth', v: 0.02, s: 'E2:16 D2:16 C2:16 B1:16' },
    { w: 'square', v: 0.012, s: '.:6 B5:1 .:9 .:4 E6:1 .:11 .:8 G5:1 .:7 .:2 F#5:1 .:13' }
  ] };
  T.boss = { bpm: 160, spb: 2, ch: [
    { w: 'square', v: 0.045, s: 'E5 E5 G5 E5 A5:2 G5:2 F#5 F#5 E5 D5 E5:4 E5 E5 G5 B5 C6:2 B5:2 A5:2 F#5:2 D#5:4 E5 E5 G5 E5 A5:2 B5:2 C6 B5 A5 G5 F#5:4 G5 A5 B5 A5 G5 F#5 E5 D#5 E5:4 B4:4' },
    { w: 'triangle', v: 0.16, s: 'E2 E3 E2 E3 E2 E3 E2 E3 D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 C2 C3 C2 C3 B1 B2 B1 B2 B1 B2 D#2 B2 E2 E3 E2 E3 E2 E3 E2 E3 A1 A2 A1 A2 B1 B2 B1 B2 C2 C3 C2 C3 B1 B2 B1 B2 E2 E3 E2 E3 E2:4' },
    { w: 'noise', v: 0.05, s: 'K x S x K K S x' }
  ] };
  T.finalboss = { bpm: 150, spb: 2, ch: [
    { w: 'sawtooth', v: 0.035, s: 'D5 F5 A5 D6 C#6:2 A5:2 Bb5 A5 G5 F5 E5:4 D5 F5 A5 D6 E6:2 C#6:2 D6:2 A5:2 F5:4 G5 Bb5 D6 G6 F6:2 E6:2 D6 C#6 Bb5 A5 G5:4 F5 E5 D5 E5 F5 G5 A5 C#6 D6:8' },
    { w: 'triangle', v: 0.17, s: 'D2 D3 D2 D3 A1 A2 A1 A2 Bb1 Bb2 Bb1 Bb2 A1 A2 C#2 E2 D2 D3 D2 D3 A1 A2 A1 A2 D2 D3 D2 D3 F2 F3 F2 F3 G1 G2 G1 G2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 A1 A2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 D2 D3 D2 D3 D2 D3 D2:2' },
    { w: 'noise', v: 0.055, s: 'K x S x K S S x K x S x K K S S' }
  ] };
  T.minigame = { bpm: 140, spb: 2, ch: [
    { w: 'square', v: 0.045, s: 'G5 B5 D6:2 B5 G5 A5:2 F#5 A5 C6:2 A5 F#5 G5:2 E5 G5 B5:2 A5 G5 F#5 E5 D5:2 F#5:2 G5:4' },
    { w: 'triangle', v: 0.15, s: 'G3:2 D4:2 G3:2 D4:2 D3:2 A3:2 D3:2 A3:2 C3:2 G3:2 C3:2 G3:2 D3:2 A3:2 G3:4' },
    { w: 'noise', v: 0.035, s: 'K x S x' }
  ] };
  T.star = { bpm: 184, spb: 2, ch: [
    { w: 'square', v: 0.05, s: 'C6 G5 C6 E6 D6 C6 D6 G5 C6 G5 C6 E6 G6:2 E6:2 A5 E6 A5 F6 E6 D6 C6 B5 C6 G5 E5 G5 C6:4' },
    { w: 'triangle', v: 0.15, s: 'C3 C4 C3 C4 G2 G3 G2 G3 C3 C4 C3 C4 E3 E4 E3 E4 F3 F4 F3 F4 G3 G4 G3 G4 C3 C4 C3 C4 C3:4' },
    { w: 'noise', v: 0.045, s: 'K x S x' }
  ] };
  T.ending = { bpm: 76, spb: 2, ch: [
    { w: 'triangle', v: 0.18, s: 'E5:4 D5:2 C5:2 G5:6 E5:2 F5:4 E5:2 D5:2 E5:8 C5:4 D5:2 E5:2 A5:6 G5:2 F5:2 E5:2 D5:2 B4:2 C5:8' },
    { w: 'square', v: 0.022, s: 'C4 E4 G4 C5 G4 E4 C4 E4 E4 G4 C5 E5 C5 G4 E4 G4 F4 A4 C5 F5 C5 A4 G4 B4 C4 E4 G4 C5 G4 E4 C4 E4 A3 C4 E4 A4 E4 C4 A3 C4 F3 A3 C4 F4 C4 A3 D4 F4 G3 B3 D4 G4 F4 D4 B3 D4 C4 E4 G4 C5 G4 E4 C4 .' },
    { w: 'triangle', v: 0.1, s: 'C3:8 E3:8 F3:8 C3:8 A2:8 F2:8 G2:8 C3:8' }
  ] };
  T.gameover = { bpm: 70, spb: 2, ch: [
    { w: 'triangle', v: 0.17, s: 'E5:2 D5:2 C5:2 B4:2 A4:4 G#4:4 A4:8 .:8' },
    { w: 'square', v: 0.02, s: 'A3:4 E3:4 F3:4 E3:4 A2:8 .:8' }
  ] };
  for (const k in T) for (const c of T[k].ch) c.notes = parse(c.s);

  const A = G.audio = {
    ctx: null, ok: false, musicVol: 0.6, sfxVol: 0.8, muted: false, cur: null, pending: null, chans: [],
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      const c = this.ctx;
      // mixagem: música → recuo (duck) → filtro (abafa na pausa) → mestre → compressor → saída
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 4; this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
      this.master.connect(this.comp); this.comp.connect(c.destination);
      this.mF = c.createBiquadFilter(); this.mF.type = 'lowpass'; this.mF.frequency.value = 20000; this.mF.Q.value = 0.4; this.mF.connect(this.master);
      this.duckG = c.createGain(); this.duckG.connect(this.mF);
      this.mG = c.createGain(); this.mG.gain.value = this.musicVol; this.mG.connect(this.duckG);
      this.sG = c.createGain(); this.sG.gain.value = this.sfxVol; this.sG.connect(this.master);
      this.aG = c.createGain(); this.aG.gain.value = this.sfxVol * 0.8; this.aG.connect(this.master);
      const len = c.sampleRate * 1;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.ok = true;
      setInterval(() => { this.schedule(); this.ambEvents(0.025); }, 25);
      if (this.pending) { const p = this.pending; this.pending = null; this.cur = null; this.music(p); }
    },
    setVol(m, s) {
      this.musicVol = m; this.sfxVol = s;
      if (this.mG) { this.mG.gain.value = m; this.sG.gain.value = s; this.aG.gain.value = s * 0.8; }
    },
    // a música recua um pouco sob efeitos grandes e volta sozinha
    duck(amount, dur) {
      if (!this.ok) return;
      const g = this.duckG.gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(1 - amount, t + 0.04); g.setValueAtTime(1 - amount, t + dur * 0.5); g.linearRampToValueAtTime(1, t + dur);
    },
    // música abafada com o menu de pausa aberto
    muffle(on) {
      if (!this.ok || this.muffled === on) return;
      this.muffled = on; this.mF.frequency.setTargetAtTime(on ? 850 : 20000, this.ctx.currentTime, on ? 0.06 : 0.12);
    },
    // chamado a cada quadro: ambiência da região e o filtro da pausa
    tick() {
      if (!this.ok) return;
      this.ambience(G.ambienceKey ? G.ambienceKey() : null);
      this.muffle(!!(G.ui && G.ui.stack && G.ui.stack.some(o => o.isPause)));
    },
    // ---------- ambiência: uma camada contínua (vento, rumor, água) e eventos esparsos ----------
    ambience(name) {
      if (name === this.ambCur) return;
      this.ambCur = name;
      const c = this.ctx, t = c.currentTime;
      if (this.amb) { const old = this.amb; old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0.0001, t + 1.2); setTimeout(() => old.nodes.forEach(n => { try { n.stop ? n.stop() : 0; n.disconnect(); } catch (e) { } }), 1400); }
      this.amb = null;
      const def = name && AMB[name]; if (!def) return;
      const g = c.createGain(), nodes = [g]; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + 1.5); g.connect(this.aG);
      for (const b of def.bed || []) {
        let src;
        if (b.osc) { src = c.createOscillator(); src.type = b.osc; src.frequency.value = b.f; }
        else { src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true; }
        const f = c.createBiquadFilter(); f.type = b.ft || 'lowpass'; f.frequency.value = b.ff || 800; f.Q.value = b.q || 0.7;
        const v = c.createGain(); v.gain.value = b.v;
        src.connect(f); f.connect(v); v.connect(g); nodes.push(src, f, v);
        // rajadas: um oscilador lento mexe no volume (e no filtro) da camada
        if (b.lfo) {
          const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = b.lfo; lg.gain.value = b.v * (b.depth || 0.6);
          l.connect(lg); lg.connect(v.gain); nodes.push(l, lg); l.start(t);
          if (b.sweep) { const lf = c.createGain(); lf.gain.value = b.sweep; l.connect(lf); lf.connect(f.frequency); nodes.push(lf); }
        }
        src.start(t);
      }
      this.amb = { def, g, nodes };
    },
    ambEvents(dt) {
      const a = this.amb; if (!a || !a.def.ev) return;
      for (const [ev, mean] of a.def.ev) if (Math.random() < dt / mean && AMBEV[ev]) try { AMBEV[ev](this.amb.g); } catch (e) { }
    },
    // ---------- passos: timbre conforme o chão ----------
    step(kind) {
      if (!this.ok) return;
      const r = 0.85 + Math.random() * 0.3, f = STEPS[kind] || STEPS.terra;
      f(r, this.sG);
    },
    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    },
    // ---------- primitivas ----------
    tone(o) {
      if (!this.ok) return;
      const c = this.ctx, t0 = c.currentTime + (o.delay || 0);
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.f, t0);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.d);
      const v = o.v === undefined ? 0.15 : o.v;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(v, t0 + (o.a || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
      osc.connect(g); g.connect(o.dest || this.sG);
      osc.start(t0); osc.stop(t0 + o.d + 0.02);
    },
    noise(o) {
      if (!this.ok) return;
      const c = this.ctx, t0 = c.currentTime + (o.delay || 0);
      const src = c.createBufferSource(); src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.frequency.setValueAtTime(o.f || 2000, t0);
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.d);
      const g = c.createGain(); const v = o.v === undefined ? 0.2 : o.v;
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
      src.connect(f); f.connect(g); g.connect(o.dest || this.sG);
      src.start(t0, Math.random() * 0.5); src.stop(t0 + o.d + 0.02);
    },
    seq(notes, step, type = 'square', v = 0.12, dur) {
      notes.forEach((n, i) => { if (n) this.tone({ f: typeof n === 'number' ? n : freq(n), d: dur || step * 1.1, type, v, delay: i * step }); });
    },
    // ---------- música ----------
    music(name) {
      if (name === this.cur) return;
      this.cur = name;
      if (!this.ok) { this.pending = name; return; }
      this.chans = [];
      if (!name || !T[name]) return;
      const tr = T[name];
      const stepDur = 60 / tr.bpm / tr.spb;
      const t0 = this.ctx.currentTime + 0.08;
      this.chans = tr.ch.map(ch => ({ ch, i: 0, t: t0, stepDur }));
    },
    schedule() {
      if (!this.ok || !this.chans.length) return;
      const c = this.ctx, ahead = c.currentTime + 0.15;
      for (const st of this.chans) {
        const notes = st.ch.notes;
        if (!notes.length) continue;
        let guard = 0;
        while (st.t < ahead && guard++ < 64) {
          const n = notes[st.i];
          const d = n.l * st.stepDur;
          if (n.n !== '.') this.playNote(st.ch, n, st.t, d);
          st.t += d;
          st.i = (st.i + 1) % notes.length;
        }
      }
    },
    playNote(ch, n, t, d) {
      const c = this.ctx;
      if (ch.w === 'noise') {
        const src = c.createBufferSource(); src.buffer = this.noiseBuf;
        const f = c.createBiquadFilter(); const g = c.createGain();
        let dur = 0.05, v = ch.v;
        if (n.n === 'K') {
          const o = c.createOscillator(); const og = c.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          og.gain.setValueAtTime(ch.v * 3, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          o.connect(og); og.connect(this.mG); o.start(t); o.stop(t + 0.16);
          f.type = 'lowpass'; f.frequency.value = 400; dur = 0.06; v = ch.v * 0.6;
        } else if (n.n === 'S') { f.type = 'bandpass'; f.frequency.value = 1800; dur = 0.12; v = ch.v * 1.4; }
        else { f.type = 'highpass'; f.frequency.value = 7000; dur = 0.035; v = ch.v * 0.7; }
        g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.mG);
        src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
        return;
      }
      if (!n.f) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = ch.w; o.frequency.setValueAtTime(n.f, t);
      const len = Math.max(0.03, d * 0.92);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(ch.v, t + 0.01);
      g.gain.setValueAtTime(ch.v * 0.8, t + Math.min(len * 0.6, 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(this.mG);
      o.start(t); o.stop(t + len + 0.02);
    }
  };

  // ------------------- efeitos sonoros -------------------
  const S = {
    sword() { A.noise({ d: 0.09, v: 0.22, ft: 'bandpass', f: 2500, f2: 900 }); A.tone({ f: 700, f2: 250, d: 0.07, type: 'square', v: 0.04 }); },
    spin() { A.noise({ d: 0.3, v: 0.25, ft: 'bandpass', f: 600, f2: 3000 }); A.tone({ f: 300, f2: 900, d: 0.3, type: 'sawtooth', v: 0.05 }); },
    charge() { A.tone({ f: 880, d: 0.08, type: 'square', v: 0.06 }); A.tone({ f: 1320, d: 0.12, type: 'square', v: 0.05, delay: 0.06 }); },
    hit() { A.tone({ f: 260, f2: 90, d: 0.1, type: 'square', v: 0.16 }); A.noise({ d: 0.07, v: 0.18, f: 3000 }); },
    tink() { A.tone({ f: 1800, f2: 1500, d: 0.08, type: 'square', v: 0.08 }); A.tone({ f: 2400, d: 0.05, type: 'triangle', v: 0.06, delay: 0.02 }); },
    kill() { A.tone({ f: 500, f2: 60, d: 0.22, type: 'square', v: 0.12 }); A.noise({ d: 0.25, v: 0.2, f: 1500, f2: 200 }); },
    coin() { A.tone({ f: 1046, d: 0.07, type: 'square', v: 0.09 }); A.tone({ f: 1568, d: 0.28, type: 'square', v: 0.09, delay: 0.07 }); },
    bigcoin() { A.seq([1046, 1318, 1568, 2093], 0.05, 'square', 0.08); },
    jump() { A.tone({ f: 280, f2: 760, d: 0.16, type: 'square', v: 0.09 }); },
    land() { A.noise({ d: 0.05, v: 0.1, f: 500 }); },
    stomp() { A.tone({ f: 220, f2: 70, d: 0.1, type: 'square', v: 0.15 }); A.tone({ f: 880, f2: 1400, d: 0.08, type: 'square', v: 0.06, delay: 0.04 }); },
    hurt() { A.tone({ f: 360, f2: 140, d: 0.18, type: 'sawtooth', v: 0.13 }); A.tone({ f: 300, f2: 120, d: 0.15, type: 'square', v: 0.08, delay: 0.08 }); },
    bombput() { A.tone({ f: 420, d: 0.05, type: 'square', v: 0.08 }); },
    explode() { A.noise({ d: 0.6, v: 0.45, f: 1200, f2: 80 }); A.tone({ f: 90, f2: 30, d: 0.5, type: 'sine', v: 0.35 }); G.shake(3, 0.3); },
    beam() { A.tone({ f: 1500, f2: 380, d: 0.12, type: 'square', v: 0.07 }); },
    bigbeam() { A.tone({ f: 900, f2: 120, d: 0.3, type: 'sawtooth', v: 0.1 }); A.noise({ d: 0.2, v: 0.12, ft: 'bandpass', f: 1500 }); },
    door() { A.tone({ f: 140, f2: 320, d: 0.25, type: 'square', v: 0.09 }); A.noise({ d: 0.25, v: 0.1, f: 600 }); },
    shut() { A.tone({ f: 320, f2: 110, d: 0.18, type: 'square', v: 0.1 }); A.noise({ d: 0.15, v: 0.15, f: 400 }); },
    unlock() { A.seq([784, 1046], 0.07, 'square', 0.08); A.noise({ d: 0.1, v: 0.1, f: 3000, delay: 0.1 }); },
    chest() { A.seq([523, 659, 784, 1046], 0.06, 'triangle', 0.15); },
    secret() { A.seq([523, 587, 659, 784, 1046, 1318], 0.07, 'square', 0.07); },
    itemget() {
      A.seq([523, 659, 784, 1046, 0, 988, 1046], 0.11, 'square', 0.08);
      A.seq([262, 330, 392, 523, 0, 494, 523], 0.11, 'triangle', 0.14);
    },
    fanfare() {
      A.seq([392, 523, 659, 784, 0, 659, 784, 1046], 0.13, 'square', 0.08, 0.2);
      A.seq([196, 262, 330, 392, 0, 330, 392, 523], 0.13, 'triangle', 0.15, 0.2);
    },
    crystal() {
      A.seq([1046, 1318, 1568, 2093, 1568, 2093, 2637], 0.09, 'triangle', 0.16, 0.4);
      A.seq([523, 659, 784, 1046, 784, 1046, 1318], 0.09, 'square', 0.04, 0.3);
    },
    text() { A.tone({ f: 740, d: 0.025, type: 'square', v: 0.025 }); },
    select() { A.tone({ f: 660, d: 0.04, type: 'square', v: 0.06 }); },
    confirm() { A.tone({ f: 880, d: 0.05, type: 'square', v: 0.07 }); A.tone({ f: 1320, d: 0.07, type: 'square', v: 0.06, delay: 0.04 }); },
    cancel() { A.tone({ f: 440, f2: 330, d: 0.08, type: 'square', v: 0.06 }); },
    menu() { A.seq([660, 990], 0.04, 'square', 0.06); },
    correct() { A.seq([784, 988, 1175, 1568], 0.07, 'square', 0.08); A.seq([392, 494, 587, 784], 0.07, 'triangle', 0.12); },
    wrong() { A.tone({ f: 160, f2: 120, d: 0.35, type: 'sawtooth', v: 0.12 }); A.tone({ f: 165, f2: 118, d: 0.35, type: 'square', v: 0.06 }); },
    levelup() { A.seq([523, 659, 784, 1046, 1318, 1568], 0.07, 'square', 0.07); A.seq([262, 330, 392, 523, 659, 784], 0.07, 'triangle', 0.12); },
    save() { A.tone({ f: 300, f2: 1200, d: 0.7, type: 'sine', v: 0.15 }); A.seq([1568, 2093, 1568, 2637], 0.15, 'triangle', 0.07); },
    heal() { A.tone({ f: 400, f2: 1000, d: 0.3, type: 'triangle', v: 0.14 }); },
    heart() { A.seq([880, 1175], 0.06, 'triangle', 0.14); },
    fall() { A.tone({ f: 700, f2: 90, d: 0.55, type: 'square', v: 0.09 }); },
    splash() { A.noise({ d: 0.35, v: 0.22, ft: 'bandpass', f: 1200, f2: 400 }); },
    burn() { A.noise({ d: 0.4, v: 0.25, ft: 'highpass', f: 800 }); A.tone({ f: 200, f2: 80, d: 0.3, type: 'sawtooth', v: 0.08 }); },
    pipe() { A.seq([392, 0, 294, 0, 220, 0, 165], 0.06, 'square', 0.1); },
    powerup() { A.seq([392, 494, 587, 784, 988, 1175, 1568], 0.045, 'square', 0.08); },
    tell() { A.tone({ f: 1100, d: 0.04, type: 'square', v: 0.045 }); A.tone({ f: 1100, d: 0.04, type: 'square', v: 0.045, delay: 0.08 }); },
    bump() { A.tone({ f: 160, f2: 120, d: 0.07, type: 'square', v: 0.14 }); },
    brick() { A.noise({ d: 0.2, v: 0.25, f: 2500, f2: 300 }); A.tone({ f: 200, f2: 80, d: 0.1, type: 'square', v: 0.08 }); },
    cut() { A.noise({ d: 0.12, v: 0.16, ft: 'highpass', f: 1800 }); },
    pot() { A.noise({ d: 0.18, v: 0.2, ft: 'bandpass', f: 2200 }); A.tone({ f: 1400, f2: 700, d: 0.05, type: 'triangle', v: 0.05 }); },
    shock() { A.tone({ f: 90, f2: 400, d: 0.25, type: 'sawtooth', v: 0.12 }); A.noise({ d: 0.25, v: 0.15, ft: 'highpass', f: 2000 }); },
    roar() { A.tone({ f: 160, f2: 50, d: 0.8, type: 'sawtooth', v: 0.16 }); A.noise({ d: 0.8, v: 0.22, f: 600, f2: 150 }); G.shake(4, 0.6); },
    bossdie() { for (let i = 0; i < 6; i++) A.noise({ d: 0.4, v: 0.3, f: 1500, f2: 100, delay: i * 0.18 }); A.tone({ f: 400, f2: 40, d: 1.4, type: 'sawtooth', v: 0.15 }); },
    lowhp() { A.tone({ f: 1050, d: 0.06, type: 'square', v: 0.035 }); },
    push() { A.noise({ d: 0.15, v: 0.12, f: 300 }); },
    switch() { A.tone({ f: 300, d: 0.04, type: 'square', v: 0.1 }); A.tone({ f: 600, d: 0.06, type: 'square', v: 0.08, delay: 0.04 }); A.noise({ d: 0.06, v: 0.1, f: 2000 }); },
    crumble() { A.noise({ d: 0.35, v: 0.22, f: 900, f2: 120 }); A.tone({ f: 140, f2: 50, d: 0.3, type: 'square', v: 0.08 }); },
    plate() { A.tone({ f: 200, d: 0.06, type: 'square', v: 0.1 }); A.tone({ f: 300, d: 0.06, type: 'square', v: 0.08, delay: 0.05 }); },
    dice() { for (let i = 0; i < 5; i++) A.noise({ d: 0.04, v: 0.15, ft: 'bandpass', f: 3000 + i * 300, delay: i * 0.05 }); },
    plop() { A.tone({ f: 600, f2: 200, d: 0.12, type: 'sine', v: 0.2 }); },
    reel() { A.tone({ f: 900, f2: 1300, d: 0.08, type: 'square', v: 0.05 }); },
    flip() { A.tone({ f: 1200, f2: 1800, d: 0.05, type: 'triangle', v: 0.08 }); },
    ball() { A.tone({ f: G.rf(1500, 2400), d: 0.03, type: 'triangle', v: 0.035 }); },
    warp() { A.tone({ f: 200, f2: 1600, d: 0.6, type: 'sine', v: 0.15 }); A.tone({ f: 300, f2: 2400, d: 0.6, type: 'triangle', v: 0.08, delay: 0.1 }); },
    teleport() { A.tone({ f: 1600, f2: 200, d: 0.4, type: 'sine', v: 0.15 }); },
    freeze() { A.noise({ d: 0.2, v: 0.08, ft: 'highpass', f: 5000 }); },
    star() { A.seq([1046, 1318, 1568, 1318, 1568, 2093], 0.05, 'square', 0.07); }
  };
  // efeitos grandes abrem espaço na música: [quanto recua, duração em s]
  const DUCK = { explode: [0.4, 0.7], roar: [0.5, 1.1], bossdie: [0.6, 2.2], itemget: [0.65, 1.6], fanfare: [0.65, 1.8], crystal: [0.6, 2.0], levelup: [0.4, 1.0], secret: [0.35, 0.9], chest: [0.3, 0.6] };
  G.sfx = function (name) { if (!A.ok) return; const f = S[name]; if (f) try { f(); if (DUCK[name]) A.duck(...DUCK[name]); } catch (e) { } };

  // ------------------- ambiência por região -------------------
  // bed: camadas contínuas (ruído filtrado ou oscilador; lfo = rajadas); ev: [evento, intervalo médio em s]
  const AMB = {
    vila: { bed: [{ ft: 'bandpass', ff: 900, q: 0.5, v: 0.018, lfo: 0.07, depth: 0.5 }], ev: [['passaro', 2.5], ['passaro2', 4]] },
    lago: { bed: [{ ft: 'lowpass', ff: 500, v: 0.03, lfo: 0.18, depth: 0.7 }], ev: [['passaro', 3.5], ['agua', 2.2]] },
    campo: { bed: [{ ft: 'bandpass', ff: 1100, q: 0.4, v: 0.02, lfo: 0.09, depth: 0.6, sweep: 300 }], ev: [['passaro', 3], ['grilo', 5]] },
    floresta: { bed: [{ ft: 'bandpass', ff: 1600, q: 0.6, v: 0.014, lfo: 0.11, depth: 0.7 }], ev: [['passaro2', 3], ['coruja', 14], ['galho', 9]] },
    pantano: { bed: [{ ft: 'lowpass', ff: 300, v: 0.03, lfo: 0.05, depth: 0.4 }], ev: [['sapo', 2.2], ['bolha', 3], ['grilo', 4]] },
    deserto: { bed: [{ ft: 'bandpass', ff: 700, q: 0.8, v: 0.03, lfo: 0.06, depth: 0.8, sweep: 400 }], ev: [['rajada', 9]] },
    vulcao: { bed: [{ ft: 'lowpass', ff: 120, v: 0.08, lfo: 0.13, depth: 0.5 }, { ft: 'highpass', ff: 4000, v: 0.004 }], ev: [['estalo', 0.7], ['borbulha', 3]] },
    neve: { bed: [{ ft: 'bandpass', ff: 800, q: 0.9, v: 0.035, lfo: 0.08, depth: 0.8, sweep: 500 }], ev: [['rajada', 7]] },
    castelo: { bed: [{ osc: 'sine', f: 55, ff: 300, v: 0.03 }, { osc: 'sine', f: 55.8, ff: 300, v: 0.03 }, { ft: 'bandpass', ff: 600, q: 1, v: 0.015, lfo: 0.07, depth: 0.7, sweep: 250 }], ev: [['corvo', 10], ['rajada', 12]] },
    masmorra: { bed: [{ ft: 'lowpass', ff: 180, v: 0.04, lfo: 0.04, depth: 0.3 }], ev: [['gota', 2.5]] },
    floresta_m: { bed: [{ ft: 'lowpass', ff: 220, v: 0.035, lfo: 0.05, depth: 0.3 }], ev: [['gota', 3.5], ['galho', 8]] },
    deserto_m: { bed: [{ ft: 'bandpass', ff: 500, q: 0.7, v: 0.02, lfo: 0.06, depth: 0.6 }], ev: [['areia', 4], ['gota', 9]] },
    neve_m: { bed: [{ ft: 'bandpass', ff: 900, q: 0.8, v: 0.02, lfo: 0.08, depth: 0.7, sweep: 300 }], ev: [['gelo', 3], ['rajada', 10]] },
    observatorio: { bed: [{ osc: 'sine', f: 110, ff: 400, v: 0.012, lfo: 0.1, depth: 0.5 }], ev: [['brilho', 1.6]] }
  };
  const AMBEV = {
    passaro(d) { const b = 2400 + Math.random() * 900, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) A.tone({ f: b + i * 120, f2: b + 700 + Math.random() * 300, d: 0.06, type: 'sine', v: 0.022, delay: i * 0.09, dest: d }); },
    passaro2(d) { const b = 1600 + Math.random() * 500; A.tone({ f: b, f2: b * 1.5, d: 0.12, type: 'sine', v: 0.02, dest: d }); A.tone({ f: b * 1.5, f2: b * 1.1, d: 0.16, type: 'sine', v: 0.018, delay: 0.16, dest: d }); },
    coruja(d) { A.tone({ f: 440, f2: 400, d: 0.3, type: 'sine', v: 0.03, dest: d }); A.tone({ f: 420, f2: 360, d: 0.45, type: 'sine', v: 0.028, delay: 0.42, dest: d }); },
    galho(d) { A.noise({ d: 0.04, v: 0.05, ft: 'bandpass', f: 1800, dest: d }); A.noise({ d: 0.03, v: 0.03, ft: 'bandpass', f: 2600, delay: 0.05, dest: d }); },
    grilo(d) { const f = 4200 + Math.random() * 600; for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) A.tone({ f, d: 0.018, type: 'square', v: 0.006, delay: k * 0.35 + i * 0.045, dest: d }); },
    sapo(d) { const f = 150 + Math.random() * 60; A.tone({ f, f2: f * 0.8, d: 0.09, type: 'square', v: 0.018, dest: d }); A.tone({ f: f * 1.1, f2: f * 0.85, d: 0.12, type: 'square', v: 0.016, delay: 0.13, dest: d }); },
    bolha(d) { A.tone({ f: 300 + Math.random() * 200, f2: 900, d: 0.06, type: 'sine', v: 0.03, dest: d }); },
    borbulha(d) { for (let i = 0; i < 3; i++) A.tone({ f: 120 + Math.random() * 80, f2: 260, d: 0.08, type: 'sine', v: 0.04, delay: i * 0.1, dest: d }); },
    estalo(d) { const n = 1 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) A.noise({ d: 0.015, v: 0.05, ft: 'highpass', f: 2500 + Math.random() * 2000, delay: i * 0.03 + Math.random() * 0.02, dest: d }); },
    agua(d) { A.noise({ d: 0.5, v: 0.03, ft: 'lowpass', f: 900, f2: 250, dest: d }); },
    rajada(d) { A.noise({ d: 1.6, v: 0.035, ft: 'bandpass', f: 500, f2: 1400, dest: d }); },
    corvo(d) { for (let i = 0; i < 2; i++) A.tone({ f: 620, f2: 480, d: 0.14, type: 'sawtooth', v: 0.012, delay: i * 0.22, dest: d }); },
    gota(d) { const f = 1200 + Math.random() * 900; A.tone({ f, f2: f * 0.55, d: 0.05, type: 'sine', v: 0.04, dest: d }); A.tone({ f: f * 0.9, f2: f * 0.5, d: 0.05, type: 'sine', v: 0.012, delay: 0.2, dest: d }); },
    areia(d) { A.noise({ d: 0.6, v: 0.02, ft: 'highpass', f: 3500, dest: d }); },
    gelo(d) { const f = 2600 + Math.random() * 1400; A.tone({ f, d: 0.25, type: 'triangle', v: 0.012, dest: d }); A.tone({ f: f * 1.5, d: 0.18, type: 'triangle', v: 0.008, delay: 0.05, dest: d }); },
    brilho(d) { const P5 = [1568, 1760, 2093, 2349, 2637, 3136]; A.tone({ f: P5[Math.random() * P5.length | 0], d: 0.6, type: 'triangle', v: 0.012, a: 0.05, dest: d }); }
  };
  const AMB_REGIAO = { vila: 'vila', lago: 'lago', planicie: 'campo', floresta: 'floresta', pantano: 'pantano', deserto: 'deserto', vulcao: 'vulcao', montanha: 'neve', castelo: 'castelo' };
  const AMB_MASM = { d1: 'masmorra', d2: 'floresta_m', d3: 'deserto_m', d4: 'vulcao', d5: 'neve_m', d6: 'castelo', d7: 'observatorio' };
  G.ambienceKey = () => {
    if (G.state !== 'play' || !G.map || !G.player) return null;
    if (G.map.kind === 'dungeon') return AMB_MASM[G.map.id] || 'masmorra';
    return AMB_REGIAO[G.world.regionAt(G.player.cx, G.player.cy)] || null;
  };

  // ------------------- passos por terreno -------------------
  const STEPS = {
    grama(r, d) { A.noise({ d: 0.05, v: 0.035, ft: 'bandpass', f: 2400 * r, f2: 1200, dest: d }); },
    terra(r, d) { A.noise({ d: 0.05, v: 0.05, ft: 'lowpass', f: 900 * r, dest: d }); A.tone({ f: 110 * r, f2: 70, d: 0.04, type: 'sine', v: 0.04, dest: d }); },
    areia(r, d) { A.noise({ d: 0.08, v: 0.03, ft: 'highpass', f: 2600 * r, dest: d }); },
    neve(r, d) { A.noise({ d: 0.04, v: 0.045, ft: 'bandpass', f: 1300 * r, dest: d }); A.noise({ d: 0.05, v: 0.03, ft: 'bandpass', f: 900 * r, delay: 0.03, dest: d }); },
    cinza(r, d) { A.noise({ d: 0.06, v: 0.045, ft: 'lowpass', f: 1500 * r, dest: d }); },
    gelo(r, d) { A.tone({ f: 2100 * r, d: 0.025, type: 'triangle', v: 0.018, dest: d }); A.noise({ d: 0.02, v: 0.02, ft: 'highpass', f: 5000, dest: d }); },
    pedra(r, d) { A.noise({ d: 0.035, v: 0.05, ft: 'bandpass', f: 1900 * r, dest: d }); A.tone({ f: 260 * r, f2: 180, d: 0.025, type: 'triangle', v: 0.03, dest: d }); },
    madeira(r, d) { A.tone({ f: 190 * r, f2: 140, d: 0.07, type: 'triangle', v: 0.06, dest: d }); A.noise({ d: 0.04, v: 0.03, ft: 'bandpass', f: 900 * r, dest: d }); },
    tapete(r, d) { A.noise({ d: 0.05, v: 0.03, ft: 'lowpass', f: 600 * r, dest: d }); },
    agua(r, d) { A.noise({ d: 0.12, v: 0.06, ft: 'bandpass', f: 1500 * r, f2: 600, dest: d }); }
  };
  const FLOOR_STEP = { tiles: 'pedra', planks: 'madeira', sand: 'areia', cave: 'pedra', ice: 'gelo' }, BASE_STEP = { grass: 'grama', sand: 'areia', snow: 'neve', ash: 'cinza' };
  // passo do herói: o chão sob os pés escolhe o timbre
  G.footstep = (p) => {
    const m = G.map; if (!m || !A.ok) return;
    const T = G.T, tx = Math.floor(p.cx / 16), ty = Math.floor((p.y + p.h - 1) / 16), id = m.get(tx, ty), th = G.THEMES[m.themeAt(tx, ty)] || {};
    let k;
    if (id === T.WATER) k = 'agua';
    else if (id === T.ICE) k = 'gelo';
    else if (id === T.BRIDGE) k = 'madeira';
    else if (id === T.CARPET) k = 'tapete';
    else if (th.dun) k = FLOOR_STEP[th.floor] || 'pedra';
    else if (id === T.PLAZA) k = 'pedra';
    else if (id === T.PATH) k = th.base === 'snow' ? 'neve' : th.base === 'sand' ? 'areia' : 'terra';
    else k = BASE_STEP[th.base] || 'grama';
    A.step(k);
  };
  G.music = function (name) { A.music(name); };
  G.audio.freq = freq; G.audio.TRACKS = T; G.audio.parse = parse; G.SFX = S;
})(window.G);
