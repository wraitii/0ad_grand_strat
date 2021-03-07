import json
from typing import Tuple
from PIL import Image, ImageFilter

im = Image.open('campaigns/grand_strategy/map.png')

col_data = {}


def hash(pixel_data: Tuple):
    # Map transparent to black, which is also ignored.
    if pixel_data[3] == 0:
        return 0
    return pixel_data[0] + pixel_data[1] * 1000 + pixel_data[2] * 1000000


for x in range(0, im.width):
    for z in range(0, im.height):
        pix = im.getpixel((x, z))
        pix_hash = hash(pix)
        if pix_hash not in col_data:
            col_data[pix_hash] = {
                "count": 0,
                "color": pix,
                "pixels": [],
                "xmin": x,
                "xmax": x,
                "zmin": z,
                "zmax": z,
            }
        col_data[pix_hash]["pixels"].append((x, z))
        col_data[pix_hash]["count"] += 1
        col_data[pix_hash]["xmin"] = min(col_data[pix_hash]["xmin"], x)
        col_data[pix_hash]["xmax"] = max(col_data[pix_hash]["xmax"], x)
        col_data[pix_hash]["zmin"] = min(col_data[pix_hash]["zmin"], z)
        col_data[pix_hash]["zmax"] = max(col_data[pix_hash]["zmax"], z)

# Python 3.7+ only
col_data = dict(sorted(col_data.items(), key=lambda item: -item[1]["count"]))

def get_graphics_spec(col):
    return {
        "hash": hash(col["color"]),
        "size": [col["xmin"], col["zmin"], col["xmax"], col["zmax"]]
    }

for key, col in col_data.items():
    if key == 0:
        continue
    if col["count"] < 100:
        continue
    
    with open(f"campaigns/grand_strategy/graphics/{key}.json", "w") as f:
        f.write(json.dumps(get_graphics_spec(col)))

    img = Image.new("RGBA", (col["xmax"] - col["xmin"] + 1, col["zmax"] - col["zmin"] + 1))
    for px in col["pixels"]:
        img.putpixel((px[0] - col["xmin"], px[1] - col["zmin"]), col["color"])
    img.save(f"campaigns/grand_strategy/graphics/{key}.png", "PNG")
