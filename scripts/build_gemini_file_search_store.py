"""Build a Gemini File Search store from the StatAI lesson materials.

Usage:
    python scripts/build_gemini_file_search_store.py

Required environment:
    GEMINI_API_KEY
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LESSONS_ROOT = PROJECT_ROOT / "public" / "aulas"
DEFAULT_DISPLAY_NAME = "StatAI Aulas"


@dataclass(frozen=True)
class LessonDocument:
    lesson_id: str
    title: str
    source_path: Path


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_project_env() -> None:
    for env_path in (
        PROJECT_ROOT / ".env",
        PROJECT_ROOT / ".env.local",
        PROJECT_ROOT / "functions" / ".env",
        PROJECT_ROOT / "functions" / ".env.local",
    ):
        load_dotenv(env_path)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def title_from_markdown(path: Path) -> str:
    content = path.read_text(encoding="utf-8")
    for line in content.splitlines():
        match = re.match(r"^#\s+(.+)$", line.strip())
        if match:
            return normalize_space(re.sub(r"[*_`]", "", match.group(1)))
    return path.parent.name.replace("-", " ").title()


def discover_lessons(lessons_root: Path) -> list[LessonDocument]:
    documents: list[LessonDocument] = []
    catalog_path = lessons_root / "catalogo.json"
    if catalog_path.exists():
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        for unit in catalog["units"]:
            for lesson in unit["lessons"]:
                relative = Path(lesson["filePath"]).relative_to("aulas")
                source_path = lessons_root / relative
                if not source_path.is_file():
                    raise FileNotFoundError(source_path)
                documents.append(LessonDocument(lesson["id"], lesson["title"], source_path))
    else:
        for source_path in sorted(lessons_root.rglob("material.md")):
            documents.append(LessonDocument(source_path.parent.name, title_from_markdown(source_path), source_path))

    if not documents:
        raise RuntimeError(f"No material.md files found under {lessons_root}")

    return documents


def write_upload_copy(document: LessonDocument, temp_dir: Path) -> Path:
    relative_source = document.source_path.relative_to(PROJECT_ROOT).as_posix()
    content = document.source_path.read_text(encoding="utf-8")
    upload_path = temp_dir / f"{document.lesson_id}.md"
    upload_path.write_text(
        "\n".join(
            [
                f"# {document.title}",
                "",
                f"Lesson ID: {document.lesson_id}",
                f"Source path: {relative_source}",
                "",
                content,
            ]
        ),
        encoding="utf-8",
    )
    return upload_path


def wait_for_operation(client: Any, operation: object, poll_seconds: int) -> object:
    while not getattr(operation, "done", False):
        time.sleep(poll_seconds)
        operation = client.operations.get(operation)

    error = getattr(operation, "error", None)
    if error:
        raise RuntimeError(f"Gemini File Search operation failed: {error}")

    return operation


def create_store(client: Any, display_name: str):
    config = {
        "display_name": display_name,
        "embedding_model": "models/gemini-embedding-2",
    }

    try:
        return client.file_search_stores.create(config=config)
    except Exception as error:
        if "embedding_model" not in str(error):
            raise

        print(
            "Installed google-genai does not expose create(config.embedding_model); "
            "creating the store with the SDK default embedding model."
        )
        return client.file_search_stores.create(config={"display_name": display_name})


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a Gemini File Search store and upload StatAI lesson markdown files."
    )
    parser.add_argument("--display-name", default=DEFAULT_DISPLAY_NAME)
    parser.add_argument("--store-name", help="Existing File Search Store resource name, for example fileSearchStores/abc123.")
    parser.add_argument("--lessons-root", type=Path, default=DEFAULT_LESSONS_ROOT)
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--chunk-overlap", type=int, default=80)
    parser.add_argument("--poll-seconds", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    lessons_root = args.lessons_root
    if not lessons_root.is_absolute():
        lessons_root = PROJECT_ROOT / lessons_root

    documents = discover_lessons(lessons_root)
    print(f"Found {len(documents)} lesson documents.")

    if args.dry_run:
        for document in documents:
            print(f"- {document.title} :: {document.source_path.relative_to(PROJECT_ROOT).as_posix()}")
        return 0

    load_project_env()
    if not os.environ.get("GEMINI_API_KEY"):
        print("GEMINI_API_KEY is required. Set it in the environment or .env.local.", file=sys.stderr)
        return 2

    try:
        from google import genai
    except ImportError:
        print("Missing dependency: install with `python -m pip install -r scripts/requirements.txt`.", file=sys.stderr)
        return 2

    client = genai.Client()
    store_name = args.store_name
    if store_name:
        print(f"Using existing File Search Store: {store_name}")
    else:
        store = create_store(client, args.display_name)
        store_name = store.name
        print(f"Created File Search Store: {store_name}")
        print(f"Display name: {getattr(store, 'display_name', None) or getattr(store, 'displayName', args.display_name)}")

    with tempfile.TemporaryDirectory(prefix="statai-gemini-file-search-") as temp:
        temp_dir = Path(temp)

        for index, document in enumerate(documents, start=1):
            relative_source = document.source_path.relative_to(PROJECT_ROOT).as_posix()
            upload_path = write_upload_copy(document, temp_dir)
            print(f"[{index}/{len(documents)}] Uploading {document.title}")

            operation = client.file_search_stores.upload_to_file_search_store(
                file=str(upload_path),
                file_search_store_name=store_name,
                config={
                    "mime_type": "text/markdown",
                    "display_name": document.title[:512],
                    "custom_metadata": [
                        {"key": "lesson_id", "string_value": document.lesson_id},
                        {"key": "lesson_title", "string_value": document.title[:1024]},
                        {"key": "file_path", "string_value": relative_source},
                    ],
                    "chunking_config": {
                        "white_space_config": {
                            "max_tokens_per_chunk": args.chunk_size,
                            "max_overlap_tokens": args.chunk_overlap,
                        }
                    },
                },
            )
            wait_for_operation(client, operation, args.poll_seconds)

    print("\nDone.")
    print(f"GEMINI_FILE_SEARCH_STORE_NAME={store_name}")
    print("\nSet this variable for Firebase Functions before running or deploying the app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
