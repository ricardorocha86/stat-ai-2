# Diretrizes de conteúdo e recursos das aulas

## Organização

Cada aula tem uma pasta em `public/aulas/<unidade>/<aula>/`:

```text
aula-07-graficos-quantitativos-e-ramo-e-folha/
├── material.md       # teoria e exemplos resolvidos
├── exercises.json    # exercícios propostos e atividades
└── recursos/         # figuras, diagramas, gráficos e simuladores
```

`public/aulas/catalogo.json` define os títulos, a ordem, os IDs e os caminhos. `data/courseData.ts` lê esse catálogo; não mantenha uma segunda lista manual.

Em `material.md`, mantenha a explicação e os exemplos resolvidos usados para ensinar. Em `exercises.json`, mantenha cada questão proposta como um registro próprio, com enunciado, número original, categoria, subitens ou alternativas e origem. Dicas, resolução e resposta final ficam em campos próprios, fora do enunciado. Um miniprojeto é uma atividade com título e instruções preservados.

Os IDs devem permanecer estáveis depois da publicação. Os IDs `livro-aula-XX` e `livro-aula-XX-<categoria>-N` identificam este curso; o progresso antigo não foi reaproveitado como conclusão das novas questões.

## Escolha do formato

| Conteúdo da imagem | Formato preferido |
| --- | --- |
| Tabela de dados | Tabela Markdown com cabeçalhos e unidades |
| Texto ou instrução | Texto Markdown |
| Fórmula | LaTeX, renderizado com KaTeX |
| Gráfico estatístico com dados ou função conhecidos | Plotly |
| Fluxograma, árvore, classificação ou esquema | SVG com texto acessível |
| Simulador com controles | HTML e JavaScript |
| Foto ou ilustração necessária | Imagem, com descrição |
| Gráfico cujos dados não estão disponíveis | Preservar a imagem útil e registrar a pendência |

O HTML é usado para recursos interativos. O texto da aula continua em Markdown. Um recurso não precisa ser convertido para HTML quando uma tabela, fórmula ou SVG resolve a necessidade.

## Fidelidade dos gráficos

1. Identifique a origem dos dados antes de redesenhar: tabela da aula, valores explícitos na figura, página do livro ou fórmula com parâmetros definidos.
2. Preserve valores, unidades, classes, escala e arredondamentos. Em histogramas com classes de larguras diferentes, preserve as larguras e use a densidade correta.
3. Em boxplots, use os quartis e extremos explicitados no material quando estiverem disponíveis. Não troque a convenção de cálculo sem revisar o exemplo.
4. Em gráficos de probabilidade, confira a distribuição, os parâmetros, a região destacada e a relação com o enunciado.
5. Não invente coordenadas nem apresente uma amostra estimada como dado original. Quando a questão for qualitativa e permitir um esquema, declare visivelmente que é um esquema conceitual, esconda valores artificiais e preserve a relação que a questão pede para analisar.
6. Não inclua a resposta do exercício na figura. Uma tabela de dados substitui uma extração incorreta; uma construção que o aluno deve realizar continua sendo tarefa do aluno.
7. Se a imagem não corresponder ao enunciado e faltar informação para reconstruí-la, sinalize a questão. Se o gabarito divergir do gráfico, preserve o original para revisão e suspenda a correção automática dessa questão. Após conferir o enunciado, a fonte e os cálculos, registre a correção explicitamente e libere o gabarito revisado. Quando autorizado a elaborar um equivalente, preserve o enunciado de origem e identifique a adaptação na rastreabilidade.
8. Registre cada substituição e sua origem em `docs/migracao-aulas.json`. Conserve o material de origem para rastreabilidade.

## Padrão visual

- Fundo branco; azul como cor principal; verde, âmbar, violeta e vermelho como cores de apoio. Não dependa só de cores: use rótulos, símbolos ou legendas.
- Fonte legível, títulos curtos, eixos com nomes e unidades, legenda sem sobreposição.
- Barras começam em zero, salvo quando o próprio objetivo didático é mostrar truncamento; nesse caso, indique-o.
- Sem efeitos 3D ou decoração que distorça a leitura.
- No celular, quebre títulos e rótulos, reposicione legendas e empilhe painéis de comparação.
- Tabelas e fórmulas extensas devem permitir rolagem dentro do recurso, sem alargar a página.
- Os gráficos HTML usam a dependência local `/aulas/recursos/plotly.min.js` e o tema `/aulas/recursos/chart-theme.js`.
- Os recursos HTML abrem na aula em um iframe com scripts habilitados e também oferecem um link para abrir em outra aba.
- Os gráficos HTML usados nos exercícios possuem uma versão de impressão gerada do próprio recurso por scripts/prepare_print_resources.cjs. A exportação PDF usa essa figura. Após alterar os gráficos, regenere as imagens e confira o manifesto de hashes.

Referências de implementação: [configuração do Plotly](https://plotly.com/javascript/configuration-options/) e [gráficos responsivos](https://plotly.com/javascript/responsive-fluid-layout/).

## Conferência antes de publicar

Confira todas as referências locais, o número de questões, a separação entre enunciado e resolução, as fórmulas e a leitura em tela estreita. Teste pelo menos um controle dos simuladores modificados. Rode `scripts/verify_course.py`, a checagem TypeScript e o build.

A fonte aprovada é preservada no projeto Streamlit. Correções editoriais posteriores devem ser registradas explicitamente; não altere o gabarito silenciosamente durante uma migração.
