"""Check catalog coverage, source preservation, answers and local resource references."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/"public"
SECTION=re.compile(r"^#{1,6}\s+(EXERC[IÍ]CIOS|QUEST[OÕ]ES M[UÚ]LTIPLA ESCOLHA|METODOLOGIA ATIVA)\s*$",re.I)
MEDIA=re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
SOLUTION=re.compile(r"^>\s*\*\*(Resolu[çc][aã]o|Gabarito|Resposta|Coment[aá]rio)",re.I)

def require(condition,message):
 if not condition: raise AssertionError(message)

def normalize(text):
 return re.sub(r"\s+"," ",text).strip()

def local_reference(reference, folder):
 if re.match(r"^(https?:|data:|#)",reference): return None
 path=PUBLIC/reference.lstrip("/") if reference.startswith("/") else folder/reference.split("#")[0].split("?")[0]
 require(path.resolve().is_relative_to(PUBLIC.resolve()), f"Resource outside public: {reference}")
 require(path.is_file(),f"Missing resource: {path}")
 return path

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,help="Approved Streamlit repository (read only)")
 parser.add_argument("--base-url",help="Running Vite URL, e.g. http://127.0.0.1:3001")
 args=parser.parse_args()
 catalog=json.loads((PUBLIC/"aulas/catalogo.json").read_text(encoding="utf-8"))
 report=json.loads((ROOT/"docs/migracao-aulas.json").read_text(encoding="utf-8"))
 report_lessons={row["aula"]:row for row in report["lessons"]}
 lessons=[lesson for unit in catalog["units"] for lesson in unit["lessons"]]
 require(len(lessons)==25,"Expected presentation, 23 lessons and appendix")
 require(sorted(lesson["number"] for lesson in lessons)==list(range(25)),"Missing or duplicate lesson numbers")
 require(len({lesson["id"] for lesson in lessons})==25,"Duplicate lesson IDs")
 gradables=0; activities=0; origins=Counter()
 ids=set(); files={PUBLIC/"aulas/catalogo.json"}; categories=Counter(); resolved=0; pending=[]; source_lines=0
 for lesson in lessons:
  material_path=PUBLIC/lesson["filePath"]; exercise_path=PUBLIC/lesson["exercisesPath"]
  require(material_path.is_file() and exercise_path.is_file(),f"Missing files for {lesson['title']}")
  material=material_path.read_text(encoding="utf-8")
  require(material.strip(),f"Empty lesson {lesson['number']}")
  require(not any(SECTION.match(line) for line in material.splitlines()),"Exercise section left in material")
  exercises=json.loads(exercise_path.read_text(encoding="utf-8"))
  require(len(exercises)==lesson["exerciseCount"],"Catalog count mismatch")
  files.update([material_path,exercise_path])
  active=material+"\n"+"\n".join(exercise.get(field,"") for exercise in exercises for field in ["enunciado","dica","passo_inicial","solucao_completa","resposta_final"])
  combined=active+"\n"+"\n".join(exercise.get(field,"") for exercise in exercises for field in ["enunciado_original","solucao_original"])
  for exercise in exercises:
   require(exercise["id"] not in ids,f"Duplicate exercise ID: {exercise['id']}")
   ids.add(exercise["id"]); categories[exercise["categoria"]]+=1
   require(exercise["enunciado"].strip(),"Empty exercise")
   require(not any(SOLUTION.match(line) for line in exercise["enunciado"].splitlines()),"Solution left in statement")
   require("**Gabarito:" not in exercise["enunciado"],"Answer exposed in statement")
   require(exercise["origem"]["aula"]==lesson["number"],"Wrong source lesson")
   require(exercise["resourceBasePath"]=="/"+material_path.parent.relative_to(PUBLIC).as_posix()+"/","Wrong resource base")
   resolved+=bool(exercise.get("solucao_completa"))
   if exercise.get("pendencias"):
    pending.append({"aula":lesson["number"],"id":exercise["id"],"pendencias":exercise["pendencias"]})
   for field in ["dica","passo_inicial","solucao_completa","resposta_final"]:
    require(bool(exercise.get(field,"").strip()),f"Missing progressive help: {exercise['id']} / {field}")
   meta=exercise.get("gabarito_meta",{})
   require(meta.get("conferido_enunciado") and meta.get("referencias"),"Missing answer provenance")
   origins[meta["origem"]]+=1
   if exercise["categoria"]=="atividade":
    require(exercise.get("correcao_automatica") is False and exercise.get("criterios_avaliacao"),"Activity lacks rubric or incorrectly awards automatic completion")
    activities+=1
   else:
    require(exercise.get("correcao_automatica") is True,"Exercise grading unexpectedly disabled")
    gradables+=1
   if exercise["categoria"]=="multipla_escolha":
    letter=re.search(r"Alternativa ([A-E])",exercise["resposta_final"])
    require(letter and letter[1].lower() in {option["id"] for option in exercise["alternativas"]},"Answer option not in statement")
   for reference in meta["referencias"]:
    if reference["tipo"]=="gabarito":
     require((ROOT/reference["arquivo"]).is_file(),"Missing official answer PDF")
   if lesson["number"]==7 and exercise["categoria"]=="multipla_escolha" and exercise["numero"]==8:
    require(exercise.get("solucao_original") and "Alternativa D" in exercise["resposta_final"] and "140" in exercise["resposta_final"],"Correct salary answer lost")
   if lesson["number"]==15 and exercise["numero"]==10:
    require("ex10_arvore_probabilidades.svg" in exercise["enunciado"] and "0,09" in exercise["resposta_final"].replace("{", "").replace("}", ""),"Equivalent tree missing")
  # Check the entire approved text remains in the correct lesson, except boundary labels and asset replacements.
  if args.source:
   source_path=args.source/lesson["sourcePath"]
   source=source_path.read_text(encoding="utf-8-sig")
   require(hashlib.sha256(source.encode()).hexdigest()==report_lessons[lesson["number"]]["source_sha256"],f"Approved source changed: {source_path}")
   normalized=normalize(combined)
   for index,line in enumerate(source.splitlines()):
    if not line.strip() or line.strip()=="---" or SECTION.match(line) or MEDIA.search(line): continue
    line=re.sub(r"^> ?","",line)
    line=re.sub(r"^\d+\.\s+","",line)
    if re.match(r"^#{1,6}\s+MINIPROJETO",line,re.I):
     require(any(exercise.get("titulo","")==re.sub(r"^#{1,6}\s+","",line) for exercise in exercises),"Activity heading lost")
     continue
    require(normalize(line) in normalized,f"Source text lost: lesson {lesson['number']}, line {index+1}: {line[:100]}")
    source_lines+=1
  for reference in MEDIA.findall(active):
   path=local_reference(reference,material_path.parent)
   if path: files.add(path)
 require(len(ids)==72,"Expected 72 exercises and activities")
 print_report=json.loads((ROOT/"docs/recursos-impressao.json").read_text(encoding="utf-8"))
 def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
 require(digest(PUBLIC/"aulas/recursos/chart-theme.js")==print_report["theme_sha256"],"Print snapshots need regeneration after theme change")
 require(digest(PUBLIC/"aulas/recursos/plotly.min.js")==print_report["plotly_sha256"],"Print snapshots need regeneration after Plotly change")
 print_resources={}
 for row in print_report["images"]:
  html_path=local_reference(row["html"],PUBLIC)
  png_path=local_reference(row["png"],PUBLIC)
  require(digest(html_path)==row["source_sha256"],f"Stale print chart: {html_path}")
  require(digest(png_path)==row["image_sha256"],f"Print chart changed without regenerating manifest: {png_path}")
  print_resources[html_path]=png_path
  files.add(png_path)
 require(print_report["resources"]==len(print_resources),"Wrong count of static exercise charts")
 for lesson in lessons:
  exercises=json.loads((PUBLIC/lesson["exercisesPath"]).read_text(encoding="utf-8"))
  for exercise in exercises:
   for field in ["enunciado","dica","passo_inicial","solucao_completa","resposta_final"]:
    for reference in MEDIA.findall(exercise.get(field,"")):
     resource=local_reference(reference,(PUBLIC/lesson["filePath"]).parent)
     if resource and resource.suffix==".html":
      require(resource.resolve() in {path.resolve() for path in print_resources},"Exercise chart has no print version")
 html_files=sorted((PUBLIC/"aulas").rglob("*.html"))
 for path in html_files:
  html=path.read_text(encoding="utf-8")
  require("https://cdn.plot.ly/" not in html,f"External Plotly dependency: {path}")
  require("/aulas/recursos/chart-theme.js" in html,f"Missing shared theme: {path}")
  for reference in re.findall(r'(?:src|href)=["\']([^"\']+)["\']',html):
   candidate=local_reference(reference,path.parent)
   if candidate: files.add(candidate)
  files.add(path)
 # Verify the unequal-width histogram is preserved rather than plotted with uniform-width bins.
 salary=next((PUBLIC/"aulas").rglob("ex13_histograma_salarios.html")).read_text(encoding="utf-8")
 figure=json.loads(re.search(r"const figure=(.*?);Plotly.newPlot",salary).group(1))
 bar=figure["data"][0]
 require(bar["width"]==[2,1,3,2],"Salary histogram class widths changed")
 require(abs(sum(width*density for width,density in zip(bar["width"],bar["y"]))-1)<1e-10,"Histogram area is not one")
 require(abs((.25+3*.15)*200-140)<1e-10,"Histogram reference calculation incorrect")
 normal=next(lesson for lesson in lessons if lesson["number"]==20)
 table=(PUBLIC/normal["filePath"]).read_text(encoding="utf-8")
 require("0,00000" in table and "0,49997" in table and "0,45053" in table,"Normal table values missing")
 endpoints=0
 if args.base_url:
  def check_http(path):
   url=urljoin(args.base_url+"/",path.relative_to(PUBLIC).as_posix())
   with urlopen(url,timeout=20) as response:
    require(response.status==200,f"HTTP failed: {url}")
    payload=response.read()
    require(payload==path.read_bytes(),f"Wrong served content: {url}")
   return url
  with ThreadPoolExecutor(max_workers=8) as pool: endpoints=len(list(pool.map(check_http,sorted(files))))
 result={"lessons":len(lessons),"exercises_and_activities":len(ids),"categories":dict(categories),"with_solution":resolved,
  "without_solution":len(ids)-resolved,"gradable_exercises":gradables,"activities_with_rubric":activities,"answer_origins":dict(origins),"source_lines_checked":source_lines,"html_resources":len(html_files),"http_files_checked":endpoints,
  "print_resources":len(print_resources),"resource_statuses":dict(Counter(row["status"] for row in report["resources"])),"pending":pending}
 print(json.dumps(result,ensure_ascii=False,indent=2))
 (ROOT/"docs/verificacao-aulas.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__": main()

