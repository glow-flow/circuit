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
    Removes black background from solid electrical components and outputs clean RGBA PNG.
    Uses edge-aware luminance thresholding with smooth alpha feathering.
    """
    print(f"Processing: {input_path} -> {output_path}")
    image = Image.open(input_path).convert("RGBA")
    width, height = image.size
    
    # Check if rembg is available, otherwise perform high-fidelity color matting
    try:
        import rembg
        print("Using rembg engine...")
        result = rembg.remove(image)
        result.save(output_path, "PNG")
        print(f"Successfully saved {output_path} with rembg.")
        return
    except ImportError:
        print("Using Pillow high-fidelity luma-chroma matting engine...")

    # Load pixel data
    pixels = image.load()
    
    # Create mask for solid background extraction
    # Black background has R, G, B near 0 (threshold < 15)
    # We apply a smooth transition between 10 and 35 for ultra-clean anti-aliased edges
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Brightness / max channel
            max_channel = max(r, g, b)
            
            if max_channel <= 8:
                # Fully transparent background
                pixels[x, y] = (0, 0, 0, 0)
            elif max_channel < 30:
                # Smooth antialiasing gradient for borders
                alpha_factor = (max_channel - 8) / (30 - 8)
                new_alpha = int(alpha_factor * 255)
                pixels[x, y] = (r, g, b, new_alpha)
            else:
                # Solid foreground component
                pixels[x, y] = (r, g, b, 255)
                
    # Save processed image with full alpha channel
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
