#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BIN="${NOTEPUB_BIN:-notepub}"
CFG="${NOTEPUB_CONFIG:-./.np/config.yaml}"
RULES="${NOTEPUB_RULES:-./.np/rules.yaml}"
ART="./.notepub/artifacts"
OUT="./.np/dist"
CONTENT_DIR="./content"

if [[ -z "${NOTEPUB_BIN:-}" && -x "./.np/bin/notepub" ]]; then
  BIN="./.np/bin/notepub"
fi

BASE_URL="$(awk -F'"' '/base_url:/ {print $2; exit}' "$CFG")"
BASE_URL="${BASE_URL%/}"

if ! command -v "$BIN" >/dev/null 2>&1; then
  echo "notepub binary not found: $BIN"
  echo "Set NOTEPUB_BIN, for example:"
  echo "  NOTEPUB_BIN=/path/to/notepub $0"
  exit 1
fi

if [[ -d "$CONTENT_DIR" && -f "./.np/scripts/normalize-obsidian-embeds.sh" ]]; then
  echo "[0/5] normalize obsidian embeds"
  chmod +x ./.np/scripts/normalize-obsidian-embeds.sh
  ./.np/scripts/normalize-obsidian-embeds.sh "$CONTENT_DIR"
fi

echo "[1/5] index/build"
"$BIN" index --config "$CFG" --rules "$RULES"
"$BIN" build --config "$CFG" --rules "$RULES" --artifacts "$ART" --dist "$OUT"

echo "[2/5] export content media"
if [[ -d "$CONTENT_DIR" ]]; then
  rm -rf "$OUT/media"
  mkdir -p "$OUT/media"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --prune-empty-dirs \
      --exclude '.git/' \
      --exclude '.github/' \
      --exclude '.obsidian/' \
      --exclude '*.md' \
      "$CONTENT_DIR"/ "$OUT/media/"
  else
    find "$CONTENT_DIR" -type f ! -name '*.md' -print0 | while IFS= read -r -d '' f; do
      rel="${f#$CONTENT_DIR/}"
      mkdir -p "$OUT/media/$(dirname "$rel")"
      cp "$f" "$OUT/media/$rel"
    done
  fi
fi

echo "[3/5] copy llms files"
if [[ -f "$OUT/assets/llms.txt" ]]; then
  cp "$OUT/assets/llms.txt" "$OUT/llms.txt"
fi
if [[ -f "$OUT/assets/llms-full.txt" ]]; then
  cp "$OUT/assets/llms-full.txt" "$OUT/llms-full.txt"
fi

echo "[4/5] normalize robots"
if [[ -f "$OUT/robots.txt" ]]; then
  awk '!/^LLM: /' "$OUT/robots.txt" > "$OUT/robots.txt.tmp"
  cat "$OUT/robots.txt.tmp" > "$OUT/robots.txt"
  rm -f "$OUT/robots.txt.tmp"
fi

echo "[5/5] done -> $OUT"
