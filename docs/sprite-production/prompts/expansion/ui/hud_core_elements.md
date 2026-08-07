# HUD Core Elements

```text
Create a production-ready pixel-art render job for Badger Sprawl Runner.

Render job: hud_core_elements
Grid: 4 columns by 4 rows
Cell size: 32x32 pixels
Output size: 128x128 pixels
Background: transparent

When the operator-approved six-image neon-animal board is attached, use it as the primary visual-language reference. Use the repository-backed images listed in the job metadata as continuity references: the Moss production atlas for identity, scale, costume and anchor continuity, and the sprite review contact sheet for broader motion and pixel-cluster continuity. Render crisp hand-placed 16-bit console pixel art with hard square pixels, chunky readable clusters, dark navy or near-black outlines, strongly separated light and shadow masses, and saturated selective neon accents in cyan, violet, magenta, acid green, hot red, and orange. Select only two or three dominant accent hues for one asset rather than using the entire neon range. Keep silhouettes instantly readable, faces expressive, anatomy coherent, secondary cloth/fur motion lively, and VFX compact. No smooth gradients, no painterly blur, no anti-aliasing, no vector-clean curves, no fake 3D render, and no verbatim copied frame from either reference image.
Output exactly one PNG. Cells must be equal-sized and perfectly aligned, with no gutters, margins, border, labels, captions, text, checkerboard, guide lines, or merged cells. Read cells left-to-right, then top-to-bottom.

HUD cell order:
1. health claw pip full
2. health claw pip empty
3. rally-health overlay
4. rocket fuel full
5. rocket fuel empty
6. rail reload ring
7. perfect reload marker
8. heat low
9. heat high
10. hack charge
11. trace warning
12. parry ready
13. companion ready
14. story payload
15. shop discount
16. objective marker

Render a coherent compact HUD glyph family using dark outlines, one bright state color, and clear filled/empty distinction. Transparent cells, no letters, numbers, or readable words. The icons must work over both dark and bright gameplay backgrounds.
Do not add logos, readable text, watermarks, scenery behind transparent sprites, duplicate limbs, cropped ears, cropped tails, inconsistent weapons, perspective changes, sub-pixel blur, semi-transparent matte fringes, or unrequested cast shadows outside the frame.
```
