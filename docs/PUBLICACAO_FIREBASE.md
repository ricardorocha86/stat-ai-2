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

O projeto está com `billingEnabled: false` e não tem Cloud Functions publicadas. A consulta ao Secret Manager foi recusada porque o faturamento está desativado. O Firebase exige o plano Blaze para publicar as funções: https://firebase.google.com/docs/functions/get-started.

O corretor, o tutor, a adaptação por IA e as recompensas geradas por IA ainda dependem de publicar esse backend. A leitura do material, os exercícios, as etapas de ajuda e os recursos interativos já estão hospedados.

A ativação do faturamento fica a cargo do usuário ou depende de autorização explícita, pois pode gerar cobranças por uso. O código das funções está preparado para Node.js 22. A chave local foi preservada em `functions/.secret.local`, ignorado pelo Git e pelo deploy; o backend de produção deve usar o segredo `GEMINI_API_KEY` no Secret Manager.

## Como concluir

1. Habilitar o plano Blaze no projeto selecionado.
2. Verificar ou configurar `GEMINI_API_KEY` no Secret Manager.
3. Atualizar o índice remoto com o material novo e manter `GEMINI_FILE_SEARCH_STORE_NAME` em `functions/.env`.
4. Publicar com `firebase deploy --only functions --project statai-app-2026-ricardo`.
5. Testar com login real: correção, tutor e persistência do progresso.

Na publicação inicial, as regras de Firestore e Storage existentes foram conferidas e a publicação não alterou dados de usuários nem essas regras.

Relatório automático: [verificacao-publicacao-firebase.json](verificacao-publicacao-firebase.json).

## Avaliações das capas

Também publicadas em 9 de outubro de 2026: notas persistentes por capa, média animada e contador de votos em tempo real. A atualização habilitou autenticação anônima para os visitantes e publicou regras de Firestore específicas para os votos, preservando o acesso aos dados privados do portal. Não exigiu a publicação de Cloud Functions.

Os testes de produção e de regras passaram; votos e contas de teste foram removidos. Detalhes e relatórios: [AVALIACOES_CAPAS.md](AVALIACOES_CAPAS.md).
