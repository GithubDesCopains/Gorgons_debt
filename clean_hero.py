import os
from PIL import Image

def refined_clean(filename):
    if not os.path.exists(filename):
        return None
    
    img = Image.open(filename).convert("RGBA")
    w, h = img.size
    
    # Sample background widely (checkerboard colors)
    samples = []
    for x in [0, w-1, w//2]:
        for y in [0, h-1, 10]:
            samples.append(img.getpixel((x, y)))
    
    data = list(img.getdata())
    new_data = []
    
    # Very high tolerance to catch halos
    tolerance = 85
    for item in data:
        is_bg = False
        for s in samples:
            if all(abs(item[i] - s[i]) < tolerance for i in range(3)):
                is_bg = True
                break
        
        if is_bg:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Speckle removal
    pixel_map = img.load()
    refined_data = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixel_map[x, y]
            if a > 0:
                neighbors = 0
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if pixel_map[nx, ny][3] > 0:
                            neighbors += 1
                if neighbors == 0:
                    refined_data.append((0, 0, 0, 0))
                else:
                    refined_data.append((r, g, b, a))
            else:
                refined_data.append((0, 0, 0, 0))
                
    img.putdata(refined_data)
    
    bbox = img.getbbox()
    if not bbox:
        return None
        
    # Before final crop, let's identify the label at the bottom and avoid it
    # We look for a significant empty horizontal gap near the bottom
    # Character height is usually much larger than label height
    cropped_temp = img.crop(bbox)
    tw, th = cropped_temp.size
    
    real_bottom = th
    # Scan from bottom up, looking for a gap of at least 15 pixels of transparency
    gap_count = 0
    found_gap = False
    for y in range(th - 1, 0, -1):
        row_empty = True
        for x in range(tw):
            if cropped_temp.getpixel((x, y))[3] > 0:
                row_empty = False
                break
        
        if row_empty:
            gap_count += 1
        else:
            if gap_count > 10: # We found a real gap separating text from character
                real_bottom = y + gap_count # Keep the bottom of the character
                found_gap = True
                break
            gap_count = 0
            
    # If no gap found, maybe the label is touching or not there. 
    # Fallback: if height is still very large (e.g. > 400), it's probably got labels.
    if not found_gap and th > 400:
         real_bottom = int(th * 0.88) # Safer than 0.85
         
    final = cropped_temp.crop((0, 0, tw, real_bottom))
    final.save(filename)
    return final.size

files = [
    'hero_idle_front.png',
    'hero_idle_back.png',
    'hero_idle_right.png',
    'hero_idle_left.png'
]

print("--- REFINED CLEAN SUMMARY ---")
for f in files:
    size = refined_clean(f)
    if size:
        print(f"{f}: {size[0]}x{size[1]} (frame: {size[0]//4}x{size[1]})")
