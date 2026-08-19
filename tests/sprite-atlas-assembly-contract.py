#!/usr/bin/env python3
"""Validate machine-readable atlas plans and exercise the safe assembler end to end."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "docs" / "sprite-production" / "prompt-index.yml"
MANIFEST_PATH = ROOT / "data" / "sprites.json"
ASSEMBLER = ROOT / "scripts" / "assemble-sprite-atlas.py"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def png_size(path: Path) -> tuple[int, int] | None:
    try:
        header = path.read_bytes()[:24]
    except FileNotFoundError:
        return None
    if len(header) < 24 or header[:8] != PNG_SIGNATURE:
        return None
    return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")


def validate_current_index() -> dict[str, int]:
    index = yaml.safe_load(INDEX_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    sheets = {sheet["id"]: sheet for sheet in manifest["sheets"]}
    entries = index["current"]
    placement_total = 0
    job_total = 0

    for entry in entries:
        sheet_id = entry["sheet_id"]
        require(sheet_id in sheets, f"Prompt index references unknown sheet: {sheet_id}")
        sheet = sheets[sheet_id]
        jobs = {job["id"]: job for job in entry["jobs"]}
        require(len(jobs) == len(entry["jobs"]), f"Duplicate job ids: {sheet_id}")
        assembly = entry["assembly"]
        require(not assembly["destination_conflicts"], f"Destination conflicts: {sheet_id}")
        atlas_width, atlas_height = assembly["atlas_size"]
        require(
            png_size(ROOT / entry["target_atlas"]) == (atlas_width, atlas_height),
            f"Target atlas dimensions differ from assembly plan: {sheet_id}",
        )
        expected_frames = sum(animation["frames"] for animation in sheet["animations"].values())
        require(
            len(assembly["placements"]) == expected_frames,
            f"Placement count differs from animation frame count: {sheet_id}",
        )
        destinations: set[tuple[int, int]] = set()
        for placement in assembly["placements"]:
            job_id = placement["job_id"]
            require(job_id in jobs, f"Unknown placement job {job_id}: {sheet_id}")
            source_x, source_y, source_width, source_height = placement["source_rect"]
            destination_x, destination_y, destination_width, destination_height = placement[
                "destination_rect"
            ]
            job_width, job_height = jobs[job_id]["output_size"]
            require(
                source_x + source_width <= job_width and source_y + source_height <= job_height,
                f"Source rect outside render output: {sheet_id}:{job_id}",
            )
            require(
                destination_x + destination_width <= atlas_width
                and destination_y + destination_height <= atlas_height,
                f"Destination rect outside atlas: {sheet_id}:{job_id}",
            )
            destination_cell = tuple(placement["destination_cell"])
            require(
                destination_cell not in destinations,
                f"Duplicate destination cell without conflict metadata: {sheet_id}:{destination_cell}",
            )
            destinations.add(destination_cell)
        require(
            len(destinations) == assembly["used_destination_cells"],
            f"used_destination_cells mismatch: {sheet_id}",
        )
        placement_total += len(assembly["placements"])
        job_total += len(jobs)

    return {"entries": len(entries), "jobs": job_total, "placements": placement_total}


def synthetic_index() -> dict:
    return {
        "schema_version": 1,
        "current": [
            {
                "sheet_id": "synthetic",
                "target_atlas": "assets/sprites/synthetic.png",
                "jobs": [
                    {
                        "id": "synthetic__frames",
                        "output": "renders/synthetic/frames.png",
                        "output_size": [4, 2],
                    }
                ],
                "assembly": {
                    "mode": "animation_rows",
                    "frame_size": [2, 2],
                    "grid": {"columns": 2, "rows": 1},
                    "atlas_size": [4, 2],
                    "frame_capacity": 2,
                    "used_destination_cells": 2,
                    "unused_destination_cells": 0,
                    "destination_conflicts": [],
                    "placements": [
                        {
                            "job_id": "synthetic__frames",
                            "render_output": "renders/synthetic/frames.png",
                            "animation": "idle",
                            "local_frame": 0,
                            "absolute_frame": 0,
                            "source_cell": [1, 0],
                            "source_rect": [2, 0, 2, 2],
                            "destination_cell": [0, 0],
                            "destination_rect": [0, 0, 2, 2],
                        },
                        {
                            "job_id": "synthetic__frames",
                            "render_output": "renders/synthetic/frames.png",
                            "animation": "idle",
                            "local_frame": 1,
                            "absolute_frame": 1,
                            "source_cell": [0, 0],
                            "source_rect": [0, 0, 2, 2],
                            "destination_cell": [1, 0],
                            "destination_rect": [2, 0, 2, 2],
                        },
                    ],
                },
            }
        ],
    }


def run_synthetic_assembly() -> None:
    with tempfile.TemporaryDirectory(prefix="sprite-atlas-contract-") as temporary:
        temp = Path(temporary)
        index_path = temp / "prompt-index.yml"
        index_path.write_text(yaml.safe_dump(synthetic_index(), sort_keys=False), encoding="utf-8")
        render_path = temp / "renders" / "synthetic" / "frames.png"
        render_path.parent.mkdir(parents=True)
        source = Image.new("RGBA", (4, 2), (0, 0, 0, 0))
        source.paste((255, 0, 0, 255), (0, 0, 2, 2))
        source.paste((0, 255, 0, 255), (2, 0, 4, 2))
        source.save(render_path)
        output = temp / "assembled.png"

        completed = subprocess.run(
            [
                "python3",
                str(ASSEMBLER),
                "synthetic",
                "--index",
                str(index_path),
                "--renders-root",
                str(temp),
                "--output",
                str(output),
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        require(completed.returncode == 0, completed.stderr or completed.stdout)
        summary = json.loads(completed.stdout)
        require(summary["complete"] is True, "Synthetic assembly was not complete")
        require(output.exists(), "Synthetic atlas was not written")
        with Image.open(output) as atlas:
            atlas = atlas.convert("RGBA")
            require(atlas.size == (4, 2), f"Unexpected synthetic atlas size: {atlas.size}")
            require(atlas.getpixel((0, 0)) == (0, 255, 0, 255), "First cell was not remapped")
            require(atlas.getpixel((3, 0)) == (255, 0, 0, 255), "Second cell was not remapped")

        refused = subprocess.run(
            [
                "python3",
                str(ASSEMBLER),
                "synthetic",
                "--index",
                str(index_path),
                "--renders-root",
                str(temp),
                "--output",
                str(output),
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        require(refused.returncode != 0, "Assembler overwrote an existing atlas without --overwrite")
        require("--overwrite" in refused.stderr, "Overwrite refusal did not explain the safety gate")

        target_refused = subprocess.run(
            [
                "python3",
                str(ASSEMBLER),
                "synthetic",
                "--index",
                str(index_path),
                "--renders-root",
                str(temp),
                "--write-target",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        require(
            target_refused.returncode != 0,
            "Assembler accepted --write-target without the --overwrite safety gate",
        )
        require(
            "--write-target requires" in target_refused.stderr,
            "Production-target refusal did not explain the double safety gate",
        )

        render_path.unlink()
        missing = subprocess.run(
            [
                "python3",
                str(ASSEMBLER),
                "synthetic",
                "--index",
                str(index_path),
                "--renders-root",
                str(temp),
                "--verify-only",
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        require(missing.returncode != 0, "Missing render output was accepted without --allow-missing")
        require("Missing 1 render output" in missing.stderr, "Missing render error was not actionable")


if __name__ == "__main__":
    stats = validate_current_index()
    run_synthetic_assembly()
    print(
        "badger-sprawl-runner sprite atlas assembly contracts ok "
        f"({stats['entries']} entries, {stats['jobs']} jobs, {stats['placements']} placements)"
    )
