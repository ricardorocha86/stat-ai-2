# CAPÍTULO 7 - REGRESSÃO E CORRELAÇÃO LINEAR SIMPLES

O estudo da relação entre duas variáveis é muito importante em diversas áreas, pois permite que façamos previsões a respeito da variação e do valor de uma variável com base no valor de outra. Neste capítulo, estudaremos a relação entre duas variáveis por meio de dois métodos bastante utilizados em estatística: (1) a Análise de Regressão Linear; e (2) o Coeficiente de Correlação.

Utilizando um modelo de regressão, por exemplo, poderíamos prever o gasto aproximado com transporte de mercadorias de uma empresa com determinada produção, ou até mesmo estimar o lucro mensal a partir da quantidade de pedidos recebidos. Já o coeficiente de correlação permite-nos identificar o quão forte essas variáveis estão relacionadas. Porém, cabe destacar que correlação não implica uma relação de causa, ou seja, uma variável pode estar fortemente correlacionada a outra por simples coincidência. Nesses casos, utilizar uma variável para prever o valor de outra pode ser catastrófico.

---

## 7.1. Análise de Regressão Linear Simples

Um modelo de regressão corresponde a uma equação matemática que expressa a relação entre duas (regressão simples) ou mais variáveis (regressão múltipla). Já o termo “linear” demonstra que a relação entre as variáveis é linear, ou seja, em linha reta. As variáveis são classificadas em dependentes (aquelas que são explicadas, ou seja, variáveis resposta) e independentes (as que explicam a variação da variável dependente).

Um modelo de regressão linear simples para a população é dado por:

$$y = \alpha + \beta x + \epsilon$$

em que:
* $y$: variável dependente (resposta)
* $x$: variável independente (explicativa)
* $\alpha$: intercepto – independe da variação em $x$
* $\beta$: coeficiente de inclinação da reta (coeficiente angular)
* $\epsilon$: erro aleatório decorrente de fatores não mensurados

Quando trabalhamos com dados de uma **amostra**, a equação estimada da reta de regressão linear simples é dada por:

$$\hat{y} = a + bx$$

em que:
* $\hat{y}$: valor estimado (previsto) da variável dependente para um determinado valor de $x$;
* $a$: estimativa do intercepto com o eixo vertical (coeficiente linear);
* $b$: estimativa do coeficiente angular da reta (taxa de variação média em $y$ para cada acréscimo unitário em $x$).

---

### Método dos Mínimos Quadrados Ordinários (MQO)

O método dos mínimos quadrados ordinários determina a melhor reta ajustada aos pontos de tal forma que a soma dos quadrados das distâncias verticais entre os pontos observados ($y_i$) e a reta ajustada ($\hat{y}_i$) seja a mínima possível:

$$\text{Minimizar } \sum (y_i - \hat{y}_i)^2$$

As fórmulas para o cálculo dos coeficientes $a$ e $b$ são:

$$b = \frac{SQ_{XY}}{SQ_X}$$

$$a = \bar{y} - b \bar{x}$$

tal que as somas de quadrados são calculadas por:

$$SQ_{XY} = \sum xy - \frac{(\sum x)(\sum y)}{n}$$

$$SQ_X = \sum x^2 - \frac{(\sum x)^2}{n}$$

$$SQ_Y = \sum y^2 - \frac{(\sum y)^2}{n}$$

---

**Exemplo 7.1.1.** Uma montadora de automóveis deseja investigar a taxa de depreciação de seus veículos considerando o tempo de uso e o preço a que estão sendo vendidos no mercado. Os pesquisadores da empresa coletaram uma amostra de 10 veículos e as informações sobre tempo de uso ($x$, em anos) e preço ($y$, em mil reais):

| Veículo | Tempo de Uso ($x$, anos) | Preço ($y$, mil R\$) | $xy$ | $x^2$ | $y^2$ |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 6 | 51 | 306 | 36 | 2601 |
| 2 | 2 | 82 | 164 | 4 | 6724 |
| 3 | 5 | 64 | 320 | 25 | 4096 |
| 4 | 8 | 40 | 320 | 64 | 1600 |
| 5 | 6 | 56 | 336 | 36 | 3136 |
| 6 | 9 | 38 | 342 | 81 | 1444 |
| 7 | 1 | 94 | 94 | 1 | 8836 |
| 8 | 2 | 86 | 172 | 4 | 7396 |
| 9 | 4 | 72 | 288 | 16 | 5184 |
| 10 | 7 | 46 | 322 | 49 | 2116 |
| **Total** | **$\Sigma x = 50$** | **$\Sigma y = 629$** | **$\Sigma xy = 2664$** | **$\Sigma x^2 = 316$** | **$\Sigma y^2 = 43133$** |

Plotando os pares ordenados em um plano cartesiano, temos o diagrama de dispersão apresentado na Figura 17, no qual o eixo das ordenadas ($y$) representa o valor dos automóveis; e o eixo das abscissas ($x$), o tempo de uso. A análise do gráfico indica a existência de uma forte tendência linear decrescente entre anos de uso e preço do automóvel.

![Figura 17. Gráfico de dispersão dos pontos e linha de regressão](recursos/figura_17_dispersao_reta.html)

![Regressão Linear e Diagrama de Dispersão](recursos/grafico_dispersao_regressao.html)

### Cálculo passo a passo dos coeficientes:

$$\bar{x} = \frac{\Sigma x}{n} = \frac{50}{10} = 5{,}0 \text{ anos}$$

$$\bar{y} = \frac{\Sigma y}{n} = \frac{629}{10} = 62{,}9 \text{ mil reais}$$

$$SQ_{XY} = \Sigma xy - \frac{(\Sigma x)(\Sigma y)}{n} = 2664 - \frac{50 \cdot 629}{10} = 2664 - 3145 = -481$$

$$SQ_X = \Sigma x^2 - \frac{(\Sigma x)^2}{n} = 316 - \frac{50^2}{10} = 316 - 250 = 66$$

$$b = \frac{SQ_{XY}}{SQ_X} = \frac{-481}{66} \cong -7{,}2878 \cong -7{,}29$$

$$a = \bar{y} - b \bar{x} = 62{,}9 - (-7{,}2878) \cdot 5{,}0 = 62{,}9 + 36{,}44 = 99{,}34 \cong 99{,}35$$

Assim, a equação da reta de regressão estimada é:

$$\hat{y} = 99{,}35 - 7{,}29x$$

### Interpretação prática dos coeficientes:
* **Coeficiente Linear ($a = 99{,}35$):** Representa o preço médio estimado de um veículo zero quilômetro ($x = 0$ anos de uso), correspondendo a aproximadamente R$ 99.350,00.
* **Coeficiente Angular ($b = -7{,}29$):** Representa a taxa média anual de depreciação do automóvel. A cada 1 ano adicional de uso, o preço médio de venda cai aproximadamente R$ 7.290,00 (sinal negativo indica relação inversa).

> **Cuidado com extrapolações:** o livro (p. 144) ressalta que a reta foi ajustada para veículos com 1 a 9 anos de uso. O intercepto em zero anos é uma extrapolação; ele não comprova o preço real de um veículo novo.

**Previsão:** Para estimar o preço de venda de um veículo com 6 anos de uso ($x = 6$):
$$\hat{y} = 99{,}35 - 7{,}29 \cdot (6) = 99{,}35 - 43{,}74 = 55{,}61 \text{ mil reais (R\$ 55.610,00)}$$
