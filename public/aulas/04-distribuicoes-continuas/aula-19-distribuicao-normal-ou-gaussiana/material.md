# CAPÍTULO 6 - DISTRIBUIÇÕES DE PROBABILIDADES DE VARIÁVEIS ALEATÓRIAS CONTÍNUAS

Como mencionado em capítulos anteriores, uma variável aleatória contínua é aquela que pode assumir qualquer valor em um intervalo. Assim, a curva da distribuição de probabilidades de uma variável aleatória contínua $X$ é denominada de **função densidade de probabilidades (f.d.p.)** e denotada por $f(x)$.

Calcular a probabilidade de $X$ assumir valores em um intervalo específico é equivalente a encontrar a área sob a curva delimitada por esse intervalo. Vale lembrar que essa probabilidade sempre será compreendida entre 0 e 1, justificando a área total sob a curva ser igual a 1 (ou 100%). Como consequência da natureza contínua, a probabilidade de $X$ assumir um único valor pontual é rigorosamente nula:

$$P(X = c) = 0$$

Dentre muitas distribuições de probabilidades para variáveis aleatórias contínuas, destacam-se a distribuição Normal (ou Gaussiana) e a Exponencial. A primeira se destaca devido ao grande número de fenômenos naturais que, quando mensurados, enquadram-se em seus moldes. Dessa forma, daremos atenção especial a ela neste capítulo.

---

## 6.1. Distribuição Normal ou Gaussiana

A distribuição de probabilidades Normal — também chamada de distribuição Gaussiana em referência ao matemático, astrônomo e físico alemão Carl Friedrich Gauss (1777–1855) — é uma das mais usadas devido ao grande número de fenômenos que se enquadram nos seus moldes. Alguns exemplos são: a estatura ou o peso de pessoas ou animais, a vida útil de um aparelho, o tempo para realizar uma determinada tarefa, o diâmetro de peças industriais, dentre outros.

O gráfico da curva da distribuição de probabilidades Normal tem formato de sino e apresenta as seguintes propriedades fundamentais:

(i) **A área total sob a curva é igual a 1 ou 100%;**  
(ii) **A curva é perfeitamente simétrica em relação à média aritmética ($\mu$);**  
(iii) **As caudas da curva se estendem até o infinito ($-\infty$ e $+\infty$) sem nunca tocar o eixo horizontal (assíntotas);**  
(iv) **A média, a mediana e a moda coincidem exatamente no mesmo ponto central ($\mu = Md = Mo$).**

A média aritmética ($\mu$) e o desvio-padrão ($\sigma$) são os dois parâmetros da distribuição Normal. A média é responsável pela posição central da distribuição e se desloca no eixo das abscissas; já o desvio-padrão fornece a dispersão (largura e achatamento) da curva. Conhecidos esses parâmetros, podemos calcular a área sob a curva para qualquer intervalo.

---

### Equação da Função Densidade de Probabilidades

A expressão matemática que define a curva da distribuição Normal para uma variável aleatória contínua $X$ é dada por:

$$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2} \left(\frac{x - \mu}{\sigma}\right)^2} \qquad -\infty < x < +\infty$$

Nesse caso, dizemos que $X$ segue uma distribuição normal, representada pela notação:

$$X \sim N(\mu, \sigma^2)$$

Tal que:
* $\mu$ ($-\infty < \mu < +\infty$) representa a média populacional de $X$;
* $\sigma$ ($\sigma > 0$) representa o desvio-padrão populacional de $X$;
* $\pi \cong 3{,}14159$ e $e \cong 2{,}71828$ são constantes universais.

A integral definida de $f(x)$, de $a$ até $b$, fornece a probabilidade de $X$ assumir um valor no intervalo $(a, b)$, ou seja:

$$P(a < X < b) = \int_a^b f(x) \, dx$$

Como cada variável aleatória contínua possui sua própria média ($\mu$) e desvio-padrão ($\sigma$), resolver diretamente essa integral exigiria cálculos numéricos complexos e distintos para cada caso. Para simplificar a aplicação prática, padroniza-se a variável gerando um caso especial tabelado: a **Distribuição Normal Padrão**, na qual $\mu = 0$ e $\sigma = 1$.

![Curva da Distribuição Normal e Parâmetros](recursos/grafico_curva_normal.html)
