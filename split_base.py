import math
from typing import Tuple
from PIL import Image, ImageFilter

im = Image.open('campaigns/grand_strategy/Base.png')


w = im.width
h = im.height

for x in range(0, math.ceil(w/1000)):
    for z in range(0, math.ceil(h/1000)):
        print(f"processed {x}, {z}")
        region = im.crop((x*1000, z*1000, (x+1)*1000, (z+1)*1000))
        region.save(f"campaigns/grand_strategy/map_{x * 1000}_{z * 1000}.png", "PNG")

for x in range(0, math.ceil(w/1000)):
    for z in range(0, math.ceil(h/1000)):
        print(f"processed {x}, {z}")
        region = im.crop((x*1000 + 500, z*1000 + 500, (x+1)*1000 + 500, (z+1)*1000 + 500))
        region.save(f"campaigns/grand_strategy/map_{x * 1000 + 500}_{z * 1000 + 500}.png", "PNG")
