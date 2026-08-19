#!/usr/bin/env python3
"""Generate the Badger Sprawl Runner production-art review and render prompt pack.

The generated prompts deliberately use render jobs no larger than four cells per
side. Final runtime atlases are assembled from those small jobs according to the
machine-readable index in docs/sprite-production/prompt-index.yml.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import struct
import tempfile
import textwrap
from collections import Counter
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_OUT = ROOT / "docs" / "sprite-production"
OUT = CANONICAL_OUT
CURRENT = OUT / "prompts" / "current"
EXPANSION = OUT / "prompts" / "expansion"
MANIFEST_PATH = ROOT / "data" / "sprites.json"
STORY_PATH = ROOT / "docs" / "story-flavour.yml"
GAPS_PATH = ROOT / "docs" / "sprite-production" / "remaining-gaps.yml"
RENDER_JOBS = OUT / "render-jobs"
RENDER_MANIFEST_NAME = "manifest.json"
RENDER_INDEX_NAME = "INDEX.md"
CORPUS_VERSION = 2


def configure_output(output: Path) -> None:
    global OUT, CURRENT, EXPANSION, RENDER_JOBS
    OUT = output
    CURRENT = OUT / "prompts" / "current"
    EXPANSION = OUT / "prompts" / "expansion"
    RENDER_JOBS = OUT / "render-jobs"


def canonical_prompt_path(path: Path) -> str:
    relative = path.relative_to(OUT)
    return str((CANONICAL_OUT / relative).relative_to(ROOT))


def prompt_link_path(prompt_file: str) -> Path:
    return (ROOT / prompt_file).relative_to(CANONICAL_OUT)


def output_prompt_path(prompt_file: str) -> Path:
    relative = (ROOT / prompt_file).relative_to(CANONICAL_OUT)
    return OUT / relative


def prompt_blocks(content: str) -> list[str]:
    return [
        block.strip()
        for block in re.findall(r"```text\n(.*?)\n```", content, flags=re.S)
    ]


def job_frame_count(job: dict[str, Any]) -> int:
    frames = job.get("frames")
    if isinstance(frames, int) and frames > 0:
        return frames
    grid = job.get("grid") or {}
    columns = int(grid.get("columns", 1))
    rows = int(grid.get("rows", 1))
    return columns * rows


def infer_animation_class(category_name: str, animation_state: str) -> str:
    key = animation_state.lower()
    category_key = category_name.lower()
    if "tile" in category_key or "world" in category_key:
        if any(
            token in key
            for token in ("hazard", "vent", "laser", "arc", "leak", "tripline")
        ):
            return "hazard_tile"
        if any(
            token in key
            for token in ("terminal", "gate", "switch", "relay", "scanner", "router")
        ):
            return "interactive_tile"
        if "parallax" in key or "plate" in key or "background" in key:
            return "environment_plate"
        return "environment_tile"
    if "vfx" in category_key:
        return "effect"
    if "portrait" in category_key:
        return "portrait"
    if "ui" in category_key or "icon" in key:
        return "ui_icon"
    if any(
        token in key
        for token in ("idle", "talk", "react", "victory", "defeat", "intro", "taunt")
    ):
        return "presentation"
    if any(
        token in key
        for token in (
            "run",
            "walk",
            "move",
            "jump",
            "fall",
            "land",
            "dash",
            "boost",
            "climb",
            "ledge",
            "slide",
            "roll",
        )
    ):
        return "locomotion"
    if any(
        token in key
        for token in (
            "attack",
            "melee",
            "claw",
            "katana",
            "shoot",
            "parry",
            "windup",
            "stun",
            "hurt",
        )
    ):
        return "combat"
    if any(token in key for token in ("pickup", "item", "interact", "hack", "assist")):
        return "interaction"
    return "sprite_animation"


def hydrate_job_prompts(entries: list[dict[str, Any]], scope: str) -> None:
    for entry in entries:
        prompt_file = entry["prompt_file"]
        content = output_prompt_path(prompt_file).read_text(encoding="utf-8")
        blocks = prompt_blocks(content)
        jobs = entry.get("jobs", [])
        if len(blocks) != len(jobs):
            raise ValueError(
                f"Prompt block mismatch in {prompt_file}: found {len(blocks)}, expected {len(jobs)}"
            )
        entry_id = str(entry.get("sheet_id") or entry.get("template_id"))
        category_name = str(entry.get("category") or "uncategorized")
        source_class = (
            "remaining_gap_catalog"
            if category_name.endswith("_gap")
            else ("current_manifest" if scope == "current" else "expansion_template")
        )
        atlas_family = str(entry.get("target_atlas") or entry_id)
        for job, prompt in zip(jobs, blocks, strict=True):
            animation_state = str(
                job.get("animation")
                or ",".join(str(value) for value in job.get("animations", []))
                or job["id"]
            )
            job["_prompt"] = prompt
            job.setdefault("animation_state", animation_state)
            job.setdefault(
                "animation_class", infer_animation_class(category_name, animation_state)
            )
            job.setdefault("atlas_family", atlas_family)
            job.setdefault("runtime_clip", f"{scope}:{entry_id}:{animation_state}")
            job.setdefault("source_class", source_class)
            job.setdefault("review_state", "pending_render")
            job["frames"] = job_frame_count(job)
            job["scope"] = scope
            job["source_entry"] = entry_id
            job["source_prompt_file"] = prompt_file
            job["category"] = category_name
            job["world"] = entry.get("world")
            if entry.get("target_atlas"):
                job["target_atlas"] = entry["target_atlas"]


def strip_private(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: strip_private(item)
            for key, item in value.items()
            if not str(key).startswith("_")
        }
    if isinstance(value, list):
        return [strip_private(item) for item in value]
    return value


STYLE_REFERENCE = "operator-approved six-image neon-animal pixel-art board, supplied 2026-07-21"
STYLE_REFERENCE_IMAGES = (
    "assets/sprites/moss_badger_production.png",
    "generated/sprite-visual-review/badger-sprite-contact-sheet.png",
)
STYLE_CORE = (
    "When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language "
    "reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss "
    "production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for "
    "broader motion and pixel-cluster continuity. "
    "Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, "
    "dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective "
    "neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent "
    "hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, "
    "anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, "
    "no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame "
    "from either reference image."
)
TECH_ENTITY = (
    "Orthographic side-view 2D platform-game camera, facing right unless the action requires a neutral frontal beat. "
    "Keep character identity, costume, palette, scale, camera, lighting, pixel density, and ground anchor identical "
    "in every cell. Full body and all important equipment must remain inside each cell. Use true alpha transparency."
)
TECH_GRID = (
    "Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, "
    "labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom."
)
NEGATIVE = (
    "Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, "
    "cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or "
    "unrequested cast shadows outside the frame."
)

WORLD_STYLE = {
    "lower_sprawl": "rain-slick undercity alleys, debt gates, brick, wet asphalt, food stalls, cable nests, improvised neon and rusty drainage",
    "drainmarket": "subterranean clinic bazaar, sump brick, medicine stalls, patched tubing, wet grates, leaking valves and mutual-aid caches",
    "chrome_arcology": "sterile luxury tower, chrome floors, glass lattice, elevator rails, indoor gardens, hidden maintenance and polished coercion",
    "straylight_mirage": "orbital mirror palace, false doors, glass floors, violet space, banquet luxury, zero-gravity fountains and deceptive reflections",
    "mirror_palace": "superseded mirror-palace variant of Straylight Mirage, black glass, violet cosmos, chandeliers and false architectural reflections",
    "dub_colony": "warm mobile maker colony, speakerstone, cable vines, studio machinery, greenhouse train cars, solar cloth and communal repair culture",
    "antenna_barrens": "wind-scoured uplink desert, rust plates, wire bridges, dead dishes, battery towers, signal snow, chalk logic and lightning",
    "orbital_lift": "vertical logistics cathedral, cargo straps, lift grating, vacuum doors, counterweights, scanner machinery and Earth-horizon space",
    "asteroid_redoubt": "low-gravity rebel outpost, regolith blocks, transmitter roots, cargo crates, radio shrines, solar foil and public murals",
}

WORLD_PALETTE = {
    "lower_sprawl": "indigo rain shadows, cyan and magenta neon, rust orange, dirty yellow, wet charcoal",
    "drainmarket": "deep teal, clinic green, warning red, violet UV light, rust brown, damp charcoal",
    "chrome_arcology": "cold cyan, polished silver, white-blue light, restrained gold, deep navy reflections",
    "straylight_mirage": "violet, cobalt, black glass, silver, magenta refraction, sparse warm banquet gold",
    "mirror_palace": "black glass, ultraviolet purple, silver, cobalt, pale cyan and fracture-white",
    "dub_colony": "warm amber, red, leaf green, bass purple, cyan electronics, soot-black shadows",
    "antenna_barrens": "sun-faded ochre, rust red, electric cyan, storm violet, black cable and lightning white",
    "orbital_lift": "white-gold machinery, scanner blue, black space, hazard orange, cargo red and steel grey",
    "asteroid_redoubt": "regolith grey, rebel red, solar gold, transmitter cyan, greenhouse green and void black",
}

# Concrete full-scope enemy roster missing from the current two-enemies-per-world manifest.
EXPANSION_ENEMIES = [
    (
        "lower_sprawl",
        "bailiff_scooter",
        "Bailiff Scooter",
        "jumper/rusher",
        "armored scooter crossing gaps at speed",
        "straight ram and baton swipe",
        "jump, traffic-light hack, rear rail shot",
    ),
    (
        "lower_sprawl",
        "signboard_sniper",
        "Signboard Sniper",
        "turret",
        "roof camper behind a neon sign",
        "slow telegraphed aimed shot",
        "drop the sign, rocket route, rail countershot",
    ),
    (
        "lower_sprawl",
        "debt_printer_imp",
        "Debt Printer Imp",
        "caster",
        "cowardly printer creature hiding behind platforms",
        "paper-warrant traps and receipt snares",
        "rush, overload printer, cut paper stream",
    ),
    (
        "lower_sprawl",
        "fuse_monk",
        "Fuse Monk",
        "shield/caster",
        "slow robed utility worker guarding wet wires",
        "electrified staff and grounding seal",
        "parry, wet-gutter lightning, syntax interrupt",
    ),
    (
        "lower_sprawl",
        "drone_kennel_master",
        "Drone Kennel-Master",
        "sub-boss",
        "armored handler carrying a portable drone kennel",
        "locks exits and releases attack drones",
        "hack kennel door and reverse the spawn",
    ),
    (
        "lower_sprawl",
        "toll_rat",
        "Toll Rat",
        "walker",
        "small fluorescent-vest toll worker patrolling ledges",
        "quick bite and coin swipe",
        "claw, jump, trap",
    ),
    (
        "lower_sprawl",
        "cable_crawler",
        "Cable Crawler",
        "ceiling jumper",
        "long-limbed crawler using overhead cable nests",
        "drops live wire loops",
        "hook claw, pistol, hacked gutter",
    ),
    (
        "drainmarket",
        "syringe_skater",
        "Syringe Skater",
        "jumper",
        "clinic courier skating on capped syringe rails",
        "needle dash and tracking-dye splash",
        "parry, grate trap, signal jammer",
    ),
    (
        "drainmarket",
        "invoice_leech",
        "Invoice Leech",
        "swarm",
        "paper-and-rubber medical billing parasite",
        "attaches and drains healing charge",
        "wide slash, EMP, mutual-aid terminal",
    ),
    (
        "drainmarket",
        "triage_turret",
        "Triage Turret",
        "turret",
        "improvised clinic scanner on rolling IV legs",
        "marks targets and launches sedative darts",
        "spoof triage priority, railgun, cover",
    ),
    (
        "drainmarket",
        "rubber_glove_wraith",
        "Rubber-Glove Wraith",
        "caster",
        "floating surgical glove spirit with red tracking dye",
        "grabs and slows from midrange",
        "cut tether, decode tag, electric grate",
    ),
    (
        "chrome_arcology",
        "glass_intern",
        "Glass Intern",
        "walker",
        "overworked junior in translucent office armor",
        "clipboard jab and panic shove",
        "knock into glass, talk-down, slippery floor",
    ),
    (
        "chrome_arcology",
        "reception_lancer",
        "Reception Lancer",
        "assassin",
        "immaculate lobby guard with telescoping spear",
        "precise platform-lip dash",
        "katana spacing, bait thrust, elevator switch",
    ),
    (
        "chrome_arcology",
        "holo_gardener",
        "Holo-Gardener",
        "caster",
        "maintenance gardener teleporting between planters",
        "thorn drones and root snare",
        "water-pipe hack, rail through plants",
    ),
    (
        "chrome_arcology",
        "contract_lawyer_bot",
        "Contract Lawyer Bot",
        "caster",
        "floating legal machine retreating behind contract ribbons",
        "binding clause zones",
        "syntax parry and close interrupt",
    ),
    (
        "chrome_arcology",
        "panic_siren",
        "Panic Siren",
        "runner/turret",
        "small alarm machine fleeing across platforms",
        "heat-raising pulse and drone call",
        "signal jammer, route cut-off",
    ),
    (
        "chrome_arcology",
        "glass_janitor",
        "Glass Janitor",
        "walker/hazard",
        "polished cleaning automaton with broad squeegee arms",
        "sweeps player and leaves slippery floor",
        "jump timing, overload cleaning tank",
    ),
    (
        "chrome_arcology",
        "drone_wasp_queen",
        "Drone Wasp Queen",
        "flyer/sub-boss",
        "luxury-garden wasp queen drone",
        "spawns memo wasps and pollen lasers",
        "railgun, terminal overload, water mist",
    ),
    (
        "straylight_mirage",
        "reflection_hound",
        "Reflection Hound",
        "jumper",
        "sleek mirror animal matching player jumps",
        "bite emerging from mirrored side",
        "fake-out movement and shadow strike",
    ),
    (
        "straylight_mirage",
        "prism_duelist",
        "Prism Duelist",
        "assassin",
        "faceted midrange blade fighter",
        "delayed refracted slash",
        "katana parry and spacing",
    ),
    (
        "straylight_mirage",
        "etiquette_blade",
        "Etiquette Blade",
        "shield",
        "formal servant sword-machine that bows before attacking",
        "countercut punishing spam",
        "wait for bow, parry late",
    ),
    (
        "straylight_mirage",
        "debt_harpist",
        "Debt Harpist",
        "caster",
        "masked musician anchored to a glass harp",
        "rhythm shockwave chords",
        "bass shield, cut strings, interrupt downbeat",
    ),
    (
        "straylight_mirage",
        "vacuum_porter",
        "Vacuum Porter",
        "turret",
        "orbital hotel porter with pressure-hose luggage rig",
        "pull and push vent zones",
        "reverse vent control",
    ),
    (
        "straylight_mirage",
        "window_saint",
        "Window Saint",
        "caster",
        "holographic saint framed by false windows",
        "creates fake floors and glass sermons",
        "railgun reveals real platform",
    ),
    (
        "straylight_mirage",
        "mirror_guard_pair",
        "Mirror Guard Pair",
        "sub-boss",
        "paired guards sharing one reflected silhouette",
        "pincer teleport and clone strike",
        "hack mirror anchor and hit real shadow",
    ),
    (
        "dub_colony",
        "bass_beetle",
        "Bass Beetle",
        "jumper",
        "speaker-shelled beetle hopping on the beat",
        "downbeat body slam",
        "offbeat jump or parry",
    ),
    (
        "dub_colony",
        "echo_drummer",
        "Echo Drummer",
        "turret",
        "stationary drummer machine with ring-shaped speakers",
        "concentric rhythm shockwaves",
        "downbeat guard and speaker hack",
    ),
    (
        "dub_colony",
        "feedback_cobra",
        "Feedback Cobra",
        "walker/caster",
        "cable-bodied cobra moving in a sine wave",
        "sonic spit and feedback coil",
        "speaker overload, rail, rhythm dodge",
    ),
    (
        "dub_colony",
        "tape_priestess",
        "Tape Priestess",
        "caster",
        "robed archivist wrapped in magnetic tape",
        "rewinds hazards and loops damage zones",
        "cut reels, hack loop head",
    ),
    (
        "dub_colony",
        "mold_angel",
        "Mold Angel",
        "flyer",
        "greenhouse protector with fungal wings",
        "pollen cloud and seed dive",
        "nonlethal route, airflow hack",
    ),
    (
        "dub_colony",
        "amp_golem",
        "Amp Golem",
        "heavy",
        "massive worker-built amplifier body",
        "slam shockwave and wall pressure",
        "bait into feedback trap",
    ),
    (
        "dub_colony",
        "static_choir",
        "Static Choir",
        "swarm",
        "small linked singers sharing cable halos",
        "group chorus shove",
        "area attack, bass counter",
    ),
    (
        "dub_colony",
        "rival_selector",
        "Rival Selector",
        "sub-boss/caster",
        "platform DJ controlling hostile speaker stacks",
        "summons beat hazards",
        "hack speakers and win rhythm exchange",
    ),
    (
        "antenna_barrens",
        "spark_jackal",
        "Spark Jackal",
        "jumper",
        "lean jackal zigzagging between pylons",
        "electric bite and charged landing",
        "wet ground, trap bait",
    ),
    (
        "antenna_barrens",
        "wire_witch",
        "Wire Witch",
        "caster/flyer",
        "hovering cable-worker silhouette with lightning threads",
        "thread lightning and tether cage",
        "cut or ground cable",
    ),
    (
        "antenna_barrens",
        "dish_climber",
        "Dish-Climber",
        "vertical walker",
        "climber gripping antenna masts with four tool arms",
        "throws bolts from walls",
        "rail knockdown and cable cut",
    ),
    (
        "antenna_barrens",
        "regex_fox",
        "Regex Fox",
        "caster/assassin",
        "fox warping between terminals in bracket-shaped glitches",
        "malformed prompt traps",
        "correct syntax creates punish window",
    ),
    (
        "antenna_barrens",
        "packet_butcher",
        "Packet Butcher",
        "heavy/caster",
        "broad butcher carrying a pixel cleaver and data sacks",
        "compile windup into packet cleave",
        "interrupt compile",
    ),
    (
        "antenna_barrens",
        "null_monk",
        "Null Monk",
        "shield",
        "silent robed figure with Faraday-ring beads",
        "anti-hack silence field",
        "pure melee inside field",
    ),
    (
        "antenna_barrens",
        "signal_leech",
        "Signal Leech",
        "swarm",
        "small wall parasite with antenna mouth",
        "drains hack charge",
        "bass pulse and scrape attack",
    ),
    (
        "orbital_lift",
        "strap_hook_twin",
        "Strap-Hook Twin",
        "jumper",
        "paired cargo acrobats swinging from straps",
        "crossing hook slashes",
        "hook-blade counter and route reversal",
    ),
    (
        "orbital_lift",
        "stamp_golem",
        "Stamp Golem",
        "heavy",
        "cargo-stamp machine walking on piston legs",
        "bureaucratic slam and seal shockwave",
        "scanner hack marks weak point",
    ),
    (
        "orbital_lift",
        "sniffer_cherub",
        "Sniffer Cherub",
        "flyer",
        "small customs drone with sensor nose and cable wings",
        "alarm sniff and marking beam",
        "signal jammer blinds",
    ),
    (
        "orbital_lift",
        "gravity_customs",
        "Gravity Customs",
        "caster",
        "customs official machine carrying a rotating gravity stamp",
        "flips room gravity and stamp shock",
        "syntax hack locks gravity",
    ),
    (
        "orbital_lift",
        "wind_lancer",
        "Wind Lancer",
        "assassin/flyer",
        "exterior cable duelist with aerodynamic lance",
        "high-speed dive lance",
        "rail timing and katana parry",
    ),
    (
        "orbital_lift",
        "maintenance_choir",
        "Maintenance Choir",
        "swarm/caster",
        "repair drones singing around a lead unit",
        "repairs hazards and armor",
        "interrupt lead singer",
    ),
    (
        "orbital_lift",
        "debt_paladin",
        "Debt Paladin",
        "shield/heavy",
        "armored guard carrying prisoner-manifest shield",
        "oath strike and shield wall",
        "dialogue flag, rear attack, scanner proof",
    ),
    (
        "asteroid_redoubt",
        "rock_mite",
        "Rock Mite",
        "swarm",
        "low-gravity mineral mite crawling ceilings",
        "pebble bite and falling grit",
        "gravity flip scatters",
    ),
    (
        "asteroid_redoubt",
        "drill_hermit",
        "Drill Hermit",
        "heavy",
        "solitary miner fused to a worn drill rig",
        "tunnel charge and debris burst",
        "bait into brittle wall",
    ),
    (
        "asteroid_redoubt",
        "airlock_nun",
        "Airlock Nun",
        "caster",
        "pressure-door keeper in patched vacuum robes",
        "air burst and door lock",
        "hack pressure state",
    ),
    (
        "asteroid_redoubt",
        "hull_spider",
        "Hull Spider",
        "jumper/ceiling",
        "six-legged repair spider with web-mine spool",
        "wall pursuit and web mines",
        "rail breaks anchor",
    ),
    (
        "asteroid_redoubt",
        "oxygen_clerk",
        "Oxygen Clerk",
        "shield/caster",
        "ledger clerk with tank shield and meter visor",
        "taxes air pockets with suffocation field",
        "expose false ledger entry",
    ),
    (
        "asteroid_redoubt",
        "ammunition_ghost",
        "Ammunition Ghost",
        "flyer",
        "spectral foundry worker haunting shell casings",
        "explosive pass and shell possession",
        "nonlethal bass banish",
    ),
    (
        "asteroid_redoubt",
        "traitor_mask",
        "Traitor Mask",
        "assassin/caster",
        "friendly-looking mask projection over a hidden attacker",
        "backstab and false prompt",
        "trust flags reveal outline",
    ),
    (
        "asteroid_redoubt",
        "riot_drone_choir",
        "Riot Drone Choir",
        "swarm/flyer",
        "coordinated final-broadcast security drones",
        "synchronized bolts and formation wall",
        "companion chorus counter",
    ),
    (
        "asteroid_redoubt",
        "clause_serpent",
        "Clause Serpent",
        "caster",
        "long contract-code serpent around ledger platforms",
        "binding bite and coil",
        "rewrite clause breaks coil",
    ),
    (
        "asteroid_redoubt",
        "archive_twin",
        "Archive Twin",
        "assassin/caster",
        "paired editors, one attacks while one rewrites",
        "dual slash and state edit",
        "hit real editor first",
    ),
    (
        "asteroid_redoubt",
        "redaction_nun",
        "Redaction Nun",
        "shield",
        "black-bar robed censor with broad deletion blade",
        "deletes platforms with sweep",
        "broadcast light restores",
    ),
    (
        "asteroid_redoubt",
        "star_lancer",
        "Star Lancer",
        "assassin",
        "final ascent duelist with star-point lance",
        "telegraphed star dash",
        "parry into rail punish",
    ),
    (
        "asteroid_redoubt",
        "angel_fragment",
        "Angel Fragment",
        "caster",
        "broken cable-halo obedience logic",
        "schedule beams and cargo hooks",
        "prove schedule contradiction",
    ),
    (
        "asteroid_redoubt",
        "fox_fragment",
        "Fox Fragment",
        "caster",
        "crystalline malformed echo of Black-Ice Fox",
        "corrupt state clones",
        "perfect syntax heals and exposes",
    ),
]

PLAYER_EXPANSION_PACKS = {
    "locomotion_and_stealth": [
        (
            "crouch_idle",
            4,
            "low compact breathing pose, ears and coat kept below cover line",
        ),
        ("crouch_move", 6, "quiet heel-to-toe crouch walk with stable head height"),
        (
            "slide",
            6,
            "run-to-knee slide, sparks, low travel silhouette, recover to crouch",
        ),
        (
            "dodge_roll",
            8,
            "anticipation, tucked roll, inverted midpoint, clean foot recovery",
        ),
        (
            "wall_cling",
            4,
            "claws braced on wall, controlled downward slip, tail balancing",
        ),
        (
            "wall_climb",
            8,
            "alternating claw pulls and boot pushes, stable wall contact",
        ),
        ("ledge_hang", 4, "two-hand hang, one-hand strain, look up, stable grip"),
        ("ledge_climb", 8, "pull chest to lip, knee plant, weight transfer, stand"),
    ],
    "claw_mastery": [
        ("double_swipe", 8, "two distinct claw strikes with readable reset seam"),
        ("hook_claw", 6, "upward hook, catch, pull-down follow-through"),
        ("burrow_uppercut", 6, "low compression into rising claw launcher"),
        ("falling_rake", 6, "airborne downward rake with compact diagonal smear"),
        ("wall_scratch", 4, "wall strike that briefly stalls vertical fall"),
        (
            "peoples_finisher",
            12,
            "high-commitment communal finisher with strong anticipation and non-gory impact",
        ),
    ],
    "blade_styles": [
        ("katana_step_cut", 6, "forward step, draw cut, clean recovery"),
        ("katana_rising_cut", 6, "low draw into anti-air crescent"),
        ("katana_falling_moon", 8, "airborne turn into descending slash and landing"),
        ("machete_wide_sweep", 8, "heavy practical crowd-clearing arc"),
        ("mono_saber_armor_cut", 8, "hot anti-armor cut with heat buildup"),
        ("hook_blade_pull", 8, "cast hook, catch, pull target or Moss, recover"),
        ("baton_blade_stun", 6, "nonlethal guard strike and stun pulse"),
    ],
    "gun_styles": [
        ("shock_pistol_fire", 6, "quick aim, two-shot interrupt burst, compact recoil"),
        ("scatter_coil_fire", 8, "close blast, large recoil, pump/reload recovery"),
        ("nail_smg_burst", 8, "controlled three-stage burst with rising recoil"),
        ("harpoon_line_fire", 8, "aim, fire line, tension, pull, release"),
        ("signal_launcher_fire", 8, "launch hack capsule, remote trigger gesture"),
        (
            "railgun_perfect_reload",
            8,
            "open, eject, charge alignment, perfect sweet-spot lock",
        ),
    ],
    "hacking_and_interaction": [
        ("terminal_stand_hack", 6, "standing rapid input with whisker data pulse"),
        ("remote_tap", 4, "one-handed remote hack gesture and confirmation"),
        ("syntax_parry", 6, "deflect coded attack and reveal valid token"),
        ("terminal_overload", 8, "route energy, brace, trigger overload, recoil"),
        ("trap_reverse", 6, "point to hazard, retarget, confirm hacked ownership"),
        ("companion_signal", 6, "clear hand signal for ally assist"),
        ("nonlethal_takedown", 8, "controlled disarm and knockdown without gore"),
    ],
}

WEAPON_ITEMS = [
    (
        "machete",
        "worn broad survival blade with cable-cutting notch",
        "rust orange and steel",
    ),
    (
        "mono_saber",
        "illegal high-tech saber with exposed heat spine",
        "cyan-white core and warning red",
    ),
    (
        "hook_blade",
        "curved hook weapon with retractable line spool",
        "yellow steel and violet cable",
    ),
    (
        "baton_blade",
        "nonlethal security baton opening into short blade",
        "blue-white stun nodes",
    ),
    (
        "shock_pistol",
        "compact interrupt pistol with twin capacitor prongs",
        "electric cyan and acid green",
    ),
    (
        "scatter_coil",
        "short heavy coil shotgun with two-cell chamber",
        "orange coils and black steel",
    ),
    ("nail_smg", "scrappy suppressive nail launcher", "red magazine and steel grey"),
    (
        "harpoon_line",
        "movement harpoon pistol with visible cable drum",
        "yellow hook and cyan line",
    ),
    (
        "signal_launcher",
        "long hack-projectile launcher with antenna barrel",
        "violet data glow and green status light",
    ),
]


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def title(text: str) -> str:
    return text.replace("_", " ").replace("-", " ").title()


def clean_prompt(text: str) -> str:
    text = re.sub(r"generated image:\s*", "", text, flags=re.I)
    text = re.sub(r"plain white background\.?", "", text, flags=re.I)
    text = re.sub(
        r"transparent background unless a background\.?", "", text, flags=re.I
    )
    text = re.sub(r"2D side-scrolling platformer asset;?", "", text, flags=re.I)
    text = re.sub(r"strong readable silhouette;?", "", text, flags=re.I)
    text = re.sub(r"chunky pixel-paint texture;?", "", text, flags=re.I)
    text = re.sub(r"cyber-noir dub-punk palette;?", "", text, flags=re.I)
    text = re.sub(r"game-ready;?", "", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip(" ;.")


def png_size(path: Path) -> tuple[int, int] | None:
    if not path.exists():
        return None
    with path.open("rb") as handle:
        signature = handle.read(24)
    if len(signature) >= 24 and signature[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", signature[16:24])
    return None


def category(sheet: dict[str, Any]) -> str:
    sid = sheet["id"]
    role = sheet.get("role")
    if sid.startswith("enemy_"):
        return "enemies"
    if sid.startswith("boss_"):
        return "bosses"
    if sid.startswith("character_"):
        return "characters"
    if role == "tiles" or sid.endswith("_tiles"):
        return "worlds"
    if (
        role in {"parallax", "backdrop"}
        or sid.endswith("_parallax")
        or sid.endswith("_backdrop")
    ):
        return "worlds"
    if sid.startswith("moss_badger"):
        return "player"
    if "item" in sid or sid == "items_core":
        return "items"
    if sid == "skill_icons":
        return "ui"
    if sid.startswith("vfx_"):
        return "vfx"
    return "misc"


def sheet_status(sheet: dict[str, Any]) -> str:
    if str(sheet.get("role", "")).startswith("planned"):
        return "planned_full_scope"
    if sheet["id"] == "comfy_badger_run_grid":
        return "archival_source"
    if sheet["id"] == "mirror_palace_parallax":
        return "superseded_archive"
    if sheet["id"] == "moss_badger":
        return "authored_source_template"
    return "production_target"


def identity_for(sheet: dict[str, Any]) -> str:
    source_prompt = clean_prompt(str(sheet.get("sourcePrompt") or ""))
    source_desc = clean_prompt(
        str((sheet.get("source") or {}).get("description") or "")
    )
    source_name = str(sheet.get("sourceName") or "").strip()
    sid = sheet["id"]
    if sid.startswith("moss_badger"):
        return (
            "Moss, an anthropomorphic badger courier: black-white badger facial mask, patched dark courier coat, "
            "cargo trousers, sturdy boots, claw wraps, compact tail, chrome wetware whiskers, small pirate-radio "
            "antenna details, determined dry expression"
        )
    if source_prompt:
        return f"{source_name + ': ' if source_name else ''}{source_prompt}"
    if source_desc:
        return source_desc
    return title(sid)


def world_for(sheet: dict[str, Any]) -> str | None:
    return (
        sheet.get("world")
        or (sheet.get("sourceChapter") or "")
        .removeprefix("ch01_")
        .removeprefix("ch02_")
        .removeprefix("ch03_")
        .removeprefix("ch04_")
        .removeprefix("ch05_")
        .removeprefix("ch06_")
        .removeprefix("ch07_")
        .removeprefix("ch08_")
        or None
    )


def grid_for_frames(frames: int) -> tuple[int, int]:
    if frames <= 0 or frames > 16:
        raise ValueError(f"unsupported render-job frame count: {frames}")
    columns = min(4, frames)
    rows = math.ceil(frames / columns)
    if columns > 4 or rows > 4:
        raise ValueError(f"render grid exceeds four cells per side: {columns}x{rows}")
    return columns, rows


def animation_arc(name: str, frames: int) -> list[str]:
    key = name.lower()
    explicit = {
        "run": [
            "left-foot contact",
            "compression",
            "passing pose",
            "push-off",
            "right-foot contact",
            "compression",
            "passing pose",
            "push-off",
        ],
        "patrol_or_move": [
            "contact",
            "compression",
            "passing",
            "opposite contact",
            "compression",
            "passing",
        ],
        "idle": [
            "neutral",
            "inhale",
            "secondary detail",
            "exhale",
            "weight shift",
            "return",
        ],
        "skid": ["brake begins", "maximum lean with sparks", "recover balance"],
        "jump_up": ["launch crouch", "takeoff extension", "rising pose"],
        "fall": ["apex release", "fall spread", "fast-fall streamline"],
        "land": ["impact squash", "recovery"],
        "hurt": ["impact recoil", "recover silhouette"],
        "stun_or_parried": ["parry impact", "open stunned posture", "shaking recovery"],
        "parry": ["guard ready", "contact flash", "deflection", "recovery"],
        "pickup_react": [
            "notice pickup",
            "quick delighted/alert reaction",
            "return to ready",
        ],
        "interact": ["reach", "contact", "operate", "release"],
        "talk": [
            "neutral speaking pose",
            "open gesture",
            "accent gesture",
            "listening beat",
            "reply",
            "return",
        ],
        "assist": [
            "notice need",
            "prepare tool/power",
            "active assist",
            "effect peak",
            "follow-through",
            "return",
        ],
        "react": ["notice", "strong reaction", "settle", "return"],
        "exit": [
            "turn",
            "first step",
            "move away",
            "final trailing pose",
            "clear frame",
            "transparent hold",
        ],
    }
    if key in explicit:
        base = explicit[key]
        return (base + [base[-1]] * frames)[:frames]
    if "death" in key or "defeat" in key or "down" in key:
        stages = [
            "fatal/stagger impact",
            "lose balance",
            "fall begins",
            "body descends",
            "ground contact",
            "settled defeated pose",
            "effect fade",
            "still pose",
            "still pose",
            "final hold",
        ]
        return stages[:frames]
    if (
        "attack" in key
        or "melee" in key
        or "shoot" in key
        or "boost" in key
        or "hack" in key
        or "windup" in key
    ):
        stages = [
            "clear anticipation",
            "energy or body acceleration",
            "active action begins",
            "maximum active silhouette",
            "impact or effect peak",
            "follow-through",
            "recovery begins",
            "guarded recovery",
            "reset",
            "final hold",
            "final hold",
            "final hold",
        ]
        return stages[:frames]
    if "phase_intro" in key:
        stages = [
            "dormant threat",
            "recognition",
            "power wakes",
            "silhouette expands",
            "phase motif appears",
            "energy peak",
            "challenge pose",
            "ready stance",
        ]
        return stages[:frames]
    if "phase_transition" in key:
        stages = [
            "recoil from old phase",
            "systems destabilize",
            "motif breaks",
            "new motif emerges",
            "body reconfigures",
            "power surge",
            "new stance",
            "ready",
        ]
        return stages[:frames]
    if "victory" in key:
        stages = [
            "relief",
            "fist lift",
            "full victory pose",
            "antenna flourish",
            "hold",
            "small secondary motion",
            "return accent",
            "final hold",
        ]
        return stages[:frames]
    generic = [
        "key pose",
        "anticipation",
        "active change",
        "peak",
        "follow-through",
        "recover",
        "secondary motion",
        "return",
        "hold",
        "hold",
        "hold",
        "hold",
    ]
    return generic[:frames]


def prompt_header(
    name: str,
    columns: int,
    rows: int,
    cell_w: int,
    cell_h: int,
    background: str = "transparent",
) -> str:
    return textwrap.dedent(
        f"""
        Create a production-ready pixel-art render job for Badger Sprawl Runner.

        Render job: {name}
        Grid: {columns} columns by {rows} rows
        Cell size: {cell_w}x{cell_h} pixels
        Output size: {columns * cell_w}x{rows * cell_h} pixels
        Background: {background}

        {STYLE_CORE}
        {TECH_GRID}
        """
    ).strip()


def entity_job_prompt(
    sheet: dict[str, Any], animation: str, spec: dict[str, Any], identity: str
) -> tuple[str, dict[str, Any]]:
    frames = int(spec.get("frames", 1))
    columns, rows = grid_for_frames(frames)
    cell_w, cell_h = map(int, sheet["frameSize"])
    anchor = spec.get("anchor") or (
        [cell_w // 2, cell_h - 4] if cell_h >= 48 else [cell_w // 2, cell_h // 2]
    )
    arc = animation_arc(animation, frames)
    lines = "\n".join(f"{index + 1}. {pose}" for index, pose in enumerate(arc))
    empty = columns * rows - frames
    empty_note = f" Leave the final {empty} cell(s) fully transparent." if empty else ""
    world = sheet.get("world")
    palette_line = (
        f"World palette family: {WORLD_PALETTE.get(world, '')}."
        if world
        else "Core Moss palette family: charcoal, off-white fur, deep violet, electric cyan and controlled hot-red accents."
    )
    prompt = f"""{prompt_header(f"{sheet['id']}__{animation}", columns, rows, cell_w, cell_h)}

Asset identity: {identity}.
{palette_line}
Animation: {animation}.
Frame count: {frames}.{empty_note}
Frame order:
{lines}

{TECH_ENTITY}
Anchor: keep the ground/object reference fixed at x={anchor[0]}, y={anchor[1]} in every occupied cell.
Animation-specific requirement: make the action readable from silhouette before adding glow, particles, or smears. The most active frame may use a compact effect, but body pose remains primary.
{NEGATIVE}
"""
    job = {
        "id": f"{sheet['id']}__{animation}",
        "animation": animation,
        "frames": frames,
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [cell_w, cell_h],
        "output_size": [columns * cell_w, rows * cell_h],
        "output": f"renders/{sheet['id']}/{animation}_{columns}c_{rows}r.png",
        "atlas_row": list(sheet.get("animations", {})).index(animation),
    }
    return prompt.strip(), job


def tile_job_prompt(
    sheet: dict[str, Any], animation: str, spec: dict[str, Any], identity: str
) -> tuple[str, dict[str, Any]]:
    frames = int(spec.get("frames", 1))
    columns, rows = grid_for_frames(frames)
    cell_w, cell_h = map(int, sheet["frameSize"])
    world = sheet.get("world") or sheet["id"].removesuffix("_tiles")
    tags = ", ".join(spec.get("tags") or []) or "decorative or functional world asset"
    empty = columns * rows - frames
    prompt = f"""{prompt_header(f"{sheet['id']}__{animation}", columns, rows, cell_w, cell_h)}

World: {WORLD_STYLE.get(world, title(world))}.
Palette: {WORLD_PALETTE.get(world, "dark cyber-noir neutrals with selective neon accents")}.
Tile or prop: {title(animation)}.
Existing visual cue: {identity}.
Runtime tags: {tags}.
Frames: {frames}. {"Leave unused cells fully transparent." if empty else ""}

For a static solid tile, fill the entire cell and make opposite edges tile seamlessly. For a thin platform, wall prop, hazard, or decorative object, use true alpha outside the silhouette. For animation, keep the base geometry and collision footprint identical while changing only light, sparks, cloth, fluid, signal, or mechanical phase. No perspective drift. No readable words on signs; use abstract glyphs.
{NEGATIVE}
"""
    job = {
        "id": f"{sheet['id']}__{animation}",
        "animation": animation,
        "frames": frames,
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [cell_w, cell_h],
        "output_size": [columns * cell_w, rows * cell_h],
        "output": f"renders/{sheet['id']}/{animation}_{columns}c_{rows}r.png",
        "atlas_row": list(sheet.get("animations", {})).index(animation),
    }
    return prompt.strip(), job


def parallax_job_prompt(
    sheet: dict[str, Any], animation: str, spec: dict[str, Any], identity: str
) -> tuple[str, dict[str, Any]]:
    cell_w, cell_h = map(int, sheet["frameSize"])
    world = sheet.get("world") or sheet["id"].removesuffix("_parallax").removesuffix(
        "_backdrop"
    )
    is_front = animation == "front_plate"
    background = (
        "transparent RGBA overlay" if is_front else "opaque scene plate in an RGBA PNG"
    )
    depth = {
        "back_plate": "far skyline and atmosphere, lowest contrast and largest shapes",
        "mid_plate": "mid-distance architecture and landmarks, medium contrast",
        "front_plate": "near silhouettes, cables, rails or foliage framing play, transparent between forms",
        "background": "complete cinematic gameplay backdrop with an intentionally readable central play lane",
    }.get(animation, "environment plate")
    prompt = f"""{prompt_header(f"{sheet['id']}__{animation}", 1, 1, cell_w, cell_h, background)}

World: {WORLD_STYLE.get(world, title(world))}.
Palette: {WORLD_PALETTE.get(world, "dark cyber-noir neutrals with selective neon accents")}.
Layer: {animation}; {depth}.
Existing visual cue: {identity}.

Create a side-scrolling orthographic environment with strong horizontal depth bands and no baked player, enemy, HUD, text, logos, or foreground collision geometry unless this is explicitly the front overlay. Keep the central gameplay lane visually quieter than the top and bottom framing. Pixel clusters must remain crisp at native size; no smooth painting or photographic texture.
{NEGATIVE}
"""
    job = {
        "id": f"{sheet['id']}__{animation}",
        "animation": animation,
        "frames": 1,
        "grid": {"columns": 1, "rows": 1},
        "cell_size": [cell_w, cell_h],
        "output_size": [cell_w, cell_h],
        "output": f"renders/{sheet['id']}/{animation}_1c_1r.png",
        "atlas_row": 0,
        "atlas_column": list(sheet.get("animations", {})).index(animation),
    }
    return prompt.strip(), job


def grouped_four_frame_prompt(
    sheet: dict[str, Any], names: list[str], batch_index: int, identity: str
) -> tuple[str, dict[str, Any]]:
    cell_w, cell_h = map(int, sheet["frameSize"])
    rows = len(names)
    columns = 4
    object_lines = []
    for row, name in enumerate(names, 1):
        object_lines.append(
            f"Row {row}: {title(name.removesuffix('_pickup'))}. Cell 1 neutral float; cell 2 stronger glow; cell 3 bob upward with one sparkle; cell 4 bob downward with rim light."
        )
    prompt = f"""{prompt_header(f"{sheet['id']}__batch_{batch_index:02d}", columns, rows, cell_w, cell_h)}

Sheet purpose: item pickup loops.
Existing visual cue: {identity}.
{chr(10).join(object_lines)}

Each row is one distinct item and must preserve that item's silhouette across all four cells. Center every object at x={cell_w // 2}, y={cell_h // 2}; move it no more than three pixels during the bob. Use transparent background and compact pickup sparkle only. No readable labels.
{NEGATIVE}
"""
    job = {
        "id": f"{sheet['id']}__batch_{batch_index:02d}",
        "animations": names,
        "frames": len(names) * 4,
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [cell_w, cell_h],
        "output_size": [columns * cell_w, rows * cell_h],
        "output": f"renders/{sheet['id']}/batch_{batch_index:02d}_{columns}c_{rows}r.png",
        "atlas_rows": [list(sheet.get("animations", {})).index(name) for name in names],
    }
    return prompt.strip(), job


def grouped_icon_prompt(
    sheet: dict[str, Any], names: list[str], batch_index: int, identity: str
) -> tuple[str, dict[str, Any]]:
    cell_w, cell_h = map(int, sheet["frameSize"])
    columns, rows = grid_for_frames(len(names))
    listing = "\n".join(
        f"{index + 1}. {title(name.removesuffix('_icon'))}"
        for index, name in enumerate(names)
    )
    empty = columns * rows - len(names)
    prompt = f"""{prompt_header(f"{sheet['id']}__batch_{batch_index:02d}", columns, rows, cell_w, cell_h)}

Sheet purpose: clean HUD icons.
Existing visual cue: {identity}.
Cell order:
{listing}
{"Leave remaining cells fully transparent." if empty else ""}

One centered symbol per cell, a two-to-four-pixel dark outline, a compact internal highlight, and no background plate unless it is part of the icon identity. Icons must remain recognizable at native size and must not contain letters, numbers, or readable words.
{NEGATIVE}
"""
    job = {
        "id": f"{sheet['id']}__batch_{batch_index:02d}",
        "animations": names,
        "frames": len(names),
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [cell_w, cell_h],
        "output_size": [columns * cell_w, rows * cell_h],
        "output": f"renders/{sheet['id']}/batch_{batch_index:02d}_{columns}c_{rows}r.png",
    }
    return prompt.strip(), job


def render_sheet_file(sheet: dict[str, Any]) -> tuple[str, list[dict[str, Any]]]:
    identity = identity_for(sheet)
    animations = sheet.get("animations", {})
    jobs: list[dict[str, Any]] = []
    prompt_sections: list[str] = []
    sid = sheet["id"]
    role = sheet.get("role")

    if sid in {"items_core", "items_extended"} and all(
        int(spec.get("frames", 0)) == 4 for spec in animations.values()
    ):
        names = list(animations)
        for index in range(0, len(names), 4):
            prompt, job = grouped_four_frame_prompt(
                sheet, names[index : index + 4], index // 4 + 1, identity
            )
            prompt_sections.append(
                f"## Render job `{job['id']}`\n\n```text\n{prompt}\n```"
            )
            jobs.append(job)
    elif "icons" in sid or sid == "skill_icons":
        names = list(animations)
        for index in range(0, len(names), 16):
            prompt, job = grouped_icon_prompt(
                sheet, names[index : index + 16], index // 16 + 1, identity
            )
            prompt_sections.append(
                f"## Render job `{job['id']}`\n\n```text\n{prompt}\n```"
            )
            jobs.append(job)
    else:
        for animation, spec in animations.items():
            if role == "tiles" or sid.endswith("_tiles"):
                prompt, job = tile_job_prompt(sheet, animation, spec, identity)
            elif (
                role in {"parallax", "backdrop"}
                or sid.endswith("_parallax")
                or sid.endswith("_backdrop")
            ):
                prompt, job = parallax_job_prompt(sheet, animation, spec, identity)
            else:
                prompt, job = entity_job_prompt(sheet, animation, spec, identity)
            prompt_sections.append(
                f"## Render job `{job['id']}`\n\n```text\n{prompt}\n```"
            )
            jobs.append(job)

    atlas_size = png_size(ROOT / sheet["file"])
    status = sheet_status(sheet)
    front = {
        "generated": True,
        "generated_by": "scripts/generate-sprite-render-prompts.py",
        "sheet_id": sid,
        "status": status,
        "target_atlas": sheet["file"],
        "frame_size": sheet["frameSize"],
        "atlas_size": list(atlas_size) if atlas_size else None,
        "reference_images": list(STYLE_REFERENCE_IMAGES),
        "render_job_count": len(jobs),
    }
    body = [
        "---",
        yaml.safe_dump(front, sort_keys=False).rstrip(),
        "---",
        "",
        f"# {title(sid)}",
        "",
    ]
    body += [
        f"Production role: `{sheet.get('role', 'manifest sheet')}`. Render the jobs below separately, then assemble them into `{sheet['file']}` using manifest animation order.",
        "",
        "The approved reference board establishes style only. Preserve the Badger Sprawl Runner identity described in each prompt.",
        "",
        *prompt_sections,
        "",
    ]
    return "\n".join(body), jobs


def current_atlas_assembly(
    sheet: dict[str, Any], jobs: list[dict[str, Any]]
) -> dict[str, Any]:
    frame_width, frame_height = map(int, sheet["frameSize"])
    animations = list(sheet.get("animations", {}).items())
    animation_rows = {name: row for row, (name, _) in enumerate(animations)}
    if sheet.get("grid"):
        columns = int(sheet["grid"]["columns"])
        rows = int(sheet["grid"]["rows"])
        mode = "explicit_grid"
    else:
        columns = max(
            max(
                [
                    int(spec.get("frames", 1)) - 1,
                    *[int(frame) for frame in spec.get("order", [])],
                ]
            )
            + 1
            for _, spec in animations
        )
        rows = len(animations)
        mode = "animation_rows"

    placements: list[dict[str, Any]] = []
    destination_references: dict[tuple[int, int], list[str]] = {}
    for job in jobs:
        names = (
            [job["animation"]]
            if "animation" in job
            else list(job.get("animations", []))
        )
        source_cursor = 0
        job_columns = int(job["grid"]["columns"])
        for animation in names:
            spec = sheet["animations"][animation]
            frame_count = int(spec.get("frames", 1))
            order = [int(frame) for frame in spec.get("order", [])]
            for local_frame in range(frame_count):
                source_column = source_cursor % job_columns
                source_row = source_cursor // job_columns
                source_cursor += 1
                absolute_frame = order[local_frame] if order else local_frame
                if mode == "explicit_grid":
                    destination_column = absolute_frame % columns
                    destination_row = absolute_frame // columns
                else:
                    destination_column = absolute_frame
                    destination_row = animation_rows[animation]
                destination = (destination_column, destination_row)
                destination_references.setdefault(destination, []).append(
                    f"{job['id']}:{animation}:{local_frame}"
                )
                placements.append(
                    {
                        "job_id": job["id"],
                        "render_output": job["output"],
                        "animation": animation,
                        "local_frame": local_frame,
                        "absolute_frame": absolute_frame,
                        "source_cell": [source_column, source_row],
                        "source_rect": [
                            source_column * frame_width,
                            source_row * frame_height,
                            frame_width,
                            frame_height,
                        ],
                        "destination_cell": [destination_column, destination_row],
                        "destination_rect": [
                            destination_column * frame_width,
                            destination_row * frame_height,
                            frame_width,
                            frame_height,
                        ],
                    }
                )

    conflicts = [
        {"destination_cell": list(cell), "references": references}
        for cell, references in sorted(destination_references.items())
        if len(references) > 1
    ]
    frame_capacity = columns * rows
    used_destination_cells = len(destination_references)
    return {
        "mode": mode,
        "frame_size": [frame_width, frame_height],
        "grid": {"columns": columns, "rows": rows},
        "atlas_size": [columns * frame_width, rows * frame_height],
        "frame_capacity": frame_capacity,
        "used_destination_cells": used_destination_cells,
        "unused_destination_cells": max(0, frame_capacity - used_destination_cells),
        "destination_conflicts": conflicts,
        "placements": placements,
    }


def write_current_prompts(sheets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    index: list[dict[str, Any]] = []
    for sheet in sheets:
        status = sheet_status(sheet)
        if status in {"archival_source", "superseded_archive"}:
            continue
        cat = category(sheet)
        path = CURRENT / cat / f"{sheet['id']}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        content, jobs = render_sheet_file(sheet)
        path.write_text(content, encoding="utf-8")
        index.append(
            {
                "sheet_id": sheet["id"],
                "status": status,
                "category": cat,
                "target_atlas": sheet["file"],
                "prompt_file": canonical_prompt_path(path),
                "world": sheet.get("world"),
                "jobs": jobs,
                "assembly": current_atlas_assembly(sheet, jobs),
            }
        )
    return index


def expansion_enemy_file(
    world: str,
    eid: str,
    name: str,
    enemy_class: str,
    movement: str,
    attack: str,
    counter: str,
) -> tuple[str, list[dict[str, Any]]]:
    sheet = {
        "id": f"enemy_{eid}",
        "file": f"assets/sprites/enemies/{eid}.png",
        "frameSize": [48, 48],
        "role": "planned_enemy",
        "world": world,
        "animations": {
            "idle": {"frames": 4, "anchor": [24, 44]},
            "patrol_or_move": {"frames": 6, "anchor": [24, 44]},
            "windup": {"frames": 3, "anchor": [24, 44]},
            "attack": {"frames": 5, "anchor": [24, 44]},
            "hurt": {"frames": 2, "anchor": [24, 44]},
            "stun_or_parried": {"frames": 3, "anchor": [24, 44]},
            "death": {"frames": 6, "anchor": [24, 44]},
        },
        "sourcePrompt": f"{name}; class {enemy_class}; {movement}; attacks with {attack}; intended counter is {counter}",
    }
    content, jobs = render_sheet_file(sheet)
    header = textwrap.dedent(
        f"""
        > Planned full-scope roster asset. World: **{title(world)}**. Class: **{enemy_class}**.  
        > Movement: {movement}. Attack: {attack}. Counter/readability requirement: {counter}.

        """
    )
    content = content.replace(
        f"# Enemy {title(eid)}\n\n", f"# Enemy {name}\n\n{header}", 1
    )
    return content, jobs


def write_expansion_enemies() -> list[dict[str, Any]]:
    result = []
    for world, eid, name, enemy_class, movement, attack, counter in EXPANSION_ENEMIES:
        path = EXPANSION / "enemies" / world / f"enemy_{eid}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        content, jobs = expansion_enemy_file(
            world, eid, name, enemy_class, movement, attack, counter
        )
        path.write_text(content, encoding="utf-8")
        result.append(
            {
                "sheet_id": f"enemy_{eid}",
                "status": "planned_full_scope",
                "category": "enemy_expansion",
                "world": world,
                "target_atlas": f"assets/sprites/enemies/{eid}.png",
                "prompt_file": canonical_prompt_path(path),
                "jobs": jobs,
            }
        )
    return result


def write_player_templates() -> list[dict[str, Any]]:
    result = []
    identity = (
        "Moss, anthropomorphic badger courier with black-white facial mask, patched dark courier coat, cargo trousers, "
        "boots, claw wraps, compact tail, chrome wetware whiskers and pirate-radio details"
    )
    for pack_name, animations in PLAYER_EXPANSION_PACKS.items():
        sections = []
        jobs = []
        for animation, frames, action_note in animations:
            sheet = {
                "id": f"moss_{pack_name}",
                "file": f"assets/sprites/player-expansion/{pack_name}.png",
                "frameSize": [48, 48],
                "animations": {animation: {"frames": frames, "anchor": [24, 44]}},
            }
            prompt, job = entity_job_prompt(
                sheet, animation, sheet["animations"][animation], identity
            )
            prompt += f"\nSpecific move design: {action_note}."
            sections.append(f"## Render job `{job['id']}`\n\n```text\n{prompt}\n```")
            jobs.append(job)
        path = EXPANSION / "player" / f"{pack_name}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        front = {
            "generated": True,
            "status": "planned_full_scope",
            "template": pack_name,
            "reference_images": list(STYLE_REFERENCE_IMAGES),
            "render_job_count": len(jobs),
        }
        path.write_text(
            "\n".join(
                [
                    "---",
                    yaml.safe_dump(front, sort_keys=False).rstrip(),
                    "---",
                    "",
                    f"# Moss: {title(pack_name)}",
                    "",
                    *sections,
                    "",
                ]
            ),
            encoding="utf-8",
        )
        result.append(
            {
                "template_id": f"moss_{pack_name}",
                "status": "planned_full_scope",
                "category": "player_expansion",
                "prompt_file": canonical_prompt_path(path),
                "jobs": jobs,
            }
        )
    return result


def world_tile_expansion_prompt(world: str) -> tuple[str, list[dict[str, Any]]]:
    groups = [
        (
            "collision_geometry",
            [
                "main floor",
                "alternate floor",
                "left wall",
                "right wall",
                "thin platform",
                "pipe platform",
                "inside corner",
                "outside corner",
                "broken ledge",
                "sloped surface",
                "ceiling",
                "support beam",
                "small step",
                "large block",
                "bridge segment",
                "damaged variant",
            ],
        ),
        (
            "hazards",
            [
                "spark puddle phases",
                "steam vent phases",
                "security beam phases",
                "mechanical crusher phases",
            ],
        ),
        (
            "interactives",
            [
                "terminal idle/active",
                "camera hostile/hacked",
                "door locked/open",
                "trap hostile/hacked",
            ],
        ),
        (
            "decor",
            [
                "pipe",
                "cable",
                "poster without text",
                "sign with abstract glyph",
                "broken machine",
                "crate",
                "barrier",
                "lamp",
                "vent",
                "plant or local organic form",
                "small debris",
                "large debris",
                "utility box",
                "hanging prop",
                "floor stain",
                "world-specific landmark fragment",
            ],
        ),
    ]
    jobs = []
    sections = []
    for index, (group, entries) in enumerate(groups, 1):
        if group in {"hazards", "interactives"}:
            columns, rows = 4, 4
            listing = "\n".join(
                f"Row {row}: {entry}; four chronological animation phases."
                for row, entry in enumerate(entries, 1)
            )
        else:
            columns, rows = 4, 4
            listing = "\n".join(
                f"{cell + 1}. {entry}" for cell, entry in enumerate(entries)
            )
        prompt = f"""{prompt_header(f"{world}__{group}", columns, rows, 32, 32)}

World: {WORLD_STYLE[world]}.
Palette: {WORLD_PALETTE[world]}.
Set: {title(group)}.
Cell plan:
{listing}

All tiles use the same orthographic side-view construction language. Collision tiles fill cells and meet edges cleanly; objects and hazards use true alpha outside silhouettes. Animated rows preserve footprint. No readable text. Keep the approved neon-animal reference board's crisp cluster work and lighting discipline while rendering environment assets rather than characters.
{NEGATIVE}
"""
        job = {
            "id": f"{world}__{group}",
            "grid": {"columns": columns, "rows": rows},
            "cell_size": [32, 32],
            "output_size": [columns * 32, rows * 32],
            "output": f"renders/world-expansion/{world}/{group}_{columns}c_{rows}r.png",
        }
        jobs.append(job)
        sections.append(
            f"## Render job `{job['id']}`\n\n```text\n{prompt.strip()}\n```"
        )
    content = "\n".join(
        [
            "---",
            yaml.safe_dump(
                {
                    "generated": True,
                    "status": "planned_full_scope",
                    "world": world,
                    "reference_images": list(STYLE_REFERENCE_IMAGES),
                    "render_job_count": len(jobs),
                },
                sort_keys=False,
            ).rstrip(),
            "---",
            "",
            f"# {title(world)}: Full Tile Expansion",
            "",
            "These jobs extend the seven-entry runtime sheet into a stage-capable material, hazard, interactive, and decor library.",
            "",
            *sections,
            "",
        ]
    )
    return content, jobs


def write_world_expansions() -> list[dict[str, Any]]:
    result = []
    for world in [
        "lower_sprawl",
        "drainmarket",
        "chrome_arcology",
        "straylight_mirage",
        "dub_colony",
        "antenna_barrens",
        "orbital_lift",
        "asteroid_redoubt",
    ]:
        content, jobs = world_tile_expansion_prompt(world)
        path = EXPANSION / "worlds" / f"{world}_full_tiles.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        result.append(
            {
                "template_id": f"{world}_full_tiles",
                "status": "planned_full_scope",
                "category": "world_expansion",
                "world": world,
                "prompt_file": canonical_prompt_path(path),
                "jobs": jobs,
            }
        )
    return result


def write_weapon_pack() -> dict[str, Any]:
    sections = []
    jobs = []
    for start in range(0, len(WEAPON_ITEMS), 4):
        batch = WEAPON_ITEMS[start : start + 4]
        rows = len(batch)
        listing = "\n".join(
            f"Row {row}: {name}; {description}; palette accent {palette}. Four-frame pickup loop: neutral, glow, bob up, bob down."
            for row, (name, description, palette) in enumerate(batch, 1)
        )
        prompt = f"""{prompt_header(f"combat_weapons__pickup_batch_{start // 4 + 1:02d}", 4, rows, 32, 32)}

{listing}

Render distinct, game-readable weapon pickups. Keep each row's object centered and preserve its silhouette through the four-frame bob loop. True alpha background, no labels, no hands holding the weapon.
{NEGATIVE}
"""
        job = {
            "id": f"combat_weapons__pickup_batch_{start // 4 + 1:02d}",
            "grid": {"columns": 4, "rows": rows},
            "cell_size": [32, 32],
            "output_size": [128, rows * 32],
            "output": f"renders/items-expansion/combat_weapons_pickups_{start // 4 + 1:02d}_4c_{rows}r.png",
        }
        jobs.append(job)
        sections.append(
            f"## Render job `{job['id']}`\n\n```text\n{prompt.strip()}\n```"
        )
    names = [item[0] for item in WEAPON_ITEMS]
    columns, rows = grid_for_frames(len(names))
    listing = "\n".join(f"{i + 1}. {name}" for i, name in enumerate(names))
    prompt = f"""{prompt_header("combat_weapons__icons", columns, rows, 32, 32)}

HUD icon order:
{listing}
Leave unused cells transparent.

Render one centered weapon symbol per cell with dark outline and one neon accent. No text, no hands, no scenery.
{NEGATIVE}
"""
    job = {
        "id": "combat_weapons__icons",
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [32, 32],
        "output_size": [columns * 32, rows * 32],
        "output": f"renders/items-expansion/combat_weapons_icons_{columns}c_{rows}r.png",
    }
    jobs.append(job)
    sections.append(f"## Render job `{job['id']}`\n\n```text\n{prompt.strip()}\n```")
    path = EXPANSION / "items" / "combat_weapon_pickups_and_icons.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "---",
                yaml.safe_dump(
                    {
                        "generated": True,
                        "status": "planned_full_scope",
                        "reference_images": list(STYLE_REFERENCE_IMAGES),
                        "render_job_count": len(jobs),
                    },
                    sort_keys=False,
                ).rstrip(),
                "---",
                "",
                "# Combat Weapon Pickups and Icons",
                "",
                *sections,
                "",
            ]
        ),
        encoding="utf-8",
    )
    return {
        "template_id": "combat_weapon_pickups_and_icons",
        "status": "planned_full_scope",
        "category": "item_expansion",
        "prompt_file": canonical_prompt_path(path),
        "jobs": jobs,
    }


def write_ui_templates(story: dict[str, Any]) -> list[dict[str, Any]]:
    characters: dict[str, str] = {}
    for chapter in story["badger_sprawl_runner_story_content_pack"]["chapters"]:
        for character in chapter.get("characters", []):
            cid = character["id"]
            characters.setdefault(cid, clean_prompt(character.get("visual_prompt", "")))
    result = []
    # Portrait files are concrete per current story character, four expressions each.
    for cid, identity in sorted(characters.items()):
        prompt = f"""{prompt_header(f"portrait_{cid}", 4, 1, 96, 96)}

Character: {identity}.
Cells: neutral attentive portrait; speaking/open expression; strong emotional reaction; determined action expression.

Head-and-shoulders dialogue portraits, consistent camera and scale, transparent background, strong facial readability, one subtle prop or costume cue, no text and no speech bubble. Apply the approved reference board's crisp pixel clusters and neon rim-light discipline without copying its characters.
{NEGATIVE}
"""
        job = {
            "id": f"portrait_{cid}",
            "grid": {"columns": 4, "rows": 1},
            "cell_size": [96, 96],
            "output_size": [384, 96],
            "output": f"renders/portraits/{cid}_4c_1r.png",
        }
        path = EXPANSION / "portraits" / f"{cid}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            "\n".join(
                [
                    "---",
                    yaml.safe_dump(
                        {
                            "generated": True,
                            "status": "planned_full_scope",
                            "character_id": cid,
                            "reference_images": list(STYLE_REFERENCE_IMAGES),
                            "render_job_count": 1,
                        },
                        sort_keys=False,
                    ).rstrip(),
                    "---",
                    "",
                    f"# Portrait: {title(cid)}",
                    "",
                    f"```text\n{prompt.strip()}\n```",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        result.append(
            {
                "template_id": f"portrait_{cid}",
                "status": "planned_full_scope",
                "category": "portrait_expansion",
                "prompt_file": canonical_prompt_path(path),
                "jobs": [job],
            }
        )

    hud_entries = [
        "health claw pip full",
        "health claw pip empty",
        "rally-health overlay",
        "rocket fuel full",
        "rocket fuel empty",
        "rail reload ring",
        "perfect reload marker",
        "heat low",
        "heat high",
        "hack charge",
        "trace warning",
        "parry ready",
        "companion ready",
        "story payload",
        "shop discount",
        "objective marker",
    ]
    listing = "\n".join(f"{i + 1}. {entry}" for i, entry in enumerate(hud_entries))
    prompt = f"""{prompt_header("hud_core_elements", 4, 4, 32, 32)}

HUD cell order:
{listing}

Render a coherent compact HUD glyph family using dark outlines, one bright state color, and clear filled/empty distinction. Transparent cells, no letters, numbers, or readable words. The icons must work over both dark and bright gameplay backgrounds.
{NEGATIVE}
"""
    job = {
        "id": "hud_core_elements",
        "grid": {"columns": 4, "rows": 4},
        "cell_size": [32, 32],
        "output_size": [128, 128],
        "output": "renders/ui/hud_core_elements_4c_4r.png",
    }
    path = EXPANSION / "ui" / "hud_core_elements.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"# HUD Core Elements\n\n```text\n{prompt.strip()}\n```\n", encoding="utf-8"
    )
    result.append(
        {
            "template_id": "hud_core_elements",
            "status": "planned_full_scope",
            "category": "ui_expansion",
            "prompt_file": canonical_prompt_path(path),
            "jobs": [job],
        }
    )
    return result


def gap_entity_job(
    sheet_id: str,
    target_atlas: str,
    frame_size: tuple[int, int],
    identity: str,
    spec: dict[str, Any],
    *,
    world: str | None = None,
    anchor: tuple[int, int] | None = None,
) -> tuple[str, dict[str, Any]]:
    animation = str(spec["id"])
    width, height = frame_size
    synthetic = {
        "id": sheet_id,
        "file": target_atlas,
        "frameSize": [width, height],
        "world": world,
        "animations": {
            animation: {
                "frames": int(spec["frames"]),
                "anchor": list(anchor or (width // 2, height - 4)),
            }
        },
    }
    prompt, job = entity_job_prompt(
        synthetic,
        animation,
        synthetic["animations"][animation],
        identity,
    )
    prompt += (
        f"\nSpecific missing-state design: {spec['action']}."
        f"\nRuntime intent: {spec['runtime_clip']}."
        "\nThis is a future atlas-family render target, not permission to rename or overwrite an existing runtime clip."
    )
    job.update(
        {
            "animation_state": animation,
            "animation_class": spec["animation_class"],
            "runtime_clip": spec["runtime_clip"],
            "source_class": "remaining_gap_catalog",
            "review_state": "pending_render",
            "atlas_family": target_atlas,
        }
    )
    return prompt, job


def gap_tile_job(
    world: str,
    target_atlas: str,
    spec: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    animation = str(spec["id"])
    synthetic = {
        "id": f"{world}_gameplay_tiles",
        "file": target_atlas,
        "frameSize": [32, 32],
        "world": world,
        "role": "tiles",
        "animations": {
            animation: {
                "frames": int(spec["frames"]),
                "tags": [spec["animation_class"], "planned_gameplay_tile"],
            }
        },
        "sourcePrompt": spec["action"],
    }
    prompt, job = tile_job_prompt(
        synthetic,
        animation,
        synthetic["animations"][animation],
        spec["action"],
    )
    prompt += (
        f"\nExact gameplay-state sequence: {spec['action']}."
        f"\nRuntime intent: {spec['runtime_clip']}."
        "\nKeep collision footprint, pivot, tile edges, and inactive-state silhouette stable across every phase."
    )
    job.update(
        {
            "animation_state": animation,
            "animation_class": spec["animation_class"],
            "runtime_clip": spec["runtime_clip"],
            "source_class": "remaining_gap_catalog",
            "review_state": "pending_render",
            "atlas_family": target_atlas,
        }
    )
    return prompt, job


def gap_effect_job(spec: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    frames = int(spec["frames"])
    columns, rows = grid_for_frames(frames)
    cell_w = 48 if spec["animation_class"] == "boss_vfx" else 32
    cell_h = cell_w
    empty = columns * rows - frames
    arc = animation_arc(str(spec["id"]), frames)
    phases = "\n".join(f"{index + 1}. {phase}" for index, phase in enumerate(arc))
    prompt = f"""{prompt_header(f"vfx_remaining_gaps__{spec['id']}", columns, rows, cell_w, cell_h)}

Effect identity: {spec["action"]}.
Animation class: {spec["animation_class"]}.
Runtime intent: {spec["runtime_clip"]}.
Frame count: {frames}. {"Leave unused cells completely transparent." if empty else ""}
Frame phases:
{phases}

Render only the isolated effect, never the actor, enemy, boss, weapon-holder, scenery, floor, HUD, readable symbol, or text. Keep one stable effect origin and a coherent growth, impact, sustain, and dissipation path. Match the approved neon-animal board's crisp pixel clusters, dark contour fragments, and restrained two-or-three-color accent discipline. Physical actions use dust, sparks, trails, shock, fragments, pressure, or signal distortion appropriate to the description instead of an invented generic magic projectile.
{NEGATIVE}
"""
    job = {
        "id": f"vfx_remaining_gaps__{spec['id']}",
        "animation": spec["id"],
        "frames": frames,
        "grid": {"columns": columns, "rows": rows},
        "cell_size": [cell_w, cell_h],
        "output_size": [columns * cell_w, rows * cell_h],
        "output": f"renders/vfx-remaining-gaps/{spec['id']}_{columns}c_{rows}r.png",
        "animation_state": spec["id"],
        "animation_class": spec["animation_class"],
        "runtime_clip": spec["runtime_clip"],
        "source_class": "remaining_gap_catalog",
        "review_state": "pending_render",
        "atlas_family": "assets/sprites/vfx/vfx_remaining_gaps.png",
    }
    return prompt.strip(), job


def write_gap_bundle(
    path: Path,
    heading: str,
    entry: dict[str, Any],
    prompt_jobs: list[tuple[str, dict[str, Any]]],
) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    sections = [
        f"## Render job `{job['id']}`\n\n```text\n{prompt.strip()}\n```"
        for prompt, job in prompt_jobs
    ]
    front = {
        "generated": True,
        "generated_by": "scripts/generate-sprite-render-prompts.py",
        "status": "planned_full_scope",
        "source_catalog": str(GAPS_PATH.relative_to(ROOT)),
        "category": entry["category"],
        "world": entry.get("world"),
        "target_atlas": entry.get("target_atlas"),
        "reference_images": list(STYLE_REFERENCE_IMAGES),
        "render_job_count": len(prompt_jobs),
    }
    path.write_text(
        "\n".join(
            [
                "---",
                yaml.safe_dump(front, sort_keys=False).rstrip(),
                "---",
                "",
                f"# {heading}",
                "",
                "These jobs close a specifically audited animation or tile gap. Render each job independently; do not merge the whole bundle into one image request.",
                "",
                *sections,
                "",
            ]
        ),
        encoding="utf-8",
    )
    return {
        **entry,
        "status": "planned_full_scope",
        "prompt_file": canonical_prompt_path(path),
        "jobs": [job for _, job in prompt_jobs],
    }


def write_remaining_gap_prompts(
    sheets: list[dict[str, Any]], gaps: dict[str, Any]
) -> list[dict[str, Any]]:
    by_id = {sheet["id"]: sheet for sheet in sheets}
    result: list[dict[str, Any]] = []

    player_sheet = by_id["moss_badger_production"]
    player_target = "assets/sprites/player-expansion/moss_remaining_animation_gaps.png"
    player_jobs = [
        gap_entity_job(
            "moss_remaining_animation_gaps",
            player_target,
            (48, 48),
            identity_for(player_sheet),
            spec,
            anchor=(24, 44),
        )
        for spec in gaps["player_gaps"]
    ]
    result.append(
        write_gap_bundle(
            EXPANSION / "gaps" / "player" / "moss_remaining_animation_gaps.md",
            "Moss: Remaining Animation Gaps",
            {
                "template_id": "moss_remaining_animation_gaps",
                "category": "player_gap",
                "target_atlas": player_target,
            },
            player_jobs,
        )
    )

    enemy_specs = gaps["enemy_state_extensions"]
    for sheet in sorted(
        (value for value in sheets if value.get("role") == "enemy"),
        key=lambda value: value["id"],
    ):
        target = f"assets/sprites/enemies/expansion/{sheet['id']}_state_extension.png"
        jobs = [
            gap_entity_job(
                f"{sheet['id']}_state_extension",
                target,
                (48, 48),
                identity_for(sheet),
                spec,
                world=sheet.get("world"),
                anchor=(24, 44),
            )
            for spec in enemy_specs
        ]
        result.append(
            write_gap_bundle(
                EXPANSION / "gaps" / "enemies" / f"{sheet['id']}_state_extension.md",
                f"{title(sheet['id'])}: State Extension",
                {
                    "template_id": f"{sheet['id']}_state_extension",
                    "category": "enemy_state_gap",
                    "world": sheet.get("world"),
                    "target_atlas": target,
                },
                jobs,
            )
        )

    character_specs = gaps["character_state_extensions"]
    for sheet in sorted(
        (value for value in sheets if value["id"].startswith("character_")),
        key=lambda value: value["id"],
    ):
        target = (
            f"assets/sprites/characters/expansion/{sheet['id']}_state_extension.png"
        )
        jobs = [
            gap_entity_job(
                f"{sheet['id']}_state_extension",
                target,
                (48, 48),
                identity_for(sheet),
                spec,
                world=sheet.get("world"),
                anchor=(24, 44),
            )
            for spec in character_specs
        ]
        result.append(
            write_gap_bundle(
                EXPANSION / "gaps" / "characters" / f"{sheet['id']}_state_extension.md",
                f"{title(sheet['id'])}: Movement and Reaction Extension",
                {
                    "template_id": f"{sheet['id']}_state_extension",
                    "category": "character_state_gap",
                    "world": sheet.get("world"),
                    "target_atlas": target,
                },
                jobs,
            )
        )

    for boss_id, specs in gaps["boss_action_variants"].items():
        if boss_id not in by_id:
            raise ValueError(f"Unknown boss in remaining gap catalog: {boss_id}")
        sheet = by_id[boss_id]
        target = f"assets/sprites/bosses/expansion/{boss_id}_action_variants.png"
        jobs = [
            gap_entity_job(
                f"{boss_id}_action_variants",
                target,
                (96, 96),
                identity_for(sheet),
                spec,
                world=sheet.get("world"),
                anchor=(48, 90),
            )
            for spec in specs
        ]
        result.append(
            write_gap_bundle(
                EXPANSION / "gaps" / "bosses" / f"{boss_id}_action_variants.md",
                f"{title(boss_id)}: Named Action Variants",
                {
                    "template_id": f"{boss_id}_action_variants",
                    "category": "boss_action_gap",
                    "world": sheet.get("world"),
                    "target_atlas": target,
                },
                jobs,
            )
        )

    for world, specs in gaps["world_gameplay_tiles"].items():
        if world not in WORLD_STYLE:
            raise ValueError(f"Unknown world in remaining gap catalog: {world}")
        target = f"assets/sprites/worlds/expansion/{world}_gameplay_tiles.png"
        jobs = [gap_tile_job(world, target, spec) for spec in specs]
        result.append(
            write_gap_bundle(
                EXPANSION / "gaps" / "worlds" / f"{world}_gameplay_tiles.md",
                f"{title(world)}: Gameplay-Specific Tile States",
                {
                    "template_id": f"{world}_gameplay_tiles",
                    "category": "world_gameplay_gap",
                    "world": world,
                    "target_atlas": target,
                },
                jobs,
            )
        )

    effect_jobs = [gap_effect_job(spec) for spec in gaps["vfx_gaps"]]
    result.append(
        write_gap_bundle(
            EXPANSION / "gaps" / "vfx" / "remaining_vfx_gaps.md",
            "Remaining VFX Gaps",
            {
                "template_id": "remaining_vfx_gaps",
                "category": "vfx_gap",
                "target_atlas": "assets/sprites/vfx/vfx_remaining_gaps.png",
            },
            effect_jobs,
        )
    )
    return result


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def old_render_job_paths() -> set[Path]:
    manifest_path = RENDER_JOBS / RENDER_MANIFEST_NAME
    if not manifest_path.is_file():
        return set()
    try:
        old_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    paths = {manifest_path, RENDER_JOBS / RENDER_INDEX_NAME}
    for job in old_manifest.get("jobs", []):
        markdown = job.get("markdown") if isinstance(job, dict) else None
        if not isinstance(markdown, str):
            continue
        candidate = (RENDER_JOBS / markdown).resolve()
        if RENDER_JOBS.resolve() in candidate.parents:
            paths.add(candidate)
    return paths


def clean_old_render_jobs() -> None:
    for path in old_render_job_paths():
        if path.is_file():
            path.unlink()
    if not RENDER_JOBS.exists():
        return
    for directory in sorted(
        (path for path in RENDER_JOBS.rglob("*") if path.is_dir()),
        key=lambda path: len(path.parts),
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            pass


def render_job_markdown(job: dict[str, Any], markdown_path: Path) -> str:
    grid = job["grid"]
    front = {
        "generated": True,
        "generated_by": "scripts/generate-sprite-render-prompts.py",
        "corpus_version": CORPUS_VERSION,
        "status": job["review_state"],
        "scope": job["scope"],
        "category": job["category"],
        "source_entry": job["source_entry"],
        "job_id": job["id"],
        "animation_state": job["animation_state"],
        "animation_class": job["animation_class"],
        "runtime_clip": job["runtime_clip"],
        "source_class": job["source_class"],
        "atlas_family": job["atlas_family"],
        "target_atlas": job.get("target_atlas"),
        "output_image": job["output"],
        "frames": job["frames"],
        "grid": grid,
        "cell_size": job["cell_size"],
        "output_size": job["output_size"],
        "world": job.get("world"),
        "source_prompt_file": job["source_prompt_file"],
        "reference_images": list(STYLE_REFERENCE_IMAGES),
    }
    metadata_rows = [
        ("Scope", job["scope"]),
        ("Category", job["category"]),
        ("Animation state", job["animation_state"]),
        ("Animation class", job["animation_class"]),
        ("Runtime intent", job["runtime_clip"]),
        ("Atlas family", job["atlas_family"]),
        ("Source class", job["source_class"]),
    ]
    metadata_table = "\n".join(
        [
            "| Field | Value |",
            "|---|---|",
            *[f"| {label} | `{value}` |" for label, value in metadata_rows],
        ]
    )
    return "\n".join(
        [
            "---",
            yaml.safe_dump(front, sort_keys=False, allow_unicode=True).rstrip(),
            "---",
            "",
            f"# `{job['id']}`",
            "",
            "This file is one complete Badger Sprawl Runner sprite render job. Copy only the **Prompt** block into the image renderer.",
            "",
            "## Render target",
            "",
            f"- Output image: `{job['output']}`",
            f"- Grid: {grid['columns']} columns × {grid['rows']} rows",
            f"- Cell size: {job['cell_size'][0]}×{job['cell_size'][1]} pixels",
            f"- Output size: {job['output_size'][0]}×{job['output_size'][1]} pixels",
            f"- Occupied frames: {job['frames']}",
            f"- Review state: `{job['review_state']}`",
            "",
            "## Production metadata",
            "",
            metadata_table,
            "",
            "## Prompt",
            "",
            "```text",
            job["_prompt"],
            "```",
            "",
            "## Acceptance",
            "",
            "Review the output against `docs/sprite-production/REVIEW-CHECKLIST.md`. Raw model output remains source material until alpha cleanup, cell containment, continuity review, and in-engine validation pass.",
            "",
        ]
    )


def write_review_checklist() -> None:
    content = """# Sprite Render Review Checklist

## Geometry and alpha

- [ ] Grid columns, rows, cell size, and output dimensions exactly match the render job.
- [ ] No grid exceeds four cells in either direction.
- [ ] Entity, item, tile-overlay, and VFX backgrounds use true alpha rather than white, black, or checkerboard pixels.
- [ ] No occupied pixel, glow, smear, particle, weapon, ear, tail, cable, or debris crosses a cell boundary.
- [ ] Unused cells are completely transparent.

## Identity and continuity

- [ ] Character identity, proportions, costume, permanent equipment, outline weight, palette, and pixel density remain stable.
- [ ] Anchors and collision footprints do not jitter between frames.
- [ ] Adjacent poses show real action progression rather than duplicate or randomly changed drawings.
- [ ] Secondary fur, scarf, coat, cable, foliage, or machinery motion follows the primary action with coherent delay.
- [ ] Facing changes, turns, falls, and rotations remain intentional and readable.

## Animation readability

- [ ] Anticipation, active pose, impact or sustain, follow-through, and recovery are distinguishable at gameplay scale.
- [ ] Locomotion loops join cleanly and preserve contact rhythm.
- [ ] Attack windups expose the intended danger cue before the active frame.
- [ ] Hurt, stun, guard, parry, defeat, and recovery silhouettes cannot be confused with one another.
- [ ] Boss named actions look mechanically different instead of reusing one generic attack.

## Tiles and environments

- [ ] Collision tiles fill their required edges and tile seamlessly.
- [ ] Animated hazards preserve their collision footprint through warning, active, and safe phases.
- [ ] Interactives clearly distinguish idle, focused, accepted, hacked, open, disabled, or checkpoint states without readable text.
- [ ] Breakable tiles progress from intact through damaged to open without moving neighboring edge geometry.
- [ ] Parallax and backdrop plates keep the gameplay lane quieter than their framing regions.

## VFX and UI

- [ ] Effect-only sheets contain no actor body, opponent, scenery, floor, or HUD.
- [ ] VFX origin, scale, palette, and trajectory agree with the corresponding action.
- [ ] Effects remain secondary to the action silhouette and do not become generic magic when a physical trail, dust, pressure, signal, or fragment effect is required.
- [ ] Icons remain recognizable at native size and contain no letters, numbers, logos, or readable words.

## Production receipt

- [ ] Preserve the untouched generation beside the cleaned selection.
- [ ] Record renderer/model, prompt corpus version, references, date, seed when available, and manual cleanup.
- [ ] Produce a contact sheet at native and gameplay scale.
- [ ] Preview loops and one-shot actions before atlas assembly.
- [ ] Validate final atlas dimensions, manifest addressing, event timing, hitboxes/hurtboxes, and browser rendering before replacing runtime art.
"""
    (OUT / "REVIEW-CHECKLIST.md").write_text(content, encoding="utf-8")


def write_corpus_coverage(
    current_index: list[dict[str, Any]], expansion_index: list[dict[str, Any]]
) -> None:
    all_entries = current_index + expansion_index
    category_counts = Counter(entry["category"] for entry in all_entries)
    job_counts = Counter()
    frame_counts = Counter()
    for entry in all_entries:
        for job in entry["jobs"]:
            job_counts[entry["category"]] += 1
            frame_counts[entry["category"]] += job_frame_count(job)
    total_jobs = sum(job_counts.values())
    total_frames = sum(frame_counts.values())
    gap_categories = [
        "player_gap",
        "enemy_state_gap",
        "character_state_gap",
        "boss_action_gap",
        "world_gameplay_gap",
        "vfx_gap",
    ]
    rows = [
        "| Category | Entries | Render jobs | Prompted frames |",
        "|---|---:|---:|---:|",
    ]
    for category_name in sorted(category_counts):
        rows.append(
            f"| `{category_name}` | {category_counts[category_name]} | {job_counts[category_name]} | {frame_counts[category_name]} |"
        )
    gap_jobs = sum(job_counts[name] for name in gap_categories)
    content = "\n".join(
        [
            "# Sprite Prompt Corpus Coverage",
            "",
            "The corpus combines all current runtime atlas contracts, full-scope content expansions, and a structured pass over remaining animation, gameplay-tile, named boss-action, and VFX gaps.",
            "",
            "```yaml",
            f"corpus_version: {CORPUS_VERSION}",
            f"current_entries: {len(current_index)}",
            f"expansion_entries: {len(expansion_index)}",
            f"total_render_jobs: {total_jobs}",
            f"total_prompted_frames: {total_frames}",
            f"remaining_gap_jobs: {gap_jobs}",
            "max_grid_columns: 4",
            "max_grid_rows: 4",
            "```",
            "",
            "## Coverage by category",
            "",
            *rows,
            "",
            "## Audited remaining-gap completion",
            "",
            f"- Moss remaining movement, carry, stealth, skill, weapon, item-use, and recovery actions: **{job_counts['player_gap']} jobs**.",
            f"- Four additional awareness/evasion/recovery states for each current regular enemy: **{job_counts['enemy_state_gap']} jobs**.",
            f"- Four locomotion/reaction/presentation states for each current companion, NPC, merchant, or boss-context character: **{job_counts['character_state_gap']} jobs**.",
            f"- Three named mechanical action rows for each current campaign boss: **{job_counts['boss_action_gap']} jobs**.",
            f"- Six gameplay-specific animated tile or prop states for each campaign world: **{job_counts['world_gameplay_gap']} jobs**.",
            f"- Missing player, combat, stealth, enemy, boss, item, hack, companion, and environment effects: **{job_counts['vfx_gap']} jobs**.",
            "",
            "Every job is materialized as an individual Markdown file under `render-jobs/`, in addition to its operator-facing bundle under `prompts/`.",
            "",
        ]
    )
    (OUT / "CORPUS-COVERAGE.md").write_text(content, encoding="utf-8")


def write_render_jobs(
    current_index: list[dict[str, Any]], expansion_index: list[dict[str, Any]]
) -> dict[str, Any]:
    clean_old_render_jobs()
    RENDER_JOBS.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    category_counts: Counter[str] = Counter()
    gap_counts: Counter[str] = Counter()

    for entry in current_index + expansion_index:
        entry_id = str(entry.get("sheet_id") or entry.get("template_id"))
        for job in entry["jobs"]:
            key = f"{job['scope']}:{job['category']}:{entry_id}:{job['id']}"
            if key in seen_keys:
                raise ValueError(f"Duplicate render-job key: {key}")
            seen_keys.add(key)
            markdown_path = (
                RENDER_JOBS
                / job["scope"]
                / job["category"]
                / entry_id
                / f"{job['id']}.md"
            )
            markdown_path.parent.mkdir(parents=True, exist_ok=True)
            markdown_path.write_text(
                render_job_markdown(job, markdown_path), encoding="utf-8"
            )
            relative_markdown = markdown_path.relative_to(RENDER_JOBS).as_posix()
            record = {
                **strip_private(job),
                "job_key": key,
                "markdown": relative_markdown,
            }
            records.append(record)
            category_counts[job["category"]] += 1
            if job["source_class"] == "remaining_gap_catalog":
                gap_counts[job["category"]] += 1

    records.sort(key=lambda item: item["job_key"])
    source_paths = [MANIFEST_PATH, STORY_PATH, GAPS_PATH, Path(__file__).resolve()]
    manifest = {
        "schemaVersion": 1,
        "corpusVersion": CORPUS_VERSION,
        "generatedBy": "scripts/generate-sprite-render-prompts.py",
        "styleReference": STYLE_REFERENCE,
        "styleReferenceImages": list(STYLE_REFERENCE_IMAGES),
        "constraints": {"maxGridColumns": 4, "maxGridRows": 4},
        "entryCount": len(current_index) + len(expansion_index),
        "currentEntryCount": len(current_index),
        "expansionEntryCount": len(expansion_index),
        "jobCount": len(records),
        "promptedFrameCount": sum(int(record["frames"]) for record in records),
        "categoryJobCounts": dict(sorted(category_counts.items())),
        "remainingGapJobCounts": dict(sorted(gap_counts.items())),
        "sourceHashes": {
            str(path.relative_to(ROOT)): sha256_file(path) for path in source_paths
        },
        "jobs": records,
    }
    (RENDER_JOBS / RENDER_MANIFEST_NAME).write_text(
        json.dumps(manifest, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    rows = [
        "| Scope | Category | Source entry | Job | Frames | Markdown | Output |",
        "|---|---|---|---|---:|---|---|",
    ]
    for record in records:
        rows.append(
            f"| `{record['scope']}` | `{record['category']}` | `{record['source_entry']}` | "
            f"`{record['id']}` | {record['frames']} | "
            f"[`{record['markdown']}`]({record['markdown']}) | `{record['output']}` |"
        )
    index_content = "\n".join(
        [
            "# Badger Sprawl Runner Render Jobs",
            "",
            "Generated from the current runtime manifest, full-scope expansion templates, and the structured remaining-gap catalog. Do not edit individual generated jobs; update their source or generator and regenerate.",
            "",
            f"- Corpus version: {CORPUS_VERSION}",
            f"- Current entries: {len(current_index)}",
            f"- Expansion entries: {len(expansion_index)}",
            f"- Total render jobs: {len(records)}",
            f"- Total prompted frames: {manifest['promptedFrameCount']}",
            f"- Remaining-gap jobs: {sum(gap_counts.values())}",
            "",
            "## Jobs",
            "",
            *rows,
            "",
        ]
    )
    (RENDER_JOBS / RENDER_INDEX_NAME).write_text(index_content, encoding="utf-8")
    return manifest


def write_style_target() -> None:
    content = f"""# Approved Sprite Style Target

The six operator-supplied neon-animal renders from **2026-07-21** have been re-identified as the production taste target. They show different animal characters, poses and equipment; they define rendering language rather than identities to copy. Because the original chat attachments are not yet committed as repository files, every job also names checked-in Moss continuity references.

```yaml
style_target:
  reference: "{STYLE_REFERENCE}"
  images:
    - "{STYLE_REFERENCE_IMAGES[0]}"
    - "{STYLE_REFERENCE_IMAGES[1]}"
  silhouette:
    - immediately readable at native sprite scale
    - broad dark outline and decisive negative space
    - expressive ears, tail, hands, weapon and coat shapes
  pixel_language:
    - crisp square pixels and hand-placed clusters
    - no antialiasing, smoothing or painterly blur
    - controlled detail density; face and action read before texture
    - large shadow masses with selective internal highlights
  palette:
    shadows: [near-black navy, deep violet, charcoal]
    recurring_accents: [electric cyan, violet, magenta, acid green, hot red, orange]
    rule: "use two or three dominant accents per asset, not every neon at once"
  lighting:
    - strong rim light or emissive equipment accent
    - high contrast without washing out fur or costume identity
    - compact muzzle flashes, blade smears, sparks and glitch fragments
  motion:
    - action pose is primary; VFX remains secondary
    - exaggerated but coherent anticipation and follow-through
    - stable scale, anchor, camera and costume between frames
  exclusions:
    - vector-clean curves
    - smooth gradients
    - soft airbrush glow
    - fake 3D plastic rendering
    - over-detailed noisy silhouettes
    - readable text or logos
```

## Prompt invariant

{STYLE_CORE}

## Practical rendering rule

Attach the approved six-image board plus the listed repository-backed continuity references to character, enemy, boss, item, VFX, and UI render requests. For world art, use the board only when useful for palette and pixel-cluster discipline, and explicitly tell the model to render environments rather than animal characters. Import the six source images into a versioned repository reference directory when their original files are available; do not replace the real paths with an opaque attachment-only label.
"""
    (OUT / "STYLE-TARGET.md").write_text(content, encoding="utf-8")


def write_state_review(
    sheets: list[dict[str, Any]], current_index: list[dict[str, Any]]
) -> None:
    category_counts = Counter(category(sheet) for sheet in sheets)
    source_tools = Counter(
        str((sheet.get("source") or {}).get("tool") or "unrecorded") for sheet in sheets
    )
    missing = [sheet["id"] for sheet in sheets if not (ROOT / sheet["file"]).exists()]
    bad_pngs = [
        sheet["id"] for sheet in sheets if png_size(ROOT / sheet["file"]) is None
    ]
    jobs = sum(len(entry["jobs"]) for entry in current_index)
    content = f"""# Sprite Production State Review

Reviewed against `data/sprites.json` and repository assets on 2026-07-21.

## Verified baseline

```yaml
manifest_sheets: {len(sheets)}
production_prompt_targets: {len(current_index)}
small_render_jobs_generated: {jobs}
missing_manifest_files: {len(missing)}
non_png_or_unreadable_manifest_files: {len(bad_pngs)}
all_manifest_files_rgba: true  # verified by the preceding project audit; prompt generator validates PNG dimensions
archival_or_superseded:
  - comfy_badger_run_grid
  - mirror_palace_parallax
```

| Category | Manifest sheets |
|---|---:|
"""
    for key, count in sorted(category_counts.items()):
        content += f"| {key} | {count} |\n"
    content += "\n## Provenance mix\n\n| Source tool | Sheets |\n|---|---:|\n"
    for key, count in source_tools.most_common():
        content += f"| {key} | {count} |\n"
    content += f"""

## Findings

1. **Contract coverage is strong.** Every one of the {len(sheets)} manifest entries has a corresponding PNG and the current atlases use consistent category dimensions. The runtime can therefore load art for the complete implemented campaign.
2. **Production coherence is the main weakness.** The atlas set mixes imported image-model boards, generated fallbacks, promoted authored motion, and sheets without complete provenance. Technical validity currently hides visible variation in outline weight, pixel density, palette discipline, pose clarity, and background cleanup.
3. **The older prompt document is obsolete.** It describes a 13-state Moss sheet and a handful of assets, while the manifest now contains 17 Moss states, 16 enemies, eight bosses, 20 story characters, eight world tile families, layered environments, expanded items, skills, VFX, and a backdrop.
4. **The implemented enemy roster is only a campaign skeleton.** Most worlds expose two regular enemy sheets, while `docs/ENEMY_BIBLE.md` and `docs/COMBAT_EXPANSION.md` specify six to nine mechanically distinct enemy roles per world. This pack adds direct prompts for the missing named roster.
5. **World atlases are runtime-complete but stage-thin.** Seven entries per world are enough to prove rendering, not enough for four visually distinct stages, collision variation, hackable traps, foreground silhouettes, and reusable set dressing. Each world now has four additional full-set render jobs.
6. **Player breadth does not yet match the combat design.** The active Moss atlas covers core movement, claws, katana, railgun, boost, hack, parry, interaction, hit and defeat. It does not yet cover crouch/stealth locomotion, wall and ledge movement, the full claw tree, additional blade families, additional guns, trap reversal, companion signals, or nonlethal takedowns.
7. **Dialogue portraits are absent as a dedicated production family.** Current 48-pixel story sheets are useful in-world, but not sufficient for expressive dialogue presentation. Concrete four-expression portrait prompts are included for every story character found in `story-flavour.yml`.
8. **Enemy and boss combat metadata remains a separate integration gap.** New art must be followed by per-frame hurtboxes, hitboxes, muzzle/VFX events, phase events, and visual-regression review; rendering alone will not complete combat fidelity.

## Immediate recommendation

Use the current render queue to re-author the existing production targets in the approved neon-animal style first, starting with Moss, Chapter 1 enemies, Captain Grin, Chapter 1 characters, Lower Sprawl tiles, combat VFX, items, and HUD. Assemble and review that vertical slice before bulk-rendering the remaining worlds.
"""
    (OUT / "STATE-REVIEW.md").write_text(content, encoding="utf-8")


def write_full_scope_plan(
    current_index: list[dict[str, Any]], expansion_index: list[dict[str, Any]]
) -> None:
    current_jobs = sum(len(entry["jobs"]) for entry in current_index)
    expansion_jobs = sum(len(entry["jobs"]) for entry in expansion_index)
    content = f"""# Full-Scope Sprite Production Plan

```yaml
approved_style: "{STYLE_REFERENCE}"
current_atlas_targets: {len(current_index)}
current_render_jobs: {current_jobs}
planned_expansion_templates_and_sheets: {len(expansion_index)}
planned_expansion_render_jobs: {expansion_jobs}
render_grid_limit:
  max_columns: 4
  max_rows: 4
source_of_truth:
  runtime_contract: data/sprites.json
  story_identity: docs/story-flavour.yml
  combat_scope: docs/COMBAT_EXPANSION.md
  enemy_scope: docs/ENEMY_BIBLE.md
  campaign_scope: docs/CAMPAIGN.md
```

## Phase 0 — Lock style and assembly contracts

- Keep every existing sheet ID, animation ID, frame size, anchor, and runtime URL stable during visual replacement.
- Render only small jobs from `prompt-index.yml`; never ask an image model for a complete large runtime atlas in one pass.
- Normalize every accepted render to indexed-looking RGBA pixel art: hard alpha, no matte fringe, no resampling, stable cell size.
- Assemble job cells into the runtime row order and validate atlas dimensions before copying into `assets/sprites/`.

**Exit:** the Chapter 1 slice can swap between old and new art without code or manifest changes.

## Phase 1 — Approved-style vertical slice

1. Moss production atlas.
2. Rent Cop Piker, Turnstile Mite, Captain Grin.
3. Auntie Subharmonic and Juno Jar plus dialogue portraits.
4. Lower Sprawl tiles, parallax, backdrop, item pickups/icons, skill icons, combat VFX, core HUD.
5. In-game review at native scale, one-half scale, and gameplay zoom.

**Exit:** consistent outline, palette, anchor, readability, alpha, animation rhythm, and VFX alignment across a complete playable chapter.

## Phase 2 — Existing campaign production pass

Render the remaining current targets world by world:

```text
Drainmarket -> Chrome Arcology -> Straylight Mirage -> Dub Colony
-> Antenna Barrens -> Orbital Lift -> Asteroid Redoubt
```

Within each world: regular enemies, boss, story characters, tiles, parallax, then world-specific items/VFX. Do not render all characters first and environments later; the world bundle must be visually reviewed as one palette family.

**Exit:** all current production targets use the approved style and have review snapshots.

## Phase 3 — Player full move scope

Add the generated player expansion packs:

- crouch, stealth, slide, dodge, wall cling/climb, ledge hang/climb;
- complete claw tree and aerial/wall attacks;
- katana extensions plus machete, mono-saber, hook blade, baton blade;
- shock pistol, scatter coil, nail SMG, harpoon line, signal launcher, perfect rail reload;
- standing and remote hacking, syntax parry, overload, trap reversal, companion signal, nonlethal takedown.

Add manifest contracts only after accepted art and gameplay state machines exist. Prefer one stable atlas family per equipment style rather than inflating the base Moss atlas indefinitely.

**Exit:** every implemented combat/movement verb has a readable authored pose set and event markers.

## Phase 4 — Full enemy ecosystem

Use the concrete planned enemy prompt files under `prompts/expansion/enemies/`. Introduce enemies in mechanic-first batches: walker, jumper, flyer, shield, caster, turret, heavy, assassin, swarm, then sub-boss variants. Each new enemy requires:

```yaml
acceptance:
  - unique silhouette at gameplay scale
  - readable movement and windup
  - visible counter or vulnerability
  - stable anchor and collision footprint
  - hurt, parried/stunned and defeat states
  - hitbox/hurtbox/event metadata
  - palette fit for its world
  - runtime and visual-regression tests
```

**Exit:** each world has at least six regular mechanical roles plus its boss and one stage-specific sub-boss/elite.

## Phase 5 — Stage-capable world art

For every world, render and curate:

- 16 collision/geometry tiles;
- four four-phase hazard families;
- four four-phase interactive/hackable families;
- 16 decor and landmark fragments;
- current parallax plates plus optional foreground silhouette strip;
- stage-specific recolor/lighting variants only after the base material set is stable.

**Exit:** four stages per world can be visually distinct without stretching seven cells across an entire chapter.

## Phase 6 — UI, portraits, VFX and polish

- Four-expression dialogue portrait sheet per story character.
- Core HUD glyph family and state variants.
- Weapon/item pickups and icons for the expanded combat set.
- VFX for each new weapon, hack ownership state, trap state, companion assist, boss phase and accessibility cue.
- Provenance metadata: source prompt, reference board revision, render model, render date, cleanup author, license status.

**Exit:** no runtime mechanic depends on placeholder geometry, unstyled browser text, or a generic effect where a readable state cue is required.

## Phase 7 — Production QA gate

```yaml
required_checks:
  technical:
    - exact PNG dimensions
    - true alpha where required
    - no blank or near-empty occupied cells
    - no grid larger than four cells per side in prompt jobs
    - manifest animation counts preserved
  visual:
    - stable anchors and scale
    - no frame jitter
    - consistent outline thickness and palette
    - action silhouette readable without VFX
    - approved-style comparison board
  gameplay:
    - hitbox and VFX events align with active frames
    - no texture bleeding or smoothing
    - native-scale browser snapshot
    - representative low-contrast and color-blind checks
```

## Queue policy

`prompt-index.yml` is the machine-readable queue. The Markdown files are the operator-facing copy/paste jobs. Mark outputs accepted only after cleanup and in-engine review; raw image-model renders remain sources, not automatic production assets.
"""
    (OUT / "FULL-SCOPE-PLAN.md").write_text(content, encoding="utf-8")


def write_render_queue(
    current_index: list[dict[str, Any]], expansion_index: list[dict[str, Any]]
) -> None:
    current_by_id = {entry["sheet_id"]: entry for entry in current_index}
    expansion_by_id = {
        entry.get("template_id") or entry.get("sheet_id"): entry
        for entry in expansion_index
    }

    vertical_slice_ids = [
        "moss_badger_production",
        "enemy_rent_cop_piker",
        "enemy_turnstile_mite",
        "boss_boss_captain_grin_tollmech",
        "character_auntie_subharmonic",
        "character_juno_jar",
        "lower_sprawl_tiles",
        "lower_sprawl_parallax",
        "lower_sprawl_backdrop",
        "items_core",
        "item_icons",
        "skill_icons",
        "vfx_combat",
    ]
    portrait_ids = ["portrait_moss", "portrait_auntie_subharmonic", "portrait_juno_jar"]

    lines = [
        "# Render Queue",
        "",
        "Render and review one coherent world bundle at a time. Raw model output remains source material until cleanup, assembly, and in-engine review pass.",
        "",
        "## Priority 0 — Chapter 1 style lock",
        "",
    ]
    for index, sheet_id in enumerate(vertical_slice_ids, 1):
        entry = current_by_id[sheet_id]
        rel = prompt_link_path(entry["prompt_file"])
        lines.append(
            f"{index}. [`{sheet_id}`]({rel.as_posix()}) — {len(entry['jobs'])} render job(s)"
        )
    for portrait_id in portrait_ids:
        entry = expansion_by_id.get(portrait_id)
        if entry:
            rel = prompt_link_path(entry["prompt_file"])
            lines.append(
                f"- [`{portrait_id}`]({rel.as_posix()}) — dialogue portrait expressions"
            )

    lines += [
        "",
        "### Chapter 1 acceptance order",
        "",
        "```text",
        "Moss identity -> movement -> combat -> regular enemies -> boss",
        "-> story characters and portraits -> items/VFX/HUD",
        "-> tiles/parallax/backdrop -> assembled in-game review",
        "```",
        "",
        "Do not continue to the full campaign until the Chapter 1 bundle agrees on outline thickness, pixel density, anchor stability, palette restraint, VFX scale, and alpha cleanup.",
        "",
        "## Priority 1 — Existing campaign sheets",
        "",
    ]
    for world in [
        "drainmarket",
        "chrome_arcology",
        "straylight_mirage",
        "dub_colony",
        "antenna_barrens",
        "orbital_lift",
        "asteroid_redoubt",
    ]:
        entries = [entry for entry in current_index if entry.get("world") == world]
        lines.append(f"### {title(world)}")
        lines.append("")
        for entry in entries:
            rel = prompt_link_path(entry["prompt_file"])
            lines.append(
                f"- [`{entry['sheet_id']}`]({rel.as_posix()}) — {len(entry['jobs'])} job(s)"
            )
        lines.append("")

    lines += ["## Priority 2 — Full-scope expansions", ""]
    for world in [
        "lower_sprawl",
        "drainmarket",
        "chrome_arcology",
        "straylight_mirage",
        "dub_colony",
        "antenna_barrens",
        "orbital_lift",
        "asteroid_redoubt",
    ]:
        enemy_entries = [
            entry
            for entry in expansion_index
            if entry.get("category") == "enemy_expansion"
            and entry.get("world") == world
        ]
        tile_entry = expansion_by_id.get(f"{world}_full_tiles")
        lines.append(f"### {title(world)}")
        lines.append("")
        if tile_entry:
            rel = prompt_link_path(tile_entry["prompt_file"])
            lines.append(
                f"- [`{world}_full_tiles`]({rel.as_posix()}) — stage-capable geometry, hazards, interactives and decor"
            )
        for entry in enemy_entries:
            rel = prompt_link_path(entry["prompt_file"])
            lines.append(f"- [`{entry['sheet_id']}`]({rel.as_posix()})")
        lines.append("")

    lines += ["## Cross-world expansions", ""]
    for entry in expansion_index:
        if entry.get("category") in {
            "player_expansion",
            "item_expansion",
            "ui_expansion",
        }:
            entry_id = entry.get("template_id") or entry.get("sheet_id")
            rel = prompt_link_path(entry["prompt_file"])
            lines.append(
                f"- [`{entry_id}`]({rel.as_posix()}) — {len(entry['jobs'])} job(s)"
            )
    lines += ["", "## Priority 3 — Audited remaining gaps", ""]
    gap_categories = [
        ("player_gap", "Moss missing actions"),
        ("enemy_state_gap", "regular-enemy awareness and recovery states"),
        ("character_state_gap", "NPC and companion locomotion/reaction states"),
        ("boss_action_gap", "named boss attacks and mechanics"),
        ("world_gameplay_gap", "gameplay-specific animated tiles and props"),
        ("vfx_gap", "missing combat, traversal, boss, enemy and environment effects"),
    ]
    for category_name, label in gap_categories:
        entries = [
            entry for entry in expansion_index if entry.get("category") == category_name
        ]
        job_count = sum(len(entry["jobs"]) for entry in entries)
        lines.append(f"### {label.title()} — {job_count} jobs")
        lines.append("")
        for entry in entries:
            entry_id = entry.get("template_id") or entry.get("sheet_id")
            rel = prompt_link_path(entry["prompt_file"])
            lines.append(
                f"- [`{entry_id}`]({rel.as_posix()}) — {len(entry['jobs'])} job(s)"
            )
        lines.append("")
    (OUT / "RENDER-QUEUE.md").write_text("\n".join(lines), encoding="utf-8")


def write_readme(
    current_index: list[dict[str, Any]], expansion_index: list[dict[str, Any]]
) -> None:
    current_jobs = sum(len(entry["jobs"]) for entry in current_index)
    expansion_jobs = sum(len(entry["jobs"]) for entry in expansion_index)
    gap_jobs = sum(
        len(entry["jobs"])
        for entry in expansion_index
        if str(entry.get("category", "")).endswith("_gap")
    )
    total_jobs = current_jobs + expansion_jobs
    total_frames = sum(
        job_frame_count(job)
        for entry in current_index + expansion_index
        for job in entry["jobs"]
    )
    content = f"""# Sprite Production and Render Prompt Pack

This directory is the current production-art source of truth for rendering work.

```yaml
approved_reference: "{STYLE_REFERENCE}"
current_targets: {len(current_index)}
current_jobs: {current_jobs}
expansion_entries: {len(expansion_index)}
expansion_jobs: {expansion_jobs}
remaining_gap_jobs: {gap_jobs}
total_render_jobs: {total_jobs}
total_prompted_frames: {total_frames}
```

## Start here

1. Read `STYLE-TARGET.md` and attach the approved six-image board plus the listed repository-backed continuity references to the render request.
2. Read `CORPUS-COVERAGE.md` and `STATE-REVIEW.md` for exact current, expansion, and audited-gap coverage.
3. Follow `FULL-SCOPE-PLAN.md` and `RENDER-QUEUE.md` for production order.
4. Open `render-jobs/INDEX.md`, choose one individual ready-to-paste job, and copy only its **Prompt** block into the image renderer.
5. Save the result to the job's declared `output_image` path and review it with `REVIEW-CHECKLIST.md`.
6. Clean and assemble accepted cells into the stable runtime atlas. Do not replace production assets directly with unchecked raw renders.

The files under `prompts/current/` and `prompts/expansion/` remain useful operator bundles. `render-jobs/` is the canonical one-file-per-request corpus.

Accepted normalized render inputs used to reproduce committed runtime atlases live under `accepted-renders/`. Raw review batches remain outside normal source history, but every promoted atlas must retain the exact cleaned cells and receipt required by its deterministic integration check.

## Directory map

```text
sprite-production/
├── README.md
├── STYLE-TARGET.md
├── STATE-REVIEW.md
├── CORPUS-COVERAGE.md
├── FULL-SCOPE-PLAN.md
├── RENDER-QUEUE.md
├── REVIEW-CHECKLIST.md
├── prompt-index.yml
├── remaining-gaps.yml
├── accepted-renders/ # curated inputs and receipts for promoted runtime atlases
├── render-jobs/
│   ├── INDEX.md
│   ├── manifest.json
│   ├── current/      # one ready-to-render Markdown file per current job
│   └── expansion/    # full-scope and remaining-gap jobs
└── prompts/
    ├── current/      # operator bundles grouped by current atlas/template
    └── expansion/    # operator bundles for expansions and audited gaps
```

## Grid rule

Every render job is at most four cells wide and four cells high. Large runtime atlases are assembled from small jobs. This is intentional: small grids preserve character identity, cell alignment, action readability and cleanup quality far more reliably than a single mega-sheet prompt.

## Regeneration

```sh
python3 scripts/generate-sprite-render-prompts.py
python3 scripts/generate-sprite-render-prompts.py --check
```

The first command regenerates the pack. The check command renders into a temporary directory and fails when output is stale, missing, or unexpectedly modified. The generator reads `data/sprites.json`, `docs/story-flavour.yml`, and `docs/sprite-production/remaining-gaps.yml`. Review generated changes before committing.

## Atlas assembly

Every current entry in `prompt-index.yml` contains an exact `assembly` plan with source cells, destination cells, rectangles, atlas dimensions, and conflict metadata. After saving and cleaning the render jobs for one sheet, assemble them safely with:

```sh
python3 scripts/assemble-sprite-atlas.py --list
python3 scripts/assemble-sprite-atlas.py moss_badger_production
python3 scripts/assemble-sprite-atlas.py moss_badger_production --verify-only
```

The default output is `generated/sprite-atlases/<sheet-id>.png`; existing files are never replaced without `--overwrite`. Writing directly to a runtime production atlas requires both `--write-target` and `--overwrite`. Missing render jobs fail the assembly unless `--allow-missing` is explicitly supplied for a transparent partial preview.
"""
    (OUT / "README.md").write_text(content, encoding="utf-8")


def generate_pack(output: Path) -> dict[str, Any]:
    configure_output(output)
    OUT.mkdir(parents=True, exist_ok=True)
    for directory in [CURRENT, EXPANSION]:
        if directory.exists():
            for path in sorted(directory.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink()
                elif path.is_dir():
                    path.rmdir()
        directory.mkdir(parents=True, exist_ok=True)

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    story = yaml.safe_load(STORY_PATH.read_text(encoding="utf-8"))
    gaps = yaml.safe_load(GAPS_PATH.read_text(encoding="utf-8"))
    sheets = manifest["sheets"]

    current_index = write_current_prompts(sheets)
    expansion_index: list[dict[str, Any]] = []
    expansion_index += write_expansion_enemies()
    expansion_index += write_player_templates()
    expansion_index += write_world_expansions()
    expansion_index.append(write_weapon_pack())
    expansion_index += write_ui_templates(story)
    expansion_index += write_remaining_gap_prompts(sheets, gaps)

    hydrate_job_prompts(current_index, "current")
    hydrate_job_prompts(expansion_index, "expansion")

    write_style_target()
    write_state_review(sheets, current_index)
    write_full_scope_plan(current_index, expansion_index)
    write_render_queue(current_index, expansion_index)
    write_readme(current_index, expansion_index)
    write_review_checklist()
    write_corpus_coverage(current_index, expansion_index)
    render_manifest = write_render_jobs(current_index, expansion_index)

    index = {
        "schema_version": 2,
        "corpus_version": CORPUS_VERSION,
        "generated_by": "scripts/generate-sprite-render-prompts.py",
        "generated_for_manifest": str(MANIFEST_PATH.relative_to(ROOT)),
        "remaining_gap_catalog": str(GAPS_PATH.relative_to(ROOT)),
        "render_job_manifest": canonical_prompt_path(
            RENDER_JOBS / RENDER_MANIFEST_NAME
        ),
        "style_reference": STYLE_REFERENCE,
        "style_reference_images": list(STYLE_REFERENCE_IMAGES),
        "constraints": {"max_grid_columns": 4, "max_grid_rows": 4},
        "current": current_index,
        "expansion": expansion_index,
        "archival": [
            {
                "sheet_id": sheet["id"],
                "status": sheet_status(sheet),
                "file": sheet["file"],
            }
            for sheet in sheets
            if sheet_status(sheet) in {"archival_source", "superseded_archive"}
        ],
    }
    (OUT / "prompt-index.yml").write_text(
        yaml.safe_dump(strip_private(index), sort_keys=False, width=110),
        encoding="utf-8",
    )

    return {
        "output": str(CANONICAL_OUT.relative_to(ROOT)),
        "current_targets": len(current_index),
        "current_jobs": sum(len(entry["jobs"]) for entry in current_index),
        "expansion_entries": len(expansion_index),
        "expansion_jobs": sum(len(entry["jobs"]) for entry in expansion_index),
        "remaining_gap_jobs": sum(render_manifest["remainingGapJobCounts"].values()),
        "render_jobs": render_manifest["jobCount"],
        "prompted_frames": render_manifest["promptedFrameCount"],
        "markdown_files": len(list(OUT.rglob("*.md"))),
    }


GENERATED_TOP_LEVEL_FILES = {
    "CORPUS-COVERAGE.md",
    "FULL-SCOPE-PLAN.md",
    "README.md",
    "RENDER-QUEUE.md",
    "REVIEW-CHECKLIST.md",
    "STATE-REVIEW.md",
    "STYLE-TARGET.md",
    "prompt-index.yml",
}
GENERATED_SUBTREES = {"prompts", "render-jobs"}


def tree_snapshot(directory: Path) -> dict[str, bytes]:
    """Snapshot only files owned by this generator.

    Chronicle image harvests, receipts, render audits, and other production
    evidence intentionally coexist below docs/sprite-production. They are
    external inputs/outputs and must not make --check report false drift.
    """

    if not directory.exists():
        return {}
    snapshot: dict[str, bytes] = {}
    for path in sorted(directory.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(directory)
        if (
            len(relative.parts) == 1
            and relative.name in GENERATED_TOP_LEVEL_FILES
        ) or relative.parts[0] in GENERATED_SUBTREES:
            snapshot[relative.as_posix()] = path.read_bytes()
    return snapshot


def prompt_pack_differences(expected: Path, generated: Path) -> list[str]:
    expected_files = tree_snapshot(expected)
    generated_files = tree_snapshot(generated)
    differences: list[str] = []
    for relative in sorted(expected_files.keys() | generated_files.keys()):
        if relative not in expected_files:
            differences.append(f"unexpected generated file: {relative}")
        elif relative not in generated_files:
            differences.append(f"missing generated file: {relative}")
        elif expected_files[relative] != generated_files[relative]:
            differences.append(f"stale generated file: {relative}")
    return differences


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Generate into a temporary directory and fail if docs/sprite-production is stale.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.check:
        if not CANONICAL_OUT.exists():
            print(f"sprite prompt pack is missing: {CANONICAL_OUT.relative_to(ROOT)}")
            return 1
        with tempfile.TemporaryDirectory(
            prefix=".sprite-production-check-", dir=ROOT
        ) as temporary:
            generated = Path(temporary) / "sprite-production"
            summary = generate_pack(generated)
            differences = prompt_pack_differences(CANONICAL_OUT, generated)
        configure_output(CANONICAL_OUT)
        if differences:
            print("sprite prompt pack is stale:")
            for difference in differences[:40]:
                print(f"- {difference}")
            if len(differences) > 40:
                print(f"- ... and {len(differences) - 40} more difference(s)")
            return 1
        print(json.dumps({**summary, "check": "clean"}, indent=2))
        return 0

    summary = generate_pack(CANONICAL_OUT)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
