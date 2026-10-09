# Revisão da integração de exercícios e gabaritos

Revisão de 8 de outubro de 2026. O material aprovado continua preservado, e os 72 registros têm quatro etapas de ajuda. Esta rodada corrigiu problemas na integração, na contagem de progresso e na impressão.

## Correções feitas

| Problema encontrado | Ajuste |
| --- | --- |
| A correção por IA podia considerar a coincidência com o gabarito como prova de cópia, inclusive para letras e números. | A avaliação passa a aceitar equivalências, unidades e arredondamentos coerentes. Usa resolução, resposta final e critérios; não presume cópia pela coincidência. |
| Uma letra de múltipla escolha dependia de julgamento da IA. | A letra é comparada diretamente ao gabarito. Respostas com explicações continuam seguindo para avaliação por IA. |
| O servidor não bloqueava explicitamente os miniprojetos. | O corretor recusa atividades abertas e itens sem resolução ou com correção desativada. A interface aplica a mesma restrição. |
| O gerador de novos exercícios ainda criava três etapas. | A geração inclui dica, como começar, resolução e resposta final. |
| O status da IA era lido de texto livre. | O servidor exige JSON com status válido e feedback, valida ambos e mantém o formato esperado pela interface. |
| O progresso incluía quatro miniprojetos sem entrega concluível e contava IDs removidos. | A mesma contagem é usada na página inicial, na barra lateral e nas metas: 68 exercícios verificáveis, contando apenas IDs existentes. |
| Os botões de ajuda apontavam para painéis que ainda não existiam no HTML. | Os painéis têm IDs estáveis; ficam ocultos e sem conteúdo até a abertura de cada etapa. |
| A questão 5 da aula 21 exibia uma curva normal numa pergunta sobre falta de memória. | A figura decorativa foi retirada. O enunciado anterior foi preservado em enunciado_original, com observação na rastreabilidade. |
| Os gráficos HTML sumiam do PDF; tabelas podiam ficar cortadas. | Os 14 gráficos usados nos exercícios possuem imagens de impressão geradas do próprio recurso. A paginação mantém blocos completos, espera imagens e fontes e preserva tabelas e fórmulas. |
| A exportação completa ficava lenta. | Os estilos são carregados uma vez e cada página é renderizada isoladamente. As bibliotecas de PDF carregam quando a exportação é solicitada. |

A definição atual é “exercícios verificados”. Isso ainda não representa conclusão de todas as atividades do curso. Os quatro miniprojetos continuam com roteiro e rubrica, aguardando o fluxo de entregas.

## Verificação concluída

- 72 registros completos, 68 exercícios com correção e quatro atividades com rubrica.
- 41 conferências numéricas e preservação de 1.558 linhas do conteúdo aprovado.
- 1.120 casos de letras nas 32 questões de múltipla escolha.
- 69 execuções locais do próprio callable: respostas por letra, bloqueio de atividades e exigência de autenticação, sem chamadas à IA.
- Navegação pelos 72 registros e 292 aberturas de ajuda entre aluno e professor, incluindo conferência dos vínculos de acessibilidade.
- 51 recursos HTML carregados em tela estreita, sem erros de fórmulas, JavaScript ou transbordamento.
- 130 arquivos servidos conferidos, incluindo as 14 figuras de impressão e seus hashes.
- Cinco exportações reais: aula, unidade e curso, cobrindo os quatro níveis de inclusão de gabarito.
- PDF completo com 85 páginas, 72 enunciados e 288 etapas de ajuda, gerado em aproximadamente 15.4 segundos no navegador de teste.
- Margens e numeração conferidas nas 109 páginas das cinco exportações; páginas renderizadas e inspecionadas visualmente.
- Preparação idempotente dos gabaritos e recursos em 36 arquivos.
- TypeScript, build da aplicação e build das funções aprovados.

Relatórios: [corretor](verificacao-corretor.json), [integração e PDF](verificacao-revisao-integracao.json), [estrutura dos PDFs](verificacao-pdf-estrutura.json), [navegação](verificacao-gabaritos-navegador.json), [curso](verificacao-aulas.json) e [cálculos](verificacao-gabaritos-calculos.json).

## Próximos passos, em ordem

1. **Validar o corretor com login e IA reais.** As alterações das funções estão no código local e precisam ser publicadas no Firebase para valer nas chamadas da aplicação. Conferir resposta correta, parcial, incorreta, arredondamentos, unidades e salvamento após acerto. Não houve publicação nesta rodada.
2. **Persistir a prática e implementar entregas.** Salvar rascunho, tentativas, feedback e etapas de ajuda abertas por usuário e exercício. Separar conclusão de acerto. Para os miniprojetos, permitir entrega de texto ou arquivo e registrar o estado da avaliação.
3. **Integrar o tutor ao material novo e aos níveis de ajuda.** Atualizar o índice remoto, enviar o exercício e o nível de ajuda permitido ao tutor e citar as fontes recuperadas. O índice remoto ainda não foi atualizado.
4. **Alinhar a pontuação ao plano.** A interface ainda usa três estrelas por aula como faixas de progresso. O plano prevê pontuação por exercício acertado; definir e implementar essa contagem junto com tentativas e conclusão.
5. **Avançar para os recursos seguintes.** Continuar de onde parou, revisão espaçada, flashcards e narração ficam depois de estabilizar exercícios, progresso e tutor.

## Manutenção

As edições de gabarito e enunciado ficam em [gabaritos_livro.json](../data/gabaritos_livro.json). Após reaplicar os gabaritos ou alterar um gráfico usado por exercícios, regenere as imagens de impressão com o Vite local aberto:

    python scripts/prepare_exercise_answers.py
    node scripts/prepare_print_resources.cjs
    python scripts/verify_course.py --source "C:\Users\Pichau\Documents\Streamlit Apps\Stat-AI-1.0" --base-url http://localhost:3001
    python scripts/verify_exercise_answers.py
    npx tsc --noEmit
    npm run build --prefix functions
    node scripts/test-exercise-evaluation.cjs
    npm run build

O gerador de imagens requer Playwright e Chromium, disponíveis no runtime local usado nesta revisão. STATAI_BASE_URL e STATAI_CHROMIUM_PATH permitem indicar outro servidor local e executável. O manifesto [recursos-impressao.json](recursos-impressao.json) permite detectar figuras desatualizadas após mudanças no HTML, no tema ou no Plotly.

## Limites desta verificação

A navegação usou componentes reais em uma página de teste local. Os testes do callable executaram o handler diretamente; não substituem uma chamada autenticada pelo Firebase nem uma avaliação pelo modelo remoto. Não houve gravação em conta real nem alteração do índice remoto.

O PDF atual renderiza o conteúdo visualmente como imagens para preservar fórmulas e gráficos. O texto do corpo não é selecionável ou pesquisável no arquivo; uma exportação acessível com texto selecionável é uma melhoria futura. Um bloco individual que exceda a área útil é recusado para evitar corte silencioso.

O build ainda avisa sobre o tamanho do pacote principal. As bibliotecas de PDF já foram separadas; a otimização dos demais módulos não foi realizada nesta rodada.

## Atualização de publicação — 9 de outubro de 2026

O frontend foi publicado em https://statai-app.web.app, e a versão hospedada foi conferida. As funções de IA continuam pendentes porque o projeto está sem faturamento habilitado; o Firebase exige o plano Blaze para publicá-las. Detalhes e evidências em [PUBLICACAO_FIREBASE.md](PUBLICACAO_FIREBASE.md).
