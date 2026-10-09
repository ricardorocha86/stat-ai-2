# 1.2. Tipos de amostragens probabilísticas

Uma amostra aleatória ou probabilística é coletada de forma que cada indivíduo da população tenha alguma chance de ser selecionado ao acaso. A importância desse método de amostragem se deve ao fato de que os resultados obtidos a partir da análise da amostra podem ser extrapolados para a população.

Pesquisadores geralmente recorrem à amostragem por várias razões, dentre as quais a redução de custo e tempo é a mais relevante. Dentre os principais tipos de amostragens probabilísticas destacam-se a aleatória simples, a sistemática e a proporcional estratificada.

## 1.2.1. Amostragem Aleatória Simples

Esse tipo de amostragem equivale a um sorteio lotérico, pois todos os elementos da população possuem a mesma probabilidade de serem selecionados ao acaso. Por exemplo, se precisamos selecionar 7 pinguins de um grupo de 31 pinguins de um zoológico (Figura 1) já etiquetados previamente, escrevemos o código referente à etiqueta de cada um em pedaços de papel de mesmo tamanho e colocamos em uma caixa. Em seguida, agitamos a caixa e retiramos um dos papéis. Repetimos esse processo mais 6 vezes. Os 7 códigos extraídos correspondem aos pinguins selecionados para compor a amostra aleatória simples.

## 1.2.2. Amostragem Sistemática

Quando a população se encontra ordenada, como, por exemplo, as peças de uma linha de produção, é conveniente utilizar uma amostragem aleatória sistemática. Esse procedimento consiste em adotar certo padrão para selecionar as peças que comporão a amostra. Primeiramente, divide-se o tamanho da população ($N$) pelo tamanho da amostra ($n$) desejada, resultando em uma constante $k$. Em seguida, sorteia-se um número de 1 a $k$, o qual representará o primeiro elemento selecionado da população. Uma nova extração é realizada após $k$ elementos da primeira retirada e assim sucessivamente, até que os $n$ elementos sejam selecionados.

Imagine, por exemplo, que 100 pinguins estejam catalogados e você precisa obter uma amostra aleatória sistemática de 10%, ou seja, $n=10$. Dividimos 100 por 10, obtendo $k=10$. Sorteamos um número de 1 a 10, para ser o primeiro elemento selecionado; digamos que o número sorteado foi o 6. Assim, a amostra será composta pelos seguintes elementos: “6, 6+k, 6+2k, ...”, ou seja, “6, 16, 26, 36, 46, 56, 66, 76, 86 e 96”.

## 1.2.3. Amostragem Proporcional Estratificada

Muitas vezes a população encontra-se subdividida em estratos (subpopulações) e, portanto, recomenda-se que a amostragem os leve em consideração, pois algumas variáveis podem apresentar um comportamento bastante heterogêneo de um estrato para outro. Dessa forma, convém selecionar amostras em tamanho proporcional aos seus respectivos estratos, e a coleção de todas essas amostras é chamada de amostra proporcional estratificada.

Considere, por exemplo, o estudo de Amat, Viñuela e Ferrer (1993) que consistiu em desenvolver uma função matemática capaz de prever o sexo de pinguins (*Pygoscelis antarcticus*) por meio de dados morfométricos. Os autores capturaram 55 pinguins imediatamente após a copulação, sendo 27 machos e 28 fêmeas, e aferiram a medida dos bicos e nadadeiras de cada um deles. Nesse estudo, temos 2 estratos que correspondem a pinguins “machos” e “fêmeas”. A função matemática capaz de classificá-los quanto ao sexo só foi possível ser desenvolvida devido à heterogeneidade de medidas morfométricas entre os estratos.

Dessa forma, sempre que uma população apresentar alto grau de heterogeneidade com relação a uma determinada característica em estudo, pode ser vantajoso dividir essa população em diferentes estratos e selecionar uma amostra de cada um deles. Alguns exemplos mais comuns de estratos são: renda, despesas, gênero, nível de escolaridade, raça, tamanho da família, entre outros.

![Tipos de Amostragem Probabilística](recursos/grafico_tipos_amostragem.html)
