#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
ARCHIVE_NAME="Base44-Mail-Assistant.zip"
cd "$ROOT_DIR"
rm -f "$DIST_DIR/$ARCHIVE_NAME"
mkdir -p "$DIST_DIR"
zip -r "$DIST_DIR/$ARCHIVE_NAME" \
  manifest.json \
  background.js \
  icons \
  content \
  popup \
  options
printf "\nCreated %s/%s\n" "$DIST_DIR" "$ARCHIVE_NAME"
