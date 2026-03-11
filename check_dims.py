from PIL import Image
import sys

img = Image.open(sys.argv[1])
print(f"{img.width}x{img.height}")
