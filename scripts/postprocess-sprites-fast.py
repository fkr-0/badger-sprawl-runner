#!/usr/bin/env python3
"""Fast background removal for AI-generated sprites.

Two strategies:
1. ComfyUI pattern: semi-transparent white (alpha~130) at corners
2. Opaque pattern: white/light background filling entire image
"""
import numpy as np
from PIL import Image
import sys
from pathlib import Path
from scipy import ndimage
from scipy.ndimage import binary_dilation, binary_fill_holes

PROJECT_ROOT = Path(__file__).parent.parent
SPRITE_DIR = PROJECT_ROOT / 'apps' / 'runner' / 'public' / 'assets' / 'sprites'

DIRS = ['characters', 'enemies', 'bosses', 'worlds']
ROOT_FILES = [
    'moss_badger.png', 'items_core.png', 'item_icons.png',
    'vfx_combat.png', 'lower_sprawl_tiles.png',
]


def remove_bg(img):
    arr = np.array(img).astype(np.float32)
    h, w = arr.shape[:2]
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3]
    brightness = rgb.mean(axis=2)
    
    # Detect pattern type from corners
    corners = [alpha[0,0], alpha[0,-1], alpha[-1,0], alpha[-1,-1]]
    comfyui_pattern = any(100 <= a <= 160 for a in corners)
    opaque = alpha.min() > 200
    
    if comfyui_pattern:
        # Strategy: white-ish + reduced alpha = background
        # Vectorized flood fill using morphological operations
        white_bg = (brightness > 180) & (alpha < 220)
        very_white = brightness > 245
        reduced_alpha = alpha < 240
        bg_mask = white_bg | (very_white & reduced_alpha)
        
        # Propagate from corners using iterative dilation (fast with scipy)
        corner_mask = np.zeros((h, w), dtype=bool)
        for r, c in [(0,0), (0,w-1), (h-1,0), (h-1,w-1)]:
            if 100 <= alpha[r,c] <= 160:
                corner_mask[r, c] = True
        
        # Iteratively expand from corners into bg_mask
        for _ in range(max(h, w) // 2):
            expanded = binary_dilation(corner_mask, iterations=1)
            new = expanded & ~corner_mask & bg_mask
            if not new.any():
                break
            corner_mask |= new
        
        arr[corner_mask, 3] = 0
        
        # Clean edge pixels near transparent areas
        transparent = arr[:, :, 3] == 0
        dilated = binary_dilation(transparent, iterations=3)
        edge_zone = dilated & ~transparent
        if edge_zone.any():
            edge_bright = brightness[edge_zone]
            edge_alpha = alpha[edge_zone]
            cleanup = edge_bright > 180
            edge_idx = np.where(edge_zone)
            arr[edge_idx[0][cleanup], edge_idx[1][cleanup], 3] = 0
    
    elif opaque:
        # Strategy: detect background color from edges, flood fill
        edge_px = np.concatenate([rgb[0,:], rgb[-1,:], rgb[:,0], rgb[:,-1]], axis=0)
        q = (edge_px / 32).astype(np.uint8)
        from collections import Counter
        bg_q = np.array(Counter([tuple(c) for c in q]).most_common(1)[0][0]) * 32
        diff = np.abs(rgb - bg_q).max(axis=2)
        bg_mask = diff < 50
        
        # Keep only large connected components
        content = ~bg_mask
        labeled, n = ndimage.label(content)
        if n > 0:
            sizes = ndimage.sum(content, labeled, range(1, n+1))
            min_size = h * w * 0.001
            for i, s in enumerate(sizes):
                if s < min_size:
                    bg_mask[labeled == (i+1)] = True
        
        arr[bg_mask, 3] = 0
        
        # Edge cleanup
        transparent = arr[:, :, 3] == 0
        dilated = binary_dilation(transparent, iterations=2)
        edge_zone = dilated & transparent
        # Already transparent, skip
    
    # Final: remove isolated alpha specks
    alpha_final = arr[:, :, 3]
    # Erode then dilate to remove noise
    alpha_mask = alpha_final > 0
    cleaned = ndimage.binary_opening(alpha_mask, iterations=1)
    arr[~cleaned, 3] = 0
    
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')


def process(fp, dry_run=False):
    img = Image.open(fp).convert('RGBA')
    a = np.array(img)[:,:,3]
    corners = [a[0,0], a[0,-1], a[-1,0], a[-1,-1]]
    needs = any(100 <= x <= 160 for x in corners) or a.min() > 200
    if not needs:
        return False
    if dry_run:
        return True
    result = remove_bg(img)
    result.save(fp)
    return True


def main():
    dry_run = '--dry-run' in sys.argv
    count = 0
    for fn in ROOT_FILES:
        fp = SPRITE_DIR / fn
        if fp.exists() and process(fp, dry_run):
            print(f"  {'[DRY] ' if dry_run else ''}{fn}")
            count += 1
    for d in DIRS:
        dp = SPRITE_DIR / d
        if not dp.exists(): continue
        for f in sorted(dp.glob('*.png')):
            if process(f, dry_run):
                print(f"  {'[DRY] ' if dry_run else ''}{d}/{f.name}")
                count += 1
    print(f"\nTotal: {count}")


if __name__ == '__main__':
    main()
