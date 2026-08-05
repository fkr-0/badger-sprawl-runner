#!/usr/bin/env python3
"""Safely assemble checked render jobs into a Badger Sprawl Runner sprite atlas.

The prompt index supplies exact source and destination rectangles. By default the
assembled PNG is written below generated/sprite-atlases; production assets are
only touched through the explicit --write-target --overwrite combination.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INDEX = ROOT / "docs" / "sprite-production" / "prompt-index.yml"
DEFAULT_OUTPUT_ROOT = ROOT / "generated" / "sprite-atlases"


class AssemblyError(RuntimeError):
    """Raised when render inputs do not satisfy the generated assembly contract."""


def resolve_path(value: str | Path, base: Path = ROOT) -> Path:
    path = Path(value).expanduser()
    return path if path.is_absolute() else base / path


def load_prompt_index(path: Path) -> dict[str, Any]:
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise AssemblyError(f"Prompt index does not exist: {path}") from error
    except yaml.YAMLError as error:
        raise AssemblyError(f"Prompt index is not valid YAML: {path}: {error}") from error
    if not isinstance(data, dict) or not isinstance(data.get("current"), list):
        raise AssemblyError(f"Prompt index is missing a current entries list: {path}")
    return data


def current_entry(index: dict[str, Any], sheet_id: str) -> dict[str, Any]:
    for entry in index["current"]:
        if isinstance(entry, dict) and entry.get("sheet_id") == sheet_id:
            if not isinstance(entry.get("assembly"), dict):
                raise AssemblyError(f"Current entry has no assembly plan: {sheet_id}")
            return entry
    raise AssemblyError(f"Unknown current sprite sheet: {sheet_id}")


def current_sheet_ids(index: dict[str, Any]) -> list[str]:
    return sorted(
        str(entry["sheet_id"])
        for entry in index["current"]
        if isinstance(entry, dict) and isinstance(entry.get("sheet_id"), str)
    )


def integer_pair(value: Any, label: str) -> tuple[int, int]:
    if (
        not isinstance(value, list)
        or len(value) != 2
        or not all(isinstance(item, int) and item > 0 for item in value)
    ):
        raise AssemblyError(f"{label} must contain two positive integers")
    return value[0], value[1]


def rectangle(value: Any, label: str) -> tuple[int, int, int, int]:
    if (
        not isinstance(value, list)
        or len(value) != 4
        or not all(isinstance(item, int) for item in value)
        or value[0] < 0
        or value[1] < 0
        or value[2] <= 0
        or value[3] <= 0
    ):
        raise AssemblyError(f"{label} must be [x, y, width, height] with positive size")
    return value[0], value[1], value[2], value[3]


def validate_rect_bounds(
    rect: tuple[int, int, int, int],
    bounds: tuple[int, int],
    label: str,
) -> None:
    x, y, width, height = rect
    bound_width, bound_height = bounds
    if x + width > bound_width or y + height > bound_height:
        raise AssemblyError(
            f"{label} {rect} exceeds image bounds {bound_width}x{bound_height}"
        )


def output_path_for(
    entry: dict[str, Any],
    sheet_id: str,
    explicit_output: str | None,
    write_target: bool,
) -> Path:
    if explicit_output and write_target:
        raise AssemblyError("Use either --output or --write-target, not both")
    if write_target:
        target = entry.get("target_atlas")
        if not isinstance(target, str) or not target:
            raise AssemblyError(f"Entry has no target_atlas: {sheet_id}")
        return resolve_path(target)
    if explicit_output:
        return resolve_path(explicit_output)
    return DEFAULT_OUTPUT_ROOT / f"{sheet_id}.png"


def render_jobs_by_id(entry: dict[str, Any]) -> dict[str, dict[str, Any]]:
    jobs = entry.get("jobs")
    if not isinstance(jobs, list):
        raise AssemblyError(f"Entry has no jobs list: {entry.get('sheet_id', '<unknown>')}")
    result: dict[str, dict[str, Any]] = {}
    for job in jobs:
        if not isinstance(job, dict) or not isinstance(job.get("id"), str):
            raise AssemblyError("Every render job must be an object with a string id")
        if job["id"] in result:
            raise AssemblyError(f"Duplicate render job id: {job['id']}")
        result[job["id"]] = job
    return result


def prepare_sources(
    entry: dict[str, Any],
    renders_root: Path,
    allow_missing: bool,
) -> tuple[dict[str, Image.Image], list[str]]:
    jobs = render_jobs_by_id(entry)
    images: dict[str, Image.Image] = {}
    missing: list[str] = []
    for job_id, job in jobs.items():
        output = job.get("output")
        if not isinstance(output, str) or not output:
            raise AssemblyError(f"Render job has no output path: {job_id}")
        expected_size = integer_pair(job.get("output_size"), f"{job_id}.output_size")
        source_path = resolve_path(output, renders_root)
        if not source_path.exists():
            missing.append(output)
            continue
        try:
            with Image.open(source_path) as source:
                source.load()
                if source.size != expected_size:
                    raise AssemblyError(
                        f"Render output size mismatch for {job_id}: "
                        f"expected {expected_size[0]}x{expected_size[1]}, "
                        f"got {source.width}x{source.height}: {source_path}"
                    )
                images[job_id] = source.convert("RGBA")
        except AssemblyError:
            raise
        except Exception as error:
            raise AssemblyError(f"Unable to read render output {source_path}: {error}") from error

    if missing and not allow_missing:
        sample = "\n".join(f"- {path}" for path in missing[:20])
        suffix = f"\n- ... and {len(missing) - 20} more" if len(missing) > 20 else ""
        raise AssemblyError(f"Missing {len(missing)} render output(s):\n{sample}{suffix}")
    return images, missing


def assemble_entry(
    entry: dict[str, Any],
    renders_root: Path,
    allow_missing: bool = False,
) -> tuple[Image.Image, dict[str, Any]]:
    sheet_id = str(entry.get("sheet_id", "<unknown>"))
    assembly = entry["assembly"]
    atlas_size = integer_pair(assembly.get("atlas_size"), f"{sheet_id}.assembly.atlas_size")
    frame_size = integer_pair(assembly.get("frame_size"), f"{sheet_id}.assembly.frame_size")
    conflicts = assembly.get("destination_conflicts")
    if conflicts:
        raise AssemblyError(
            f"Assembly plan contains {len(conflicts)} destination conflict(s): {sheet_id}"
        )
    placements = assembly.get("placements")
    if not isinstance(placements, list) or not placements:
        raise AssemblyError(f"Assembly plan has no placements: {sheet_id}")

    sources, missing = prepare_sources(entry, renders_root, allow_missing)
    atlas = Image.new("RGBA", atlas_size, (0, 0, 0, 0))
    destination_pixels: dict[tuple[int, int, int, int], bytes] = {}
    copied = 0
    skipped = 0

    for index, placement in enumerate(placements):
        if not isinstance(placement, dict):
            raise AssemblyError(f"Placement {index} is not an object: {sheet_id}")
        job_id = placement.get("job_id")
        if not isinstance(job_id, str):
            raise AssemblyError(f"Placement {index} has no job_id: {sheet_id}")
        source = sources.get(job_id)
        if source is None:
            skipped += 1
            continue
        source_rect = rectangle(
            placement.get("source_rect"), f"{sheet_id}.placement[{index}].source_rect"
        )
        destination_rect = rectangle(
            placement.get("destination_rect"),
            f"{sheet_id}.placement[{index}].destination_rect",
        )
        validate_rect_bounds(source_rect, source.size, f"{job_id} source_rect")
        validate_rect_bounds(destination_rect, atlas_size, f"{job_id} destination_rect")
        if source_rect[2:] != frame_size or destination_rect[2:] != frame_size:
            raise AssemblyError(
                f"Placement frame size mismatch for {job_id}: "
                f"source={source_rect[2:]}, destination={destination_rect[2:]}, "
                f"contract={frame_size}"
            )
        crop = source.crop(
            (
                source_rect[0],
                source_rect[1],
                source_rect[0] + source_rect[2],
                source_rect[1] + source_rect[3],
            )
        )
        prior = destination_pixels.get(destination_rect)
        pixels = crop.tobytes()
        if prior is not None and prior != pixels:
            raise AssemblyError(
                f"Conflicting pixels target destination rect {destination_rect}: {sheet_id}"
            )
        destination_pixels[destination_rect] = pixels
        atlas.paste(crop, destination_rect[:2])
        copied += 1

    summary = {
        "sheet_id": sheet_id,
        "target_atlas": entry.get("target_atlas"),
        "atlas_size": list(atlas_size),
        "frame_size": list(frame_size),
        "placements": len(placements),
        "copied_placements": copied,
        "skipped_placements": skipped,
        "render_jobs_loaded": len(sources),
        "missing_render_outputs": missing,
        "complete": not missing and skipped == 0,
    }
    return atlas, summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sheet_id", nargs="?", help="Current manifest sheet id to assemble")
    parser.add_argument("--index", default=str(DEFAULT_INDEX), help="Prompt index YAML")
    parser.add_argument(
        "--renders-root",
        default=str(ROOT),
        help="Directory used to resolve render_output paths from the prompt index",
    )
    parser.add_argument("--output", help="Explicit safe output path")
    parser.add_argument(
        "--write-target",
        action="store_true",
        help="Write to the production target_atlas path; requires --overwrite when it exists",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow replacing an existing output file",
    )
    parser.add_argument(
        "--allow-missing",
        action="store_true",
        help="Create a partial atlas with transparent cells for missing render jobs",
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Validate inputs and assembly without writing an atlas",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all current sheet ids in the prompt index",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        index_path = resolve_path(args.index)
        index = load_prompt_index(index_path)
        if args.list:
            print("\n".join(current_sheet_ids(index)))
            return 0
        if not args.sheet_id:
            raise AssemblyError("sheet_id is required unless --list is used")
        entry = current_entry(index, args.sheet_id)
        if args.write_target and not args.overwrite:
            raise AssemblyError("--write-target requires the explicit --overwrite safety gate")
        renders_root = resolve_path(args.renders_root)
        atlas, summary = assemble_entry(entry, renders_root, args.allow_missing)
        output = output_path_for(entry, args.sheet_id, args.output, args.write_target)
        summary["output"] = str(output)
        summary["verify_only"] = bool(args.verify_only)
        if not args.verify_only:
            if output.exists() and not args.overwrite:
                raise AssemblyError(
                    f"Output already exists; pass --overwrite to replace it: {output}"
                )
            output.parent.mkdir(parents=True, exist_ok=True)
            atlas.save(output, format="PNG", optimize=False)
        print(json.dumps(summary, indent=2))
        return 0
    except AssemblyError as error:
        print(f"sprite atlas assembly failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
