// Verifica a física e o cenário reais no navegador, sem login ou acesso ao Firebase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

const base = process.env.STATAI_BASE_URL || 'http://127.0.0.1:4173';
const pastaSaida = path.resolve(__dirname, '../tmp/sigma-saltos-quedas');
fs.mkdirSync(pastaSaida, { recursive: true });

(async () => {
  const executavel = process.env.STATAI_CHROMIUM_PATH || [
    chromium.executablePath(),
    path.join(process.env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe'),
  ].find(caminho => fs.existsSync(caminho));
  const navegador = await chromium.launch({ headless: true, executablePath: executavel });
  const pagina = await navegador.newPage({ viewport: { width: 1152, height: 648 } });
  const erros = [];
  pagina.on('pageerror', erro => erros.push(erro.message));
  try {
    await pagina.goto(base + '/games/lenda-de-sigma/index.html');
    await pagina.waitForFunction(() => window.G?.canvasEl && G.world?.ensure);
    const resultado = await pagina.evaluate(() => {
      G._freeze = true;
      const verificacoes = [];
      const exigir = (condicao, mensagem) => { if (!condicao) throw new Error(mensagem); };
      const preparar = (botas = false, resolvida = true) => {
        G.P = G.newProgress(); G.P.items.boots = botas; G.P.hp = G.P.maxHp = 100;
        G.P.flags.d1_solved_H = resolvida;
        const { map, ents } = G.dun.build('d1');
        G.map = map; G.ents = ents; G.curRoom = map.byKey.H.idx;
        G.state = 'play'; G.cutscene = 0; G.trans = null; G.hitStop = 0; G.boss = null;
        G.ui.clear(); G.fx.clear();
        G.cam.x = map.byKey.H.px; G.cam.y = map.byKey.H.py - 8;
        G.input.codes = {}; G.input.pad = {}; G.input.hit = {};
        return map.byKey.H;
      };
      const criar = (x, y) => {
        G.ents = G.ents.filter(e => e !== G.player);
        const jogador = G.player = new G.Player(x, y); G.ents.push(jogador);
        return jogador;
      };
      const passo = (pulo = false) => {
        G.input.hit = pulo ? { b: true } : {};
        G.player.update(1 / 60); G.input.endFrame();
      };

      // Busca todos os momentos de impulso próximos à borda, incluindo pulo repetido.
      for (const acesso of ['sul', 'oeste', 'leste']) {
        for (let atraso = 0; atraso <= 16; atraso++) {
          const sala = preparar(false), sul = acesso === 'sul';
          const jogador = criar(sala.px + (sul ? 187 : acesso === 'oeste' ? 115 : 259), sala.py + (sul ? 88 : 28));
          G.input.codes[sul ? 'ArrowUp' : acesso === 'oeste' ? 'ArrowRight' : 'ArrowLeft'] = true;
          let alcancou = false;
          for (let quadro = 0; quadro < 100; quadro++) {
            passo(quadro >= atraso);
            if (jogador.state === 'fall') break;
            if (jogador.cx >= sala.px + 160 && jogador.cx < sala.px + 224 && jogador.cy < sala.py + 48) alcancou = true;
          }
          exigir(!alcancou, 'O pulinho atravessou o fosso pelo acesso ' + acesso + ', atraso ' + atraso);
        }
      }
      verificacoes.push('51 tentativas de acesso sem botas: o pulinho não chega ao patamar');

      for (const acesso of ['sul', 'oeste', 'leste']) {
        const sala = preparar(true), sul = acesso === 'sul';
        const jogador = criar(sala.px + (sul ? 187 : acesso === 'oeste' ? 115 : 259), sala.py + (sul ? 84 : 28));
        G.input.codes[sul ? 'ArrowUp' : acesso === 'oeste' ? 'ArrowRight' : 'ArrowLeft'] = true;
        let pousou = false;
        for (let quadro = 0; quadro < 38; quadro++) {
          passo(quadro === 0);
          exigir(jogador.state !== 'fall', 'As botas não venceram o fosso pelo acesso ' + acesso);
          if (quadro > 1 && jogador.z === 0) { pousou = jogador.allSafe(); break; }
        }
        exigir(pousou, 'O salto com botas precisa pousar em chão firme: ' + acesso + ' ' + JSON.stringify({ x: jogador.x - sala.px, y: jogador.y - sala.py, z: jogador.z, estado: jogador.state }));
      }
      verificacoes.push('Botas atravessam as duas casas e pousam no patamar pelos três acessos');

      for (const perigo of ['PIT', 'WATER', 'LAVA']) for (const direcao of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
        preparar();
        G.map = new G.GameMap('queda', 'interior', 24, 20, G.T.GROUND);
        const horizontal = direcao === 'ArrowLeft' || direcao === 'ArrowRight';
        const sentido = direcao === 'ArrowRight' || direcao === 'ArrowDown' ? 1 : -1;
        for (let a = 0; a < (horizontal ? 20 : 24); a++) for (let b = 0; b < 24; b++) {
          if (sentido > 0 ? b >= 10 : b <= 9) G.map.set(horizontal ? b : a, horizontal ? a : b, G.T[perigo]);
        }
        G.ents = [];
        const jogador = criar(horizontal ? (sentido > 0 ? 140 : 170) : 120, horizontal ? 120 : (sentido > 0 ? 140 : 170));
        G.input.codes[direcao] = true;
        let quedas = 0, estavaCaindo = false, posicaoRetorno;
        for (let quadro = 0; quadro < 240; quadro++) {
          passo();
          if (jogador.state === 'fall' && !estavaCaindo) quedas++;
          if (estavaCaindo && jogador.state === 'normal') posicaoRetorno = { x: jogador.x, y: jogador.y };
          estavaCaindo = jogador.state === 'fall';
        }
        exigir(quedas === 1, perigo + '/' + direcao + ': caiu ' + quedas + ' vezes com a direção segurada');
        exigir(jogador.allSafe(), perigo + ': retorno fora de chão firme');
        exigir(jogador.posicaoSegura(jogador.x, jogador.y, 8), perigo + ': retorno sem margem da borda');
        exigir(jogador.x === posicaoRetorno.x && jogador.y === posicaoRetorno.y, 'Direção mantida não deve empurrar após o retorno');
        exigir(G.P.hp === 100 - (perigo === 'LAVA' ? 4 : 2), 'A queda deve aplicar dano uma única vez: ' + perigo + '/' + direcao + ', HP ' + G.P.hp);
        G.input.codes = {}; passo();
        const antes = { x: jogador.x, y: jogador.y };
        G.input.codes[direcao] = true; passo();
        exigir(jogador.x !== antes.x || jogador.y !== antes.y, 'Movimento não retomou ao soltar e pressionar novamente');
      }
      verificacoes.push('Buraco, água e lava nas quatro direções: uma queda, recuo seguro, dano único e controle retomado');

      // Um retorno próximo a paredes e blocos não pode atravessá-los.
      {
        preparar(); G.map = new G.GameMap('parede', 'interior', 24, 20, G.T.GROUND); G.ents = [];
        for (let y = 0; y < 20; y++) { G.map.set(9, y, G.T.WALL); G.map.set(11, y, G.T.PIT); }
        const jogador = criar(163, 100); jogador.lastSafe = { x: 163, y: 100 };
        jogador.x = 178; jogador.startFall('pit'); jogador.respawnSafe();
        exigir(jogador.allSafe(), 'O retorno não pode entrar na parede do corredor estreito');
        exigir(jogador.x >= 160 && jogador.x + jogador.w <= 176, 'O retorno cruzou a parede ou o fosso');
      }
      verificacoes.push('Corredor estreito aceita margem menor sem atravessar paredes');
      {
        preparar(); G.map = new G.GameMap('piso-alterado', 'interior', 24, 20, G.T.PIT); G.ents = [];
        G.map.set(2, 2, G.T.FLOOR);
        const jogador = criar(180, 180); jogador.startFall('pit'); jogador.respawnSafe();
        exigir(jogador.state === 'normal' && jogador.allSafe(), 'Piso alterado exige buscar outro chão seguro');
      }
      verificacoes.push('Checkpoint que perdeu o chão usa uma posição válida, inclusive além de quatro casas');
      {
        preparar(); G.map = new G.GameMap('bloco', 'interior', 24, 20, G.T.GROUND); G.ents = [];
        const jogador = criar(150, 100); jogador.lastSafe = { x: 147, y: 100 };
        G.map.set(10, 6, G.T.PIT);
        G.ents.push(new G.PushBlock(128, 96, 1));
        jogador.x = 162; jogador.kbT = 1; jogador.kbx = 170;
        jogador.startFall('pit'); jogador.respawnSafe();
        exigir(jogador.allSafe() && !G.rectBlocked(jogador.x, jogador.y, jogador.w, jogador.h, jogador), 'Retorno dentro de bloco');
        exigir(jogador.kbT === 0 && jogador.kbx === 0 && jogador.vx === 0, 'O recuo de dano não pode sobreviver à queda');
      }
      verificacoes.push('Retorno evita blocos e zera o impulso de dano');
      {
        const sala = preparar();
        const jogador = criar(sala.px + 187, sala.py + 84);
        jogador.lastSafe = { x: sala.px + 187, y: sala.py + 84 };
        jogador.y = sala.py + 58; jogador.startFall('pit'); jogador.respawnSafe();
        exigir(jogador.y >= sala.py + 80, 'O retorno levou o jogador para o lado do chefe');
        exigir(G.dun.roomAt(jogador.cx, jogador.cy).idx === G.curRoom, 'O retorno saiu da sala');
      }
      verificacoes.push('Retorno da primeira dungeon permanece no lado de origem do fosso e na mesma sala');

      // Cenário final para inspeção visual, com o enigma ainda jogável.
      const sala = preparar(true, false);
      G.P.hp = G.P.maxHp = 12;
      const jogador = criar(sala.px + 6 * 16, sala.py + 6 * 16);
      jogador.dir = 1;
      G._render();
      return { verificacoes, erroJogo: G.lastError?.message || null };
    });
    assert.equal(resultado.erroJogo, null);
    assert.deepEqual(erros, []);
    await pagina.screenshot({ path: path.join(pastaSaida, 'fosso-primeira-dungeon.png') });
    console.log(JSON.stringify(resultado, null, 2));
  } finally {
    await navegador.close();
  }
})().catch(erro => { console.error(erro); process.exitCode = 1; });
