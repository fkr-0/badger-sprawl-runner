#!/usr/bin/env bash
set -euo pipefail

SRC="images_6a23c916_DALLE_-_Pixel_Art_Sprite_Sheet"
DST="apps/runner/public/assets/sprites"

# Helper: find image file (handles both 001_unknown.png and 74.png patterns)
img() {
  local n=$1
  local padded=$(printf "%03d" "$n")
  local plain="$n"
  # Try padded first, then plain
  if [ -f "$SRC/${padded}_unknown.png" ]; then
    echo "$SRC/${padded}_unknown.png"
  elif [ -f "$SRC/${plain}.png" ]; then
    echo "$SRC/${plain}.png"
  elif [ -f "$SRC/${padded}.png" ]; then
    echo "$SRC/${padded}.png"
  else
    echo "ERROR: no file for image $n" >&2
    return 1
  fi
}

# Bosses
cp "$(img 29)" "$DST/bosses/boss_captain_grin_tollmech.png"
cp "$(img 30)" "$DST/bosses/boss_knife_drone_nest.png"
cp "$(img 31)" "$DST/bosses/boss_madame_vitrine_glasscourt.png"
cp "$(img 32)" "$DST/bosses/boss_reflection_judge_court.png"
cp "$(img 36)" "$DST/bosses/boss_director_vane_skylock.png"

# Characters
cp "$(img 76)" "$DST/characters/dr_mina_suture.png"
cp "$(img 77)" "$DST/characters/juno_jar.png"
cp "$(img 47)" "$DST/characters/lio.png"
cp "$(img 49)" "$DST/characters/little_ix.png"
cp "$(img 78)" "$DST/characters/mara_modulo.png"
cp "$(img 50)" "$DST/characters/black_ice_fox.png"
cp "$(img 51)" "$DST/characters/king_feedback.png"
cp "$(img 52)" "$DST/characters/madame_vitrine.png"
cp "$(img 32)" "$DST/characters/reflection_judge.png"
cp "$(img 35)" "$DST/characters/elevator_angel.png"
cp "$(img 53)" "$DST/characters/director_vane.png"
cp "$(img 54)" "$DST/characters/command_lock_faction.png"

# Enemies
cp "$(img 12)" "$DST/enemies/clinic_repo.png"
cp "$(img 16)" "$DST/enemies/mirror_sentinel.png"
cp "$(img 22)" "$DST/enemies/feedback_guard.png"
cp "$(img 25)" "$DST/enemies/customs_lancer.png"
cp "$(img 27)" "$DST/enemies/vane_air_bailiff.png"
cp "$(img 28)" "$DST/enemies/command_lock_partisan.png"

# Parallax worlds
cp "$(img 75)" "$DST/worlds/lower_sprawl_parallax.png"
cp "$(img 60)" "$DST/worlds/chrome_arcology_parallax.png"
cp "$(img 61)" "$DST/worlds/straylight_mirage_parallax.png"
cp "$(img 62)" "$DST/worlds/dub_colony_parallax.png"
cp "$(img 74)" "$DST/worlds/orbital_lift_parallax.png"

# Items (root level)
cp "$(img 65)" "$DST/items_core.png"
cp "$(img 71)" "$DST/item_icons.png"

echo "Copied $(ls -1 "$DST"/**/*.png "$DST"/*.png 2>/dev/null | wc -l) sprites to $DST"
