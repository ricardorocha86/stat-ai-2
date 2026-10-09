# 5.2. Distribuição Hipergeométrica

Anteriormente, vimos que uma das condições necessárias para aplicação da distribuição Binomial é a de que os testes do experimento sejam independentes, ou seja, as probabilidades dos dois possíveis resultados não devem sofrer interferência de ensaios anteriores. Porém, quando os testes não são independentes, caso sejam executados em uma amostra selecionada, sem reposição, de uma população finita, devemos utilizar a distribuição Hipergeométrica para encontrar as probabilidades desejadas.

Por exemplo, suponha que a empresa Y, do Exemplo 5.1.1, venda um lote com 20 notebooks para uma loja W e, posteriormente, descubra que 2 dentre os 20 apresentavam defeito. Assim, a empresa Y entra em contato com a loja W e é informada que dos 20 notebooks, 5 já foram vendidos. Se quisermos saber a probabilidade de que apenas um dos 5 notebooks vendidos esteja com defeito, devemos utilizar a distribuição Hipergeométrica, uma vez que a probabilidade de defeito se altera entre as 5 inspeções (amostragem sem reposição).

---

### Fórmula da Distribuição Hipergeométrica

Considere uma população de $N$ elementos, dos quais $r$ têm a característica A (sucesso) e $(N - r)$ têm a característica B (fracasso). Selecionam-se $n$ elementos ao acaso da população (sem reposição). Seja a variável aleatória $X$ que representa o número de elementos com a característica A na amostra de $n$ elementos, então a função de probabilidade de $X$ é dada por:

$$P(X = x) = \frac{C_{r, x} \cdot C_{(N - r), (n - x)}}{C_{N, n}} = \frac{\binom{r}{x} \binom{N - r}{n - x}}{\binom{N}{n}}$$

---

### Média e Desvio-Padrão da Distribuição Hipergeométrica

$$\mu = n \cdot p \quad \text{em que } p = \frac{r}{N}$$

$$\sigma = \sqrt{\left(\frac{N - n}{N - 1}\right) n \cdot p \cdot (1 - p)}$$

*Nota:* O termo $\left(\frac{N - n}{N - 1}\right)$ é conhecido como **Fator de Correção de População Finita (FCPF)**. Quando o tamanho da população $N$ é muito grande em relação à amostra $n$ (geralmente quando $n/N \le 0{,}05$, ou seja, a amostra representa menos de 5% da população), a distribuição hipergeométrica pode ser muito bem aproximada pela distribuição binomial.

---

**Exemplo 5.2.1.** Suponha que, numa inspeção de controle de qualidade, um lote de $N = 200$ peças seja analisado, das quais $r = 10$ são defeituosas. Um inspetor retira uma amostra aleatória de $n = 5$ peças sem reposição. Qual é a probabilidade de encontrar exatamente $x = 1$ peça defeituosa na amostra?

Aplicando a fórmula da distribuição hipergeométrica:
* $N = 200$ (tamanho do lote/população)
* $r = 10$ (total de defeituosas no lote)
* $N - r = 190$ (total de não defeituosas)
* $n = 5$ (tamanho da amostra)
* $x = 1$ (defeitos desejados na amostra)
* $n - x = 4$

$$P(X = 1) = \frac{\binom{10}{1} \binom{190}{4}}{\binom{200}{5}} = \frac{10 \cdot \frac{190!}{4! \, 186!}}{\frac{200!}{5! \, 195!}} = \frac{10 \cdot 52.457.860}{2.535.650.040} = \frac{524.578.600}{2.535.650.040} \cong 0{,}2069 \quad (20{,}69\%)$$

![Comparativo Interativo: Hipergeométrica vs Binomial](recursos/grafico_comparativo_hiper_binomial.html)
