#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Historical name retained for callers. Raw copies are no longer safe because the
# DALLE boards do not match the runtime frame grids. The Python importer crops,
# removes connected board backgrounds, packs semantic animation rows, mirrors
# source/public targets, updates manifest provenance, and writes an audit report.
exec python3 "$ROOT/scripts/import-dalle-sprites.py" "$@"
