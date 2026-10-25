# A Lenda de Sigma

A seção **Jogos**, depois de **Ferramentas**, abre **A Lenda de Sigma — O Reino dos Dados**. O jogo usa a versão 2D remasterizada da raiz de `Documentos/TesteJogo`: apenas `index.html` e os 34 scripts referenciados. Arte e áudio são gerados pelo código. As cópias `versao-2d-original` e `versao-3d` não fazem parte do app.

A página inicial anuncia o jogo como novidade (`components/games/SigmaGameAnnouncement.tsx`): o botão **Jogar agora** abre a mesma página da seção Jogos.

## Progresso por conta

- Documento: `users/{Firebase Auth UID}/games/lenda-de-sigma`.
- O pai React usa a sessão Firebase já autenticada. O iframe recebe o save antes de iniciar e usa armazenamento em memória. Mensagens são aceitas apenas do iframe ativo, na mesma origem.
- `progress` preserva o JSON nativo completo: inventário, missões, cristais, aulas, mapa, atributos, tempo e posição. `settings` guarda volumes e modo de toque. O documento inclui versão, revisão, horário local da alteração e `updatedAt` do servidor.
- As regras existentes em `firestore.rules` para `users/{userId}/**` já permitem acesso somente ao dono da conta. Não é necessário liberar uma coleção pública ou alterar regras.
- Salvamento a cada 15 segundos fora de diálogos/transições, nos pontos originais do jogo, no botão **Salvar agora** e ao sair da página/ocultar o app. Escritas são agrupadas e enviadas em ordem.
- Alterações pendentes ficam em `statai:game:lenda-de-sigma:v1:{uid}` no aparelho e são reenviadas quando a conexão voltar. O indicador só confirma o salvamento na conta após a resposta do Firestore.
- A leitura tenta o servidor antes de abrir o jogo. Se falhar e não houver cópia da conta, a página oferece nova tentativa, preservando o save remoto. A chave genérica do jogo independente não é importada para contas do Stat AI. Aberta direto, fora do Stat AI, a página do jogo inicia sem aviso e guarda o progresso só na memória (nada vai para a conta).
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
- **Desempenho**: `shoreFn` monta a vizinhança uma vez por tile e devolve a distância por pixel; a água funda pula o ruído. O chão vizinho é pré-montado em fatias de ~2,5 ms por quadro (`G.ground.idle`, `makeJob`/`runJob`), e um chunk visível que ainda estava em montagem é concluído de onde parou.

### Mini-chefes

Arte em peças (`reiDado`, `histoColosso` e `boxSentinela` em `js/bossart.js`), animadas em `js/observatorio.js` com `G.rig.part`:

- **Rei Dado** (Abismo do Acaso): dado em perspectiva 3/4 com a face sorteada na frente e uma face vizinha válida na lateral, coroa com joias, manto de arminho, olhos no tampo (severos, bravos, piscando, tontos) e luvas com cetro. Agacha antes de pular, estica no ar e achata ao cair.
- **Histograma Colossal** (Torre das Distribuições): barras de gelo com um sulco por unidade de frequência, tampas facetadas, base em forma de eixo x com seta e pés de rocha. Os olhos ficam na barra mais alta (a moda) e a frequência de cada barra aparece enquanto ele troca de forma e mira.
- **Sentinela Boxplot** (Observatório): metades Q1 e Q3 de pedra com constelações, mediana dourada, cúpula com lente e bigodes de aço com ponta em T. Sem a mediana, as metades se separam e tombam.
- O corpo desenhado recebe golpes (`hurtbox`); o contato continua na base (`contactBox`, agora respeitado também por `G.Enemy`).

### Enigmas

- Toda sala de enigma ganha uma placa com o enunciado ao lado da porta de entrada (`puzzleSign` em `js/dungeons.js`), salvo os enigmas que já têm placa própria (`sign: true`).
- A trilha de valores (`PUZ.stonepath`) se orienta pela porta: quem entra pela direita ou pela esquerda atravessa as fileiras na horizontal.
- **Dicas em degraus** (`dicas` no retorno de cada `PUZ`, `G.dun.dicas`): a placa do enigma ganha uma dica depois de 2 erros ou 75 s na sala, e outra mais direta depois de 4 erros ou 150 s. Um "?" azul pisca na placa quando há dica nova. Erros contam por `G.recordQuiz(…, false)` ou `c.erro()`; em enigmas de várias etapas, a contagem recomeça a cada etapa.
- **Caderno de Enigmas** (aba ENIGMAS do menu, `G.drawCadernoTab` em `js/dungeons.js`): lista os enigmas de cada masmorra, marca os vistos e os resolvidos e, depois de resolvido, explica o que cada um ensina.
- Avisos longos quebram em várias linhas e ficam mais tempo na tela (`toast` em `js/ui.js`).

| Sala | O que mudou |
|---|---|
| Tabuleiro dos 36 (Abismo, no lugar dos dados rolantes) | O chão é o espaço amostral de dois dados (coluna = vermelho, linha = azul). Pulando (Z) nas casas, o jogador acende três eventos: soma 7 (6 casas), pelo menos um k (11 casas, não 12) e "o vermelho caiu v" com soma ≥ 8 (probabilidade condicional). Casa errada dá 1 de dano e explica a conta. |
| Pesquisa no Salão | Julga o método: a amostra precisa cobrir as 4 fileiras e a faixa escolhida tem de bater com a proporção da amostra (ou a real). Antes, numa simulação de 200 mil partidas, até a melhor estratégia (2 por fileira) errava 55% das vezes. |
| Ritual do Fogo (1σ) | Uma placa mostra μ e σ: a habilidade cobrada é ler o intervalo μ ± σ. |
| Duelo dos Arqueiros | Um arqueiro tem viés (flechas juntas fora do centro), o outro tem variância (espalhadas em volta do centro). Duas perguntas: quem é mais consistente e quem acerta o centro em média. |
| Gráfico de Dispersão | Segunda fase: manter r ≥ 0,9 com a inclinação entre −0,6 e 0,6 (r mede alinhamento, não inclinação). |
| Ponte da Correlação (Castelo, no lugar da Ponte da Média) | Cada fileira mostra um mini gráfico de dispersão; a pedra certa traz o r (−0,9, −0,5, 0, +0,5, +0,9) mais próximo do r da nuvem. |
| Galeria das Mentiras (Castelo, no lugar dos cristais do viés) | Quatro quadros com gráficos desenhados (dois enganam, dois são honestos): eixo cortado, pizza que soma 120%, figura que cresce em altura e largura, correlação vendida como causa. Golpear um honesto dá dano e explica. |
| Sino de Gelo (Torre, no lugar dos cristais da normal) | Dois marcos na régua cercam uma área da normal (a porcentagem é calculada ao vivo com Φ). Etapas: 68% (μ ± σ) e 95% (μ ± 2σ). |
| Urnas Opacas (Abismo, no lugar das urnas visíveis) | Potes lacrados com 20%, 50% e 80% de bolas douradas. Cada golpe tira uma bola com reposição; o cristal só aceita resposta depois de 3 tiragens de cada pote. |
| Portões dos Sinos (Torre) | Dois grupos com μ e σ diferentes; o valor mais incomum é o de maior escore z, e a distância bruta às vezes engana. |
| Régua da Confiança | Depois de resolver, 20 amostras novas desenham 20 intervalos (σ derivado da margem, e = 1,96·σ/√4) e o quadro conta quantos pegaram μ. |
| Estátuas da Ordem | Mostra trocas usadas × mínimo (número de inversões); ordenar no mínimo dá 5 moedas. |
| Histograma de Gelo | 6 a 8 blocos (antes 9 a 12) e cada faixa mostra quantos já tem. |
| Arena da Moda | O placar mostra riscos de contagem, em feixes de 5, em vez de barras. |

## Pós-jogo (`js/amanha.js`)

- **Créditos**: depois de "Obrigado por jogar", o estado `gancho` mostra um caco da máscara do Viés voando pelo Pântano à noite, o Portão do Amanhã acendendo ("DADOS RECEBIDOS... APRENDENDO.") e o cartão **A Lenda de Sigma 2 — em breve**.
- **Formatura**: ao continuar depois da vitória, o Mestre Gauss ganha um "!" e entrega o **Capelo de Formatura** na praça, com os capelos voando.
- **Capelo** (item da tecla C, entra no rodízio de Q): voa 6,5 tiles girando, com rastro de brilho e faíscas, e volta como bumerangue; passa por cima de água, cercas, pedras e arbustos, para em árvores e paredes; causa 2 + nível da espada de dano (chefes só fazem "tim"), aciona alavancas, braseiros e potes e traz moedas e corações. O **Capelo Dourado** voa 9 tiles e causa +2 de dano.
- **Relíquias**: nove pedestais no meio d'água (laguinhos 5x5 cavados ou água que já existia), a 2 tiles da margem, que só o capelo alcança: 4 fragmentos de coração (lago, floresta, montanha, vila), 2 poções (pântano, vulcão), 2 Bolsas Binomiais (+5 bombas; planície, castelo) e 50 moedas (deserto). Flags `cap_<região>`. `G.HEART_PIECES_TOTAL` passou a 44 e, com as tumbas dos mestres no lugar de quatro fragmentos, ficou em 40.
- **Poço das Estrelas** (praça da Vila Gauss): antes do Observatório, mostra estrelas de dia; depois dele (e da dica da Professora Gertrude), as estrelas formam uma coruja olhando para o sudoeste e o balde traz um fragmento de coração. O mapa passa a mostrar um "?" sobre a coruja.
- **Coruja do Saber** (ilhota no canto sudoeste do Pântano de Bayes): visível da margem desde o começo, dormindo do outro lado do lago. Chegar até ela pede todo o equipamento: parede rachada (bombas) → barreira de cristal (raio) → riacho de 2 tiles (botas) → argola do outro lado do lago, 4 tiles de água (gancho). Uma segunda argola, na trilha, serve para voltar da ilhota. O baú do fragmento do pântano fica no fim dessa trilha. O capelo na cabeça dela a acorda, mas só a menos de 6 tiles: da margem, ele bate na pedra e volta. Ela leva Sigma voando às Terras do Amanhã e, na volta, desce na ilhota.
- **Terras do Amanhã** (`d8`): a **Cidade do Amanhã**, um mapa aberto de 56×36 tiles em dia de feira, sem inimigos (os inimigos ficam no Núcleo, atrás do portão). Usa o motor das masmorras com uma sala só (`map.livre`): `G.dun.update` faz a câmera seguir o herói, `G.dun.roomAt` devolve a sala única e `G.dun.drawMap` desenha o mapa da cidade. Cada bairro tem seu chão (`map.temaFn`, temas `am_*`).
  - Lugares (cada um com uma função): Pouso da Coruja (chegada e volta), avenida com postes de neon até o **Portão do Amanhã**, Praça da Feira, Pavilhão da Inteligência Artificial, **Datacenter** (Big Data), canal com bits, Parque do Vale (horta e laguinho), Oficina (engrenagens, tanque de resfriamento e o A-7 treinando arremessos), costa com farol, **Café dos Dados** (a Barista Duda recupera toda a vida por 10 moedas), **Escola de Dados** (a Professora Íris dá as pistas dos totens e do Núcleo) e casas e escritórios sem letreiro. Drones sobrevoam a feira.
  - As barracas não têm nome escrito: cada uma tem um painel holográfico animado da sua área (pontos e reta, cartas caindo em duas caixas, onda com previsão pontilhada, erro encolhendo). Café e escola mostram só um ícone na porta.
  - **Totens de Dados** (ŷ, Σ, σ e r): dormem no meio da água (laguinho do parque, canal, mar e tanque da oficina). O capelo os acende; cada um explica o seu símbolo e manda um feixe de luz ao portão, que tem quatro encaixes nos pilares. Com os quatro acesos (`totem_*`), as grades se recolhem e o portão leva ao Núcleo.
  - Gente: dez moradores andando, cada um com um uso real de previsão ou IA (padaria, relógio, câmera, raio-X, trânsito, viés nos dados), o Robô Guia, Vicente (que estranha o portão), o Robô Tradutor e a Robô Pintora.
  - **Barracas e minijogos** (prêmio único na primeira vitória; depois, 20 moedas):

    | Barraca | Minijogo | Vitória | Prêmio |
    |---|---|---|---|
    | Regressão (Lavradora Ana) | Ajuste a Reta: mover a reta e ver os resíduos e o erro total | erro ≤ 1,25 × mínimos quadrados | Contêiner de Coração |
    | Classificação (Carteiro Tobias) | Triagem Relâmpago: 12 cartas, spam ou caixa contra o relógio, com matriz de confusão | 10 de 12 | Capelo Dourado |
    | Séries Temporais (Faroleira Marina) | Previsão das Marés: continuar tendência e ciclo por 4 horas | erro médio ≤ 0,35 m | Amuleto das Marés (meio coração a cada 15 s) |
    | Aprendizado de Máquina (Mestra Engrenagem) | Treine o Autômato: escolher a taxa de aprendizado (0,1, 0,5 ou 1,2) e ver a curva de erro | acertar o cesto em até 5 tentativas, 3 rodadas | Armadura de Silício (`armorLv` 3) |
    | IA (Livro Falante, no Pavilhão) | Humano ou Máquina?: frases das lições × frases de um modelo de bigramas treinado só com a prosa das lições | 6 de 8 | Espada do Amanhã (`swordLv` 4) |
    | Big Data (Engenheira Dara, no Datacenter) | Servidores em Paralelo: mandar 40 blocos de trabalho para 4 servidores sem nenhum passar do limite | todos processados | Tênis de Fibra Ótica (+20% de velocidade) |
- Salvar e continuar dentro da cidade retoma no mesmo ponto; a saída por morte ou menu volta para a margem da coruja.
- **Núcleo do Amanhã** (`d9`): mini-masmorra atrás do portão, com servidores de luz vermelha nas paredes e inimigos fortes (tier 2,5 a 3). Usa os prêmios da feira:
  - Cofre de Dados: a chave flutua numa ilha no meio do abismo; o capelo a busca.
  - Abismo de Dados: duas alavancas do outro lado erguem a ponte. Ficam a cerca de 120 px do ponto mais próximo: o capelo comum (104 px) não chega, o **Capelo Dourado** (144 px) chega.
  - Duas salas de combate dão a chave pequena e a Chave do Guardião.
  - **Viés 2.0**: holograma treinado com os dados da máscara, com escudo de dados que só o capelo quebra (depois, 3 s de espada). Ataca com anéis de pacotes, previsões mirando o herói e bots de ruído. Na metade da vida, foge pelos cabos (`boss_d9`), aparece o cartão **A Lenda de Sigma 2 — em breve** e surge o portal de volta para a cidade.
  - **Escudo de Confiança** (`js/escudo.js`): depois da fuga, um baú (`d9_escudo`) aparece no salão. O escudo entra no lugar da espada (Enter → STATUS → X na linha da arma, depois das espadas). Bloqueia tudo o que vem de frente e dos lados (270°), desfaz tiros e empurra o atacante; só as costas (90°) tomam dano, como as caudas de um intervalo de confiança. Dano forçado (quedas, lava, a tumba que recusa) passa. O X dá um empurrão com o escudo (meio dano, corta arbustos) e não há golpe giratório.

## Manuscritos dos Mestres (`js/manuscritos.js`)

Sete tumbas pelo reino, cada uma com uma lápide que explica a regra. Empurrar ou puxar a tumba do jeito certo revela uma escadinha para uma cripta pequena; lá o fantasma do autor conta a história, faz uma pergunta (errou, ele explica e pergunta de novo) e entrega o manuscrito numa cena própria: pergaminho que desce e se abre, texto escrito com pena, selo Σ de cera e o rolo voando para o canto com a contagem "k/7". A tumba que recusa range, treme e tira um pouco de vida.

| Mestre | Onde | Regra da tumba | Pergunta |
|---|---|---|---|
| Pascal e Fermat (1654) | Vulcão, atrás de parede rachada | duas tumbas (P e F): alinhadas com uma casa livre entre elas; a escada abre no meio | partida de 3 pontos parada em 2 a 1, com 64 moedas: 48 para quem tem 2 |
| Jacob Bernoulli (1713) | ilhota do Lago Bernoulli | cada empurrão lança 100 moedas; no 10º (mil lances) ela cede | em 1000 lançamentos a proporção de caras fica mais perto de 50% do que em 10 |
| Thomas Bayes (1763) | clareira no norte do Pântano | tumba com musgo; a lápide dá a priori (3/4 norte) e a verossimilhança do musgo: sul tem posterior 2/3 | moeda honesta × moeda de duas caras: 2/3 |
| Laplace (1812) | oeste dos Picos Gaussianos (traje) | placas de 2 a 12 com o histograma das somas de dois dados; levar à soma 7 | soma de 100 dados: sino em torno de 350 |
| Karl Pearson (1900) | sudeste do Deserto, atrás de barreira de cristal | pilares com 12, 9, 3 e 16 lançamentos de um d4 (esperado 10); empurrar para o 3 | o seis saiu 16 vezes em 60 lançamentos: (16 − 10)²/10 = 3,6 |
| Ronald Fisher (1935) | horta cercada nos Campos de Pascal | quadrado latino 3×3 com duas casas vazias; a tumba de trigo vai para a casa certa (a outra avisa) | a senhora que prova o chá, 8 xícaras: chutando, 1 em 70 |
| Leo Breiman (2001) | clareira no nordeste do Bosque, além do fosso | o capelo vira a alavanca e baixa a ponte; cinco árvores votam com setas e a maioria diz leste | por que a floresta erra menos que uma árvore |

- Estado em `P.flags.tumbas[id]` (`escada` e posição final das tumbas) e a lista em `P.manuscritos`; `G.progressoExtra` soma os 7 ao progresso total.
- Cada cripta é uma masmorra de uma sala (`cr_<id>`, tema escuro próprio, velas, decoração do autor e sarcófago com o emblema). A saída leva de volta ao lado da escada.
- **Florence** (enfermaria da Vila Gauss) apresenta o acervo quando o herói tem um manuscrito ou dois cristais, conta os novos, dá pistas em rodízio dos que faltam e, com os sete, entrega a **Pena dos Mestres** (`swordLv` 5, a arma mais forte).
- Menu: aba **MESTRES** (lista e detalhes de cada obra). Mapa: marcador de tumba (cinza; dourado depois do manuscrito).

## Equipamento

O menu (Enter → STATUS) mostra o herói com a armadura equipada, o equipamento e os itens. ▲▼ escolhe a linha e X troca a espada, troca a armadura ou bebe uma poção. `P.espadas` e `P.armaduras` guardam as peças conquistadas (`G.equip`); `swordLv`/`armorLv` são as equipadas. Saves antigos recebem todas as peças até a equipada. Cada espada tem lâmina e brilho próprios; cada armadura muda as cores da roupa do herói ou da heroína (couro marrom, malha prateada, silício escuro com detalhes ciano), gerada na primeira vez que aparece. Lojas e a têmpera do Tukey olham a melhor peça conquistada. A linha da arma tem sete casas: as cinco espadas (a 4 é a Espada do Amanhã), a **Pena dos Mestres** (`swordLv` 5, prêmio da Florence) e o **Escudo de Confiança** (`P.escudo`; `P.usaEscudo` quando está no braço).

## Controles

Z pula (um pulinho desde o começo; com as Botas de Salto, o pulo alto que cruza buracos, riachos estreitos, cercas e pedras), X ataca, conversa e confirma (J e Espaço também), C usa o item, Shift/Q/Tab trocam o item, Enter/Esc abrem o menu e M o mapa. Nos menus, Z cancela. No celular, os botões mostram as mesmas letras.

### Celular

- **Direcional sempre visível** (`js/touch.js`): fica no canto inferior esquerdo, semitransparente e com setas. Tocando nele, ele acende; tocando em outro ponto da metade esquerda, ele vai até o dedo e volta ao canto quando o dedo sai.
- **Tela cheia sempre deitada**: o botão ⛶ do jogo e o **Tela cheia** da página fazem a mesma coisa. Com a API de tela cheia (Android), a página entra em tela cheia e trava em paisagem. Sem ela (iPhone), a página cobre a tela por CSS. Em qualquer caso, se o aparelho continuar em pé, o jogo gira 90° (`T.setLandscape`, `G.rotated`); o toque e o `fit()` trocam largura e altura. A página avisa o jogo com a mensagem `landscape` e o jogo pede tela cheia com a mensagem `fullscreen`.

## Itens antes da hora

Bombas só aparecem depois das Bombas Binomiais: antes disso, blocos "?" e quedas que dariam bombas viram uma moeda azul (5 moedas). A regra fica em `Pickup` e em `G.give('bombs')`.

## Áudio

O botão **Silenciar / Ativar som**, no canto superior do jogo, e a tecla **V** alternam o som inteiro sem alterar os volumes escolhidos. Música e efeitos continuam ajustáveis separadamente em **Enter → Sistema**. A tecla **M** abre o mapa. O estado de silêncio acompanha as configurações salvas na conta.

- **Tema de cada chefe** (`BOSS_T` em `js/trilha.js`): Golem, Aranha, Escorpião, Dragão, Yeti, Hipótese Nula e os mini-chefes têm tonalidade, andamento e timbre próprios, cada um com versão de fúria para a segunda fase. A melodia é escrita à mão e o baixo e o arpejo saem dos acordes, então os canais têm sempre 64 passos. `G.bossMusic` escolhe a faixa; o Viés e o Viés Absoluto mantêm as suas.
- **Ambiência** (`AMB` em `js/audio.js`): cada região e masmorra tem uma camada contínua (brisa, água, vento com rajadas, rumor de lava, zumbido do castelo) e eventos esparsos (pássaros, grilos, sapos, coruja, estalos de lava, gotas, sinos de gelo, brilhos do observatório). Segue o volume dos efeitos.
- **Passos** (`G.footstep`): o chão sob o herói escolhe o timbre (grama, terra, areia, neve, cinza, gelo, pedra, madeira, tapete, água rasa).
- **Mixagem**: compressor no mestre, a música recua sob efeitos grandes (explosão, rugido, item, cristal) e fica abafada com o menu de pausa aberto.

## Blocos

Empurre caminhando contra o bloco, como antes. Para puxar, fique de frente para ele e pressione **X** (ou J, Espaço, A do controle ou X/ação no celular). O personagem recua junto com o bloco por uma casa. O movimento respeita paredes, outros blocos, perigos, limites dos trilhos e blocos fixos. Puxar no gelo move apenas uma casa.

## Verificação

Para jogar o pós-jogo sem refazer tudo: no localhost, `index.html?teste=pos-vies` (com `&heroina` para a heroína) começa com o save de quem acabou de vencer o Viés: seis cristais e o da Inferência, todos os itens até o Gancho, nível 14, parado na porta do castelo, antes da formatura (`js/teste-local.js`). O save fica só na memória: recarregar a página volta ao começo. Fora do localhost, ou sem o parâmetro, o arquivo não faz nada.

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
