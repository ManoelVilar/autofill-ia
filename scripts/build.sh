#!/usr/bin/env bash
# Gera dist/autofill-ia-<versão>.zip pronto para a Chrome Web Store / Edge Add-ons.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
mkdir -p dist
OUT="dist/autofill-ia-$VERSION.zip"
rm -f "$OUT"
(cd extension && zip -rq "../$OUT" . -x '.*')
echo "Pacote criado: $OUT"
