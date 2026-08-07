# Sprite Render Review Checklist

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
