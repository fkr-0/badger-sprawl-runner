#!/usr/bin/env python3
"""Normalize mapped DALLE sprite boards into runtime-ready atlases.

The numbered source sheets are archival 4x4/6x6 presentation boards.  The game
manifest, however, expects exact animation rows, frame sizes, and transparent
backgrounds.  This importer is the single reproducible bridge between those two
representations.

By default it imports gameplay actors, bosses, characters, items, icons and VFX.
World tiles/parallax can be included explicitly with --categories world.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from PIL import Image, ImageEnhance, ImageStat
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "images_6a23c916_DALLE_-_Pixel_Art_Sprite_Sheet"
MAPPING_PATH = ROOT / "image_mapping.json"
MATCHING_PATH = ROOT / "matching.txt"
SOURCE_METADATA_PATH = SOURCE_DIR / "metadata.json"
MANIFEST_PATHS = [ROOT / "data/sprites.json", ROOT / "apps/runner/public/data/sprites.json"]
REPORT_DIR = ROOT / "generated/reports"
REVISION = "2026-07-19-dalle-import"
DEFAULT_CATEGORIES = {"bosses", "enemies", "characters", "items", "vfx"}


@dataclass(frozen=True)
class Metrics:
    width: int
    height: int
    bytes: int
    unique_colors: int
    opaque_fraction: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Build/report candidates without replacing runtime files")
    parser.add_argument("--force", action="store_true", help="Replace selected targets even when the existing atlas is larger")
    parser.add_argument(
        "--categories",
        default=",".join(sorted(DEFAULT_CATEGORIES)),
        help="Comma-separated categories: bosses,enemies,characters,items,vfx,world",
    )
    parser.add_argument("--only", default="", help="Comma-separated source numbers, filenames, manifest ids, or target stems")
    parser.add_argument("--report-only", action="store_true", help="Only write mapping/conflict reports")
    parser.add_argument("--preview-dir", default="", help="Optional directory for generated candidate PNGs")
    return parser.parse_args()


def source_number(name: str) -> int:
    match = re.match(r"(\d+)", name)
    if not match:
        raise ValueError(f"No numeric prefix in {name!r}")
    return int(match.group(1))


def locate_source(mapped_name: str) -> Path:
    exact = SOURCE_DIR / mapped_name
    if exact.exists():
        return exact
    number = source_number(mapped_name)
    candidates = sorted(SOURCE_DIR.glob(f"{number:03d}_*")) + sorted(SOURCE_DIR.glob(f"{number}.*"))
    candidates = [path for path in candidates if path.name != "metadata.json"]
    if not candidates:
        raise FileNotFoundError(f"No source image found for mapping {mapped_name}")
    return candidates[0]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_name(value: str) -> str:
    value = Path(value).stem.lower()
    value = re.sub(r"^(enemy|boss|character|item|world)_", "", value)
    value = value.replace("boss_", "")
    return re.sub(r"[^a-z0-9]+", "_", value).strip("_")


MANUAL_TARGET_ALIASES = {
    "boss_captain_grin": "assets/sprites/bosses/boss_captain_grin_tollmech.png",
    "boss_knife_drone_nest": "assets/sprites/bosses/boss_knife_drone_nest.png",
    "boss_madame_vitrine": "assets/sprites/bosses/boss_madame_vitrine_glasscourt.png",
    "boss_reflection_judge": "assets/sprites/bosses/boss_reflection_judge_court.png",
    "boss_director_vane": "assets/sprites/bosses/boss_director_vane_skylock.png",
    "char_dr_mina_suture": "assets/sprites/characters/dr_mina_suture.png",
    "char_juno_jar": "assets/sprites/characters/juno_jar.png",
    "char_lio": "assets/sprites/characters/lio.png",
    "char_little_ix": "assets/sprites/characters/little_ix.png",
    "char_mara_modulo": "assets/sprites/characters/mara_modulo.png",
    "char_black_ice_fox": "assets/sprites/characters/black_ice_fox.png",
    "char_king_feedback": "assets/sprites/characters/king_feedback.png",
    "char_madame_vitrine": "assets/sprites/characters/madame_vitrine.png",
    "char_reflection_judge": "assets/sprites/characters/reflection_judge.png",
    "char_elevator_angel": "assets/sprites/characters/elevator_angel.png",
    "char_director_vane": "assets/sprites/characters/director_vane.png",
    "char_command_lock_faction": "assets/sprites/characters/command_lock_faction.png",
    "enemy_clinic_repo": "assets/sprites/enemies/clinic_repo.png",
    "enemy_mirror_sentinel": "assets/sprites/enemies/mirror_sentinel.png",
    "enemy_feedback_guard": "assets/sprites/enemies/feedback_guard.png",
    "enemy_customs_lancer": "assets/sprites/enemies/customs_lancer.png",
    "enemy_vane_air_bailiff": "assets/sprites/enemies/vane_air_bailiff.png",
    "enemy_command_lock_partisan": "assets/sprites/enemies/command_lock_partisan.png",
    "parallax_lower_sprawl": "assets/sprites/worlds/lower_sprawl_parallax.png",
    "parallax_chrome_arcology": "assets/sprites/worlds/chrome_arcology_parallax.png",
    "parallax_straylight_mirage": "assets/sprites/worlds/straylight_mirage_parallax.png",
    "parallax_dub_colony": "assets/sprites/worlds/dub_colony_parallax.png",
    "parallax_orbital_lift": "assets/sprites/worlds/orbital_lift_parallax.png",
    "tiles_lower_sprawl": "assets/sprites/lower_sprawl_tiles.png",
    "tiles_chrome_arcology": "assets/sprites/worlds/chrome_arcology_tiles.png",
    "tiles_dub_colony": "assets/sprites/worlds/dub_colony_tiles.png",
    "tiles_orbital_lift": "assets/sprites/worlds/orbital_lift_tiles.png",
    "tiles_drainmarket": "assets/sprites/worlds/drainmarket_tiles.png",
    "items_pickups": "assets/sprites/items_extended.png",
    "items_icons": "assets/sprites/item_icons.png",
}


def parse_matching() -> list[dict[str, Any]]:
    """Parse the manually reviewed mappings in matching.txt.

    The left side is one or more source image numbers.  The prompt slug on the
    right is resolved through MANUAL_TARGET_ALIASES so the historical prompt
    numbering never leaks into runtime filenames.
    """
    result: list[dict[str, Any]] = []
    section = "unknown"
    for raw_line in MATCHING_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        heading = re.match(r"^(?:Unmatched|Reviewed)\s+(.+?)\s+Prompts$", line, re.IGNORECASE)
        if heading:
            section = heading.group(1).lower()
            continue
        match = re.match(r"^([\d,\s]+):\s*(?:\d+_)?([a-z0-9_]+)\s+—\s+(.+)$", line, re.IGNORECASE)
        if not match:
            continue
        numbers = [int(value) for value in re.findall(r"\d+", match.group(1))]
        slug = match.group(2).lower()
        target = MANUAL_TARGET_ALIASES.get(slug)
        for index, number in enumerate(numbers):
            # The pickup line groups several alternative DALLE boards. Import
            # the first board into the live atlas and retain the others in the
            # audit as alternates until the item roster gains distinct sheets.
            resolved_target = None if slug == "items_pickups" and index > 0 else target
            result.append(
                {
                    "number": number,
                    "section": section,
                    "slug": slug,
                    "description": match.group(3).strip(),
                    "target": resolved_target,
                }
            )
    return result


def resolved_matches(base_matches: dict[str, Any]) -> dict[str, Any]:
    """Merge automatic mappings with the manual unmatched-prompt ledger."""
    resolved = dict(base_matches)
    for entry in parse_matching():
        if not entry["target"]:
            continue
        source = locate_source(f"{entry['number']:03d}_unknown.png")
        key = source.name
        # One source may intentionally feed both a boss and a story portrait.
        # Preserve both by giving supplemental entries stable synthetic keys.
        if key in resolved and resolved[key]["target"] != entry["target"]:
            key = f"{source.stem}__{Path(entry['target']).stem}{source.suffix}"
        resolved[key] = {
            "target": entry["target"],
            "category": entry["section"],
            "confidence": "manual",
            "description": entry["description"],
            "sourceOverride": source.name,
            "mappingSource": "matching.txt",
        }
    # Correct two historical automatic guesses using the source descriptions.
    if "072_unknown.png" in resolved:
        resolved["072_unknown.png"]["target"] = "assets/sprites/vfx_combat.png"
    source_73 = locate_source("073_unknown.png")
    resolved[source_73.name] = {
        "target": "assets/sprites/item_icons_extended.png",
        "category": "items",
        "confidence": "metadata",
        "description": "Cyberpunk HUD asset pack grid",
        "sourceOverride": source_73.name,
        "mappingSource": "metadata.json",
    }
    return resolved


def source_metadata() -> dict[int, dict[str, Any]]:
    payload = load_json(SOURCE_METADATA_PATH)
    return {source_number(entry["filename"]): entry for entry in payload.get("images", [])}


def mapping_category(target: str) -> str:
    parts = Path(target).parts
    stem = Path(target).stem
    if "bosses" in parts:
        return "bosses"
    if "enemies" in parts:
        return "enemies"
    if "characters" in parts:
        return "characters"
    if "world" in parts or "worlds" in parts or stem.endswith(("_tiles", "_parallax")):
        return "world"
    if stem == "vfx_combat":
        return "vfx"
    return "items"


def build_conflict_report(base_matches: dict[str, Any], matches: dict[str, Any]) -> dict[str, Any]:
    manual = parse_matching()
    metadata = source_metadata()
    base_by_number: dict[int, list[str]] = {}
    for mapped_name, info in base_matches.items():
        base_by_number.setdefault(source_number(mapped_name), []).append(info["target"])

    supplemental: list[dict[str, Any]] = []
    conflicts: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    for item in manual:
        entry = {
            **item,
            "source": locate_source(f"{item['number']:03d}_unknown.png").name,
            "sourceDescription": metadata.get(item["number"], {}).get("alt", ""),
            "automaticTargets": base_by_number.get(item["number"], []),
        }
        if not item["target"]:
            unresolved.append(entry)
        elif entry["automaticTargets"] and item["target"] not in entry["automaticTargets"]:
            # This is usually intentional: one board supplies a boss atlas and a
            # dialogue portrait. Record it for review instead of discarding either.
            conflicts.append(entry)
        else:
            supplemental.append(entry)

    return {
        "canonicalSources": ["image_mapping.json", "matching.txt", str(SOURCE_METADATA_PATH.relative_to(ROOT))],
        "policy": "automatic mappings are retained; matching.txt adds manually reviewed targets and may intentionally reuse one source board",
        "automaticCount": len(base_matches),
        "resolvedCount": len(matches),
        "manualSupplemental": supplemental,
        "multiTargetSources": conflicts,
        "unresolvedManual": unresolved,
    }


def write_conflict_markdown(report: dict[str, Any]) -> None:
    lines = [
        "# DALLE sprite mapping audit",
        "",
        "`image_mapping.json` supplies the original automatic pass. `matching.txt` adds the manually reviewed unmatched prompts; embedded source metadata remains attached for provenance.",
        "",
        f"- Automatic mappings: **{report['automaticCount']}**",
        f"- Resolved mappings: **{report['resolvedCount']}**",
        f"- Manual supplemental mappings: **{len(report['manualSupplemental'])}**",
        f"- Intentional multi-target source boards: **{len(report['multiTargetSources'])}**",
        f"- Unresolved manual entries: **{len(report['unresolvedManual'])}**",
        "",
        "## Manual supplemental mappings",
        "",
        "| No. | prompt slug | runtime target | source description |",
        "|---:|---|---|---|",
    ]
    for item in report["manualSupplemental"] + report["multiTargetSources"]:
        description = item["sourceDescription"].replace("|", "\\|")
        lines.append(f"| {item['number']} | `{item['slug']}` | `{item['target']}` | {description} |")
    if report["unresolvedManual"]:
        lines.extend(["", "## Manual entries without a runtime target", ""])
        for item in report["unresolvedManual"]:
            lines.append(f"- {item['number']}: `{item['slug']}` — {item['description']}")
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / "dalle-sprite-mapping-audit.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def sheet_dimensions(sheet: dict[str, Any]) -> tuple[int, int]:
    frame_w, frame_h = sheet["frameSize"]
    if sheet.get("grid"):
        return sheet["grid"]["columns"] * frame_w, sheet["grid"]["rows"] * frame_h
    max_frames = max(animation["frames"] for animation in sheet["animations"].values())
    return max_frames * frame_w, len(sheet["animations"]) * frame_h


def split_grid(image: Image.Image, columns: int, rows: int, inset_fraction: float = 0.015) -> list[Image.Image]:
    cells: list[Image.Image] = []
    for row in range(rows):
        y0 = round(row * image.height / rows)
        y1 = round((row + 1) * image.height / rows)
        for column in range(columns):
            x0 = round(column * image.width / columns)
            x1 = round((column + 1) * image.width / columns)
            inset_x = max(1, round((x1 - x0) * inset_fraction))
            inset_y = max(1, round((y1 - y0) * inset_fraction))
            cells.append(image.crop((x0 + inset_x, y0 + inset_y, x1 - inset_x, y1 - inset_y)))
    return cells


def border_background_color(array: np.ndarray) -> np.ndarray:
    border = np.concatenate(
        [array[:6, :, :3].reshape(-1, 3), array[-6:, :, :3].reshape(-1, 3), array[:, :6, :3].reshape(-1, 3), array[:, -6:, :3].reshape(-1, 3)],
        axis=0,
    )
    return np.median(border, axis=0)


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int32)
    background = border_background_color(rgba).astype(np.int32)
    distance = np.sqrt(np.sum((rgb - background) ** 2, axis=2))
    brightness = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    candidate = (distance < 52) | ((brightness > 232) & (chroma < 24))
    seeds = np.zeros(candidate.shape, dtype=bool)
    seeds[0, :] = candidate[0, :]
    seeds[-1, :] = candidate[-1, :]
    seeds[:, 0] = candidate[:, 0]
    seeds[:, -1] = candidate[:, -1]
    connected = ndimage.binary_propagation(seeds, mask=candidate)
    rgba[connected, 3] = 0

    alpha = rgba[:, :, 3]
    # Drop isolated dust while retaining deliberate small effects.
    labels, count = ndimage.label(alpha > 0)
    if count:
        sizes = np.bincount(labels.ravel())
        minimum = max(8, int(alpha.size * 0.00008))
        remove = sizes < minimum
        remove[0] = False
        rgba[remove[labels], 3] = 0
    return Image.fromarray(rgba, "RGBA")


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    left, top, right, bottom = bbox
    pad_x = max(1, round((right - left) * 0.03))
    pad_y = max(1, round((bottom - top) * 0.03))
    return image.crop((max(0, left - pad_x), max(0, top - pad_y), min(image.width, right + pad_x), min(image.height, bottom + pad_y)))


def fit_frame(image: Image.Image, frame_size: tuple[int, int], *, align: str, fill: float) -> Image.Image:
    frame_w, frame_h = frame_size
    image = trim_alpha(image)
    if image.width <= 1 or image.height <= 1:
        return Image.new("RGBA", frame_size, (0, 0, 0, 0))
    max_w = max(1, round(frame_w * fill))
    max_h = max(1, round(frame_h * fill))
    scale = min(max_w / image.width, max_h / image.height)
    new_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(new_size, Image.Resampling.LANCZOS)
    resized = ImageEnhance.Sharpness(resized).enhance(1.2)
    frame = Image.new("RGBA", frame_size, (0, 0, 0, 0))
    x = (frame_w - resized.width) // 2
    if align == "bottom":
        y = max(0, frame_h - resized.height - max(1, frame_h // 24))
    else:
        y = (frame_h - resized.height) // 2
    frame.alpha_composite(resized, (x, y))
    return frame


def source_grid_for(category: str, target: str) -> tuple[int, int]:
    if category == "world" and "parallax" in target:
        return 3, 1
    if category == "world":
        return 6, 6
    return 4, 4


def semantic_row(category: str, animation_name: str) -> int:
    name = animation_name.lower()
    if category == "vfx":
        if any(token in name for token in ("claw", "katana")):
            return 0
        if "rail" in name:
            return 1
        if any(token in name for token in ("emp", "rocket")):
            return 2
        return 3
    if category == "items":
        if any(token in name for token in ("pickup", "collect")):
            return 1
        if any(token in name for token in ("equip", "active", "held")):
            return 2
        if any(token in name for token in ("use", "consume", "overheat", "empty", "break")):
            return 3
        return 0
    if category == "characters":
        if any(token in name for token in ("talk", "dialog")):
            return 1
        if any(token in name for token in ("assist", "hack", "attack", "cast")):
            return 2
        if any(token in name for token in ("react", "exit", "hurt", "defeat", "death")):
            return 3
        return 0
    if any(token in name for token in ("patrol", "move", "walk", "run", "dash", "charge", "chase")):
        return 1
    if any(token in name for token in ("windup", "attack", "shoot", "strike", "pulse", "lance", "signature", "phase")):
        return 2
    if any(token in name for token in ("hurt", "stun", "parried", "death", "defeat", "recover", "down")):
        return 3
    return 0


def frame_sequence(row: int, count: int) -> list[int]:
    ping_pong = [0, 1, 2, 3, 2, 1]
    return [row * 4 + ping_pong[index % len(ping_pong)] for index in range(count)]


def normalized_cells(source: Image.Image, category: str, target: str) -> list[Image.Image]:
    columns, rows = source_grid_for(category, target)
    cells = split_grid(source, columns, rows, inset_fraction=0.012 if category != "world" else 0.006)
    if category == "world":
        return [cell.convert("RGBA") for cell in cells]
    return [remove_connected_background(cell) for cell in cells]


def build_atlas(source: Image.Image, sheet: dict[str, Any], category: str, target: str) -> Image.Image:
    frame_w, frame_h = sheet["frameSize"]
    target_width, target_height = sheet_dimensions(sheet)
    atlas = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
    cells = normalized_cells(source, category, target)

    if category == "world" and "parallax" in target:
        for index in range(min(3, len(cells))):
            panel = cells[index].resize((frame_w, frame_h), Image.Resampling.LANCZOS)
            atlas.alpha_composite(panel, (index * frame_w, 0))
        return atlas

    if sheet.get("grid"):
        columns = sheet["grid"]["columns"]
        rows = sheet["grid"]["rows"]
        for index in range(columns * rows):
            cell = cells[index % len(cells)]
            if category == "world":
                frame = cell.resize((frame_w, frame_h), Image.Resampling.LANCZOS)
            else:
                frame = fit_frame(cell, (frame_w, frame_h), align="center", fill=0.86)
            atlas.alpha_composite(frame, ((index % columns) * frame_w, (index // columns) * frame_h))
        return atlas

    if category == "world":
        # Environment boards are 6x6 material/prop studies rather than actor
        # pose grids. Preserve one semantic source row per declared runtime
        # animation and use adjacent cells as animation frames. This avoids the
        # old actor-oriented 4-column indexing that silently sampled unrelated
        # props from the board.
        source_columns, source_rows = source_grid_for(category, target)
        for row_index, (_animation_name, animation) in enumerate(sheet["animations"].items()):
            source_row = row_index % source_rows
            for frame_index in range(animation["frames"]):
                source_column = frame_index % source_columns
                source_index = source_row * source_columns + source_column
                cell = cells[source_index % len(cells)]
                frame = cell.resize((frame_w, frame_h), Image.Resampling.LANCZOS)
                atlas.alpha_composite(frame, (frame_index * frame_w, row_index * frame_h))
        return atlas

    align = "bottom" if category in {"bosses", "enemies", "characters"} else "center"
    fill = 0.92 if category == "bosses" else 0.86
    for row_index, (animation_name, animation) in enumerate(sheet["animations"].items()):
        row = semantic_row(category, animation_name)
        for frame_index, source_index in enumerate(frame_sequence(row, animation["frames"])):
            cell = cells[source_index % len(cells)]
            frame = fit_frame(cell, (frame_w, frame_h), align=align, fill=fill)
            atlas.alpha_composite(frame, (frame_index * frame_w, row_index * frame_h))
    return atlas


def metrics(image: Image.Image, png_bytes: int = 0) -> Metrics:
    rgba = image.convert("RGBA")
    colors = rgba.getcolors(maxcolors=5_000_000)
    alpha = np.asarray(rgba.getchannel("A"), dtype=np.uint8)
    return Metrics(
        width=rgba.width,
        height=rgba.height,
        bytes=png_bytes,
        unique_colors=len(colors) if colors is not None else 5_000_001,
        opaque_fraction=float(np.count_nonzero(alpha)) / float(alpha.size),
    )


def existing_metrics(path: Path) -> Metrics | None:
    if not path.exists():
        return None
    image = Image.open(path).convert("RGBA")
    return metrics(image, path.stat().st_size)


def serialize_metrics(value: Metrics | None) -> dict[str, Any] | None:
    return None if value is None else value.__dict__


def should_replace(existing: Metrics | None, candidate: Metrics, force: bool) -> tuple[bool, str]:
    if existing is None:
        return True, "missing target"
    if force:
        return True, "forced"
    if existing.width != candidate.width or existing.height != candidate.height:
        return True, "dimension repair"
    richer = candidate.unique_colors >= max(24, int(existing.unique_colors * 1.12))
    substantial = candidate.bytes >= max(8_000, int(existing.bytes * 1.08))
    if richer and substantial:
        return True, "candidate is materially richer"
    return False, "existing atlas retained by quality gate"


def selected(entry: dict[str, Any], source_name: str, sheet: dict[str, Any], categories: set[str], only: set[str]) -> bool:
    category = mapping_category(entry["target"])
    if category not in categories:
        return False
    if not only:
        return True
    number = str(source_number(source_name))
    values = {number, source_name, sheet["id"], Path(entry["target"]).stem}
    return bool(values & only)


def main() -> int:
    args = parse_args()
    mapping_payload = load_json(MAPPING_PATH)
    base_matches: dict[str, Any] = mapping_payload["matches"]
    matches = resolved_matches(base_matches)
    manifests = [load_json(path) for path in MANIFEST_PATHS]
    manifest_by_file = {sheet["file"]: sheet for sheet in manifests[0]["spriteSheets"]}
    metadata = source_metadata()

    conflict_report = build_conflict_report(base_matches, matches)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REPORT_DIR / "dalle-sprite-mapping-audit.json", conflict_report)
    write_conflict_markdown(conflict_report)
    if args.report_only:
        print(
            "mapping audit: "
            f"{len(conflict_report['multiTargetSources'])} intentional multi-target sources; "
            f"{len(conflict_report['unresolvedManual'])} unresolved manual entries"
        )
        return 0

    categories = {item.strip() for item in args.categories.split(",") if item.strip()}
    only = {item.strip() for item in args.only.split(",") if item.strip()}
    preview_dir = Path(args.preview_dir).resolve() if args.preview_dir else None
    if preview_dir:
        preview_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    imported_files: set[str] = set()
    for mapped_name, entry in matches.items():
        target = entry["target"]
        sheet = manifest_by_file.get(target)
        if not sheet:
            results.append({"source": mapped_name, "target": target, "action": "skip", "reason": "target absent from manifest"})
            continue
        if not selected(entry, mapped_name, sheet, categories, only):
            continue
        source_path = locate_source(entry.get("sourceOverride", mapped_name))
        source_image = Image.open(source_path).convert("RGBA")
        category = mapping_category(target)
        atlas = build_atlas(source_image, sheet, category, target)
        expected = sheet_dimensions(sheet)
        if atlas.size != expected:
            raise AssertionError(f"{sheet['id']}: built {atlas.size}, expected {expected}")
        temporary = REPORT_DIR / ".candidate.png"
        atlas.save(temporary, format="PNG", optimize=True)
        candidate_metrics = metrics(atlas, temporary.stat().st_size)
        temporary.unlink(missing_ok=True)
        target_path = ROOT / target
        current_metrics = existing_metrics(target_path)
        replace, reason = should_replace(current_metrics, candidate_metrics, args.force)
        if candidate_metrics.opaque_fraction < 0.005:
            replace, reason = False, "candidate is effectively empty"

        result = {
            "source": str(source_path.relative_to(ROOT)),
            "sourceNumber": source_number(source_path.name),
            "target": target,
            "manifestId": sheet["id"],
            "category": category,
            "confidence": entry.get("confidence", "unknown"),
            "existing": serialize_metrics(current_metrics),
            "candidate": serialize_metrics(candidate_metrics),
            "action": "import" if replace and not args.dry_run else ("would-import" if replace else "retain"),
            "reason": reason,
        }
        results.append(result)
        if preview_dir:
            atlas.save(preview_dir / f"{sheet['id']}.png", optimize=True)
        if not replace or args.dry_run:
            continue

        target_path.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(target_path, format="PNG", optimize=True)
        public_path = ROOT / "apps/runner/public" / target
        public_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target_path, public_path)
        imported_files.add(target)

        source_entry = {
            "tool": "OpenAI DALL-E",
            "sourceSheet": str(source_path.relative_to(ROOT)),
            "mapping": entry.get("mappingSource", "image_mapping.json"),
            "importer": "scripts/import-dalle-sprites.py",
            "revision": REVISION,
            "description": entry.get("description")
            or metadata.get(source_number(source_path.name), {}).get("alt", ""),
        }
        for manifest in manifests:
            manifest_sheet = next(item for item in manifest["spriteSheets"] if item["file"] == target)
            manifest_sheet["source"] = source_entry

    if imported_files and not args.dry_run:
        for path, manifest in zip(MANIFEST_PATHS, manifests, strict=True):
            write_json(path, manifest)

    summary = {
        "revision": REVISION,
        "dryRun": args.dry_run,
        "categories": sorted(categories),
        "selected": len(results),
        "imported": sum(item["action"] == "import" for item in results),
        "wouldImport": sum(item["action"] == "would-import" for item in results),
        "retained": sum(item["action"] == "retain" for item in results),
        "intentionalMultiTargetSources": len(conflict_report["multiTargetSources"]),
        "unresolvedManualEntries": len(conflict_report["unresolvedManual"]),
        "mappingConflicts": len(conflict_report["unresolvedManual"]),
        "results": results,
    }
    write_json(REPORT_DIR / "dalle-sprite-import.json", summary)
    print(
        f"DALLE sprites: selected={summary['selected']} imported={summary['imported']} "
        f"wouldImport={summary['wouldImport']} retained={summary['retained']} "
        f"intentionalMultiTarget={summary['intentionalMultiTargetSources']} "
        f"conflicts={summary['mappingConflicts']}"
    )
    for item in results:
        print(f"{item['action']:12} {item.get('manifestId', '-'):42} {item['reason']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
