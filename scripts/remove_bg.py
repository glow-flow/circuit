"""
Background Removal Automation Script for Circuit Sandbox.

Processes solid component assets (Battery, Battery Holder, Resistor, LED)
by isolating the object and producing a clean, anti-aliased RGBA PNG
with transparent alpha channel, saved into public/assets/processed/.

Bulb assets are excluded as per specification (which uses CSS mix-blend-mode: screen).
"""

import os
import sys
from PIL import Image, ImageFilter

def process_image_background(input_path: str, output_path: str) -> None:
    """
    Removes black background from solid electrical components, eliminates dark halos,
    and tightly crops transparent margins so components scale accurately in UI slots.
    """
    print(f"Processing: {input_path} -> {output_path}")
    image = Image.open(input_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()

    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            max_channel = max(r, g, b)

            if max_channel <= 22:
                pixels[x, y] = (0, 0, 0, 0)
            elif max_channel < 55:
                alpha_factor = (max_channel - 22) / (55 - 22)
                new_alpha = int(alpha_factor * 255)
                pixels[x, y] = (r, g, b, new_alpha)
            else:
                pixels[x, y] = (r, g, b, 255)

            # Track tight bounding box of solid pixels
            if pixels[x, y][3] > 60:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y

    if min_x < max_x and min_y < max_y:
        pad = 6
        crop_box = (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(width, max_x + 1 + pad),
            min(height, max_y + 1 + pad),
        )
        image = image.crop(crop_box)
        print(f"Cropped {os.path.basename(input_path)} to {image.size} (box={crop_box})")

    image.save(output_path, "PNG")
    print(f"Successfully processed and saved: {output_path}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "public", "assets")
    processed_dir = os.path.join(assets_dir, "processed")
    os.makedirs(processed_dir, exist_ok=True)
    
    targets = [
        "battery-aa.png",
        "battery-holder.png",
        "resistor.png",
        "led-green.png",
    ]
    
    for filename in targets:
        src_path = os.path.join(assets_dir, filename)
        if os.path.exists(src_path):
            dest_path = os.path.join(processed_dir, filename)
            process_image_background(src_path, dest_path)
        else:
            print(f"Warning: {src_path} not found.")

if __name__ == "__main__":
    main()
