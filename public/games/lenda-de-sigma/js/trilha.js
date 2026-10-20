'use strict';
// =====================================================================
//  Trilha sonora estendida: cada música ganha uma PARTE B (o loop vira
//  A + B), as lutas ganham versões de FÚRIA (mais rápidas, com arpejo e
//  bateria pesada) para a segunda fase dos chefes, e o vilão Viés ganha
//  um tema próprio para as cenas de história.
//  Regra: em cada música, a parte B de um canal tem a mesma duração da
//  parte A, para os canais continuarem sincronizados.
// =====================================================================
(function (G) {
  const A = G.audio, T = A.TRACKS;
  const len = s => s.trim().split(/\s+/).reduce((n, tok) => { if (!tok || tok === '|') return n; const l = tok.split(':')[1]; return n + (l ? +l : 1); }, 0);

  // o baixo do vulcão tinha 54 tempos (dessincronizava): completa até 64
  if (T.volcano && len(T.volcano.ch[1].s) === 54) T.volcano.ch[1].s += ' C3:2 G2:2 C3:2 G2:2 C3:2';

  // partes B (por canal, na mesma ordem dos canais; null = canal segue em loop curto)
  const B = {
    village: [
      'D5:2 F5:2 A5:4 G5:2 F5:2 E5:4 D5:2 C5:2 Bb4:4 C5:2 D5:2 C5:4 Bb4:2 D5:2 G5:4 F5:2 E5:2 D5:4 C5:2 D5:2 E5:2 G5:2 C5:8',
      'D3:2 F3:2 A3:2 F3:2 A2:2 C3:2 E3:2 C3:2 Bb2:2 D3:2 F3:2 D3:2 F2:2 A2:2 C3:2 A2:2 G2:2 Bb2:2 D3:2 Bb2:2 C3:2 E3:2 G3:2 E3:2 A2:2 C3:2 E3:2 C3:2 C3:2 E3:2 G3:2 Bb3:2',
      null
    ],
    forest: [
      'F5:3 G5:1 A5:2 C6:2 Bb5:3 A5:1 G5:4 E5:3 F5:1 G5:2 Bb5:2 A5:4 F5:4 G5:3 A5:1 Bb5:2 D6:2 C6:3 Bb5:1 A5:4 G5:2 E5:2 C#5:2 E5:2 D5:8',
      'F3:2 C4:2 F4:2 C4:2 G2:2 D3:2 G3:2 D3:2 C3:2 G3:2 C4:2 G3:2 F3:2 C4:2 F4:2 C4:2 G2:2 D3:2 G3:2 D3:2 F3:2 C4:2 F4:2 C4:2 A2:2 E3:2 C#4:2 E3:2 D3:2 A3:2 D3:4',
      null
    ],
    desert: [
      'A5:2 B5:1 C6:1 B5:2 A5:2 G#5:2 F5:2 E5:4 F5:2 G#5:1 A5:1 B5:2 A5:2 G#5:4 .:4 E6:2 D6:1 C6:1 B5:2 A5:2 G#5:2 F5:2 E5:4 F5:2 E5:2 D5:2 F5:2 E5:8',
      'A2:2 A2:1 A2:1 E3:2 A2:2 E3:2 E3:1 E3:1 B3:2 E3:2 D3:2 D3:1 D3:1 A3:2 D3:2 E3:2 E3:1 E3:1 B3:2 E3:2 A2:2 A2:1 A2:1 E3:2 A2:2 F3:2 F3:1 F3:1 C4:2 F3:2 D3:2 D3:1 D3:1 A3:2 D3:2 E3:2 B2:2 E3:4',
      null
    ],
    snow: [
      'G5:2 D5:2 B5:4 A5:2 F#5:2 D5:4 C5:2 E5:2 A5:3 G5:1 F#5:4 D5:4 G5:2 B5:2 D6:4 C6:2 A5:2 F#5:4 E5:2 G5:2 F#5:2 D#5:2 E5:8',
      'G4 B4 D5 B4 G4 B4 D5 B4 F#4 A4 D5 A4 F#4 A4 D5 A4 A4 C5 E5 C5 A4 C5 E5 C5 F#4 A4 D5 A4 F#4 A4 D5 A4 G4 B4 D5 B4 G4 B4 D5 B4 F#4 A4 D5 A4 F#4 A4 D5 A4 C4 G4 E4 G4 B3 F#4 D#4 F#4 E4 B4 G4 B4 E4 B4 G4 B4'
    ],
    volcano: [
      'Ab5:2 G5:2 F5:2 Eb5:2 F5:4 .:4 G5:2 F5:2 Eb5:2 D5:2 Eb5:4 .:4 C5:2 Eb5:2 G5:2 C6:2 B5:4 Ab5:2 G5:2 F5:2 G5:2 Ab5:2 B5:2 C6:8',
      'F2:1 F2:1 F3:2 F2:1 F2:1 Eb3:2 F2:1 F2:1 F3:2 C3:2 Ab2:2 Eb2:2 Eb2:1 Eb2:1 Eb3:2 Eb2:2 Eb2:2 Eb2:1 Eb2:1 Bb2:2 Eb2:2 C3:2 C3:1 C3:1 C4:2 C3:2 Ab2:2 Ab2:1 Ab2:1 Ab3:2 Ab2:2 G2:2 G2:1 G2:1 G3:2 G2:2 G2:2 B2:2 C3:4',
      null
    ],
    castle: [
      'F5:2 A5:2 D6:4 C6:2 Bb5:2 A5:4 G5:2 Bb5:2 D6:4 C#6:8 D6:2 C6:2 Bb5:3 A5:1 G5:2 F5:2 E5:4 F5:2 G5:2 A5:2 C#5:2 D5:8',
      'D3:2 A3:2 D3:2 A3:2 F2:2 C3:2 F2:2 C3:2 G2:2 D3:2 G2:2 D3:2 A2:2 E3:2 A2:2 C#3:2 Bb2:2 F3:2 Bb2:2 F3:2 G2:2 D3:2 G2:2 D3:2 A2:2 E3:2 A2:2 C#3:2 D3:2 A3:2 D3:4',
      null
    ],
    dungeon: [
      'C5:3 D5:1 E5:2 G5:2 F5:2 E5:2 D5:4 B4:3 C5:1 D5:2 F5:2 E5:4 C5:4 A4:3 B4:1 C5:2 E5:2 D5:2 C5:2 B4:2 G4:2 G#4:2 B4:2 D5:2 F5:2 E5:8',
      'C3:2 C4:2 C3:2 C4:2 D2:2 D3:2 D2:2 D3:2 G2:2 G3:2 G2:2 G3:2 C3:2 C4:2 C3:2 C4:2 A2:2 A3:2 A2:2 A3:2 G2:2 G3:2 G2:2 G3:2 E2:2 E3:2 G#2:2 B2:2 E2:2 E3:2 E2:2 E3:2',
      null
    ],
    cave: [
      'G4:4 .:4 B4:4 .:4 A4:4 .:4 D4:8 G4:4 .:4 F#4:4 .:4 E4:6 D#4:2 .:8',
      'C2:16 D2:16 E2:16 B1:16',
      '.:4 G5:1 .:11 .:2 D6:1 .:13 .:6 B5:1 .:9 .:8 F#5:1 .:7'
    ],
    boss: [
      'C6 C6 B5 A5 G5:2 A5:2 B5 B5 A5 G5 F#5:4 A5 A5 G5 F#5 E5:2 F#5:2 G5:2 E5:2 B4:4 C5 E5 A5 C6 B5:2 A5:2 G5 F#5 E5 F#5 G5:4 A5 G5 F#5 E5 D#5 E5 F#5 A5 B5:4 B4:4',
      'C2 C3 C2 C3 C2 C3 C2 C3 B1 B2 B1 B2 B1 B2 B1 B2 A1 A2 A1 A2 A1 A2 A1 A2 B1 B2 B1 B2 B1 B2 D#2 B2 A1 A2 A1 A2 A1 A2 A1 A2 E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 B1 B2 B1 B2 E2 E3 E2 E3 B1:4',
      null
    ],
    finalboss: [
      'F5 A5 C6 F6 E6:2 C6:2 D6 C6 Bb5 A5 G5:4 Bb5 D6 F6 Bb6 A6:2 F6:2 G6:2 E6:2 C#6:4 D6 F6 A6 F6 E6:2 D6:2 C#6 D6 E6 C#6 A5:4 Bb5 A5 G5 F5 E5 F5 G5 C#6 D6:8',
      'F2 F3 F2 F3 C2 C3 C2 C3 Bb1 Bb2 Bb1 Bb2 C2 C3 C2 C3 Bb1 Bb2 Bb1 Bb2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 C#2 E2 D2 D3 D2 D3 A1 A2 A1 A2 Bb1 Bb2 Bb1 Bb2 F2 F3 F2 F3 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 C#2 E2 D2 D3 D2 D3',
      null
    ],
    observatory: [
      'F5:2 A5:2 C6:4 Bb5:2 A5:2 G5:4 Bb4:2 D5:2 F5:4 E5:2 D5:2 C#5:4 D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:4 G5:2 E5:2 C#5:2 E5:2 D5:8',
      'F2:4 F3:4 C2:4 C3:4 Bb1:4 Bb2:4 A1:4 A2:4 F2:4 D3:4 Bb1:4 G2:4 A1:4 A2:4 D2:8',
      'F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 D4 F4 A4 F4 D4 F4 A4 F4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4',
      null
    ],
    minigame: [
      'E5 G5 B5:2 G5 E5 F#5:2 D5 F#5 A5:2 F#5 D5 E5:2 C5 E5 G5:2 F#5 E5 D5 C5 B4:2 A4:2 G4:4',
      'E3:2 B3:2 E3:2 B3:2 D3:2 A3:2 D3:2 A3:2 C3:2 G3:2 C3:2 G3:2 D3:2 A3:2 G3:4',
      null
    ],
    ending: [
      'A5:4 G5:2 F5:2 E5:6 C5:2 D5:4 E5:2 F5:2 G5:8 A5:4 B5:2 C6:2 D6:6 C6:2 B5:2 A5:2 G5:2 B5:2 C6:8',
      'F4 A4 C5 A4 F4 A4 C5 A4 E4 G4 C5 G4 E4 G4 C5 G4 D4 F4 A4 F4 D4 F4 A4 F4 D4 G4 B4 G4 D4 G4 B4 G4 A3 C4 E4 C4 A3 C4 E4 C4 B3 E4 G4 E4 B3 E4 G4 E4 F4 A4 C5 A4 F4 A4 C5 A4 B3 D4 G4 D4 C4 E4 G4 C5',
      'F3:8 C3:8 D3:8 G2:8 A2:8 E3:8 F3:8 G2:4 C3:4'
    ]
  };
  for (const k in B) {
    const tr = T[k]; if (!tr) continue;
    B[k].forEach((s, i) => {
      const ch = tr.ch[i]; if (!s || !ch) return;
      if (len(s) !== len(ch.s)) { console.warn('trilha: parte B com duração diferente em', k, i, len(ch.s), len(s)); return; }
      ch.s = ch.s + ' ' + s; ch.notes = A.parse(ch.s);
    });
  }

  // versões de FÚRIA: mesma melodia, mais rápida, com arpejo e bateria pesada
  const arpBoss = 'E5 G5 B5 G5 E5 G5 B5 G5 D5 F#5 A5 F#5 D5 F#5 A5 F#5 C5 E5 G5 E5 C5 E5 G5 E5 B4 D#5 F#5 D#5 B4 D#5 F#5 D#5 E5 G5 B5 G5 E5 G5 B5 G5 A4 C5 E5 C5 B4 D#5 F#5 D#5 C5 E5 G5 E5 B4 D#5 F#5 D#5 E5 G5 B5 G5 E5 G5 B5 G5' +
    ' C5 E5 G5 E5 C5 E5 G5 E5 B4 D#5 F#5 D#5 B4 D#5 F#5 D#5 A4 C5 E5 C5 A4 C5 E5 C5 B4 D#5 F#5 D#5 B4 D#5 F#5 D#5 A4 C5 E5 C5 A4 C5 E5 C5 E5 G5 B5 G5 E5 G5 B5 G5 C5 E5 G5 E5 B4 D#5 F#5 D#5 E5 G5 B5 G5 B4 D#5 F#5 D#5';
  const arpFinal = 'D5 F5 A5 F5 D5 F5 A5 F5 A4 C#5 E5 C#5 A4 C#5 E5 C#5 Bb4 D5 F5 D5 A4 C#5 E5 C#5 D5 F5 A5 F5 D5 F5 A5 F5 D5 F5 A5 F5 F5 A5 C6 A5 G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4 A4 C#5 E5 C#5 A4 C#5 E5 C#5 Bb4 D5 F5 D5 D5 F5 A5 F5' +
    ' F5 A5 C6 A5 C5 E5 G5 E5 Bb4 D5 F5 D5 C5 E5 G5 E5 Bb4 D5 F5 D5 G4 Bb4 D5 Bb4 A4 C#5 E5 C#5 A4 C#5 E5 C#5 D5 F5 A5 F5 A4 C#5 E5 C#5 Bb4 D5 F5 D5 F5 A5 C6 A5 G4 Bb4 D5 Bb4 A4 C#5 E5 C#5 A4 C#5 E5 C#5 D5 F5 A5 F5';
  const fury = (base, bpm, arp, drums) => {
    const b = T[base];
    const ch = b.ch.filter(c => c.w !== 'noise').map(c => Object.assign({}, c, { v: c.v * 1.08 }));
    ch.push({ w: 'square', v: 0.016, s: arp }, { w: 'noise', v: 0.06, s: drums });
    for (const c of ch) c.notes = A.parse(c.s);
    return { bpm, spb: b.spb, ch };
  };
  T.boss_furia = fury('boss', 178, arpBoss, 'K x S K K K S S K x S K K S S S');
  T.finalboss_furia = fury('finalboss', 166, arpFinal, 'K K S x K K S K K K S x K S S S');

  // tema do Viés (cenas de história): sombrio e arrastado
  T.vies = { bpm: 72, spb: 2, ch: [
    { w: 'sawtooth', v: 0.028, s: 'B4:4 C5:2 B4:2 F5:6 .:2 E5:2 D5:2 C5:2 B4:2 A#4:8 B4:4 D5:2 F5:2 G#5:6 F5:2 E5:2 D5:2 C5:2 A#4:2 B4:8' },
    { w: 'triangle', v: 0.15, s: 'B1:8 B1:8 G1:8 F#1:8 B1:8 F1:8 E1:8 F#1:8' },
    { w: 'square', v: 0.012, s: 'D4:4 F4:4 B4:8 D4:4 G4:4 B4:8 D4:4 F4:4 G#4:8 C#4:4 F#4:4 A#4:8' },
    { w: 'noise', v: 0.03, s: 'K:4 .:4 K:2 .:6' }
  ] };
  for (const c of T.vies.ch) c.notes = A.parse(c.s);

  // a música da luta acompanha a fase do chefe
  G.bossMusic = (b) => {
    if (!b) return 'boss';
    if (G.map && G.map.id === 'd6') return b.phase2 ? 'finalboss_furia' : 'finalboss';
    return b.p2 ? 'boss_furia' : 'boss';
  };
  const ep2 = G.Boss.prototype.enterP2;
  G.Boss.prototype.enterP2 = function () { ep2.call(this); G.music('boss_furia'); };
})(window.G);
