# Gabaritos progressivos dos exercícios

Os 72 registros das aulas estão completos no formato do plano: dica → como começar → resolução comentada → resposta final. São 36 exercícios abertos, 32 questões de múltipla escolha e quatro atividades com roteiro e critérios.

Cada etapa é aberta pelo aluno. As telas de aluno e professor usam o mesmo componente; abrir ajuda não registra acerto nem conclusão. A exportação com gabarito completo também inclui a resposta final.

## Base e revisão

| Origem da resposta | Registros |
| --- | ---: |
| Resposta do autor conferida com o enunciado | 22 |
| Resposta recalculada ou adaptada aos dados exibidos | 13 |
| Resposta elaborada a partir do material e do enunciado | 33 |
| Roteiro de atividade aberta | 4 |

Os sete PDFs oficiais e seus endereços estão em [fontes/gabaritos-estatistica-aplicada/README.md](fontes/gabaritos-estatistica-aplicada/README.md). A origem e as referências de cada registro estão no campo gabarito_meta e em [gabaritos-exercicios.json](gabaritos-exercicios.json).

As 37 resoluções presentes na fonte foram preservadas em solucao_original para rastreabilidade. Dois enunciados incompletos foram tratados, mantendo enunciado_original: a tabela dos iogurtes foi recuperada do livro, e a árvore sem dados foi substituída por um exemplo equivalente elaborado, com probabilidades explícitas.

## Correções principais

| Aula e item | Resultado conferido |
| --- | --- |
| 3, exercício 2 | Classificação da nota explicita a convenção da escala; sorteio dentro de cada andar é estratificação, não seleção de conglomerados. |
| 4, exercício 1 | A tabela tem 9 MA e 2 PT; o PDF do autor indica 8 e 3. Para 120 pizzas, usam-se 36 MA e 8 PT, mantendo as demais contagens. |
| 6, exercício 6 | Pelo menos 8 L: 15/220 = aproximadamente 6,82%, sem somar percentuais arredondados. |
| 6, exercício 7 | Tabela da página 44 recuperada; total de 1.220 caixas. |
| 6, questão 7 | Para cinco classes e idades de 26 a 45, a amplitude inteira mínima adequada é 4 anos (B). O gabarito online indica E; a divergência está registrada. |
| 7, exercício 8 | Para os tempos da aula, frequências 4, 10, 12, 9, 5; os dados diferem do exercício do livro. |
| 7, questão 8 | 140 funcionários, alternativa D, confirmada pelo autor e pela área do histograma. |
| 12, exercício 1 | CV de aproximadamente 33,79%, calculado sem arredondamento intermediário. |
| 12, questão 13 | Alternativa D especifica amplitude total, eliminando a ambiguidade de “variabilidade geral”; a resposta A compara amplitudes interquartis. |
| 15, exercício 10 | Exemplo equivalente de duas retiradas independentes com reposição; caminho PD com probabilidade 9%. |
| 23, exercício 1 | Tarifa fixa de R$ 50 incluída: y = 50 + 0,20x; R$ 70 para 100 km. O gabarito do autor omite a parcela fixa. |
| 23, exercício 2 | Previsão inversa de 8,77 h com coeficientes completos; 8,75 h se forem usados os coeficientes arredondados do autor. |

As soluções distinguem aproximações, variância amostral/populacional, interpretação de correlação, extrapolação e convenções de quartis quando isso afeta a resposta. Nos exercícios originais adaptados, o gabarito corresponde aos dados apresentados na plataforma.

## Atividades abertas

Os quatro miniprojetos têm dica, orientação inicial, roteiro de resolução e checklist de entrega, além de critérios estruturados. Os resultados dependem da coleta do aluno, portanto não há resposta numérica única. A correção automática foi desativada nesses quatro itens. Entrega com anexos e histórico persistente continuam pertencendo à etapa de acompanhamento prevista no plano.

## Recursos

Foram acrescentados dez gráficos de resolução em Plotly: pizzas, aplicativos, pagamentos, smartphones, histograma e ogiva dos caminhões, regressão de distância/custo, estudo/notas, açúcar/calorias com resíduos e promoções/vendas. Eles aparecem na etapa de resolução, sem antecipá-la no enunciado.

A árvore equivalente usa SVG, com ramos completos e caminho destacado por cor e rótulo. Os recursos usam o Plotly local e o tema compartilhado. O boxplot conceitual teve o bigode inferior ajustado para respeitar seu próprio critério de outlier.

## Manutenção

A edição revisada está em [../data/gabaritos_livro.json](../data/gabaritos_livro.json). Os JSONs de cada aula são gerados a partir dessa edição por [../scripts/prepare_exercise_answers.py](../scripts/prepare_exercise_answers.py), que também gera os recursos de resolução.

A preparação de recursos reaplica os gabaritos revisados ao final, preservando os IDs e as soluções de origem. Assim, uma nova preparação não reintroduz a resposta antiga do histograma.

Para reaplicar somente os gabaritos e conferir o resultado:

    python scripts/prepare_exercise_answers.py
    node scripts/prepare_print_resources.cjs
    python scripts/verify_exercise_answers.py
    python scripts/verify_course.py --source "C:\Users\Pichau\Documents\Streamlit Apps\Stat-AI-1.0" --base-url http://localhost:3001
    npx tsc --noEmit
    npm run build

## Verificação

- 72 registros com as quatro etapas preenchidas e alternativas válidas.
- 41 conferências numéricas independentes, incluindo recontagem das tabelas, distribuições, regressões e previsões.
- 1.558 linhas do conteúdo aprovado preservadas; 130 arquivos servidos conferidos.
- Navegação pelos 72 registros, 288 aberturas de ajuda no aluno e quatro no professor; resposta final fechada até o quarto clique.
- Nenhum erro de fórmulas ou JavaScript nos componentes exercitados.
- 51 recursos HTML carregados em largura de 320 px, sem transbordamento horizontal.
- Preparação idempotente em 36 arquivos de exercícios e recursos.
- TypeScript e build de produção aprovados.

Resultados: [verificacao-gabaritos-calculos.json](verificacao-gabaritos-calculos.json), [verificacao-gabaritos-navegador.json](verificacao-gabaritos-navegador.json) e [verificacao-aulas.json](verificacao-aulas.json).

A verificação usou componentes reais em uma página temporária local. Correção por IA e gravação de progresso com conta autenticada não foram exercitadas nesta etapa. O índice remoto do tutor ainda precisa ser atualizado para incluir o novo material e os níveis de ajuda antes de publicar essa integração.

A revisão da integração corrigiu o corretor, a geração de quatro etapas, a contagem de progresso e o PDF. Veja [REVISAO_EXERCICIOS_E_INTEGRACAO.md](REVISAO_EXERCICIOS_E_INTEGRACAO.md) para resultados, limitações e a sequência de trabalho.\n