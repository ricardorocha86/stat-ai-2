// Builds the OpenAI vector store that grounds the student tutor (file_search) in the lessons.
// Each public/aulas/**/material.md is uploaded as "Aula NN - Título.md"; the tutor cites that name.
//
// Usage (from the repository root):
//   node scripts/build-lesson-vector-store.mjs              # create the store and print its ID
//   node scripts/build-lesson-vector-store.mjs --write-env  # also save OPENAI_VECTOR_STORE_ID in functions/.env
//
// The API key comes from OPENAI_API_KEY or from functions/.secret.local (never printed).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The SDK is a dependency of the Cloud Functions package.
const { OpenAI, toFile } = createRequire(path.join(root, 'functions/package.json'))('openai');

const readLocalSecret = () => {
  const file = path.join(root, 'functions/.secret.local');
  if (!fs.existsSync(file)) return undefined;
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find(row => row.startsWith('OPENAI_API_KEY='));
  return line?.slice('OPENAI_API_KEY='.length).trim().replace(/^["']|["']$/g, '') || undefined;
};

const apiKey = process.env.OPENAI_API_KEY || readLocalSecret();
if (!apiKey) {
  console.error('Defina OPENAI_API_KEY no ambiente ou em functions/.secret.local.');
  process.exit(1);
}

const writeEnv = process.argv.includes('--write-env');
const client = new OpenAI({ apiKey });
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/aulas/catalogo.json'), 'utf8'));
const lessons = catalog.units.flatMap(unit => unit.lessons);

const vectorStore = await client.vectorStores.create({ name: `statai-aulas-${catalog.contentVersion}` });
console.log(`Vector store criado: ${vectorStore.id} (${lessons.length} aulas)`);

let failed = 0;
for (const lesson of lessons) {
  const fileName = `Aula ${String(lesson.number).padStart(2, '0')} - ${lesson.title}.md`;
  const content = fs.readFileSync(path.join(root, 'public', lesson.filePath));
  const uploaded = await client.files.create({
    file: await toFile(content, fileName, { type: 'text/markdown' }),
    purpose: 'assistants',
  });
  const attached = await client.vectorStores.files.createAndPoll(vectorStore.id, {
    file_id: uploaded.id,
    attributes: { lesson_id: lesson.id, lesson_title: lesson.title, file_path: lesson.filePath },
  });
  if (attached.status !== 'completed') failed++;
  console.log(`${attached.status === 'completed' ? 'ok  ' : 'ERRO'} ${fileName}${attached.last_error ? ' — ' + attached.last_error.message : ''}`);
}

if (failed) {
  console.error(`${failed} arquivo(s) não foram indexados. O vector store ${vectorStore.id} ficou incompleto.`);
  process.exit(1);
}

console.log(`\nOPENAI_VECTOR_STORE_ID=${vectorStore.id}`);

if (writeEnv) {
  const envFile = path.join(root, 'functions/.env');
  const rows = fs.existsSync(envFile)
    ? fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter(row => row && !row.startsWith('OPENAI_VECTOR_STORE_ID='))
    : [];
  fs.writeFileSync(envFile, [...rows, `OPENAI_VECTOR_STORE_ID=${vectorStore.id}`].join('\n') + '\n');
  console.log('Gravado em functions/.env.');
}
