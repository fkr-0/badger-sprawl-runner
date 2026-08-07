#!/usr/bin/env python3
"""Contract tests for the resumable AUTOMATIC1111 sprite render client."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "render-sprite-jobs-a1111.py"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def write_job(
    path: Path,
    *,
    job_id: str,
    scope: str,
    category: str,
    output_image: str,
    frames: int,
    columns: int,
    rows: int,
    cell_width: int,
    cell_height: int,
    prompt: str,
) -> None:
    output_width = columns * cell_width
    output_height = rows * cell_height
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "---",
                f"job_id: {job_id}",
                f"scope: {scope}",
                f"category: {category}",
                f"output_image: {output_image}",
                f"frames: {frames}",
                "grid:",
                f"  columns: {columns}",
                f"  rows: {rows}",
                "cell_size:",
                f"- {cell_width}",
                f"- {cell_height}",
                "output_size:",
                f"- {output_width}",
                f"- {output_height}",
                "---",
                "",
                f"# `{job_id}`",
                "",
                "The preface text must not be sent to the renderer.",
                "",
                "## Prompt",
                "",
                "```text",
                prompt,
                "```",
                "",
                "## Acceptance",
                "",
                "Ignored.",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


def make_png(
    path: Path,
    *,
    size: tuple[int, int],
    occupied_cells: list[int],
    columns: int,
    rows: int,
    cell_width: int,
    cell_height: int,
    prompt: str = "prompt",
    seed: int = 123,
) -> None:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    for cell_index in occupied_cells:
        x0 = (cell_index % columns) * cell_width
        y0 = (cell_index // columns) * cell_height
        for x in range(x0 + 2, x0 + cell_width - 2):
            for y in range(y0 + 2, y0 + cell_height - 2):
                image.putpixel((x, y), (255, 0, 0, 255))
    info = PngImagePlugin.PngInfo()
    info.add_text("job_id", path.stem)
    info.add_text("a1111_seed", str(seed))
    info.add_text("a1111_prompt", prompt)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, pnginfo=info)


def run(*args: str, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--render-scale", "1", "--model", "", "--no-rembg", *args],
        cwd=str(cwd or ROOT),
        check=False,
        capture_output=True,
        text=True,
    )


def test_list_and_filters() -> None:
    with tempfile.TemporaryDirectory(prefix="a1111-contract-list-") as temporary:
        temp = Path(temporary)
        jobs_root = temp / "jobs"
        renders_root = temp / "renders"
        write_job(
            jobs_root / "current" / "bosses" / "alpha" / "alpha.md",
            job_id="alpha",
            scope="current",
            category="bosses",
            output_image="renders/alpha.png",
            frames=3,
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
            prompt="PROMPT ALPHA",
        )
        write_job(
            jobs_root / "expansion" / "portraits" / "bravo" / "bravo.md",
            job_id="bravo",
            scope="expansion",
            category="portraits",
            output_image="renders/bravo.png",
            frames=1,
            columns=1,
            rows=1,
            cell_width=32,
            cell_height=32,
            prompt="PROMPT BRAVO",
        )

        listed = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--list",
            "--scope",
            "current",
            "--category",
            "bosses",
            "--limit",
            "1",
        )
        require(listed.returncode == 0, listed.stderr)
        payload = json.loads(listed.stdout)
        require(payload["selected_count"] == 1, f"Unexpected selected count: {payload}")
        require(payload["jobs"][0]["job_id"] == "alpha", f"Wrong job filtered: {payload}")

        exact = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--list",
            "--job",
            "bravo",
        )
        require(exact.returncode == 0, exact.stderr)
        exact_payload = json.loads(exact.stdout)
        require(exact_payload["jobs"][0]["job_id"] == "bravo", f"Wrong job selection: {exact_payload}")


def test_dry_run_extracts_only_prompt_block() -> None:
    with tempfile.TemporaryDirectory(prefix="a1111-contract-dry-") as temporary:
        temp = Path(temporary)
        jobs_root = temp / "jobs"
        renders_root = temp / "renders"
        prompt = "ONLY THIS PROMPT BLOCK SHOULD PASS THROUGH"
        write_job(
            jobs_root / "current" / "bosses" / "alpha" / "alpha.md",
            job_id="alpha",
            scope="current",
            category="bosses",
            output_image="renders/alpha.png",
            frames=3,
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
            prompt=prompt,
        )

        completed = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--dry-run",
            "--job",
            "alpha",
        )
        require(completed.returncode == 0, completed.stderr)
        payload = json.loads(completed.stdout)
        require(payload["jobs"][0]["prompt"] == prompt, f"Prompt mismatch: {payload}")
        require(
            "preface text" not in payload["jobs"][0]["prompt"].lower(),
            "Dry run leaked content outside the Prompt block",
        )


def test_resume_skips_existing_valid_render() -> None:
    with tempfile.TemporaryDirectory(prefix="a1111-contract-resume-") as temporary:
        temp = Path(temporary)
        jobs_root = temp / "jobs"
        renders_root = temp / "renders-root"
        write_job(
            jobs_root / "current" / "bosses" / "alpha" / "alpha.md",
            job_id="alpha",
            scope="current",
            category="bosses",
            output_image="renders/alpha.png",
            frames=3,
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
            prompt="PROMPT ALPHA",
        )
        make_png(
            renders_root / "renders" / "alpha.png",
            size=(32, 32),
            occupied_cells=[0, 1, 2],
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
        )

        completed = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--resume",
            "--job",
            "alpha",
        )
        require(completed.returncode == 0, completed.stderr)
        payload = json.loads(completed.stdout)
        require(payload["jobs"][0]["status"] == "skipped_existing", f"Resume did not skip: {payload}")


def test_render_retries_and_writes_atomic_png() -> None:
    with tempfile.TemporaryDirectory(prefix="a1111-contract-render-") as temporary:
        temp = Path(temporary)
        jobs_root = temp / "jobs"
        renders_root = temp / "renders-root"
        mock_plan = temp / "a1111-mock.json"
        write_job(
            jobs_root / "current" / "bosses" / "alpha" / "alpha.md",
            job_id="alpha",
            scope="current",
            category="bosses",
            output_image="renders/alpha.png",
            frames=3,
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
            prompt="PROMPT ALPHA",
        )
        mock_plan.write_text(
            json.dumps(
                {
                    "attempts": [
                        {"error": "synthetic retry"},
                        {
                            "seed": 777,
                            "size": [32, 32],
                            "painted_cells": [0, 1, 2],
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )
        completed = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--job",
            "alpha",
            "--api-url",
            f"mock://{mock_plan}",
        )
        require(completed.returncode == 0, completed.stderr)
        payload = json.loads(completed.stdout)
        require(payload["jobs"][0]["status"] == "rendered", f"Render did not complete: {payload}")
        require(payload["jobs"][0]["attempts"] == 2, f"Retry count wrong: {payload}")
        output_path = renders_root / "renders" / "alpha.png"
        require(output_path.exists(), "Rendered PNG missing")
        require(not any(output_path.parent.glob("*.tmp")), "Atomic save temp file leaked")
        with Image.open(output_path) as image:
            require(image.size == (32, 32), f"Wrong output dimensions: {image.size}")
            require(image.getbbox() is not None, "Rendered image is fully transparent")
            info = image.info
        require(info.get("a1111_seed") == "777", f"Seed metadata missing: {info}")
        require(info.get("a1111_prompt") == "PROMPT ALPHA", f"Prompt metadata missing: {info}")


def test_validator_rejects_bad_dimensions_and_empty_occupied_cells() -> None:
    with tempfile.TemporaryDirectory(prefix="a1111-contract-invalid-") as temporary:
        temp = Path(temporary)
        jobs_root = temp / "jobs"
        renders_root = temp / "renders-root"
        write_job(
            jobs_root / "current" / "bosses" / "alpha" / "alpha.md",
            job_id="alpha",
            scope="current",
            category="bosses",
            output_image="renders/alpha.png",
            frames=3,
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
            prompt="PROMPT ALPHA",
        )

        wrong_size = renders_root / "renders" / "alpha.png"
        make_png(
            wrong_size,
            size=(31, 32),
            occupied_cells=[0, 1, 2],
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
        )
        wrong = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--resume",
            "--job",
            "alpha",
        )
        require(wrong.returncode != 0, "Resume accepted a wrong-size PNG")
        require("dimension" in wrong.stderr.lower(), f"Wrong failure message: {wrong.stderr}")

        wrong_size.unlink()
        make_png(
            wrong_size,
            size=(32, 32),
            occupied_cells=[0, 2],
            columns=2,
            rows=2,
            cell_width=16,
            cell_height=16,
        )
        empty = run(
            "--jobs-root",
            str(jobs_root),
            "--renders-root",
            str(renders_root),
            "--resume",
            "--job",
            "alpha",
        )
        require(empty.returncode != 0, "Resume accepted an empty occupied frame")
        require("occupied" in empty.stderr.lower(), f"Wrong failure message: {empty.stderr}")


def main() -> None:
    test_list_and_filters()
    test_dry_run_extracts_only_prompt_block()
    test_resume_skips_existing_valid_render()
    test_render_retries_and_writes_atomic_png()
    test_validator_rejects_bad_dimensions_and_empty_occupied_cells()
    print("sprite-render-a1111-contract: ok")


if __name__ == "__main__":
    main()
