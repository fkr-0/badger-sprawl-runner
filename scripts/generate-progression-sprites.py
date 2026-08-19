#!/usr/bin/env python3
"""Generate deterministic pixel-art progression sheets and register them in data manifests."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ASSET_DIR = ROOT / "assets" / "sprites"
PUBLIC_ASSET_DIR = ROOT / "apps" / "runner" / "public" / "assets" / "sprites"
DATA_DIR = ROOT / "data"
PUBLIC_DATA_DIR = ROOT / "apps" / "runner" / "public" / "data"

FRAME = 32
TRANSPARENT = (0, 0, 0, 0)
INK = (7, 10, 18, 255)
CHROME = (226, 239, 247, 255)
MUTED = (83, 101, 122, 255)
CYAN = (103, 243, 196, 255)
AMBER = (255, 179, 94, 255)
MAGENTA = (255, 94, 122, 255)
VIOLET = (143, 104, 255, 255)
BLUE = (84, 151, 255, 255)

EXTENDED_ITEMS = [
    {
        "id": "capacitor_coil",
        "name": "Mutual-Aid Capacitor",
        "slot": "passive",
        "rarity": "rare",
        "tags": ["railgun", "charge"],
        "effect": "Adds rail damage and pushes one more target through the sightline.",
        "iconAnimation": "capacitor_coil_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "capacitor_coil_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"railDamageBonus": 0.2, "railPierceBonus": 1},
    },
    {
        "id": "phase_mantle",
        "name": "Phase Mantle",
        "slot": "defense",
        "rarity": "rare",
        "tags": ["dodge", "guard"],
        "effect": "Thins incoming hits and cycles the dodge relay faster.",
        "iconAnimation": "phase_mantle_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "phase_mantle_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"damageMitigation": 0.1, "dodgeCooldownReduction": 0.08},
    },
    {
        "id": "ledger_lens",
        "name": "Ledger Lens",
        "slot": "utility",
        "rarity": "uncommon",
        "tags": ["combo", "evidence"],
        "effect": "Keeps the combat chain legible long enough to finish the audit.",
        "iconAnimation": "ledger_lens_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "ledger_lens_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"comboWindowBonus": 0.14, "meleeStyleBonus": 1},
    },
    {
        "id": "echo_spurs",
        "name": "Echo Spurs",
        "slot": "movement",
        "rarity": "uncommon",
        "tags": ["air", "beat"],
        "effect": "Adds aerial correction and accelerates grounded fuel recovery.",
        "iconAnimation": "echo_spurs_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "echo_spurs_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"airControlBonus": 0.08, "fuelRechargeBonus": 0.2},
    },
    {
        "id": "rail_heat_sink",
        "name": "Rail Heat Sink",
        "slot": "passive",
        "rarity": "rare",
        "tags": ["railgun", "cooldown"],
        "effect": "Shortens rail recovery and absorbs most firing recoil.",
        "iconAnimation": "rail_heat_sink_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "rail_heat_sink_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"railCooldownReduction": 0.14, "railRecoilReduction": 0.45},
    },
    {
        "id": "rootkit_badge",
        "name": "Rootkit Union Badge",
        "slot": "hack_combat",
        "rarity": "epic",
        "tags": ["hack", "solidarity"],
        "effect": "Reduces trace and routes successful hacks into close combat.",
        "iconAnimation": "rootkit_badge_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "rootkit_badge_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"traceReduction": 0.15, "hackChargesMelee": True, "parryDamageBonus": 0.2},
    },
    {
        "id": "shock_fern",
        "name": "Shock Fern Cutting",
        "slot": "boon",
        "rarity": "rare",
        "tags": ["emp", "garden"],
        "effect": "Seeds rail impacts with a short EMP bloom.",
        "iconAnimation": "shock_fern_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "shock_fern_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"empOnChargedShot": True, "railDamageBonus": 0.12},
    },
    {
        "id": "mirror_thread",
        "name": "Mirror Thread",
        "slot": "passive",
        "rarity": "epic",
        "tags": ["parry", "decoy"],
        "effect": "Widens the parry seam and leaves a false reflection after a dodge.",
        "iconAnimation": "mirror_thread_icon",
        "iconSheetId": "item_icons_extended",
        "pickupAnimation": "mirror_thread_pickup",
        "pickupSheetId": "items_extended",
        "effects": {"parryWindowBonus": 0.025, "decoyOnPerfectDodge": True},
    },
]

SKILL_ROWS = [
    ["double_swipe", "parry_tooth", "claw_rush", "undercut_audit", "peoples_finisher"],
    ["rail_mastery", "piercing_shot", "capacitor_ritual", "chain_conductor", "public_record"],
    ["fuel_sipper", "vector_kick", "badger_afterburn", "skyline_reversal", "communal_thrust"],
    ["street_syntax", "black_ice_bite", "ghost_invoice", "remote_arc", "public_exploit"],
]


def pixel_border(draw: ImageDraw.ImageDraw, accent: tuple[int, int, int, int]) -> None:
    draw.rectangle((2, 2, 29, 29), fill=INK, outline=MUTED, width=1)
    draw.line((5, 4, 26, 4), fill=accent, width=1)
    draw.point((4, 5), fill=accent)
    draw.point((27, 5), fill=accent)


def draw_capacitor(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.rectangle((9 + ox, 9 + oy, 22 + ox, 22 + oy), fill=MUTED, outline=CHROME)
    draw.rectangle((12 + ox, 7 + oy, 19 + ox, 24 + oy), fill=INK, outline=CYAN)
    draw.line((15 + ox, 8 + oy, 15 + ox, 23 + oy), fill=AMBER, width=2)
    draw.line((7 + ox, 15 + oy, 11 + ox, 15 + oy), fill=CYAN, width=2)
    draw.line((20 + ox, 15 + oy, 25 + ox, 15 + oy), fill=CYAN, width=2)


def draw_mantle(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.polygon([(16 + ox, 6 + oy), (24 + ox, 13 + oy), (22 + ox, 26 + oy), (16 + ox, 22 + oy), (10 + ox, 26 + oy), (8 + ox, 13 + oy)], fill=VIOLET, outline=CHROME)
    draw.polygon([(16 + ox, 8 + oy), (20 + ox, 13 + oy), (16 + ox, 16 + oy), (12 + ox, 13 + oy)], fill=INK, outline=CYAN)


def draw_lens(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.rectangle((7 + ox, 8 + oy, 20 + ox, 21 + oy), fill=CHROME, outline=AMBER)
    draw.line((10 + ox, 12 + oy, 17 + ox, 12 + oy), fill=INK)
    draw.line((10 + ox, 16 + oy, 16 + ox, 16 + oy), fill=INK)
    draw.ellipse((14 + ox, 13 + oy, 24 + ox, 23 + oy), fill=INK, outline=CYAN, width=2)
    draw.line((22 + ox, 22 + oy, 26 + ox, 26 + oy), fill=CYAN, width=2)


def draw_spurs(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.polygon([(7 + ox, 10 + oy), (15 + ox, 10 + oy), (17 + ox, 19 + oy), (24 + ox, 21 + oy), (22 + ox, 25 + oy), (10 + ox, 23 + oy)], fill=AMBER, outline=CHROME)
    draw.line((16 + ox, 15 + oy, 25 + ox, 12 + oy), fill=CYAN, width=2)
    draw.line((19 + ox, 10 + oy, 27 + ox, 8 + oy), fill=CYAN)


def draw_heat_sink(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.rectangle((7 + ox, 9 + oy, 24 + ox, 23 + oy), fill=MUTED, outline=CHROME)
    for x in (9, 13, 17, 21):
        draw.rectangle((x + ox, 6 + oy, x + 1 + ox, 25 + oy), fill=CYAN)
    draw.rectangle((5 + ox, 14 + oy, 26 + ox, 18 + oy), fill=INK, outline=AMBER)


def draw_badge(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.polygon([(16 + ox, 5 + oy), (25 + ox, 11 + oy), (22 + ox, 23 + oy), (16 + ox, 28 + oy), (10 + ox, 23 + oy), (7 + ox, 11 + oy)], fill=CYAN, outline=CHROME)
    draw.line((16 + ox, 9 + oy, 16 + ox, 22 + oy), fill=INK, width=2)
    draw.line((11 + ox, 15 + oy, 21 + ox, 15 + oy), fill=INK, width=2)
    draw.line((12 + ox, 22 + oy, 16 + ox, 18 + oy, 20 + ox, 22 + oy), fill=INK, width=2)


def draw_fern(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.line((15 + ox, 25 + oy, 17 + ox, 7 + oy), fill=CYAN, width=2)
    for y, dx in ((10, 5), (14, 7), (18, 6), (22, 4)):
        draw.line((16 + ox, y + oy, 16 - dx + ox, y - 3 + oy), fill=CYAN, width=2)
        draw.line((16 + ox, y + oy, 16 + dx + ox, y - 2 + oy), fill=AMBER, width=2)
    draw.line((21 + ox, 6 + oy, 18 + ox, 12 + oy, 22 + ox, 12 + oy, 18 + ox, 19 + oy), fill=CHROME, width=1)


def draw_thread(draw: ImageDraw.ImageDraw, ox: int = 0, oy: int = 0) -> None:
    draw.ellipse((8 + ox, 8 + oy, 23 + ox, 23 + oy), fill=CHROME, outline=VIOLET)
    draw.ellipse((12 + ox, 12 + oy, 19 + ox, 19 + oy), fill=INK, outline=CYAN)
    draw.line((19 + ox, 19 + oy, 27 + ox, 25 + oy), fill=MAGENTA, width=2)
    draw.line((23 + ox, 8 + oy, 25 + ox, 5 + oy), fill=CYAN)


ITEM_DRAWERS: list[Callable[[ImageDraw.ImageDraw, int, int], None]] = [
    draw_capacitor,
    draw_mantle,
    draw_lens,
    draw_spurs,
    draw_heat_sink,
    draw_badge,
    draw_fern,
    draw_thread,
]


def make_item_icon(drawer: Callable[[ImageDraw.ImageDraw, int, int], None], accent: tuple[int, int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (FRAME, FRAME), TRANSPARENT)
    draw = ImageDraw.Draw(image)
    pixel_border(draw, accent)
    drawer(draw, 0, 0)
    return image


def make_pickup_frame(
    drawer: Callable[[ImageDraw.ImageDraw, int, int], None],
    accent: tuple[int, int, int, int],
    frame: int,
) -> Image.Image:
    image = Image.new("RGBA", (FRAME, FRAME), TRANSPARENT)
    draw = ImageDraw.Draw(image)
    pulse = frame % 2
    y = -1 if frame in (1, 2) else 0
    draw.rectangle((4 - pulse, 4 - pulse, 27 + pulse, 27 + pulse), outline=(*accent[:3], 80), width=1)
    for x, yy in ((5, 16), (26, 12), (9, 27), (23, 5)):
        if (x + frame) % 2 == 0:
            draw.point((x, yy), fill=accent)
    drawer(draw, 0, y)
    return image


def skill_icon(track: int, tier: int) -> Image.Image:
    accents = [MAGENTA, CYAN, AMBER, VIOLET]
    accent = accents[track]
    image = Image.new("RGBA", (FRAME, FRAME), TRANSPARENT)
    draw = ImageDraw.Draw(image)
    pixel_border(draw, accent)

    if track == 0:
        draw.line((8, 22, 16, 8, 24, 22), fill=CHROME, width=3)
        draw.line((10, 20, 7, 13), fill=accent, width=2)
        draw.line((22, 20, 25, 13), fill=accent, width=2)
    elif track == 1:
        draw.rectangle((6, 13, 25, 18), fill=CHROME, outline=accent)
        draw.rectangle((10, 10, 18, 21), fill=INK, outline=accent)
        draw.line((20, 15, 28, 15), fill=accent, width=2)
    elif track == 2:
        draw.polygon([(16, 5), (22, 14), (19, 25), (13, 25), (10, 14)], fill=AMBER, outline=CHROME)
        draw.polygon([(16, 13), (19, 22), (16, 28), (13, 22)], fill=MAGENTA)
    else:
        draw.rectangle((7, 8, 24, 23), fill=INK, outline=accent, width=2)
        draw.line((10, 12, 14, 16, 10, 20), fill=CYAN, width=2)
        draw.line((17, 20, 22, 20), fill=CHROME, width=2)

    for mark in range(tier + 1):
        x = 8 + mark * 4
        draw.rectangle((x, 26, x + 2, 28), fill=accent)
    if tier >= 3:
        draw.point((26, 7), fill=CHROME)
        draw.point((27, 8), fill=accent)
    if tier == 4:
        draw.rectangle((5, 5, 27, 27), outline=accent)
    return image


def write_sheet(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=False)


def generate_images() -> None:
    item_icons = Image.new("RGBA", (FRAME * 4, FRAME * 2), TRANSPARENT)
    item_pickups = Image.new("RGBA", (FRAME * 4, FRAME * len(EXTENDED_ITEMS)), TRANSPARENT)
    accents = [CYAN, VIOLET, AMBER, BLUE, CYAN, CYAN, AMBER, MAGENTA]

    for index, (drawer, accent) in enumerate(zip(ITEM_DRAWERS, accents, strict=True)):
        item_icons.alpha_composite(make_item_icon(drawer, accent), ((index % 4) * FRAME, (index // 4) * FRAME))
        for frame in range(4):
            item_pickups.alpha_composite(
                make_pickup_frame(drawer, accent, frame),
                (frame * FRAME, index * FRAME),
            )

    skills = Image.new("RGBA", (FRAME * 5, FRAME * 4), TRANSPARENT)
    for row in range(4):
        for tier in range(5):
            skills.alpha_composite(skill_icon(row, tier), (tier * FRAME, row * FRAME))

    for directory in (SOURCE_ASSET_DIR, PUBLIC_ASSET_DIR):
        write_sheet(directory / "items_extended.png", item_pickups)
        write_sheet(directory / "item_icons_extended.png", item_icons)
        write_sheet(directory / "skill_icons.png", skills)


def update_items_manifest() -> None:
    path = DATA_DIR / "items.json"
    data = json.loads(path.read_text())
    items = data["items"]
    by_id = {item["id"]: item for item in items}
    for item in EXTENDED_ITEMS:
        if item["id"] in by_id:
            by_id[item["id"]].update(item)
        else:
            items.append(item)
    path.write_text(json.dumps(data, indent="\t") + "\n")


def sheet_definitions() -> list[dict]:
    item_pickup_animations = {}
    item_icon_animations = {}
    for index, item in enumerate(EXTENDED_ITEMS):
        item_pickup_animations[item["pickupAnimation"]] = {
            "frames": 4,
            "fps": 8,
            "anchor": [16, 16],
            "tags": ["pickup", "gear", *item["tags"]],
        }
        item_icon_animations[item["iconAnimation"]] = {
            "frames": 1,
            "fps": 1,
            "order": [index],
            "loop": False,
            "tags": ["ui", "icon", *item["tags"]],
        }

    skill_animations = {}
    for row, ids in enumerate(SKILL_ROWS):
        for tier, skill_id in enumerate(ids):
            skill_animations[f"{skill_id}_icon"] = {
                "frames": 1,
                "fps": 1,
                "order": [row * 5 + tier],
                "loop": False,
                "tags": ["ui", "skill", f"track:{row}", f"tier:{tier + 1}"],
            }

    return [
        {
            "id": "items_extended",
            "file": "assets/sprites/items_extended.png",
            "frameSize": [32, 32],
            "role": "pickup",
            "animations": item_pickup_animations,
        },
        {
            "id": "item_icons_extended",
            "file": "assets/sprites/item_icons_extended.png",
            "frameSize": [32, 32],
            "grid": {"columns": 4, "rows": 2},
            "role": "ui_icons",
            "animations": item_icon_animations,
        },
        {
            "id": "skill_icons",
            "file": "assets/sprites/skill_icons.png",
            "frameSize": [32, 32],
            "grid": {"columns": 5, "rows": 4},
            "role": "skill_ui",
            "animations": skill_animations,
        },
    ]


def update_sprite_manifest() -> None:
    path = DATA_DIR / "sprites.json"
    data = json.loads(path.read_text())
    sheets = data["sheets"]
    replacements = {sheet["id"]: sheet for sheet in sheet_definitions()}
    retained = [sheet for sheet in sheets if sheet["id"] not in replacements]
    insert_at = next((index + 1 for index, sheet in enumerate(retained) if sheet["id"] == "item_icons"), len(retained))
    for sheet in reversed(list(replacements.values())):
        retained.insert(insert_at, sheet)
    data["sheets"] = retained
    path.write_text(json.dumps(data, indent="\t") + "\n")
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, PUBLIC_DATA_DIR / "sprites.json")


def main() -> None:
    generate_images()
    update_items_manifest()
    update_sprite_manifest()
    print("generated progression sprites: items_extended, item_icons_extended, skill_icons")


if __name__ == "__main__":
    main()
