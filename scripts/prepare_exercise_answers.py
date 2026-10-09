"""Apply reviewed progressive answers and generate their local solution charts."""
from pathlib import Path
from collections import Counter
import json
import math
import html
import plotly.graph_objects as go
from plotly.subplots import make_subplots

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
HELP_FIELDS=('dica','passo_inicial','solucao_completa','resposta_final')

def prepare_answers():
 catalog=json.loads((PUBLIC/'aulas/catalogo.json').read_text(encoding='utf-8'))
 lessons=[l for u in catalog['units'] for l in u['lessons']]
 by_number={l['number']:l for l in lessons}
 reviewed=json.loads((ROOT/'data/gabaritos_livro.json').read_text(encoding='utf-8'))['exercises']
 ids={e['id'] for l in lessons for e in json.loads((PUBLIC/l['exercisesPath']).read_text(encoding='utf-8'))}
 if set(reviewed)!=ids:
  raise ValueError(f"Gabaritos e catálogo diferem: ausentes={ids-set(reviewed)}, extras={set(reviewed)-ids}")
 charts={}
 def chart(lesson, exercise_id, filename, title, figure, source):
  figure.update_layout(title={'text':title},margin={'t':70,'l':60,'r':35,'b':70},font={'family':'Arial, sans-serif'},paper_bgcolor='white',plot_bgcolor='white')
  figure.update_xaxes(showgrid=False)
  figure.update_yaxes(gridcolor='#e2e8f0',zerolinecolor='#94a3b8')
  directory=PUBLIC/Path(by_number[lesson]['filePath']).parent/'recursos'
  output=directory/filename
  content='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><script src="/aulas/recursos/plotly.min.js"></script></head><body><div id="chart"></div><p style="font-size:12px;color:#64748b">'+html.escape(source)+'</p><script src="/aulas/recursos/chart-theme.js"></script><script>const figure='+figure.to_json()+';Plotly.newPlot("chart",figure.data,figure.layout,{responsive:true,displaylogo:false});</script></body></html>'
  output.write_text(content,encoding='utf-8')
  charts.setdefault(exercise_id,[]).append({'arquivo':output.relative_to(PUBLIC).as_posix(),'titulo':title,'origem_dados':source})
  return f"\n\n![{title}](recursos/{filename})"

 addenda={}
 def add_chart(lesson,id,filename,title,figure,source):
  addenda[id]=addenda.get(id,'')+chart(lesson,id,filename,title,figure,source)
 color='#2563eb'
 for id,categories,counts,title,name in [
 ('livro-aula-04-exercicio-1',['MA','CA','FC','PT','MU'],[9,10,5,2,4],'Sabores de minipizza — resolução','gabarito-ex01-pizzas.html'),
 ('livro-aula-04-exercicio-2',['WA','IG','FB','SC','TT'],[12,7,6,2,3],'Aplicativos escolhidos — resolução','gabarito-ex02-aplicativos.html')]:
  values=[100*v/sum(counts) for v in counts]
  fig=go.Figure(go.Bar(x=categories,y=values,marker_color=color,hovertemplate='%{x}: %{y:.2f}%<extra></extra>'))
  fig.update_layout(xaxis_title='Categoria',yaxis={'title':'Frequência percentual (%)','rangemode':'tozero'})
  add_chart(4,id,name,title,fig,'Contagens recontadas diretamente na tabela do enunciado da aula 4.')
 fig=go.Figure(go.Pie(labels=['Dinheiro','Cheque','Cartão de crédito','Cartão de débito'],values=[3,1,8,4],textinfo='label+percent',sort=False))
 add_chart(4,'livro-aula-04-exercicio-3','gabarito-ex03-pagamentos.html','Métodos de pagamento — resolução',fig,'Tabela do enunciado: 3, 1, 8 e 4 clientes; n=16.')
 fig=go.Figure(go.Bar(x=[0,1,2,3,4],y=[2,12,15,8,3],marker_color=color))
 fig.update_layout(xaxis={'title':'Número de smartphones','dtick':1},yaxis={'title':'Número de domicílios','rangemode':'tozero'})
 add_chart(6,'livro-aula-06-exercicio-5','gabarito-ex05-smartphones.html','Smartphones nos domicílios — resolução',fig,'40 registros do enunciado da aula 6; contagens 2, 12, 15, 8, 3.')
 mids=[50,60,70,80,90];freq=[4,10,12,9,5]
 fig=go.Figure([go.Bar(x=mids,y=freq,width=[10]*5,name='Histograma',marker={'color':color,'line':{'color':'white','width':1}}),
  go.Scatter(x=[40]+mids+[100],y=[0]+freq+[0],mode='lines+markers',name='Polígono',line={'color':'#0d9488','width':3})])
 fig.update_layout(bargap=0,xaxis_title='Tempo (min)',yaxis={'title':'Frequência absoluta','rangemode':'tozero'})
 add_chart(7,'livro-aula-07-exercicio-8','gabarito-ex08-histograma.html','Tempos dos caminhões — resolução',fig,'40 tempos do enunciado; classes [45,55), [55,65), [65,75), [75,85), [85,95].')
 fig=go.Figure(go.Scatter(x=[45,55,65,75,85,95],y=[0,10,35,65,87.5,100],mode='lines+markers',line={'color':color,'width':3}))
 fig.update_layout(xaxis_title='Limite superior da classe (min)',yaxis={'title':'Percentual acumulado (%)','range':[0,100]})
 add_chart(7,'livro-aula-07-exercicio-8','gabarito-ex08-ogiva.html','Ogiva dos tempos — resolução',fig,'Frequências acumuladas calculadas a partir dos 40 tempos do enunciado.')
 for lesson,num,x,y,title,units,residuals in [
 (22,1,[2,4,6,8,10],[5,7,11,13,19],'Distância e custo — resolução',('Distância (centenas de km)','Custo (centenas de R$)'),False),
 (23,2,[14,9,2,18,11,1,6,5],[8,7,3,10,8,2,5,3],'Horas de estudo e nota — resolução',('Horas de estudo por semana','Nota'),False),
 (23,3,[4,15,12,11,8,6,7,2,7,14,20,3,13],[120,200,140,110,120,80,190,100,120,190,190,110,120],'Açúcar, calorias e resíduos — resolução',('Açúcar (g por porção)','Calorias (kcal por porção)'),True),
 (23,4,[15,22,42,30,18,12,38],[11,22,30,26,17,15,23],'Promoções e vendas — resolução',('Promoções por dia','Vendas (centenas de unidades)'),False)]:
  n=len(x);sx=sum(x);sy=sum(y);b=(sum(a*c for a,c in zip(x,y))-sx*sy/n)/(sum(a*a for a in x)-sx*sx/n);a=sy/n-b*sx/n
  fig=go.Figure(go.Scatter(x=x,y=y,mode='markers',name='Observações',marker={'color':color,'size':10}))
  line_x=[min(x),max(x)]
  fig.add_trace(go.Scatter(x=line_x,y=[a+b*v for v in line_x],mode='lines',name='Reta ajustada',line={'color':'#0d9488','width':3}))
  if residuals:
   rx=[];ry=[]
   for xx,yy in zip(x,y):rx.extend([xx,xx,None]);ry.extend([yy,a+b*xx,None])
   fig.add_trace(go.Scatter(x=rx,y=ry,mode='lines',name='Resíduos verticais',line={'color':'#d97706','dash':'dot'}))
  fig.update_layout(xaxis_title=units[0],yaxis_title=units[1])
  id=f'livro-aula-{lesson:02}-exercicio-{num}'
  add_chart(lesson,id,f'gabarito-ex{num:02}-regressao.html',title,fig,'Pares completos da tabela do enunciado; mínimos quadrados calculados sem arredondar coeficientes.')
 # New equivalent exercise: highlight only the requested path, never show its joint answer in the statement.
 folder=PUBLIC/Path(by_number[15]['filePath']).parent/'recursos'
 elements=['<rect width="900" height="470" fill="white"/>','<g font-family="Arial,sans-serif" fill="#334155">']
 for x1,y1,x2,y2,label,selected in [
 (70,235,360,115,'P: 0,90',True),(70,235,360,355,'D: 0,10',False),
 (360,115,690,55,'P: 0,90',False),(360,115,690,175,'D: 0,10',True),
 (360,355,690,295,'P: 0,90',False),(360,355,690,415,'D: 0,10',False)]:
  stroke='#d97706' if selected else '#94a3b8'
  elements.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{4 if selected else 2}"/>')
  elements.append(f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-12}" text-anchor="middle" font-size="18">{label}</text>')
 for y,label,selected in [(55,'PP',False),(175,'PD',True),(295,'DP',False),(415,'DD',False)]:
  elements.append(f'<text x="730" y="{y+6}" font-size="22" fill="{"#b45309" if selected else "#334155"}">{label}</text>')
 elements.append('<text x="70" y="242" text-anchor="end" font-size="16">Início</text><text x="450" y="465" text-anchor="middle" font-size="16">Com reposição; caminho PD destacado em laranja</text></g>')
 svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 490" role="img" aria-labelledby="title"><title id="title">Árvore de duas retiradas independentes com reposição</title>'+''.join(elements)+'</svg>'
 tree_path=folder/'ex10_arvore_probabilidades.svg';tree_path.write_text(svg,encoding='utf-8')
 rows=[]
 for lesson in lessons:
  path=PUBLIC/lesson['exercisesPath'];exercises=json.loads(path.read_text(encoding='utf-8'))
  for e in exercises:
   answer=dict(reviewed[e['id']])
   for field in HELP_FIELDS:
    if not isinstance(answer.get(field),str) or not answer[field].strip():raise ValueError(f"Campo incompleto: {e['id']} / {field}")
   if e.get('solucao_completa') and 'solucao_original' not in e and not e.get('gabarito_meta'):
    e['solucao_original']=e['solucao_completa']
   if 'enunciado' in answer and answer['enunciado']!=e['enunciado']:
    e.setdefault('enunciado_original',e['enunciado'])
   e.update(answer)
   e['solucao_completa']+=addenda.get(e['id'],'')
   e.pop('pendencias',None)
   if answer.get('referencia_livro'):
    e['gabarito_meta']['referencias'].append({'tipo':'livro','arquivo':'arquivos/livro_estatistica_aplicada.pdf','pagina_pdf':answer['referencia_livro']['pagina']})
    e.pop('referencia_livro',None)
   e['gabarito_meta']['conferido_enunciado']=True
   rows.append({'id':e['id'],'aula':lesson['number'],'categoria':e['categoria'],'origem':e['gabarito_meta']['origem'],'correcao_automatica':e['correcao_automatica'],'referencias':e['gabarito_meta']['referencias'],'observacoes':e['gabarito_meta'].get('observacoes'),'recursos':charts.get(e['id'],[])})
  path.write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 result={'total':len(rows),'quatro_niveis_completos':len(rows),'exercicios_com_resposta':sum(row['correcao_automatica'] for row in rows),'atividades_com_roteiro':sum(not row['correcao_automatica'] for row in rows),'origens':dict(Counter(row['origem'] for row in rows)),'graficos_de_resolucao':sum(len(v) for v in charts.values()),'arvores_novas':1,'exercicios':rows}
 (ROOT/'docs/gabaritos-exercicios.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 report_path=ROOT/'docs/migracao-aulas.json'
 if report_path.exists():
  report=json.loads(report_path.read_text(encoding='utf-8'))
  for row in report['lessons']:
   lesson=by_number[row['aula']];items=json.loads((PUBLIC/lesson['exercisesPath']).read_text(encoding='utf-8'))
   row['com_resolucao']=sum(bool(e.get('solucao_completa')) for e in items)
   row['pendencias']=[]
  for row in report['resources']:
   if row['arquivo']=='ex10_cap4_arvore.png':
    row.update(status='substituido_exercicio_equivalente',motivo='Árvore nova com dados explícitos; imagem antiga não usada.',destino_novo=tree_path.relative_to(ROOT).as_posix())
  report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:v for k,v in result.items() if k!='exercicios'},ensure_ascii=False))
 return result

if __name__=='__main__':prepare_answers()
