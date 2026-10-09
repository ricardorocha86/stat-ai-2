# CAPÍTULO 2 - INTRODUÇÃO E ORGANIZAÇÃO DE DADOS

Após a coleta dos dados, em geral, eles se apresentam de maneira desorganizada e com pouca utilidade para o pesquisador. Por exemplo, imagine coletar a estatura de 1000 pessoas selecionadas aleatoriamente no Brasil. Antes de realizar qualquer inferência sobre a estatura média dos brasileiros, como você organizaria e apresentaria os dados coletados?

Apresentaríamos apenas a média ou o desvio padrão da estatura dos indivíduos? Ou, construiríamos tabelas e gráficos para resumir as informações de forma a permitir uma visualização mais abrangente do comportamento da variável estatura?

Responder a essas perguntas consiste na principal finalidade da estatística descritiva, organizar e sintetizar os dados coletados a fim de permitir uma interpretação rápida e clara do fenômeno em estudo. Para atingir esse propósito, a estatística descritiva se apoia em tabelas, gráficos e medidas resumo numéricas.

Nesse capítulo, estudaremos a organização de dados por meio de tabelas de frequências e gráficos, diferenciando-os conforme os tipos de variáveis: qualitativas ou quantitativas.

**Definição 2.1.** Dados registrados na forma como foram coletados, sem qualquer tratamento ou ordenação, são denominados dados brutos. Em contrapartida, dados organizados em ordem de valor, crescente ou decrescente, são denominados dados ordenados ou simplesmente rol.

## 2.1. Dados Qualitativos

### 2.1.1. Distribuições de Frequências

Ao organizar dados qualitativos, agrupamos os dados em categorias mutuamente excludentes, ou seja, cada elemento pode pertencer a uma, e somente uma, categoria. Por exemplo, considerando uma amostra de 18 alunos do curso de Logística da Fatec-Americana, podemos classificá-los conforme a cidade de residência. Dessa forma, uma maneira conveniente de expressar a classificação desses dados é por meio de uma tabela de distribuição de frequências, como exibido pela Tabela 1.

**Tabela 1 – Cidade de residência de 18 alunos do curso de Logística da Fatec-Americana, selecionados aleatoriamente.**

| Cidade de Residência | Número de Alunos | Frequência Relativa | Frequência Percentual |
| :--- | :---: | :---: | :---: |
| Santa Bárbara d’Oeste | 8 | 0,44 | 44% |
| Americana | 4 | 0,22 | 22% |
| Nova Odessa | 4 | 0,22 | 22% |
| Limeira | 1 | 0,06 | 6% |
| Sumaré | 1 | 0,06 | 6% |
| **Total** | **18** | **1,00** | **100%** |

A primeira coluna de uma tabela de distribuição de frequências lista as categorias da variável qualitativa analisada, no exemplo “cidade de residência”. A segunda coluna apresenta o número de elementos pertencentes a cada categoria listada, ou seja, a frequência absoluta ($f_a$) de cada categoria. A terceira coluna apresenta a frequência relativa ($f_r$) de cada categoria, que é obtida pela divisão da frequência absoluta da categoria pela soma de todas as frequências. Assim, a $f_r$ expressa a fração da categoria em relação à frequência total. A quarta e última coluna apresenta a percentagem ($f_p$) para cada categoria listada, que é obtida pela multiplicação da $f_r$ da categoria por 100. A última linha da tabela, apresenta a soma de cada coluna.

Sendo assim, os resultados para a primeira categoria (Santa Bárbara d’Oeste; SBO), dispostos na segunda linha da Tabela 1, foram calculados da seguinte forma:

* $f_a = 8$ (número de indivíduos pertencentes a cidade de SBO)
* $f_r = \frac{f_a}{n} = \frac{8}{18} = 0,44$, tal que $n$ é o tamanho amostral
* $f_p = f_r \times 100\% = 0,44 \times 100\% = 44\%$

Em alguns casos, uma coluna adicional referente às frequências percentuais acumuladas ($f_c$) é acrescentada à tabela. O valor da $f_c$ para cada classe é obtido somando o valor da $f_p$ da respectiva classe às $f_p$ das classes anteriores. A primeira classe apresenta o valor da $f_c$ igual ao valor da $f_p$, pois não há classe anterior a ela. Geralmente, as $f_c$ são úteis quando lidamos com variáveis qualitativas ordinais ou quantitativas. No exemplo anterior, os valores da $f_c$ para as cinco classes seriam 44%, 66%, 88%, 94% e 100%, respectivamente.

![Distribuição de Frequências Qualitativas](recursos/grafico_frequencias_qualitativas.html)
