"""
Background Removal Automation Script for Circuit Sandbox.

Processes all component assets (Batteries, Battery Holder, Resistor, and all 7 Bulb types)
by automatically backing up original assets into `public/assets/originals/` and then
running an Exterior BFS Flood-Fill combined with a 5x5 Morphological Gradient boundary
detector to produce razor-sharp, anti-aliased RGBA PNGs with 100% transparent backgrounds.

Time Complexity: O(W * H) per image where W, H are image width and height.
"""

import os
import shutil
from collections import deque
from PIL import Image, ImageFilter

def remove_bg_smart(
    src_path: str,
    dst_path: str,
    grad_thresh: int = 30,
    val_stop: int = 210,
    is_solid_dark: bool = False,
) -> None:
    """
    Removes exterior background and diffuse outer halo using BFS flood-fill from image borders,
    stopping at the sharp physical contour of the component while preserving dark interiors
    (such as the black alkaline body of the 9V battery or the dark glass interior of bulbs).
    """
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    gray = im.convert("L")
    mx = gray.filter(ImageFilter.MaxFilter(5)).load()
    mn = gray.filter(ImageFilter.MinFilter(5)).load()
    px = im.load()

    visited = bytearray(w * h)
    q = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
        visited[x] = 1
        visited[(h - 1) * w + x] = 1
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
        visited[y * w] = 1
        visited[y * w + (w - 1)] = 1

    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if not visited[idx]:
                    r, g, b, _ = px[nx, ny]
                    val = max(r, g, b)
                    grad = mx[nx, ny] - mn[nx, ny]
                    if is_solid_dark:
                        can_pass = val <= 24
                    else:
                        can_pass = grad <= grad_thresh and val < val_stop
                    if can_pass:
                        visited[idx] = 1
                        q.append((nx, ny))

    alpha_im = Image.new("L", (w, h), 255)
    apx = alpha_im.load()
    for y in range(h):
        row_off = y * w
        for x in range(w):
            if visited[row_off + x]:
                apx[x, y] = 0

    alpha_im = alpha_im.filter(ImageFilter.GaussianBlur(radius=1.2))
    apx = alpha_im.load()

    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        row_off = y * w
        for x in range(w):
            a = 0 if visited[row_off + x] else apx[x, y]
            if a < 15:
                px[x, y] = (0, 0, 0, 0)
            else:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, a)
                if a > 80:
                    if x < min_x:
                        min_x = x
                    if y < min_y:
                        min_y = y
                    if x > max_x:
                        max_x = x
                    if y > max_y:
                        max_y = y

    if min_x < max_x and min_y < max_y:
        pad = 12
        im = im.crop(
            (
                max(0, min_x - pad),
                max(0, min_y - pad),
                min(w, max_x + 1 + pad),
                min(h, max_y + 1 + pad),
            )
        )

    im.save(dst_path, "PNG")
    print(f"{os.path.basename(dst_path):24s} -> cropped size {im.size}")


def main() -> None:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "public", "assets")
    originals_dir = os.path.join(assets_dir, "originals")
    os.makedirs(originals_dir, exist_ok=True)

    # Ensure all originals are backed up before processing
    for fname in os.listdir(assets_dir):
        fpath = os.path.join(assets_dir, fname)
        if os.path.isfile(fpath) and fname.endswith(".png"):
            bpath = os.path.join(originals_dir, fname)
            if not os.path.exists(bpath):
                shutil.copy2(fpath, bpath)

    solid_dark_targets = [
        "battery-9v.png",
        "bulb-incandescent.png",
        "bulb-led.png",
    ]
    for name in solid_dark_targets:
        src = os.path.join(originals_dir, name)
        if os.path.exists(src):
            remove_bg_smart(src, os.path.join(assets_dir, name), is_solid_dark=True)

    glow_bulb_targets = [
        "bulb-edison.png",
        "bulb-halogen.png",
        "bulb-cfl.png",
        "bulb-led-standard.png",
        "bulb-rgb.png",
    ]
    for name in glow_bulb_targets:
        src = os.path.join(originals_dir, name)
        if os.path.exists(src):
            remove_bg_smart(
                src, os.path.join(assets_dir, name), grad_thresh=30, val_stop=210
            )


if __name__ == "__main__":
    main()
