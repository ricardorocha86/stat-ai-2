# Stat-AI 2.0 — Portal do Aluno de Estatística

Student portal for the *Estatística Aplicada* course: lesson material, exercises with AI grading and staged help, an AI tutor grounded in the lessons, an adapted-lesson generator and milestone prizes. React + Vite frontend on Firebase Hosting; OpenAI calls run in Firebase Functions.

Course content lives in `public/aulas` (`catalogo.json` lists units and lessons; each lesson folder has `material.md`, `exercises.json` and `recursos/`).

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The browser calls Firebase Functions for AI features. The OpenAI API key belongs in Firebase Secret Manager (`OPENAI_API_KEY`); it is not bundled into the frontend. See "AI backend (OpenAI)" below for the local emulator setup and the lesson vector store.

## Firebase publication

The project is `statai-app-2026-ricardo`, and its selected Hosting site is `statai-app` (`https://statai-app.web.app`).

To publish the frontend, run:

```bash
firebase deploy --only hosting --project statai-app-2026-ricardo
```

Hosting builds the frontend before uploading. To deploy the AI backend, the project needs the Blaze plan, the `OPENAI_API_KEY` secret and the lesson vector store ID (`OPENAI_VECTOR_STORE_ID`). The functions use Node.js 22 in `southamerica-east1`.

```bash
firebase deploy --only functions --project statai-app-2026-ricardo
```

## AI backend (OpenAI)

All AI runs in Firebase Functions (region `southamerica-east1`, Node.js 22, 2nd gen `onCall`). Nothing runs outside Firebase (Hosting, Authentication, Firestore, Storage, Functions).

**Model.** Every text-generation call uses OpenAI GPT-6.1 Sol (`gpt-6.1-sol`) through the Responses API with `reasoning.effort: "medium"`. Both are defined once in `functions/src/index.ts` (`TEXT_MODEL`, `REASONING`).

**Callable functions:**

- `sendStudentChat`: student tutor; uses the `file_search` tool over an OpenAI vector store that holds the lessons.
- `evaluateStudentAnswer`: grades answers with Structured Outputs. Multiple-choice letters are graded deterministically without AI; open activities are not auto-graded.
- `generateInteractiveLesson`: adapted lesson, with Structured Outputs.
- `generateExercise`: exercise generator of the professor mode, which is hidden in the UI.

**Secret.** `OPENAI_API_KEY` lives in Firebase Secret Manager:

```bash
firebase functions:secrets:set OPENAI_API_KEY --project statai-app-2026-ricardo
```

For the local emulator, put the key in `functions/.secret.local` (git-ignored).

**Lesson vector store.** `OPENAI_VECTOR_STORE_ID` is non-secret config kept in `functions/.env` (git-ignored; see `functions/.env.example`). From the repo root, create the store and write its ID into `functions/.env`:

```bash
node scripts/build-lesson-vector-store.mjs --write-env
```

The script uploads each `public/aulas/**/material.md` as "Aula NN - Título.md" (25 lessons from `public/aulas/catalogo.json`) and reads the key from the `OPENAI_API_KEY` environment variable or from `functions/.secret.local`. Re-run it whenever lesson material changes: it creates a new store, and old stores can be deleted in the OpenAI dashboard.

**Milestone prizes.** Five prizes unlock at 20, 40, 60, 80 and 100% of the verified exercises (`data/rewards.ts`): the Xarope tutor tone, a photo with the professor (not ready yet), a Sonho de Valsa, +0.2 on the final grade and a KitKat. The sidebar gift button opens them as silhouettes, revealed when the mark is reached (`components/RewardsModal.tsx`, drawings in `components/RewardArt.tsx`). Opening a prize writes `rewardClaims/<uid>_<rewardId>` in Firestore; the professor account sees the list in the same window and marks prizes as delivered. The professor email is set in `App.tsx` and `firestore.rules`.

**Tests.** The evaluation tests make no external AI calls:

```bash
npm --prefix functions run build
node scripts/test-exercise-evaluation.cjs
```
