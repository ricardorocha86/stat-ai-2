# 2.2. Dados Quantitativos

## 2.2.1. Distribuições de Frequências

Para elaborar uma tabela de distribuição de frequências para dados quantitativos, devemos definir inicialmente as “categorias”, nas quais os dados serão classificados, e aqui elas serão definidas por “intervalos numéricos”. Após o estabelecimento desses intervalos, o procedimento decorre de maneira análoga às variáveis qualitativas.

Para definirmos os intervalos numéricos devemos conhecer primeiramente a amplitude do conjunto de dados analisados. Em seguida, essa amplitude é dividida pelo número de intervalos ou classes ($k$), que definimos para a tabela de frequências.

**Definição 2.2.** A amplitude é a mais simples medida de dispersão ou variabilidade dos dados, ela é obtida pela diferença entre o valor máximo ($V_{\text{máx}}$) e o valor mínimo ($V_{\text{mín}}$) presentes nos dados.

Geralmente, o número de classes ($k$) para uma tabela de frequências varia de 5 a 20, dependendo do número de observações do conjunto de dados e da decisão subjetiva do pesquisador. Entretanto, em estatística, existem duas fórmulas que auxiliam na decisão da quantidade de classes utilizadas:

(1) Fórmula de Sturges: $k = 1 + 3{,}3 \log_{10}(n)$; em que $n$ representa o tamanho amostral  
(2) Convencional: $k = \sqrt{n}$

Assim, o processo de elaboração da primeira coluna de uma tabela de distribuição de frequências para dados quantitativos pode ser resumido pelos seguintes passos:

**Passo 1 – Definição do número de classes ($k$):**  
$$k = 1 + 3{,}3 \log_{10}(n) \quad \text{ou} \quad k = \sqrt{n}$$

**Passo 2 – Cálculo da amplitude de cada classe ($AC$):**  
$$AC = \frac{V_{\text{máx}} - V_{\text{mín}}}{k}$$

*Observação:* geralmente, a amplitude aproximada obtida pela fórmula é arredondada para um valor superior conveniente. Esse arredondamento para cima evita que o $V_{\text{máx}}$ seja classificado fora da última classe de frequência, quando iniciamos a primeira classe da tabela por um valor menor ou igual ao $V_{\text{mín}}$.

**Passo 3 – Definição das classes:** para definir os intervalos de classes, consideraremos o método “menos que” (MANN, 2015).  
Esse método é mais apropriado quando o conjunto de dados contém valores fracionários, ou seja, quando trabalhamos com variáveis quantitativas contínuas, porém pode ser facilmente adaptado para variáveis quantitativas discretas.  
Cabe destacar também que, nesse método, os intervalos são definidos como fechados à esquerda e abertos à direita, ou seja, o limite inferior do intervalo pertence à classe, já o superior não.

A primeira classe da tabela de distribuição de frequências é definida pelo valor mínimo do conjunto de dados ($V_{\text{mín}}$), como limite inferior, e pelo valor mínimo somado à amplitude de classe calculada anteriormente ($V_{\text{mín}} + AC$), como limite superior.

A segunda classe é definida tendo como limite inferior o limite superior da primeira classe ($V_{\text{mín}} + AC$) e como limite superior a $AC$ somada ao seu limite inferior; esse processo se repete até que as $k$ classes sejam definidas.

De maneira genérica, as classes serão:
* (1ª classe) $[V_{\text{mín}}, V_{\text{mín}} + AC[$
* (2ª classe) $[V_{\text{mín}} + AC, V_{\text{mín}} + 2AC[$
* (3ª classe) $[V_{\text{mín}} + 2AC, V_{\text{mín}} + 3AC[$ ...
* ($k$ª classe) $[V_{\text{mín}} + (k-1)AC, V_{\text{mín}} + k \cdot AC[$

*Observação:* qualquer valor conveniente ($V_{\text{conv}}$), igual ou menor que o $V_{\text{mín}}$ pode ser usado como o limite inferior da primeira classe. Nesse caso, a amplitude de classe pode ser calculada de forma a considerar o $V_{\text{conv}}$ como o $V_{\text{mín}}$ na fórmula do Passo 2.

**Exemplo de aplicação:** Construiremos uma tabela de distribuição de frequências para a estatura (em metros) de 18 alunos do curso de Logística da FATEC-Americana.

| | | | | | |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1,55 | 1,57 | 1,59 | 1,60 | 1,67 | 1,67 |
| 1,70 | 1,70 | 1,70 | 1,75 | 1,76 | 1,78 |
| 1,80 | 1,80 | 1,82 | 1,85 | 1,92 | 1,96 |

**Passo 1 – Definindo o número de classes ($k$):**  
Nesse caso, temos 18 observações ($n=18$), assim, pelo método convencional:  
$$k = \sqrt{n} = \sqrt{18} \cong 4 \text{ classes}$$

**Passo 2 – Cálculo da amplitude de classe ($AC$):**  
A maior estatura é de 1,96 m ($V_{\text{máx}}$) e a menor de 1,55 m ($V_{\text{mín}}$), então a amplitude de cada intervalo de classe é dada por:  
$$AC = \frac{V_{\text{máx}} - V_{\text{mín}}}{k} = \frac{1{,}96 - 1{,}55}{4} = \frac{0{,}41}{4} = 0{,}1025 \cong 0{,}11$$

Perceba que, caso consideremos uma amplitude de 0,10, teremos a última classe com limite superior de 1,95, o que faz com que a altura de 1,96 m fique fora da nossa tabela de frequências. Existem várias formas de contornar esse problema, dentre as mais simples estão: (1) arredondar a amplitude de classe para um valor superior conveniente; ou (2) tomar o maior valor do conjunto de dados como o limite superior da última classe.

A segunda opção é um caso específico e nos mostra que nem sempre é necessário que as classes tenham a mesma amplitude, já que em alguns casos é até mais adequado agrupar os dados em classes com amplitudes distintas. Um exemplo típico acontece na classificação de pessoas por faixas etárias, as quais nem sempre possuem a mesma amplitude: crianças (0 a 14 anos), jovens (15 a 29 anos), adultos (30 a 59 anos) e idosos (acima de 60 anos).

Em nosso exemplo, arredondamos a amplitude de classe para um valor superior conveniente, assim, $AC = 0{,}11$.

**Passo 3 – Definição das classes e construção da tabela de distribuição de frequências (Tabela 3):**  
Considerando o método “menos que” (MANN, 2015), as classes são definidas:  
* (1ª classe) $[V_{\text{mín}}, V_{\text{mín}} + AC[ = [1{,}55, 1{,}66[$  
* (2ª classe) $[V_{\text{mín}} + AC, V_{\text{mín}} + 2AC[ = [1{,}66, 1{,}77[$  
* (3ª classe) $[V_{\text{mín}} + 2AC, V_{\text{mín}} + 3AC[ = [1{,}77, 1{,}88[$  
* (4ª classe) $[V_{\text{mín}} + 3AC, V_{\text{mín}} + 4AC[ = [1{,}88, 1{,}99[$  

Após definir as classes, que consistem da primeira coluna da Tabela 3, classificamos os alunos em uma delas. Esse processo de classificação traduz-se em calcular a frequência absoluta de alunos por classe, que equivale à segunda coluna da Tabela 3.  
Na primeira classe, por exemplo, incluímos os alunos que possuem estatura igual ou maior que 1,55 m e menor que 1,66 m. Utilizamos o símbolo “$\vdash$” para representar esse intervalo fechado quanto ao número que aparece à esquerda e aberto quanto ao número à direita ($1{,}55 \vdash 1{,}66$). Em matemática, esse intervalo pode apresentar outras notações, como:  
$$1{,}55 \le x < 1{,}66 \quad , \quad [1{,}55, 1{,}66[ \quad \text{ou} \quad [1{,}55, 1{,}66)$$

**Tabela 3 – Distribuição de frequências para a estatura (em metros) de 18 alunos do curso de Logística da Fatec-Americana.**

| Altura | Número de Alunos | Frequência Relativa | Frequência Percentual | Frequência Acumulada |
| :---: | :---: | :---: | :---: | :---: |
| 1,55 ⊢ 1,66 | 4 | 0,22 | 22% | 22% |
| 1,66 ⊢ 1,77 | 7 | 0,39 | 39% | 61% |
| 1,77 ⊢ 1,88 | 5 | 0,28 | 28% | 89% |
| 1,88 ⊢ 1,99 | 2 | 0,11 | 11% | 100% |
| **Total** | **18** | **1,00** | **100%** | **-** |

As frequências relativas, percentuais e acumuladas são calculadas de modo análogo ao das variáveis qualitativas. Para a primeira classe ($1{,}55 \vdash 1{,}66$), por exemplo:  
* frequência absoluta ($f_a$) = 4  
* frequência relativa ($f_r$) = $\frac{f_a}{n} = \frac{4}{18} = 0{,}22$  
* frequência percentual ($f_p$) = $0{,}22 \times 100\% = 22\%$  
* frequência acumulada ($f_c$) = 22%

![Tabela 3: Distribuição de Frequências Quantitativas](recursos/grafico_distribuicao_quantitativa.html)

**Definição 2.3.** Dados apresentados em forma de tabela de distribuição de frequências são denominados dados agrupados. Em contrapartida, dados que apresentam valores individuais são denominados dados não-agrupados.
