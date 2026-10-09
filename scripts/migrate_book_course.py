"""Import approved lessons, preserving question identities, source ranges and answers."""
from __future__ import annotations
import argparse, hashlib, json, re, shutil, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNITS = {
 "0_Apresentacao": ("00-apresentacao", "Apresentação"),
 "1_Descritiva": ("01-descritiva", "Estatística descritiva"),
 "2_Probabilidade": ("02-probabilidade", "Probabilidade"),
 "3_Variaveis_Discretas": ("03-distribuicoes-discretas", "Distribuições discretas"),
 "4_Variaveis_Continuas": ("04-distribuicoes-continuas", "Distribuições contínuas"),
 "5_Regressao_e_Correlacao": ("05-regressao-e-correlacao", "Regressão e correlação"),
 "6_Apendice_e_Referencias": ("06-apendice", "Apêndice e referências"),
}
IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
SECTION = re.compile(r"^#{1,6}\s+(EXERC[IÍ]CIOS|QUEST[OÕ]ES M[UÚ]LTIPLA ESCOLHA|METODOLOGIA ATIVA)\s*$", re.I)
QUESTION = re.compile(r"^(\d+)\.\s+(.+)")
PROJECT = re.compile(r"^#{1,6}\s+(MINIPROJETO.+)$", re.I)
SOLUTION = re.compile(r"^>\s*\*\*(?:Resolu[çc][aã]o|Gabarito|Resposta|Coment[aá]rio)", re.I)

def slug(text):
 return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()).strip("-")

def discover(source):
 for folder in UNITS:
  for path in sorted((source / "aulas" / folder).glob("Lição *.txt")):
   match = re.match(r"Lição (\d+)\s*-\s*(.+)\.txt$", path.name)
   if not match: raise ValueError(f"Unknown lesson: {path}")
   yield int(match[1]), match[2], path

def split_lesson(text, number, source_path):
 lines = text.splitlines()
 boundary = next((i for i,line in enumerate(lines) if SECTION.match(line)), len(lines))
 material = "\n".join(lines[:boundary]).rstrip().removesuffix("---").rstrip() + "\n"
 exercises, pending, category = [], None, "exercicio"
 def finish(end):
  nonlocal pending
  if pending is None: return
  start, original_number, title, body, kind = pending
  cut = next((i for i,line in enumerate(body) if SOLUTION.match(line)), len(body))
  statement = "\n".join(body[:cut]).strip().removesuffix("---").rstrip()
  solution = "\n".join(re.sub(r"^> ?", "", line) for line in body[cut:]).strip().removesuffix("---").rstrip()
  if re.search(r"\*\*Gabarito:", solution, re.I): kind="multipla_escolha"
  ex = {"id": f"livro-aula-{number:02d}-{slug(kind)}-{slug(original_number)}",
        "numero": int(original_number) if original_number.isdigit() else len(exercises)+1,
        "numero_original": original_number, "categoria": kind, "enunciado": statement,
        "origem": {"arquivo":source_path, "linha_inicial":start+1, "linha_final":end, "aula":number}}
  if title: ex["titulo"] = title
  if solution:
   ex["solucao_completa"] = solution
   answer = re.search(r"\*\*Gabarito:\s*\(([^)]+)\)\*\*", solution, re.I)
   if answer: ex["resposta_final"] = answer[1]
  parts = []
  for match in re.finditer(r"(?m)^\s*(?:-\s*)?\(([a-z])\)\s*(.+(?:\n(?!\s*(?:-\s*)?\([a-z]\)|\s*$).+)*)", statement):
   parts.append({"id":match[1], "texto":match[2].strip()})
  if parts: ex["alternativas" if kind=="multipla_escolha" else "subitens"] = parts
  if not statement: raise ValueError(f"Empty question: {source_path}:{start+1}")
  exercises.append(ex)
  pending = None
 for i in range(boundary,len(lines)):
  line = lines[i]
  section = SECTION.match(line)
  if section:
   finish(i)
   label = slug(section[1])
   category = "multipla_escolha" if label.startswith("questoes") else "atividade" if label.startswith("metodologia") else "exercicio"
   continue
  project = PROJECT.match(line) if category=="atividade" else None
  question = QUESTION.match(line) if category!="atividade" else None
  if project or question:
   finish(i)
   original_number = project[1] if project else question[1]
   pending = (i,original_number,project[1] if project else "",[] if project else [question[2]],category)
  elif pending: pending[3].append(line)
  elif line.strip() and line.strip()!="---": raise ValueError(f"Unassigned activity: {source_path}:{i+1}: {line}")
 finish(len(lines))
 if len({ex["id"] for ex in exercises})!=len(exercises): raise ValueError(f"Duplicate IDs: {source_path}")
 return material,exercises

def resolve_resource(source,lesson,relative):
 for candidate in (lesson.parent/relative,source/"aulas"/relative,source/"aulas"/"_figuras_originais"/relative):
  if candidate.is_file(): return candidate
 raise FileNotFoundError(f"Missing resource {relative} in {lesson.name}")

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,required=True)
 parser.add_argument("--write",action="store_true")
 args=parser.parse_args()
 source=args.source.resolve()
 destination=ROOT/"public"/"aulas"
 catalog={"title":"Estatística Aplicada","contentVersion":"livro-2020-v1","units":[]}
 units={}
 report={"lessons":[],"resources":[],"source":"Aulas aprovadas do Stat-AI 1.0"}
 for number,title,path in sorted(discover(source)):
  relative=path.relative_to(source).as_posix()
  text=path.read_text(encoding="utf-8-sig")
  material,exercises=split_lesson(text,number,relative)
  unit_id,unit_title=UNITS[path.parent.name]
  folder=f"{unit_id}/aula-{number:02d}-{slug(title)}"
  target=destination/folder
  for ex in exercises: ex["resourceBasePath"]=f"/aulas/{folder}/"
  resources={m[2]:m[1] for m in IMAGE.finditer(text)}
  for resource,description in resources.items():
   original=resolve_resource(source,path,resource)
   report["resources"].append({"aula":number,"arquivo":original.name,"descricao":description,"formato":original.suffix.lstrip("."),"destino":f"aulas/{folder}/recursos/{original.name}","status":"preservado"})
   if args.write:
    (target/"recursos").mkdir(parents=True,exist_ok=True)
    shutil.copyfile(original,target/"recursos"/original.name)
  def links(value):
   return IMAGE.sub(lambda m:f"![{m[1]}](recursos/{Path(m[2]).name})",value)
  material=links(material)
  for ex in exercises:
   for field in ("enunciado","solucao_completa"):
    if field in ex: ex[field]=links(ex[field])
   for field in ("alternativas","subitens"):
    for item in ex.get(field,[]): item["texto"]=links(item["texto"])
  unit=units.setdefault(unit_id,{"id":f"livro-{unit_id}","title":unit_title,"lessons":[]})
  unit["lessons"].append({"id":f"livro-aula-{number:02d}","title":title,"number":number,"filePath":f"aulas/{folder}/material.md","exercisesPath":f"aulas/{folder}/exercises.json","exerciseCount":len(exercises),"sourcePath":relative})
  report["lessons"].append({"aula":number,"titulo":title,"exercicios":len(exercises),"com_resolucao":sum(bool(ex.get("solucao_completa")) for ex in exercises),"atividades":sum(ex["categoria"]=="atividade" for ex in exercises),"recursos":len(resources),"source_sha256":hashlib.sha256(text.encode()).hexdigest()})
  if args.write:
   target.mkdir(parents=True,exist_ok=True)
   (target/"material.md").write_text(material,encoding="utf-8")
   (target/"exercises.json").write_text(json.dumps(exercises,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 catalog["units"]=list(units.values())
 if args.write:
  (destination/"catalogo.json").write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  (ROOT/"docs").mkdir(exist_ok=True)
  (ROOT/"docs"/"migracao-aulas.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 for row in report["lessons"]: print(f'{row["aula"]:02d}: {row["exercicios"]} exercícios/atividades, {row["com_resolucao"]} resoluções, {row["recursos"]} recursos')
 print(f'Lessons: {len(report["lessons"])}; exercises and activities: {sum(row["exercicios"] for row in report["lessons"])}; resources: {len(report["resources"])}')

if __name__=="__main__": main()
