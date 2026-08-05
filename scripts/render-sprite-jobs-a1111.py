#!/usr/bin/env python3
"""Render canonical sprite jobs through the local AUTOMATIC1111 API."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import tempfile
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

import yaml
from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JOBS_ROOT = ROOT / "docs" / "sprite-production" / "render-jobs"
DEFAULT_RENDERS_ROOT = ROOT
DEFAULT_API_URL = "http://127.0.0.1:7860"
DEFAULT_RETRIES = 3
RETRY_DELAY_SECONDS = 1.0
DEFAULT_MODEL = "vectorArt_vectorArtBeta.safetensors"
DEFAULT_NEGATIVE_PROMPT = (
    "photorealistic, anti-aliased, blurry, smooth gradients, text, logo, watermark, "
    "frame labels, borders, checkerboard background, busy background, merged cells"
)


class RenderError(RuntimeError):
    """Raised when a render job cannot complete safely."""


@dataclass(frozen=True)
class Job:
    markdown_path: Path
    relative_markdown_path: str
    scope: str
    category: str
    job_id: str
    output_image: str
    frames: int
    columns: int
    rows: int
    cell_width: int
    cell_height: int
    output_width: int
    output_height: int
    prompt: str

    @property
    def frame_capacity(self) -> int:
        return self.columns * self.rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs-root", type=Path, default=DEFAULT_JOBS_ROOT)
    parser.add_argument("--renders-root", type=Path, default=DEFAULT_RENDERS_ROOT)
    parser.add_argument("--api-url", default=DEFAULT_API_URL)
    parser.add_argument("--list", action="store_true", help="List selected jobs as JSON.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--category", default=None)
    parser.add_argument("--scope", default=None)
    parser.add_argument("--job", default=None, help="Filter by exact job_id.")
    parser.add_argument("--dry-run", action="store_true", help="Resolve jobs without calling the API.")
    parser.add_argument("--resume", action="store_true", help="Skip jobs with an existing valid PNG.")
    parser.add_argument("--steps", type=int, default=24)
    parser.add_argument("--cfg-scale", type=float, default=5.5)
    parser.add_argument("--sampler-name", default="DPM++ 2M")
    parser.add_argument("--scheduler", default="karras")
    parser.add_argument("--seed-base", type=int, default=420024)
    parser.add_argument("--render-scale", type=int, choices=(1, 2, 3, 4), default=2)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--negative-prompt", default=DEFAULT_NEGATIVE_PROMPT)
    parser.add_argument("--rembg-model", default="u2net")
    parser.add_argument("--no-rembg", action="store_true")
    parser.add_argument("--alpha-threshold", type=int, default=128)
    parser.add_argument("--palette-colors", type=int, default=32)
    parser.add_argument("--tiling", choices=("auto", "on", "off"), default="auto")
    parser.add_argument("--raw-root", type=Path, default=ROOT / "renders-raw" / "a1111")
    return parser.parse_args()


def extract_frontmatter(text: str, source: Path) -> tuple[dict[str, Any], str]:
    if not text.startswith("---\n"):
        raise RenderError(f"{source} is missing YAML frontmatter")
    try:
        _, payload, remainder = text.split("---\n", 2)
    except ValueError as exc:
        raise RenderError(f"{source} has malformed YAML frontmatter") from exc
    metadata = yaml.safe_load(payload) or {}
    if not isinstance(metadata, dict):
        raise RenderError(f"{source} frontmatter must decode to a mapping")
    return metadata, remainder


def extract_prompt_block(body: str, source: Path) -> str:
    marker = "## Prompt"
    start = body.find(marker)
    if start < 0:
        raise RenderError(f"{source} is missing the Prompt section")
    fence_start = body.find("```", start)
    if fence_start < 0:
        raise RenderError(f"{source} Prompt section is missing an opening code fence")
    newline = body.find("\n", fence_start)
    if newline < 0:
        raise RenderError(f"{source} Prompt section opening fence is malformed")
    fence_end = body.find("\n```", newline + 1)
    if fence_end < 0:
        raise RenderError(f"{source} Prompt section is missing a closing code fence")
    prompt = body[newline + 1 : fence_end].strip()
    if not prompt:
        raise RenderError(f"{source} Prompt block is empty")
    return prompt


def parse_job(path: Path, jobs_root: Path) -> Job:
    metadata, body = extract_frontmatter(path.read_text(encoding="utf-8"), path)
    required = ["scope", "category", "job_id", "output_image", "frames", "grid", "cell_size", "output_size"]
    missing = [field for field in required if field not in metadata]
    if missing:
        raise RenderError(f"{path} is missing required fields: {', '.join(missing)}")
    grid = metadata["grid"] or {}
    cell_size = metadata["cell_size"] or []
    output_size = metadata["output_size"] or []
    columns = int(grid["columns"])
    rows = int(grid["rows"])
    if len(cell_size) != 2 or len(output_size) != 2:
        raise RenderError(f"{path} must declare two-value cell_size and output_size arrays")
    job = Job(
        markdown_path=path,
        relative_markdown_path=path.relative_to(jobs_root).as_posix(),
        scope=str(metadata["scope"]),
        category=str(metadata["category"]),
        job_id=str(metadata["job_id"]),
        output_image=str(metadata["output_image"]),
        frames=int(metadata["frames"]),
        columns=columns,
        rows=rows,
        cell_width=int(cell_size[0]),
        cell_height=int(cell_size[1]),
        output_width=int(output_size[0]),
        output_height=int(output_size[1]),
        prompt=extract_prompt_block(body, path),
    )
    validate_job_contract(job)
    return job


def validate_job_contract(job: Job) -> None:
    if job.frames < 1:
        raise RenderError(f"{job.job_id} must declare at least one frame")
    if job.columns < 1 or job.rows < 1:
        raise RenderError(f"{job.job_id} has an invalid grid: {job.columns}x{job.rows}")
    if job.frames > job.frame_capacity:
        raise RenderError(f"{job.job_id} overfills its grid")
    if job.output_width != job.columns * job.cell_width or job.output_height != job.rows * job.cell_height:
        raise RenderError(f"{job.job_id} output_size does not match grid × cell_size")


def load_jobs(jobs_root: Path) -> list[Job]:
    jobs = [parse_job(path, jobs_root) for path in sorted(jobs_root.rglob("*.md")) if path.name != "INDEX.md"]
    if not jobs:
        raise RenderError(f"No job markdown files found under {jobs_root}")
    return jobs


def select_jobs(jobs: list[Job], args: argparse.Namespace) -> list[Job]:
    selected = jobs
    if args.scope:
        selected = [job for job in selected if job.scope == args.scope]
    if args.category:
        selected = [job for job in selected if job.category == args.category]
    if args.job:
        selected = [job for job in selected if job.job_id == args.job]
    if args.limit is not None:
        if args.limit < 0:
            raise RenderError("--limit must be non-negative")
        selected = selected[: args.limit]
    if not selected:
        raise RenderError("No sprite render jobs matched the requested filters")
    return selected


def render_output_path(job: Job, renders_root: Path) -> Path:
    return renders_root / Path(job.output_image)


def validate_existing_png(path: Path, job: Job) -> None:
    try:
        with Image.open(path) as image:
            image = image.convert("RGBA")
            if image.size != (job.output_width, job.output_height):
                raise RenderError(
                    f"{job.job_id} output dimension mismatch: expected "
                    f"{job.output_width}x{job.output_height}, got {image.size[0]}x{image.size[1]}"
                )
            validate_cells(image, job)
    except FileNotFoundError as exc:
        raise RenderError(f"{job.job_id} expected existing output at {path}") from exc


def validate_cells(image: Image.Image, job: Job) -> None:
    alpha = image.getchannel("A")
    for frame_index in range(job.frame_capacity):
        x0 = (frame_index % job.columns) * job.cell_width
        y0 = (frame_index // job.columns) * job.cell_height
        cell = alpha.crop((x0, y0, x0 + job.cell_width, y0 + job.cell_height))
        bbox = cell.getbbox()
        if frame_index < job.frames and bbox is None:
            raise RenderError(f"{job.job_id} has an empty occupied cell at frame {frame_index + 1}")
        if frame_index >= job.frames and bbox is not None:
            raise RenderError(f"{job.job_id} has non-transparent pixels in unused cell {frame_index + 1}")


def post_json(api_url: str, endpoint: str, payload: dict[str, Any], *, timeout: int = 600) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        api_url.rstrip("/") + endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        parsed = json.loads(response.read().decode("utf-8"))
    if parsed is None and endpoint == "/sdapi/v1/options":
        return {}
    if not isinstance(parsed, dict):
        raise RenderError(f"{endpoint} returned a non-object response")
    return parsed


def get_json(api_url: str, endpoint: str, *, timeout: int = 60) -> dict[str, Any]:
    with urllib.request.urlopen(api_url.rstrip("/") + endpoint, timeout=timeout) as response:
        parsed = json.loads(response.read().decode("utf-8"))
    if not isinstance(parsed, dict):
        raise RenderError(f"{endpoint} returned a non-object response")
    return parsed


def deterministic_seed(job: Job, seed_base: int) -> int:
    digest = hashlib.sha256(job.job_id.encode("utf-8")).digest()
    return (seed_base + int.from_bytes(digest[:4], "big")) % 2_147_483_647


def job_uses_tiling(job: Job, args: argparse.Namespace) -> bool:
    if args.tiling == "on":
        return True
    if args.tiling == "off":
        return False
    prompt = job.prompt.lower()
    return job.frames == 1 and (
        "tile seamlessly" in prompt
        or "seamless tile" in prompt
        or "static solid tile" in prompt
    )


def call_a1111(api_url: str, job: Job, args: argparse.Namespace) -> tuple[bytes, int | None]:
    if api_url.startswith("mock://"):
        return call_mock_a1111(api_url, job.prompt)
    seed = deterministic_seed(job, args.seed_base)
    payload = {
        "prompt": job.prompt,
        "negative_prompt": args.negative_prompt,
        "seed": seed,
        "sampler_name": args.sampler_name,
        "scheduler": args.scheduler,
        "steps": args.steps,
        "cfg_scale": args.cfg_scale,
        "width": job.output_width * args.render_scale,
        "height": job.output_height * args.render_scale,
        "batch_size": 1,
        "n_iter": 1,
        "restore_faces": False,
        "tiling": job_uses_tiling(job, args),
        "do_not_save_samples": True,
        "do_not_save_grid": True,
        "save_images": False,
        "send_images": True,
    }
    parsed = post_json(api_url, "/sdapi/v1/txt2img", payload)
    images = parsed.get("images") or []
    if len(images) != 1:
        raise RenderError(f"AUTOMATIC1111 returned {len(images)} images instead of exactly one PNG")
    raw_png = base64.b64decode(images[0])
    returned_seed: int | None = seed
    info = parsed.get("info")
    if isinstance(info, str) and info:
        try:
            decoded = json.loads(info)
        except json.JSONDecodeError:
            decoded = {}
        if isinstance(decoded, dict) and "seed" in decoded:
            try:
                returned_seed = int(decoded["seed"])
            except (TypeError, ValueError):
                pass
    return raw_png, returned_seed


def call_rembg(api_url: str, raw_png: bytes, model: str) -> bytes:
    encoded = base64.b64encode(raw_png).decode("ascii")
    parsed = post_json(
        api_url,
        "/rembg",
        {
            "input_image": encoded,
            "model": model,
            "return_mask": False,
            "alpha_matting": False,
        },
        timeout=600,
    )
    image = parsed.get("image")
    if not isinstance(image, str) or not image:
        raise RenderError("rembg returned no image")
    if image.startswith("data:"):
        image = image.split(",", 1)[1]
    return base64.b64decode(image)


def call_mock_a1111(api_url: str, prompt: str) -> tuple[bytes, int | None]:
    plan_path = Path(api_url[len("mock://") :])
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    attempts = plan.get("attempts") or []
    if not attempts:
        raise RenderError(f"Mock A1111 plan at {plan_path} has no attempts")
    state_path = plan_path.with_suffix(plan_path.suffix + ".state")
    attempt_index = int(state_path.read_text(encoding="utf-8")) if state_path.exists() else 0
    if attempt_index >= len(attempts):
        attempt = attempts[-1]
    else:
        attempt = attempts[attempt_index]
    state_path.write_text(str(attempt_index + 1), encoding="utf-8")
    if "error" in attempt:
        raise RenderError(str(attempt["error"]))
    width, height = [int(value) for value in attempt.get("size", [0, 0])]
    if width < 1 or height < 1:
        raise RenderError(f"Mock A1111 plan at {plan_path} returned an invalid size")
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    painted_cells = [int(value) for value in attempt.get("painted_cells", [])]
    columns = int(attempt.get("columns", 2))
    rows = int(attempt.get("rows", 2))
    cell_width = width // columns
    cell_height = height // rows
    for cell_index in painted_cells:
        x0 = (cell_index % columns) * cell_width
        y0 = (cell_index // columns) * cell_height
        for x in range(x0 + 2, x0 + cell_width - 2):
            for y in range(y0 + 2, y0 + cell_height - 2):
                image.putpixel((x, y), (255, 0, 0, 255))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue(), int(attempt["seed"]) if "seed" in attempt else None


def call_a1111_with_retries(api_url: str, job: Job, args: argparse.Namespace) -> tuple[bytes, int | None, int]:
    last_error: Exception | None = None
    for attempt in range(1, DEFAULT_RETRIES + 1):
        try:
            png_bytes, seed = call_a1111(api_url, job, args)
            return png_bytes, seed, attempt
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RenderError, OSError) as exc:
            last_error = exc
            if attempt >= DEFAULT_RETRIES:
                break
            time.sleep(RETRY_DELAY_SECONDS)
    assert last_error is not None
    raise RenderError(f"AUTOMATIC1111 request failed after {DEFAULT_RETRIES} attempts: {last_error}")


def atomic_write_png(path: Path, image: Image.Image, *, job: Job, seed: int | None, args: argparse.Namespace) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    png_info = PngImagePlugin.PngInfo()
    png_info.add_text("job_id", job.job_id)
    png_info.add_text("a1111_prompt", job.prompt)
    if seed is not None:
        png_info.add_text("a1111_seed", str(seed))
    png_info.add_text("a1111_model", args.model or "current")
    png_info.add_text("a1111_sampler", args.sampler_name)
    png_info.add_text("a1111_scheduler", args.scheduler)
    png_info.add_text("a1111_steps", str(args.steps))
    png_info.add_text("a1111_cfg_scale", str(args.cfg_scale))
    png_info.add_text("a1111_render_scale", str(args.render_scale))
    png_info.add_text("a1111_rembg_model", "disabled" if args.no_rembg else args.rembg_model)
    png_info.add_text("a1111_tiling", str(job_uses_tiling(job, args)).lower())
    png_info.add_text("a1111_palette_colors", str(args.palette_colors))
    fd, temporary_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    os.close(fd)
    temporary_path = Path(temporary_name)
    try:
        image.save(temporary_path, format="PNG", pnginfo=png_info)
        os.replace(temporary_path, path)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def clear_unused_cells(image: Image.Image, job: Job) -> None:
    for frame_index in range(job.frames, job.frame_capacity):
        x0 = (frame_index % job.columns) * job.cell_width
        y0 = (frame_index // job.columns) * job.cell_height
        image.paste((0, 0, 0, 0), (x0, y0, x0 + job.cell_width, y0 + job.cell_height))


def reduce_palette(image: Image.Image, colors: int) -> Image.Image:
    if colors <= 0:
        return image.convert("RGBA")
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    rgb = rgba.convert("RGB").quantize(
        colors=max(2, min(colors, 256)),
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    rgb.putalpha(alpha)
    return rgb


def harden_alpha(image: Image.Image, threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(lambda value: 255 if value >= threshold else 0)
    rgba.putalpha(alpha)
    return rgba


def enforce_seamless_edges(image: Image.Image) -> Image.Image:
    """Make opposite border pixels identical without touching the interior."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        pixels[width - 1, y] = pixels[0, y]
    for x in range(width):
        pixels[x, height - 1] = pixels[x, 0]
    return rgba


def decode_and_validate_png(raw_png: bytes, job: Job, args: argparse.Namespace) -> Image.Image:
    try:
        with Image.open(BytesIO(raw_png)) as decoded:
            image = decoded.convert("RGBA")
    except Exception as exc:  # pragma: no cover - Pillow exception types vary
        raise RenderError(f"{job.job_id} response was not a valid PNG") from exc
    expected_render_size = (
        job.output_width * args.render_scale,
        job.output_height * args.render_scale,
    )
    if image.size != expected_render_size:
        raise RenderError(
            f"{job.job_id} renderer dimension mismatch: expected "
            f"{expected_render_size[0]}x{expected_render_size[1]}, got {image.size[0]}x{image.size[1]}"
        )
    if args.render_scale != 1:
        image = image.resize((job.output_width, job.output_height), Image.Resampling.NEAREST)
    image = harden_alpha(image, args.alpha_threshold)
    image = reduce_palette(image, args.palette_colors)
    if job_uses_tiling(job, args):
        image = enforce_seamless_edges(image)
    clear_unused_cells(image, job)
    alpha_histogram = image.getchannel("A").histogram()
    if any(alpha_histogram[1:255]):
        raise RenderError(f"{job.job_id} contains partial alpha after normalization")
    validate_cells(image, job)
    return image


def job_summary(job: Job, renders_root: Path) -> dict[str, Any]:
    return {
        "job_id": job.job_id,
        "scope": job.scope,
        "category": job.category,
        "markdown_path": job.relative_markdown_path,
        "output_image": str(render_output_path(job, renders_root)),
        "frames": job.frames,
        "grid": {"columns": job.columns, "rows": job.rows},
        "cell_size": [job.cell_width, job.cell_height],
        "output_size": [job.output_width, job.output_height],
    }


def list_jobs(jobs: list[Job], renders_root: Path) -> None:
    payload = {
        "selected_count": len(jobs),
        "jobs": [job_summary(job, renders_root) for job in jobs],
    }
    print(json.dumps(payload, indent=2))


def dry_run_jobs(jobs: list[Job], renders_root: Path) -> None:
    payload_jobs = []
    for job in jobs:
        summary = job_summary(job, renders_root)
        summary["prompt"] = job.prompt
        payload_jobs.append(summary)
    print(json.dumps({"selected_count": len(payload_jobs), "jobs": payload_jobs}, indent=2))


def atomic_write_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=str(path.parent))
    os.close(fd)
    temporary_path = Path(temporary_name)
    try:
        temporary_path.write_bytes(payload)
        os.replace(temporary_path, path)
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def raw_output_path(job: Job, raw_root: Path) -> Path:
    return raw_root / Path(job.output_image)


def switch_model(api_url: str, model: str | None) -> str | None:
    if not model or api_url.startswith("mock://"):
        return None
    options = get_json(api_url, "/sdapi/v1/options")
    original = options.get("sd_model_checkpoint")
    if isinstance(original, str) and model not in original:
        post_json(api_url, "/sdapi/v1/options", {"sd_model_checkpoint": model}, timeout=900)
    return original if isinstance(original, str) else None


def process_jobs(jobs: list[Job], args: argparse.Namespace) -> None:
    payload_jobs = []
    original_model = switch_model(args.api_url, args.model)
    try:
        for job in jobs:
            output_path = render_output_path(job, args.renders_root)
            if args.resume and output_path.exists():
                validate_existing_png(output_path, job)
                payload_jobs.append(
                    {
                        **job_summary(job, args.renders_root),
                        "status": "skipped_existing",
                        "attempts": 0,
                    }
                )
                continue

            raw_png, seed, attempts = call_a1111_with_retries(args.api_url, job, args)
            raw_path = raw_output_path(job, args.raw_root)
            atomic_write_bytes(raw_path, raw_png)
            normalized_png = raw_png if args.no_rembg or args.api_url.startswith("mock://") else call_rembg(
                args.api_url, raw_png, args.rembg_model
            )
            image = decode_and_validate_png(normalized_png, job, args)
            atomic_write_png(output_path, image, job=job, seed=seed, args=args)
            validate_existing_png(output_path, job)
            payload_jobs.append(
                {
                    **job_summary(job, args.renders_root),
                    "status": "rendered",
                    "attempts": attempts,
                    "seed": seed,
                    "raw_output": str(raw_path),
                    "model": args.model,
                }
            )
    finally:
        if original_model and args.model and args.model not in original_model and not args.api_url.startswith("mock://"):
            try:
                post_json(args.api_url, "/sdapi/v1/options", {"sd_model_checkpoint": original_model}, timeout=900)
            except Exception as exc:  # noqa: BLE001 - preserve completed outputs and report restoration failure
                print(f"warning: failed to restore A1111 model {original_model}: {exc}", file=sys.stderr)

    print(json.dumps({"selected_count": len(payload_jobs), "jobs": payload_jobs}, indent=2))


def main() -> int:
    args = parse_args()
    try:
        jobs = select_jobs(load_jobs(args.jobs_root), args)
        if args.list:
            list_jobs(jobs, args.renders_root)
            return 0
        if args.dry_run:
            dry_run_jobs(jobs, args.renders_root)
            return 0
        process_jobs(jobs, args)
        return 0
    except RenderError as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
