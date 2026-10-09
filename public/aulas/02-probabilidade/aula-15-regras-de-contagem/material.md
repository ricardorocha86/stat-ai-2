# 4.6. Regras de Contagem

A identificação e contagem dos resultados amostrais é uma etapa necessária no cálculo das probabilidades. Sendo assim, discutiremos três regras de contagem bastante úteis: (1) Experimento em múltiplas etapas; (2) Combinações; e, (3) Arranjos e Permutações.

---

### 4.6.1. Experimento em múltiplas etapas

Em experimentos nos quais é possível identificar etapas consecutivas, o número total de possíveis resultados do espaço amostral é dado pelo produto do número de possibilidades em cada uma das etapas (Princípio Fundamental da Contagem).

Se um experimento pode ser descrito como uma sequência de $k$ etapas com $n_1$ resultados possíveis na primeira etapa, $n_2$ na segunda etapa, e assim por diante até $n_k$ na $k$-ésima etapa, o número total de resultados possíveis no espaço amostral é dado por:

$$N = n_1 \times n_2 \times \dots \times n_k$$

**Exemplo:** O lançamento sucessivo de 3 moedas de duas faces resulta em $2 \times 2 \times 2 = 8$ resultados possíveis. Da mesma forma, a criação de senhas bancárias de 4 dígitos numéricos ($0$ a $9$) permite $10 \times 10 \times 10 \times 10 = 10.000$ combinações possíveis.

---

### 4.6.2. Combinações

Os cálculos de combinações são utilizados em problemas nos quais é necessário conhecer quantas possibilidades de subgrupos distintos com $p$ elementos podemos formar com um grupo de $n$ elementos, em que $p \le n$. Assim, quando utilizamos a combinatória, estamos interessados em agrupamentos cuja mudança de ordem de seus elementos não os altera (a ordem não importa).

**Cálculo do Número de Combinações:** O número de combinações distintas, selecionando $p$ elementos em um grupo com $n$, pode ser calculado pela fórmula:

$$C_{n, p} = \binom{n}{p} = \frac{n!}{p! \, (n - p)!}$$

*Obs.: A calculadora científica oferece a tecla “nCr” que executa essa operação facilmente.*

**Exemplo 4.6.2.** Suponha que você seja o gestor responsável por 12 operários igualmente qualificados no setor de uma empresa e precise selecionar uma dupla para trabalhar em um novo projeto. Quantas são as possibilidades de duplas distintas que podem ser selecionadas?

O número de duplas distintas pode ser obtido pelo cálculo de $C_{12, 2}$. Assim:

$$C_{12, 2} = \frac{12!}{2! \, (12 - 2)!} = \frac{12 \cdot 11 \cdot 10!}{2! \cdot 10!} = \frac{12 \cdot 11}{2} = 6 \cdot 11 = 66$$

Ou seja, é possível selecionar 66 duplas distintas. Esse mesmo cálculo pode ser feito na calculadora científica digitando "12 nCr 2 =".

---

### 4.6.3. Arranjos e Permutações

Quando os agrupamentos diferem entre si pela ordem de seus elementos (a ordem importa!), utilizamos as fórmulas de arranjos para calcular o número de opções distintas. Se o número de elementos ($p$) do subgrupo selecionado for igual ao do grupo inicial ($n$), dizemos que se trata de um caso particular dos arranjos, ou seja, permutações.

**Cálculo do Número de Arranjos:** O número de arranjos distintos, selecionando $p$ elementos em um grupo com $n$, pode ser calculado pela fórmula:

$$A_{n, p} = \frac{n!}{(n - p)!}$$

*Obs.: A calculadora científica oferece a tecla “nPr” que executa essa operação facilmente.*

**Permutações:** Quando $n = p$, tem-se:

$$P_n = A_{n, n} = n!$$

**Exemplo 4.6.3.** Suponha que você seja o gestor responsável por 12 operários igualmente qualificados no setor de uma empresa e precise selecionar uma dupla para trabalhar em um novo projeto. Porém, uma das pessoas dessa dupla ficará responsável pelo planejamento e execução (líder) e, consequentemente, receberá o maior salário. Quantas são as possibilidades de duplas distintas que podem ser selecionadas, levando em consideração a posição de responsabilidade?

O número de duplas distintas pode ser obtido pelo cálculo de $A_{12, 2}$. Assim:

$$A_{12, 2} = \frac{12!}{(12 - 2)!} = \frac{12 \cdot 11 \cdot 10!}{10!} = 12 \cdot 11 = 132$$

Ou seja, é possível selecionar 132 duplas distintas. Esse mesmo cálculo pode ser feito na calculadora científica digitando "12 nPr 2 =".

![Calculadora Interativa de Análise Combinatória](recursos/grafico_combinatoria_arranjos.html)
