# Approved Sprite Style Target

The six operator-supplied neon-animal renders from **2026-07-21** have been re-identified as the production taste target. They show different animal characters, poses and equipment; they define rendering language rather than identities to copy. Because the original chat attachments are not yet committed as repository files, every job also names checked-in Moss continuity references.

```yaml
style_target:
  reference: "operator-approved six-image neon-animal pixel-art board, supplied 2026-07-21"
  images:
    - "assets/sprites/moss_badger_production.png"
    - "generated/sprite-visual-review/badger-sprite-contact-sheet.png"
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

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.

## Practical rendering rule

Attach the approved six-image board plus the listed repository-backed continuity references to character, enemy, boss, item, VFX, and UI render requests. For world art, use the board only when useful for palette and pixel-cluster discipline, and explicitly tell the model to render environments rather than animal characters. Import the six source images into a versioned repository reference directory when their original files are available; do not replace the real paths with an opaque attachment-only label.
