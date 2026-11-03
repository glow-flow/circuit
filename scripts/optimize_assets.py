import os
import shutil
from PIL import Image
import io

def optimize_all_assets():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_assets = os.path.join(repo_root, 'public', 'assets')
    backup_dir = os.path.join(repo_root, 'assets_backup')
    
    # 1. Create backup if not exists
    os.makedirs(backup_dir, exist_ok=True)
    
    # 2. Move public/assets/originals to backup_dir if it exists
    orig_dir = os.path.join(public_assets, 'originals')
    if os.path.exists(orig_dir):
        dest_orig = os.path.join(backup_dir, 'originals')
        if os.path.exists(dest_orig):
            shutil.rmtree(dest_orig)
        shutil.move(orig_dir, dest_orig)
        print(f"Moved {orig_dir} -> {dest_orig} (saved ~5MB from public distribution)")

    # 3. Collect all images to optimize
    target_dirs = [public_assets, os.path.join(public_assets, 'processed')]
    
    total_before = 0
    total_after = 0
    
    for tdir in target_dirs:
        if not os.path.exists(tdir):
            continue
        print(f"\n--- Processing directory: {os.path.relpath(tdir, repo_root)} ---")
        for fname in sorted(os.listdir(tdir)):
            fpath = os.path.join(tdir, fname)
            if not os.path.isfile(fpath) or not fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
            
            orig_size = os.path.getsize(fpath)
            total_before += orig_size
            
            # Backup original file in backup_dir
            rel_path = os.path.relpath(fpath, public_assets)
            bpath = os.path.join(backup_dir, rel_path)
            os.makedirs(os.path.dirname(bpath), exist_ok=True)
            if not os.path.exists(bpath):
                shutil.copy2(fpath, bpath)
                
            try:
                with Image.open(fpath) as img:
                    w, h = img.size
                    is_bg = 'nature' in fname
                    is_tile = 'tile-' in fname
                    
                    # For UI components, 550px max dimension provides 3.5x to 5x Retina HD density
                    # while preventing gigantic 1024px uncompressed textures.
                    if is_bg:
                        max_dim = 1024
                    elif is_tile:
                        max_dim = 256
                    else:
                        max_dim = 550
                        
                    if max(w, h) > max_dim:
                        scale = max_dim / max(w, h)
                        new_w = max(1, int(round(w * scale)))
                        new_h = max(1, int(round(h * scale)))
                        proc_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    else:
                        proc_img = img.copy()
                    
                    # Try candidate 1: Direct save with optimize=True
                    buf_direct = io.BytesIO()
                    proc_img.save(buf_direct, format='PNG', optimize=True)
                    best_bytes = buf_direct.getvalue()
                    
                    # Try candidate 2: Quantized 256 colors for RGBA / RGB
                    if proc_img.mode in ('RGBA', 'RGB'):
                        buf_quant = io.BytesIO()
                        try:
                            quant = proc_img.quantize(
                                colors=256, 
                                method=Image.Quantize.FASTOCTREE,
                                dither=Image.Dither.FLOYDSTEINBERG
                            )
                            quant.save(buf_quant, format='PNG', optimize=True)
                            if len(buf_quant.getvalue()) < len(best_bytes):
                                best_bytes = buf_quant.getvalue()
                        except Exception as q_err:
                            pass
                    
                    # Write only if we made it smaller or equal
                    if len(best_bytes) < orig_size:
                        with open(fpath, 'wb') as out_f:
                            out_f.write(best_bytes)
                        new_size = len(best_bytes)
                    else:
                        new_size = orig_size
                        
                    total_after += new_size
                    saved_pct = (1.0 - new_size / orig_size) * 100.0
                    print(f"  {fname:26} {orig_size/1024:6.1f}KB -> {new_size/1024:6.1f}KB ({saved_pct:4.1f}% reduction)")
            except Exception as e:
                print(f"  Error processing {fname}: {e}")
                total_after += orig_size

    print("\n" + "="*60)
    print(f"TOTAL ASSETS: {total_before/1024/1024:.2f} MB -> {total_after/1024/1024:.2f} MB")
    print(f"TOTAL SAVINGS: {(1.0 - total_after/total_before)*100:.1f}% bandwidth reduction!")
    print("="*60)

if __name__ == '__main__':
    optimize_all_assets()
