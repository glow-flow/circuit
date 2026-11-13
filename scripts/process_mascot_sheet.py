"""
Watt Mascot Sprite Sheet Extractor & Alpha-Matting Pipeline (`process_mascot_sheet.py`).

Slices the 4x2 CFL Tube Bulb character sheet into 8 individual transparent RGBA PNG
assets inside `public/assets/mascot/` using:
1. 4-connected exterior BFS flood-fill against the sampled warm-cream backdrop.
2. Chromatic & spatial enclosed-hole extraction (removes enclosed armpit triangles,
   leg-arch cream gaps, and the vertical U-tube cutout while strictly protecting
   white eyes, specular glass highlights, shirt collar, and sleeve cuffs).
3. Border-adjacent alpha feathering with color decontamination.
4. LANCZOS downsampling onto uniform 240x240 transparent PNG sprites.

Time Complexity: O(W * H) across the sprite sheet dimensions.
"""

import os
from collections import deque
from typing import Dict, List, Tuple
from PIL import Image

DEFAULT_SHEET_PATH = (
    r"C:\Users\ASUS\.gemini\antigravity\brain\2a1e01f4-f36a-4989-83a6-73be896936a3"
    r"\.user_uploaded\media_1794562834524_620669e6.jpg"
)
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "public", "assets", "mascot"
)

# Exact grid cell layout mapped from the 4x2 character sheet (1024x571)
X_BOUNDS: List[int] = [0, 282, 520, 757, 1024]
Y_BOUNDS: List[int] = [0, 294, 571]

POSE_GRID: List[List[str]] = [
    ["celebrate", "proud", "bored", "confused"],
    ["love", "dance", "angry", "sad"],
]


def color_distance_sq(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> int:
    """Computes squared Euclidean distance in RGB space. O(1)."""
    return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2


def is_neutral_cream_bg(
    rgb: Tuple[int, int, int], bg_rgb: Tuple[int, int, int], max_dist_sq: int = 1100
) -> bool:
    """Identifies pixels matching the warm-cream sheet background. O(1)."""
    return color_distance_sq(rgb, bg_rgb) <= max_dist_sq


def mark_enclosed_cream_holes(
    src_px: object,
    w: int,
    h: int,
    bg_rgb: Tuple[int, int, int],
    bg_mask: bytearray,
) -> None:
    """
    Finds enclosed background regions (e.g. armpit triangles, under-shoe arches,
    and center U-tube gap) and merges them into `bg_mask` while preserving white eyes,
    cool-blue glass surfaces, shirt collar, and sleeve cuffs.

    Time Complexity: O(w * h).
    """
    visited = bytearray(w * h)

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if bg_mask[idx] or visited[idx]:
                continue

            rgb = src_px[x, y]  # type: ignore[index]
            if color_distance_sq(rgb, bg_rgb) > 450:
                continue

            # Flood connected bright-warm region inside silhouette
            queue: deque[Tuple[int, int]] = deque([(x, y)])
            visited[idx] = 1
            pts: List[Tuple[int, int]] = []

            while queue:
                cx, cy = queue.popleft()
                pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        n_idx = ny * w + nx
                        if not bg_mask[n_idx] and not visited[n_idx]:
                            n_rgb = src_px[nx, ny]  # type: ignore[index]
                            if color_distance_sq(n_rgb, bg_rgb) <= 550:
                                visited[n_idx] = 1
                                queue.append((nx, ny))

            if len(pts) < 12:
                continue

            n_pts = len(pts)
            avg_r = sum(src_px[px_x, px_y][0] for px_x, px_y in pts) / n_pts  # type: ignore[index]
            avg_g = sum(src_px[px_x, px_y][1] for px_x, px_y in pts) / n_pts  # type: ignore[index]
            avg_b = sum(src_px[px_x, px_y][2] for px_x, px_y in pts) / n_pts  # type: ignore[index]
            min_x = min(px_x for px_x, _ in pts)
            max_x = max(px_x for px_x, _ in pts)
            min_y = min(px_y for _, px_y in pts)
            max_y = max(px_y for _, px_y in pts)
            comp_w = max_x - min_x + 1
            comp_h = max_y - min_y + 1
            cx_norm = (sum(px_x for px_x, _ in pts) / n_pts) / max(1, w)
            cy_norm = (sum(px_y for _, px_y in pts) / n_pts) / max(1, h)
            warm_bias = avg_r - avg_b
            pink_tint = avg_r - avg_g
            bg_dist = color_distance_sq((int(round(avg_r)), int(round(avg_g)), int(round(avg_b))), bg_rgb) ** 0.5

            # Strict protection: cool-blue glass tubes have warm_bias <= 0; eyes have warm_bias < 2.2;
            # blushing eye highlights are pinkish (pink_tint >= 4.0) vs neutral warm cream (pink_tint <= 3.2)
            if warm_bias < 3.4 or pink_tint >= 3.5:
                continue

            is_outer_armpit = (cx_norm < 0.32 or cx_norm > 0.62) and 0.45 <= cy_norm <= 0.80
            is_leg_gap = cy_norm >= 0.82
            is_tube_vertical_slot = cy_norm <= 0.48 and comp_h >= comp_w * 3 and avg_r >= 246.0 and bg_dist <= 10.0

            if is_outer_armpit or is_leg_gap or is_tube_vertical_slot:
                for px_x, px_y in pts:
                    bg_mask[px_y * w + px_x] = 1


def extract_mascot_sprite(
    cell_img: Image.Image,
    target_height: int = 240,
    padding_px: int = 10,
) -> Image.Image:
    """
    Isolates one mascot pose onto a clean 240x240 transparent PNG canvas.
    Time Complexity: O(w * h).
    """
    rgb_img = cell_img.convert("RGB")
    w, h = rgb_img.size
    src_px = rgb_img.load()

    bg_rgb = src_px[2, 2]
    bg_mask = bytearray(w * h)
    queue: deque[Tuple[int, int]] = deque()

    def seed_if_bg(x: int, y: int) -> None:
        idx = y * w + x
        if not bg_mask[idx] and is_neutral_cream_bg(src_px[x, y], bg_rgb, 1100):
            bg_mask[idx] = 1
            queue.append((x, y))

    for x in range(w):
        seed_if_bg(x, 0)
        seed_if_bg(x, h - 1)
    for y in range(h):
        seed_if_bg(0, y)
        seed_if_bg(w - 1, y)

    while queue:
        cx, cy = queue.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                n_idx = ny * w + nx
                if not bg_mask[n_idx]:
                    px_rgb = src_px[nx, ny]
                    r, g, b = px_rgb
                    chroma = max(r, g, b) - min(r, g, b)
                    # Strip flat light grey floor shadow under shoes cleanly while preserving black shoes
                    is_shadow_transition = (
                        chroma <= 18 and min(r, g, b) >= 145 and cy >= int(h * 0.72)
                    )
                    if is_neutral_cream_bg(px_rgb, bg_rgb, 1200) or is_shadow_transition:
                        bg_mask[n_idx] = 1
                        queue.append((nx, ny))

    # Second pass: remove enclosed cream pockets (armpit gaps, leg gaps, inner U-slot)
    mark_enclosed_cream_holes(src_px, w, h, bg_rgb, bg_mask)

    rgba_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_px = rgba_img.load()

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if bg_mask[idx]:
                continue

            r, g, b = src_px[x, y]
            bg_neighbors = 0
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and bg_mask[ny * w + nx]:
                    bg_neighbors += 1

            alpha = 255
            if bg_neighbors > 0:
                dist = (color_distance_sq((r, g, b), bg_rgb)) ** 0.5
                if dist < 24:
                    alpha = 0
                elif dist < 85:
                    t = (dist - 24.0) / (85.0 - 24.0)
                    alpha = max(0, min(255, int(255 * t)))
                    inv_t = max(0.35, t)
                    r = max(0, min(255, int((r - bg_rgb[0] * (1.0 - t)) / inv_t)))
                    g = max(0, min(255, int((g - bg_rgb[1] * (1.0 - t)) / inv_t)))
                    b = max(0, min(255, int((b - bg_rgb[2] * (1.0 - t)) / inv_t)))

            out_px[x, y] = (r, g, b, alpha)

    bbox = rgba_img.getbbox()
    if bbox:
        rgba_img = rgba_img.crop(bbox)

    cw, ch = rgba_img.size
    if ch > 0:
        scale = (target_height - padding_px * 2) / ch
        nw = max(1, int(round(cw * scale)))
        nh = max(1, int(round(ch * scale)))
        rgba_img = rgba_img.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (target_height, target_height), (0, 0, 0, 0))
    offset_x = (target_height - rgba_img.width) // 2
    offset_y = (target_height - rgba_img.height) // 2
    canvas.paste(rgba_img, (offset_x, offset_y), rgba_img)
    return canvas


def main() -> Dict[str, Tuple[int, int]]:
    """Slices all 8 mascot moods and writes optimized RGBA PNGs. O(W * H)."""
    if not os.path.exists(DEFAULT_SHEET_PATH):
        raise FileNotFoundError(f"Character sheet not found: {DEFAULT_SHEET_PATH}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    sheet = Image.open(DEFAULT_SHEET_PATH).convert("RGB")
    results: Dict[str, Tuple[int, int]] = {}

    for r_idx, row_names in enumerate(POSE_GRID):
        y0, y1 = Y_BOUNDS[r_idx], Y_BOUNDS[r_idx + 1]
        for c_idx, mood_name in enumerate(row_names):
            x0, x1 = X_BOUNDS[c_idx], X_BOUNDS[c_idx + 1]
            cell = sheet.crop((x0, y0, x1, y1))
            sprite = extract_mascot_sprite(cell, target_height=240, padding_px=10)
            out_path = os.path.join(OUTPUT_DIR, f"watt-{mood_name}.png")
            sprite.save(out_path, format="PNG", optimize=True)
            size_kb = os.path.getsize(out_path) / 1024.0
            results[mood_name] = sprite.size
            print(f"Saved {out_path} -> {sprite.size} ({size_kb:.1f} KB)")

    return results


if __name__ == "__main__":
    main()
