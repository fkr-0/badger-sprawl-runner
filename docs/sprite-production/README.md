# Sprite Production and Render Prompt Pack

This directory is the current production-art source of truth for rendering work.

```yaml
approved_reference: "operator-approved six-image neon-animal pixel-art board, supplied 2026-07-21"
current_targets: 71
current_jobs: 445
expansion_entries: 151
expansion_jobs: 785
remaining_gap_jobs: 266
total_render_jobs: 1230
total_prompted_frames: 6308
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
