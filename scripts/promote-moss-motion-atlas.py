#!/usr/bin/env python3
"""Promote the authored Moss motion atlas to the production runtime contract.

The repository already carries a 17-row, multi-frame 48px motion atlas generated from
`assets/sprites/source/moss_badger_motion_master_v2.png`. This script keeps the stable
`moss_badger_production` sheet id and URL while replacing its old eight-frame preview
with the complete runtime atlas and animation metadata.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "sprites.json"
PUBLIC_DATA = ROOT / "apps" / "runner" / "public" / "data" / "sprites.json"
SOURCE_ATLAS = ROOT / "assets" / "sprites" / "moss_badger_v2.png"
PRODUCTION_ATLAS = ROOT / "assets" / "sprites" / "moss_badger_production.png"
PUBLIC_PRODUCTION_ATLAS = (
    ROOT / "apps" / "runner" / "public" / "assets" / "sprites" / "moss_badger_production.png"
)


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text())


def promote_manifest(data: dict) -> None:
    sheets = data["spriteSheets"]
    authored = next(sheet for sheet in sheets if sheet["id"] == "moss_badger")
    production = next(sheet for sheet in sheets if sheet["id"] == "moss_badger_production")

    production.clear()
    production.update(
        {
            "id": "moss_badger_production",
            "file": "assets/sprites/moss_badger_production.png",
            "frameSize": list(authored["frameSize"]),
            "role": "player_runtime",
            "animations": authored["animations"],
            "source": {
                "tool": "authored motion-master promotion",
                "sourceSheet": "assets/sprites/source/moss_badger_motion_master_v2.png",
                "runtimeAtlas": "assets/sprites/moss_badger_v2.png",
                "note": "Complete 17-row production atlas with authored locomotion, combat, interaction, reaction, and story poses.",
            },
        }
    )


def main() -> None:
    if not SOURCE_ATLAS.exists():
        raise SystemExit(f"missing authored Moss atlas: {SOURCE_ATLAS}")

    PRODUCTION_ATLAS.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_PRODUCTION_ATLAS.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_ATLAS, PRODUCTION_ATLAS)
    shutil.copy2(SOURCE_ATLAS, PUBLIC_PRODUCTION_ATLAS)

    data = load_manifest(DATA)
    promote_manifest(data)
    DATA.write_text(json.dumps(data, indent="\t") + "\n")
    PUBLIC_DATA.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DATA, PUBLIC_DATA)

    print("promoted Moss motion atlas to moss_badger_production")


if __name__ == "__main__":
    main()
