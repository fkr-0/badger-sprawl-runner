#!/usr/bin/env python3
"""
Generate anchor reference images for GIMP.
Creates PNG files with anchor crosshairs overlaid on placeholder grids.
"""
from PIL import Image, ImageDraw
import json, os

OUT_DIR = 'gimp-anchor-refs'
os.makedirs(OUT_DIR, exist_ok=True)

manifest = json.load(open('data/sprites.json'))

# Build anchor templates by frame size
templates = {}
for s in manifest['sheets']:
    fw, fh = s['frameSize']
    anims = s.get('animations', {})
    first_anim = list(anims.values())[0] if anims else None
    anchor = list(first_anim['anchor']) if first_anim and 'anchor' in first_anim else [fw//2, fh-4]
    key = (fw, fh, tuple(anchor))
    if key not in templates:
        templates[key] = {'fw': fw, 'fh': fh, 'anchor': anchor, 'sheets': []}
    templates[key]['sheets'].append(s['id'])

# Generate reference images
for (fw, fh, anc), info in templates.items():
    anchor = info['anchor']
    # Create 4x4 grid reference
    cols, rows = 4, 4
    pad = 2
    grid_w = cols * (fw + pad) - pad
    grid_h = rows * (fh + pad) - pad
    
    img = Image.new('RGBA', (grid_w, grid_h), (30, 30, 40, 255))
    draw = ImageDraw.Draw(img)
    
    for r in range(rows):
        for c in range(cols):
            x = c * (fw + pad)
            y = r * (fh + pad)
            # Cell background
            draw.rectangle([x, y, x+fw-1, y+fh-1], fill=(50, 55, 65, 255), outline=(80, 85, 95, 255))
            # Anchor crosshair
            ax, ay = x + anchor[0], y + anchor[1]
            cross_size = min(fw, fh) // 4
            draw.line([ax-cross_size, ay, ax+cross_size, ay], fill=(255, 80, 80, 200), width=1)
            draw.line([ax, ay-cross_size, ax, ay+cross_size], fill=(255, 80, 80, 200), width=1)
            # Anchor dot
            draw.ellipse([ax-2, ay-2, ax+2, ay+2], fill=(255, 80, 80, 255))
    
    # Add label
    label = f'{fw}x{fh} anchor={anchor}'
    draw.text((4, 4), label, fill=(255, 255, 255, 200))
    
    fname = f'{OUT_DIR}/anchor_ref_{fw}x{fh}_ax{anchor[0]}_ay{anchor[1]}.png'
    img.save(fname)
    print(f'Created {fname} for {len(info["sheets"])} sheets')

# Generate per-sprite reference sheets
for s in manifest['sheets']:
    fw, fh = s['frameSize']
    anims = s.get('animations', {})
    first_anim = list(anims.values())[0] if anims else None
    anchor = list(first_anim['anchor']) if first_anim and 'anchor' in first_anim else [fw//2, fh-4]
    
    # Calculate grid for this sheet
    max_frames = max((a.get('frames', 1) for a in anims.values()), default=1)
    num_anims = len(anims)
    if s.get('grid'):
        cols = s['grid'].get('columns', max_frames)
        rows = s['grid'].get('rows', num_anims)
    else:
        cols = max_frames
        rows = num_anims
    
    if cols < 1 or rows < 1:
        continue
        
    pad = 1
    grid_w = cols * (fw + pad) - pad
    grid_h = rows * (fh + pad) - pad
    
    img = Image.new('RGBA', (grid_w, grid_h), (30, 30, 40, 255))
    draw = ImageDraw.Draw(img)
    
    for r in range(rows):
        for c in range(cols):
            x = c * (fw + pad)
            y = r * (fh + pad)
            draw.rectangle([x, y, x+fw-1, y+fh-1], fill=(50, 55, 65, 255), outline=(80, 85, 95, 255))
            ax, ay = x + anchor[0], y + anchor[1]
            cross_size = min(fw, fh) // 4
            draw.line([ax-cross_size, ay, ax+cross_size, ay], fill=(255, 80, 80, 200), width=1)
            draw.line([ax, ay-cross_size, ax, ay+cross_size], fill=(255, 80, 80, 200), width=1)
            draw.ellipse([ax-2, ay-2, ax+2, ay+2], fill=(255, 80, 80, 255))
    
    fname = f'{OUT_DIR}/{s["id"]}_anchor.png'
    img.save(fname)

print(f'\nDone. Generated {len(os.listdir(OUT_DIR))} files in {OUT_DIR}/')
print('Open these in GIMP as layers to see anchor overlays.')
