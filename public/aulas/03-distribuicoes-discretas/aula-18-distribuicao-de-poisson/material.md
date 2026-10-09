# 5.3. Distribuição de Poisson

Outra importante distribuição de probabilidades de variáveis aleatórias discretas é a Distribuição de Poisson, cujo nome foi dado em homenagem ao matemático e físico francês Siméon Denis Poisson (1781–1840), que a descobriu. Ela é aplicada a experimentos com “ocorrências” aleatórias e independentes em determinado intervalo contínuo (de tempo, área, volume, comprimento, etc.).

Considere, por exemplo, o número de defeitos em um certo tecido com 100 metros de comprimento e 2 metros de largura. O intervalo nesse exemplo corresponde a uma área de $200\text{ m}^2$ e as “ocorrências” (defeitos) são aleatórias e pontuais.

---

### Fórmula da Distribuição de Poisson

Sendo a variável aleatória $X$ designando o número de ocorrências em um certo intervalo estabelecido, tem-se que a probabilidade de $x$ ocorrências é calculada pela fórmula:

$$P(X = x) = \frac{e^{-\lambda} \cdot \lambda^x}{x!}$$

tal que:
* $\lambda$ (lambda) representa a média aritmética do número de ocorrências no intervalo estabelecido;
* $e$ representa o número de Euler, cujo valor é de aproximadamente $2{,}71828$ (base dos logaritmos naturais);
* $x!$ é o fatorial do número de ocorrências ($x = 0, 1, 2, \dots$).

---

### Média e Desvio-Padrão da Distribuição de Poisson

Uma característica única e notável da distribuição de Poisson é que sua variância é exatamente igual à sua média:

$$\mu = \lambda$$

$$\sigma^2 = \lambda$$

$$\sigma = \sqrt{\lambda}$$

---

**Exemplo 5.3.1.** Apesar do rigoroso controle de qualidade em uma fábrica têxtil, os tecidos fabricados contêm sempre algum tipo de defeito. Um determinado tipo de tecido fabricado apresenta em média $\lambda = 0{,}6$ defeitos a cada 200 metros.

**(a) Encontre a probabilidade de que um determinado pedaço de 200 metros desse tecido venha a apresentar um único defeito ($x = 1$):**

Nesse exemplo temos $\lambda = 0{,}6$. Aplicando a fórmula da distribuição de Poisson:

$$P(X = 1) = \frac{e^{-0{,}6} \cdot 0{,}6^1}{1!} = \frac{0{,}54881 \cdot 0{,}6}{1} = 0{,}3293 \cong 32{,}93\%$$

Assim, a probabilidade de que esse pedaço tenha um único defeito é de aproximadamente $32{,}93\%$.

**(b) Encontre a probabilidade de que o mesmo pedaço de tecido apresente mais de 2 defeitos ($x > 2$):**

Utilizando o evento complementar:

$$P(X > 2) = 1 - P(X \le 2) = 1 - [P(X = 0) + P(X = 1) + P(X = 2)]$$

Calculando termo a termo:

$$P(X = 0) = \frac{e^{-0{,}6} \cdot 0{,}6^0}{0!} = \frac{0{,}54881 \cdot 1}{1} = 0{,}5488$$

$$P(X = 1) = 0{,}3293$$

$$P(X = 2) = \frac{e^{-0{,}6} \cdot 0{,}6^2}{2!} = \frac{0{,}54881 \cdot 0{,}36}{2} = \frac{0{,}19757}{2} = 0{,}0988$$

Portanto:

$$P(X > 2) = 1 - [0{,}5488 + 0{,}3293 + 0{,}0988] = 1 - 0{,}9769 = 0{,}0231 \quad (2{,}31\%)$$

Ou seja, a probabilidade de que o mesmo pedaço apresente mais de dois defeitos é de apenas $2{,}31\%$.

![Simulador Interativo da Distribuição de Poisson](recursos/grafico_distribuicao_poisson.html)
