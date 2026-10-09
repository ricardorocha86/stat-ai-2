# Primeira etapa: material do livro no StatAI 2.0

## Entregue localmente

As 25 entradas do material aprovado foram migradas: apresentação, 23 aulas e apêndice. Todas seguem a mesma organização por pasta, com material, exercícios e recursos. As aulas antigas foram retiradas da navegação e preservadas em `archive/legacy-course/`, fora de `public/`.

Há 72 registros separados: 36 exercícios, 32 questões de múltipla escolha e 4 atividades. Os exemplos resolvidos de ensino permanecem no material; as resoluções das questões propostas ficam em campos próprios do JSON.

Foram classificados os 55 recursos referenciados no material original:

| Tratamento | Quantidade |
| --- | ---: |
| Gráficos reconstruídos em Plotly | 18 |
| Diagramas reconstruídos em SVG | 8 |
| Imagens convertidas para tabelas Markdown | 2 |
| Simuladores HTML aproveitados e adaptados | 23 |
| Ilustração útil preservada | 1 |
| Gráficos preservados por ausência de dados completos | 2 |
| Figura incorreta substituída por exercício equivalente e árvore explícita | 1 |

Três dos gráficos Plotly são esquemas conceituais explicitamente identificados, para questões qualitativas cujas imagens extraídas não correspondiam ao texto. Os demais usam tabelas, valores legíveis no original ou funções definidas na aula. As imagens de origem permanecem disponíveis para rastreabilidade, embora as substituídas não sejam mais exibidas.

Os recursos compartilham o tema visual e uma cópia local do Plotly. As abas de material e exercícios carregam os mesmos arquivos do catálogo. As fórmulas usam KaTeX; tabelas largas têm rolagem interna. A exportação existente mostra links para os recursos interativos.

## Situação após integrar os gabaritos

| Local | Situação e tratamento |
| --- | --- |
| Aula 7, múltipla escolha 8 | O gabarito migrado informa 160; as classes e densidades do histograma original da p. 50 levam a 140. O gráfico foi reconstruído fielmente. A resposta D / 140 foi confirmada pelo gabarito do autor e integrada; a resolução antiga está preservada em `solucao_original`. |
| Aula 15, exercício 10 | O arquivo associado era um gráfico de compradores, embora o texto peça uma árvore de probabilidades. O enunciado incompleto foi substituído por um exemplo equivalente de duas retiradas com reposição, com ramos explícitos e resposta 9%, registrado como elaborado. |
| Aula 23, duas figuras de dispersão | Os pares completos não constam no material. As imagens úteis foram mantidas; não foram inventadas coordenadas para convertê-las em Plotly. |
| Gabaritos | Todos os 72 registros têm dica, como começar, resolução e resposta final: 68 exercícios/questões com resposta e quatro atividades com roteiro e critérios. Detalhes em [GABARITOS_EXERCICIOS.md](GABARITOS_EXERCICIOS.md). |

Esta etapa assume que o texto novo está aprovado. As verificações cobrem preservação e integração; não constituem revisão pedagógica integral do livro.

## Verificação realizada

- Catálogo com 25 entradas, números e IDs únicos; contagem dos 72 registros.
- Preservação de 1.558 linhas não vazias do texto aprovado, excluídos separadores, títulos de seção e referências às imagens substituídas.
- Referências locais e conteúdo de 130 arquivos servidos pelo Vite conferidos.
- Renderização de todas as aulas, fórmulas e contagens de exercícios no navegador.
- Carregamento dos 51 recursos HTML (23 simuladores, 18 gráficos do material e dez gráficos de resolução), com largura de 320 px e sem transbordamento horizontal.
- Alteração de contagem, parâmetro da regra empírica e controles da carta de controle nos simuladores; entrada da aplicação carregada sem erros JavaScript.
- Checagem TypeScript e build de produção.

Os resultados detalhados estão em `verificacao-aulas.json` e `verificacao-navegador.json`. O navegador de teste usa os componentes reais em uma página temporária local, sem alterar a autenticação da aplicação.

## Manutenção e reprodução

Para uma importação completa em uma cópia de trabalho:

```powershell
python scripts/migrate_book_course.py --source "C:\Users\Pichau\Documents\Streamlit Apps\Stat-AI-1.0" --write
python scripts/prepare_lesson_resources.py
# Com o Vite local aberto, gere as figuras para PDF:
node scripts/prepare_print_resources.cjs
python scripts/verify_course.py --source "C:\Users\Pichau\Documents\Streamlit Apps\Stat-AI-1.0"
npx tsc --noEmit
npm run build
```

O primeiro comando recria o conteúdo a partir da fonte e deve ser usado com cuidado depois de novas edições. O segundo reaplica as substituições e os gabaritos revisados. A preparação de recursos requer o pacote Python Plotly; a importação e a verificação usam apenas a biblioteca padrão do Python.

Para validar também o que o servidor entrega, acrescente `--base-url http://localhost:3001` à verificação.

O script de indexação do Gemini foi ajustado para usar os IDs e títulos do catálogo e permitir `--dry-run` sem credenciais. A indexação remota ainda precisa ser refeita antes de publicar este conteúdo; a base remota existente não foi modificada nesta etapa. Firebase, autenticação, correção por IA e gravação de progresso não foram testados com chamadas reais neste trabalho.

## Próxima etapa recomendada

Os gabaritos progressivos foram concluídos e integrados, conforme [GABARITOS_EXERCICIOS.md](GABARITOS_EXERCICIOS.md). A próxima etapa é o acompanhamento das tentativas e entregas, com conclusão separada de acerto, e a integração do tutor aos níveis de ajuda. A publicação deve ser coordenada com a nova indexação do material.

A revisão posterior de correção, progresso e exportação está registrada em [REVISAO_EXERCICIOS_E_INTEGRACAO.md](REVISAO_EXERCICIOS_E_INTEGRACAO.md).
