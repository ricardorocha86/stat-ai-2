# Publicação do StatAI no Firebase

Publicado em 9 de outubro de 2026: https://statai-app.web.app.
Projeto: `statai-app-2026-ricardo`. Site de Hosting: `statai-app`. A publicação inicial foi limitada ao Hosting.

## Verificação da versão publicada

- 337 arquivos enviados; a versão de produção corresponde ao build local.
- 25 entradas no catálogo: apresentação, 23 aulas e apêndice.
- 72 exercícios e atividades, com 288 etapas de ajuda; 68 itens verificáveis e quatro miniprojetos.
- 130 arquivos do curso conferidos por HTTP e comparados byte a byte com a fonte local.
- 51 recursos HTML renderizados em tela de 320 px, sem transbordamento nem erros de JavaScript.
- Tela de entrada inspecionada em computador e celular; capa e botão carregaram.
- Login Google habilitado; domínio autorizado e popup chegou à tela de identificação do Google. Não houve autenticação com uma conta real.
- Documento principal e arquivos das aulas servidos com `Cache-Control: no-cache`.
- TypeScript, builds e verificações de exercícios passaram. Não foram encontradas chaves privadas do Gemini nos arquivos publicados.

## Pendência do backend

O projeto está com `billingEnabled: false` e não tem Firebase Functions publicadas. A consulta ao Secret Manager foi recusada porque o faturamento está desativado. O Firebase exige o plano Blaze para publicar as funções: https://firebase.google.com/docs/functions/get-started.

Todo o backend de IA roda em Firebase Functions (região `southamerica-east1`, Node.js 22, 2ª geração, `onCall`); nada roda fora do Firebase (Hosting, Authentication, Firestore, Storage e Functions). O modelo é o OpenAI GPT-6.1 Sol (`gpt-6.1-sol`), pela Responses API com `reasoning.effort: "medium"`, definido uma única vez em `functions/src/index.ts` (`TEXT_MODEL` e `REASONING`). As funções são:

- `sendStudentChat`: tutor do aluno; usa a ferramenta `file_search` sobre um vector store da OpenAI com as aulas.
- `evaluateStudentAnswer`: corretor com Structured Outputs. Alternativas de múltipla escolha são corrigidas de forma determinística, sem IA; atividades abertas não são corrigidas automaticamente.
- `generateInteractiveLesson`: aula adaptada (material interativo), com Structured Outputs.
- `generateExercise`: gerador de exercícios do modo professor, que está oculto na interface.

O corretor, o tutor e a adaptação por IA ainda dependem de publicar esse backend. A leitura do material, os exercícios, as etapas de ajuda e os recursos interativos já estão hospedados.

**As recompensas por marcos estão pausadas** enquanto o dono as reformula. O código foi mantido em `functions/src/achievementRewards.ts` (ainda usa Gemini, não é exportado e, por isso, não é publicado). A interface mostra os marcos alcançados como "em breve" e continua exibindo as recompensas já conquistadas.

A ativação do faturamento fica a cargo do usuário ou depende de autorização explícita, pois pode gerar cobranças por uso. A chave de IA nunca vai para o frontend: em produção ela fica no segredo `OPENAI_API_KEY` do Secret Manager e, no emulador local, em `functions/.secret.local`, ignorado pelo Git.

## Como concluir

1. Habilitar o plano Blaze no projeto selecionado.
2. Configurar o segredo `OPENAI_API_KEY` no Secret Manager:

   ```bash
   firebase functions:secrets:set OPENAI_API_KEY --project statai-app-2026-ricardo
   ```

   Para o emulador local, colocar a chave em `functions/.secret.local` (ignorado pelo Git).

3. Criar o vector store com as aulas. Na raiz do repositório:

   ```bash
   node scripts/build-lesson-vector-store.mjs --write-env
   ```

   O script envia cada `public/aulas/**/material.md` como "Aula NN - Título.md" (24 aulas de `public/aulas/catalogo.json`), lê a chave da variável de ambiente `OPENAI_API_KEY` ou de `functions/.secret.local` e grava `OPENAI_VECTOR_STORE_ID` em `functions/.env` (ignorado pelo Git; modelo em `functions/.env.example`). Repetir sempre que o material das aulas mudar: o script cria um novo store, e os antigos podem ser apagados no painel da OpenAI.

4. Compilar as funções e rodar os testes de correção (não fazem chamadas externas de IA):

   ```bash
   npm --prefix functions run build
   node scripts/test-exercise-evaluation.cjs
   ```

5. Publicar as funções:

   ```bash
   firebase deploy --only functions --project statai-app-2026-ricardo
   ```

6. Testar com login real: correção de exercícios (alternativas corrigidas sem IA; atividades abertas não são corrigidas automaticamente), tutor (respostas baseadas nas aulas), material interativo e persistência do progresso. As recompensas continuam pausadas e não fazem parte do teste.

Para atualizar apenas o frontend, use `firebase deploy --only hosting --project statai-app-2026-ricardo`.

Na publicação inicial, as regras de Firestore e Storage existentes foram conferidas e a publicação não alterou dados de usuários nem essas regras.

Relatório automático: [verificacao-publicacao-firebase.json](verificacao-publicacao-firebase.json).

## Avaliações das capas

Também publicadas em 9 de outubro de 2026: notas persistentes por capa, média animada e contador de votos em tempo real. A atualização habilitou autenticação anônima para os visitantes e publicou regras de Firestore específicas para os votos, preservando o acesso aos dados privados do portal. Não exigiu a publicação de Firebase Functions.

Os testes de produção e de regras passaram; votos e contas de teste foram removidos. Detalhes e relatórios: [AVALIACOES_CAPAS.md](AVALIACOES_CAPAS.md).
