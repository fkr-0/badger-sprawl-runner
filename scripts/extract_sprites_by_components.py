#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from collections import deque
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass
class Component:
    id: int
    min_x: int
    min_y: int
    max_x: int
    max_y: int
    area: int

    @property
    def width(self) -> int:
        return self.max_x - self.min_x + 1

    @property
    def height(self) -> int:
        return self.max_y - self.min_y + 1


def is_bg(
    r: int,
    g: int,
    b: int,
    a: int,
    white_threshold: int,
    alpha_threshold: int,
    bg_mode: str,
    bg_ref: tuple[int, int, int],
    bg_tolerance: int,
) -> bool:
    if a <= alpha_threshold:
        return True
    if bg_mode == "white":
        return r >= white_threshold and g >= white_threshold and b >= white_threshold
    dr = abs(r - bg_ref[0])
    dg = abs(g - bg_ref[1])
    db = abs(b - bg_ref[2])
    return dr <= bg_tolerance and dg <= bg_tolerance and db <= bg_tolerance


def estimate_bg_from_border(rgba: list[tuple[int, int, int, int]], width: int, height: int) -> tuple[int, int, int]:
    samples: list[tuple[int, int, int]] = []
    for x in range(width):
        for y in (0, height - 1):
            r, g, b, a = rgba[y * width + x]
            if a > 8:
                samples.append((r, g, b))
    for y in range(height):
        for x in (0, width - 1):
            r, g, b, a = rgba[y * width + x]
            if a > 8:
                samples.append((r, g, b))
    if not samples:
        return (255, 255, 255)
    rs = sorted(c[0] for c in samples)
    gs = sorted(c[1] for c in samples)
    bs = sorted(c[2] for c in samples)
    mid = len(samples) // 2
    return (rs[mid], gs[mid], bs[mid])


def find_components(
    rgba: list[tuple[int, int, int, int]],
    width: int,
    height: int,
    white_threshold: int,
    alpha_threshold: int,
    bg_mode: str,
    bg_ref: tuple[int, int, int],
    bg_tolerance: int,
    min_pixels: int,
) -> list[Component]:
    visited = bytearray(width * height)
    components: list[Component] = []

    def idx(x: int, y: int) -> int:
        return y * width + x

    cid = 0
    for y in range(height):
        for x in range(width):
            i = idx(x, y)
            if visited[i]:
                continue
            visited[i] = 1
            r, g, b, a = rgba[i]
            if is_bg(r, g, b, a, white_threshold, alpha_threshold, bg_mode, bg_ref, bg_tolerance):
                continue

            q: deque[tuple[int, int]] = deque([(x, y)])
            min_x = max_x = x
            min_y = max_y = y
            area = 0

            while q:
                cx, cy = q.popleft()
                ci = idx(cx, cy)
                cr, cg, cb, ca = rgba[ci]
                if is_bg(cr, cg, cb, ca, white_threshold, alpha_threshold, bg_mode, bg_ref, bg_tolerance):
                    continue

                area += 1
                if cx < min_x:
                    min_x = cx
                if cx > max_x:
                    max_x = cx
                if cy < min_y:
                    min_y = cy
                if cy > max_y:
                    max_y = cy

                for nx, ny in (
                    (cx - 1, cy),
                    (cx + 1, cy),
                    (cx, cy - 1),
                    (cx, cy + 1),
                    (cx - 1, cy - 1),
                    (cx + 1, cy - 1),
                    (cx - 1, cy + 1),
                    (cx + 1, cy + 1),
                ):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    ni = idx(nx, ny)
                    if not visited[ni]:
                        visited[ni] = 1
                        q.append((nx, ny))

            if area >= min_pixels:
                components.append(
                    Component(
                        id=cid,
                        min_x=min_x,
                        min_y=min_y,
                        max_x=max_x,
                        max_y=max_y,
                        area=area,
                    )
                )
                cid += 1

    return components


def find_grid_cells(
    rgba: list[tuple[int, int, int, int]],
    width: int,
    height: int,
    white_threshold: int,
    alpha_threshold: int,
    bg_mode: str,
    bg_ref: tuple[int, int, int],
    bg_tolerance: int,
    min_pixels: int,
    cell_width: int,
    cell_height: int,
) -> list[Component]:
    components: list[Component] = []
    cid = 0
    for y0 in range(0, height, cell_height):
        for x0 in range(0, width, cell_width):
            x1 = min(x0 + cell_width, width)
            y1 = min(y0 + cell_height, height)
            min_x = width
            min_y = height
            max_x = -1
            max_y = -1
            area = 0
            for y in range(y0, y1):
                row = y * width
                for x in range(x0, x1):
                    r, g, b, a = rgba[row + x]
                    if is_bg(r, g, b, a, white_threshold, alpha_threshold, bg_mode, bg_ref, bg_tolerance):
                        continue
                    area += 1
                    if x < min_x:
                        min_x = x
                    if x > max_x:
                        max_x = x
                    if y < min_y:
                        min_y = y
                    if y > max_y:
                        max_y = y
            if area >= min_pixels and max_x >= min_x and max_y >= min_y:
                components.append(
                    Component(
                        id=cid,
                        min_x=min_x,
                        min_y=min_y,
                        max_x=max_x,
                        max_y=max_y,
                        area=area,
                    )
                )
                cid += 1
    return components


def pack_components(components: list[Component], padding: int, columns: int | None):
    if not components:
        return [], 1, 1

    ordered = sorted(components, key=lambda c: (-c.area, c.min_y, c.min_x))
    cols = columns if columns and columns > 0 else math.ceil(math.sqrt(len(ordered)))

    row_heights: list[int] = []
    rows: list[list[Component]] = []
    for i in range(0, len(ordered), cols):
        row = ordered[i : i + cols]
        rows.append(row)
        row_heights.append(max(c.height for c in row))

    atlas_width = 0
    for row in rows:
        total = sum(c.width for c in row) + padding * (len(row) + 1)
        atlas_width = max(atlas_width, total)

    atlas_height = sum(row_heights) + padding * (len(rows) + 1)

    placements = []
    y = padding
    for row_idx, row in enumerate(rows):
        x = padding
        row_h = row_heights[row_idx]
        for comp in row:
            placements.append((comp, x, y))
            x += comp.width + padding
        y += row_h + padding

    return placements, atlas_width, atlas_height


def run(args: argparse.Namespace) -> None:
    src = Path(args.input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = list(img.getdata(band=None))

    bg_ref = estimate_bg_from_border(pixels, w, h)

    if args.cell_width > 0 and args.cell_height > 0:
        comps = find_grid_cells(
            pixels,
            w,
            h,
            white_threshold=args.white_threshold,
            alpha_threshold=args.alpha_threshold,
            bg_mode=args.bg_mode,
            bg_ref=bg_ref,
            bg_tolerance=args.bg_tolerance,
            min_pixels=args.min_pixels,
            cell_width=args.cell_width,
            cell_height=args.cell_height,
        )
    else:
        comps = find_components(
            pixels,
            w,
            h,
            white_threshold=args.white_threshold,
            alpha_threshold=args.alpha_threshold,
            bg_mode=args.bg_mode,
            bg_ref=bg_ref,
            bg_tolerance=args.bg_tolerance,
            min_pixels=args.min_pixels,
        )

    placements, atlas_w, atlas_h = pack_components(comps, padding=args.padding, columns=args.columns)
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    stem = src.stem
    sprites_dir = out_dir / f"{stem}_sprites"
    sprites_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        "source": str(src),
        "component_count": len(comps),
        "params": {
            "white_threshold": args.white_threshold,
            "alpha_threshold": args.alpha_threshold,
            "min_pixels": args.min_pixels,
            "padding": args.padding,
            "columns": args.columns,
            "cell_width": args.cell_width,
            "cell_height": args.cell_height,
            "bg_mode": args.bg_mode,
            "bg_tolerance": args.bg_tolerance,
            "bg_reference_rgb": [bg_ref[0], bg_ref[1], bg_ref[2]],
        },
        "atlas": {
            "path": str(out_dir / f"{stem}_atlas.png"),
            "width": atlas_w,
            "height": atlas_h,
        },
        "components": [],
    }

    for comp, px, py in placements:
        crop = img.crop((comp.min_x, comp.min_y, comp.max_x + 1, comp.max_y + 1))
        atlas.paste(crop, (px, py))
        name = f"{stem}_c{comp.id:04d}.png"
        crop.save(sprites_dir / name)
        metadata["components"].append(
            {
                "id": comp.id,
                "area": comp.area,
                "source_bbox": {
                    "x": comp.min_x,
                    "y": comp.min_y,
                    "w": comp.width,
                    "h": comp.height,
                },
                "atlas_bbox": {
                    "x": px,
                    "y": py,
                    "w": comp.width,
                    "h": comp.height,
                },
                "file": str(sprites_dir / name),
            }
        )

    atlas_path = out_dir / f"{stem}_atlas.png"
    json_path = out_dir / f"{stem}_components.json"
    atlas.save(atlas_path)
    json_path.write_text(json.dumps(metadata, indent=2))

    print(f"input={src}")
    print(f"components={len(comps)}")
    print(f"atlas={atlas_path}")
    print(f"metadata={json_path}")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Extract disjoint sprites from white-background sheets")
    p.add_argument("input", help="Input sprite/image path")
    p.add_argument("--output-dir", default="generated/extracted", help="Output directory")
    p.add_argument("--white-threshold", type=int, default=242, help="RGB >= threshold treated as white background")
    p.add_argument("--alpha-threshold", type=int, default=8, help="Alpha <= threshold treated as transparent background")
    p.add_argument("--min-pixels", type=int, default=20, help="Discard tiny connected components")
    p.add_argument("--padding", type=int, default=2, help="Padding in packed atlas")
    p.add_argument("--columns", type=int, default=0, help="Fixed atlas columns; 0 = auto")
    p.add_argument("--cell-width", type=int, default=0, help="Optional grid-cell width for split mode")
    p.add_argument("--cell-height", type=int, default=0, help="Optional grid-cell height for split mode")
    p.add_argument("--bg-mode", choices=["white", "border"], default="border", help="Background detection mode")
    p.add_argument("--bg-tolerance", type=int, default=20, help="Tolerance for border background color mode")
    return p.parse_args()


if __name__ == "__main__":
    run(parse_args())
