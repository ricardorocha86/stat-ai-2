# 6.3. Distribuição Exponencial

A distribuição de probabilidades exponencial é muito útil para modelar o espaço ou intervalo de acontecimento de um evento. Por exemplo, o tempo que se leva para completar uma tarefa, como o carregamento de um caminhão, ou o tempo de vida de um equipamento. Essa distribuição está relacionada à distribuição discreta de Poisson, uma vez que busca descrever a extensão do intervalo entre ocorrências aleatórias, ou seja, a distribuição de Poisson pode ser aplicada para analisar a quantidade de defeitos por intervalo (evento discreto), já a Exponencial, para analisar a extensão do intervalo entre defeitos (evento contínuo).

---

### Definição da Distribuição Exponencial

Uma variável aleatória contínua $X$ possui distribuição exponencial com parâmetro $\lambda > 0$ (onde $\lambda$ representa o valor esperado ou tempo médio entre ocorrências), notada por $X \sim \text{Exp}(\lambda)$, se sua função densidade de probabilidade (f.d.p.) é dada por:

$$f(x) = \frac{1}{\lambda} e^{-\frac{x}{\lambda}} \qquad x \ge 0$$

*Nota:* Em algumas referências teóricas adota-se a parametrização por taxa ($\alpha = 1/\lambda$), ao passo que aqui $\lambda$ expressa diretamente o valor esperado (tempo médio).

---

### Cálculo de Probabilidades Acumuladas

A fórmula a seguir fornece a probabilidade cumulativa de obtermos um valor menor ou igual a $x$ para a variável aleatória $X$, ou seja, é equivalente à área sob a curva da função anterior definida no intervalo $[0, x]$:

$$P(X \le x) = 1 - e^{-\frac{x}{\lambda}}$$

E para a probabilidade de um tempo superior a $x$ (evento complementar):

$$P(X > x) = e^{-\frac{x}{\lambda}}$$

Para um intervalo entre $x_1$ e $x_2$:

$$P(x_1 \le X \le x_2) = e^{-\frac{x_1}{\lambda}} - e^{-\frac{x_2}{\lambda}}$$

---

**Exemplo 6.3.1.** Em um restaurante, o tempo médio de atendimento aos clientes é de 20 minutos ($\lambda = 20$). Suponha que o tempo de atendimento tenha uma distribuição exponencial, responda:

**(a) Qual é a probabilidade de que um cliente seja atendido em até 15 minutos?**

Utilizando a fórmula da distribuição exponencial:

$$P(X \le 15) = 1 - e^{-\frac{15}{20}} = 1 - e^{-0{,}75} = 1 - 0{,}47237 = 0{,}5276 \cong 52{,}76\%$$

Portanto, a probabilidade de que um cliente seja atendido dentro de 15 minutos é de aproximadamente $52{,}76\%$.

**(b) Caso o cliente faça o pedido por telefone e chegue ao restaurante 25 minutos depois, qual a probabilidade de que o pedido não esteja pronto ($X > 25$)?**

Por meio da probabilidade do evento complementar:

$$P(X > 25) = 1 - P(X \le 25) = 1 - \left(1 - e^{-\frac{25}{20}}\right) = e^{-1{,}25} = 0{,}2865 \cong 28{,}65\%$$

Portanto, a probabilidade de que o pedido não esteja pronto após 25 minutos é de aproximadamente $28{,}65\%$.

![Simulador Interativo da Distribuição Exponencial](recursos/grafico_distribuicao_exponencial.html)
