# A Lenda de Sigma

A seção **Jogos**, depois de **Ferramentas**, abre **A Lenda de Sigma — O Reino dos Dados**. O jogo usa a versão 2D remasterizada da raiz de `Documentos/TesteJogo`: apenas `index.html` e os 32 scripts referenciados. Arte e áudio são gerados pelo código. As cópias `versao-2d-original` e `versao-3d` não fazem parte do app.

A página inicial anuncia o jogo como novidade (`components/games/SigmaGameAnnouncement.tsx`): o botão **Jogar agora** abre a mesma página da seção Jogos.

## Progresso por conta

- Documento: `users/{Firebase Auth UID}/games/lenda-de-sigma`.
- O pai React usa a sessão Firebase já autenticada. O iframe recebe o save antes de iniciar e usa armazenamento em memória. Mensagens são aceitas apenas do iframe ativo, na mesma origem.
- `progress` preserva o JSON nativo completo: inventário, missões, cristais, aulas, mapa, atributos, tempo e posição. `settings` guarda volumes e modo de toque. O documento inclui versão, revisão, horário local da alteração e `updatedAt` do servidor.
- As regras existentes em `firestore.rules` para `users/{userId}/**` já permitem acesso somente ao dono da conta. Não é necessário liberar uma coleção pública ou alterar regras.
- Salvamento a cada 15 segundos fora de diálogos/transições, nos pontos originais do jogo, no botão **Salvar agora** e ao sair da página/ocultar o app. Escritas são agrupadas e enviadas em ordem.
- Alterações pendentes ficam em `statai:game:lenda-de-sigma:v1:{uid}` no aparelho e são reenviadas quando a conexão voltar. O indicador só confirma o salvamento na conta após a resposta do Firestore.
- A leitura tenta o servidor antes de abrir o jogo. Se falhar e não houver cópia da conta, a página oferece nova tentativa, preservando o save remoto. A chave genérica do jogo independente não é importada para contas do Stat AI.
- **Continuar** restaura a posição no mundo ou a sala da masmorra. Combates, diálogos e enigmas não são serializados no meio da execução; a sala é reconstruída com o progresso permanente. **Novo Jogo** mantém a confirmação original e limpa o save da conta.

O jogo é servido em `public/games/lenda-de-sigma`, fora do bundle React, e acompanha o build e a publicação padrão do app. As adaptações locais estão em `js/game.js` (armazenamento, retomada e escala em telas pequenas) e `js/stat-ai-bridge.js` (comunicação com o app); `index.html` carrega a ponte por último. A pasta de origem é preservada.

## Herói ou heroína

Depois de **Novo Jogo** (e da confirmação de apagar o save, quando houver), uma tela pede a escolha entre **Herói** e **Heroína** com ← → e Z; X volta ao título. O save antigo só é apagado ao confirmar a escolha. A heroína (`heroina` e `heroina_suit` em `js/sprites.js`) tem o mesmo equipamento do herói, com cabelo longo e faixa.

A escolha fica em `progress.personagem` (`'heroi'` ou `'heroina'`); saves sem o campo carregam o herói. `G.spriteHeroi()` dá o sprite certo no mundo, no menu, na introdução, no título, no fim de jogo e nos créditos. Falas dirigidas a Sigma usam `{masculino|feminino}`, resolvido por `G.genero` em diálogos, escolhas, banners, avisos e na introdução.

## Polimento visual (fatia do Templo da Média)

O Templo da Média é a fatia de referência do polimento; as mesmas técnicas valem para o resto do jogo.

- **Herói e heroína** (`js/sprites.js`, `js/entities.js`): specs com `walkN: 8, anims: true` geram caminhada de 8 quadros, respiração (`_idle0/1`), piscada (`_blink`), dano (`_hurt`) e golpe em 3 tempos (`_atk0/1/2`, com a mão de cada quadro em `G.dollHand(nome, vista, quadro)`). NPCs continuam com 4 quadros, idênticos aos de antes. A espada recua 33 ms antes do golpe; a janela de acerto não mudou.
- **Inimigos** (`js/enemies.js`, `js/foes.js`): achatamento ao levar golpe, surgimento com rebote e pedaços que caem na morte valem para todos. A Gosma estica e respinga, o Cogumau vira para onde anda e o Histograma Ambulante tem barras com volume, molas e olhos que seguem o herói.
- **Golem** (`js/bossart.js`, `js/bosses.js`): peças articuladas com pivôs (`pose()` define ângulos por estado, `rig()` encadeia bacia → tronco → ombro → cotovelo → punho). Cada peça tem uma camada `...Glow` que acende com a cor do núcleo. O corpo maior recebe golpes (`hurtbox`), mas o dano por contato continua só na base (`contactBox`).
- **Cenário e interface**: feixes de luz no tema `d1` (`rays` em `js/light.js`), emblema μ no chão da arena (`EMBLEMA` em `js/dungeons.js`) e cartão de entrada de chefe com faixas de cinema (`G.ui.bossCard`).

### Expansão para o jogo todo

- **Chefes** (`js/bossart.js`, `js/bosses.js`): todos os chefes principais usam peças articuladas com `pose()` por estado. Ajudantes comuns: `part` (peça com pivô e camada de brilho), `ik` e `leg` (perna de dois ossos por cinemática inversa) e `seg`/`limbSeg` (segmentos de membro com versão espelhada para manter a luz por cima).
  - Aranha Mediana: 8 pernas por IK com passo alternado, abdome com 7 valores ordenados (a mediana dourada brilha), quelíceras que abrem.
  - Escorpião Desvio-Padrão: placas com σ, pinças grandes, cauda em corrente que se arma antes do leque e se achata na investida.
  - Dragão dos Dados: pescoço com as faces 1–6 de um dado, mandíbula separada, asas, olhos de réptil; emerge e afunda na lava com recorte.
  - Yeti Gaussiano: corpo com silhueta de sino e a curva normal no peito, chifres de gelo, braços em dois segmentos.
  - Viés: manto com bainha em "gráfico enviesado" (4 quadros), mangas por feitiço e distorção em fatias ao teleportar (`drawVies` aceita a pose como 8º parâmetro; os outros usos continuam iguais).
  - Hipótese Nula: 30% maior, com estrelas no manto. O Viés Absoluto já tinha arte própria e não mudou.
  - Em todos, a espada acerta o corpo maior (`hurtbox`), mas o dano por contato continua na base original (`contactBox`).
- **Inimigos**: movimento próprio via `squish()` (lobo galopa, chama tremula, fantasma flutua, morcego balança, aranhinha corre, cogumau ginga), encolhem antes de atacar e esqueletos/cavaleiros andam em 8 quadros.
- **Interface**: retratos falantes nos diálogos (boca abre enquanto o texto corre, piscada), gerados na primeira fala (`G.portraitVariants`); caixa de diálogo e menu de pausa com transição; aviso de poção aparece por cima do menu.
- **Cenário**: emblema entalhado em todas as arenas de chefe (símbolo de cada tema), feixes de luz no bosque, nas ruínas e na torre de gelo, copas balançando com o vento e sombras de nuvens no mapa aberto; no título, o herói respira e passam estrelas cadentes.

### Terreno das regiões frias, quentes e do Viés

- **Penhascos** (`cliffPx` em `js/tiles.js`): o paredão ocupa quase o tile, com estratos, rachaduras e base escura; a beirada é clara (neve escorrendo no gelo, veios de magma no vulcão), as laterais têm luz e sombra e o chão logo abaixo recebe sombra (`cliffShadow`). O topo dos platôs é rocha com manchas de neve ou grama, para não se confundir com o chão.
- **Gelo escorregadio**: borda orgânica de neve, aro claro e gelo mais fundo no meio.
- **"Lava" = crosta de magma** (`lavaFrames`): placas de basalto com fendas incandescentes que pulsam. Sem o Traje Térmico, o calor queima como antes; com ele, dá para atravessar e saem brasas sob os pés.
- **Planalto do Viés**: paleta violeta própria (chão, estradas, penhascos, arbustos) e fendas violeta brilhantes na terra.

### Água

- **Margens orgânicas** (`shoreDist` e `shoreBand` em `js/tiles.js`): os cantos convexos da água são arredondados e as quinas de terra cercadas por água (cantos internos) são recortadas em curva, com a água desenhada por baixo delas (`animId` inclui esses tiles). A margem tem largura irregular (`bankW`), barranco molhado, espuma e faixa rasa. Poças de 1 tile ficam redondas e riachos parecem riachos.
- **Queda coerente** (`G.inDeepWater`, usado em `js/entities.js`): o herói só cai quando passa da margem desenhada. Riachos de 1 tile de largura continuam bloqueando sem as Botas.

### Mini-chefes

Arte em peças (`reiDado`, `histoColosso` e `boxSentinela` em `js/bossart.js`), animadas em `js/observatorio.js` com `G.rig.part`:

- **Rei Dado** (Abismo do Acaso): dado em perspectiva 3/4 com a face sorteada na frente e uma face vizinha válida na lateral, coroa com joias, manto de arminho, olhos no tampo (severos, bravos, piscando, tontos) e luvas com cetro. Agacha antes de pular, estica no ar e achata ao cair.
- **Histograma Colossal** (Torre das Distribuições): barras de gelo com um sulco por unidade de frequência, tampas facetadas, base em forma de eixo x com seta e pés de rocha. Os olhos ficam na barra mais alta (a moda) e a frequência de cada barra aparece enquanto ele troca de forma e mira.
- **Sentinela Boxplot** (Observatório): metades Q1 e Q3 de pedra com constelações, mediana dourada, cúpula com lente e bigodes de aço com ponta em T. Sem a mediana, as metades se separam e tombam.
- O corpo desenhado recebe golpes (`hurtbox`); o contato continua na base (`contactBox`, agora respeitado também por `G.Enemy`).

### Enigmas

- Toda sala de enigma ganha uma placa com o enunciado ao lado da porta de entrada (`puzzleSign` em `js/dungeons.js`), salvo os enigmas que já têm placa própria (`sign: true`).
- A trilha de valores (`PUZ.stonepath`) se orienta pela porta: quem entra pela direita ou pela esquerda atravessa as fileiras na horizontal.

## Controles

Z pula, X ataca, conversa e confirma (J e Espaço também), C usa o item, Shift/Q/Tab trocam o item, Enter/Esc abrem o menu e M o mapa. Nos menus, Z cancela. No celular, os botões mostram as mesmas letras.

## Itens antes da hora

Bombas só aparecem depois das Bombas Binomiais: antes disso, blocos "?" e quedas que dariam bombas viram uma moeda azul (5 moedas). A regra fica em `Pickup` e em `G.give('bombs')`.

## Áudio

O botão **Silenciar / Ativar som**, no canto superior do jogo, e a tecla **V** alternam o som inteiro sem alterar os volumes escolhidos. Música e efeitos continuam ajustáveis separadamente em **Enter → Sistema**. A tecla **M** abre o mapa. O estado de silêncio acompanha as configurações salvas na conta.

- **Tema de cada chefe** (`BOSS_T` em `js/trilha.js`): Golem, Aranha, Escorpião, Dragão, Yeti, Hipótese Nula e os mini-chefes têm tonalidade, andamento e timbre próprios, cada um com versão de fúria para a segunda fase. A melodia é escrita à mão e o baixo e o arpejo saem dos acordes, então os canais têm sempre 64 passos. `G.bossMusic` escolhe a faixa; o Viés e o Viés Absoluto mantêm as suas.
- **Ambiência** (`AMB` em `js/audio.js`): cada região e masmorra tem uma camada contínua (brisa, água, vento com rajadas, rumor de lava, zumbido do castelo) e eventos esparsos (pássaros, grilos, sapos, coruja, estalos de lava, gotas, sinos de gelo, brilhos do observatório). Segue o volume dos efeitos.
- **Passos** (`G.footstep`): o chão sob o herói escolhe o timbre (grama, terra, areia, neve, cinza, gelo, pedra, madeira, tapete, água rasa).
- **Mixagem**: compressor no mestre, a música recua sob efeitos grandes (explosão, rugido, item, cristal) e fica abafada com o menu de pausa aberto.

## Blocos

Empurre caminhando contra o bloco, como antes. Para puxar, fique de frente para ele e pressione **X** (ou J, Espaço, A do controle ou X/ação no celular). O personagem recua junto com o bloco por uma casa. O movimento respeita paredes, outros blocos, perigos, limites dos trilhos e blocos fixos. Puxar no gelo move apenas uma casa; dados gigantes continuam girando na direção do movimento.

## Verificação

```powershell
node scripts/test-game-save-session.cjs
node scripts/test-block-pulling.cjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

O teste de navegador usa Playwright do runtime local do Codex e um Firestore Emulator isolado, com as regras reais do projeto e o ID `demo-statai-sigma`. Inicie o emulador em `127.0.0.1:8088` e o Vite em `localhost:3002`:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088'
node scripts/test-sigma-game-browser.cjs
```

O teste gera sua interface de teste e capturas em `tmp/sigma-game-test` (ignorado pelo Git). Não usa contas de produção. Confira também a [documentação de escrita](https://firebase.google.com/docs/firestore/manage-data/add-data), [leitura do servidor](https://firebase.google.com/docs/firestore/query-data/get-data) e [condições de acesso por usuário](https://firebase.google.com/docs/firestore/security/rules-conditions).
