"""
Asset Processing Pipeline for Circuit Sandbox:
1. New 3U CFL Fluorescent Bulb (E27 screw base)
2. New Ceramic Bi-Pin Socket (Halogen fixture)

Uses BFS exterior flood-fill with smooth alpha matte falloff and straight-alpha
color unmultiplication to key out black backgrounds cleanly without black fringes or halos.

Time Complexity: O(W * H) per image where W, H are image width and height (1024x1024).
"""

import os
import shutil
from collections import deque
from typing import Tuple, List, Dict, Any
from PIL import Image, ImageFilter

def smoothstep(edge_lower: float, edge_upper: float, value: float) -> float:
    """
    Computes smooth Hermite interpolation between 0.0 and 1.0.
    Time Complexity: O(1).
    """
    normalized_t = max(0.0, min(1.0, (value - edge_lower) / (edge_upper - edge_lower)))
    return normalized_t * normalized_t * (3.0 - 2.0 * normalized_t)


def find_exterior_background(
    source_image: Image.Image,
    background_threshold: int = 7
) -> bytearray:
    """
    Finds all exterior background pixels connected to the 4 outer image borders
    using Breadth-First Search (BFS) flood fill.
    Preserves all dark interiors, internal shadows, and insulator rings.

    Time Complexity: O(W * H)
    Space Complexity: O(W * H)

    :param source_image: RGB or RGBA PIL Image
    :param background_threshold: Maximum brightness channel value considered background
    :returns: bytearray where 1 indicates an exterior background pixel and 0 otherwise
    """
    width, height = source_image.size
    pixel_access = source_image.load()
    exterior_visited = bytearray(width * height)
    queue = deque()

    # Seed BFS from top and bottom image borders
    for x_coordinate in range(width):
        # Top border
        if max(pixel_access[x_coordinate, 0][:3]) <= background_threshold:
            exterior_visited[x_coordinate] = 1
            queue.append((x_coordinate, 0))
        # Bottom border
        bottom_offset = (height - 1) * width + x_coordinate
        if max(pixel_access[x_coordinate, height - 1][:3]) <= background_threshold:
            exterior_visited[bottom_offset] = 1
            queue.append((x_coordinate, height - 1))

    # Seed BFS from left and right image borders
    for y_coordinate in range(height):
        left_offset = y_coordinate * width
        if max(pixel_access[0, y_coordinate][:3]) <= background_threshold and not exterior_visited[left_offset]:
            exterior_visited[left_offset] = 1
            queue.append((0, y_coordinate))
        right_offset = y_coordinate * width + (width - 1)
        if max(pixel_access[width - 1, y_coordinate][:3]) <= background_threshold and not exterior_visited[right_offset]:
            exterior_visited[right_offset] = 1
            queue.append((width - 1, y_coordinate))

    # Execute flood fill
    while queue:
        current_x, current_y = queue.popleft()
        for next_x, next_y in (
            (current_x + 1, current_y),
            (current_x - 1, current_y),
            (current_x, current_y + 1),
            (current_x, current_y - 1),
        ):
            if 0 <= next_x < width and 0 <= next_y < height:
                neighbor_index = next_y * width + next_x
                if not exterior_visited[neighbor_index]:
                    pixel_channels = pixel_access[next_x, next_y][:3]
                    if max(pixel_channels) <= background_threshold:
                        exterior_visited[neighbor_index] = 1
                        queue.append((next_x, next_y))

    return exterior_visited


def process_cfl_bulb(
    source_path: str,
    output_path: str,
    backup_path: str,
    transparent_margin_px: int = 4
) -> Dict[str, Any]:
    """
    Keys out the black background of the CFL bulb image with smooth alpha matte falloff
    and straight-alpha color unmultiplication on the glowing phosphor tubes.
    Preserves the full bounding box with a 4px transparent margin.

    Time Complexity: O(W * H)
    Space Complexity: O(W * H)

    :param source_path: Path to the raw JPEG image
    :param output_path: Destination path for public/assets/bulb-cfl.png
    :param backup_path: Destination path for public/assets/originals/bulb-cfl.png
    :param transparent_margin_px: Margin in pixels added to all sides
    :returns: Dictionary with dimensions and base vertical pixel ranges
    """
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source CFL image not found: {source_path}")

    source_image = Image.open(source_path).convert("RGB")
    width, height = source_image.size
    pixel_access = source_image.load()

    # Step 1: Detect exterior background via BFS
    exterior_visited = find_exterior_background(source_image, background_threshold=7)

    # Step 2: Build anti-aliased solid mask for lower body (housing & metal screw)
    solid_mask = Image.new("L", (width, height), 255)
    solid_mask_pixels = solid_mask.load()
    for y in range(height):
        row_offset = y * width
        for x in range(width):
            if exterior_visited[row_offset + x]:
                solid_mask_pixels[x, y] = 0

    solid_mask_blurred = solid_mask.filter(ImageFilter.GaussianBlur(radius=0.9))
    blurred_mask_pixels = solid_mask_blurred.load()

    # Step 3: Key out background and apply optical falloff + color unmult
    processed_image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    output_pixels = processed_image.load()

    # Thresholds for phosphor tube glow matte
    GLOW_LOW_THRESHOLD = 5
    GLOW_HIGH_THRESHOLD = 60
    TUBE_BODY_BOUNDARY_Y = 530

    for y in range(height):
        row_offset = y * width
        for x in range(width):
            if exterior_visited[row_offset + x]:
                continue

            r, g, b = pixel_access[x, y]
            brightness = max(r, g, b)

            if y < TUBE_BODY_BOUNDARY_Y:
                # Glowing phosphor tube zone: optical luminance falloff
                if brightness <= GLOW_LOW_THRESHOLD:
                    alpha = 0
                elif brightness >= GLOW_HIGH_THRESHOLD:
                    alpha = 255
                else:
                    factor = smoothstep(GLOW_LOW_THRESHOLD, GLOW_HIGH_THRESHOLD, brightness)
                    alpha = int(round(factor * 255))

                if alpha <= 0:
                    continue
                elif alpha >= 255:
                    output_pixels[x, y] = (r, g, b, 255)
                else:
                    # Unmultiply color against black background to prevent dark fringes
                    alpha_normalized = alpha / 255.0
                    unmult_multiplier = 1.0 / max(alpha_normalized, 0.25)
                    r_clean = min(255, int(round(r * unmult_multiplier)))
                    g_clean = min(255, int(round(g * unmult_multiplier)))
                    b_clean = min(255, int(round(b * unmult_multiplier)))
                    output_pixels[x, y] = (r_clean, g_clean, b_clean, alpha)
            else:
                # Solid plastic housing & metal screw base: anti-aliased edge
                alpha = blurred_mask_pixels[x, y]
                if alpha < 12:
                    continue
                elif alpha >= 248:
                    output_pixels[x, y] = (r, g, b, 255)
                else:
                    alpha_normalized = alpha / 255.0
                    unmult_multiplier = 1.0 / max(alpha_normalized, 0.3)
                    r_clean = min(255, int(round(r * unmult_multiplier)))
                    g_clean = min(255, int(round(g * unmult_multiplier)))
                    b_clean = min(255, int(round(b * unmult_multiplier)))
                    output_pixels[x, y] = (r_clean, g_clean, b_clean, alpha)

    # Step 4: Compute active bounding box
    bounding_box = processed_image.getbbox()
    if bounding_box is None:
        raise ValueError("Processed CFL bulb resulted in empty image")

    min_x, min_y, max_x, max_y = bounding_box
    active_width = max_x - min_x
    active_height = max_y - min_y

    # Apply 4px transparent margin
    crop_x1 = max(0, min_x - transparent_margin_px)
    crop_y1 = max(0, min_y - transparent_margin_px)
    crop_x2 = min(width, max_x + transparent_margin_px)
    crop_y2 = min(height, max_y + transparent_margin_px)

    cropped_image = processed_image.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    final_width, final_height = cropped_image.size

    # Metal screw base calibration in cropped coordinates:
    # Metal base starts where plastic collar meets top metal thread: original Y = 774
    # Metal base terminates at bottom solder contact: original Y = 963
    metal_screw_top_crop = 774 - crop_y1
    metal_screw_bottom_crop = 963 - crop_y1
    metal_screw_height_crop = metal_screw_bottom_crop - metal_screw_top_crop + 1

    # Save output and backup
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    cropped_image.save(output_path, "PNG")
    cropped_image.save(backup_path, "PNG")

    return {
        "output_path": output_path,
        "backup_path": backup_path,
        "original_bbox": bounding_box,
        "crop_box": (crop_x1, crop_y1, crop_x2, crop_y2),
        "dimensions": (final_width, final_height),
        "transparent_margin_px": transparent_margin_px,
        "metal_screw_base": {
            "top_y": metal_screw_top_crop,
            "bottom_y": metal_screw_bottom_crop,
            "height_px": metal_screw_height_crop,
            "top_percentage": (metal_screw_top_crop / final_height) * 100.0,
            "bottom_percentage": (metal_screw_bottom_crop / final_height) * 100.0,
        }
    }


def process_pin_socket(
    source_path: str,
    output_path: str,
    backup_path: str
) -> Dict[str, Any]:
    """
    Keys out the black background of the White Ceramic Bi-Pin Socket cleanly,
    maintains depth in the pin slots and between the bottom copper tabs,
    and calculates precise landmarks and SVG polygon clip-path for the 3-layer depth sandwich.

    Time Complexity: O(W * H)
    Space Complexity: O(W * H)

    :param source_path: Path to the raw JPEG image
    :param output_path: Destination path for public/assets/socket-pin.png
    :param backup_path: Destination path for public/assets/originals/socket-pin.png
    :returns: Dictionary with measurements, coordinate percentages, and SVG clip-path
    """
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source socket image not found: {source_path}")

    source_image = Image.open(source_path).convert("RGB")
    width, height = source_image.size
    pixel_access = source_image.load()

    # Step 1: Detect exterior background via BFS
    exterior_visited = find_exterior_background(source_image, background_threshold=7)

    # Step 2: Build anti-aliased solid mask
    solid_mask = Image.new("L", (width, height), 255)
    solid_mask_pixels = solid_mask.load()
    for y in range(height):
        row_offset = y * width
        for x in range(width):
            if exterior_visited[row_offset + x]:
                solid_mask_pixels[x, y] = 0

    solid_mask_blurred = solid_mask.filter(ImageFilter.GaussianBlur(radius=0.8))
    blurred_mask_pixels = solid_mask_blurred.load()

    # Step 3: Key out background with edge anti-aliasing and unmultiplication
    processed_image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    output_pixels = processed_image.load()

    for y in range(height):
        row_offset = y * width
        for x in range(width):
            if exterior_visited[row_offset + x]:
                continue
            alpha = blurred_mask_pixels[x, y]
            if alpha < 10:
                continue
            r, g, b = pixel_access[x, y]
            if alpha >= 250:
                output_pixels[x, y] = (r, g, b, 255)
            else:
                alpha_normalized = alpha / 255.0
                unmult_multiplier = 1.0 / max(alpha_normalized, 0.3)
                r_clean = min(255, int(round(r * unmult_multiplier)))
                g_clean = min(255, int(round(g * unmult_multiplier)))
                b_clean = min(255, int(round(b * unmult_multiplier)))
                output_pixels[x, y] = (r_clean, g_clean, b_clean, alpha)

    # Step 4: Tight crop to bounding box (consistent with socket.png standard)
    bounding_box = processed_image.getbbox()
    if bounding_box is None:
        raise ValueError("Processed socket resulted in empty image")

    min_x, min_y, max_x, max_y = bounding_box
    cropped_socket = processed_image.crop(bounding_box)
    final_width, final_height = cropped_socket.size
    aspect_ratio = final_width / final_height

    # Save output and backup
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    cropped_socket.save(output_path, "PNG")
    cropped_socket.save(backup_path, "PNG")

    # Step 5: Calculate landmarks in cropped coordinate space
    # (A) Pin holes (dark slots in top ceramic face, original Y in [130..155])
    left_slot_pixels = []
    right_slot_pixels = []
    for y in range(130, 155):
        for x in range(350, 680):
            r, g, b = pixel_access[x, y]
            brightness = max(r, g, b)
            if brightness < 150: # dark slot pixel
                weight = 150 - brightness
                if x < 512:
                    left_slot_pixels.append((x - min_x, y - min_y, weight))
                else:
                    right_slot_pixels.append((x - min_x, y - min_y, weight))

    def weighted_center(points: List[Tuple[int, int, int]]) -> Tuple[float, float]:
        total_w = sum(p[2] for p in points)
        cx = sum(p[0] * p[2] for p in points) / total_w
        cy = sum(p[1] * p[2] for p in points) / total_w
        return cx, cy

    left_slot_cx, left_slot_cy = weighted_center(left_slot_pixels)
    right_slot_cx, right_slot_cy = weighted_center(right_slot_pixels)

    # (B) Bottom copper terminal tabs (original Y in [740..896])
    # Connection eyelets for handles p1 (left) and p2 (right)
    left_terminal_pixels = []
    right_terminal_pixels = []
    for y in range(740, max_y):
        for x in range(min_x, max_x):
            if not exterior_visited[y * width + x]:
                r, g, b = pixel_access[x, y]
                if max(r, g, b) > 20:
                    if x < 512:
                        left_terminal_pixels.append((x - min_x, y - min_y))
                    else:
                        right_terminal_pixels.append((x - min_x, y - min_y))

    # Eyelet centers (bottom 25px of the tabs where wire screw terminals attach)
    left_bottom_y = max(p[1] for p in left_terminal_pixels)
    left_eyelet_pts = [p for p in left_terminal_pixels if p[1] >= left_bottom_y - 25]
    p1_cx = sum(p[0] for p in left_eyelet_pts) / len(left_eyelet_pts)
    p1_cy = sum(p[1] for p in left_eyelet_pts) / len(left_eyelet_pts)

    right_bottom_y = max(p[1] for p in right_terminal_pixels)
    right_eyelet_pts = [p for p in right_terminal_pixels if p[1] >= right_bottom_y - 25]
    p2_cx = sum(p[0] for p in right_eyelet_pts) / len(right_eyelet_pts)
    p2_cy = sum(p[1] for p in right_eyelet_pts) / len(right_eyelet_pts)

    # (C) SVG Polygon Clip-Path for the front ceramic lip
    # Tracing the front edge below the pin holes where the front wall covers pins
    # Pin slots end at Y_crop = 18px (2.34%).
    # The front lip curve arches along the front highlight from:
    # 0% 4.8% -> 10% 3.6% -> 25% 2.6% -> 50% 3.2% -> 75% 2.6% -> 90% 3.6% -> 100% 4.8%
    # and extends down through 100% 100% and 0% 100%.
    svg_clip_path = (
        "polygon("
        "0% 4.8%, "
        "10% 3.6%, "
        "20% 2.8%, "
        "30% 2.6%, "
        "40% 2.9%, "
        "50% 3.2%, "
        "60% 2.9%, "
        "70% 2.6%, "
        "80% 2.8%, "
        "90% 3.6%, "
        "100% 4.8%, "
        "100% 100%, "
        "0% 100%"
        ")"
    )

    return {
        "output_path": output_path,
        "backup_path": backup_path,
        "bounding_box": bounding_box,
        "dimensions": (final_width, final_height),
        "aspect_ratio": aspect_ratio,
        "pin_slots": {
            "left_slot": {
                "x_px": left_slot_cx,
                "y_px": left_slot_cy,
                "x_percentage": (left_slot_cx / final_width) * 100.0,
                "y_percentage": (left_slot_cy / final_height) * 100.0,
            },
            "right_slot": {
                "x_px": right_slot_cx,
                "y_px": right_slot_cy,
                "x_percentage": (right_slot_cx / final_width) * 100.0,
                "y_percentage": (right_slot_cy / final_height) * 100.0,
            },
            "slot_distance_px": right_slot_cx - left_slot_cx,
            "slot_distance_percentage": ((right_slot_cx - left_slot_cx) / final_width) * 100.0,
        },
        "terminals": {
            "p1": {
                "x_px": p1_cx,
                "y_px": p1_cy,
                "x_percentage": (p1_cx / final_width) * 100.0,
                "y_percentage": (p1_cy / final_height) * 100.0,
            },
            "p2": {
                "x_px": p2_cx,
                "y_px": p2_cy,
                "x_percentage": (p2_cx / final_width) * 100.0,
                "y_percentage": (p2_cy / final_height) * 100.0,
            },
        },
        "svg_clip_path": svg_clip_path,
    }


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_assets_dir = os.path.join(base_dir, "public", "assets")
    originals_dir = os.path.join(public_assets_dir, "originals")

    raw_cfl_path = r"C:\Users\ASUS\.gemini\antigravity\brain\9626bd2f-6982-4f4a-a2bf-881ead88f30f\.user_uploaded\media_1793385485852_4fa2af3a.jpg"
    raw_socket_path = r"C:\Users\ASUS\.gemini\antigravity\brain\9626bd2f-6982-4f4a-a2bf-881ead88f30f\.user_uploaded\media_1793385485907_db8e3e11.jpg"

    print("=== Processing CFL Bulb Asset ===")
    cfl_results = process_cfl_bulb(
        source_path=raw_cfl_path,
        output_path=os.path.join(public_assets_dir, "bulb-cfl.png"),
        backup_path=os.path.join(originals_dir, "bulb-cfl.png"),
        transparent_margin_px=4
    )
    print(f"CFL Dimensions: {cfl_results['dimensions']}")
    print(f"CFL Metal screw base: Y={cfl_results['metal_screw_base']['top_y']}..{cfl_results['metal_screw_base']['bottom_y']}px (Height: {cfl_results['metal_screw_base']['height_px']}px, {cfl_results['metal_screw_base']['top_percentage']:.2f}%..{cfl_results['metal_screw_base']['bottom_percentage']:.2f}%)")

    print("\n=== Processing Ceramic Bi-Pin Socket Asset ===")
    socket_results = process_pin_socket(
        source_path=raw_socket_path,
        output_path=os.path.join(public_assets_dir, "socket-pin.png"),
        backup_path=os.path.join(originals_dir, "socket-pin.png")
    )
    print(f"Socket Dimensions: {socket_results['dimensions']}")
    print(f"Socket Aspect Ratio: {socket_results['aspect_ratio']:.4f}")
    print(f"Left Slot:  X={socket_results['pin_slots']['left_slot']['x_percentage']:.2f}%, Y={socket_results['pin_slots']['left_slot']['y_percentage']:.2f}%")
    print(f"Right Slot: X={socket_results['pin_slots']['right_slot']['x_percentage']:.2f}%, Y={socket_results['pin_slots']['right_slot']['y_percentage']:.2f}%")
    print(f"Slot Distance: {socket_results['pin_slots']['slot_distance_percentage']:.2f}%")
    print(f"Terminal p1 (Left):  X={socket_results['terminals']['p1']['x_percentage']:.2f}%, Y={socket_results['terminals']['p1']['y_percentage']:.2f}%")
    print(f"Terminal p2 (Right): X={socket_results['terminals']['p2']['x_percentage']:.2f}%, Y={socket_results['terminals']['p2']['y_percentage']:.2f}%")
    print(f"SVG Front Lip Clip-Path: {socket_results['svg_clip_path']}")


if __name__ == "__main__":
    main()
