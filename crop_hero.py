import os
from PIL import Image

def crop_spritesheet(filename):
    if not os.path.exists(filename):
        print(f"File {filename} not found.")
        return
    
    img = Image.open(filename).convert("RGBA")
    bbox = img.getbbox() # Returns (left, top, right, bottom)
    if not bbox:
        print(f"Image {filename} is empty.")
        return
    
    # We want a row of 4 frames.
    # The current bbox contains all 4 frames.
    cropped = img.crop(bbox)
    
    # Let's normalize it a bit. 
    # Suppose we want each frame to be square based on the height of the character.
    w, h = cropped.size
    frame_w = w // 4
    
    # Save the cropped version
    cropped.save(filename)
    print(f"Cropped {filename} to {w}x{h} (estimate frame: {frame_w}x{h})")
    return frame_w, h

files = [
    'hero_idle_front.png',
    'hero_idle_back.png',
    'hero_idle_right.png',
    'hero_idle_left.png'
]

results = {}
for f in files:
    results[f] = crop_spritesheet(f)

print("--- SUMMARY FOR PHASER ---")
for f, dim in results.items():
    if dim:
        print(f"{f}: frameWidth={dim[0]}, frameHeight={dim[1]}")
