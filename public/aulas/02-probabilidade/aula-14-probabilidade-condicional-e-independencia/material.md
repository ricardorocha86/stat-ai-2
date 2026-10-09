# 4.3. Probabilidade Condicional

Sejam $A$ e $B$ dois eventos, a probabilidade condicional de $A$, dado que $B$ tenha ocorrido, é denotada e calculada por:

$$P(A|B) = \frac{P(A \cap B)}{P(B)} \quad \text{com } P(B) \ne 0$$

em que $P(A \cap B)$ é a probabilidade da interseção dos dois eventos, também chamada de probabilidade conjunta.

**Exemplo 4.3.1.** Suponha que 50 alunos da FATEC tenham sido entrevistados para saber se são favoráveis ou contrários ao oferecimento de monitorias aos sábados. A tabela abaixo apresenta a classificação cruzada de respostas conforme duas variáveis coletadas:

| Condição | A Favor ($F$) | Contra ($\bar{F}$) | Total |
| :--- | :---: | :---: | :---: |
| **Trabalham ($T$)** | 18 | 6 | 24 |
| **Não trabalham ($\bar{T}$)** | 12 | 14 | 26 |
| **Total** | **30** | **20** | **50** |

![Tabela de Contingência Interativa](recursos/grafico_tabela_contingencia.html)

Com base nessa tabela, calculamos:

**(a) As quatro probabilidades marginais:**
* $P(T) = \frac{24}{50} = 0{,}48$
* $P(\bar{T}) = \frac{26}{50} = 0{,}52$
* $P(F) = \frac{30}{50} = 0{,}60$
* $P(\bar{F}) = \frac{20}{50} = 0{,}40$

**(b) A probabilidade de ser contra as monitorias aos sábados, dado que trabalha:**
$$P(\bar{F}|T) = \frac{P(\bar{F} \cap T)}{P(T)} = \frac{\frac{6}{50}}{\frac{24}{50}} = \frac{6}{24} = 0{,}25 \quad (25\%)$$

**(c) A probabilidade de não trabalhar, dado que é a favor das monitorias aos sábados:**
$$P(\bar{T}|F) = \frac{P(\bar{T} \cap F)}{P(F)} = \frac{\frac{12}{50}}{\frac{30}{50}} = \frac{12}{30} = 0{,}40 \quad (40\%)$$

**(d) A probabilidade de ser contra as monitorias aos sábados, dado que não trabalha:**
$$P(\bar{F}|\bar{T}) = \frac{P(\bar{F} \cap \bar{T})}{P(\bar{T})} = \frac{\frac{14}{50}}{\frac{26}{50}} = \frac{14}{26} \cong 0{,}54 \quad (54\%)$$

**(e) A probabilidade de não trabalhar, dado que é contra as monitorias aos sábados:**
$$P(\bar{T}|\bar{F}) = \frac{P(\bar{T} \cap \bar{F})}{P(\bar{F})} = \frac{\frac{14}{50}}{\frac{20}{50}} = \frac{14}{20} = 0{,}70 \quad (70\%)$$

---

## 4.4. Eventos Independentes

Dois eventos $A$ e $B$ são considerados independentes quando a ocorrência de um deles não altera a probabilidade da ocorrência do outro, ou seja, quando:

$$P(A|B) = P(A) \quad \text{ou} \quad P(B|A) = P(B)$$

**Probabilidade da interseção de dois eventos independentes:**  
Sejam $A$ e $B$ dois eventos independentes, então tem-se que:

$$P(A \cap B) = P(A) \cdot P(B)$$

**Exemplo 4.4.1.** Supondo que as probabilidades de que dois jogadores acertem um pênalti sejam $2/3$ e $3/5$, respectivamente, então, se cada um deles chutar uma vez, a probabilidade de que ambos acertem será:

$$P(J_A \cap J_B) = P(J_A) \cdot P(J_B) = \frac{2}{3} \cdot \frac{3}{5} = \frac{6}{15} = \frac{2}{5} = 0{,}40 \quad (40\%)$$

---

## 4.5. Probabilidade da União de Eventos

Para calcular a probabilidade da união de dois eventos $A$ e $B$, $P(A \cup B)$, somam-se suas probabilidades marginais, $P(A) + P(B)$, e subtrai-se sua probabilidade conjunta $P(A \cap B)$. Essa subtração deve ser realizada para eventos mutuamente não excludentes, ou seja, quando $P(A \cap B) \ne 0$, pois, ao somar as probabilidades marginais de $A$ e $B$, as probabilidades dos elementos pertencentes à interseção desses eventos são consideradas duas vezes.

**Probabilidade da união de eventos:** Sejam $A$ e $B$ dois eventos não mutuamente excludentes, então tem-se que:

$$P(A \cup B) = P(A) + P(B) - P(A \cap B)$$

Caso os eventos sejam **mutuamente exclusivos** (isto é, $A \cap B = \emptyset$), a probabilidade conjunta é nula ($P(A \cap B) = 0$), simplificando para:

$$P(A \cup B) = P(A) + P(B)$$

**Exemplo 4.5.1.** A probabilidade de que João resolva um problema matemático em 1 hora é de $4/5$, e a probabilidade de que Maria o resolva é de $2/3$. Se ambos tentarem resolver o problema independentemente, a probabilidade de ele ser resolvido pode ser calculada da seguinte forma:

Sendo $P(J) = \frac{4}{5}$ e $P(M) = \frac{2}{3}$, como os eventos são independentes, a probabilidade de ambos resolverem é:

$$P(J \cap M) = P(J) \cdot P(M) = \frac{4}{5} \cdot \frac{2}{3} = \frac{8}{15}$$

Assim, a probabilidade de que o problema seja resolvido (por João, por Maria ou por ambos) é dada por $P(J \cup M)$:

$$P(J \cup M) = P(J) + P(M) - P(J \cap M) = \frac{4}{5} + \frac{2}{3} - \frac{8}{15} = \frac{12 + 10 - 8}{15} = \frac{14}{15} \cong 93{,}33\%$$
