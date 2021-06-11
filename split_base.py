import math
from typing import Tuple
from PIL import Image, ImageFilter

im = Image.open('campaigns/grand_strategy/Base.png')

w = im.width
h = im.height

px = 2000

scale = 0.33

for x in range(0, math.ceil(w/px)):
    for z in range(0, math.ceil(h/px)):
        print(f"processed {x}, {z}")
        region = im.crop((x*px, z*px, (x+1)*px, (z+1)*px))
        region = region.resize((math.floor(px * scale), math.floor(px * scale)))
        region.save(f"campaigns/grand_strategy/out/map_{x * px}_{z * px}.png", "PNG")

for x in range(0, math.ceil(w/px)):
    for z in range(0, math.ceil(h/px)):
        print(f"processed {x}, {z}")
        region = im.crop((x*px + px//2, z*px + px//2, (x+1)*px + px//2, (z+1)*px + px//2))
        region = region.resize((math.floor(px * scale), math.floor(px * scale)))
        region.save(f"campaigns/grand_strategy/out/map_{x * px + px//2}_{z * px + px//2}.png", "PNG")
