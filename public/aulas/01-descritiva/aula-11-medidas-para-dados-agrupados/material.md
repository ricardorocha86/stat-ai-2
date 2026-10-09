# 3.2. Medidas descritivas numéricas para dados agrupados

Em alguns casos, os dados podem ser fornecidos em forma de tabelas de distribuição de frequências (Tabela 6). Assim, são utilizados métodos diferentes para obtenção das medidas descritivas numéricas. Uma limitação desse tipo de disposição é o fato de não conhecermos cada valor do conjunto de dados, mas apenas a quantidade de valores observados por classe.

Para explorar os métodos de obtenção de medidas descritivas para dados agrupados, consideraremos a Tabela 6, que consiste da distribuição de frequências dos valores das ações da Petrobrás de Setembro de 2015 a Setembro de 2018, coletados no primeiro dia útil de cada mês.

**Tabela 6 – Distribuição de frequências dos valores (em reais) das ações da Petrobrás de Setembro de 2015 a Setembro de 2018, coletados no primeiro dia útil de cada mês.**

| Valor das ações | Frequência absoluta ($f_a$) |
| :---: | :---: |
| 4,7 ⊢ 7,7 | 5 |
| 7,7 ⊢ 10,7 | 6 |
| 10,7 ⊢ 13,7 | 5 |
| 13,7 ⊢ 16,7 | 12 |
| 16,7 ⊢ 19,7 | 3 |
| 19,7 ⊢ 22,7 | 5 |
| **Total** | **36** |

## 3.2.1. Média Aritmética para dados agrupados

Vimos, no início do capítulo 3, que a média aritmética para dados não agrupados é calculada dividindo-se a soma de todos os valores do conjunto de dados pelo número de valores ($n$). Porém, quando temos dados agrupados, não conhecemos os valores de cada observação, mas sim a quantidade de valores observados por classe (frequência absoluta), como pode ser observado na Tabela 6.

Dessa forma, uma maneira de estimar a soma dos valores por classe é tomar o ponto médio ($m$) de cada classe e multiplicá-lo pela quantidade de valores da respectiva classe (frequência absoluta). Em seguida, para obtenção da média aritmética, divide-se a soma dos valores resultantes de cada classe pelo número total de observações da tabela de frequência. Podemos traduzir esse processo por meio das fórmulas:

**População:**  
$$\mu = \frac{\sum m f_a}{N}$$

**Amostra:**  
$$\bar{x} = \frac{\sum m f_a}{n}$$

em que $m$ e $f_a$ correspondem ao ponto médio e à frequência absoluta de cada uma das classes, respectivamente.

**Exemplo 3.2.1.** Calculemos a média aritmética para os dados da Tabela 6.

| Valor das ações | $f_a$ | $m$ | $m \times f_a$ |
| :---: | :---: | :---: | :---: |
| 4,7 ⊢ 7,7 | 5 | $4{,}7 + 1{,}5 = 6{,}2$ | 31,0 |
| 7,7 ⊢ 10,7 | 6 | $7{,}7 + 1{,}5 = 9{,}2$ | 55,2 |
| 10,7 ⊢ 13,7 | 5 | $10{,}7 + 1{,}5 = 12{,}2$ | 61,0 |
| 13,7 ⊢ 16,7 | 12 | $13{,}7 + 1{,}5 = 15{,}2$ | 182,4 |
| 16,7 ⊢ 19,7 | 3 | $16{,}7 + 1{,}5 = 18{,}2$ | 54,6 |
| 19,7 ⊢ 22,7 | 5 | $19{,}7 + 1{,}5 = 21{,}2$ | 106,0 |
| **Total** | **$n = 36$** | | **$\sum m f_a = 490{,}2$** |

Temos que a amplitude das classes é igual a R$ 3,00, assim, o ponto médio de cada classe é calculado somando metade dessa amplitude, R$ 1,50, ao limite inferior de cada classe.

Dessa forma, temos que a média aritmética para os dados agrupados é dada por:

$$\bar{x} = \frac{\sum_{i=1}^6 m_i f_{ai}}{n} = \frac{490{,}2}{36} = 13{,}62$$

O que nos leva a concluir que o valor médio das ações da Petrobrás no período de Setembro de 2015 a Setembro de 2018 foi de R$ 13,62.

## 3.2.2. Variância e Desvio-Padrão para dados agrupados

Devido aos mesmos motivos apontados anteriormente, calculamos a variância e o desvio-padrão para dados agrupados utilizando as seguintes fórmulas:

**População:**  
$$\sigma^2 = \frac{\sum f_a (m - \mu)^2}{N} = \frac{\sum m^2 f_a - \frac{(\sum m f_a)^2}{N}}{N}$$  
$$\sigma = \sqrt{\sigma^2}$$

**Amostra:**  
$$s^2 = \frac{\sum f_a (m - \bar{x})^2}{n - 1} = \frac{\sum m^2 f_a - \frac{(\sum m f_a)^2}{n}}{n - 1}$$  
$$s = \sqrt{s^2}$$

**Exemplo 3.2.2.** Calculemos a variância e o desvio-padrão para os dados da Tabela 6.

| Valor das ações | $f_a$ | $m$ | $m \times f_a$ | $m^2 \times f_a$ |
| :---: | :---: | :---: | :---: | :---: |
| 4,7 ⊢ 7,7 | 5 | 6,2 | 31,0 | 192,20 |
| 7,7 ⊢ 10,7 | 6 | 9,2 | 55,2 | 507,84 |
| 10,7 ⊢ 13,7 | 5 | 12,2 | 61,0 | 744,20 |
| 13,7 ⊢ 16,7 | 12 | 15,2 | 182,4 | 2772,48 |
| 16,7 ⊢ 19,7 | 3 | 18,2 | 54,6 | 993,72 |
| 19,7 ⊢ 22,7 | 5 | 21,2 | 106,0 | 2247,20 |
| **Total** | **$n = 36$** | | **$\sum m f_a = 490{,}2$** | **$\sum m^2 f_a = 7457{,}64$** |

As colunas “$m \times f_a$” e “$m^2 \times f_a$” da tabela acima são construídas para tornar os cálculos mais fáceis. Dessa forma, temos:

$$s^2 = \frac{\sum m^2 f_a - \frac{(\sum m f_a)^2}{n}}{n - 1} = \frac{7457{,}64 - \frac{(490{,}2)^2}{36}}{36 - 1} = \frac{7457{,}64 - 6674{,}91}{35} = \frac{782{,}73}{35} = 22{,}36$$

$$s = \sqrt{22{,}36} = 4{,}73$$

Assim, o desvio-padrão dos valores das ações da Petrobrás no período de Setembro de 2015 a Setembro de 2018 foi de R$ 4,73.

![Distribuição de Frequências para Dados Agrupados](recursos/grafico_dados_agrupados.html)
