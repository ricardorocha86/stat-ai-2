# 3.1.2. Medidas de dispersão

As medidas de tendência central não são suficientes para caracterizar um conjunto de dados, pois precisamos conhecer também como os dados variam em relação a elas. Por exemplo, dois conjuntos de dados podem apresentar a mesma média aritmética, porém dispersões muito diferentes. Assim, nesta seção, apresentaremos quatro medidas de dispersão bastante utilizadas: a amplitude, a variância, o desvio-padrão e o coeficiente de variação.

### 3.1.2.1. Amplitude

A amplitude é a medida de dispersão mais simples de ser calculada, foi definida e utilizada no Capítulo 2 para a definição da amplitude das classes de uma tabela de distribuição de frequências para variáveis quantitativas. Ela é obtida pela diferença entre o maior ($V_{\text{máx}}$) e o menor ($V_{\text{mín}}$) valor em um conjunto de dados, assim:

$$\text{Amplitude} = V_{\text{máx}} - V_{\text{mín}}$$

**Exemplo 3.1.4.** Considere o preço (R$) das ações da Petrobrás e da Vale do Rio Doce no dia 1º de março entre os anos de 2009 e 2018:

| Ano | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PETR** | 25 | 35 | 28 | 25 | 17 | 13 | 9 | 5 | 16 | 21 |
| **VALE** | 29 | 51 | 55 | 44 | 37 | 32 | 21 | 13 | 33 | 44 |

Para os dados das ações da Petrobrás, temos:
$$\text{Amplitude}_{\text{PETR}} = V_{\text{máx}} - V_{\text{mín}} = 35 - 5 = 30$$

Já para as ações da Vale, temos:
$$\text{Amplitude}_{\text{VALE}} = V_{\text{máx}} - V_{\text{mín}} = 55 - 13 = 42$$

Assim, percebemos que as ações da Vale apresentaram amplitude maior que as ações da Petrobrás nesse período.

---

### 3.1.2.2. Variância e Desvio-Padrão

O desvio-padrão é a medida de dispersão mais utilizada e expressa quão próximos os dados estão em torno da média; é obtido extraindo-se a raiz quadrada positiva da variância. O cálculo da variância populacional consiste na soma de quadrados dos desvios das observações em relação à média, dividida pelo número de elementos da população. Já no cálculo da variância amostral, a soma de quadrados é dividida pelo número de elementos da amostra menos um, assim:

#### População

* **Variância:**
$$\sigma^2 = \frac{\sum (x - \mu)^2}{N} = \frac{\sum x^2 - \frac{(\sum x)^2}{N}}{N}$$

* **Desvio-Padrão:**
$$\sigma = \sqrt{\sigma^2}$$

#### Amostra

* **Variância:**
$$s^2 = \frac{\sum (x - \bar{x})^2}{n - 1} = \frac{\sum x^2 - \frac{(\sum x)^2}{n}}{n - 1}$$

* **Desvio-Padrão:**
$$s = \sqrt{s^2}$$

**Exemplo 3.1.5.** Considerando o preço (em reais) das ações da Petrobrás (P) e da Vale do Rio Doce (V) no dia 1º de março entre os anos de 2009 e 2018 do Exemplo 3.1.4, calculemos a variância e o desvio-padrão para esses dados.

Inicialmente, convém identificarmos se o conjunto de dados em estudo trata-se de uma população ou amostra. Como foram coletados apenas os valores das ações no 1º dia de março entre os anos de 2009 e 2018, trata-se de uma amostra sistemática dos dados. Assim, utilizaremos as fórmulas destinadas à amostra.

Os cálculos podem ser facilitados por meio da construção de tabelas de auxílio. Veja, por exemplo, as tabelas utilizadas para os cálculos:

#### Ações da Petrobrás

| $x$ | $x^2$ |
| :---: | :---: |
| 25 | 625 |
| 35 | 1225 |
| 28 | 784 |
| 25 | 625 |
| 17 | 289 |
| 13 | 169 |
| 9 | 81 |
| 5 | 25 |
| 16 | 256 |
| 21 | 441 |
| **$\Sigma x = 194$** | **$\Sigma x^2 = 4518$** |

$$s_P^2 = \frac{\Sigma x^2 - \frac{(\Sigma x)^2}{n}}{n-1} = \frac{4518 - \frac{(194)^2}{10}}{9} = \frac{4518 - 3763{,}6}{9} = \frac{754{,}4}{9} = 83{,}82$$

$$s_P = \sqrt{s_P^2} = \sqrt{83{,}82} = 9{,}17$$

#### Ações da Vale

| $x$ | $x^2$ |
| :---: | :---: |
| 29 | 841 |
| 51 | 2601 |
| 55 | 3025 |
| 44 | 1936 |
| 37 | 1369 |
| 32 | 1024 |
| 21 | 441 |
| 13 | 169 |
| 33 | 1089 |
| 44 | 1936 |
| **$\Sigma x = 359$** | **$\Sigma x^2 = 14431$** |

$$s_V^2 = \frac{\Sigma x^2 - \frac{(\Sigma x)^2}{n}}{n-1} = \frac{14431 - \frac{(359)^2}{10}}{9} = \frac{14431 - 12888{,}1}{9} = \frac{1542{,}9}{9} = 171{,}43$$

$$s_V = \sqrt{s_V^2} = \sqrt{171{,}43} = 13{,}09$$

---

### 3.1.2.3. Coeficiente de Variação

Dessa forma, diferentemente do desvio-padrão que resulta em uma medida de variabilidade absoluta, o CV resulta em uma medida de variabilidade relativa, ou seja, em percentagem (%). Fato que possibilita a comparação da dispersão de conjuntos de dados com unidades de medidas diferentes.

No que diz respeito à interpretação dessa medida de variabilidade, temos que quanto menor o valor do CV, mais homogêneos são os dados, ou seja, menor a dispersão dos valores em torno da média. Em contrapartida, quanto maior o valor do CV, mais heterogêneos são os dados, ou seja, maior dispersão dos valores em torno da média.

De forma geral, consideramos os seguintes pontos de corte para a interpretação:

| Coeficiente de Variação (CV) | Interpretação da Dispersão |
| :--- | :--- |
| $CV \le 15\%$ | baixa dispersão: dados homogêneos |
| $15\% < CV \le 30\%$ | média dispersão |
| $CV > 30\%$ | alta dispersão: dados heterogêneos |

**Exemplo 3.1.6.** Suponha que você esteja interessado em um investimento conservador e tenha que optar pela compra de ações da Petro (P) ou da Vale (V). Qual delas escolheria, com base nos dados da amostra utilizada no Exemplo 3.1.5?

Para responder a essa pergunta, analisamos como se comportam os valores das ações dessas duas empresas. Inicialmente, calculamos a média aritmética para as duas ações:

$$\bar{x}_P = \frac{\Sigma x}{n} = \frac{194}{10} = 19{,}4$$

$$\bar{x}_V = \frac{\Sigma x}{n} = \frac{359}{10} = 35{,}9$$

Os desvios-padrão já foram calculados na subseção anterior e são $s_P = 9{,}17$ e $s_V = 13{,}09$, respectivamente. Dessa forma, os CVs para as ações das duas empresas são:

$$CV_P = \frac{s_P}{\bar{x}_P} \times 100\% = \frac{9{,}17}{19{,}4} \times 100\% = 47{,}27\% \quad \text{(Petro)}$$

$$CV_V = \frac{s_V}{\bar{x}_V} \times 100\% = \frac{13{,}09}{35{,}9} \times 100\% = 36{,}46\% \quad \text{(Vale)}$$

Conclusão: embora a ação da Vale possua desvio-padrão absoluto maior ($13{,}09$ contra $9{,}17$), o seu coeficiente de variação relativo é significativamente menor ($36{,}46\%$ contra $47{,}27\%$), indicando menor oscilação relativa em torno de sua média. Portanto, para um investidor conservador, a ação da Vale representa um investimento de menor risco relativo.

![Comparativo de Dispersão e Volatilidade](recursos/grafico_dispersao_acoes.html)
