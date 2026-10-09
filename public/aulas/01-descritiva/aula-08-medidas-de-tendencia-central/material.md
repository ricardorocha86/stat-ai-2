# CAPÍTULO 3 - MEDIDAS DESCRITIVAS NUMÉRICAS

## 3.1. Medidas descritivas numéricas para dados não agrupados

### 3.1.1. Medidas de tendência central

As medidas de tendência central são medidas numéricas que indicam em torno de qual valor os dados se distribuem ou se concentram. As mais conhecidas são a média, a mediana e a moda.

#### 3.1.1.1. Média aritmética

A média aritmética consiste na mais utilizada dentre as medidas de tendência central. Ela é obtida pela divisão da soma de todos os valores de um conjunto de dados pelo número de observações. Se a média é obtida utilizando todos os valores da população, é chamada de média populacional e representada pela letra grega $\mu$ (mi). Caso seja obtida utilizando os valores de uma amostra, é denominada média amostral e representada por $\bar{x}$ (lê-se: x barra).

Matematicamente, seja $x_1, x_2, \dots, x_N$ os valores pertencentes a uma população de tamanho $N$ e $x_1, x_2, \dots, x_n$ os pertencentes a uma amostra de tamanho $n$, as médias populacional e amostral são expressas por:

**População:**  
$$\mu = \frac{\sum x}{N}$$

**Amostra:**  
$$\bar{x} = \frac{\sum x}{n}$$

A média aritmética é uma excelente medida de tendência central, pois utiliza todos os valores coletados em seu cálculo. Porém, esse fato a torna muito sensível a valores extremos, ou seja, valores muito menores ou maiores que a maioria das observações do conjunto de dados tendem a alterar significativamente o valor da média.

**Exemplo 3.1.1.** Os dados a seguir fornecem o valor de venda (em reais) do dólar comercial no primeiro dia de cada mês ao longo de 2017 e, assim, são considerados como uma amostra sistemática de tamanho $n=12$ de todos os valores apresentados no ano de 2017.

| J | F | M | A | M | J | J | A | S | O | N | D |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 3,28 | 3,15 | 3,09 | 3,11 | 3,15 | 3,25 | 3,31 | 3,12 | 3,15 | 3,15 | 3,26 | 3,26 |

Para encontrar a média aritmética do valor de venda do dólar comercial nessa amostra, somamos os valores coletados acima e dividimos o resultado por 12. Assim, temos:

$$\bar{x} = \frac{\sum x}{n} = \frac{3{,}28 + 3{,}15 + 3{,}09 + \dots + 3{,}26}{12} = \frac{38{,}28}{12} = 3{,}19$$

O que significa dizer que uma estimativa para o preço médio de venda do dólar comercial no ano de 2017 foi de R$ 3,19. Note que nenhum dos 12 dias apresentou o valor de venda de R$ 3,19, mas que esse valor representa um ponto de equilíbrio para os valores distintos coletados.

Como já destacamos, a média é muito sensível à existência de valores muito discrepantes dos demais, principalmente quando o tamanho amostral é pequeno. Por exemplo, se no primeiro dia do mês de dezembro, após uma grave crise repentina, o valor de venda do dólar fosse o de R$ 10,00, a média passaria a ser:

$$\bar{x} = \frac{\sum x}{n} = \frac{3{,}28 + 3{,}15 + 3{,}09 + \dots + 10{,}00}{12} = \frac{45{,}02}{12} = 3{,}75$$

Fato que nos levaria a uma interpretação enganosa de que o valor de venda do dólar esteve próximo a R$ 3,75 ao longo do ano de 2017, quando na verdade esteve próximo a R$ 3,18. Pode não parecer um erro grave, mas para investidores essa diferença é gigantesca.

![Cotação do Dólar Comercial e Medidas de Tendência Central](recursos/grafico_tendencia_central.html)

#### 3.1.1.2. Média ponderada

Em alguns casos, certos valores em um conjunto de dados podem ser considerados mais importantes do que outros. Nesses casos, utilizamos a média ponderada. Assim, seja um conjunto de dados com $n$ valores, $x_1, x_2, \dots, x_n$, aos quais são atribuídos os pesos $p_1, p_2, \dots, p_n$, respectivamente, a média ponderada é calculada pela fórmula:

**Média ponderada:**  
$$\bar{x}_p = \frac{\sum x p}{\sum p}$$

em que $\sum x p$ é a somatória da multiplicação de cada valor por seu respectivo peso e $\sum p$ é a somatória dos pesos.

**Exemplo 3.1.2.** Na disciplina de estatística, o professor avalia os alunos por meio de um trabalho e duas provas tal que as provas possuem peso duas vezes maior que o trabalho. Qual é a média final de um aluno que tirou 8,0 no trabalho, 6,0 na primeira prova e 5,0 segunda?

A média final é dada por:

$$\bar{x}_p = \frac{\sum x p}{\sum p} = \frac{(8{,}0 \times 1) + (6{,}0 \times 2) + (5{,}0 \times 2)}{1 + 2 + 2} = \frac{30}{5} = 6{,}0$$

Sendo assim, a média final do aluno é 6,0 e, dessa forma, está aprovado na disciplina de estatística.

#### 3.1.1.3. Mediana

A mediana é definida como o valor que divide os registros de uma variável em duas partes iguais, após terem sido ordenados em ordem crescente ou decrescente (rol). Sendo assim, para calcular a mediana, deve-se classificar o conjunto de dados em ordem crescente ou decrescente e, em seguida, encontrar o termo posicionado no meio, cujo valor representará a mediana. Caso a variável possua um número de observações que seja par, a mediana é calculada com base na média entre os dois valores centrais.

Matematicamente, após classificar os dados em ordem, podemos encontrar a posição da mediana ($Md$) pela seguinte fórmula:

$$\text{Posição da } Md = X_{\left(\frac{n}{2} + 0{,}5\right)}$$

em que $X$ representa a variável analisada; e $n$, o número de observações que ela possui.

Por exemplo, supondo que queiramos encontrar a mediana em uma variável $Y$ composta por 18 observações, então a posição da mediana será dada por:

$$\text{Posição da } Md = Y_{\left(\frac{18}{2} + 0{,}5\right)} = Y_{(9{,}5)}$$

ou seja, a mediana está posicionada entre o nono e o décimo termo. Assim, é calculada por:

$$Md = \frac{Y_{(9)} + Y_{(10)}}{2}$$

**Exemplo 3.1.3.** Considerando os dados referentes ao valor ($V$) de venda do dólar comercial utilizados para exemplificar a média (Exemplo 3.1.1), a mediana pode ser calculada da seguinte forma:

1. Classificamos os dados em ordem crescente:  
3,09 | 3,11 | 3,12 | 3,15 | 3,15 | 3,15 | 3,15 | 3,25 | 3,26 | 3,26 | 3,28 | 3,31

2. Encontramos a posição da mediana:  
$$\text{Posição da } Md = V_{\left(\frac{12}{2} + 0{,}5\right)} = V_{(6{,}5)}$$  
ou seja, a mediana está posicionada entre o sexto e o sétimo termo.

3. Calculamos a mediana:  
$$Md = \frac{V_{(6)} + V_{(7)}}{2} = \frac{3{,}15 + 3{,}15}{2} = 3{,}15$$

Interpretando esse valor, tem-se que metade das observações (aprox. 50%) apresenta valor de venda menor ou igual a R$ 3,15 e, consequentemente, metade apresenta valor de venda maior ou igual a R$ 3,15. Dessa forma, concluímos que, em aproximadamente 50% do período analisado, o valor de venda do dólar comercial esteve abaixo de R$ 3,15.

Perceba que, se no primeiro dia do mês de dezembro, após uma grave crise repentina, o valor de venda do dólar fosse R$ 10,00, a mediana apresentaria o mesmo valor de R$ 3,15. Isso ocorre, pois a mediana não é sensível a valores extremos (outliers), diferente da média aritmética. Assim, na presença de valores extremos, recomenda-se utilizar a mediana como medida de tendência central.

#### 3.1.1.4. Moda

A moda é a medida de tendência central mais simples e representa o valor que aparece com maior frequência em um conjunto de dados. Por exemplo, considerando os dados referentes ao valor de venda do dólar comercial, tem-se que a moda é de R$ 3,15, que aparece 4 vezes.

Caso um conjunto de dados apresente dois valores com a mesma frequência mais alta, dizemos que esse conjunto possui duas modas e, portanto, a distribuição dos dados é bimodal. Caso apresente três ou mais observações com a mesma frequência é chamado de multimodal.

#### 3.1.1.5. Qual medida de tendência central escolher?

A escolha do método de medida de tendência central requer conhecimento da forma da distribuição de frequências da variável analisada. Como já mencionado, a média aritmética é muito sensível a valores extremos, o que significa que se uma distribuição é assimétrica seria mais vantajoso utilizar a mediana. Já para distribuições simétricas, não há diferença significativa entre o uso da média, mediana ou da moda, pois nesse caso essas três medidas são muito próximas. Caso a distribuição seja simétrica e multimodal, os valores das modas seriam mais indicados para descrever a distribuição.
