#!/usr/bin/env bash
# Compile figure sources in assets/img/dag-src/ to assets/img/. Run: make figs
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/img/dag-src
OUT=assets/img
DRAWIO=/Applications/draw.io.app/Contents/MacOS/draw.io
FLOW_PNG="$HOME/Library/CloudStorage/GoogleDrive-edimah.synesius-songo@proton.me/Mon Drive/secret-loyalties-flow.png"

fail() { echo "build-figs: FAILED on $1" >&2; exit 1; }

for tool in latex dvisvgm; do
  command -v "$tool" >/dev/null || fail "missing tool '$tool' (install BasicTeX: brew install --cask basictex)"
done

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for tex in "$SRC"/*.tex; do
  name=$(basename "$tex" .tex)
  # latex writes .aux/.log/.dvi into $TMP, so nothing is left in the repo.
  latex -interaction=nonstopmode -halt-on-error -output-directory="$TMP" "$tex" >"$TMP/$name.out" 2>&1 \
    || { tail -20 "$TMP/$name.out" >&2; fail "$tex (latex)"; }
  dvisvgm --no-fonts --exact-bbox -o "$OUT/$name.svg" "$TMP/$name.dvi" >"$TMP/$name.dvisvgm" 2>&1 \
    || { cat "$TMP/$name.dvisvgm" >&2; fail "$tex (dvisvgm)"; }
  echo "built $OUT/$name.svg"
done

for drawio in "$SRC"/*.drawio; do
  name=$(basename "$drawio" .drawio)
  if [ -x "$DRAWIO" ]; then
    "$DRAWIO" --export --format svg --embed-svg-fonts false --border 10 -o "$OUT/$name.svg" "$drawio" >/dev/null 2>&1 \
      || fail "$drawio (draw.io export)"
    echo "built $OUT/$name.svg"
  else
    echo "build-figs: draw.io not installed, copying the PNG export for $name instead" >&2
    cp "$FLOW_PNG" "$OUT/$name.png" || fail "$FLOW_PNG (copy)"
  fi
done
