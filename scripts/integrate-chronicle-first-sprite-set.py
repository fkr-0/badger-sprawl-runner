#!/usr/bin/env python3
"""Promote the first 2026-07-23 Chronicle render set into a runtime extension atlas."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAME_SIZE = (48, 48)
SOURCE_GRID_COLUMNS = 4
ATLAS_GRID_COLUMNS = 8
SHEET_ID = "moss_remaining_animation_gaps"
ATLAS_RELATIVE_PATH = Path("assets/sprites/player-expansion/moss_remaining_animation_gaps.png")
SOURCE_MANIFEST = Path("data/sprites.json")
PUBLIC_MANIFEST = Path("apps/runner/public/data/sprites.json")
PUBLIC_ATLAS = Path("apps/runner/public") / ATLAS_RELATIVE_PATH
BATCH_REVISION = "2026-07-23-chronicle-first-set"

BODY_HURTBOX = [{"x": 12, "y": 6, "w": 24, "h": 40, "label": "body"}]
ANCHOR = [24, 44]


@dataclass(frozen=True)
class AnimationJob:
    name: str
    source: Path
    frames: int
    fps: int
    tags: tuple[str, ...]


JOBS = (
    AnimationJob(
        name="air_dodge",
        source=Path(
            "docs/sprite-production/accepted-renders/"
            "moss_remaining_animation_gaps/air_dodge_4c_2r.png"
        ),
        frames=6,
        fps=18,
        tags=("airborne", "evasion", "player_expansion"),
    ),
    AnimationJob(
        name="railgun_reload_failure",
        source=Path(
            "docs/sprite-production/accepted-renders/"
            "moss_remaining_animation_gaps/railgun_reload_failure_4c_2r.png"
        ),
        frames=6,
        fps=14,
        tags=("combat", "ranged", "reload", "failure", "player_expansion"),
    ),
    AnimationJob(
        name="railgun_charge",
        source=Path(
            "docs/sprite-production/accepted-renders/"
            "moss_remaining_animation_gaps/railgun_charge_4c_2r.png"
        ),
        frames=6,
        fps=12,
        tags=("combat", "ranged", "charge", "player_expansion"),
    ),
)


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_rgba(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"missing sprite render: {path}")
    with Image.open(path) as image:
        return image.convert("RGBA")


def validate_source(job: AnimationJob, image: Image.Image) -> None:
    frame_width, frame_height = FRAME_SIZE
    if image.width % frame_width or image.height % frame_height:
        raise ValueError(
            f"{job.source} is not aligned to {frame_width}x{frame_height} cells: "
            f"{image.size}"
        )
    source_columns = image.width // frame_width
    source_rows = image.height // frame_height
    if source_columns != SOURCE_GRID_COLUMNS or source_rows < 2:
        raise ValueError(
            f"{job.source} must be a {SOURCE_GRID_COLUMNS}x2-or-larger source grid, got "
            f"{source_columns}x{source_rows}"
        )
    if job.frames > source_columns * source_rows:
        raise ValueError(f"{job.source} does not contain {job.frames} source cells")

    alpha = image.getchannel("A")
    alpha_histogram = alpha.histogram()
    if any(alpha_histogram[1:255]):
        raise ValueError(f"{job.source} contains partial alpha values")

    for cell_index in range(job.frames, source_columns * source_rows):
        source_x = (cell_index % source_columns) * frame_width
        source_y = (cell_index // source_columns) * frame_height
        cell_alpha = alpha.crop(
            (source_x, source_y, source_x + frame_width, source_y + frame_height)
        )
        if cell_alpha.getbbox() is not None:
            raise ValueError(
                f"{job.source} cell {cell_index + 1} must remain fully transparent"
            )


def build_atlas() -> Image.Image:
    frame_width, frame_height = FRAME_SIZE
    atlas = Image.new(
        "RGBA",
        (ATLAS_GRID_COLUMNS * frame_width, len(JOBS) * frame_height),
        (0, 0, 0, 0),
    )
    for destination_row, job in enumerate(JOBS):
        source = load_rgba(ROOT / job.source)
        validate_source(job, source)
        for frame_index in range(job.frames):
            source_x = (frame_index % SOURCE_GRID_COLUMNS) * frame_width
            source_y = (frame_index // SOURCE_GRID_COLUMNS) * frame_height
            frame = source.crop(
                (source_x, source_y, source_x + frame_width, source_y + frame_height)
            )
            atlas.alpha_composite(
                frame,
                (frame_index * frame_width, destination_row * frame_height),
            )
    return atlas


def animation_definition(job: AnimationJob, row: int) -> dict[str, Any]:
    row_start = row * ATLAS_GRID_COLUMNS
    return {
        "frames": job.frames,
        "fps": job.fps,
        "order": list(range(row_start, row_start + job.frames)),
        "loop": False,
        "hurtboxes": BODY_HURTBOX,
        "anchor": ANCHOR,
        "tags": list(job.tags),
    }


def sheet_definition() -> dict[str, Any]:
    return {
        "id": SHEET_ID,
        "file": ATLAS_RELATIVE_PATH.as_posix(),
        "frameSize": list(FRAME_SIZE),
        "grid": {"columns": ATLAS_GRID_COLUMNS, "rows": len(JOBS)},
        "role": "player_runtime_extension",
        "animations": {
            job.name: animation_definition(job, row) for row, job in enumerate(JOBS)
        },
        "source": {
            "tool": "Chronicle render promotion",
            "revision": BATCH_REVISION,
            "sourceDirectory": "docs/sprite-production/accepted-renders/"
            "moss_remaining_animation_gaps",
            "receipt": "docs/sprite-production/accepted-renders/"
            "moss_remaining_animation_gaps/receipt.yml",
            "note": (
                "First operator-approved Moss gap batch: air dodge, railgun reload "
                "failure, and railgun charge."
            ),
        },
    }


def load_manifest(path: Path) -> dict[str, Any]:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(manifest.get("sheets"), list):
        raise ValueError(f"invalid sprite manifest: {path}")
    return manifest


def upsert_sheet(manifest: dict[str, Any]) -> dict[str, Any]:
    sheets = manifest["sheets"]
    definition = sheet_definition()
    existing_index = next(
        (index for index, sheet in enumerate(sheets) if sheet.get("id") == SHEET_ID),
        None,
    )
    if existing_index is not None:
        sheets[existing_index] = definition
        return manifest

    production_index = next(
        (
            index
            for index, sheet in enumerate(sheets)
            if sheet.get("id") == "moss_badger_production"
        ),
        None,
    )
    insert_at = len(sheets) if production_index is None else production_index + 1
    sheets.insert(insert_at, definition)
    return manifest


def manifest_bytes(manifest: dict[str, Any]) -> bytes:
    return (json.dumps(manifest, indent=2) + "\n").encode("utf-8")


def atlas_png_bytes(image: Image.Image) -> bytes:
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=False)
    return output.getvalue()


def verify_file(path: Path, expected: bytes, label: str) -> list[str]:
    if not path.is_file():
        return [f"missing {label}: {path.relative_to(ROOT)}"]
    actual = path.read_bytes()
    if actual != expected:
        return [
            f"stale {label}: {path.relative_to(ROOT)} "
            f"({sha256_bytes(actual)} != {sha256_bytes(expected)})"
        ]
    return []


def check_outputs(atlas: Image.Image, manifest: dict[str, Any]) -> list[str]:
    expected_atlas = atlas_png_bytes(atlas)
    expected_manifest = manifest_bytes(manifest)
    errors: list[str] = []
    errors.extend(verify_file(ROOT / ATLAS_RELATIVE_PATH, expected_atlas, "source atlas"))
    errors.extend(verify_file(ROOT / PUBLIC_ATLAS, expected_atlas, "public atlas"))
    errors.extend(verify_file(ROOT / SOURCE_MANIFEST, expected_manifest, "source manifest"))
    errors.extend(verify_file(ROOT / PUBLIC_MANIFEST, expected_manifest, "public manifest"))
    return errors


def write_outputs(atlas: Image.Image, manifest: dict[str, Any]) -> None:
    atlas_path = ROOT / ATLAS_RELATIVE_PATH
    public_atlas_path = ROOT / PUBLIC_ATLAS
    atlas_path.parent.mkdir(parents=True, exist_ok=True)
    public_atlas_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(atlas_path, format="PNG", optimize=False)
    shutil.copyfile(atlas_path, public_atlas_path)

    payload = manifest_bytes(manifest)
    (ROOT / SOURCE_MANIFEST).write_bytes(payload)
    (ROOT / PUBLIC_MANIFEST).write_bytes(payload)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate that the runtime atlas and manifests match the promoted batch",
    )
    args = parser.parse_args()

    atlas = build_atlas()
    manifest = upsert_sheet(load_manifest(ROOT / SOURCE_MANIFEST))

    if args.check:
        errors = check_outputs(atlas, manifest)
        if errors:
            for error in errors:
                print(error, file=sys.stderr)
            return 1
        print(
            f"Chronicle first sprite set is integrated: {SHEET_ID} "
            f"({atlas.width}x{atlas.height}, {len(JOBS)} animations)"
        )
        return 0

    write_outputs(atlas, manifest)
    print(
        f"Integrated {len(JOBS)} animations into {ATLAS_RELATIVE_PATH.as_posix()} "
        f"({atlas.width}x{atlas.height}, sha256={sha256_file(ROOT / ATLAS_RELATIVE_PATH)})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
