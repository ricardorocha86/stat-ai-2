from pathlib import Path
import json, re, math, statistics
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'public/aulas/catalogo.json').read_text(encoding='utf-8'))
items={e['id']:e for u in catalog['units'] for l in u['lessons'] for e in json.loads((ROOT/'public'/l['exercisesPath']).read_text(encoding='utf-8'))}
checks=[]
def item(aula,cat,num):return items[f'livro-aula-{aula:02}-{cat}-{num}']
def contains(e,fragment):
 text=e['resposta_final'].replace('{','').replace('}','').replace(chr(92),'')
 assert fragment in text,(e['id'],fragment,text)
 checks.append({'id':e['id'],'verificacao':fragment})
def raw_rows(e):
 lines=[line for line in e['enunciado'].splitlines() if line.startswith('|')]
 return [[cell.strip() for cell in line.strip('|').split('|')] for line in lines if ':' not in line and not re.fullmatch(r'[| \-]+',line)]
def category_counts(e,allowed):
 return Counter(cell for row in raw_rows(e) for cell in row if cell in allowed)
def solution_counts(e):
 out={}
 for line in e['solucao_completa'].splitlines():
  if not line.startswith('|'):continue
  cells=[v.strip() for v in line.strip('|').split('|')]
  if len(cells)>1 and cells[1].isdigit():out[cells[0]]=int(cells[1])
 return out
for aula,num,allowed in [(4,1,{'MA','CA','FC','PT','MU'}),(4,2,{'WA','IG','FB','SC','TT'}),(4,3,{'DN','CQ','CC','CD'})]:
 e=item(aula,'exercicio',num);counts=category_counts(e,allowed);answers=solution_counts(e)
 assert sum(counts.values()) in [30,16]
 assert all(answers[c]==n for c,n in counts.items()),(e['id'],counts,answers)
 checks.append({'id':e['id'],'verificacao':'Frequências da resolução iguais à recontagem das respostas do enunciado.'})
smart=item(6,'exercicio',5)
xs=[int(v) for row in raw_rows(smart) for v in row if v.isdigit()]
counts=Counter(xs);answer=solution_counts(smart)
assert len(xs)==40 and all(answer[str(x)]==counts[x] for x in counts)
contains(smart,f'{100*sum(x>=2 for x in xs)/len(xs):.0f}%')
truck=item(7,'exercicio',8)
xs=[int(v) for row in raw_rows(truck) for v in row if v.isdigit()]
bounds=[45,55,65,75,85,95]
freq=[sum(a<=x<b or (i==4 and x==b) for x in xs) for i,(a,b) in enumerate(zip(bounds,bounds[1:]))]
assert len(xs)==40 and freq==[4,10,12,9,5]
contains(truck,', '.join(str(v) for v in freq))
contains(item(2,'exercicio',3),str(round(80*.30))+' homens')
contains(item(2,'exercicio',3),str(round(60*.30))+' mulheres')
contains(item(2,'exercicio',4),'ADS: '+str(round(200*320/1600)))
contains(item(2,'exercicio',5),'34º, 39º, 44º, 49º e 54º')
contains(item(2,'multipla-escolha',6),f'{15+999*20:,}'.replace(',','.'))
salary=200*(1*.25+3*.15)
contains(item(7,'multipla-escolha',8),str(round(salary)))
chopp=item(6,'exercicio',6);n=sum([23,64,82,36,12,3])
contains(chopp,f'{15/n*100:.2f}'.replace('.',',')+'%')
contains(chopp,str(round(23+64+82*.5)))
colors=[3,6,5,4,6,3,2,5,5,4,5,6,3,2]
contains(item(8,'exercicio',1),f'{statistics.mean(colors):.2f}'.replace('.',','))
contains(item(12,'exercicio',1),f'{statistics.variance(colors):.2f}'.replace('.',','))
contains(item(12,'exercicio',1),f'{100*statistics.stdev(colors)/statistics.mean(colors):.2f}'.replace('.',','))
wages=item(8,'exercicio',3)
ys=[float(row[-1]) for row in raw_rows(wages) if row[-1].isdigit()]
contains(wages,f'{statistics.mean(ys):.1f}'.replace('.',','))
contains(wages,str(round(statistics.median(ys)))+' milhões')
m=[125,175,225,275,325];f=[8,14,16,7,5];sx=sum(a*b for a,b in zip(m,f));n=sum(f);sx2=sum(a*a*b for a,b in zip(m,f));variance=(sx2-sx*sx/n)/(n-1)
contains(item(11,'exercicio',8),str(round(sx/n))+' km')
contains(item(11,'exercicio',8),f'{math.sqrt(variance):.2f}'.replace('.',',')+' km')
contains(item(14,'exercicio',4),f'{100/110:.2f}'.replace('.',',')+'%')
contains(item(15,'exercicio',10),f'{.9*.1:.2f}'.replace('.',',')+'=9%')
contains(item(16,'exercicio',1),f'{100*math.comb(5,3)*.5**5:.2f}'.replace('.',',')+'%')
contains(item(17,'exercicio',2),f'{100*math.comb(10,3)/math.comb(15,3):.2f}'.replace('.',',')+'%')
contains(item(17,'exercicio',2),f'{100*5*math.comb(10,2)/math.comb(15,3):.2f}'.replace('.',',')+'%')
contains(item(18,'exercicio',3),f'{100*math.exp(-3)*sum(3**i/math.factorial(i) for i in range(3)):.2f}'.replace('.',',')+'%')
cdf=lambda z:(1+math.erf(z/math.sqrt(2)))/2
contains(item(20,'exercicio',2),f'{100*(cdf(1.5)-cdf(-1)):.2f}'.replace('.',',')+'%')
contains(item(21,'exercicio',3),f'{100*(math.exp(-.5)-math.exp(-1.5)):.2f}'.replace('.',',')+'%')
for num in [2,3,4]:
 e=item(23,'exercicio',num)
 pairs=[(float(row[0]),float(row[1])) for row in raw_rows(e) if len(row)==2 and all(re.fullmatch(r'\d+(?:\.\d+)?',v) for v in row)]
 x=[p[0] for p in pairs];y=[p[1] for p in pairs];n=len(x)
 xx=sum(v*v for v in x)-sum(x)**2/n;xy=sum(a*b for a,b in pairs)-sum(x)*sum(y)/n;yy=sum(v*v for v in y)-sum(y)**2/n
 b=xy/xx;a=statistics.mean(y)-b*statistics.mean(x)
 contains(e,f'{a:.6f}'.replace('.',','))
 contains(e,f'{b:.6f}'.replace('.',','))
 if num==2:contains(e,f'{(6-a)/b:.2f}'.replace('.',',')+' h')
 if num==3:contains(e,str(round(a+b*16))+' kcal');contains(e,str(round(a+b*52))+' kcal')
 if num==4:contains(e,f'{round(100*(a+b*35)):,}'.replace(',','.')+' unidades');contains(e,f'{xy/math.sqrt(xx*yy):.4f}'.replace('.',','))
contains(item(23,'exercicio',1),f'R$ {50+.2*100:.2f}'.replace('.',','))
contains(item(23,'multipla-escolha',5),f'{(.5+.5*6)-.210:.2f}'.replace('.',',')+' kg')
assert sum(e['correcao_automatica'] for e in items.values())==68
assert all(not e['correcao_automatica'] and len(e['criterios_avaliacao'])>=4 for e in items.values() if e['categoria']=='atividade')
report={'numeric_checks':len(checks),'activity_rubrics':4,'checks':checks}
(ROOT/'docs/verificacao-gabaritos-calculos.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'numeric_checks':len(checks),'activity_rubrics':4}))
