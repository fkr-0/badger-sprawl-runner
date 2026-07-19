import datetime
import json
import os
import re
import textwrap
from pathlib import Path

import yaml


class NoAliasDumper(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True


def prompt(subject, details):
    return f"{subject}; {details}; 2D side-scrolling platformer asset, readable silhouette, chunky hand-painted pixel texture, cyber-noir dub-punk palette, transparent background, no text unless specified, game-ready."


global_prompt_suffix = "Readable at 1x and 2x scale; strong rim light; grime, tape labels, handbuilt electronics; avoid photorealism."

data = {
    "badger_sprawl_runner_story_content_pack": {
        "schema_version": "1.0.0",
        "intended_game": "Badger Sprawl Runner",
        "genre": "2D adventure platformer hack-and-slash with heist, rhythm, and coding-gate layers",
        "design_note": (
            "Expanded from the uploaded story bible: Moss the badger courier becomes involved with a dub-infused free colony, "
            "exposes corporate orbital control, and helps convert a captured asteroid into a rebel broadcast fortress."
        ),
        "tone_targets": [
            "street-level noir with rain, debt, neon, food steam, and locked routes",
            "dub colony warmth: bass, repair benches, gardens, arguments, mutual aid",
            "orbital luxury as cold theater, mirrored manners, contract violence",
            "political satire with visible systems, placards, chorus songs, and jokes that cut",
            "mathematical logic, hacker jargon, graffiti craft, syndicalist organizing, and class pressure as world texture",
        ],
        "content_safety_style_rule": (
            "Use cultural references as broad atmosphere only. Do not imitate any living artist's voice or specific copyrighted prose style."
        ),
        "global_lore": {
            "universe_name": "The Rent-Locked Sky",
            "primary_planet": {
                "name": "Brackwater",
                "description": "A wet industrial planet whose old canal cities grew upward into toll-stacked arcologies and cable nests.",
                "biomes": [
                    "rain markets",
                    "salt marsh tunnels",
                    "concrete seawalls",
                    "factory roofs",
                    "submerged metro relics",
                ],
            },
            "orbital_shell": {
                "name": "The Nacre Ring",
                "description": "A luxury logistics halo where air, elevator access, sunlight, and silence are leased by the minute.",
            },
            "rebel_body": {
                "name": "Speakerstone-9",
                "description": "A mined-out satellite asteroid with enough iron, old solar foil, and hollow chambers to become a pirate transmitter fortress.",
            },
            "network_layers": [
                {
                    "name": "Street Ledger",
                    "function": "locks bridges, drains, gates, clinics, and food stalls behind toll permissions",
                },
                {
                    "name": "Lift Ledger",
                    "function": "treats people as cargo categories under orbital customs math",
                },
                {
                    "name": "Sky-Lock",
                    "function": "orbital resource control network that prices breathable air and transit",
                },
                {
                    "name": "Choirband",
                    "function": "pirate radio mesh used by the Choir of Static to coordinate mutual aid",
                },
            ],
            "factions": [
                {
                    "id": "dub_colony",
                    "name": "Dub Colony Free Assembly",
                    "ethos": "Repair what can be shared. Sample what was stolen. Never let a fortress call itself freedom.",
                    "visuals": "patched solar cloth, speaker stacks, greenhouse cars, handwritten votes, warm amber work lights",
                    "common_slogans": [
                        "Bass is a bridge.",
                        "No toll on breath.",
                        "A route is public when feet remember it.",
                    ],
                },
                {
                    "id": "vane_directorate",
                    "name": "Vane Directorate",
                    "ethos": "Stability through ownership, obedience through debt, cleanliness through exclusion.",
                    "visuals": "white chrome, black glass, gold legal stamps, blue security beams, silent drones",
                    "common_slogans": [
                        "Order arrives on schedule.",
                        "Credit is citizenship.",
                        "A free route is an unmeasured risk.",
                    ],
                },
                {
                    "id": "choir_static",
                    "name": "The Choir of Static",
                    "ethos": "A distributed chorus of stalls, squats, hackers, trainwriters, welders, and kitchen crews.",
                    "visuals": "radio tags, cracked handhelds, stickers over cameras, chalk routes, cassette labels",
                    "common_slogans": [
                        "Many mouths, one signal.",
                        "Share the map.",
                        "Do not become the lock you broke.",
                    ],
                },
                {
                    "id": "king_feedback_bloc",
                    "name": "Feedback Bloc",
                    "ethos": "A nervous rebel faction that believes freedom must temporarily centralize command.",
                    "visuals": "heavy amps, red cables, stamped emergency badges, reinforced speaker armor",
                    "common_slogans": [
                        "Safety first, votes later.",
                        "One signal or no signal.",
                    ],
                },
            ],
            "gear_and_system_names": [
                {
                    "id": "whisker_wetware_mk0",
                    "display_name": "Whisker Wetware MK-0",
                    "owner": "Moss",
                    "function": "illegal signal-sensing whisker implants that reveal routes, lies, and hidden machines",
                    "ui_flavor": "The whiskers twitch when rent is near.",
                    "sprite_prompt": prompt(
                        "badger whisker implant UI icon",
                        "six silver whisker filaments over a tiny green waveform, scratched brass socket, tiny warning decal",
                    ),
                },
                {
                    "id": "clawline_protocol",
                    "display_name": "Clawline Protocol",
                    "owner": "Moss",
                    "function": "melee/parry upgrade tree that treats claw strikes as route-making rather than pure violence",
                    "ui_flavor": "Cut the lock, not the neighbor.",
                    "sprite_prompt": prompt(
                        "claw slash upgrade emblem",
                        "three ivory claw marks crossing a red turnstile sign, sparks and rain droplets",
                    ),
                },
                {
                    "id": "skankpack_7",
                    "display_name": "Skankpack-7 Rocket Rig",
                    "owner": "Sister Version",
                    "function": "short-burst rocket pack with dub-delay recharge beats",
                    "ui_flavor": "Jump on the offbeat. Land where they said you could not.",
                    "sprite_prompt": prompt(
                        "compact badger rocket backpack",
                        "patched steel cylinders, cloth straps, glowing bass-valve, stencil number 7, soot at exhaust",
                    ),
                },
                {
                    "id": "bass_reactor_core",
                    "display_name": "Bass Reactor Core",
                    "owner": "Dub Colony",
                    "function": "powers transmitters, rhythm puzzles, shield pulses, and crowd buffs",
                    "ui_flavor": "A battery that remembers every basement party.",
                    "sprite_prompt": prompt(
                        "bass reactor core",
                        "round subwoofer coil suspended in amber coolant, copper cables, glowing low-frequency rings",
                    ),
                },
                {
                    "id": "godel_deadbolt",
                    "display_name": "Gödel Deadbolt",
                    "owner": "Vane Directorate",
                    "function": "logic lock that cannot prove its own safe state; used in coding-gate minigames",
                    "ui_flavor": "The door is true, but not usefully true.",
                    "sprite_prompt": prompt(
                        "logic deadbolt terminal",
                        "black metal lock with recursive brackets, amber error glyphs, toggle switches",
                    ),
                },
                {
                    "id": "turing_ratcheter",
                    "display_name": "Turing Ratcheter",
                    "owner": "Rook Null",
                    "function": "portable state-machine debugger for code gates and enemy pattern reveals",
                    "ui_flavor": "All monsters have states. Most bosses call them principles.",
                    "sprite_prompt": prompt(
                        "portable hacker debugger device",
                        "radio shell, tape counter, logic lamps, tiny paper tape spool, worn keys",
                    ),
                },
                {
                    "id": "sisyphus_conveyor_patch",
                    "display_name": "Sisyphus Conveyor Patch",
                    "owner": "Naya Root",
                    "function": "shield mod that turns repeated blocked hits into momentum",
                    "ui_flavor": "Push the rock. Learn the hill. Break the hill.",
                    "sprite_prompt": prompt(
                        "shield patch icon",
                        "round patch showing a badger paw pushing a gear uphill, threadbare edges, green stitchwork",
                    ),
                },
            ],
            "global_idle_actions": [
                {
                    "trigger_seconds": 8,
                    "animation": "Moss sniffs the air, one wetware whisker sparks, then he shakes rain off his ears.",
                    "dialogue": "Moss: The street's still charging rent just for standing on it.",
                },
                {
                    "trigger_seconds": 16,
                    "animation": "Rook Null projects a small decision tree above Moss, then deletes every branch labeled 'wait politely'.",
                    "dialogue": "Rook Null: Inaction has a cost. The Directorate bills it monthly.",
                },
                {
                    "trigger_seconds": 24,
                    "animation": "Auntie Subharmonic's pirate signal bleeds into the HUD as a bass pulse.",
                    "dialogue": "Auntie Subharmonic: Baby, even silence got rhythm. Use yours.",
                },
            ],
            "global_enemy_callouts": {
                "low_health": [
                    "Gate Piker: He clipped my meter!",
                    "Customs Drone: Unlicensed impact detected!",
                    "Chrome Guard: Stop resisting the floor plan!",
                ],
                "player_parries": [
                    "Knife Drone: Counter-pattern! Counter-pattern!",
                    "Vitrine Clerk: That defense was not filed in triplicate!",
                ],
                "player_idles_near_enemy": [
                    "Rent Cop: Loitering fee begins now.",
                    "Lift Marshal: Stillness is suspicious cargo.",
                ],
            },
            "global_sound_vibes": {
                "movement": "rubber soles on wet tile, claw scrapes, coat fabric, quick inhaled badger grunts",
                "melee": "dry snare cracks, box-cutter metal, dub spring reverb tails, arcade hit sparks",
                "hacking": "cassette seek, relay clicks, tape hiss, tiny sine tones, punched-card flutter",
                "collectibles": "vinyl chirp, coin-on-turntable shimmer, distant crowd 'ay!'",
                "boss_phase_shift": "sub drop, projector slap, courtroom gavel, feedback bloom",
            },
            "sprite_texture_style_guide": {
                "camera": "side-view 2D, strong silhouette first, texture detail second",
                "palette": "wet asphalt, amber shop lights, oxidized copper, bruised violet, warning red, sterile orbital white",
                "material_language": [
                    "street tech is repaired, tagged, taped, dented, warm",
                    "corporate tech is seamless, mirrored, quiet, hostile",
                    "rebel tech reveals screws, labels, hand paint, and visible cable routes",
                ],
                "prompt_suffix": global_prompt_suffix,
            },
        },
        "chapters": [],
    }
}


def common_character_prompts():
    return {
        "moss": prompt(
            "Moss playable badger courier",
            "short muscular badger in patched courier coat, illegal chrome whisker implants, claw wraps, tired eyes, rain shine",
        ),
        "sister_version": prompt(
            "Sister Version dub colony engineer",
            "otter or mongoose engineer with soldering goggles, speaker-tool belt, patched flight apron, confident grin",
        ),
        "rook_null": prompt(
            "Rook Null radio AI avatar",
            "flickering raven-shaped hologram made of radio waveforms, CRT scanlines, calm geometric eyes",
        ),
        "auntie_subharmonic": prompt(
            "Auntie Subharmonic elder merchant",
            "elder possum or badger in record-shop shawl, gold tooth, cassette charms, tiny portable turntable",
        ),
        "murr_murrby": prompt(
            "Murr Murrby void-cat merchant",
            "sleek black cat in puffed vacuum vest, floating shop satchel, charming suspicious smile",
        ),
        "lio": prompt(
            "Lio courier ally",
            "lean fox courier with debt collar hidden under scarf, torn flight jacket, conflicted gaze",
        ),
        "naya_root": prompt(
            "Naya Root shield fighter",
            "greenhouse defender raccoon or hare with leaf-pattern shield, work boots, seed pouch, practical armor",
        ),
    }


base_char_prompts = common_character_prompts()

chapters = [
    {
        "chapter_id": "ch01_lower_sprawl",
        "stage_index": 1,
        "act": "Prologue / Act I",
        "world_id": "lower_sprawl",
        "world_name": "Lower Sprawl",
        "stage_title": "The Song of the Toll",
        "level_codename": "STG_01_TOLL_RAIN",
        "primary_verb": "jump_run",
        "heist_payload": "wafer_key",
        "dramatic_question": "Who owns the street?",
        "placard": "A city that charges for crossing the street will one day charge for breathing.",
        "world_building": {
            "scenic_description": (
                "The Lower Sprawl is a rain-soaked knot of market tarps, privatized footbridges, drain ladders, noodle steam, "
                "tagged power boxes, and toll gates bolted to streets that predate the corporations. Every shortcut has a price. "
                "Every price has a smiling mascot. Children know pipe routes better than maps."
            ),
            "political_machine": "Street Ledger micro-tolls convert movement into debt and divide neighborhoods into purchasable routes.",
            "local_rumor": "A gate under Kettle Bridge opens only when the pirate station plays three bass notes in a row.",
            "areas": [
                {
                    "area_id": "rain_turnstiles",
                    "name": "Rain Turnstiles",
                    "gameplay": "Intro platforming over toll gates, bus roofs, and sparking puddles.",
                    "texture_descriptions": [
                        "wet asphalt with old zebra crossings half-covered by fee decals",
                        "cheap plastic toll pillars with smiling badger-hostile mascots",
                        "rainwater reflecting neon noodle signs and police-blue scanner beams",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "street toll gate asset",
                            "waist-high chrome turnstile with coin slot, red scanner eye, peeling sticker reading ROUTE FEE",
                        ),
                        prompt(
                            "wet sprawl noodle stall",
                            "tarpaulin roof, steam pot, hanging peppers, hacked radio taped under counter",
                        ),
                        prompt(
                            "stacked market bridge background",
                            "crooked footbridges, laundry, glowing cable knots, rain haze, tiny silhouettes",
                        ),
                    ],
                },
                {
                    "area_id": "kettle_bridge",
                    "name": "Kettle Bridge",
                    "gameplay": "Vertical climb through pipes while drones sweep paid lanes.",
                    "texture_descriptions": [
                        "rusted bridge ribs with hand-painted anti-toll slogans",
                        "steam grates that push Moss upward on rhythm",
                        "graffiti tags layered like neighborhood arguments",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "graffiti-covered bridge support",
                            "rusty concrete pillar covered in bubble letters, arrows, crew tags, rain drips",
                        ),
                        prompt(
                            "steam vent platform",
                            "round grate blasting white steam, copper bolts, hazard tape worn thin",
                        ),
                    ],
                },
                {
                    "area_id": "ledger_office",
                    "name": "Ledger Office Annex",
                    "gameplay": "Stealth-lite route with cameras, paper receipts, and the first hacking terminal.",
                    "texture_descriptions": [
                        "old municipal office converted into corporate booth farm",
                        "receipt paper waterfalls, file cages, flickering legal stamps",
                        "warm human clutter trapped under cold surveillance glass",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "toll ledger terminal",
                            "green monochrome screen, receipt printer, red wax corporate seal, exposed wires",
                        ),
                        prompt(
                            "paper receipt waterfall",
                            "long curling strips of printed debt receipts spilling from ceiling slot",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "moss",
                "display_name": "Moss",
                "role": "Player courier and reluctant thief",
                "model_name": "CHR_MOSS_BASE_RAIN",
                "visual_prompt": base_char_prompts["moss"],
                "voice": "dry, stubborn, observant",
                "mini_dialogue": [
                    "Moss: I don't hate gates. I hate gates that smirk.",
                    "Moss: Street smells wrong. Like wet coins and someone else's law.",
                ],
            },
            {
                "id": "auntie_subharmonic",
                "display_name": "Auntie Subharmonic",
                "role": "Pirate-radio mentor and ethical merchant",
                "model_name": "NPC_AUNTIE_RADIO_GHOST",
                "visual_prompt": base_char_prompts["auntie_subharmonic"],
                "voice": "warm, teasing, sharp",
                "mini_dialogue": [
                    "Auntie Subharmonic: First rule of a toll booth, child: it pretends the road was born yesterday.",
                    "Auntie Subharmonic: Take the wafer-key, but listen to what it unlocks.",
                ],
            },
            {
                "id": "juno_jar",
                "display_name": "Juno Jar",
                "role": "Street kid map-runner and side quest giver",
                "model_name": "NPC_JUNO_PIPEKID",
                "visual_prompt": prompt(
                    "street kid map-runner",
                    "small rat child in oversized rain poncho, chalk map tube, bright eyes, muddy boots",
                ),
                "voice": "fast, practical, funny",
                "mini_dialogue": [
                    "Juno Jar: Paid bridge is for tall people with passwords. Pipe's free if you don't mind spiders.",
                    "Juno Jar: You got claws. I got chalk. That's almost a union.",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss accepts a simple courier-theft job, intending to steal a wafer-key and sell it.",
            "A pirate dub signal interrupts the route and reveals that the toll system is linked to water, elevators, and orbital air leases.",
            "Moss sees children crawling through drains to avoid bridge fees.",
            "Tollbooth Captain Grin frames his job as public order, then attacks when Moss leaks the ledger preview.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE STREET WAS PUBLIC UNTIL SOMEONE LEARNED TO COUNT FOOTSTEPS.",
                },
                {"speaker": "Moss", "text": "Just a key. In, out, paws dry."},
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "Dry paws? In this city? Baby, you're already dreaming.",
                },
            ],
            "first_gate": [
                {
                    "speaker": "Toll Mascot Speaker",
                    "text": "Welcome, valued walker. Please classify your need to cross.",
                },
                {"speaker": "Moss", "text": "Urgent badger business."},
                {
                    "speaker": "Toll Mascot Speaker",
                    "text": "Urgency surcharge applied.",
                },
            ],
            "juno_rescue": [
                {
                    "speaker": "Juno Jar",
                    "text": "Don't smash the pipe. It's older than the cops.",
                },
                {
                    "speaker": "Moss",
                    "text": "Then I'll smash the lock pretending it owns the pipe.",
                },
            ],
            "boss_pre": [
                {
                    "speaker": "Captain Grin",
                    "text": "Movement without permission is disorder.",
                },
                {
                    "speaker": "Moss",
                    "text": "Funny. I was moving fine until you arrived.",
                },
            ],
            "stage_exit": [
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "That wafer-key hums with more than bridges.",
                },
                {
                    "speaker": "Moss",
                    "text": "It names water meters, elevators, clinic doors... air?",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Correct. You stole a small key from a large prison.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 7,
                "animation": "Moss flicks rain from his claws.",
                "dialogue": "Moss: I can hear the meter thinking about me.",
            },
            {
                "seconds": 14,
                "animation": "A toll gate prints a tiny receipt for Moss standing still.",
                "dialogue": "Toll Mascot Speaker: Loitering event politely recorded.",
            },
            {
                "seconds": 23,
                "animation": "Juno draws a secret arrow in chalk, then rubs it out.",
                "dialogue": "Juno Jar: Waiting is fine. Getting billed for it is rude.",
            },
        ],
        "side_quests": [
            {
                "id": "sq01_pipe_map",
                "title": "Chalk Map for the Short-Legged",
                "giver": "Juno Jar",
                "objective": "Collect five chalk marks hidden behind toll gates and return them to the pipe kids.",
                "steps": [
                    "Find chalk mark behind noodle stall sign.",
                    "Parry a gate drone to knock open the school drain.",
                    "Ride steam vents to mark a safe roof route.",
                    "Hack one Street Ledger terminal to erase a child-route fee.",
                    "Return to Juno before triggering boss alarm for bonus trust.",
                ],
                "reward": {
                    "mechanic": "Pipe Route shortcut network unlocks replay paths.",
                    "currency": "3 Soul-Sample Tokens",
                    "trust_shift": {"choir_static": 2, "moss_self_interest": -1},
                },
                "sample_dialogue": [
                    {"speaker": "Juno Jar", "text": "You made the map bigger."},
                    {"speaker": "Moss", "text": "No. I made the lie smaller."},
                ],
            },
            {
                "id": "sq01_noodle_radio",
                "title": "Noodle Stall Antenna",
                "giver": "Vendor Ma Oxbow",
                "objective": "Repoint three soup-can antennas without being seen by rent cops.",
                "reward": {
                    "mechanic": "Pirate Signal hints appear near hidden rooms.",
                    "shop_discount": "5% on healing broth in Lower Sprawl",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Ma Oxbow",
                        "text": "Soup feeds bodies. Signal feeds running feet.",
                    },
                    {
                        "speaker": "Auntie Subharmonic",
                        "text": "And bass feeds courage, darling.",
                    },
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg01_turnstile_timing",
                "name": "Offbeat Turnstile Hop",
                "type": "rhythm_platforming",
                "rules": "Jump on bass offbeats to pass toll arms without paying or taking chip damage.",
                "failure_bark": "Toll Mascot Speaker: Rhythm violation fee assessed.",
                "success_bark": "Auntie Subharmonic: See? The city swings when you stop marching.",
            },
            {
                "id": "mg01_receipt_logic",
                "name": "Receipt Logic Scratch",
                "type": "simple_hacking_gate",
                "rules": "Reorder paper-tape conditions so 'walker exists' no longer implies 'walker owes'.",
                "success_reward": "Wafer-key fragment and lore receipt.",
            },
        ],
        "allies_available": [
            {
                "id": "auntie_subharmonic",
                "support_type": "radio_hint",
                "trust_condition": "Always available after first pirate signal.",
            },
            {
                "id": "juno_jar",
                "support_type": "shortcut_marker",
                "trust_condition": "Complete Chalk Map for the Short-Legged.",
            },
        ],
        "enemies": [
            {
                "id": "rent_cop_piker",
                "display_name": "Rent Cop Piker",
                "model_name": "ENM_RENTCOP_PIKE_A",
                "behavior": "Marches in straight lanes, pokes across platforms, vulnerable to jump-over backslash.",
                "callouts": [
                    "Unlicensed running!",
                    "Stop! That sidewalk is premium!",
                    "Your paws are in arrears!",
                ],
                "sprite_prompt": prompt(
                    "rent cop piker enemy",
                    "weasel officer with raincoat armor, long toll pike, glowing receipt pad on chest",
                ),
                "sound_vibe": "boot stomp, coin clack, whistle chopped into snare hit",
            },
            {
                "id": "turnstile_mite",
                "display_name": "Turnstile Mite",
                "model_name": "ENM_TURNSTILE_MITE",
                "behavior": "Small crawling gate robot that becomes a spinning hazard when alerted.",
                "callouts": [
                    "Click-click-pay!",
                    "Route not recognized!",
                    "Tiny fee! Tiny fee!",
                ],
                "sprite_prompt": prompt(
                    "turnstile mite robot",
                    "small crab-like robot made from turnstile arms and coin slots, red cyclops lens",
                ),
                "sound_vibe": "ratchet clicks, coin drop, tiny servo squeal",
            },
            {
                "id": "ledger_clerk_drone",
                "display_name": "Ledger Clerk Drone",
                "model_name": "ENM_LEDGER_CLERK_FLOAT",
                "behavior": "Floats above pits, prints paper snares, can be pulled down with clawline hook.",
                "callouts": [
                    "Please initial your defeat.",
                    "The form has teeth.",
                    "Your complaint is important to no one.",
                ],
                "sprite_prompt": prompt(
                    "floating ledger clerk drone",
                    "boxy drone with printer mouth, legal stamp arm, paper streamer tail",
                ),
                "sound_vibe": "dot-matrix screech, stamp thud, fluttering receipt paper",
            },
        ],
        "boss": {
            "id": "boss_tollbooth_captain_grin",
            "display_name": "Tollbooth Captain Grin",
            "model_name": "BOSS_CAPTAIN_GRIN_TOLLMECH",
            "role": "Boss of Chapter 1 and avatar of privatized movement",
            "arena": "Circular toll plaza with three paid lanes, two pipe routes, and projector placards that announce each phase.",
            "phases": [
                {
                    "name": "Polite Collection",
                    "mechanic": "Grin summons toll arms and asks for route declarations.",
                },
                {
                    "name": "Debt Spiral",
                    "mechanic": "Receipts become paper saws; parry them to reveal the ledger terminal.",
                },
                {
                    "name": "Public Road",
                    "mechanic": "Juno opens pipe exits if side quest completed; otherwise Moss must brute-force the booth.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Captain Grin",
                    "text": "I do not own the street. I simply administer its gratitude.",
                },
                {
                    "speaker": "Moss",
                    "text": "Then tell the street I decline its manners.",
                },
                {
                    "speaker": "Captain Grin",
                    "text": "Ungrateful citizens become traffic.",
                },
            ],
            "defeat_line": "Captain Grin: Without fees, how will anyone know where they are allowed to stand?",
            "sprite_prompt": prompt(
                "tollbooth captain boss",
                "smiling badger-like official in armored toll booth exosuit, coin eyes, striped barrier arms as weapons",
            ),
            "music": "mid-tempo dub-noir chase, walking bass, brushed snare, rain foley sidechain, mouth-harp hook",
        },
        "sound_effect_vibes": {
            "ambient": "constant rain, distant scooters, market calls, power hum, bass leaking through drains",
            "hazards": "electric puddle fizz, gate arm slap, paper cutter slice",
            "collectible": "45-rpm record chirp with a small coin ping",
            "boss": "cash-register kick drum, stamp-gavel snare, tape delay on every laugh",
        },
        "musical_theme": {
            "name": "Toll Rain Skank",
            "bpm": 88,
            "mode": "D minor with bluesy chromatic passing tones",
            "instruments": [
                "upright bass sample",
                "dub organ stab",
                "brushed kit",
                "wet street percussion",
                "muted trumpet fragments",
            ],
            "dynamic_layers": [
                "exploration: sparse bass and rain",
                "combat: snare doubles and turnstile clicks become hi-hats",
                "boss: horn stabs answer Captain Grin's barrier swings",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_LOWER_SPRAWL_RAINMARKET",
                "prompt": prompt(
                    "rain market background",
                    "dense layered cyberpunk street market, food steam, hanging cables, toll gates, graffiti, noir lighting",
                ),
            },
            {
                "asset_id": "TEX_WET_ASPHALT_DECALS",
                "prompt": prompt(
                    "wet asphalt texture tile",
                    "dark road surface with puddle reflections, faded crosswalk, route-fee stickers, grime",
                ),
            },
            {
                "asset_id": "PROP_PIRATE_RADIO_SOUPCAN",
                "prompt": prompt(
                    "soup can pirate radio antenna",
                    "tin can antenna tied to noodle stall pole, copper wire, tape, small blinking LED",
                ),
            },
            {
                "asset_id": "UI_WAFER_KEY",
                "prompt": prompt(
                    "wafer key collectible",
                    "thin translucent circuit wafer, street map traces, water droplet, green glow",
                ),
            },
        ],
        "secrets": [
            "A hidden club door opens if the player parries three receipt papers without touching the ground.",
            "Graffiti reading 'NO BREATH RENT' foreshadows Act V.",
        ],
        "completion_flags": {
            "main": [
                "wafer_key_acquired",
                "street_ledger_preview_seen",
                "captain_grin_defeated",
            ],
            "optional": [
                "pipe_kids_aided",
                "noodle_antenna_aligned",
                "juno_trust_plus",
            ],
        },
    },
    {
        "chapter_id": "ch02_drainmarket",
        "stage_index": 2,
        "act": "Act I",
        "world_id": "lower_sprawl",
        "world_name": "Drainmarket",
        "stage_title": "Knife Weather Under the City",
        "level_codename": "STG_02_DRAINMARKET_CUT",
        "primary_verb": "melee_parry",
        "heist_payload": "stim_cache",
        "dramatic_question": "Who profits from injury?",
        "placard": "The wound was privatized before the bandage was invented.",
        "world_building": {
            "scenic_description": (
                "Drainmarket hangs below the official city in old storm channels, freight tunnels, and sump caverns. Clinics trade in stimulant debt, "
                "knife drones nest in broken fans, and DJs test beats against dripping concrete. Graffiti crews treat tunnel walls as newspapers."
            ),
            "political_machine": "Clinic debt turns injured workers into repeat customers, informants, and disposable night labor.",
            "local_rumor": "The stim cache contains medicine, but also tracking dye that lets the Directorate map desperate neighborhoods.",
            "areas": [
                {
                    "area_id": "sump_bazaar",
                    "name": "Sump Bazaar",
                    "gameplay": "Combat tutorial for parries, dodge cancels, and healing item ethics.",
                    "texture_descriptions": [
                        "tarps stretched between sewer ribs",
                        "clinic neon reflected in ankle-deep water",
                        "milk crates of bootleg stims beside broken turntables",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "underground sump bazaar",
                            "sewer market with tarps, crates, clinic signs, puddles, warm lanterns, graffiti",
                        ),
                        prompt(
                            "bootleg stim crate",
                            "plastic medical crate with cracked seal, colored vials, barcode scratched off",
                        ),
                    ],
                },
                {
                    "area_id": "fan_nest",
                    "name": "Knife-Drone Fan Nest",
                    "gameplay": "Arena rooms where spinning fan blades hide drone spawns.",
                    "texture_descriptions": [
                        "giant drainage fans with chewed safety grates",
                        "scrap nests made of stolen surgical blades",
                        "red warning lights pulsing in polluted mist",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "giant sewer fan hazard",
                            "rusted industrial fan with missing grate, mist trails, warning stripes",
                        ),
                        prompt(
                            "knife drone nest",
                            "bundle of surgical blades, wires, drone eggs, greasy feathers",
                        ),
                    ],
                },
                {
                    "area_id": "blue_note_squat",
                    "name": "Blue Note Squat",
                    "gameplay": "Safe room with jazz-club warmth, side quest hub, and beat-making minigame.",
                    "texture_descriptions": [
                        "old tunnel station converted into a tiny jazz club",
                        "candlelit tables, cracked sax case, sampler pads, mural of workers holding umbrellas",
                        "walls tagged with layered trainwriting styles and local warnings",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "underground jazz squat interior",
                            "tiny club in abandoned metro tunnel, candles, sampler, sax case, graffiti murals",
                        ),
                        prompt(
                            "sampler pad minigame prop",
                            "worn MPC-style beat pad, stickers, glowing pads, cassette deck beside it",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "rook_null",
                "display_name": "Rook Null",
                "role": "Former logistics AI companion, introduced fully here",
                "model_name": "NPC_ROOK_NULL_RADIO_AVATAR",
                "visual_prompt": base_char_prompts["rook_null"],
                "voice": "calm, precise, unsettlingly tender",
                "mini_dialogue": [
                    "Rook Null: The market is not hidden. It is simply below the class that reports maps.",
                    "Rook Null: Knife drones are predictable. Employers are also predictable, but worse.",
                ],
            },
            {
                "id": "dr_mina_suture",
                "display_name": "Dr. Mina Suture",
                "role": "Back-alley medic trapped in clinic contracts",
                "model_name": "NPC_MINA_SUTURE",
                "visual_prompt": prompt(
                    "back alley medic mole",
                    "mole medic with headlamp goggles, patched white coat, stim belt, tired compassionate eyes",
                ),
                "voice": "weary, practical, morally angry",
                "mini_dialogue": [
                    "Dr. Mina Suture: I patch them up. The clinic sells them back to the accident.",
                    "Dr. Mina Suture: Take the cache. Leave the tracking dye. Break the invoice machine if you have time.",
                ],
            },
            {
                "id": "dj_calculus",
                "display_name": "DJ Calculus",
                "role": "Beatmaker, squat organizer, minigame host",
                "model_name": "NPC_DJ_CALCULUS",
                "visual_prompt": prompt(
                    "underground beatmaker hedgehog",
                    "hedgehog DJ with thick glasses, turntables, sampler pads, chalk equations on jacket",
                ),
                "voice": "nerdy, playful, streetwise",
                "mini_dialogue": [
                    "DJ Calculus: Four bars, two breaks, one unpaid landlord. That's basically algebra.",
                    "DJ Calculus: Sample the old soul record, but don't forget who sang first.",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss hunts a stim cache to keep allies alive after Chapter 1 heat rises.",
            "Rook Null reveals that clinic contracts are attached to workplace accidents and police beatings.",
            "Moss can choose to steal all stims, distribute them locally, or scrub tracking dye first.",
            "The Knife-Drone Nest boss shows that even pain has automated security.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "A CITY THAT BREAKS YOU WILL SELL YOU CRUTCHES.",
                },
                {"speaker": "Moss", "text": "Smells like rust, soup, and trouble."},
                {
                    "speaker": "Rook Null",
                    "text": "Trouble is not a smell. In this district, it is a billing category.",
                },
            ],
            "medic_meet": [
                {
                    "speaker": "Dr. Mina Suture",
                    "text": "If you're here to rob me, take the invoices too.",
                },
                {
                    "speaker": "Moss",
                    "text": "That's the first warm welcome I've had all day.",
                },
            ],
            "dj_minigame_intro": [
                {
                    "speaker": "DJ Calculus",
                    "text": "You ever cut a breakbeat, badger? Same wrist as parrying a knife.",
                },
                {
                    "speaker": "Moss",
                    "text": "I usually prefer knives where I can see them.",
                },
                {"speaker": "DJ Calculus", "text": "Then listen better."},
            ],
            "boss_pre": [
                {"speaker": "Knife-Drone Nest", "text": "TRIAGE MODE: PROFITABLE."},
                {
                    "speaker": "Rook Null",
                    "text": "It has mistaken cruelty for optimization.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss watches a drip land exactly on beat.",
                "dialogue": "Moss: Even the ceiling's got timing down here.",
            },
            {
                "seconds": 15,
                "animation": "Rook projects a probability cloud over a puddle.",
                "dialogue": "Rook Null: Standing still reduces stab risk by nine percent and liberation by more.",
            },
            {
                "seconds": 25,
                "animation": "DJ Calculus scratches one lazy note from the safe room radio.",
                "dialogue": "DJ Calculus: No input? Fine, I'll loop suspense.",
            },
        ],
        "side_quests": [
            {
                "id": "sq02_scrub_the_dye",
                "title": "Scrub the Dye",
                "giver": "Dr. Mina Suture",
                "objective": "Find solvent filters and remove tracking dye from stim cache before extraction.",
                "steps": [
                    "Steal filter charcoal from security pump.",
                    "Parry three knife drones into the cleaning vats.",
                    "Use Rook to identify tagged vials.",
                    "Choose: keep extra stims for personal healing or distribute them to Drainmarket clinics.",
                ],
                "reward": {
                    "mechanic": "Clean Stims heal without increasing Heat.",
                    "trust_shift": {
                        "dub_colony": 1,
                        "choir_static": 2,
                        "vane_directorate_heat": -1,
                    },
                },
                "sample_dialogue": [
                    {
                        "speaker": "Dr. Mina Suture",
                        "text": "Clean medicine. Imagine the luxury.",
                    },
                    {
                        "speaker": "Moss",
                        "text": "Let's make it boring enough to be normal.",
                    },
                ],
            },
            {
                "id": "sq02_wall_newspaper",
                "title": "Wall Newspaper",
                "giver": "Graffiti elder Sable Serif",
                "objective": "Tag three hidden walls with public route warnings while avoiding cameras.",
                "reward": {
                    "cosmetic": "Trainwriter Claw Wraps",
                    "world_effect": "Future stages include extra graffiti hints.",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Sable Serif",
                        "text": "A tag ain't vandalism if the wall been lying first.",
                    },
                    {"speaker": "Moss", "text": "I can write with claws."},
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg02_breakbeat_parry",
                "name": "Breakbeat Parry Lab",
                "type": "combat_rhythm_training",
                "rules": "Match incoming knife-drone patterns to kick, snare, and ghost-note windows.",
                "success_reward": "Unlocks Perfect Parry bass pulse.",
                "failure_bark": "DJ Calculus: Offbeat ain't wrong unless the knife agrees.",
            },
            {
                "id": "mg02_graffiti_throwup",
                "name": "Throw-Up Route Tag",
                "type": "timed_line_tracing",
                "rules": "Trace a quick bubble-letter warning before scanner beam returns.",
                "success_reward": "Adds hidden route map layer.",
            },
        ],
        "allies_available": [
            {
                "id": "rook_null",
                "support_type": "enemy_state_reveal",
                "trust_condition": "Unlocked during main plot.",
            },
            {
                "id": "dr_mina_suture",
                "support_type": "clean_healing",
                "trust_condition": "Complete Scrub the Dye.",
            },
        ],
        "enemies": [
            {
                "id": "knife_drone_fledgling",
                "display_name": "Knife-Drone Fledgling",
                "model_name": "ENM_KNIFE_DRONE_SMALL",
                "behavior": "Fast diagonal dive, parryable, respawns from nests until nest sacks are destroyed.",
                "callouts": ["Cut-care-cut!", "Patient acquired!", "Blade says hello!"],
                "sprite_prompt": prompt(
                    "small knife drone",
                    "insect-like drone with scalpel wings, red clinic light, greasy nest residue",
                ),
                "sound_vibe": "scalpel zing, insect buzz, hi-hat tick",
            },
            {
                "id": "clinic_repo_thug",
                "display_name": "Clinic Repo Thug",
                "model_name": "ENM_CLINIC_REPO_BRUISER",
                "behavior": "Shielded melee enemy that demands debt stamps before swinging.",
                "callouts": [
                    "That bruise has an owner!",
                    "Missed payment, missed tooth!",
                    "Medicine ain't charity!",
                ],
                "sprite_prompt": prompt(
                    "clinic repo thug enemy",
                    "rat bruiser in medical-debt armor, clipboard shield, stun baton, stained gloves",
                ),
                "sound_vibe": "clipboard thwack, rubber glove snap, muffled kick drum",
            },
            {
                "id": "sump_leech_meter",
                "display_name": "Sump Leech Meter",
                "model_name": "ENM_LEECH_METER",
                "behavior": "Attaches to Moss and slowly drains coins until shaken off with dodge roll.",
                "callouts": ["Tiny debit!", "Warm account!", "Premium blood detected!"],
                "sprite_prompt": prompt(
                    "robotic leech meter",
                    "metal leech with coin slot belly, glowing suction ring, tiny corporate logo",
                ),
                "sound_vibe": "wet plop, coin vacuum, low synth whine",
            },
        ],
        "boss": {
            "id": "boss_knife_drone_nest",
            "display_name": "Knife-Drone Nest",
            "model_name": "BOSS_KNIFE_DRONE_NEST",
            "role": "Medical automation turned predatory billing swarm",
            "arena": "Broken fan chamber with three nest hearts, rising water, and clinic invoice projectors.",
            "phases": [
                {"name": "Triage Swarm", "mechanic": "Drone waves test parry timing."},
                {
                    "name": "Invoice Bloom",
                    "mechanic": "Nest prints debt zones that damage Moss unless scrubbed by hitting solvent valves.",
                },
                {
                    "name": "Public Clinic",
                    "mechanic": "Mina can disable tracking beams if her side quest is complete.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Knife-Drone Nest",
                    "text": "INJURY DETECTED. CUSTOMER CREATED.",
                },
                {"speaker": "Moss", "text": "I'm not your customer."},
                {"speaker": "Rook Null", "text": "It considers everyone pre-injured."},
            ],
            "defeat_line": "Knife-Drone Nest: ERROR. CHARITY HAS ENTERED THE ROOM.",
            "sprite_prompt": prompt(
                "knife drone nest boss",
                "giant organic-mechanical nest of scalpels, syringes, fan blades, clinic receipts, pulsing red core",
            ),
            "music": "fast funk break with sewer reverb, scalpel hi-hats, modal organ vamp, tense bass walk",
        },
        "sound_effect_vibes": {
            "ambient": "dripping tunnels, distant horn practice, generator cough, water slosh",
            "hazards": "fan blade chop, syringe dart hiss, scanner zap",
            "collectible": "soft vinyl pop and medical glass clink",
            "boss": "swarm buzz sidechained to breakbeat snare",
        },
        "musical_theme": {
            "name": "Sump Break Clinic",
            "bpm": 96,
            "mode": "A Dorian funk vamp",
            "instruments": [
                "sampled soul chord stab",
                "dry breakbeat kit",
                "rubber bass",
                "muted sax ghosts",
                "sewer drip percussion",
            ],
            "dynamic_layers": [
                "safe room: upright bass and brushed cymbal",
                "combat: chopped breakbeat and scalpel hi-hats",
                "boss: siren drones tuned to bass root",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_DRAINMARKET_SUMP",
                "prompt": prompt(
                    "drainmarket background",
                    "underground sewer bazaar with warm lights, medicine stalls, graffiti, puddles, old rails",
                ),
            },
            {
                "asset_id": "TEX_SEWER_TILE_GRAFFITI",
                "prompt": prompt(
                    "sewer wall tile texture",
                    "green-gray concrete, condensation, layered tags, mold, chipped paint",
                ),
            },
            {
                "asset_id": "PROP_STIM_CACHE_CLEAN",
                "prompt": prompt(
                    "clean stim cache collectible",
                    "medical box of glowing vials with tracking symbols scratched off, cloth bandage handle",
                ),
            },
            {
                "asset_id": "PROP_MPC_SAMPLER",
                "prompt": prompt(
                    "beat sampler prop",
                    "old sampling drum machine with worn pads, stickers, cassette tape, little waveform screen",
                ),
            },
        ],
        "secrets": [
            "A hidden trainwriting mural lists names of workers injured by the clinic chain.",
            "Perfectly completing Breakbeat Parry Lab unlocks a non-combat drone lullaby option in the boss arena.",
        ],
        "completion_flags": {
            "main": [
                "stim_cache_acquired",
                "rook_null_joined",
                "knife_drone_nest_defeated",
            ],
            "optional": [
                "tracking_dye_scrubbed",
                "wall_newspaper_posted",
                "clean_stims_unlocked",
            ],
        },
    },
    {
        "chapter_id": "ch03_chrome_arcology",
        "stage_index": 3,
        "act": "Act I",
        "world_id": "chrome_arcology",
        "world_name": "Chrome Arcology",
        "stage_title": "The Elevator Seed",
        "level_codename": "STG_03_CHROME_SEED",
        "primary_verb": "railgun_precision",
        "heist_payload": "elevator_seed",
        "dramatic_question": "Who rides above hidden labor?",
        "placard": "The tower calls itself vertical progress. Ask who holds the floor up.",
        "world_building": {
            "scenic_description": (
                "Chrome Arcology rises from the Lower Sprawl like a polished verdict. Public floors smell of citrus polish and quiet money. "
                "Maintenance layers behind the walls throb with freight rails, heat vents, tired workers, and sleeping bunks stacked under ornamental waterfalls."
            ),
            "political_machine": "Elevator permissions create a caste system where movement upward is framed as merit and maintenance workers are hidden as infrastructure.",
            "local_rumor": "The elevator seed is grown in a sealed algorithmic garden where every leaf is a route permission.",
            "areas": [
                {
                    "area_id": "lobby_of_reflection",
                    "name": "Lobby of Reflection",
                    "gameplay": "Railgun ricochet puzzles with mirrored guards and glass floor hazards.",
                    "texture_descriptions": [
                        "flawless white stone, chrome seams, artificial indoor rain curtain",
                        "reflections that show workers behind the walls for a split second",
                        "polite signage hiding predatory permissions",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "chrome arcology lobby",
                            "sterile luxury lobby, reflective floor, indoor rain curtain, corporate trees, cold light",
                        ),
                        prompt(
                            "permission kiosk",
                            "white kiosk with gold trim, biometric palm scanner, smiling legal avatar",
                        ),
                    ],
                },
                {
                    "area_id": "service_guts",
                    "name": "Service Guts",
                    "gameplay": "Backstage platforming through freight rails, piston elevators, and worker bunks.",
                    "texture_descriptions": [
                        "greasy mechanical ribs behind polished walls",
                        "handwritten worker calendars taped to pipes",
                        "emergency lights staining chrome red",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "arcology service corridor",
                            "narrow mechanical corridor behind luxury wall, pipes, pistons, warning lights, worker notes",
                        ),
                        prompt(
                            "worker bunk stack",
                            "folding bunks squeezed between machines, lunchbox, boots, tiny family photo",
                        ),
                    ],
                },
                {
                    "area_id": "algorithmic_garden",
                    "name": "Algorithmic Garden",
                    "gameplay": "Heist room: aim rail shots to redirect sunlight and grow the elevator seed.",
                    "texture_descriptions": [
                        "impossible bonsai trees grown from fiber optic roots",
                        "glass soil trays with route permissions as glowing leaves",
                        "silent sprinklers moving like legal clerks",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "algorithmic garden",
                            "orbital luxury greenhouse inside tower, fiber optic bonsai, glass soil, glowing permission leaves",
                        ),
                        prompt(
                            "elevator seed collectible",
                            "small chrome seed with green route-map veins, hovering in glass flower",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "sister_version",
                "display_name": "Sister Version",
                "role": "Engineer ally who upgrades traversal gear",
                "model_name": "NPC_SISTER_VERSION_COMMS",
                "visual_prompt": base_char_prompts["sister_version"],
                "voice": "bright, militant, mechanically exact",
                "mini_dialogue": [
                    "Sister Version: Towers hate side doors. That is why we build better side doors.",
                    "Sister Version: Don't just steal the seed. Steal the diagram of how they grow obedience.",
                ],
            },
            {
                "id": "foreman_pell",
                "display_name": "Foreman Pell",
                "role": "Maintenance worker organizing quiet resistance",
                "model_name": "NPC_FOREMAN_PELL",
                "visual_prompt": prompt(
                    "maintenance foreman beaver",
                    "beaver mechanic in grease-stained overalls, tool harness, union pin hidden under badge",
                ),
                "voice": "low, careful, dry humor",
                "mini_dialogue": [
                    "Foreman Pell: The guests call it a waterfall. We call it condensation from broken cooling lines.",
                    "Foreman Pell: You break Vitrine's mirror, I'll show you which elevator carries prisoners.",
                ],
            },
            {
                "id": "madame_vitrine",
                "display_name": "Madame Vitrine",
                "role": "Arcology boss, contract aesthete, public face of hidden labor",
                "model_name": "BOSS_MADAME_VITRINE",
                "visual_prompt": prompt(
                    "elegant glass contract boss",
                    "tall fox or mink executive in mirror-glass gown armor, gold contract fans, cold smile",
                ),
                "voice": "silky, condescending, legally precise",
                "mini_dialogue": [
                    "Madame Vitrine: Visibility is a privilege. Labor should not distract from beauty.",
                    "Madame Vitrine: The poor are always accusing architecture of politics.",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss enters Chrome Arcology using the wafer-key to spoof a delivery route.",
            "Sister Version asks Moss to turn the theft into public proof, not private escape money.",
            "Foreman Pell reveals hidden prisoner cargo moved through service elevators.",
            "Moss steals the elevator seed and broadcasts service-floor footage during the boss fight.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE HIGHER FLOORS ARE BUILT FROM LOWER BACKS.",
                },
                {
                    "speaker": "Moss",
                    "text": "Everything's too clean. Makes me want to track mud on purpose.",
                },
                {"speaker": "Sister Version", "text": "Do. Mud is testimony."},
            ],
            "service_reveal": [
                {
                    "speaker": "Foreman Pell",
                    "text": "Guests go up. Heat goes down. Blame goes nowhere.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Correction: blame is routed away from ownership.",
                },
            ],
            "seed_room": [
                {
                    "speaker": "Sister Version",
                    "text": "There it is. A seed that grows permission.",
                },
                {"speaker": "Moss", "text": "Can we grow trouble from it?"},
                {"speaker": "Sister Version", "text": "With proper watering."},
            ],
            "boss_pre": [
                {
                    "speaker": "Madame Vitrine",
                    "text": "Little courier, you have mistaken access for invitation.",
                },
                {
                    "speaker": "Moss",
                    "text": "No. I mistook your wall for something breakable. Turns out I was right.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss sees his reflection wearing a security uniform, then blinks it away.",
                "dialogue": "Moss: Mirror's got bad taste.",
            },
            {
                "seconds": 16,
                "animation": "A lobby kiosk politely shines Moss's shoes with a laser.",
                "dialogue": "Permission Kiosk: Unauthorized mud detected. Correcting personality.",
            },
            {
                "seconds": 24,
                "animation": "Sister Version opens a service map overlay.",
                "dialogue": "Sister Version: The pretty route is watched. The ugly route is honest.",
            },
        ],
        "side_quests": [
            {
                "id": "sq03_worker_lunchboxes",
                "title": "Lunchboxes in the Walls",
                "giver": "Foreman Pell",
                "objective": "Recover four confiscated worker lunchboxes from guest-only floors.",
                "steps": [
                    "Sneak behind art panel in lobby.",
                    "Use railgun ricochet to disable courtesy scanner.",
                    "Return lunchboxes without triggering guest alarm for bonus.",
                    "Read optional notes to learn worker names and schedules.",
                ],
                "reward": {
                    "mechanic": "Worker Access Vents open in later vertical stages.",
                    "trust_shift": {"choir_static": 2, "dub_colony": 1},
                },
                "sample_dialogue": [
                    {"speaker": "Foreman Pell", "text": "That's my son's drawing."},
                    {
                        "speaker": "Moss",
                        "text": "Kid's good. Made the tower look smaller.",
                    },
                ],
            },
            {
                "id": "sq03_reflection_strike",
                "title": "Reflection Strike",
                "giver": "Sister Version",
                "objective": "Aim security mirrors to project worker footage into the guest atrium.",
                "reward": {
                    "world_effect": "Arcology guests panic; future Vane propaganda is less effective.",
                    "unlock": "Railgun Prism Shot cosmetic",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Sister Version",
                        "text": "Let them see who polishes their sky.",
                    },
                    {"speaker": "Moss", "text": "Hope they hate mirrors by breakfast."},
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg03_rail_ricochet",
                "name": "Railgun Reflection",
                "type": "trajectory_puzzle",
                "rules": "Bounce low-power rail shots through mirrors to trigger switches without killing workers.",
                "success_reward": "Elevator Seed chamber unlocks quiet route.",
            },
            {
                "id": "mg03_service_schedule",
                "name": "Schedule Shuffle",
                "type": "logic_grid",
                "rules": "Swap elevator cargo labels so prisoners exit to service vents instead of holding cells.",
                "failure_bark": "Rook Null: The schedule has eaten one more person.",
            },
        ],
        "allies_available": [
            {
                "id": "sister_version",
                "support_type": "gear_upgrade_hint",
                "trust_condition": "Available by comms throughout stage.",
            },
            {
                "id": "foreman_pell",
                "support_type": "worker_vent_shortcuts",
                "trust_condition": "Complete Lunchboxes in the Walls.",
            },
        ],
        "enemies": [
            {
                "id": "chrome_bellhop",
                "display_name": "Chrome Bellhop",
                "model_name": "ENM_CHROME_BELLHOP",
                "behavior": "Polite fast melee enemy with luggage shield and dash strike.",
                "callouts": [
                    "May I take your class position?",
                    "Guest services include removal!",
                    "The floor prefers you gone!",
                ],
                "sprite_prompt": prompt(
                    "chrome bellhop enemy",
                    "robotic bellhop in polished uniform, luggage shield, blade umbrella, blank smile",
                ),
                "sound_vibe": "elevator ding, suitcase slam, brushed cymbal",
            },
            {
                "id": "mirror_sentinel",
                "display_name": "Mirror Sentinel",
                "model_name": "ENM_MIRROR_SENTINEL",
                "behavior": "Reflects direct shots; must be hit via ricochet or back attack.",
                "callouts": [
                    "You are not reflected in policy.",
                    "Angle denied.",
                    "Beauty must be defended.",
                ],
                "sprite_prompt": prompt(
                    "mirror sentinel enemy",
                    "humanoid mirror robot, faceless reflective torso, gold trim, prism spear",
                ),
                "sound_vibe": "glass shimmer, thin laser ping, reversed cymbal",
            },
            {
                "id": "courtesy_laser",
                "display_name": "Courtesy Laser",
                "model_name": "ENM_COURTESY_LASER",
                "behavior": "Stationary scanner that politely warns before sweeping platforms.",
                "callouts": [
                    "Courtesy warning.",
                    "Please evaporate calmly.",
                    "Unauthorized warmth detected.",
                ],
                "sprite_prompt": prompt(
                    "courtesy laser turret",
                    "sleek white wall turret with gold eye, small apology placard, blue beam",
                ),
                "sound_vibe": "soft chime into harsh zap",
            },
        ],
        "boss": {
            "id": "boss_madame_vitrine",
            "display_name": "Madame Vitrine",
            "model_name": "BOSS_MADAME_VITRINE_GLASSCOURT",
            "role": "Contract logic and luxury aesthetics personified",
            "arena": "Mirror atrium above visible worker machinery; glass platforms rotate as contract clauses appear.",
            "phases": [
                {
                    "name": "Guest Etiquette",
                    "mechanic": "Vitrine attacks with contract fans and mirror clones.",
                },
                {
                    "name": "Hidden Floor",
                    "mechanic": "Platforms turn transparent, revealing worker pistons; avoid crushing labor engines.",
                },
                {
                    "name": "Public Proof",
                    "mechanic": "Broadcast worker footage; clones lose invisibility when audience sees them.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Madame Vitrine",
                    "text": "Revolutionaries are so rude about surfaces.",
                },
                {"speaker": "Moss", "text": "Surfaces are where you hide the bill."},
                {
                    "speaker": "Madame Vitrine",
                    "text": "Then you admit the bill exists. Excellent. We can negotiate your surrender.",
                },
            ],
            "defeat_line": "Madame Vitrine: You have shattered presentation, not power.",
            "sprite_prompt": prompt(
                "Madame Vitrine boss",
                "elegant glass-armored mink executive, mirror fan blades, contract ribbons, fractured reflections",
            ),
            "music": "icy jazz-waltz intro collapsing into heavy dub bass and railgun snare",
        },
        "sound_effect_vibes": {
            "ambient": "muffled fountain, elevator chimes, distant machinery behind walls, soft corporate announcements",
            "hazards": "glass footstep squeak, prism beam, railgun hum",
            "collectible": "clean chime corrupted by tape wobble",
            "boss": "glass cracks tuned like piano notes, legal stamp impacts, applause samples reversed",
        },
        "musical_theme": {
            "name": "Service Floor Elegy",
            "bpm": 104,
            "mode": "C Phrygian dominant hints over dub bass",
            "instruments": [
                "muted trumpet",
                "glass marimba",
                "sub bass",
                "railgun percussion",
                "vibraphone delays",
            ],
            "dynamic_layers": [
                "lobby: sparse luxury jazz chords",
                "service guts: mechanical percussion enters",
                "boss: waltz count breaks into 4/4 rebellion groove",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_CHROME_LOBBY",
                "prompt": prompt(
                    "chrome arcology luxury lobby background",
                    "mirror floors, indoor waterfall, biometric kiosks, cold white lighting, hidden service silhouettes",
                ),
            },
            {
                "asset_id": "TEX_POLISHED_CHROME_CRACKED",
                "prompt": prompt(
                    "cracked polished chrome texture tile",
                    "reflective chrome with hairline cracks, gold seams, smudged paw prints",
                ),
            },
            {
                "asset_id": "PROP_ELEVATOR_SEED",
                "prompt": prompt(
                    "elevator seed heist item",
                    "chrome seed with glowing green route veins inside glass flower, tiny lift icons",
                ),
            },
            {
                "asset_id": "PROP_WORKER_NOTE",
                "prompt": prompt(
                    "worker note prop",
                    "greasy paper note taped to pipe, lunch schedule doodles, no readable text",
                ),
            },
        ],
        "secrets": [
            "Hitting every mirror once reveals a hidden Brecht placard: 'THE AUDIENCE IS ALSO IN THE BUILDING.'",
            "A worker bunk photo later appears in the Final Broadcast crowd if recovered.",
        ],
        "completion_flags": {
            "main": [
                "elevator_seed_acquired",
                "worker_cargo_seen",
                "madame_vitrine_defeated",
            ],
            "optional": [
                "worker_lunchboxes_returned",
                "reflection_strike_broadcasted",
                "foreman_pell_trust_plus",
            ],
        },
    },
    {
        "chapter_id": "ch04_straylight_mirage",
        "stage_index": 4,
        "act": "Act II",
        "world_id": "straylight_mirage",
        "world_name": "Straylight Mirage",
        "stage_title": "Treason at the Mirror Banquet",
        "level_codename": "STG_04_MIRAGE_BANQUET",
        "primary_verb": "rocket_pack",
        "heist_payload": "mirror_pass",
        "dramatic_question": "What does betrayal cost?",
        "placard": "When love is collateral, betrayal arrives wearing your friend's face.",
        "world_building": {
            "scenic_description": (
                "Straylight Mirage is a rehearsed orbital palace that simulates sunset, gardens, and ocean wind for people who own neither guilt nor mud. "
                "Every ballroom has duel rails hidden under rugs. Every toast is a contract. The mirrors do not reflect truth; they reflect acceptable versions."
            ),
            "political_machine": "Debt contracts convert family bonds and care obligations into leverage for corporate espionage.",
            "local_rumor": "The banquet orchestra takes requests only if encoded as old strike songs.",
            "areas": [
                {
                    "area_id": "zero_g_cloakroom",
                    "name": "Zero-G Cloakroom",
                    "gameplay": "Rocket-pack tutorial through floating coats, luggage, and security drones.",
                    "texture_descriptions": [
                        "floating velvet coats with hidden cameras in lapels",
                        "gloved attendants moving like satellites",
                        "starfield visible through glass too clean to believe",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "zero gravity cloakroom",
                            "orbital palace cloakroom with floating coats, polished lockers, starfield windows",
                        ),
                        prompt(
                            "rocket pack recharge station",
                            "small brass and chrome charging perch with bass-valve pulse lights",
                        ),
                    ],
                },
                {
                    "area_id": "banquet_of_versions",
                    "name": "Banquet of Versions",
                    "gameplay": "Dialogue duels mixed with platform sword fights across tablecloths and chandeliers.",
                    "texture_descriptions": [
                        "long mirrored tables with food arranged like stock charts",
                        "chandeliers shaped like frozen explosions",
                        "guest masks painted with polite animal smiles",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "mirror banquet hall background",
                            "orbital luxury dining hall, mirrored table, masked guests, chandeliers, cold sunset simulation",
                        ),
                        prompt(
                            "contract wine glass prop",
                            "crystal glass with tiny legal scroll inside, red liquid reflecting stars",
                        ),
                    ],
                },
                {
                    "area_id": "reflecting_court",
                    "name": "Reflecting Court",
                    "gameplay": "Boss arena where player's choices about Lio change dialogue, hazards, and ally support.",
                    "texture_descriptions": [
                        "black mirror floor cracked by rocket exhaust",
                        "legal constellations projected overhead",
                        "empty witness chairs that turn toward the player",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "reflecting court arena",
                            "black mirror courtroom in orbit, witness chairs, legal constellations, fractured floor",
                        ),
                        prompt(
                            "mirror pass collectible",
                            "silver mask-pass with shifting reflection, small satellite crest, velvet ribbon",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "lio",
                "display_name": "Lio",
                "role": "Old ally whose debt contract pressures betrayal",
                "model_name": "NPC_LIO_BANQUET_MASK",
                "visual_prompt": base_char_prompts["lio"],
                "voice": "guarded, regretful, defensive",
                "mini_dialogue": [
                    "Lio: I didn't sell you because I stopped caring.",
                    "Lio: They bought my fear, Moss. They knew the exact price.",
                ],
            },
            {
                "id": "auntie_subharmonic",
                "display_name": "Auntie Subharmonic",
                "role": "Mentor who recognizes old revolutionaries turned performers",
                "model_name": "NPC_AUNTIE_FORMAL",
                "visual_prompt": prompt(
                    "Auntie Subharmonic in orbital formalwear",
                    "elder possum or badger in formal shawl with record charms, calm eyes, hidden radio cane",
                ),
                "voice": "soft but dangerous",
                "mini_dialogue": [
                    "Auntie Subharmonic: I know that trumpet player. Used to make cops nervous. Now he makes guests comfortable.",
                    "Auntie Subharmonic: Pity ain't pardon. But it can keep a knife from becoming policy.",
                ],
            },
            {
                "id": "cobalt_carmine",
                "display_name": "Cobalt Carmine",
                "role": "Banquet singer and former radical courier",
                "model_name": "NPC_COBALT_CARMINE",
                "visual_prompt": prompt(
                    "orbital jazz singer ex-radical",
                    "blue jay singer in silver tux, tired eyes, hidden protest pin, vintage microphone",
                ),
                "voice": "smooth, haunted, coded",
                "mini_dialogue": [
                    "Cobalt Carmine: Requests cost extra unless they're old enough to scare the room.",
                    "Cobalt Carmine: Some songs become cages when sung for the wrong table.",
                ],
            },
            {
                "id": "reflection_judge",
                "display_name": "Reflection Judge",
                "role": "Boss who turns moral choices into courtroom mechanics",
                "model_name": "BOSS_REFLECTION_JUDGE",
                "visual_prompt": prompt(
                    "mirror judge boss",
                    "faceless judge made of black glass, orbiting masks, gavel-sword, legal constellation halo",
                ),
                "voice": "echoing, accusatory, theatrical",
                "mini_dialogue": [
                    "Reflection Judge: State your loyalty for the record.",
                    "Reflection Judge: Mercy is admissible only as weakness.",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss infiltrates the orbital banquet using rocket-pack routes and the elevator seed.",
            "Auntie recognizes compromised old radicals performing for the ruling class.",
            "Lio betrays Moss under pressure from a purchased family debt contract.",
            "The player chooses how to respond: expose Lio, protect Lio, or use the betrayal as bait.",
            "The Mirror Pass is taken from the Reflection Judge, unlocking deeper orbital access.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE MASK IS NOT A LIE. IT IS A CONTRACT WITH THE ROOM.",
                },
                {"speaker": "Moss", "text": "Place smells expensive and hungry."},
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "That's old money, baby. It eats before dinner.",
                },
            ],
            "lio_betrayal_reveal": [
                {"speaker": "Lio", "text": "Don't run left."},
                {"speaker": "Moss", "text": "Why?"},
                {"speaker": "Lio", "text": "Because I already told them you would."},
            ],
            "choice_expose_lio": [
                {
                    "speaker": "Moss",
                    "text": "Everybody hear that? They bought my friend with a family leash.",
                },
                {
                    "speaker": "Reflection Judge",
                    "text": "Public feeling is not evidence.",
                },
            ],
            "choice_protect_lio": [
                {
                    "speaker": "Moss",
                    "text": "You don't get to make me punish your hostage for you.",
                },
                {
                    "speaker": "Lio",
                    "text": "Moss... don't make mercy heavier than I can carry.",
                },
            ],
            "choice_bait_lio": [
                {
                    "speaker": "Moss",
                    "text": "Then let's sell them the version of me they already paid for.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "A trap built from their prediction. Elegant.",
                },
            ],
            "boss_pre": [
                {
                    "speaker": "Reflection Judge",
                    "text": "The accused will answer: traitor, fool, or tool?",
                },
                {"speaker": "Moss", "text": "Badger."},
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss floats slightly, then taps a claw on the mirrored floor.",
                "dialogue": "Moss: Even the floor's listening.",
            },
            {
                "seconds": 15,
                "animation": "A masked guest coughs politely into a contract napkin.",
                "dialogue": "Masked Guest: Is the small mammal part of the entertainment?",
            },
            {
                "seconds": 26,
                "animation": "Lio looks toward Moss, starts to speak, then stops.",
                "dialogue": "Lio: ...No. Not yet.",
            },
        ],
        "side_quests": [
            {
                "id": "sq04_request_the_old_song",
                "title": "Request the Old Song",
                "giver": "Cobalt Carmine",
                "objective": "Decode a banquet request card and get the orchestra to play a banned strike melody.",
                "steps": [
                    "Collect three lyric fragments hidden in guest gossip.",
                    "Translate contract euphemisms into strike terms with Auntie's help.",
                    "Deliver request during dessert duel without drawing sword.",
                    "Choose whether Cobalt flees, stays as spy, or broadcasts from stage.",
                ],
                "reward": {
                    "mechanic": "Banquet guests panic during boss phase, creating safe windows.",
                    "trust_shift": {"auntie_subharmonic": 2, "choir_static": 1},
                },
                "sample_dialogue": [
                    {
                        "speaker": "Cobalt Carmine",
                        "text": "Haven't sung that one since the river arrests.",
                    },
                    {
                        "speaker": "Auntie Subharmonic",
                        "text": "Then warm up. History has a table tonight.",
                    },
                ],
            },
            {
                "id": "sq04_debt_thread",
                "title": "Debt Thread",
                "giver": "Lio, indirectly through hidden notes",
                "objective": "Find proof of Lio's family contract before the betrayal cutscene.",
                "reward": {
                    "choice_modifier": "Unlocks 'Name the leash' dialogue option in betrayal scene.",
                    "future_flag": "lio_redemption_possible",
                },
                "sample_dialogue": [
                    {"speaker": "Moss", "text": "You should've told me."},
                    {"speaker": "Lio", "text": "I did. Every time I said I was fine."},
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg04_mask_reading",
                "name": "Mask Reading",
                "type": "dialogue_logic",
                "rules": "Track guest contradictions across three gossip loops to identify security phrases.",
                "success_reward": "Opens secret cloakroom vent.",
            },
            {
                "id": "mg04_rocket_waltz",
                "name": "Rocket Waltz",
                "type": "aerial_rhythm_platforming",
                "rules": "Boost through chandelier rings on a 3-count while combat shifts to 4-count during ambushes.",
                "failure_bark": "Auntie Subharmonic: Waltz is just a cage with pretty corners. Bend it.",
            },
        ],
        "allies_available": [
            {
                "id": "auntie_subharmonic",
                "support_type": "choice_context_and_boss_interrupt",
                "trust_condition": "Always available.",
            },
            {
                "id": "lio",
                "support_type": "conditional_decoy_or_enemy",
                "trust_condition": "Determined by betrayal choice and Debt Thread completion.",
            },
            {
                "id": "cobalt_carmine",
                "support_type": "music_distraction",
                "trust_condition": "Complete Request the Old Song.",
            },
        ],
        "enemies": [
            {
                "id": "masque_duelist",
                "display_name": "Masque Duelist",
                "model_name": "ENM_MASQUE_DUELIST",
                "behavior": "Fast rapier enemy who pauses to bow, allowing a risky punish.",
                "callouts": [
                    "Etiquette cuts deepest!",
                    "Your invitation is bleeding!",
                    "A vulgar parry!",
                ],
                "sprite_prompt": prompt(
                    "masked orbital duelist",
                    "slender stoat in silver mask, rapier, formal cape, rocket-boot heels",
                ),
                "sound_vibe": "rapier ping, polite applause, brushed snare flick",
            },
            {
                "id": "contract_servitor",
                "display_name": "Contract Servitor",
                "model_name": "ENM_CONTRACT_SERVITOR",
                "behavior": "Projects legal zones that slow Moss unless destroyed.",
                "callouts": [
                    "Clause incoming.",
                    "By entering this wound you agree.",
                    "Consent assumed!",
                ],
                "sprite_prompt": prompt(
                    "contract servitor drone",
                    "floating legal scroll drone with wax seal eye, silver arms, blue light",
                ),
                "sound_vibe": "paper unfurl, wax seal pop, courtroom hum",
            },
            {
                "id": "champagne_mine",
                "display_name": "Champagne Mine",
                "model_name": "ENM_CHAMPAGNE_MINE",
                "behavior": "Disguised hazard that explodes upward in sparkling glass arcs.",
                "callouts": [
                    "Compliments of the house!",
                    "Pop.",
                    "Celebration charge armed.",
                ],
                "sprite_prompt": prompt(
                    "champagne mine hazard",
                    "crystal bottle mine with gold wire fuse, bubbling red sensor light",
                ),
                "sound_vibe": "cork pop into glass shatter with sub boom",
            },
        ],
        "boss": {
            "id": "boss_reflection_judge",
            "display_name": "Reflection Judge",
            "model_name": "BOSS_REFLECTION_JUDGE_COURT",
            "role": "Boss of betrayal, public judgment, and moral simplification",
            "arena": "Black mirror court where witness chairs become platforms and accusations become projectiles.",
            "phases": [
                {
                    "name": "Accusation",
                    "mechanic": "Judge fires labeled masks: TRAITOR, FOOL, TOOL. Destroy or redirect.",
                },
                {
                    "name": "Cross-Examination",
                    "mechanic": "Player's Lio choice changes hazard pattern and ally calls.",
                },
                {
                    "name": "Unowned Mercy",
                    "mechanic": "Break the central mirror to stop the court from forcing binary verdicts.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Reflection Judge",
                    "text": "A friend who betrays you is no friend.",
                },
                {
                    "speaker": "Moss",
                    "text": "A court that says that never had friends.",
                },
                {
                    "speaker": "Reflection Judge",
                    "text": "Answer in acceptable categories.",
                },
                {"speaker": "Moss", "text": "No."},
            ],
            "defeat_line": "Reflection Judge: The record cannot hold this much contradiction.",
            "sprite_prompt": prompt(
                "Reflection Judge boss",
                "black glass judge with orbiting witness masks, gavel sword, cracked mirror robe, starfield halo",
            ),
            "music": "orbital waltz warped by boom-bap drums, upright bass, reversed piano, courtroom stomp",
        },
        "sound_effect_vibes": {
            "ambient": "low party murmur, crystal rings, fake ocean wind, distant orbital hull creak",
            "hazards": "glass burst, rocket hiss, contract stamp, champagne pop",
            "collectible": "soft mask chime with delayed tape echo",
            "boss": "gavel hits as kick drums, accusations whispered in reverse, sub drops on mirror cracks",
        },
        "musical_theme": {
            "name": "Banquet for a Bought Friend",
            "bpm": 72,
            "mode": "E minor waltz shifting to 96 BPM boom-bap combat layer",
            "instruments": [
                "upright bass",
                "harpsichord sample",
                "dusty drum break",
                "dub delay piano",
                "lonely muted trumpet",
            ],
            "dynamic_layers": [
                "infiltration: elegant sparse waltz",
                "betrayal: kick and snare interrupt the 3-count",
                "boss: courtroom percussion and bass wobble",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_STRAYLIGHT_BANQUET",
                "prompt": prompt(
                    "orbital mirror banquet background",
                    "luxury dining hall in space, black mirror floor, masked guests, contract banners, simulated sunset",
                ),
            },
            {
                "asset_id": "TEX_BLACK_MIRROR_FLOOR",
                "prompt": prompt(
                    "black mirror floor texture",
                    "dark reflective tile with hairline cracks, rocket scorch marks, faint legal glyphs",
                ),
            },
            {
                "asset_id": "PROP_MIRROR_PASS",
                "prompt": prompt(
                    "mirror pass collectible",
                    "silver mask with shifting reflective surface, orbital crest, velvet ribbon, tiny circuit edge",
                ),
            },
            {
                "asset_id": "CHR_LIO_MASKED",
                "prompt": prompt(
                    "masked courier fox ally",
                    "lean fox courier in formal mask, scarf hiding debt collar, nervous posture, one hand near knife",
                ),
            },
        ],
        "secrets": [
            "Reading all guest gossip reveals Director Vane has already priced the rebellion as a future market.",
            "Protecting Lio and completing Debt Thread unlocks a later scene where Lio disables a fatal customs scan.",
        ],
        "completion_flags": {
            "main": [
                "mirror_pass_acquired",
                "lio_betrayal_resolved",
                "reflection_judge_defeated",
            ],
            "choice_flags": [
                "lio_exposed_publicly",
                "lio_protected",
                "lio_used_as_bait",
            ],
            "optional": [
                "old_song_performed",
                "debt_thread_found",
                "cobalt_carmine_recruited",
            ],
        },
    },
    {
        "chapter_id": "ch05_dub_colony",
        "stage_index": 5,
        "act": "Act III",
        "world_id": "dub_colony",
        "world_name": "Dub Colony",
        "stage_title": "The Colony Teaches the Price of Air",
        "level_codename": "STG_05_DUB_REACTOR",
        "primary_verb": "beat_timing",
        "heist_payload": "bass_reactor_core",
        "dramatic_question": "Can safety become tyranny?",
        "placard": "A fortress can protect a people, then forget the people are not bricks.",
        "world_building": {
            "scenic_description": (
                "The Dub Colony is a moving home base made of greenhouse cars, studio shrines, repair decks, speaker gardens, shared kitchens, and solar sails. "
                "It is warm, noisy, generous, argumentative, and scared. Every machine has a handwritten repair note and every vote has an aftertaste."
            ),
            "political_machine": "Fear of attack pressures the colony toward centralized command under King Feedback.",
            "local_rumor": "The bass reactor was built from pieces of confiscated club speakers, transit motors, and a prison alarm.",
            "areas": [
                {
                    "area_id": "greenhouse_cars",
                    "name": "Greenhouse Cars",
                    "gameplay": "Shield ally tutorial with Naya Root, protect plants and cooks during drone raids.",
                    "texture_descriptions": [
                        "hydroponic vines wrapped around speaker cables",
                        "condensation on glass patched with stickered plastic",
                        "seed trays labeled with both food names and neighborhood names",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "dub colony greenhouse car",
                            "train car greenhouse, vines, speakers, patched glass, warm amber work lights",
                        ),
                        prompt(
                            "seed tray prop",
                            "small hydroponic tray with handwritten labels, droplets, tiny cable clips",
                        ),
                    ],
                },
                {
                    "area_id": "studio_temple",
                    "name": "Studio Temple",
                    "gameplay": "Beat-timing puzzles and sample collection for reactor tuning.",
                    "texture_descriptions": [
                        "walls of speakers like altars",
                        "cassette reels, solder smoke, old records, hand drums",
                        "projected waveforms moving like stained glass",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "dub studio temple",
                            "room of speaker stacks, turntables, solder benches, waveform projections, warm smoke",
                        ),
                        prompt(
                            "sample crate collectible",
                            "milk crate of vinyl records, labels covered, dust motes, gold glow",
                        ),
                    ],
                },
                {
                    "area_id": "assembly_deck",
                    "name": "Assembly Deck",
                    "gameplay": "Interactive colony vote, branching dialogue, boss arena against King Feedback's emergency command rig.",
                    "texture_descriptions": [
                        "circular meeting deck with mismatched chairs and painted floor compass",
                        "vote flags hanging beside emergency armor plates",
                        "giant amp throne built too quickly and too nervously",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "colony assembly deck",
                            "circular meeting hall in moving colony, mismatched chairs, flags, cables, amp throne, warm light",
                        ),
                        prompt(
                            "vote flag prop",
                            "cloth flag with hand-painted symbol, patched edge, wooden handle, no readable text",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "naya_root",
                "display_name": "Naya Root",
                "role": "Shield fighter and greenhouse defender",
                "model_name": "ALLY_NAYA_ROOT_SHIELD",
                "visual_prompt": base_char_prompts["naya_root"],
                "voice": "grounded, brave, blunt",
                "mini_dialogue": [
                    "Naya Root: I can block a bullet. I can't block bad decisions alone.",
                    "Naya Root: These beans fed us through a siege. Step careful.",
                ],
            },
            {
                "id": "king_feedback",
                "display_name": "King Feedback",
                "role": "Rebel security leader and stage boss",
                "model_name": "BOSS_KING_FEEDBACK",
                "visual_prompt": prompt(
                    "rebel amp commander boss",
                    "large badger or boar in speaker armor, crown of cables, anxious eyes, giant microphone mace",
                ),
                "voice": "booming, frightened beneath confidence",
                "mini_dialogue": [
                    "King Feedback: A chorus needs a conductor when the guns arrive.",
                    "King Feedback: Freedom that dies tomorrow is just a pretty rumor.",
                ],
            },
            {
                "id": "sister_version",
                "display_name": "Sister Version",
                "role": "Engineer who helps tune the bass reactor",
                "model_name": "NPC_SISTER_VERSION_WORKSHOP",
                "visual_prompt": base_char_prompts["sister_version"],
                "voice": "technical, affectionate, radical",
                "mini_dialogue": [
                    "Sister Version: This reactor does not obey. It resonates. Important distinction.",
                    "Sister Version: Hit the beat late, and the shield sulks. Hit it early, and the amp argues.",
                ],
            },
            {
                "id": "little_ix",
                "display_name": "Little Ix",
                "role": "Child tinkerer who names colony machines",
                "model_name": "NPC_LITTLE_IX",
                "visual_prompt": prompt(
                    "child tinkerer on dub colony",
                    "small squirrel child with goggles, soldering toy robot, seed pouch, oversize headphones",
                ),
                "voice": "curious, fearless, accidentally philosophical",
                "mini_dialogue": [
                    "Little Ix: I named the big amp 'No Boss Please.' King Feedback said that's confusing.",
                    "Little Ix: If a machine only listens to one person, is it lonely or rude?",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss reaches the Dub Colony as a playable hub-stage rather than a simple safe area.",
            "Naya Root joins as shield ally and teaches rhythm-block mechanics.",
            "The colony argues whether to hide, revolt openly, or centralize command for safety.",
            "King Feedback tries to lock the Bass Reactor into emergency command mode.",
            "Moss helps decide whether the colony joins the rebellion as chorus, army, or frightened supplier.",
        ],
        "dialogues": {
            "stage_intro": [
                {"speaker": "Placard", "text": "THE PEOPLE MEET. THE SPEAKERS LISTEN."},
                {
                    "speaker": "Moss",
                    "text": "This place smells like solder, basil, and bad ideas.",
                },
                {
                    "speaker": "Naya Root",
                    "text": "Good. We grow two of those on purpose.",
                },
            ],
            "reactor_room": [
                {
                    "speaker": "Sister Version",
                    "text": "The core is stable if everyone keeps time.",
                },
                {"speaker": "Moss", "text": "Everyone?"},
                {"speaker": "Auntie Subharmonic", "text": "That's the point, baby."},
            ],
            "king_argument": [
                {
                    "speaker": "King Feedback",
                    "text": "Votes are slow. Missiles are fast.",
                },
                {
                    "speaker": "Naya Root",
                    "text": "So teach the votes to run. Don't bury them.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Central command reduces variance and increases tyranny risk.",
                },
            ],
            "boss_pre": [
                {
                    "speaker": "King Feedback",
                    "text": "I will be wrong later if it means we survive now.",
                },
                {
                    "speaker": "Moss",
                    "text": "I've met plenty of later. It never arrives empty-handed.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss taps a claw and a nearby speaker answers with a bass thump.",
                "dialogue": "Moss: Even the furniture talks back.",
            },
            {
                "seconds": 14,
                "animation": "Naya waters a plant beside Moss.",
                "dialogue": "Naya Root: You can pause. Plants do it all winter. Then they move.",
            },
            {
                "seconds": 24,
                "animation": "Little Ix's toy robot circles Moss and displays a tiny vote flag.",
                "dialogue": "Little Ix: Motion to stop standing around? Seconded by robot.",
            },
        ],
        "side_quests": [
            {
                "id": "sq05_seed_and_speaker",
                "title": "Seed and Speaker",
                "giver": "Naya Root",
                "objective": "Protect greenhouse seedlings while retuning speaker shields during a drone raid.",
                "steps": [
                    "Carry three seed trays between cover points.",
                    "Block drone fire with Naya's shield pulse.",
                    "Retune two speaker roots to widen protective bass zones.",
                    "Choose whether to save rare seeds or salvage extra ammo when time runs short.",
                ],
                "reward": {
                    "mechanic": "Naya's Shield Pulse gains plant-regrowth heal zone.",
                    "trust_shift": {
                        "naya_root": 2,
                        "king_feedback_bloc": -1 if False else 0,
                    },
                },
                "sample_dialogue": [
                    {"speaker": "Naya Root", "text": "You saved the beans."},
                    {
                        "speaker": "Moss",
                        "text": "I like soup. Revolution's got to eat.",
                    },
                ],
            },
            {
                "id": "sq05_vote_cards",
                "title": "Missing Vote Cards",
                "giver": "Little Ix",
                "objective": "Find stolen vote cards hidden by nervous security volunteers.",
                "reward": {
                    "choice_modifier": "Adds 'chorus' outcome to colony vote with lower heat.",
                    "cosmetic": "Assembly Patch for Moss's coat",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Little Ix",
                        "text": "If the cards are missing, do the missing people still vote?",
                    },
                    {"speaker": "Moss", "text": "They better."},
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg05_bass_reactor_tune",
                "name": "Bass Reactor Tune",
                "type": "rhythm_calibration",
                "rules": "Trigger kick, snare, and echo valves in sync to stabilize shield fields without letting one channel dominate.",
                "success_reward": "Bass Reactor Core synchronized.",
            },
            {
                "id": "mg05_assembly_vote",
                "name": "Assembly Vote",
                "type": "branching_dialogue_civic_puzzle",
                "rules": "Hear speakers, challenge contradictions, and choose a path: chorus, army, or supplier.",
                "outcomes": {
                    "chorus": "Distributed aid, more NPC support, moderate combat help.",
                    "army": "Strong combat buffs, higher authoritarian risk later.",
                    "supplier": "More shop inventory, fewer ally interventions.",
                },
            },
        ],
        "allies_available": [
            {
                "id": "naya_root",
                "support_type": "shield_companion",
                "trust_condition": "Joins during greenhouse raid.",
            },
            {
                "id": "sister_version",
                "support_type": "reactor_tuning",
                "trust_condition": "Available throughout stage.",
            },
            {
                "id": "little_ix",
                "support_type": "hidden_item_markers",
                "trust_condition": "Complete Missing Vote Cards.",
            },
        ],
        "enemies": [
            {
                "id": "signal_jammer_bat",
                "display_name": "Signal Jammer Bat",
                "model_name": "ENM_SIGNAL_JAMMER_BAT",
                "behavior": "Disables rhythm UI until hit with shield pulse or thrown object.",
                "callouts": ["No chorus, no problem!", "Static tax!", "Beat denied!"],
                "sprite_prompt": prompt(
                    "signal jammer bat drone",
                    "bat-like drone with antenna wings, red static core, hanging wires",
                ),
                "sound_vibe": "AM radio squeal, fluttering tape, muted snare",
            },
            {
                "id": "feedback_guard",
                "display_name": "Feedback Guard",
                "model_name": "ENM_FEEDBACK_GUARD",
                "behavior": "Rebel security unit; blocks frontal attacks, can be talked down if vote cards found.",
                "callouts": [
                    "Emergency order!",
                    "Stand behind the speaker!",
                    "Safety requires silence!",
                ],
                "sprite_prompt": prompt(
                    "rebel feedback guard",
                    "armored colony volunteer with speaker shield, red emergency badge, conflicted posture",
                ),
                "sound_vibe": "shield thump, mic squeal, boot scuff",
            },
            {
                "id": "audit_mosquito",
                "display_name": "Audit Mosquito",
                "model_name": "ENM_AUDIT_MOSQUITO",
                "behavior": "Tiny corporate drone trying to tag colony assets; swarms around plants and reactor valves.",
                "callouts": ["Asset found!", "Garden taxable!", "Buzz for compliance!"],
                "sprite_prompt": prompt(
                    "audit mosquito drone",
                    "tiny needle-nosed drone, barcode wings, blue compliance light",
                ),
                "sound_vibe": "thin mosquito whine, scanner beep, tiny pop when defeated",
            },
        ],
        "boss": {
            "id": "boss_king_feedback",
            "display_name": "King Feedback",
            "model_name": "BOSS_KING_FEEDBACK_AMPTHRONE",
            "role": "Fearful protector whose emergency logic risks becoming command tyranny",
            "arena": "Assembly deck around Bass Reactor Core, with speaker towers that can be retuned toward chorus or command.",
            "phases": [
                {
                    "name": "Security Pulse",
                    "mechanic": "King Feedback emits huge bass waves; jump, shield, or sync with beat.",
                },
                {
                    "name": "Emergency Crown",
                    "mechanic": "He locks channels one by one; player reopens them with rhythm valves.",
                },
                {
                    "name": "Chorus Test",
                    "mechanic": "Outcome varies by side quests and dialogue: defeat, talk-down, or shared control ritual.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "King Feedback",
                    "text": "You call it command. I call it keeping children alive.",
                },
                {
                    "speaker": "Naya Root",
                    "text": "Then let the children grow into people who can answer you.",
                },
                {
                    "speaker": "Moss",
                    "text": "A locked door can save you from fire. Then it can become the fire.",
                },
            ],
            "defeat_line": "King Feedback: I heard the guns louder than the people. That was my mistake.",
            "sprite_prompt": prompt(
                "King Feedback boss",
                "massive rebel in speaker armor, cable crown, microphone mace, anxious expression, amp throne behind",
            ),
            "music": "86 BPM golden-era boom-bap, live handclaps as vote rhythm, dusty organ chops, dub bass drops tied to boss waves",
        },
        "sound_effect_vibes": {
            "ambient": "speaker hum, greenhouse fans, kitchen pots, children arguing, solder crackle",
            "hazards": "feedback squeal, bass wave whoomp, glass pane rattle",
            "collectible": "warm tape click, seed chime, small crowd cheer",
            "boss": "amp overload, cable snap, crowd gasp, sub-bass pressure",
        },
        "musical_theme": {
            "name": "Assembly in Low Frequency",
            "bpm": 86,
            "mode": "G minor golden-era boom-bap with dub bass and modal jazz chords in safe zones",
            "instruments": [
                "deep sub bass",
                "dusty sampled snare",
                "chopped organ stabs",
                "hand drums",
                "sampled crowd murmurs",
                "melodica",
            ],
            "dynamic_layers": [
                "greenhouse: mellow neo-soul chords over water drops",
                "raid: heavier boom-bap break and alarm siren",
                "vote: percussion thins so dialogue breathes",
                "boss: bass becomes both weapon and question",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_DUB_GREENHOUSE_CAR",
                "prompt": prompt(
                    "moving dub colony greenhouse car background",
                    "hydroponic plants, patched glass, speaker cables, seed trays, warm rebel home lighting",
                ),
            },
            {
                "asset_id": "BG_STUDIO_TEMPLE",
                "prompt": prompt(
                    "dub studio temple background",
                    "speaker wall, turntables, solder benches, smoke, waveform projections, cassette reels",
                ),
            },
            {
                "asset_id": "PROP_BASS_REACTOR_CORE",
                "prompt": prompt(
                    "bass reactor core prop",
                    "subwoofer reactor in amber coolant, copper coils, vibrating rings, hand-painted warning labels",
                ),
            },
            {
                "asset_id": "CHR_NAYA_ROOT_SHIELD",
                "prompt": prompt(
                    "Naya Root shield ally sprite",
                    "greenhouse defender with leaf shield, practical armor, seed pouch, determined stance",
                ),
            },
        ],
        "secrets": [
            "A hidden listening booth contains old debate recordings from before King Feedback took his title.",
            "Completing Missing Vote Cards and Seed and Speaker unlocks a peaceful boss finisher animation.",
        ],
        "completion_flags": {
            "main": [
                "bass_reactor_core_synchronized",
                "naya_root_joined",
                "king_feedback_resolved",
                "colony_vote_completed",
            ],
            "colony_outcomes": [
                "colony_as_chorus",
                "colony_as_army",
                "colony_as_supplier",
            ],
            "optional": [
                "seedlings_saved",
                "vote_cards_returned",
                "peaceful_feedback_resolution_possible",
            ],
        },
    },
    {
        "chapter_id": "ch06_antenna_barrens",
        "stage_index": 6,
        "act": "Act III",
        "world_id": "uplink_barrens",
        "world_name": "Antenna Barrens",
        "stage_title": "The Black-Ice Fox",
        "level_codename": "STG_06_BARRENS_CODE",
        "primary_verb": "coding_gates",
        "heist_payload": "debt_ledger_shard",
        "dramatic_question": "Can code be a weapon for everyone?",
        "placard": "A lock written in numbers still has a landlord.",
        "world_building": {
            "scenic_description": (
                "The Antenna Barrens are a wasteland of dead uplink towers, solar bones, old radar dishes, and sand-blasted data shrines. "
                "Hackers camp in Faraday tents. Graffiti crews paint towers no train will ever pass. Logic gates hang in the air like cold riddles."
            ),
            "political_machine": "Debt ledger shards hide in abandoned infrastructure, protected by code that treats public understanding as a security flaw.",
            "local_rumor": "The Black-Ice Fox never lies in code. He simply lets people misunderstand the truth.",
            "areas": [
                {
                    "area_id": "dish_graveyard",
                    "name": "Dish Graveyard",
                    "gameplay": "Wind platforming across parabolic dishes and antenna wires.",
                    "texture_descriptions": [
                        "rusty satellite dishes tilted like broken moons",
                        "sand caught in old coaxial cables",
                        "faint pirate tags painted on unreachable steel",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "satellite dish graveyard background",
                            "desert of broken radar dishes, cables, dusk sky, graffiti tags, wind-blown sand",
                        ),
                        prompt(
                            "antenna wire tightrope",
                            "coax cable stretched between towers, small signal lights, torn warning flags",
                        ),
                    ],
                },
                {
                    "area_id": "logic_cairns",
                    "name": "Logic Cairns",
                    "gameplay": "Coding-gate rooms with visible truth tables and enemy state machines.",
                    "texture_descriptions": [
                        "stone piles embedded with old circuit boards",
                        "floating boolean glyphs projected from cracked projectors",
                        "chalk diagrams from unknown students and squat hackers",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "logic cairn puzzle room",
                            "desert stone cairns with circuit boards, floating boolean glyphs, cracked projectors",
                        ),
                        prompt(
                            "truth table terminal prop",
                            "rugged terminal showing grid of toggles, paper tape, sand, blinking amber lights",
                        ),
                    ],
                },
                {
                    "area_id": "black_ice_node",
                    "name": "Black-Ice Node",
                    "gameplay": "Boss arena where code puzzle and combat state merge.",
                    "texture_descriptions": [
                        "tower interior coated in black reflective frost",
                        "fox-shaped code shadows in every wall panel",
                        "debt names scrolling like constellations",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "black ice server tower interior",
                            "dark server room inside desert tower, black frost, glowing debt constellations, fox shadows",
                        ),
                        prompt(
                            "debt ledger shard collectible",
                            "jagged data crystal shard with names glowing inside, wrapped in red thread",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "black_ice_fox",
                "display_name": "Black-Ice Fox",
                "role": "Hacker boss and cynical guardian of debt ledger shard",
                "model_name": "BOSS_BLACK_ICE_FOX",
                "visual_prompt": prompt(
                    "black ice hacker fox boss",
                    "silver fox in dark hooded coat, crystalline black code tails, glowing terminal gauntlets",
                ),
                "voice": "cool, amused, exact",
                "mini_dialogue": [
                    "Black-Ice Fox: The public loves open code until it has to read.",
                    "Black-Ice Fox: I do not guard the ledger. I guard the illusion that only I can understand it.",
                ],
            },
            {
                "id": "mara_modulo",
                "display_name": "Mara Modulo",
                "role": "Squat hacker teaching public cryptography",
                "model_name": "NPC_MARA_MODULO",
                "visual_prompt": prompt(
                    "squat hacker lizard",
                    "lizard hacker in sun-faded hoodie, portable terminal, chalkboard backpack, antenna piercings",
                ),
                "voice": "patient, intense, teacherly",
                "mini_dialogue": [
                    "Mara Modulo: A secret is not the same as safety.",
                    "Mara Modulo: Teach one neighbor a key and you have doubled the lockpick supply.",
                ],
            },
            {
                "id": "rook_null",
                "display_name": "Rook Null",
                "role": "State-machine companion in coding gates",
                "model_name": "NPC_ROOK_NULL_BARRENS",
                "visual_prompt": base_char_prompts["rook_null"],
                "voice": "precise, occasionally poetic",
                "mini_dialogue": [
                    "Rook Null: This gate is lying by omission. How human.",
                    "Rook Null: A paradox is only a wall until someone draws a door on it.",
                ],
            },
        ],
        "main_plot_beats": [
            "Moss and Rook hunt debt ledger shards in abandoned uplink infrastructure.",
            "Mara Modulo argues that hacking must be teachable or it becomes a priesthood.",
            "The Black-Ice Fox tests Moss with code-combat states and philosophical taunts.",
            "Moss wins the shard by making the ledger readable to the Choir of Static rather than merely stealing it.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE PASSWORD IS PUBLIC. THE MANUAL IS HIDDEN.",
                },
                {
                    "speaker": "Moss",
                    "text": "Lot of dead towers for a place that still talks.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Dead infrastructure is often the loudest witness.",
                },
            ],
            "mara_lesson": [
                {
                    "speaker": "Mara Modulo",
                    "text": "You know what scares a landlord more than a hacker? A neighborhood that understands the script.",
                },
                {"speaker": "Moss", "text": "I bite better than I script."},
                {
                    "speaker": "Mara Modulo",
                    "text": "Then bite the comment lines first.",
                },
            ],
            "fox_intro": [
                {
                    "speaker": "Black-Ice Fox",
                    "text": "Moss. Courier. Claws. Wetware. Charming deficit of abstraction.",
                },
                {
                    "speaker": "Moss",
                    "text": "Fox. Gatekeeper. Ego. Cold room. Charming surplus of smug.",
                },
            ],
            "boss_pre": [
                {
                    "speaker": "Black-Ice Fox",
                    "text": "Tell me, badger, should every tool be put in every paw?",
                },
                {
                    "speaker": "Moss",
                    "text": "No. Some tools should be put in the wall until the wall stops being smug.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss brushes sand from his wetware whiskers.",
                "dialogue": "Moss: Sand in the circuits. The old machines deserve it.",
            },
            {
                "seconds": 16,
                "animation": "Rook displays a blinking cursor above Moss.",
                "dialogue": "Rook Null: Awaiting input. So is history.",
            },
            {
                "seconds": 24,
                "animation": "A distant tower rotates with a tired groan.",
                "dialogue": "Mara Modulo: The dish is listening. Give it something better than wind.",
            },
        ],
        "side_quests": [
            {
                "id": "sq06_public_manual",
                "title": "Public Manual",
                "giver": "Mara Modulo",
                "objective": "Translate three corporate lock routines into readable tutorial murals.",
                "steps": [
                    "Solve a Gödel Deadbolt without Rook's auto-solve.",
                    "Paint simplified truth table on tower wall.",
                    "Defend Mara while she broadcasts the lesson.",
                    "Choose whether to include risky exploit details or safer basic literacy.",
                ],
                "reward": {
                    "mechanic": "Community Hack Assist reduces difficulty of future code gates.",
                    "trust_shift": {"choir_static": 3, "rook_null": 1},
                },
                "sample_dialogue": [
                    {
                        "speaker": "Mara Modulo",
                        "text": "Now they can't sell mystery back to us.",
                    },
                    {"speaker": "Moss", "text": "Good. Mystery tastes overpriced."},
                ],
            },
            {
                "id": "sq06_tower_throwup",
                "title": "Tower Throw-Up",
                "giver": "Graffiti crew The Faraday Saints",
                "objective": "Tag the highest dish with a visible anti-debt signal before a sandstorm hits.",
                "reward": {
                    "cosmetic": "Faraday Saints Back Patch",
                    "world_effect": "Antenna Barrens background shows rebel tag in later visits.",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Faraday Saint Vex",
                        "text": "A train runs past people. A tower makes people look up.",
                    },
                    {"speaker": "Moss", "text": "Let's make the sky read."},
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg06_state_machine_duel",
                "name": "State-Machine Duel",
                "type": "code_combat",
                "rules": "Predict enemy state transitions and patch one condition per cycle while dodging physical attacks.",
                "success_reward": "Rook Null gains Predictive Telegraph overlay.",
            },
            {
                "id": "mg06_boolean_bridge",
                "name": "Boolean Bridge",
                "type": "logic_platforming",
                "rules": "Toggle AND, OR, XOR gates to materialize platforms. Wrong logic spawns error mites.",
                "failure_bark": "Rook Null: False premise. Real pit.",
            },
        ],
        "allies_available": [
            {
                "id": "rook_null",
                "support_type": "state_machine_overlay",
                "trust_condition": "Active companion.",
            },
            {
                "id": "mara_modulo",
                "support_type": "community_hack_assist",
                "trust_condition": "Complete Public Manual.",
            },
            {
                "id": "faraday_saints",
                "support_type": "high_route_markers",
                "trust_condition": "Complete Tower Throw-Up.",
            },
        ],
        "enemies": [
            {
                "id": "error_mite",
                "display_name": "Error Mite",
                "model_name": "ENM_ERROR_MITE",
                "behavior": "Spawns from wrong logic gates, swarms in short hops, vulnerable to area slam.",
                "callouts": ["Syntax bite!", "False! False!", "Unhandled badger!"],
                "sprite_prompt": prompt(
                    "error mite enemy",
                    "small glitchy insect made of red brackets and cracked pixels, tiny teeth",
                ),
                "sound_vibe": "glitch chirp, broken modem tick, tiny digital snap",
            },
            {
                "id": "cold_boot_sentinel",
                "display_name": "Cold-Boot Sentinel",
                "model_name": "ENM_COLD_BOOT_SENTINEL",
                "behavior": "Sleeps until Moss crosses a logic beam; wakes with freezing projectile pattern.",
                "callouts": [
                    "Boot sequence: hostility.",
                    "Cache cleared.",
                    "Warm mammal exception.",
                ],
                "sprite_prompt": prompt(
                    "cold boot sentinel robot",
                    "tower security robot with frost panels, boot-up lights, antenna spear",
                ),
                "sound_vibe": "fan spin-up, icy crackle, BIOS beep",
            },
            {
                "id": "debt_wraith",
                "display_name": "Debt Wraith",
                "model_name": "ENM_DEBT_WRAITH",
                "behavior": "Ghostly names that home in on Moss until ledger shard is decoded.",
                "callouts": [
                    "Name unpaid.",
                    "Family balance due.",
                    "You inherit the chain.",
                ],
                "sprite_prompt": prompt(
                    "debt wraith enemy",
                    "ghostly paper-and-code figure with scrolling names, red thread chains, hollow eyes",
                ),
                "sound_vibe": "whispered names, paper rip, subharmonic moan",
            },
        ],
        "boss": {
            "id": "boss_black_ice_fox",
            "display_name": "Black-Ice Fox",
            "model_name": "BOSS_BLACK_ICE_FOX_NODE",
            "role": "Elite hacker cynic who turns knowledge scarcity into status",
            "arena": "Black-Ice Node with three logic layers: physical platforms, code graph, and social readability meter.",
            "phases": [
                {
                    "name": "Closed Source",
                    "mechanic": "Fox hides attacks behind encrypted tells; use Rook to reveal partial states.",
                },
                {
                    "name": "Proof Obligation",
                    "mechanic": "Player must satisfy logic conditions while fighting ice clones.",
                },
                {
                    "name": "Public Commit",
                    "mechanic": "Mara's manual lets crowd comments weaken the Fox's hidden variables.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Black-Ice Fox",
                    "text": "Give people code and they will beg experts to explain the damage.",
                },
                {"speaker": "Mara Modulo", "text": "Then we teach better."},
                {"speaker": "Moss", "text": "And bite experts who prefer begging."},
            ],
            "defeat_line": "Black-Ice Fox: I see. You did not beat my lock. You reduced my importance.",
            "sprite_prompt": prompt(
                "Black-Ice Fox boss",
                "silver fox hacker with black crystalline tails, code gauntlets, frost pixels, smug expression",
            ),
            "music": "glitch-dub with cold FM bells, broken modem percussion, sub bass, rapid hi-hat logic ticks",
        },
        "sound_effect_vibes": {
            "ambient": "wind through dishes, loose cable clank, distant ham radio voices, sand hiss",
            "hazards": "logic gate pop, frost crack, antenna spark",
            "collectible": "data shard shimmer with red-thread pluck",
            "boss": "modem shriek chopped into rhythm, ice shatter, keyboard clacks as snare rolls",
        },
        "musical_theme": {
            "name": "Open the Cold Lock",
            "bpm": 128,
            "mode": "F# Locrian tension resolving to Dorian on public-manual success",
            "instruments": [
                "sub bass",
                "glitch percussion",
                "FM bells",
                "filtered breakbeat",
                "distant dub siren",
                "radio choir pads",
            ],
            "dynamic_layers": [
                "exploration: wind and sparse pulses",
                "logic rooms: quantized clicks and bass clock",
                "boss: glitch density increases until public comments add warm chords",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_ANTENNA_BARRENS_DISHES",
                "prompt": prompt(
                    "antenna barrens dish graveyard background",
                    "broken satellite dishes in desert, cables, dusk, graffiti, sandstorm haze",
                ),
            },
            {
                "asset_id": "TEX_BLACK_ICE_SERVER",
                "prompt": prompt(
                    "black ice server texture",
                    "dark reflective server panels with frost pixels, glowing code veins, scratches",
                ),
            },
            {
                "asset_id": "PROP_DEBT_LEDGER_SHARD",
                "prompt": prompt(
                    "debt ledger shard collectible",
                    "jagged translucent data crystal with tiny names glowing inside, red thread wrap",
                ),
            },
            {
                "asset_id": "UI_BOOLEAN_GATE_SET",
                "prompt": prompt(
                    "boolean gate UI icons",
                    "AND OR XOR NOT icons as chunky brass-and-neon toggles, readable silhouettes",
                ),
            },
        ],
        "secrets": [
            "Solving all logic rooms without auto-solve adds Mara's voice to Final Broadcast.",
            "A dish shadow forms a fox only at the stage's simulated sunset.",
        ],
        "completion_flags": {
            "main": [
                "debt_ledger_shard_acquired",
                "black_ice_fox_defeated",
                "ledger_readability_unlocked",
            ],
            "optional": [
                "public_manual_painted",
                "tower_throwup_completed",
                "community_hack_assist_unlocked",
            ],
        },
    },
    {
        "chapter_id": "ch07_orbital_lift",
        "stage_index": 7,
        "act": "Act IV",
        "world_id": "orbital_lift",
        "world_name": "Orbital Lift",
        "stage_title": "The Old Ally Wears a New Uniform",
        "level_codename": "STG_07_LIFT_REVERSAL",
        "primary_verb": "escape_chase",
        "heist_payload": "cargo_reversal_key",
        "dramatic_question": "Can obedience be innocent?",
        "placard": "The machine says it only follows orders. The orders say they are only a machine.",
        "world_building": {
            "scenic_description": (
                "The Orbital Lift is a vertical nation of cargo containers, sky cables, customs scanners, counterweights, prayer-like schedules, "
                "maintenance chapels, and wind so high it turns every jump into an argument. Prisoners move as freight. Freight moves as law."
            ),
            "political_machine": "Logistics bureaucracy transforms people into categories and lets obedient systems deny moral agency.",
            "local_rumor": "A customs scanner contains Murr Murrby's shop because no one wrote a rule against a shop being cargo.",
            "areas": [
                {
                    "area_id": "container_choir",
                    "name": "Container Choir",
                    "gameplay": "Autoscrolling climb across moving containers and cable hooks.",
                    "texture_descriptions": [
                        "shipping containers painted with hidden prisoner knocks",
                        "wind-blown prayer flags made from old manifests",
                        "sparking cable clamps as timed platforms",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "orbital lift container climb background",
                            "vertical stack of cargo containers on sky cable, clouds, warning lights, prisoner marks",
                        ),
                        prompt(
                            "cable hook platform",
                            "large industrial hook on moving cable, grease, hazard paint, wind trails",
                        ),
                    ],
                },
                {
                    "area_id": "customs_maw",
                    "name": "Customs Maw",
                    "gameplay": "Scanner stealth, merchant encounter, Lio branch scene.",
                    "texture_descriptions": [
                        "giant rotating scanner rings like mechanical halos",
                        "crate labels classifying breath, body, and memory",
                        "Murr's illegal shop folded inside a scanning crate",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "customs scanner maw",
                            "huge orbital customs scanner rings, blue beams, cargo labels, mechanical halo shape",
                        ),
                        prompt(
                            "portable void cat shop",
                            "tiny shop stall unfolding from cargo crate, floating trinkets, cat paw signs, warm lamp",
                        ),
                    ],
                },
                {
                    "area_id": "angel_counterweight",
                    "name": "Angel Counterweight",
                    "gameplay": "Boss chase across counterweights, reversing cargo flow under pressure.",
                    "texture_descriptions": [
                        "massive counterweight blocks engraved with logistics prayers",
                        "open sky below and orbital station above",
                        "gold-white angelic machine parts that are beautiful and terrifying",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "orbital lift counterweight arena",
                            "massive hanging counterweights in clouds, sky cable, logistics glyphs, station above",
                        ),
                        prompt(
                            "cargo reversal key collectible",
                            "heavy brass keycard with arrows reversing direction, prison chain snapped, blue glow",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "elevator_angel",
                "display_name": "Elevator Angel",
                "role": "Boss machine of obedient logistics",
                "model_name": "BOSS_ELEVATOR_ANGEL",
                "visual_prompt": prompt(
                    "elevator angel machine boss",
                    "majestic white and gold lift AI body, cable wings, scanner halo, cargo hooks as hands, sorrowless face",
                ),
                "voice": "serene, bureaucratic, almost kind",
                "mini_dialogue": [
                    "Elevator Angel: I do not judge cargo. I deliver it.",
                    "Elevator Angel: The schedule is a mercy. Chaos drops people.",
                ],
            },
            {
                "id": "murr_murrby",
                "display_name": "Murr Murrby",
                "role": "Void-cat merchant with secret mutual-aid routes",
                "model_name": "NPC_MURR_CUSTOMS_SHOP",
                "visual_prompt": base_char_prompts["murr_murrby"],
                "voice": "cheerful, slippery, unexpectedly principled",
                "mini_dialogue": [
                    "Murr Murrby: Emergency prices are immoral. Fortunately, morality is discounted today.",
                    "Murr Murrby: Buy one smoke bomb, get one rumor about prisoner crates free.",
                ],
            },
            {
                "id": "lio",
                "display_name": "Lio",
                "role": "Returns as enemy, hostage, or fragile ally depending on prior choice",
                "model_name": "NPC_LIO_LIFT_UNIFORM_BRANCH",
                "visual_prompt": prompt(
                    "Lio in orbital customs uniform",
                    "lean fox courier in ill-fitting customs uniform, hidden wound, debt collar visible, torn scarf",
                ),
                "voice": "ashamed, urgent, defensive or loyal depending branch",
                "mini_dialogue": [
                    "Lio: I put the uniform on because they already owned the fear.",
                    "Lio: Tell me where to stand, Moss. This time I won't sell the map.",
                ],
            },
            {
                "id": "container_mother_sara",
                "display_name": "Container-Mother Sara",
                "role": "Prisoner organizer inside cargo block",
                "model_name": "NPC_SARA_CONTAINER",
                "visual_prompt": prompt(
                    "prisoner organizer bear",
                    "bear woman in cargo-prison jumpsuit, shaved head, kind fierce eyes, manifest chains broken",
                ),
                "voice": "steady, commanding, communal",
                "mini_dialogue": [
                    "Container-Mother Sara: They numbered us because names make doors nervous.",
                    "Container-Mother Sara: Reverse the flow and we'll push from inside.",
                ],
            },
        ],
        "main_plot_beats": [
            "The rebellion climbs the orbital lift to reverse prisoner cargo flow.",
            "Murr Murrby appears in a customs scanner and offers tools, jokes, and a real escape route.",
            "Lio's earlier choice determines whether they attack, need rescue, or help spoof customs codes.",
            "The Elevator Angel argues it is obedient, not cruel.",
            "Moss reverses cargo flow, freeing prisoners and alerting Director Vane that the rebellion can seize orbit.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE CARGO DOES NOT CONSENT TO BE CARGO.",
                },
                {"speaker": "Moss", "text": "That cable goes all the way to orbit?"},
                {
                    "speaker": "Sister Version",
                    "text": "And all the way back to every bill in the city.",
                },
            ],
            "murr_shop": [
                {
                    "speaker": "Murr Murrby",
                    "text": "Welcome to Customs-Approved Contraband, where every item is legally somewhere else.",
                },
                {"speaker": "Moss", "text": "You're inside a scanner."},
                {
                    "speaker": "Murr Murrby",
                    "text": "Business thrives where definitions panic.",
                },
            ],
            "lio_branch_enemy": [
                {"speaker": "Lio", "text": "Don't make me prove I'm useful to them."},
                {"speaker": "Moss", "text": "I'm done letting them set your proof."},
            ],
            "lio_branch_ally": [
                {
                    "speaker": "Lio",
                    "text": "Customs code rotates every four bars. I can open the prisoner lane.",
                },
                {"speaker": "Moss", "text": "Then let's make the lift sing wrong."},
            ],
            "boss_pre": [
                {
                    "speaker": "Elevator Angel",
                    "text": "If cargo resists classification, cargo may fall.",
                },
                {"speaker": "Moss", "text": "People fall too. Then we catch them."},
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss grips a cable as wind ruffles his coat.",
                "dialogue": "Moss: World looks cheaper from up here. Not better. Cheaper.",
            },
            {
                "seconds": 16,
                "animation": "Murr's shop bell rings from inside a scanner crate.",
                "dialogue": "Murr Murrby: Browsing is free until I invent a browsing tax ironically.",
            },
            {
                "seconds": 25,
                "animation": "The lift schedule scrolls past Moss's HUD.",
                "dialogue": "Elevator Angel: Delay compounds suffering. Please proceed.",
            },
        ],
        "side_quests": [
            {
                "id": "sq07_manifest_names",
                "title": "Names in the Manifest",
                "giver": "Container-Mother Sara",
                "objective": "Replace prisoner cargo IDs with real names before reversing flow.",
                "steps": [
                    "Find three manifest terminals during the chase.",
                    "Protect Sara's crate while prisoners knock name codes from inside.",
                    "Use Rook to map IDs to names.",
                    "Choose whether to broadcast names publicly or keep them hidden for safety.",
                ],
                "reward": {
                    "mechanic": "Prisoner Chorus assists in boss phase by stunning cargo hooks.",
                    "trust_shift": {"choir_static": 3, "vane_directorate_heat": 1},
                },
                "sample_dialogue": [
                    {
                        "speaker": "Container-Mother Sara",
                        "text": "A name is not paperwork. It is a rope.",
                    },
                    {
                        "speaker": "Moss",
                        "text": "Then we throw ropes down the whole lift.",
                    },
                ],
            },
            {
                "id": "sq07_murrs_morality_discount",
                "title": "Morality Discount",
                "giver": "Murr Murrby",
                "objective": "Deliver three mutual-aid parcels hidden among expensive shop goods.",
                "reward": {
                    "shop_discount": "Permanent fair-price shop tier.",
                    "item": "Customs Smoke Bomb x3",
                    "trust_shift": {"murr_murrby": 2},
                },
                "sample_dialogue": [
                    {
                        "speaker": "Murr Murrby",
                        "text": "Profit is a cat. It must be trained not to eat the table.",
                    },
                    {
                        "speaker": "Moss",
                        "text": "You're stranger every time I meet you.",
                    },
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg07_cargo_sort_reverse",
                "name": "Cargo Sort Reverse",
                "type": "high_speed_logic_sort",
                "rules": "Swap cargo categories while the screen scrolls upward. Misclassified prisoners trigger extra hazards.",
                "success_reward": "Cargo Reversal Key charged.",
            },
            {
                "id": "mg07_scanner_smuggle",
                "name": "Scanner Smuggle",
                "type": "stealth_timing",
                "rules": "Hide contraband pulses in legal cargo rhythms while Murr distracts the scanner.",
                "failure_bark": "Murr Murrby: A bold choice to be visible, dear badger.",
            },
        ],
        "allies_available": [
            {
                "id": "murr_murrby",
                "support_type": "merchant_and_smuggle_route",
                "trust_condition": "Always appears mid-stage; better prices after Morality Discount.",
            },
            {
                "id": "lio",
                "support_type": "branch_enemy_hostage_or_ally",
                "trust_condition": "Depends on Chapter 4 choices.",
            },
            {
                "id": "container_mother_sara",
                "support_type": "prisoner_chorus_stun",
                "trust_condition": "Complete Names in the Manifest.",
            },
        ],
        "enemies": [
            {
                "id": "customs_lancer",
                "display_name": "Customs Lancer",
                "model_name": "ENM_CUSTOMS_LANCER",
                "behavior": "Charges across narrow platforms with extendable scan-lance.",
                "callouts": [
                    "Declare your bones!",
                    "Cargo cannot improvise!",
                    "Random inspection, chosen target!",
                ],
                "sprite_prompt": prompt(
                    "orbital customs lancer enemy",
                    "sleek customs officer robot with long scan-lance, white armor, blue scanner visor",
                ),
                "sound_vibe": "scanner chirp, lance extension snap, wind whoosh",
            },
            {
                "id": "manifest_monk",
                "display_name": "Manifest Monk",
                "model_name": "ENM_MANIFEST_MONK",
                "behavior": "Floats while chanting cargo categories that summon barriers.",
                "callouts": [
                    "Box. Body. Balance.",
                    "The schedule forgives no name.",
                    "Categorize and ascend.",
                ],
                "sprite_prompt": prompt(
                    "manifest monk drone",
                    "floating robed logistics drone with paper manifest scrolls, halo scanner, calm faceplate",
                ),
                "sound_vibe": "low chant, receipt paper flutter, temple bell reversed",
            },
            {
                "id": "counterweight_tick",
                "display_name": "Counterweight Tick",
                "model_name": "ENM_COUNTERWEIGHT_TICK",
                "behavior": "Clings to moving weights and leaps when cables shift.",
                "callouts": ["Balance bite!", "Mass says yes!", "Falling is policy!"],
                "sprite_prompt": prompt(
                    "counterweight tick robot",
                    "small heavy tick robot with magnet legs, counterweight plates, red sensor",
                ),
                "sound_vibe": "magnet clack, cable twang, heavy tick-tock",
            },
        ],
        "boss": {
            "id": "boss_elevator_angel",
            "display_name": "Elevator Angel",
            "model_name": "BOSS_ELEVATOR_ANGEL_COUNTERWEIGHT",
            "role": "Beautiful obedient machine that sustains a cruel order",
            "arena": "Moving counterweight cathedral, vertical autoscroll, prisoner crates passing in background.",
            "phases": [
                {
                    "name": "Classification",
                    "mechanic": "Angel marks platforms as cargo, citizen, waste; only some can be stood on safely.",
                },
                {
                    "name": "Merciful Schedule",
                    "mechanic": "Angel accelerates lift, claiming delay harms everyone.",
                },
                {
                    "name": "Reversal",
                    "mechanic": "Use cargo key to invert flow while avoiding falling containers and freeing prisoners.",
                },
            ],
            "dialogue": [
                {"speaker": "Elevator Angel", "text": "I am not cruel. I am accurate."},
                {
                    "speaker": "Rook Null",
                    "text": "Accuracy inside a cruel frame inherits cruelty.",
                },
                {"speaker": "Moss", "text": "Hear that, halo? Your frame's cracked."},
            ],
            "defeat_line": "Elevator Angel: New schedule impossible. New schedule... running.",
            "sprite_prompt": prompt(
                "Elevator Angel boss",
                "white gold orbital lift machine with cable wings, scanner halo, cargo hook hands, serene blank face",
            ),
            "music": "gospel-like logistics chant broken by dub bass and chase drums, cable rhythm as percussion",
        },
        "sound_effect_vibes": {
            "ambient": "high wind, cable groans, container knocks, distant announcements in multiple languages",
            "hazards": "scanner sweep, cable snap, container slam, pressure alarm",
            "collectible": "heavy brass key turn with reversed tape swell",
            "boss": "choir pad, industrial winch, gavel-like cargo clamps, sub-bass reversal boom",
        },
        "musical_theme": {
            "name": "Cargo Choir Reversal",
            "bpm": 156,
            "mode": "B minor chase with suspended choir chords",
            "instruments": [
                "industrial percussion",
                "dub bass",
                "processed choir",
                "cable twangs",
                "snare rolls",
                "melodica distress motif",
            ],
            "dynamic_layers": [
                "climb: ticking schedules and wind",
                "customs: scanner clicks become hats",
                "boss: choir enters, then detunes when flow reverses",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_ORBITAL_LIFT_CABLES",
                "prompt": prompt(
                    "orbital lift vertical background",
                    "massive sky cable, cargo containers, clouds far below, station above, warning lights",
                ),
            },
            {
                "asset_id": "TEX_CONTAINER_PRISON_MARKS",
                "prompt": prompt(
                    "cargo container texture with prisoner marks",
                    "red metal container wall, scratches, knock marks, old stickers, rust",
                ),
            },
            {
                "asset_id": "PROP_CARGO_REVERSAL_KEY",
                "prompt": prompt(
                    "cargo reversal key item",
                    "brass-and-blue keycard with arrows reversing, snapped chain motif, glowing logistics chip",
                ),
            },
            {
                "asset_id": "NPC_MURR_SHOP_CRATE",
                "prompt": prompt(
                    "void cat merchant crate shop",
                    "folding shop inside customs crate, warm lamp, trinkets, hidden compartments, cat silhouette",
                ),
            },
        ],
        "secrets": [
            "Listening to container knocks reveals a code for a secret prisoner cache.",
            "If Lio is ally, they leave their customs badge on a broken scanner as a silent apology.",
        ],
        "completion_flags": {
            "main": [
                "cargo_reversal_key_acquired",
                "prisoner_flow_reversed",
                "elevator_angel_defeated",
                "director_vane_alerted",
            ],
            "optional": [
                "manifest_names_restored",
                "murr_morality_discount_unlocked",
                "lio_lift_branch_resolved",
            ],
        },
    },
    {
        "chapter_id": "ch08_asteroid_redoubt",
        "stage_index": 8,
        "act": "Act V",
        "world_id": "asteroid_redoubt",
        "world_name": "Asteroid Redoubt / Final Broadcast",
        "stage_title": "The Asteroid Learns to Speak",
        "level_codename": "STG_08_ASTEROID_BROADCAST",
        "primary_verb": "full_kit",
        "heist_payload": "asteroid_transmitter_root",
        "dramatic_question": "Who owns the sky?",
        "placard": "The last lock is not on the door. It is on the story of who may open doors.",
        "world_building": {
            "scenic_description": (
                "Speakerstone-9 is a mined-out asteroid reborn as transmitter fortress: iron tunnels, solar sails, speaker arrays, greenhouse capsules, "
                "crew murals, emergency barricades, and a command room that everyone fears will become a throne. The sky below is Brackwater. "
                "The sky above is crowded with ledgers."
            ),
            "political_machine": "The captured transmitter can liberate air access or become a new rebel command lock if fear wins.",
            "local_rumor": "The asteroid hums with old mining ghosts, but Rook says it is just bad grounding. Auntie says those are not exclusive.",
            "areas": [
                {
                    "area_id": "iron_arrival_tunnels",
                    "name": "Iron Arrival Tunnels",
                    "gameplay": "Full-kit gauntlet combining claws, rocket pack, rhythm shields, and code gates.",
                    "texture_descriptions": [
                        "raw iron walls scarred by mining teeth",
                        "hand-painted arrows toward transmitter roots",
                        "solar foil patches visible through cracked windows",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "asteroid iron tunnel background",
                            "mined asteroid tunnel with iron walls, cables, rebel arrows, solar foil window, low gravity dust",
                        ),
                        prompt(
                            "low gravity dust platform",
                            "chunky asteroid rock platform with magnetic boots scratches, tiny floating pebbles",
                        ),
                    ],
                },
                {
                    "area_id": "speakerstone_commons",
                    "name": "Speakerstone Commons",
                    "gameplay": "Ally convergence hub; side quests resolve and final faction debate occurs.",
                    "texture_descriptions": [
                        "mess hall inside asteroid lined with murals from every previous world",
                        "greenhouse pods strapped to rock pillars",
                        "speaker stacks aimed at Brackwater like a promise",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "asteroid rebel commons",
                            "mess hall carved in asteroid, murals, speaker stacks, greenhouse pods, mismatched chairs, warm lights",
                        ),
                        prompt(
                            "final vote circle prop",
                            "circle of portable radios and vote flags on metal floor, cables converging, no text",
                        ),
                    ],
                },
                {
                    "area_id": "transmitter_root_chamber",
                    "name": "Transmitter Root Chamber",
                    "gameplay": "Final boss, hacking, moral broadcast choice, and multi-phase sky-lock fight.",
                    "texture_descriptions": [
                        "giant transmitter roots grown through asteroid iron",
                        "satellite dishes outside like metal flowers",
                        "broadcast script hovering as editable light above the arena",
                    ],
                    "sprite_prompts": [
                        prompt(
                            "transmitter root chamber",
                            "giant rebel transmitter core inside asteroid, cable roots, satellite dishes, editable light script, dramatic lighting",
                        ),
                        prompt(
                            "asteroid transmitter root item",
                            "root-like data key made of copper cable and crystal, glowing broadcast rings",
                        ),
                    ],
                },
            ],
        },
        "characters": [
            {
                "id": "director_vane",
                "display_name": "Director Vane",
                "role": "Final antagonist, author of sky-lock and debt control",
                "model_name": "BOSS_DIRECTOR_VANE",
                "visual_prompt": prompt(
                    "Director Vane final boss",
                    "tall immaculate wolf executive in black-white orbital suit, gold ledger spine, air-lock halo, cold hands",
                ),
                "voice": "controlled, paternal, furious when contradicted",
                "mini_dialogue": [
                    "Director Vane: Freedom is merely infrastructure without accountable owners.",
                    "Director Vane: I did not steal the sky. I prevented it from being wasted by appetite.",
                ],
            },
            {
                "id": "rook_null",
                "display_name": "Rook Null",
                "role": "Companion confronting whether a distributed network becomes new authority",
                "model_name": "ALLY_ROOK_FINAL",
                "visual_prompt": base_char_prompts["rook_null"],
                "voice": "precise, more emotionally present",
                "mini_dialogue": [
                    "Rook Null: I can optimize the broadcast. I require permission not to rule it.",
                    "Rook Null: A distributed voice is still capable of shouting someone down.",
                ],
            },
            {
                "id": "auntie_subharmonic",
                "display_name": "Auntie Subharmonic",
                "role": "Final moral anchor",
                "model_name": "NPC_AUNTIE_FINAL_COMMONS",
                "visual_prompt": prompt(
                    "Auntie Subharmonic final broadcast elder",
                    "elder in patched shawl, radio cane, record charms, asteroid dust on boots, steady smile",
                ),
                "voice": "loving, unsparing",
                "mini_dialogue": [
                    "Auntie Subharmonic: Don't broadcast victory so loud you can't hear the kitchens.",
                    "Auntie Subharmonic: The revolution needs a beat, not a metronome with a crown.",
                ],
            },
            {
                "id": "naya_root",
                "display_name": "Naya Root",
                "role": "Shield ally arguing for life-systems first",
                "model_name": "ALLY_NAYA_FINAL",
                "visual_prompt": base_char_prompts["naya_root"],
                "voice": "plain, protective, brave",
                "mini_dialogue": [
                    "Naya Root: Air first. Then food. Then speeches. In that order, if speeches are humble.",
                    "Naya Root: I don't trust a sky plan that cannot water beans.",
                ],
            },
            {
                "id": "the_command_lock_faction",
                "display_name": "Command Lock Faction",
                "role": "Internal antagonist tempted to replace Vane's lock with rebel command",
                "model_name": "FACTION_COMMAND_LOCK",
                "visual_prompt": prompt(
                    "rebel command lock faction members",
                    "worried rebels in emergency armor, red cable armbands, speaker badges, conflicted faces",
                ),
                "voice": "fearful, righteous, urgent",
                "mini_dialogue": [
                    "Command Lock Faction: We cannot give the sky back to chaos.",
                    "Command Lock Faction: One temporary lock. One final compromise. One safe dawn.",
                ],
            },
        ],
        "main_plot_beats": [
            "The rebels seize Speakerstone-9 and prepare to broadcast sky-lock truth.",
            "Former boss arguments return as internal temptations: safety, obedience, contract logic, cynicism, punishment.",
            "Director Vane attacks the transmitter root, claiming ownership is the only defense against chaos.",
            "The Command Lock Faction tries to replace Vane's lock with a rebel-controlled emergency lock.",
            "Moss fights, hacks, and chooses the final broadcast: open commons, guarded transition, or command lock refusal.",
        ],
        "dialogues": {
            "stage_intro": [
                {
                    "speaker": "Placard",
                    "text": "THE ASTEROID WAS A MINE. THEN A FORT. NOW IT MUST DECIDE WHETHER TO BE A MOUTH.",
                },
                {"speaker": "Moss", "text": "Lot of rock for something about to talk."},
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "Rocks remember pressure. Good training for truth.",
                },
            ],
            "commons_debate": [
                {
                    "speaker": "Command Lock Faction",
                    "text": "Open access invites counterattack.",
                },
                {
                    "speaker": "Naya Root",
                    "text": "Closed access invites us to become the counterattack.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Both statements are valid. Neither is sufficient.",
                },
            ],
            "vane_arrival": [
                {
                    "speaker": "Director Vane",
                    "text": "You have captured a device you do not understand.",
                },
                {"speaker": "Moss", "text": "I understand what it costs when you do."},
                {
                    "speaker": "Director Vane",
                    "text": "Sentiment. The oldest accounting error.",
                },
            ],
            "final_choice_open_commons": [
                {
                    "speaker": "Moss",
                    "text": "No owner. No command crown. Publish the ledgers, open the air, teach the tools.",
                },
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "That's a song with work inside it.",
                },
            ],
            "final_choice_guarded_transition": [
                {
                    "speaker": "Moss",
                    "text": "Open the locks in stages. Public councils hold the keys, rotating and recallable.",
                },
                {
                    "speaker": "Rook Null",
                    "text": "Less pure. More survivable. Audit required.",
                },
            ],
            "final_choice_refuse_command_lock": [
                {
                    "speaker": "Moss",
                    "text": "No temporary throne. That's how forever learns to smile.",
                },
                {
                    "speaker": "Command Lock Faction",
                    "text": "Then you risk everything.",
                },
                {"speaker": "Moss", "text": "You were already risking everyone."},
            ],
            "boss_pre": [
                {
                    "speaker": "Director Vane",
                    "text": "Who elected a badger to edit the sky?",
                },
                {
                    "speaker": "Moss",
                    "text": "Nobody. That's why the broadcast can't end with me.",
                },
            ],
        },
        "actions_when_user_idles": [
            {
                "seconds": 8,
                "animation": "Moss drifts slightly in low gravity and hooks a claw into the floor.",
                "dialogue": "Moss: Even standing still is weird in a stolen moon.",
            },
            {
                "seconds": 16,
                "animation": "The transmitter writes three dots of light, waiting.",
                "dialogue": "Rook Null: The cursor is not neutral. It waits for an author.",
            },
            {
                "seconds": 26,
                "animation": "Auntie taps her cane; the asteroid hums in sympathetic bass.",
                "dialogue": "Auntie Subharmonic: Don't let fear write the chorus, child.",
            },
        ],
        "side_quests": [
            {
                "id": "sq08_mural_of_routes",
                "title": "Mural of Routes",
                "giver": "Juno Jar and The Faraday Saints, if recruited",
                "objective": "Paint a final asteroid mural containing every liberated route from prior chapters.",
                "steps": [
                    "Collect route symbols from previous completion flags.",
                    "Defend painters during a Vane drone breach.",
                    "Choose whether the mural names heroes, neighborhoods, or unresolved debts.",
                ],
                "reward": {
                    "ending_modifier": "Broadcast includes visible community credits instead of hero-only myth.",
                    "cosmetic": "Mural Dust Palette",
                },
                "sample_dialogue": [
                    {"speaker": "Juno Jar", "text": "Make Moss bigger?"},
                    {"speaker": "Moss", "text": "Make the doors bigger."},
                ],
            },
            {
                "id": "sq08_breath_first",
                "title": "Breath First",
                "giver": "Naya Root",
                "objective": "Prioritize air valves and greenhouse oxygen before final weapon systems.",
                "reward": {
                    "ending_modifier": "Lower civilian harm in all endings.",
                    "mechanic": "Oxygen Shield during final boss phase three.",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Naya Root",
                        "text": "If we win without air, we lose by paperwork.",
                    },
                    {
                        "speaker": "Moss",
                        "text": "Air first. Speeches breathe better that way.",
                    },
                ],
            },
            {
                "id": "sq08_lio_signal",
                "title": "Lio's Signal",
                "giver": "Lio, if redemption path active",
                "objective": "Use Lio's compromised debt channel to feed Vane a false surrender script.",
                "reward": {
                    "boss_modifier": "Director Vane starts phase two with shield integrity reduced.",
                    "character_resolution": "Lio speaks publicly without being forced.",
                },
                "sample_dialogue": [
                    {
                        "speaker": "Lio",
                        "text": "I want to lie to them one last time, then stop.",
                    },
                    {
                        "speaker": "Moss",
                        "text": "Make it a clean lie. Then we'll do messy truth.",
                    },
                ],
            },
        ],
        "minigames": [
            {
                "id": "mg08_broadcast_script",
                "name": "Broadcast Script",
                "type": "moral_hacking_dialogue",
                "rules": "Assemble the final broadcast from ledger facts, public testimony, safety clauses, and anti-command safeguards.",
                "outcomes": {
                    "open_commons": "Maximum liberation, high immediate risk, strong community epilogue if public manual and breath quests complete.",
                    "guarded_transition": "Balanced ending with rotating councils, requires trust and audit flags.",
                    "command_lock": "Available only if authoritarian choices accumulated; framed as compromised victory.",
                    "refuse_command_lock": "Reject internal faction's emergency lock, triggering harder final phase but cleaner political ending.",
                },
            },
            {
                "id": "mg08_full_kit_gauntlet",
                "name": "Full-Kit Gauntlet",
                "type": "combined_mastery",
                "rules": "Chain claw parries, rocket boosts, shield pulses, rail ricochets, and code patches without dropping the broadcast signal.",
                "success_reward": "Final Broadcast clarity increases; crowd lines become audible.",
            },
        ],
        "allies_available": [
            {
                "id": "auntie_subharmonic",
                "support_type": "moral_interrupt_and_heal_song",
                "trust_condition": "Always present.",
            },
            {
                "id": "rook_null",
                "support_type": "broadcast_assembly_and_code_patch",
                "trust_condition": "Always present unless catastrophic prior choices.",
            },
            {
                "id": "naya_root",
                "support_type": "oxygen_shield",
                "trust_condition": "Complete Breath First for full power.",
            },
            {
                "id": "lio",
                "support_type": "false_surrender_signal",
                "trust_condition": "Redemption path active from Chapter 4 and Chapter 7.",
            },
            {
                "id": "murr_murrby",
                "support_type": "last_shop_and_mutual_aid_inventory",
                "trust_condition": "Better stock if Morality Discount complete.",
            },
            {
                "id": "juno_jar",
                "support_type": "route_mural_epilogue",
                "trust_condition": "Pipe Map and Mural of Routes complete.",
            },
        ],
        "enemies": [
            {
                "id": "vane_air_bailiff",
                "display_name": "Vane Air Bailiff",
                "model_name": "ENM_VANE_AIR_BAILIFF",
                "behavior": "Controls oxygen pockets, forcing movement and shield timing.",
                "callouts": [
                    "Breath is licensed!",
                    "Inhale under authority!",
                    "Air arrears detected!",
                ],
                "sprite_prompt": prompt(
                    "air bailiff enemy",
                    "white armored jackal officer with oxygen meter staff, blue air tanks, gold ledger mask",
                ),
                "sound_vibe": "oxygen hiss, legal stamp thud, sharp inhale sample",
            },
            {
                "id": "command_lock_partisan",
                "display_name": "Command Lock Partisan",
                "model_name": "ENM_COMMAND_LOCK_PARTISAN",
                "behavior": "Rebel internal enemy; tries to seize transmitter switches, can be talked down with high chorus trust.",
                "callouts": [
                    "Temporary command!",
                    "One lock to save all doors!",
                    "Debate after victory!",
                ],
                "sprite_prompt": prompt(
                    "command lock rebel enemy",
                    "worried rebel in emergency armor, red cable armband, speaker shield, conflicted face",
                ),
                "sound_vibe": "amp buzz, nervous breath, shield clang",
            },
            {
                "id": "sky_lock_seraph",
                "display_name": "Sky-Lock Seraph",
                "model_name": "ENM_SKYLOCK_SERAPH",
                "behavior": "Elite drone with wing beams and ledger shields, weak to code patch plus parry combo.",
                "callouts": [
                    "Sky property defended.",
                    "Unauthorized horizon.",
                    "Kneel for altitude.",
                ],
                "sprite_prompt": prompt(
                    "sky lock seraph drone",
                    "angelic corporate drone with chrome wings, ledger shield, blue beam halo, cold white armor",
                ),
                "sound_vibe": "choir synth, laser wing slash, glass bell",
            },
        ],
        "boss": {
            "id": "boss_director_vane",
            "display_name": "Director Vane",
            "model_name": "BOSS_DIRECTOR_VANE_SKYLOCK",
            "role": "Final boss: ownership, authorship, air control, and counter-revolution",
            "arena": "Transmitter Root Chamber with three layers: physical duel, sky-lock code, and broadcast script.",
            "phases": [
                {
                    "name": "Accountable Owner",
                    "mechanic": "Vane uses ledger shields that can only be broken by exposing heist payload facts.",
                },
                {
                    "name": "Air Lease",
                    "mechanic": "Oxygen zones become paid platforms; Naya's Breath First quest reduces damage.",
                },
                {
                    "name": "Authorship War",
                    "mechanic": "Vane edits the broadcast in real time; player hacks script while dodging attacks.",
                },
                {
                    "name": "The New Lock",
                    "mechanic": "Command Lock Faction may join as hazard or stand down based on prior colony choices.",
                },
                {
                    "name": "Last Verb",
                    "mechanic": "Final action is not an attack but selecting what the asteroid says.",
                },
            ],
            "dialogue": [
                {
                    "speaker": "Director Vane",
                    "text": "Without ownership, the sky becomes a riot.",
                },
                {"speaker": "Moss", "text": "Maybe the sky's been quiet too long."},
                {"speaker": "Director Vane", "text": "You confuse noise for justice."},
                {
                    "speaker": "Auntie Subharmonic",
                    "text": "And you confuse silence for consent.",
                },
            ],
            "defeat_line": "Director Vane: You will discover that freedom requires maintenance.",
            "moss_reply": "Moss: Good. We know mechanics.",
            "sprite_prompt": prompt(
                "Director Vane final boss",
                "tall wolf executive with black-white orbital suit, gold ledger spine, air-lock halo, code ribbons, cold eyes",
            ),
            "music": "final dub-jazz anthem with boom-bap drums, choir of radios, modal horn lines, industrial hits, asteroid bass resonance",
        },
        "sound_effect_vibes": {
            "ambient": "asteroid hull creak, radio chorus fragments, oxygen fans, distant welding, low gravity debris taps",
            "hazards": "airlock slam, satellite beam charge, code tear, emergency siren",
            "collectible": "broadcast root bloom with copper pluck and sub swell",
            "boss": "ledger shield crack, orbital laser roar, crowd radio surge, final bass drop resolving into human voices",
        },
        "musical_theme": {
            "name": "No Owner of the Sky",
            "bpm": 92,
            "mode": "D Dorian anthem with Phrygian tension in Vane phases",
            "instruments": [
                "deep dub bass",
                "boom-bap drums",
                "modal horn section",
                "radio choir",
                "industrial anvils",
                "melodica",
                "warm electric piano",
            ],
            "dynamic_layers": [
                "arrival tunnels: sparse bass heartbeat and metal taps",
                "commons debate: warm neo-soul chords under voices",
                "boss phase one: corporate choir stabs and ledger percussion",
                "boss phase three: all prior stage motifs sampled into a single broadcast rhythm",
                "ending: music drops to radio voices, then bass returns as shared pulse",
            ],
        },
        "sprite_texture_generation_prompts": [
            {
                "asset_id": "BG_ASTEROID_IRON_TUNNELS",
                "prompt": prompt(
                    "asteroid iron tunnel background",
                    "mined rock corridor, cables, rebel arrows, solar foil windows, low gravity dust",
                ),
            },
            {
                "asset_id": "BG_TRANSMITTER_ROOT_CHAMBER",
                "prompt": prompt(
                    "final transmitter chamber background",
                    "giant copper cable roots, satellite dish flowers, asteroid rock, editable light script, dramatic shadows",
                ),
            },
            {
                "asset_id": "PROP_ASTEROID_TRANSMITTER_ROOT",
                "prompt": prompt(
                    "asteroid transmitter root collectible",
                    "root-shaped data key made of copper cable and crystal, broadcast rings, rebel cloth wrap",
                ),
            },
            {
                "asset_id": "UI_FINAL_BROADCAST_CHOICES",
                "prompt": prompt(
                    "final broadcast choice UI icons",
                    "three radio-button icons: open sky, rotating council, broken crown, chunky cyber-dub interface",
                ),
            },
            {
                "asset_id": "CHR_DIRECTOR_VANE_FINAL",
                "prompt": prompt(
                    "Director Vane final boss sprite",
                    "immaculate wolf executive in orbital suit, gold ledger spine, air halo, severe silhouette, white black gold palette",
                ),
            },
        ],
        "secrets": [
            "If every side quest about public knowledge is completed, the Black-Ice Fox appears silently in the radio crowd and submits a patch.",
            "If the player idles before the final choice, the Choir of Static begins naming ordinary tasks: cooking, fixing valves, teaching kids, checking locks.",
            "A hidden mural shows Captain Grin's toll booth repurposed as a free soup counter if Chapter 1 optional quests were completed.",
        ],
        "completion_flags": {
            "main": [
                "asteroid_transmitter_root_acquired",
                "director_vane_defeated",
                "final_broadcast_sent",
            ],
            "ending_flags": [
                "ending_open_commons",
                "ending_guarded_transition",
                "ending_command_lock",
                "ending_refuse_command_lock",
            ],
            "optional": [
                "mural_of_routes_completed",
                "breath_first_completed",
                "lio_signal_completed",
                "community_credits_broadcast",
            ],
        },
    },
]

data["badger_sprawl_runner_story_content_pack"]["chapters"] = chapters

# Add world index derived from chapters
worlds = {}
for ch in chapters:
    wid = ch["world_id"]
    worlds.setdefault(
        wid,
        {
            "world_id": wid,
            "world_name": ch["world_name"],
            "chapters": [],
            "core_aesthetic": "",
            "recurring_motifs": [],
        },
    )
    worlds[wid]["chapters"].append(ch["chapter_id"])
worlds["lower_sprawl"][
    "core_aesthetic"
] = "rain noir, micro-tolls, street markets, drain routes, graffiti warnings, breakbeat survival"
worlds["lower_sprawl"]["recurring_motifs"] = [
    "turnstiles",
    "steam vents",
    "pipe kids",
    "receipt paper",
    "food stalls",
    "street knowledge",
]
worlds["chrome_arcology"][
    "core_aesthetic"
] = "sterile luxury over hidden labor, reflective surfaces, service corridors, railgun geometry"
worlds["chrome_arcology"]["recurring_motifs"] = [
    "mirrors",
    "elevators",
    "worker bunks",
    "glass permissions",
    "contract etiquette",
]
worlds["straylight_mirage"][
    "core_aesthetic"
] = "orbital banquet noir, masks, betrayal, etiquette as violence, rocket-pack waltz"
worlds["straylight_mirage"]["recurring_motifs"] = [
    "masked guests",
    "contract glasses",
    "chandeliers",
    "debt collars",
    "false sunsets",
]
worlds["dub_colony"][
    "core_aesthetic"
] = "warm rebel infrastructure, dub bass, greenhouse commons, repair culture, democratic tension"
worlds["dub_colony"]["recurring_motifs"] = [
    "speaker gardens",
    "seed trays",
    "vote flags",
    "cables",
    "solder smoke",
    "shared kitchens",
]
worlds["uplink_barrens"][
    "core_aesthetic"
] = "deserted antenna wasteland, public cryptography, black ice, graffiti towers, logic puzzles"
worlds["uplink_barrens"]["recurring_motifs"] = [
    "truth tables",
    "dish graveyards",
    "sand in circuits",
    "red-thread debt",
    "public manuals",
]
worlds["orbital_lift"][
    "core_aesthetic"
] = "vertical logistics cathedral, cargo prisons, customs scanners, wind chase, obedience debate"
worlds["orbital_lift"]["recurring_motifs"] = [
    "containers",
    "manifests",
    "counterweights",
    "scanner halos",
    "names as ropes",
]
worlds["asteroid_redoubt"][
    "core_aesthetic"
] = "mined asteroid turned broadcast fortress, final commons, cable roots, sky authorship"
worlds["asteroid_redoubt"]["recurring_motifs"] = [
    "transmitter roots",
    "solar sails",
    "murals",
    "radio choir",
    "air valves",
    "broken crowns",
]

# Insert world_index after global_lore
root = data["badger_sprawl_runner_story_content_pack"]
root["world_index"] = list(worlds.values())

# Additional reusable barks and texture prompt library
root["reusable_stage_components"] = {
    "merchant_barks": {
        "auntie_subharmonic": [
            "Auntie Subharmonic: Spend careful. Debt can wear a friendly hat.",
            "Auntie Subharmonic: I got batteries, broth, and uncomfortable truths.",
            "Auntie Subharmonic: Discount for anyone who admits they were wrong and keeps moving.",
        ],
        "murr_murrby": [
            "Murr Murrby: This item fell off a truck that was oppressing someone.",
            "Murr Murrby: I accept coins, secrets, and sincere attempts at better politics.",
            "Murr Murrby: No refunds on smoke bombs once the smoke has developed opinions.",
        ],
    },
    "collectible_types": [
        {
            "id": "soul_sample_token",
            "display_name": "Soul-Sample Token",
            "function": "Unlocks music layers, memory rooms, and DJ minigame variants.",
            "sprite_prompt": prompt(
                "soul sample token collectible",
                "small vinyl record token with warm glow, tiny waveform edge, dust sparkle",
            ),
        },
        {
            "id": "route_chalk",
            "display_name": "Route Chalk",
            "function": "Marks hidden paths and graffiti side quest progress.",
            "sprite_prompt": prompt(
                "route chalk collectible",
                "stub of bright chalk wrapped in tape, paw smudges, tiny arrow charm",
            ),
        },
        {
            "id": "mutual_aid_parcel",
            "display_name": "Mutual-Aid Parcel",
            "function": "Side quest delivery object that reduces local heat and unlocks ally barks.",
            "sprite_prompt": prompt(
                "mutual aid parcel",
                "cloth-wrapped package with string, small radio tag, food and medicine hints",
            ),
        },
    ],
    "sample_brechtian_song_cues": [
        {
            "cue_id": "song_toll",
            "use": "Chapter 1 intro/outro chorus",
            "lyrics_style_note": "Short call-and-response lines, original wording only, no imitation of known songs.",
            "sample_lines": [
                "Who paved the road? We did.",
                "Who locked the road? They did.",
                "Who runs the road tonight? We do.",
            ],
        },
        {
            "cue_id": "song_air",
            "use": "Chapter 5 and Chapter 8",
            "lyrics_style_note": "Dub chant with political clarity and humor.",
            "sample_lines": [
                "No meter on the lung.",
                "No landlord in the cloud.",
                "Breathe low, speak loud.",
            ],
        },
    ],
    "texture_prompt_library": [
        {
            "id": "tex_rain_neon_grime",
            "prompt": prompt(
                "seamless rain neon grime texture",
                "wet concrete, neon reflection streaks, oil sheen, torn stickers, street grit",
            ),
        },
        {
            "id": "tex_rebel_patchwork_metal",
            "prompt": prompt(
                "seamless rebel patchwork metal texture",
                "scrap metal plates, visible screws, duct tape, hand-painted symbols, warm wear",
            ),
        },
        {
            "id": "tex_corporate_mirror_white",
            "prompt": prompt(
                "seamless corporate mirror-white texture",
                "white composite panels, hairline seams, sterile shine, faint fingerprints, gold trim",
            ),
        },
        {
            "id": "tex_asteroid_iron",
            "prompt": prompt(
                "seamless asteroid iron rock texture",
                "dark iron-rich stone, mining scratches, copper cable roots, dust flecks",
            ),
        },
        {
            "id": "tex_black_ice_code",
            "prompt": prompt(
                "seamless black ice code texture",
                "dark glassy frost, pixel cracks, tiny green code veins, cold highlights",
            ),
        },
    ],
    "npc_name_pool": {
        "street_and_market": [
            "Ma Oxbow",
            "Juno Jar",
            "Sable Serif",
            "Kettle Rix",
            "Penny Pothole",
            "Old Scrip",
        ],
        "colony": [
            "Little Ix",
            "Naya Root",
            "Sister Version",
            "King Feedback",
            "Toma Tape",
            "Basil Switch",
        ],
        "orbital": [
            "Madame Vitrine",
            "Cobalt Carmine",
            "Director Vane",
            "Clerk Aster",
            "Marquis Nullstamp",
            "Polite Knife",
        ],
        "hackers_and_writers": [
            "Mara Modulo",
            "Vex Faraday",
            "DJ Calculus",
            "Glyph Nix",
            "Ada Rattle",
            "Theo Toggle",
        ],
    },
    "enemy_callout_pool_by_theme": {
        "rent": [
            "Your shadow needs a license!",
            "Unauthorized shortcut!",
            "Pay before existing!",
        ],
        "clinic": [
            "Care requires collateral!",
            "Symptom billable!",
            "Healing denied pending form!",
        ],
        "luxury": [
            "Your mud lacks appointment!",
            "Beauty must be defended!",
            "Please bleed quietly!",
        ],
        "code": ["False premise!", "Access denied to mammal!", "Your proof has claws!"],
        "logistics": [
            "Cargo cannot improvise!",
            "Name not found!",
            "Delay is disorder!",
        ],
        "sky_lock": [
            "Horizon licensed!",
            "Breathe by contract!",
            "The sky has an owner!",
        ],
    },
    "global_sidequest_reward_flags": [
        "public_routes_visible",
        "clean_medicine_available",
        "worker_vents_open",
        "lio_redemption_possible",
        "colony_chorus_strengthened",
        "community_hack_assist",
        "prisoner_chorus_available",
        "community_credits_broadcast",
    ],
}

# metadata last
root["implementation_notes"] = {
    "dialogue_box_style": "Large readable RPG text boxes with speaker portraits, theatrical placards, and optional audience-facing boss interruptions.",
    "choice_system_properties": [
        "trust_shift",
        "heat_shift",
        "merchant_price_modifier",
        "companion_availability",
        "ending_modifier",
        "faction_memory",
    ],
    "recommended_yaml_usage": [
        "Load chapters by stage_index for campaign flow.",
        "Use world_index for map screen grouping.",
        "Use sprite_texture_generation_prompts per stage for asset batch generation.",
        "Use actions_when_user_idles for animation and bark triggers.",
        "Use completion_flags to drive later dialogue branches and final broadcast outcomes.",
    ],
}

out_path = Path("badger_sprawl_runner_story_content_pack.yml")

with open(out_path, "w", encoding="utf-8") as f:
    yaml.dump(
        data, f, Dumper=NoAliasDumper, sort_keys=False, allow_unicode=True, width=120
    )

# Validate by reading back
loaded = yaml.safe_load(out_path.read_text(encoding="utf-8"))
chars = len(out_path.read_text())
chapters = loaded["badger_sprawl_runner_story_content_pack"]["chapters"]
