<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rYzZzZt6C1Kk4RMIbnAuiKNXE6UzTsft

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The browser calls Firebase Functions for AI features. The Gemini API key belongs in Firebase Secret Manager (`GEMINI_API_KEY`); it is not bundled into the frontend. A root `.env.local` is only needed for local scripts such as lesson indexing.

## Firebase publication

The project is `statai-app-2026-ricardo`, and its selected Hosting site is `statai-app` (`https://statai-app.web.app`).

To publish the frontend, run:

```bash
firebase deploy --only hosting --project statai-app-2026-ricardo
```

Hosting builds the frontend before uploading. To deploy the AI backend, the project needs the Blaze plan, the `GEMINI_API_KEY` secret and the lesson search store configuration. The functions use Node.js 22 in `southamerica-east1`.

```bash
firebase deploy --only functions --project statai-app-2026-ricardo
```

## Gemini API docs for coding agents

This project is configured to use the official Gemini API documentation inside Codex.

- MCP server: `.codex/config.toml` points Codex to `https://gemini-api-docs-mcp.dev`.
- Gemini skill: `.agents/skills/gemini-api-dev/SKILL.md` is installed from `google-gemini/gemini-skills`.
- Lockfile: `skills-lock.json` pins the installed skill source and hash.

After opening a new Codex session in this repository, verify the setup with:

```bash
npx add-mcp list -a codex
npx skills list
```

For Gemini API implementation work, ask the agent to use the `gemini-api-dev` skill and the Gemini Docs MCP before changing SDK calls, model names, function calling, structured outputs, image generation, or other Gemini API behavior.

## Gemini File Search for lesson grounding

The student chatbot uses Gemini File Search through Firebase Functions. The vector store contains every `public/aulas/**/material.md` lesson and the function reads its resource name from `GEMINI_FILE_SEARCH_STORE_NAME`.

1. Install the Python dependency:

   ```bash
   python -m pip install -r scripts/requirements.txt
   ```

2. Make sure `GEMINI_API_KEY` is available in your shell or `.env.local`.

3. Build the File Search store:

   ```bash
   python scripts/build_gemini_file_search_store.py
   ```

4. Copy the printed value, for example `GEMINI_FILE_SEARCH_STORE_NAME=fileSearchStores/...`, into `functions/.env` for local/emulator use and into your Firebase Functions environment before deploy.

5. Deploy functions after setting the variables:

   ```bash
   npm --prefix functions run build
   firebase deploy --only functions
   ```

The script creates a Gemini File Search Store, requests `models/gemini-embedding-2` when the installed SDK exposes that option, uploads each lesson as a separate Markdown document, and adds metadata for `lesson_id`, `lesson_title`, and `file_path`. The chatbot passes that store as a `fileSearch` tool and appends the retrieved lesson references to answers when Gemini returns grounding metadata.
