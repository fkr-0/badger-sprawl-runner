#!/usr/bin/env python3
"""Generate the deterministic three-depth Mirror Palace parallax atlas."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "sprites" / "worlds" / "mirror_palace_parallax.png"
PUBLIC = ROOT / "apps" / "runner" / "public" / "assets" / "sprites" / "worlds" / "mirror_palace_parallax.png"
DATA = ROOT / "data" / "sprites.json"
PUBLIC_DATA = ROOT / "apps" / "runner" / "public" / "data" / "sprites.json"

WIDTH, HEIGHT = 320, 180
INK = (8, 6, 18, 255)
DEEP = (20, 15, 42, 255)
VIOLET = (82, 55, 130, 255)
LILAC = (158, 118, 220, 255)
MINT = (103, 243, 196, 255)
GOLD = (255, 179, 94, 255)
PALE = (231, 239, 255, 255)


def back_plate() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), DEEP)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 118, WIDTH, HEIGHT), fill=(12, 9, 28, 255))
    for index, x in enumerate(range(-20, WIDTH + 40, 62)):
        height = 86 + (index % 3) * 15
        draw.rectangle((x, 118 - height, x + 45, 118), fill=(28, 19, 55, 255))
        draw.arc((x + 4, 118 - height - 22, x + 41, 118 - height + 26), 180, 360, fill=VIOLET, width=4)
        draw.line((x + 22, 118 - height, x + 22, 118), fill=(56, 36, 90, 255), width=2)
    for x in range(18, WIDTH, 64):
        draw.polygon([(x, 20), (x + 7, 32), (x, 44), (x - 7, 32)], fill=(94, 70, 144, 180))
    return image


def mid_plate() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for x in range(-35, WIDTH + 45, 88):
        draw.rectangle((x, 72, x + 70, 126), fill=(25, 17, 48, 230), outline=LILAC, width=2)
        draw.rectangle((x + 8, 81, x + 62, 119), fill=(13, 10, 27, 220), outline=(105, 76, 155, 255))
        draw.line((x + 35, 82, x + 35, 118), fill=MINT, width=1)
        draw.line((x + 9, 100, x + 61, 100), fill=(183, 159, 230, 150), width=1)
    for x in (30, 126, 222, 306):
        draw.line((x, 0, x, 34), fill=GOLD, width=2)
        draw.polygon([(x, 33), (x + 10, 48), (x, 62), (x - 10, 48)], fill=(255, 179, 94, 170), outline=PALE)
    draw.rectangle((0, 130, WIDTH, 148), fill=(37, 22, 62, 235))
    for x in range(5, WIDTH, 40):
        draw.rectangle((x, 124, x + 30, 134), fill=(76, 47, 101, 255), outline=GOLD)
    return image


def front_plate() -> Image.Image:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.polygon([(0, 0), (46, 0), (26, 94), (0, 120)], fill=(35, 20, 58, 220))
    draw.polygon([(WIDTH, 0), (WIDTH - 48, 0), (WIDTH - 26, 98), (WIDTH, 122)], fill=(35, 20, 58, 220))
    for points in [
        [(18, 144), (46, 121), (57, 171), (6, 180)],
        [(102, 153), (126, 118), (151, 176), (91, 180)],
        [(239, 142), (274, 113), (295, 174), (226, 180)],
    ]:
        draw.polygon(points, fill=(92, 68, 141, 180), outline=PALE)
        xs = [point[0] for point in points]
        ys = [point[1] for point in points]
        draw.line((min(xs), max(ys), max(xs), min(ys)), fill=MINT, width=1)
    draw.line((0, 151, WIDTH, 151), fill=(219, 196, 255, 120), width=2)
    return image


def update_manifest() -> None:
    data = json.loads(DATA.read_text())
    sheets = data["spriteSheets"]
    sheet = {
        "id": "mirror_palace_parallax",
        "file": "assets/sprites/worlds/mirror_palace_parallax.png",
        "frameSize": [WIDTH, HEIGHT],
        "world": "mirror_palace",
        "role": "parallax",
        "grid": {"columns": 3, "rows": 1},
        "animations": {
            "back_plate": {
                "frames": 1,
                "fps": 1,
                "order": [0],
                "loop": False,
                "tags": ["world:mirror_palace", "parallax", "back"],
            },
            "mid_plate": {
                "frames": 1,
                "fps": 1,
                "order": [1],
                "loop": False,
                "tags": ["world:mirror_palace", "parallax", "mid"],
            },
            "front_plate": {
                "frames": 1,
                "fps": 1,
                "order": [2],
                "loop": False,
                "tags": ["world:mirror_palace", "parallax", "front"],
            },
        },
        "source": {
            "tool": "deterministic Pillow pixel-art generator",
            "script": "scripts/generate-mirror-palace-parallax.py",
            "note": "Three horizontally packed 320x180 reflected banquet hall depth plates.",
        },
    }
    replacement_index = next((index for index, candidate in enumerate(sheets) if candidate["id"] == sheet["id"]), None)
    if replacement_index is None:
        insert_after = next((index for index, candidate in enumerate(sheets) if candidate["id"] == "chrome_arcology_parallax"), len(sheets) - 1)
        sheets.insert(insert_after + 1, sheet)
    else:
        sheets[replacement_index] = sheet
    DATA.write_text(json.dumps(data, indent="\t") + "\n")
    shutil.copy2(DATA, PUBLIC_DATA)


def main() -> None:
    atlas = Image.new("RGBA", (WIDTH * 3, HEIGHT), (0, 0, 0, 0))
    for index, plate in enumerate((back_plate(), mid_plate(), front_plate())):
        atlas.alpha_composite(plate, (index * WIDTH, 0))
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(SOURCE, optimize=False)
    shutil.copy2(SOURCE, PUBLIC)
    update_manifest()
    print("generated mirror_palace_parallax")


if __name__ == "__main__":
    main()
