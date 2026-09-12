from PIL import Image
import os

INPUT = 'database/pictures'
OUTPUT_LARGE = 'static/img/termek_nagy'
OUTPUT_ICONS = 'static/img/termek_ikon'
OUTPUT_PICONS = 'static/img/termek_pikon'

PICON_QUALITY = 60
PICON_MAX = 64

ICON_QUALITY = 80
ICON_MAX = 180

LARGE_QUALITY = 80
LARGE_MAX = 512

def remove_all_files(path: str):
    for f in os.listdir(path):
        os.remove(os.path.join(path, f))

def handle_scaling(path: str, output: str, max: int, quality: int, transparent: bool = False):
    if os.path.exists(output):
        print(f'WARN: Skipped {os.path.split(output)[1]}')
        return
    
    with Image.open(path) as img:
        if not transparent and img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
            white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(white_bg, img)
            img = img.convert("RGB")
        elif not transparent:
            img = img.convert("RGB")
        
        img.thumbnail((max, max), Image.Resampling.LANCZOS)

        if transparent and img.mode != 'RGBA':
            img = img.convert("RGBA")
        elif not transparent and img.mode != 'RGB':
            img = img.convert("RGB")
            
        if transparent:
            img.save(output, "WEBP", quality=quality, transparency=0)
        else:
            img.save(output, "WEBP", quality=quality)

files =  os.listdir(INPUT)
done = 0

inp: str = input('Would you like to clear all output images (Y or N)? ')

if inp.lower() == 'y':
    remove_all_files(OUTPUT_PICONS)
    remove_all_files(OUTPUT_ICONS)
    remove_all_files(OUTPUT_LARGE)
    
    print('Deleted all images!\n')

print('Sampling images started . . .')
print(f'There are a total of {len(files)} files.\n')

for f in files:
    path = os.path.join(INPUT, f)
    name = os.path.splitext(f)[0]
    
    handle_scaling(path, os.path.join(OUTPUT_PICONS, name + '.webp'), PICON_MAX, PICON_QUALITY, transparent=True)
    handle_scaling(path, os.path.join(OUTPUT_ICONS, name + '.webp'), ICON_MAX, ICON_QUALITY)
    handle_scaling(path, os.path.join(OUTPUT_LARGE, name + '.webp'), LARGE_MAX, LARGE_QUALITY)
    
    done += 1
    
    print(f'Done with {done} / {len(files)}')
    
print('\nSampling done.')