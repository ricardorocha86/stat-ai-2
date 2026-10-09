"""Rebuild known figures from documented data; preserve and report unknown data."""
from pathlib import Path
import json,math,re,html
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from plotly.offline import get_plotlyjs

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"public"/"aulas"
COLORS=["#2563eb","#0d9488","#d97706","#7c3aed","#dc2626"]
REPORT=json.loads((ROOT/"docs/migracao-aulas.json").read_text(encoding="utf-8"))
CATALOG=json.loads((BASE/"catalogo.json").read_text(encoding="utf-8"))
LESSONS={lesson["number"]:lesson for unit in CATALOG["units"] for lesson in unit["lessons"]}
OVERRIDES={}

def write_plot(filename,figure,title,source,lesson,schematic=False):
 figure.update_layout(template="plotly_white",height=470,colorway=COLORS,
  font={"family":"Arial, sans-serif","size":14},title=title,
  legend={"orientation":"h","y":-0.22,"x":0},margin={"l":60,"r":35,"b":100,"t":80})
 folder=ROOT/"public"/Path(LESSONS[lesson]["filePath"]).parent/"recursos"
 output=folder/(Path(filename).stem+".html")
 payload=figure.to_json()
 note="Esquema conceitual; não representa uma amostra observada." if schematic else source
 page='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><script src="/aulas/recursos/plotly.min.js"></script></head><body><div id="chart"></div><p style="font-size:12px;color:#64748b">'+html.escape(note)+'</p><script src="/aulas/recursos/chart-theme.js"></script><script>const figure='+payload+';Plotly.newPlot("chart",figure.data,figure.layout,{responsive:true,displaylogo:false});</script></body></html>'
 output.write_text(page,encoding="utf-8")
 OVERRIDES[(lesson,filename)]={"replacement":output.name,"status":"plotly","origem_dados":source,"esquematico":schematic}
 return output

def write_svg(filename,lesson,title,elements,height=400):
 folder=ROOT/"public"/Path(LESSONS[lesson]["filePath"]).parent/"recursos"
 output=folder/(Path(filename).stem+".svg")
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 '+str(height)+'" role="img" aria-labelledby="title"><title id="title">'+html.escape(title)+'</title><rect width="900" height="'+str(height)+'" fill="white"/><g font-family="Arial,sans-serif" fill="#334155">'+elements+'</g></svg>'
 output.write_text(svg,encoding="utf-8")
 OVERRIDES[(lesson,filename)]={"replacement":output.name,"status":"diagrama_vetorial","origem_dados":title}
 return output

def label(x,y,text,size=17,anchor="middle",color="#334155"):
 return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" fill="{color}">{html.escape(str(text))}</text>'

def line(x1,y1,x2,y2,color="#64748b",width=2):
 return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>'

def box(x,y,w,h,text):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="#eff6ff" stroke="#93c5fd"/>'+label(x+w/2,y+h/2+6,text)

def normal_plot(mu,sigma,cut,title,shade="left"):
 xs=[mu+sigma*(-4+8*i/400) for i in range(401)]
 density=lambda x: math.exp(-0.5*((x-mu)/sigma)**2)/(sigma*math.sqrt(2*math.pi))
 fig=go.Figure(go.Scatter(x=xs,y=[density(x) for x in xs],mode="lines",line={"color":COLORS[0],"width":3},name="Densidade"))
 selected=[x for x in xs if (x<=cut if shade=="left" else mu<=x<=cut)]
 fig.add_trace(go.Scatter(x=selected,y=[density(x) for x in selected],fill="tozeroy",line={"color":COLORS[1]},name="Área indicada"))
 fig.add_vline(x=cut,line_dash="dash",line_color=COLORS[2])
 fig.update_layout(xaxis_title="Valor da variável",yaxis_title="Densidade",showlegend=False)
 return fig

def table_override(filename,lesson,table):
 OVERRIDES[(lesson,filename)]={"markdown":table,"status":"tabela_markdown","origem_dados":"Valores do material aprovado"}

def build():
 # Qualitative graphics: preserve rounded percentages printed in the material.
 cats=["Santa Bárbara d’Oeste","Americana","Nova Odessa","Limeira","Sumaré"]
 fig=make_subplots(rows=2,cols=1,specs=[[{"type":"domain"}],[{"type":"xy"}]],vertical_spacing=0.17)
 fig.add_trace(go.Pie(labels=cats,values=[44,22,22,6,6],textinfo="label+percent",sort=False,marker={"colors":COLORS}),row=1,col=1)
 fig.add_trace(go.Bar(x=[8,4,4,1,1],y=cats,orientation="h",marker_color=COLORS,text=[8,4,4,1,1],textposition="auto",showlegend=False),row=2,col=1)
 fig.update_layout(xaxis={"title":"Número de alunos","rangemode":"tozero"},showlegend=False)
 write_plot("figura_4_barras_pizza.png",fig,"Cidade de residência dos 18 alunos","Tabela 1 da aula 4: contagens 8, 4, 4, 1, 1; percentuais arredondados 44%, 22%, 22%, 6%, 6%.",5)
 # Pareto: one figure, separate from the already native Markdown table.
 fig=go.Figure([go.Bar(x=["Atraso","Qualidade","Atendimento","Outros"],y=[132,18,8,2],name="Reclamações",marker_color=COLORS[0]),
  go.Scatter(x=["Atraso","Qualidade","Atendimento","Outros"],y=[82.5,93.75,98.75,100],yaxis="y2",mode="lines+markers",name="Acumulada (%)",line={"color":COLORS[1],"width":3})])
 fig.update_layout(yaxis={"title":"Número de reclamações","rangemode":"tozero"},yaxis2={"title":"Acumulada (%)","overlaying":"y","side":"right","range":[0,105]},xaxis_title="Motivo")
 write_plot("figura_5_diagrama_pareto.png",fig,"Diagrama de Pareto","Tabela 2 da aula 5: 132, 18, 8 e 2 reclamações.",5)
 # Heights, preserving the book's rounding and class widths.
 centers=[1.605,1.715,1.825,1.935]
 fig=go.Figure([go.Bar(x=centers,y=[.22,.39,.28,.11],width=[.11]*4,name="Histograma",marker={"color":COLORS[0],"line":{"color":"white","width":1}}),
  go.Scatter(x=[1.495]+centers+[2.045],y=[0,.22,.39,.28,.11,0],mode="lines+markers",name="Polígono",line={"color":COLORS[1],"width":3})])
 fig.update_layout(bargap=0,xaxis_title="Estatura (m)",yaxis_title="Frequência relativa")
 write_plot("figura_6_histograma_poligono.png",fig,"Histograma e polígono de frequências","Tabela 3 do material: classes [1,55;1,66), [1,66;1,77), [1,77;1,88), [1,88;1,99]; frequências relativas arredondadas.",7)
 fig=go.Figure(go.Scatter(x=[1.55,1.66,1.77,1.88,1.99],y=[0,22,61,89,100],mode="lines+markers",line={"color":COLORS[0],"width":3}))
 fig.update_layout(xaxis_title="Estatura (m)",yaxis={"title":"Frequência acumulada (%)","range":[0,105]})
 write_plot("figura_7_ogiva.png",fig,"Ogiva das estaturas","Tabela 3: percentuais acumulados 22%, 61%, 89%, 100%.",7)
 fig=go.Figure(go.Scatter(x=list(range(2009,2019)),y=[2,1.76,1.68,1.95,2.16,2.35,3.33,3.49,3.19,3.65],mode="lines+markers",line={"color":COLORS[0],"width":3}))
 fig.update_layout(xaxis={"title":"Ano","dtick":1},yaxis_title="Cotação média (R$)")
 write_plot("figura_8_grafico_linha_dolar.png",fig,"Cotação média anual do dólar","Tabela 4 da aula 7, de 2009 a 2018.",7)
 fig=go.Figure()
 attributes=["Viscosidade","Consistência","Cremosidade","Doçura","Cor"]
 for i,values in enumerate([[2.8,7.5,4.5,3.8,2.5],[3.5,2.2,6.8,7,5],[4.3,3.8,6.4,8.2,7.5]]):
  fig.add_trace(go.Scatterpolar(r=values+[values[0]],theta=attributes+[attributes[0]],mode="lines+markers",name="Iogurte "+chr(65+i),line={"color":COLORS[i],"width":3}))
 fig.update_layout(polar={"radialaxis":{"range":[0,9],"dtick":1}})
 write_plot("figura_9_grafico_radar_iogurte.png",fig,"Análise sensorial dos iogurtes","Tabela 5 da aula 7: escala de 0 a 9 cm.",7)
 # A wrongly extracted bar chart is replaced by the actual raw beer data table, not by a solved stem-and-leaf.
 beer_a=[4.7,4.7,4.8,5.1,5.5,5.5,5.6,6,7.1,7.4,7.8,8.3,8.3,9.2,9.9,10.2,11.5]
 beer_b=[4.4,5,5,5.6,5.6,5.8,5.9,5.9,6.7,6.8,6.9,7,9.6]
 rows=["| Flying Dog Brewery (%) | Sierra Nevada Brewery (%) |","| ---: | ---: |"]
 for i in range(max(len(beer_a),len(beer_b))):
  a=str(beer_a[i]).replace(".",",") if i<len(beer_a) else "—"
  b=str(beer_b[i]).replace(".",",") if i<len(beer_b) else "—"
  rows.append(f"| {a} | {b} |")
 table_override("ex11_ramo_folha_cervejas.png",7,"\n".join(rows))
 # Correct histogram located in the book, p. 50. Do not infer frequencies from the unrelated vaccination image.
 fig=go.Figure(go.Bar(x=[3,4.5,6.5,9],y=[.10,.25,.15,.05],width=[2,1,3,2],marker={"color":COLORS[0],"line":{"color":"white","width":1}},name="Densidade",hovertemplate="Centro: %{x}<br>Densidade: %{y}<extra></extra>"))
 fig.update_layout(xaxis={"title":"Salário (R$ 1.000,00)","tickvals":[0,2,4,5,8,10],"range":[0,10]},yaxis={"title":"Densidade de frequência","range":[0,.3]},bargap=0)
 write_plot("ex13_histograma_salarios.png",fig,"Distribuição dos salários","Gráfico original: livro, p. 50. Classes [2,4), [4,5), [5,8), [8,10); densidades 0,10; 0,25; 0,15; 0,05.",7)
 # Preserve the approved quartiles explicitly, rather than using Plotly's default quantile convention.
 fig=go.Figure()
 for i,(name,low,q1,median,q3,high) in enumerate([("PETR",5,13,19,25,35),("VALE",13,29,35,44,55)]):
  fig.add_trace(go.Box(name=name,q1=[q1],median=[median],q3=[q3],lowerfence=[low],upperfence=[high],marker_color=COLORS[i]))
 fig.update_layout(yaxis_title="Preço (R$)",showlegend=False)
 write_plot("figura_8_boxplot_petr_vale.png",fig,"Boxplots dos preços das ações","Quartis e extremos explicitamente calculados na aula 10.",10)
 # Formula-derived probability charts.
 fig=go.Figure(go.Bar(x=[0,1,2,3,4],y=[.17,.42,.25,.12,.04],marker_color=COLORS[0]))
 fig.update_layout(xaxis={"title":"Número de defeitos (x)","dtick":1},yaxis={"title":"P(x)","rangemode":"tozero"})
 write_plot("figura_10_prob_tecelagem.png",fig,"Probabilidades dos defeitos mensais","Tabela 5 da aula 16: 0,17; 0,42; 0,25; 0,12; 0,04.",16)
 for filename,mu,sigma,cut,title,mode in [
  ("figura_12_normal_padrao.png",0,1,1.6,"Área entre 0 e z = 1,60","between"),
  ("figura_14_padronizacao_ex622a.png",50,2,53,"Diâmetro dos eixos: X < 53 mm","left"),
  ("figura_15_padronizacao_ex623a.png",36,6,30,"Vida útil das baterias: X < 30 meses","left"),
  ("figura_16_padronizacao_ex623b.png",36,6,24.72,"Garantia: cauda inferior de aproximadamente 3%","left")]:
  write_plot(filename,normal_plot(mu,sigma,cut,title,mode),title,"Parâmetros e limites dos exemplos da aula 20.",20)
 # Replace the normal table scan with an exact native table.
 rows=["**Área entre 0 e z na normal padrão. Valores com cinco casas decimais.**","","| z | "+" | ".join(f"+0,{i:02d}" for i in range(10))+" |","| ---: | "+" | ".join(["---:"]*10)+" |"]
 for tenths in range(40):
  base=tenths/10
  values=[f"{.5*math.erf((base+i/100)/math.sqrt(2)):.5f}".replace(".",",") for i in range(10)]
  rows.append("| "+f"{base:.1f}".replace(".",",")+" | "+" | ".join(values)+" |")
 table_override("figura_13_tabela_normal.png",20,"\n".join(rows))
 fig=go.Figure(go.Scatter(x=[i/100 for i in range(501)],y=[math.exp(-i/100) for i in range(501)],mode="lines",line={"width":3,"color":COLORS[0]}))
 fig.update_layout(xaxis_title="Tempo / tempo médio",yaxis_title="Densidade × tempo médio",showlegend=False)
 write_plot("ex05_cap6_curva_normal.png",fig,"Forma da distribuição exponencial","Função f(x) = exp(−x/λ)/λ da aula 21, em unidades do tempo médio.",21)
 fig=go.Figure([go.Scatter(x=[6,2,5,8,6,9,1,2,4,7],y=[51,82,64,40,56,38,94,86,72,46],mode="markers",name="Veículos observados",marker={"size":9,"color":COLORS[0]}),
  go.Scatter(x=[1,9],y=[99.35-7.29,99.35-7.29*9],mode="lines",name="Reta ajustada",line={"width":3,"color":COLORS[1]})])
 fig.update_layout(xaxis_title="Tempo de uso (anos)",yaxis_title="Preço (mil R$)")
 write_plot("figura_17_dispersao_reta.png",fig,"Preço dos veículos e tempo de uso","Tabela do Exemplo 7.1.1 da aula 22; reta ŷ = 99,35 − 7,29x.",22)
 # Qualitative figures are clearly identified as conceptual, without invented observations.
 fig=make_subplots(rows=1,cols=2,subplot_titles=["Eixo a partir de zero","Eixo truncado"])
 for column in [1,2]:
  fig.add_trace(go.Bar(x=["A","B"],y=[70,30],marker_color=COLORS[:2],showlegend=False,hoverinfo="skip"),row=1,col=column)
  fig.update_yaxes(range=[0,80] if column==1 else [20,80],title_text="Escala relativa",row=1,col=column)
 write_plot("ex14_grafico_1_enem.png",fig,"Efeito do truncamento do eixo","Esquema do efeito de truncar o eixo; alturas 70 e 30 identificadas na imagem fornecida.",5,True)
 fig=make_subplots(rows=1,cols=3,subplot_titles=["Assimetria negativa","Simétrica","Assimetria positiva"])
 xs=[i/50 for i in range(1,401)]
 ys=[x*x*math.exp(-x) for x in xs]
 for column,(xx,yy) in enumerate([(xs,list(reversed(ys))),(xs,[math.exp(-.5*((x-4)/1.1)**2) for x in xs]),(xs,ys)],start=1):
  fig.add_trace(go.Scatter(x=xx,y=yy,mode="lines",line={"color":COLORS[column-1],"width":3},hoverinfo="skip",showlegend=False),row=1,col=column)
  fig.update_xaxes(showticklabels=False,title_text="Valores",row=1,col=column)
  fig.update_yaxes(showticklabels=False,row=1,col=column)
 write_plot("ex07_cap3_distribuicao.png",fig,"Formas de distribuições e assimetria","Formas conceituais descritas no exercício 7 da aula 12; sem amostras observadas.",12,True)
 fig=go.Figure()
 fig.add_trace(go.Box(name="Grupo A",q1=[180],median=[220],q3=[245],lowerfence=[100],upperfence=[340],marker_color=COLORS[0],hoverinfo="skip"))
 fig.add_trace(go.Box(name="Grupo B",q1=[120],median=[150],q3=[250],lowerfence=[90],upperfence=[290],marker_color=COLORS[1],hoverinfo="skip"))
 fig.add_trace(go.Scatter(x=["Grupo A"],y=[385],mode="markers",marker={"color":COLORS[0],"symbol":"diamond","size":9},showlegend=False,hoverinfo="skip"))
 fig.update_layout(yaxis={"showticklabels":False,"title":"Escala esquemática"},showlegend=False)
 write_plot("ex13_cap3_boxplot.png",fig,"Comparação conceitual de boxplots","Relações qualitativas descritas no exercício 13 da aula 12; sem valores numéricos observados.",12,True)
 # Native diagrams.
 elements=box(350,20,200,50,"Variáveis")+line(450,70,225,125)+line(450,70,675,125)
 elements+=box(90,125,270,55,"Qualitativas / categóricas")+box(540,125,270,55,"Quantitativas / numéricas")
 for x,parent,heading,examples in [(10,225,"Nominais","sexo, raça, região, grupo sanguíneo"),(235,225,"Ordinais","classe social, escolaridade"),(460,675,"Discretas","número de filhos, acidentes"),(685,675,"Contínuas","peso, altura, idade, renda")]:
  elements+=line(parent,180,x+102,235)+box(x,235,205,55,heading)+label(x+102,325,examples,12)
 write_svg("figura_2_tipos_variaveis.png",3,"Classificação dos tipos de variáveis",elements,360)
 elements=box(330,20,240,55,"Planejamento")+line(450,75,450,110)+box(330,110,240,55,"Coleta de dados")
 elements+=line(330,135,190,210)+line(570,135,710,210)+box(65,210,250,55,"População")+box(585,210,250,55,"Amostra")
 elements+=line(190,265,190,315)+line(710,265,710,315)+box(65,315,250,55,"Estatística descritiva")+box(585,315,250,55,"Estatística descritiva")
 elements+=line(710,370,450,415)+box(320,415,260,55,"Inferência estatística")+label(450,505,"Conclusões sobre a população")
 write_svg("figura_3_etapas_estudo.png",3,"Etapas de um estudo estatístico",elements,530)
 elements=label(450,45,"Dados organizados em ordem crescente",22)
 for i in range(4): elements+=f'<rect x="{70+190*i}" y="100" width="190" height="65" fill="{COLORS[i]}" opacity=".18" stroke="#64748b"/>'+label(165+190*i,140,"25%",20)
 elements+=label(260,195,"Q₁")+label(450,195,"Q₂ = mediana")+label(640,195,"Q₃")+line(70,220,830,220)
 write_svg("figura_10_quartis.png",10,"Quartis: quatro partes com 25% dos dados",elements,260)
 elements=line(240,45,240,350)+line(225,45,255,45)+line(225,350,255,350)
 elements+='<rect x="180" y="115" width="120" height="155" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>'+line(180,200,300,200,"#2563eb",3)
 elements+=label(390,120,"Q₃",20,"start")+label(390,205,"Q₂ = mediana",20,"start")+label(390,275,"Q₁",20,"start")
 elements+=label(390,50,"Maior valor dentro dos limites",16,"start")+label(390,355,"Menor valor dentro dos limites",16,"start")
 elements+='<circle cx="240" cy="20" r="5" fill="#d97706"/>'+label(390,25,"Valor atípico (outlier)",16,"start")
 write_svg("figura_11_esboco_boxplot.png",10,"Elementos de um boxplot",elements,400)
 # Coin and notebook trees, with all leaves and highlighted paths.
 for filename,lesson,depth,labels_,probabilities,highlight in [
  ("figura_9_arvore_moedas.png",13,2,["CA","CO"],None,False),
  ("figura_11_arvore_notebooks.png",16,3,["P","D"],[.9,.1],True)]:
  leaves=2**depth; height=leaves*48+75; elements=""
  def tree(level,x,y,path):
   nonlocal elements
   if level==depth:
    text="".join(path);selected=highlight and path.count("D")==1
    elements+=label(x+55,y+6,text,17,"start",COLORS[1] if selected else "#334155")
    if selected: elements+=f'<rect x="{x+45}" y="{y-15}" width="70" height="30" rx="12" fill="none" stroke="{COLORS[1]}" stroke-width="2"/>'
    return
   step=(leaves*48)/(2**(level+2))
   for index,event in enumerate(labels_):
    new_y=y+(-step if index==0 else step);new_x=x+190
    elements+=line(x,y,new_x,new_y,COLORS[0],2)
    text=event+(f" ({probabilities[index]:.1f})".replace(".",",") if probabilities else "")
    elements+=label(x+95,(y+new_y)/2-8,text,14)
    tree(level+1,new_x,new_y,path+[event])
  tree(0,30,height/2,[])
  write_svg(filename,lesson,"Árvore de resultados do experimento",elements,height)
 # Venn is symbolic: show the supplied probabilities without revealing the calculated union.
 elements='<rect x="30" y="30" width="840" height="300" rx="12" fill="#f8fafc" stroke="#cbd5e1"/><ellipse cx="360" cy="180" rx="210" ry="125" fill="#2563eb" fill-opacity=".18" stroke="#2563eb" stroke-width="3"/><ellipse cx="550" cy="180" rx="210" ry="125" fill="#0d9488" fill-opacity=".18" stroke="#0d9488" stroke-width="3"/>'
 elements+=label(260,160,"A",26)+label(650,160,"B",26)+label(450,190,"A ∩ B",23)+label(450,235,"P(A ∩ B) = 0,25",16)
 elements+=label(230,365,"P(A) = 0,60",20)+label(660,365,"P(B) = 0,45",20)
 write_svg("ex08_cap4_venn.png",15,"Eventos A e B e sua interseção",elements,400)
 # Correlation scale remains conceptual, with no fabricated samples.
 elements=label(450,40,"Direção e intensidade da correlação",24)
 for i in range(100):
  strength=abs((i-50)/50);shade=int(245-150*strength)
  elements+=f'<rect x="{50+8*i}" y="95" width="9" height="55" fill="rgb({shade},{shade},{shade})"/>'
 for x,value,text in [(50,"−1","Forte negativa"),(250,"−0,5","Regular"),(450,"0","Fraca"),(650,"0,5","Regular"),(850,"1","Forte positiva")]:
  elements+=label(x,180,value,20)+label(x,215,text,15)
 write_svg("escala_correlacao.png",23,"Escala de associação linear",elements,250)

def apply_overrides():
 for lesson in LESSONS.values():
  folder=ROOT/"public"/Path(lesson["filePath"]).parent
  material=(folder/"material.md").read_text(encoding="utf-8")
  exercises=json.loads((folder/"exercises.json").read_text(encoding="utf-8"))
  for (number,filename),override in OVERRIDES.items():
   if number!=lesson["number"]: continue
   pattern=re.compile(r"!\[([^\]]*)\]\(recursos/"+re.escape(filename)+r"\)")
   replacement=lambda m: override["markdown"] if "markdown" in override else f'![{m[1]}](recursos/{override["replacement"]})'
   material=pattern.sub(replacement,material)
   for exercise in exercises:
    for field in ["enunciado","solucao_completa"]:
     if field in exercise: exercise[field]=pattern.sub(replacement,exercise[field])
    for field in ["subitens","alternativas"]:
     for part in exercise.get(field,[]): part["texto"]=pattern.sub(replacement,part["texto"])
  # This answer in the approved text contradicts the actual chart; preserve it for editorial review, not automatic grading.
  if lesson["number"]==7:
   for exercise in exercises:
    if exercise["categoria"]=="multipla_escolha" and exercise["numero"]==8:
     if "solucao_completa" in exercise:
      exercise.setdefault("solucao_original",exercise["solucao_completa"])
      exercise.pop("solucao_completa")
     exercise.pop("resposta_final",None)
     exercise["pendencias"]=["O gabarito migrado indica 160; o histograma original da p. 50 fornece 140. Resolução aguardando revisão."]
  # Wrong original resource and no branch probabilities: keep the exercise identifiable, but make the missing figure explicit.
  if lesson["number"]==15:
   for exercise in exercises:
    if exercise["categoria"]=="exercicio" and exercise["numero"]==10:
     exercise["enunciado"]=re.sub(r"!\[[^\]]*\]\(recursos/ex10_cap4_arvore.png\)","**Figura necessária ainda não disponível.**",exercise["enunciado"])
     exercise["pendencias"]=["O arquivo associado é um gráfico de compradores, não a árvore citada. Faltam os ramos, as probabilidades e o caminho destacado."]
  (folder/"material.md").write_text(material,encoding="utf-8")
  (folder/"exercises.json").write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 for row in REPORT["resources"]:
  override=OVERRIDES.get((row["aula"],row["arquivo"]))
  if override:
   row.update({k:v for k,v in override.items() if k not in ["replacement","markdown"]})
   row.setdefault("destino_original",row["destino"])
   row["destino"]=str(Path(row["destino"]).with_name(override["replacement"])).replace("\\","/") if "replacement" in override else "Markdown na aula/exercício"
  elif row["arquivo"]=="ex10_cap4_arvore.png":
   row.update(status="pendente_figura_correta",motivo="Faltam dados para reconstruir a árvore do exercício.")
  elif row["arquivo"] in ["ex03_cap7_dispersao.png","ex05_cap7_massa_corporal.png"]:
   row.update(status="imagem_preservada_dados_ausentes",motivo="Os pares de dados completos não constam no material; nenhuma coordenada foi inventada.")
  elif row["arquivo"] in ["ex14_grafico_1_enem.png","ex07_cap3_distribuicao.png","ex13_cap3_boxplot.png"]:
   row.update(status="pendente_figura_correta",motivo="A imagem extraída não corresponde à figura descrita; dados da figura não constam no material.")
 for row in REPORT["lessons"]:
  lesson=LESSONS[row["aula"]]
  exercises=json.loads((ROOT/"public"/lesson["exercisesPath"]).read_text(encoding="utf-8"))
  row.setdefault("resolucoes_na_fonte",row["com_resolucao"])
  row["com_resolucao"]=sum(bool(exercise.get("solucao_completa")) for exercise in exercises)
  row["pendencias"]=[{"id":exercise["id"],"descricao":exercise["pendencias"]} for exercise in exercises if exercise.get("pendencias")]
 (ROOT/"docs/migracao-aulas.json").write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def main():
 shared=BASE/"recursos";shared.mkdir(exist_ok=True)
 (shared/"plotly.min.js").write_text(get_plotlyjs(),encoding="utf-8")
 build();apply_overrides()
 for resource in BASE.rglob("*.html"):
  source=resource.read_text(encoding="utf-8")
  source=re.sub(r'<script[^>]+src="https://cdn.plot.ly/[^"]+"[^>]*></script>','<script src="/aulas/recursos/plotly.min.js"></script>',source)
  if '/aulas/recursos/chart-theme.js' not in source:
   source=source.replace("</head>",'<script defer src="/aulas/recursos/chart-theme.js"></script></head>')
   # Theme must wrap Plotly before inline simulation scripts execute.
   source=source.replace(' defer src="/aulas/recursos/chart-theme.js"',' src="/aulas/recursos/chart-theme.js"')
   # The theme handles an empty body during loading.
  resource.write_text(source,encoding="utf-8")
 from prepare_exercise_answers import prepare_answers
 prepare_answers()
 print(f"Rebuilt {len(OVERRIDES)} resources. All Plotly dependencies are local.")

if __name__=="__main__": main()
