# A Lenda de Sigma

A seção **Jogos**, depois de **Ferramentas**, abre **A Lenda de Sigma — O Reino dos Dados**. O jogo usa a versão 2D remasterizada da raiz de `Documentos/TesteJogo`: apenas `index.html` e os 32 scripts referenciados. Arte e áudio são gerados pelo código. As cópias `versao-2d-original` e `versao-3d` não fazem parte do app.

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

## Áudio

O botão **Silenciar / Ativar som**, no canto superior do jogo, e a tecla **V** alternam o som inteiro sem alterar os volumes escolhidos. Música e efeitos continuam ajustáveis separadamente em **Enter → Sistema**. A tecla **M** abre o mapa. O estado de silêncio acompanha as configurações salvas na conta.

## Blocos

Empurre caminhando contra o bloco, como antes. Para puxar, fique de frente para ele e pressione **Z** (ou J, Espaço, A do controle ou Z/ação no celular). O personagem recua junto com o bloco por uma casa. O movimento respeita paredes, outros blocos, perigos, limites dos trilhos e blocos fixos. Puxar no gelo move apenas uma casa; dados gigantes continuam girando na direção do movimento.

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
