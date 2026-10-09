# 3.3. Utilizando o desvio-padrão

Após o cálculo da média e do desvio-padrão, pode-se estimar a proporção da amostra que se encontra dentro dos limites estabelecidos por essas duas medidas. Essa estimativa pode ser feita com base em dois princípios: (1) Teorema de Chebyshev, e (2) Regra empírica.

---

### 3.3.1. Teorema de Chebyshev

O teorema de Chebyshev afirma que pelo menos $\left(1 - \frac{1}{k^2}\right)$ das observações, tal que $k \in \mathbb{Z}^+$, se alocam dentro de $k$ desvios-padrão em relação à média aritmética.

**Exemplo 3.2.3.** Se $k = 2$, então tem-se que:

$$\left(1 - \frac{1}{k^2}\right) = \left(1 - \frac{1}{2^2}\right) = \left(1 - \frac{1}{4}\right) = \frac{3}{4} = 0{,}75 \quad \text{ou} \quad 75\%$$

Ou seja, pelo teorema de Chebyshev, **pelo menos 75%** das observações em um conjunto de dados se posicionam dentro dos limites de dois desvios-padrão em relação à média aritmética ($\mu \pm 2\sigma$ ou $\bar{x} \pm 2s$).

Para $k = 3$:

$$\left(1 - \frac{1}{3^2}\right) = \left(1 - \frac{1}{9}\right) = \frac{8}{9} \cong 0{,}8889 \quad \text{ou} \quad 88{,}89\%$$

Ou seja, **pelo menos 88,89%** dos dados estão a no máximo 3 desvios-padrão da média. A grande força do Teorema de Chebyshev é que ele se aplica a **qualquer conjunto de dados**, independentemente da forma ou assimetria da distribuição.

---

### 3.3.2. Regra Empírica

Quando uma distribuição de frequências de um conjunto de dados apresenta **formato de sino** (distribuição normal ou aproximadamente simétrica e unimodal), pode-se dizer que:

* Aproximadamente **68%** das observações se alocam no intervalo delimitado por um desvio-padrão da média aritmética: $[\mu - \sigma, \mu + \sigma]$
* Aproximadamente **95%** das observações se alocam no intervalo delimitado por dois desvios-padrão da média aritmética: $[\mu - 2\sigma, \mu + 2\sigma]$
* Aproximadamente **99,7%** das observações se alocam no intervalo delimitado por três desvios-padrão da média aritmética: $[\mu - 3\sigma, \mu + 3\sigma]$

![Regra Empírica e Teorema de Chebyshev](recursos/grafico_regra_empirica_chebyshev.html)

---

### 3.3.3. Controle de Qualidade

A média e o desvio-padrão são medidas numéricas utilizadas no processo de controle de qualidade de itens em indústrias. Por exemplo, quando um item apresenta dimensões que se afastam muito da média, dizemos que ele foge dos padrões aceitáveis de qualidade, sendo muitas vezes descartado.

Geralmente, as inspeções são feitas considerando dois desvios-padrão da média como intervalo aceitável de qualidade. Assim, itens cujas características mensuradas estejam dentro desse intervalo são considerados aceitáveis; em contrapartida, itens fora desse intervalo são descartados.

Cabe destacar que, no melhoramento animal, o processo é o inverso, pois, nesse caso, é interessante para a indústria que existam animais diferenciados geneticamente dos demais (variabilidade). Por exemplo, no melhoramento genético de suínos é fundamental que existam animais cujas características mensuradas estejam além dos limites estabelecidos anteriormente, pois eles seriam selecionados para futuros cruzamentos, resultando em populações geneticamente modificadas de suínos.
