# Render Queue

Render and review one coherent world bundle at a time. Raw model output remains source material until cleanup, assembly, and in-engine review pass.

## Priority 0 — Chapter 1 style lock

1. [`moss_badger_production`](prompts/current/player/moss_badger_production.md) — 17 render job(s)
2. [`enemy_rent_cop_piker`](prompts/current/enemies/enemy_rent_cop_piker.md) — 7 render job(s)
3. [`enemy_turnstile_mite`](prompts/current/enemies/enemy_turnstile_mite.md) — 7 render job(s)
4. [`boss_boss_captain_grin_tollmech`](prompts/current/bosses/boss_boss_captain_grin_tollmech.md) — 11 render job(s)
5. [`character_auntie_subharmonic`](prompts/current/characters/character_auntie_subharmonic.md) — 5 render job(s)
6. [`character_juno_jar`](prompts/current/characters/character_juno_jar.md) — 5 render job(s)
7. [`lower_sprawl_tiles`](prompts/current/worlds/lower_sprawl_tiles.md) — 7 render job(s)
8. [`lower_sprawl_parallax`](prompts/current/worlds/lower_sprawl_parallax.md) — 3 render job(s)
9. [`lower_sprawl_backdrop`](prompts/current/worlds/lower_sprawl_backdrop.md) — 1 render job(s)
10. [`items_core`](prompts/current/items/items_core.md) — 6 render job(s)
11. [`item_icons`](prompts/current/items/item_icons.md) — 1 render job(s)
12. [`skill_icons`](prompts/current/ui/skill_icons.md) — 2 render job(s)
13. [`vfx_combat`](prompts/current/vfx/vfx_combat.md) — 11 render job(s)
- [`portrait_moss`](prompts/expansion/portraits/moss.md) — dialogue portrait expressions
- [`portrait_auntie_subharmonic`](prompts/expansion/portraits/auntie_subharmonic.md) — dialogue portrait expressions
- [`portrait_juno_jar`](prompts/expansion/portraits/juno_jar.md) — dialogue portrait expressions

### Chapter 1 acceptance order

```text
Moss identity -> movement -> combat -> regular enemies -> boss
-> story characters and portraits -> items/VFX/HUD
-> tiles/parallax/backdrop -> assembled in-game review
```

Do not continue to the full campaign until the Chapter 1 bundle agrees on outline thickness, pixel density, anchor stability, palette restraint, VFX scale, and alpha cleanup.

## Priority 1 — Existing campaign sheets

### Drainmarket

- [`drainmarket_tiles`](prompts/current/worlds/drainmarket_tiles.md) — 7 job(s)
- [`drainmarket_parallax`](prompts/current/worlds/drainmarket_parallax.md) — 3 job(s)
- [`enemy_knife_drone`](prompts/current/enemies/enemy_knife_drone.md) — 7 job(s)
- [`enemy_clinic_repo`](prompts/current/enemies/enemy_clinic_repo.md) — 7 job(s)
- [`boss_boss_knife_drone_nest`](prompts/current/bosses/boss_boss_knife_drone_nest.md) — 11 job(s)
- [`character_rook_null`](prompts/current/characters/character_rook_null.md) — 5 job(s)
- [`character_dr_mina_suture`](prompts/current/characters/character_dr_mina_suture.md) — 5 job(s)
- [`character_dj_calculus`](prompts/current/characters/character_dj_calculus.md) — 5 job(s)

### Chrome Arcology

- [`chrome_arcology_tiles`](prompts/current/worlds/chrome_arcology_tiles.md) — 7 job(s)
- [`chrome_arcology_parallax`](prompts/current/worlds/chrome_arcology_parallax.md) — 3 job(s)
- [`enemy_chrome_bellhop`](prompts/current/enemies/enemy_chrome_bellhop.md) — 7 job(s)
- [`enemy_mirror_sentinel`](prompts/current/enemies/enemy_mirror_sentinel.md) — 7 job(s)
- [`boss_boss_madame_vitrine_glasscourt`](prompts/current/bosses/boss_boss_madame_vitrine_glasscourt.md) — 11 job(s)
- [`character_sister_version`](prompts/current/characters/character_sister_version.md) — 5 job(s)
- [`character_foreman_pell`](prompts/current/characters/character_foreman_pell.md) — 5 job(s)
- [`character_madame_vitrine`](prompts/current/characters/character_madame_vitrine.md) — 5 job(s)

### Straylight Mirage

- [`straylight_mirage_tiles`](prompts/current/worlds/straylight_mirage_tiles.md) — 7 job(s)
- [`straylight_mirage_parallax`](prompts/current/worlds/straylight_mirage_parallax.md) — 3 job(s)
- [`enemy_masque_duelist`](prompts/current/enemies/enemy_masque_duelist.md) — 7 job(s)
- [`enemy_contract_servitor`](prompts/current/enemies/enemy_contract_servitor.md) — 7 job(s)
- [`boss_boss_reflection_judge_court`](prompts/current/bosses/boss_boss_reflection_judge_court.md) — 11 job(s)
- [`character_lio`](prompts/current/characters/character_lio.md) — 5 job(s)
- [`character_cobalt_carmine`](prompts/current/characters/character_cobalt_carmine.md) — 5 job(s)
- [`character_reflection_judge`](prompts/current/characters/character_reflection_judge.md) — 5 job(s)

### Dub Colony

- [`dub_colony_tiles`](prompts/current/worlds/dub_colony_tiles.md) — 7 job(s)
- [`dub_colony_parallax`](prompts/current/worlds/dub_colony_parallax.md) — 3 job(s)
- [`enemy_signal_jammer_bat`](prompts/current/enemies/enemy_signal_jammer_bat.md) — 7 job(s)
- [`enemy_feedback_guard`](prompts/current/enemies/enemy_feedback_guard.md) — 7 job(s)
- [`boss_boss_king_feedback_ampthrone`](prompts/current/bosses/boss_boss_king_feedback_ampthrone.md) — 11 job(s)
- [`character_naya_root`](prompts/current/characters/character_naya_root.md) — 5 job(s)
- [`character_king_feedback`](prompts/current/characters/character_king_feedback.md) — 5 job(s)
- [`character_little_ix`](prompts/current/characters/character_little_ix.md) — 5 job(s)

### Antenna Barrens

- [`antenna_barrens_tiles`](prompts/current/worlds/antenna_barrens_tiles.md) — 7 job(s)
- [`antenna_barrens_parallax`](prompts/current/worlds/antenna_barrens_parallax.md) — 3 job(s)
- [`enemy_error_mite`](prompts/current/enemies/enemy_error_mite.md) — 7 job(s)
- [`enemy_debt_wraith`](prompts/current/enemies/enemy_debt_wraith.md) — 7 job(s)
- [`boss_boss_black_ice_fox_node`](prompts/current/bosses/boss_boss_black_ice_fox_node.md) — 11 job(s)
- [`character_mara_modulo`](prompts/current/characters/character_mara_modulo.md) — 5 job(s)
- [`character_black_ice_fox`](prompts/current/characters/character_black_ice_fox.md) — 5 job(s)

### Orbital Lift

- [`orbital_lift_tiles`](prompts/current/worlds/orbital_lift_tiles.md) — 7 job(s)
- [`orbital_lift_parallax`](prompts/current/worlds/orbital_lift_parallax.md) — 3 job(s)
- [`enemy_customs_lancer`](prompts/current/enemies/enemy_customs_lancer.md) — 7 job(s)
- [`enemy_manifest_monk`](prompts/current/enemies/enemy_manifest_monk.md) — 7 job(s)
- [`boss_boss_elevator_angel_counterweight`](prompts/current/bosses/boss_boss_elevator_angel_counterweight.md) — 11 job(s)
- [`character_murr_murrby`](prompts/current/characters/character_murr_murrby.md) — 5 job(s)
- [`character_elevator_angel`](prompts/current/characters/character_elevator_angel.md) — 5 job(s)

### Asteroid Redoubt

- [`asteroid_redoubt_tiles`](prompts/current/worlds/asteroid_redoubt_tiles.md) — 7 job(s)
- [`asteroid_redoubt_parallax`](prompts/current/worlds/asteroid_redoubt_parallax.md) — 3 job(s)
- [`enemy_vane_air_bailiff`](prompts/current/enemies/enemy_vane_air_bailiff.md) — 7 job(s)
- [`enemy_command_lock_partisan`](prompts/current/enemies/enemy_command_lock_partisan.md) — 7 job(s)
- [`boss_boss_director_vane_skylock`](prompts/current/bosses/boss_boss_director_vane_skylock.md) — 11 job(s)
- [`character_director_vane`](prompts/current/characters/character_director_vane.md) — 5 job(s)
- [`character_command_lock_faction`](prompts/current/characters/character_command_lock_faction.md) — 5 job(s)

## Priority 2 — Full-scope expansions

### Lower Sprawl

- [`lower_sprawl_full_tiles`](prompts/expansion/worlds/lower_sprawl_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_bailiff_scooter`](prompts/expansion/enemies/lower_sprawl/enemy_bailiff_scooter.md)
- [`enemy_signboard_sniper`](prompts/expansion/enemies/lower_sprawl/enemy_signboard_sniper.md)
- [`enemy_debt_printer_imp`](prompts/expansion/enemies/lower_sprawl/enemy_debt_printer_imp.md)
- [`enemy_fuse_monk`](prompts/expansion/enemies/lower_sprawl/enemy_fuse_monk.md)
- [`enemy_drone_kennel_master`](prompts/expansion/enemies/lower_sprawl/enemy_drone_kennel_master.md)
- [`enemy_toll_rat`](prompts/expansion/enemies/lower_sprawl/enemy_toll_rat.md)
- [`enemy_cable_crawler`](prompts/expansion/enemies/lower_sprawl/enemy_cable_crawler.md)

### Drainmarket

- [`drainmarket_full_tiles`](prompts/expansion/worlds/drainmarket_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_syringe_skater`](prompts/expansion/enemies/drainmarket/enemy_syringe_skater.md)
- [`enemy_invoice_leech`](prompts/expansion/enemies/drainmarket/enemy_invoice_leech.md)
- [`enemy_triage_turret`](prompts/expansion/enemies/drainmarket/enemy_triage_turret.md)
- [`enemy_rubber_glove_wraith`](prompts/expansion/enemies/drainmarket/enemy_rubber_glove_wraith.md)

### Chrome Arcology

- [`chrome_arcology_full_tiles`](prompts/expansion/worlds/chrome_arcology_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_glass_intern`](prompts/expansion/enemies/chrome_arcology/enemy_glass_intern.md)
- [`enemy_reception_lancer`](prompts/expansion/enemies/chrome_arcology/enemy_reception_lancer.md)
- [`enemy_holo_gardener`](prompts/expansion/enemies/chrome_arcology/enemy_holo_gardener.md)
- [`enemy_contract_lawyer_bot`](prompts/expansion/enemies/chrome_arcology/enemy_contract_lawyer_bot.md)
- [`enemy_panic_siren`](prompts/expansion/enemies/chrome_arcology/enemy_panic_siren.md)
- [`enemy_glass_janitor`](prompts/expansion/enemies/chrome_arcology/enemy_glass_janitor.md)
- [`enemy_drone_wasp_queen`](prompts/expansion/enemies/chrome_arcology/enemy_drone_wasp_queen.md)

### Straylight Mirage

- [`straylight_mirage_full_tiles`](prompts/expansion/worlds/straylight_mirage_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_reflection_hound`](prompts/expansion/enemies/straylight_mirage/enemy_reflection_hound.md)
- [`enemy_prism_duelist`](prompts/expansion/enemies/straylight_mirage/enemy_prism_duelist.md)
- [`enemy_etiquette_blade`](prompts/expansion/enemies/straylight_mirage/enemy_etiquette_blade.md)
- [`enemy_debt_harpist`](prompts/expansion/enemies/straylight_mirage/enemy_debt_harpist.md)
- [`enemy_vacuum_porter`](prompts/expansion/enemies/straylight_mirage/enemy_vacuum_porter.md)
- [`enemy_window_saint`](prompts/expansion/enemies/straylight_mirage/enemy_window_saint.md)
- [`enemy_mirror_guard_pair`](prompts/expansion/enemies/straylight_mirage/enemy_mirror_guard_pair.md)

### Dub Colony

- [`dub_colony_full_tiles`](prompts/expansion/worlds/dub_colony_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_bass_beetle`](prompts/expansion/enemies/dub_colony/enemy_bass_beetle.md)
- [`enemy_echo_drummer`](prompts/expansion/enemies/dub_colony/enemy_echo_drummer.md)
- [`enemy_feedback_cobra`](prompts/expansion/enemies/dub_colony/enemy_feedback_cobra.md)
- [`enemy_tape_priestess`](prompts/expansion/enemies/dub_colony/enemy_tape_priestess.md)
- [`enemy_mold_angel`](prompts/expansion/enemies/dub_colony/enemy_mold_angel.md)
- [`enemy_amp_golem`](prompts/expansion/enemies/dub_colony/enemy_amp_golem.md)
- [`enemy_static_choir`](prompts/expansion/enemies/dub_colony/enemy_static_choir.md)
- [`enemy_rival_selector`](prompts/expansion/enemies/dub_colony/enemy_rival_selector.md)

### Antenna Barrens

- [`antenna_barrens_full_tiles`](prompts/expansion/worlds/antenna_barrens_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_spark_jackal`](prompts/expansion/enemies/antenna_barrens/enemy_spark_jackal.md)
- [`enemy_wire_witch`](prompts/expansion/enemies/antenna_barrens/enemy_wire_witch.md)
- [`enemy_dish_climber`](prompts/expansion/enemies/antenna_barrens/enemy_dish_climber.md)
- [`enemy_regex_fox`](prompts/expansion/enemies/antenna_barrens/enemy_regex_fox.md)
- [`enemy_packet_butcher`](prompts/expansion/enemies/antenna_barrens/enemy_packet_butcher.md)
- [`enemy_null_monk`](prompts/expansion/enemies/antenna_barrens/enemy_null_monk.md)
- [`enemy_signal_leech`](prompts/expansion/enemies/antenna_barrens/enemy_signal_leech.md)

### Orbital Lift

- [`orbital_lift_full_tiles`](prompts/expansion/worlds/orbital_lift_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_strap_hook_twin`](prompts/expansion/enemies/orbital_lift/enemy_strap_hook_twin.md)
- [`enemy_stamp_golem`](prompts/expansion/enemies/orbital_lift/enemy_stamp_golem.md)
- [`enemy_sniffer_cherub`](prompts/expansion/enemies/orbital_lift/enemy_sniffer_cherub.md)
- [`enemy_gravity_customs`](prompts/expansion/enemies/orbital_lift/enemy_gravity_customs.md)
- [`enemy_wind_lancer`](prompts/expansion/enemies/orbital_lift/enemy_wind_lancer.md)
- [`enemy_maintenance_choir`](prompts/expansion/enemies/orbital_lift/enemy_maintenance_choir.md)
- [`enemy_debt_paladin`](prompts/expansion/enemies/orbital_lift/enemy_debt_paladin.md)

### Asteroid Redoubt

- [`asteroid_redoubt_full_tiles`](prompts/expansion/worlds/asteroid_redoubt_full_tiles.md) — stage-capable geometry, hazards, interactives and decor
- [`enemy_rock_mite`](prompts/expansion/enemies/asteroid_redoubt/enemy_rock_mite.md)
- [`enemy_drill_hermit`](prompts/expansion/enemies/asteroid_redoubt/enemy_drill_hermit.md)
- [`enemy_airlock_nun`](prompts/expansion/enemies/asteroid_redoubt/enemy_airlock_nun.md)
- [`enemy_hull_spider`](prompts/expansion/enemies/asteroid_redoubt/enemy_hull_spider.md)
- [`enemy_oxygen_clerk`](prompts/expansion/enemies/asteroid_redoubt/enemy_oxygen_clerk.md)
- [`enemy_ammunition_ghost`](prompts/expansion/enemies/asteroid_redoubt/enemy_ammunition_ghost.md)
- [`enemy_traitor_mask`](prompts/expansion/enemies/asteroid_redoubt/enemy_traitor_mask.md)
- [`enemy_riot_drone_choir`](prompts/expansion/enemies/asteroid_redoubt/enemy_riot_drone_choir.md)
- [`enemy_clause_serpent`](prompts/expansion/enemies/asteroid_redoubt/enemy_clause_serpent.md)
- [`enemy_archive_twin`](prompts/expansion/enemies/asteroid_redoubt/enemy_archive_twin.md)
- [`enemy_redaction_nun`](prompts/expansion/enemies/asteroid_redoubt/enemy_redaction_nun.md)
- [`enemy_star_lancer`](prompts/expansion/enemies/asteroid_redoubt/enemy_star_lancer.md)
- [`enemy_angel_fragment`](prompts/expansion/enemies/asteroid_redoubt/enemy_angel_fragment.md)
- [`enemy_fox_fragment`](prompts/expansion/enemies/asteroid_redoubt/enemy_fox_fragment.md)

## Cross-world expansions

- [`moss_locomotion_and_stealth`](prompts/expansion/player/locomotion_and_stealth.md) — 8 job(s)
- [`moss_claw_mastery`](prompts/expansion/player/claw_mastery.md) — 6 job(s)
- [`moss_blade_styles`](prompts/expansion/player/blade_styles.md) — 7 job(s)
- [`moss_gun_styles`](prompts/expansion/player/gun_styles.md) — 6 job(s)
- [`moss_hacking_and_interaction`](prompts/expansion/player/hacking_and_interaction.md) — 7 job(s)
- [`combat_weapon_pickups_and_icons`](prompts/expansion/items/combat_weapon_pickups_and_icons.md) — 4 job(s)
- [`hud_core_elements`](prompts/expansion/ui/hud_core_elements.md) — 1 job(s)

## Priority 3 — Audited remaining gaps

### Moss Missing Actions — 18 jobs

- [`moss_remaining_animation_gaps`](prompts/expansion/gaps/player/moss_remaining_animation_gaps.md) — 18 job(s)

### Regular-Enemy Awareness And Recovery States — 64 jobs

- [`enemy_chrome_bellhop_state_extension`](prompts/expansion/gaps/enemies/enemy_chrome_bellhop_state_extension.md) — 4 job(s)
- [`enemy_clinic_repo_state_extension`](prompts/expansion/gaps/enemies/enemy_clinic_repo_state_extension.md) — 4 job(s)
- [`enemy_command_lock_partisan_state_extension`](prompts/expansion/gaps/enemies/enemy_command_lock_partisan_state_extension.md) — 4 job(s)
- [`enemy_contract_servitor_state_extension`](prompts/expansion/gaps/enemies/enemy_contract_servitor_state_extension.md) — 4 job(s)
- [`enemy_customs_lancer_state_extension`](prompts/expansion/gaps/enemies/enemy_customs_lancer_state_extension.md) — 4 job(s)
- [`enemy_debt_wraith_state_extension`](prompts/expansion/gaps/enemies/enemy_debt_wraith_state_extension.md) — 4 job(s)
- [`enemy_error_mite_state_extension`](prompts/expansion/gaps/enemies/enemy_error_mite_state_extension.md) — 4 job(s)
- [`enemy_feedback_guard_state_extension`](prompts/expansion/gaps/enemies/enemy_feedback_guard_state_extension.md) — 4 job(s)
- [`enemy_knife_drone_state_extension`](prompts/expansion/gaps/enemies/enemy_knife_drone_state_extension.md) — 4 job(s)
- [`enemy_manifest_monk_state_extension`](prompts/expansion/gaps/enemies/enemy_manifest_monk_state_extension.md) — 4 job(s)
- [`enemy_masque_duelist_state_extension`](prompts/expansion/gaps/enemies/enemy_masque_duelist_state_extension.md) — 4 job(s)
- [`enemy_mirror_sentinel_state_extension`](prompts/expansion/gaps/enemies/enemy_mirror_sentinel_state_extension.md) — 4 job(s)
- [`enemy_rent_cop_piker_state_extension`](prompts/expansion/gaps/enemies/enemy_rent_cop_piker_state_extension.md) — 4 job(s)
- [`enemy_signal_jammer_bat_state_extension`](prompts/expansion/gaps/enemies/enemy_signal_jammer_bat_state_extension.md) — 4 job(s)
- [`enemy_turnstile_mite_state_extension`](prompts/expansion/gaps/enemies/enemy_turnstile_mite_state_extension.md) — 4 job(s)
- [`enemy_vane_air_bailiff_state_extension`](prompts/expansion/gaps/enemies/enemy_vane_air_bailiff_state_extension.md) — 4 job(s)

### Npc And Companion Locomotion/Reaction States — 80 jobs

- [`character_auntie_subharmonic_state_extension`](prompts/expansion/gaps/characters/character_auntie_subharmonic_state_extension.md) — 4 job(s)
- [`character_black_ice_fox_state_extension`](prompts/expansion/gaps/characters/character_black_ice_fox_state_extension.md) — 4 job(s)
- [`character_cobalt_carmine_state_extension`](prompts/expansion/gaps/characters/character_cobalt_carmine_state_extension.md) — 4 job(s)
- [`character_command_lock_faction_state_extension`](prompts/expansion/gaps/characters/character_command_lock_faction_state_extension.md) — 4 job(s)
- [`character_director_vane_state_extension`](prompts/expansion/gaps/characters/character_director_vane_state_extension.md) — 4 job(s)
- [`character_dj_calculus_state_extension`](prompts/expansion/gaps/characters/character_dj_calculus_state_extension.md) — 4 job(s)
- [`character_dr_mina_suture_state_extension`](prompts/expansion/gaps/characters/character_dr_mina_suture_state_extension.md) — 4 job(s)
- [`character_elevator_angel_state_extension`](prompts/expansion/gaps/characters/character_elevator_angel_state_extension.md) — 4 job(s)
- [`character_foreman_pell_state_extension`](prompts/expansion/gaps/characters/character_foreman_pell_state_extension.md) — 4 job(s)
- [`character_juno_jar_state_extension`](prompts/expansion/gaps/characters/character_juno_jar_state_extension.md) — 4 job(s)
- [`character_king_feedback_state_extension`](prompts/expansion/gaps/characters/character_king_feedback_state_extension.md) — 4 job(s)
- [`character_lio_state_extension`](prompts/expansion/gaps/characters/character_lio_state_extension.md) — 4 job(s)
- [`character_little_ix_state_extension`](prompts/expansion/gaps/characters/character_little_ix_state_extension.md) — 4 job(s)
- [`character_madame_vitrine_state_extension`](prompts/expansion/gaps/characters/character_madame_vitrine_state_extension.md) — 4 job(s)
- [`character_mara_modulo_state_extension`](prompts/expansion/gaps/characters/character_mara_modulo_state_extension.md) — 4 job(s)
- [`character_murr_murrby_state_extension`](prompts/expansion/gaps/characters/character_murr_murrby_state_extension.md) — 4 job(s)
- [`character_naya_root_state_extension`](prompts/expansion/gaps/characters/character_naya_root_state_extension.md) — 4 job(s)
- [`character_reflection_judge_state_extension`](prompts/expansion/gaps/characters/character_reflection_judge_state_extension.md) — 4 job(s)
- [`character_rook_null_state_extension`](prompts/expansion/gaps/characters/character_rook_null_state_extension.md) — 4 job(s)
- [`character_sister_version_state_extension`](prompts/expansion/gaps/characters/character_sister_version_state_extension.md) — 4 job(s)

### Named Boss Attacks And Mechanics — 24 jobs

- [`boss_boss_captain_grin_tollmech_action_variants`](prompts/expansion/gaps/bosses/boss_boss_captain_grin_tollmech_action_variants.md) — 3 job(s)
- [`boss_boss_knife_drone_nest_action_variants`](prompts/expansion/gaps/bosses/boss_boss_knife_drone_nest_action_variants.md) — 3 job(s)
- [`boss_boss_madame_vitrine_glasscourt_action_variants`](prompts/expansion/gaps/bosses/boss_boss_madame_vitrine_glasscourt_action_variants.md) — 3 job(s)
- [`boss_boss_reflection_judge_court_action_variants`](prompts/expansion/gaps/bosses/boss_boss_reflection_judge_court_action_variants.md) — 3 job(s)
- [`boss_boss_king_feedback_ampthrone_action_variants`](prompts/expansion/gaps/bosses/boss_boss_king_feedback_ampthrone_action_variants.md) — 3 job(s)
- [`boss_boss_black_ice_fox_node_action_variants`](prompts/expansion/gaps/bosses/boss_boss_black_ice_fox_node_action_variants.md) — 3 job(s)
- [`boss_boss_elevator_angel_counterweight_action_variants`](prompts/expansion/gaps/bosses/boss_boss_elevator_angel_counterweight_action_variants.md) — 3 job(s)
- [`boss_boss_director_vane_skylock_action_variants`](prompts/expansion/gaps/bosses/boss_boss_director_vane_skylock_action_variants.md) — 3 job(s)

### Gameplay-Specific Animated Tiles And Props — 48 jobs

- [`lower_sprawl_gameplay_tiles`](prompts/expansion/gaps/worlds/lower_sprawl_gameplay_tiles.md) — 6 job(s)
- [`drainmarket_gameplay_tiles`](prompts/expansion/gaps/worlds/drainmarket_gameplay_tiles.md) — 6 job(s)
- [`chrome_arcology_gameplay_tiles`](prompts/expansion/gaps/worlds/chrome_arcology_gameplay_tiles.md) — 6 job(s)
- [`straylight_mirage_gameplay_tiles`](prompts/expansion/gaps/worlds/straylight_mirage_gameplay_tiles.md) — 6 job(s)
- [`dub_colony_gameplay_tiles`](prompts/expansion/gaps/worlds/dub_colony_gameplay_tiles.md) — 6 job(s)
- [`antenna_barrens_gameplay_tiles`](prompts/expansion/gaps/worlds/antenna_barrens_gameplay_tiles.md) — 6 job(s)
- [`orbital_lift_gameplay_tiles`](prompts/expansion/gaps/worlds/orbital_lift_gameplay_tiles.md) — 6 job(s)
- [`asteroid_redoubt_gameplay_tiles`](prompts/expansion/gaps/worlds/asteroid_redoubt_gameplay_tiles.md) — 6 job(s)

### Missing Combat, Traversal, Boss, Enemy And Environment Effects — 32 jobs

- [`remaining_vfx_gaps`](prompts/expansion/gaps/vfx/remaining_vfx_gaps.md) — 32 job(s)
