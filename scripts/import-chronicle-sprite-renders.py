#!/usr/bin/env python3
"""Normalize Chronicle image-generation outputs into canonical sprite render jobs.

The Chronicle bundle contains full-resolution presentation images, not runtime
sprite sheets. This importer maps each original image back to its canonical
render job, extracts distinct transparent poses, fits them into declared cells,
and writes only candidates that satisfy the PNG/grid/alpha contract.

It never duplicates poses to fill missing frames. Underfilled generations are
reported as rejected and remain preserved in the Chronicle source directory.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, PngImagePlugin
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "docs" / "sprite-production" / "chronicle-images-2026-07-23"
DEFAULT_MANIFEST = ROOT / "docs" / "sprite-production" / "render-jobs" / "manifest.json"
DEFAULT_PREVIEW_ROOT = ROOT / "generated" / "chronicle-normalized"
DEFAULT_REPORT = ROOT / ".ws-bridge" / "render-sweep" / "chronicle-import.json"

# These six images lost their text sidecars during the Chronicle export. Their
# identities are recovered from Chronicle's conversation parent chain.
RECOVERED_JOB_IDS = {
    "033": "moss_remaining_animation_gaps__invoice_splitter",
    "046": "moss_remaining_animation_gaps__carry_idle",
    "058": "moss_remaining_animation_gaps__ledge_drop",
    "069": "enemy_vane_air_bailiff_state_extension__recover",
    "074": "enemy_vane_air_bailiff_state_extension__alert",
    "085": "enemy_turnstile_mite_state_extension__alert",
}

# The two early RGB-only results also lost sidecars. They are both attempts at
# the same stealth-exit job, recovered from the Chronicle parent chain.
RECOVERED_RGB_JOB_IDS = {
    "018": "moss_remaining_animation_gaps__stealth_exit",
    "019": "moss_remaining_animation_gaps__stealth_exit",
}


@dataclass(frozen=True)
class Component:
    label: int
    area: int
    bbox: tuple[int, int, int, int]
    center: tuple[float, float]


@dataclass(frozen=True)
class Candidate:
    source: Path
    sequence: str
    job_id: str
    mapping_source: str
    mode: str
    source_sha256: str


@dataclass
class Result:
    source: str
    sequence: str
    job_id: str
    output: str | None
    state: str
    mapping_source: str
    source_mode: str
    source_sha256: str
    declared_frames: int | None = None
    detected_poses: int | None = None
    selected_poses: list[int] | None = None
    output_sha256: str | None = None
    errors: list[str] | None = None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_manifest(path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        raise ValueError(f"invalid render-job manifest: {path}")
    return {job["id"]: job for job in jobs if isinstance(job, dict) and isinstance(job.get("id"), str)}


def parse_sidecar_job_id(path: Path) -> str | None:
    if not path.is_file():
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"(?:^|\s)job_id:\s*([^\s]+)", text, re.MULTILINE)
    return match.group(1).strip().strip("\"'") if match else None


def discover_candidates(source_root: Path) -> list[Candidate]:
    candidates: list[Candidate] = []
    for path in sorted(source_root.glob("*_sprite-render-job_*.png")):
        sequence = path.name.split("_", 1)[0]
        sidecar_id = parse_sidecar_job_id(path.with_suffix(".txt"))
        recovered_id = RECOVERED_JOB_IDS.get(sequence) or RECOVERED_RGB_JOB_IDS.get(sequence)
        job_id = sidecar_id or recovered_id
        if not job_id:
            continue
        with Image.open(path) as image:
            mode = image.mode
        candidates.append(
            Candidate(
                source=path,
                sequence=sequence,
                job_id=job_id,
                mapping_source="sidecar" if sidecar_id else "chronicle_parent_chain",
                mode=mode,
                source_sha256=sha256_file(path),
            )
        )
    return candidates


def remove_presentation_background(image: Image.Image) -> Image.Image:
    """Recover alpha from an RGB checkerboard/flat light presentation surface.

    Only low-saturation bright pixels connected to an image edge are removed.
    Interior light fur/highlights remain because they are not edge-connected.
    """

    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    candidate = (maximum >= 165) & ((maximum - minimum) <= 34)

    labels, count = ndimage.label(candidate)
    if count == 0:
        return image.convert("RGBA")
    border_labels = set(np.unique(labels[0, :]))
    border_labels.update(np.unique(labels[-1, :]))
    border_labels.update(np.unique(labels[:, 0]))
    border_labels.update(np.unique(labels[:, -1]))
    border_labels.discard(0)
    background = np.isin(labels, list(border_labels))

    rgba = np.dstack((rgb.astype(np.uint8), np.where(background, 0, 255).astype(np.uint8)))
    return Image.fromarray(rgba, "RGBA")


def prepare_source(path: Path) -> Image.Image:
    with Image.open(path) as opened:
        if "A" in opened.getbands():
            image = opened.convert("RGBA")
        else:
            image = remove_presentation_background(opened)
    alpha = image.getchannel("A").point(lambda value: 255 if value > 0 else 0)
    image.putalpha(alpha)
    return image


def connected_components(image: Image.Image) -> tuple[np.ndarray, list[Component]]:
    mask = np.asarray(image.getchannel("A")) > 0
    labels, _ = ndimage.label(mask)
    components: list[Component] = []
    for label, slices in enumerate(ndimage.find_objects(labels), start=1):
        if slices is None:
            continue
        y_slice, x_slice = slices
        area = int((labels[slices] == label).sum())
        if area < 12:
            continue
        bbox = (x_slice.start, y_slice.start, x_slice.stop, y_slice.stop)
        components.append(
            Component(
                label=label,
                area=area,
                bbox=bbox,
                center=((bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0),
            )
        )
    return labels, components


def detect_main_poses(components: list[Component]) -> list[Component]:
    if not components:
        return []
    max_area = max(component.area for component in components)
    minimum_area = max(1_200, int(max_area * 0.25))
    mains = [
        component
        for component in components
        if component.area >= minimum_area
        and component.bbox[2] - component.bbox[0] >= 40
        and component.bbox[3] - component.bbox[1] >= 40
    ]
    return mains


def cluster_row_major(components: list[Component], expected_rows: int) -> list[Component]:
    if not components:
        return []
    if expected_rows <= 1 or len(components) == 1:
        return sorted(components, key=lambda component: component.center[0])

    # Deterministic one-dimensional k-means for the common two-row sheets.
    row_count = min(expected_rows, len(components))
    values = np.asarray([component.center[1] for component in components], dtype=float)
    centers = np.linspace(values.min(), values.max(), row_count)
    assignments = np.zeros(len(values), dtype=int)
    for _ in range(32):
        distances = np.abs(values[:, None] - centers[None, :])
        new_assignments = distances.argmin(axis=1)
        new_centers = centers.copy()
        for row in range(row_count):
            members = values[new_assignments == row]
            if len(members):
                new_centers[row] = members.mean()
        if np.array_equal(new_assignments, assignments) and np.allclose(new_centers, centers):
            break
        assignments = new_assignments
        centers = new_centers

    ordered_rows = sorted(range(row_count), key=lambda row: centers[row])
    ordered: list[Component] = []
    for row in ordered_rows:
        members = [component for component, assignment in zip(components, assignments, strict=True) if assignment == row]
        ordered.extend(sorted(members, key=lambda component: component.center[0]))
    return ordered


def satellite_assignments(mains: list[Component], components: list[Component]) -> dict[int, set[int]]:
    assignments = {main.label: {main.label} for main in mains}
    if not mains:
        return assignments

    centers = np.asarray([main.center for main in mains], dtype=float)
    if len(mains) > 1:
        pairwise = np.linalg.norm(centers[:, None, :] - centers[None, :, :], axis=2)
        pairwise[pairwise == 0] = np.inf
        typical_spacing = float(np.median(pairwise.min(axis=1)))
    else:
        typical_spacing = float(max(mains[0].bbox[2] - mains[0].bbox[0], mains[0].bbox[3] - mains[0].bbox[1]))
    maximum_distance = max(80.0, typical_spacing * 0.58)

    main_labels = {main.label for main in mains}
    for component in components:
        if component.label in main_labels:
            continue
        distances = np.linalg.norm(centers - np.asarray(component.center), axis=1)
        nearest = int(distances.argmin())
        if float(distances[nearest]) <= maximum_distance:
            assignments[mains[nearest].label].add(component.label)
    return assignments


def pose_layer(
    image: Image.Image,
    labels: np.ndarray,
    labels_for_pose: set[int],
) -> Image.Image:
    source = np.asarray(image.convert("RGBA"), dtype=np.uint8)
    keep = np.isin(labels, list(labels_for_pose))
    layer = source.copy()
    layer[:, :, 3] = np.where(keep, source[:, :, 3], 0)
    result = Image.fromarray(layer, "RGBA")
    bbox = result.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("pose became empty during component isolation")
    return result.crop(bbox)


def fit_pose_to_cell(
    pose: Image.Image,
    cell_size: tuple[int, int],
    scale: float,
) -> Image.Image:
    cell_width, cell_height = cell_size
    max_width = max(1, cell_width - 4)
    max_height = max(1, cell_height - 5)
    width = max(1, min(max_width, round(pose.width * scale)))
    height = max(1, min(max_height, round(pose.height * scale)))
    resized = pose.resize((width, height), Image.Resampling.NEAREST)

    # Hard alpha and a deterministic compact palette.
    alpha = resized.getchannel("A").point(lambda value: 255 if value > 0 else 0)
    rgb = resized.convert("RGB").quantize(
        colors=128,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    rgb.putalpha(alpha)
    resized = rgb

    cell = Image.new("RGBA", cell_size, (0, 0, 0, 0))
    x = (cell_width - width) // 2
    anchor_y = cell_height - 3
    y = max(0, anchor_y - height)
    cell.alpha_composite(resized, (x, y))
    return cell


def normalize_candidate(
    candidate: Candidate,
    job: dict[str, Any],
) -> tuple[Image.Image, int, list[int]]:
    source = prepare_source(candidate.source)
    labels, components = connected_components(source)
    mains = cluster_row_major(detect_main_poses(components), int(job["grid"]["rows"]))
    frames = int(job["frames"])
    if len(mains) < frames:
        raise ValueError(f"detected {len(mains)} distinct poses, but job requires {frames}")

    selected = mains[:frames]
    assignments = satellite_assignments(mains, components)
    cell_size = tuple(int(value) for value in job["cell_size"])
    columns = int(job["grid"]["columns"])
    rows = int(job["grid"]["rows"])
    sheet = Image.new("RGBA", (columns * cell_size[0], rows * cell_size[1]), (0, 0, 0, 0))

    poses = [pose_layer(source, labels, assignments[main.label]) for main in selected]
    max_pose_width = max(pose.width for pose in poses)
    max_pose_height = max(pose.height for pose in poses)
    common_scale = min(
        max(1, cell_size[0] - 4) / max_pose_width,
        max(1, cell_size[1] - 5) / max_pose_height,
    )

    for index, pose in enumerate(poses):
        cell = fit_pose_to_cell(pose, cell_size, common_scale)
        x = (index % columns) * cell_size[0]
        y = (index // columns) * cell_size[1]
        sheet.alpha_composite(cell, (x, y))

    validate_sheet(sheet, job)
    selected_indices = [mains.index(main) + 1 for main in selected]
    return sheet, len(mains), selected_indices


def validate_sheet(sheet: Image.Image, job: dict[str, Any]) -> None:
    expected_size = tuple(int(value) for value in job["output_size"])
    if sheet.size != expected_size:
        raise ValueError(f"output size {sheet.size} != declared {expected_size}")
    if sheet.mode != "RGBA":
        raise ValueError(f"output mode {sheet.mode} != RGBA")

    alpha = sheet.getchannel("A")
    histogram = alpha.histogram()
    if any(histogram[1:255]):
        raise ValueError("output contains partial alpha")

    columns = int(job["grid"]["columns"])
    rows = int(job["grid"]["rows"])
    cell_width, cell_height = (int(value) for value in job["cell_size"])
    frames = int(job["frames"])
    for index in range(columns * rows):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        bbox = alpha.crop((x, y, x + cell_width, y + cell_height)).getbbox()
        if index < frames and bbox is None:
            raise ValueError(f"occupied cell {index + 1} is empty")
        if index >= frames and bbox is not None:
            raise ValueError(f"unused cell {index + 1} is not transparent")


def output_path_for(job: dict[str, Any], root: Path | None) -> Path:
    declared = Path(job["output"])
    return ROOT / declared if root is None else root / declared


def write_png(path: Path, image: Image.Image, candidate: Candidate, job: dict[str, Any], selected: list[int]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("chronicle_job_id", candidate.job_id)
    metadata.add_text("chronicle_source", candidate.source.relative_to(ROOT).as_posix())
    metadata.add_text("chronicle_source_sha256", candidate.source_sha256)
    metadata.add_text("chronicle_selected_poses", ",".join(str(index) for index in selected))
    metadata.add_text("render_output", str(job["output"]))
    image.save(path, format="PNG", optimize=True, pnginfo=metadata)
    return sha256_file(path)


def choose_candidates(candidates: list[Candidate]) -> list[Candidate]:
    """Prefer transparent originals and the earliest successful source per job."""

    by_job: dict[str, list[Candidate]] = {}
    for candidate in candidates:
        by_job.setdefault(candidate.job_id, []).append(candidate)
    selected: list[Candidate] = []
    for job_id, options in sorted(by_job.items()):
        ordered = sorted(
            options,
            key=lambda candidate: (
                0 if "A" in candidate.mode else 1,
                int(candidate.sequence),
                candidate.source.name,
            ),
        )
        selected.extend(ordered)
    return selected


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--job", action="append", default=[])
    parser.add_argument("--include-rgb", action="store_true", help="Attempt checkerboard-background RGB candidates.")
    parser.add_argument("--write", action="store_true", help="Write to declared renders/ output paths.")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--preview-root", type=Path, default=DEFAULT_PREVIEW_ROOT)
    parser.add_argument("--list", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_root = args.source.resolve()
    manifest = load_manifest(args.manifest.resolve())
    discovered = discover_candidates(source_root)
    candidates = choose_candidates(discovered)
    if args.job:
        wanted = set(args.job)
        candidates = [candidate for candidate in candidates if candidate.job_id in wanted]

    if args.list:
        rows = [
            {
                "sequence": candidate.sequence,
                "job_id": candidate.job_id,
                "mode": candidate.mode,
                "mapping_source": candidate.mapping_source,
                "source": candidate.source.relative_to(ROOT).as_posix(),
            }
            for candidate in candidates
        ]
        print(json.dumps(rows, indent=2))
        return 0

    results: list[Result] = []
    completed_jobs: set[str] = set()
    for candidate in candidates:
        job = manifest.get(candidate.job_id)
        if not job:
            results.append(
                Result(
                    source=candidate.source.relative_to(ROOT).as_posix(),
                    sequence=candidate.sequence,
                    job_id=candidate.job_id,
                    output=None,
                    state="unknown_job",
                    mapping_source=candidate.mapping_source,
                    source_mode=candidate.mode,
                    source_sha256=candidate.source_sha256,
                    errors=["job_id is not present in the canonical render manifest"],
                )
            )
            continue
        if candidate.job_id in completed_jobs:
            continue
        if "A" not in candidate.mode and not args.include_rgb:
            results.append(
                Result(
                    source=candidate.source.relative_to(ROOT).as_posix(),
                    sequence=candidate.sequence,
                    job_id=candidate.job_id,
                    output=str(job["output"]),
                    state="rgb_source_skipped",
                    mapping_source=candidate.mapping_source,
                    source_mode=candidate.mode,
                    source_sha256=candidate.source_sha256,
                    declared_frames=int(job["frames"]),
                    errors=["use --include-rgb to attempt checkerboard background recovery"],
                )
            )
            continue

        destination = output_path_for(job, None if args.write else args.preview_root.resolve())
        if args.write and destination.exists() and not args.overwrite:
            try:
                with Image.open(destination) as existing:
                    validate_sheet(existing.convert("RGBA"), job)
                completed_jobs.add(candidate.job_id)
                results.append(
                    Result(
                        source=candidate.source.relative_to(ROOT).as_posix(),
                        sequence=candidate.sequence,
                        job_id=candidate.job_id,
                        output=destination.relative_to(ROOT).as_posix(),
                        state="existing_valid",
                        mapping_source=candidate.mapping_source,
                        source_mode=candidate.mode,
                        source_sha256=candidate.source_sha256,
                        declared_frames=int(job["frames"]),
                        output_sha256=sha256_file(destination),
                    )
                )
                continue
            except Exception as exc:  # noqa: BLE001
                results.append(
                    Result(
                        source=candidate.source.relative_to(ROOT).as_posix(),
                        sequence=candidate.sequence,
                        job_id=candidate.job_id,
                        output=destination.relative_to(ROOT).as_posix(),
                        state="existing_invalid",
                        mapping_source=candidate.mapping_source,
                        source_mode=candidate.mode,
                        source_sha256=candidate.source_sha256,
                        declared_frames=int(job["frames"]),
                        errors=[str(exc), "rerun with --overwrite only after review"],
                    )
                )
                continue

        try:
            sheet, detected, selected = normalize_candidate(candidate, job)
            output_sha256 = write_png(destination, sheet, candidate, job, selected)
            completed_jobs.add(candidate.job_id)
            results.append(
                Result(
                    source=candidate.source.relative_to(ROOT).as_posix(),
                    sequence=candidate.sequence,
                    job_id=candidate.job_id,
                    output=(destination.relative_to(ROOT).as_posix() if destination.is_relative_to(ROOT) else str(destination)),
                    state="written" if args.write else "preview_written",
                    mapping_source=candidate.mapping_source,
                    source_mode=candidate.mode,
                    source_sha256=candidate.source_sha256,
                    declared_frames=int(job["frames"]),
                    detected_poses=detected,
                    selected_poses=selected,
                    output_sha256=output_sha256,
                )
            )
        except Exception as exc:  # noqa: BLE001 - report every rejected source
            results.append(
                Result(
                    source=candidate.source.relative_to(ROOT).as_posix(),
                    sequence=candidate.sequence,
                    job_id=candidate.job_id,
                    output=str(job["output"]),
                    state="rejected",
                    mapping_source=candidate.mapping_source,
                    source_mode=candidate.mode,
                    source_sha256=candidate.source_sha256,
                    declared_frames=int(job["frames"]),
                    errors=[str(exc)],
                )
            )

    counts: dict[str, int] = {}
    for result in results:
        counts[result.state] = counts.get(result.state, 0) + 1
    report = {
        "schema_version": 1,
        "source_directory": source_root.relative_to(ROOT).as_posix(),
        "write_mode": "declared_outputs" if args.write else "preview",
        "include_rgb": bool(args.include_rgb),
        "counts": counts,
        "results": [asdict(result) for result in results],
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"counts": counts, "report": str(args.report)}, indent=2))
    return 0 if not counts.get("unknown_job") else 2


if __name__ == "__main__":
    raise SystemExit(main())
