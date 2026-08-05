#!/usr/bin/env python3
"""Generate Moss's six-frame baton guard-strike/stun sprite render job.

The body poses come from the checked-in 48x48 production atlas. This keeps
Moss's identity, scale, alpha edge, lighting, and x=24/y=44 ground anchor
stable while adding only the expansion weapon and compact stun VFX.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "sprites" / "moss_badger_production.png"
OUTPUT = ROOT / "renders" / "moss_blade_styles" / "baton_blade_stun_4c_2r.png"

CELL = 48
COLS = 4
ROWS = 2

# Production-atlas row order from data/sprites.json.
ATLAS_ROWS = {
    "idle": 0,
    "melee_claws": 6,
    "parry": 16,
}

# (animation, frame) choices for key pose, anticipation, active, peak,
# follow-through, and recovery.
POSES = (
    ("parry", 0),
    ("parry", 1),
    ("melee_claws", 1),
    ("melee_claws", 2),
    ("melee_claws", 3),
    ("idle", 0),
)

# Baton endpoints in cell-local pixels. Start points remain near Moss's lead
# hand; end points describe the readable guard-strike arc.
BATONS = (
    ((29, 24), (39, 37)),
    ((28, 23), (18, 10)),
    ((30, 23), (45, 21)),
    ((30, 22), (44, 14)),
    ((29, 24), (41, 38)),
    ((29, 24), (34, 11)),
)

OUTLINE = (5, 8, 24, 255)
SHAFT = (77, 45, 132, 255)
CORE = (48, 236, 255, 255)
WHITE = (226, 255, 255, 255)
PULSE = (216, 70, 255, 255)


def crop_frame(atlas: Image.Image, animation: str, frame: int) -> Image.Image:
    row = ATLAS_ROWS[animation]
    left = frame * CELL
    top = row * CELL
    return atlas.crop((left, top, left + CELL, top + CELL)).copy()


def pixel_line(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
) -> None:
    """Draw a hard-edged outlined neon baton with no antialiasing."""

    draw.line((start, end), fill=OUTLINE, width=5)
    draw.line((start, end), fill=SHAFT, width=3)
    draw.line((start, end), fill=CORE, width=1)

    # Square grip and emitter caps keep the object readable at native scale.
    sx, sy = start
    ex, ey = end
    draw.rectangle((sx - 2, sy - 2, sx + 2, sy + 2), fill=OUTLINE)
    draw.rectangle((sx - 1, sy - 1, sx + 1, sy + 1), fill=SHAFT)
    draw.rectangle((ex - 2, ey - 2, ex + 2, ey + 2), fill=OUTLINE)
    draw.rectangle((ex - 1, ey - 1, ex + 1, ey + 1), fill=WHITE)


def draw_stun_pulse(draw: ImageDraw.ImageDraw, tip: tuple[int, int]) -> None:
    """Add a compact, body-secondary pulse to the peak frame."""

    x, y = tip
    # Broken diamond rings read as an electrical pulse while remaining crisp.
    segments = (
        ((x - 7, y), (x - 4, y - 3)),
        ((x - 3, y - 4), (x, y - 7)),
        ((x + 1, y - 7), (x + 4, y - 4)),
        ((x + 5, y - 3), (x + 7, y)),
        ((x + 7, y + 1), (x + 4, y + 4)),
        ((x + 3, y + 5), (x, y + 7)),
        ((x - 1, y + 7), (x - 4, y + 4)),
        ((x - 5, y + 3), (x - 7, y + 1)),
    )
    for start, end in segments:
        draw.line((start, end), fill=PULSE, width=2)

    for dx, dy in ((-9, -2), (-5, -8), (5, -7), (9, 2), (4, 8)):
        draw.point((x + dx, y + dy), fill=WHITE)


def build() -> Image.Image:
    atlas = Image.open(SOURCE).convert("RGBA")
    expected_size = (8 * CELL, 17 * CELL)
    if atlas.size != expected_size:
        raise ValueError(f"unexpected Moss atlas size {atlas.size}; expected {expected_size}")

    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    for index, ((animation, frame), baton) in enumerate(zip(POSES, BATONS, strict=True)):
        cell = crop_frame(atlas, animation, frame)
        draw = ImageDraw.Draw(cell)
        pixel_line(draw, *baton)
        if index == 3:
            draw_stun_pulse(draw, baton[1])

        x = (index % COLS) * CELL
        y = (index // COLS) * CELL
        sheet.alpha_composite(cell, (x, y))

    # Runtime integration requires binary alpha. Preserve the exact nonzero
    # occupancy mask from the production atlas while hardening inherited soft
    # edge pixels; this does not redraw or expand any frame silhouette.
    alpha = sheet.getchannel("A").point(lambda value: 255 if value > 0 else 0)
    sheet.putalpha(alpha)
    return sheet


def validate(sheet: Image.Image) -> None:
    if sheet.size != (192, 96):
        raise ValueError(f"invalid output size: {sheet.size}")
    if sheet.mode != "RGBA":
        raise ValueError(f"invalid output mode: {sheet.mode}")
    alpha_histogram = sheet.getchannel("A").histogram()
    if any(alpha_histogram[1:255]):
        raise ValueError("output contains partial alpha values")

    for index in range(6):
        x = (index % COLS) * CELL
        y = (index // COLS) * CELL
        alpha = sheet.crop((x, y, x + CELL, y + CELL)).getchannel("A")
        if alpha.getbbox() is None:
            raise ValueError(f"occupied frame {index + 1} is transparent")

    for index in range(6, 8):
        x = (index % COLS) * CELL
        y = (index // COLS) * CELL
        alpha = sheet.crop((x, y, x + CELL, y + CELL)).getchannel("A")
        if alpha.getbbox() is not None:
            raise ValueError(f"unused frame {index + 1} is not fully transparent")


def main() -> int:
    sheet = build()
    validate(sheet)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT, optimize=True)
    print(OUTPUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
