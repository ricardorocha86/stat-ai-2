# CAPÍTULO 4 - INTRODUÇÃO À PROBABILIDADE

Um dos tópicos mais importantes da estatística é o estudo das probabilidades, pois é a ferramenta que nos ajuda a tomar decisões em momentos de incerteza. Esses momentos de incerteza, decorrentes de fenômenos aleatórios, podem ser representados matematicamente por meio de modelos probabilísticos, os quais contribuem para tomadas de decisões.

Os primeiros estudos sobre a matematização do acaso foram feitos no século XVI pelos matemáticos italianos Luca Pacioli (1445 – 1517), Niccolò Tartaglia (ca. 1500 – 1557) e Girolamo Cardano (1501 – 1576). O primeiro livro a abordar o acaso, intitulado “Manual de Jogos de Azar” (*Liber de Ludo Aleae*), foi escrito por Cardano. Nesse manuscrito, são feitas considerações sobre os jogos de dados e sobre o cálculo de probabilidades de vitória, por vezes de forma incorreta (GONÇALVES e MENDES-LOPES, 2013).

Entretanto, a origem do estudo das probabilidades é atribuída à troca de correspondências entre Blaise Pascal (1623 – 1662) e Pierre de Fermat (1607 – 1665), no séc. XVII, acerca de um problema proposto por um nobre jogador francês denominado Cavaleiro De Méré. Esse problema consistia na divisão das apostas em um jogo de dados que precisava ser interrompido e teve uma solução que constitui um método geral de análise das probabilidades.

Ainda no séc. XVII, outros grandes nomes foram responsáveis pela origem formal da teoria das probabilidades, como Christiaan Huygens (1629 – 1695), Gottfried Leibniz (1646 – 1716) e Jacques Bernoulli (1654 – 1705). Nos séc. XVIII e XIX, destacam-se Abraham de Moivre (1667 – 1754), Pierre-Simon Laplace (1749 – 1827), Carl Friedrich Gauss (1777 – 1855) e Adolphe Quételet (1796 – 1874). E finalmente, no séc. XX, torna-se impossível citar todos os grandes nomes ligados à teoria das probabilidades, sendo assim, destacamos Andrei Kolmogorov (1903 – 1987) que, em 1933, estabelece os fundamentos da teoria moderna das probabilidades no seu livro *Foundations of Probability*.

---

## 4.1. Conceitos básicos

Antes de uma partida de futebol, uma moeda é lançada para definir qual time dará o pontapé inicial. Esse processo, na estatística, é denominado de **experimento** e, ao ser realizado, resulta em uma dentre duas observações. Cada uma das observações resultantes do lançamento da moeda é conhecida como **resultado**, e a coleção de todos os possíveis resultados constitui o **espaço amostral ($S$)**. A Tabela 4 exibe alguns exemplos de experimentos e seus respectivos espaços amostrais.

**Tabela 4 – Exemplos de experimentos e espaços amostrais**

| Experimento | Espaço amostral ($S$) |
| :--- | :--- |
| Lançamento de uma moeda | $S = \{\text{CA}, \text{CO}\}$ |
| Lançamento de um dado | $S = \{1, 2, 3, 4, 5, 6\}$ |
| Lançamento de duas moedas | $S = \{\text{CACA}, \text{CACO}, \text{COCA}, \text{COCO}\}$ |
| Jogar na loteria | $S = \{\text{GANHAR}, \text{PERDER}\}$ |

O espaço amostral de um experimento pode ser ilustrado por meio de um **diagrama de árvore**, desenho que nos ajuda na identificação de todos os possíveis resultados. Nessa representação visual, cada resultado do experimento corresponde a um ramo de árvore. O Exemplo 4.1.1 ilustra a construção de um diagrama de árvore para o experimento que consiste no lançamento de uma moeda não viciada duas vezes.

**Exemplo 4.1.1.** Considere o experimento que consiste em lançar uma moeda não viciada duas vezes.

Esse experimento possui duas etapas: o primeiro e o segundo lançamento da moeda, sendo que em cada uma dessas etapas temos apenas dois possíveis resultados: cara (CA) ou coroa (CO), que acontecem com a mesma probabilidade.

Assim, esse experimento pode ser representado da seguinte forma por um diagrama de árvore:

![Figura 9. Diagrama de árvore para o lançamento de uma moeda duas vezes, sendo CA = cara e CO = coroa](recursos/figura_9_arvore_moedas.svg)

![Árvore de Probabilidades Interativa](recursos/grafico_arvore_probabilidades.html)

Assim, o espaço amostral para esse experimento é:

$$S = \{\text{CACA}, \text{CACO}, \text{COCA}, \text{COCO}\}$$

Um **evento** corresponde à coleção de um ou mais resultados de um experimento e pode ser classificado em:
* **Evento Simples:** quando se trata de apenas um, e somente um, dos resultados de um experimento. Exemplo: tirar cara no primeiro lançamento e coroa no segundo:
$$E_S = \{\text{CACO}\}$$
* **Evento Composto:** quando consiste em dois ou mais resultados. Exemplo: tirar faces iguais no lançamento de duas moedas:
$$E_C = \{\text{CACA}, \text{COCO}\}$$

---

## 4.2. Propriedades e abordagens conceituais

A probabilidade de que um evento $E$ venha a ocorrer é representada por $P(E)$ e possui valor numérico no intervalo fechado de 0 a 1 ($0 \le P(E) \le 1$). Um evento que não possui chances de ocorrer (evento impossível) apresenta probabilidade 0. Já um evento cuja ocorrência é garantida (evento certo) apresenta probabilidade 1. A soma das probabilidades de todos os eventos simples $\sum P(E)$ para um experimento é sempre igual a 1.

**Propriedades:** Seja $E_i$ ($i = 1, \dots, n$) todos os $n$ eventos simples para um experimento, então:

(i) $$0 \le P(E_i) \le 1$$

(ii) $$\sum P(E_i) = P(E_1) + \dots + P(E_n) = 1$$

### As três abordagens conceituais para a probabilidade:

1. **Abordagem Clássica:** Aplicada para se calcular as probabilidades em experimentos cujos resultados sejam igualmente prováveis (equiprováveis):
$$P(E) = \frac{\text{Número de resultados favoráveis a } E}{\text{Número total de resultados possíveis no espaço amostral}} = \frac{n(E)}{N_S}$$

2. **Abordagem Frequentista (ou Empírica):** Aplicada quando a probabilidade é estimada com base na frequência relativa de repetições de um experimento sob condições idênticas:
$$P(E) = \frac{\text{Número de vezes em que o evento ocorreu}}{\text{Número total de repetições do experimento}} = \frac{f}{n}$$

3. **Abordagem Subjetiva:** Utilizada quando não há como calcular a probabilidade por equiprobabilidade teórica nem por repetição experimental; baseia-se na intuição, experiência profissional ou julgamento de especialistas.
