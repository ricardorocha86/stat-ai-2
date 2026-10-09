# Avaliações das capas

Publicado em 9 de outubro de 2026 em https://statai-app.web.app, no projeto `statai-app-2026-ricardo`.

## Comportamento

- Cada uma das 107 capas recebe notas inteiras de 1 a 5.
- Ao clicar, as estrelas dão um breve efeito e depois mostram a média pelo preenchimento proporcional, inclusive frações de estrela. A média exata com uma casa decimal e a quantidade de votos aparecem em uma dica ao passar o mouse ou focar as estrelas pelo teclado. Não há linha extra nem texto de salvamento.
- A nota fica salva entre recargas. Alterar a própria nota substitui o valor anterior, sem aumentar o número de votos.
- A próxima capa tem sua própria nota e média. A média fica oculta até o visitante avaliar aquela capa.
- Falhas de gravação exibem uma mensagem e permitem tentar novamente. As animações respeitam a preferência por movimento reduzido.

## Identidade e armazenamento

A votação usa uma instância separada de Firebase Authentication, `statai-cover-ratings`, com autenticação anônima. A conta temporária é criada somente na primeira avaliação. Ela não inicia nem substitui o login Google do portal.

A identidade pertence ao navegador. Outro dispositivo, outro perfil ou a limpeza dos dados do site podem criar um novo visitante; este mecanismo não deduplica uma pessoa entre dispositivos.

No Firestore:

- `coverRatings/capa-001` até `coverRatings/capa-107`: `count`, `sum`, `updatedAt`. A média é calculada como `sum / count`.
- `coverRatings/{capa}/votes/{uid}`: `score`, `updatedAt` do visitante.

O serviço grava o voto e o agregado na mesma transação. Incrementos no servidor e novas tentativas em conflitos mantêm o contador correto durante avaliações simultâneas. A interface usa o agregado confirmado pelo Firestore.

As regras permitem a leitura pública do agregado de uma capa e a leitura individual somente do próprio voto. Escritas exigem identidade autenticada, nota válida, campos previstos e atualização atômica com a aritmética correta. Não há permissão de listar votos ou apagar documentos pelo cliente. As regras dos dados privados do portal foram preservadas.

## Configuração e manutenção

O provedor anônimo foi habilitado no Firebase; o provedor Google continua habilitado. Foram publicados o Hosting e as regras do Firestore. Este recurso não depende das Cloud Functions do tutor/corretor.

Arquivos principais:

- `services/coverRatingService.ts`: identidade, leitura, assinatura e gravação.
- `components/CoverRatingControls.tsx` e `components/cover-rating.css`: controles, média e animação.
- `components/LoginPage.tsx`: integração à capa.
- `firestore.rules`: validação e acesso.

Para republicar: `firebase deploy --only firestore:rules,hosting --project statai-app-2026-ricardo`. O Hosting executa o build configurado no predeploy.

## Verificação

- TypeScript e build de produção concluídos.
- 37 verificações das regras no emulador isolado: oito acessos permitidos e 29 recusados conforme esperado.
- 13 verificações no site publicado: dois visitantes, mudança e repetição de nota, três rodadas simultâneas, recarga, próxima capa, falhas, movimento reduzido e telas de 1280, 390 e 320 px.
- Capturas de computador e celular conferidas visualmente.
- Todos os votos e as contas anônimas criados pelos testes de produção foram removidos. O contador foi restaurado sem votos de teste.
- O emulador foi encerrado. O Java portátil e o cache do emulador usados exclusivamente no teste foram removidos; não foi necessário liberar o firewall.

Relatórios: [regras](verificacao-regras-avaliacoes-capas.json) e [produção](verificacao-avaliacoes-capas.json). O teste permanente das regras está em `scripts/test-cover-rating-rules.cjs` e exige um emulador local, usando o projeto isolado `demo-statai-cover-ratings`.

## Ajuste visual de 9 de outubro de 2026

Interface compacta republicada no Hosting: preenchimento proporcional nas estrelas, efeito imediato ao votar e dica com média e votos. TypeScript e build passaram. Os arquivos JavaScript e CSS publicados foram comparados byte a byte com o build. A conferência do site publicado validou a seleção de estrelas, a ausência de linha extra e texto de salvamento, e a tela de 320 px sem transbordamento ou erros de JavaScript. Esta revisão não iniciou servidor local, emulador ou Java e não criou votos de teste.

### Hover claro e distinção após votar

O hover passou a usar fundo branco, borda clara e sombra suave. O clique mantém a nota escolhida por um segundo, com salto das estrelas, anel e pequenas partículas douradas, antes da transição para a média. O estado após a votação usa um fundo dourado suave com borda própria. A animação também se repete ao clicar novamente na mesma nota; não cria voto adicional. Movimento reduzido preserva o destaque de cor sem deslocamentos ou partículas.

TypeScript e build passaram. A verificação no site publicado confirmou animação no primeiro clique e no clique repetido, o hover claro, a formatação distinta e a tela de 320 px sem erros de JavaScript ou transbordamento. O voto e a conta de teste foram removidos. Relatório: [verificacao-interface-avaliacoes-capas.json](verificacao-interface-avaliacoes-capas.json).
