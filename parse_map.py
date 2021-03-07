import glob
import json
import sys
from typing import Tuple
from PIL import Image, ImageFilter

base_x = sys.argv[1].split("_")[1]
base_z = sys.argv[1].split("_")[2]

im = Image.open(f'campaigns/grand_strategy/{sys.argv[1]}.png')#.convert("RGBA")

history = {}

for filename in glob.glob('campaigns/grand_strategy/provinces/*.json'):
    with open(filename, 'r') as f:
        data = json.loads(f.read())
        if data["hash"] in history:
            print(f'Warning {filename}: colour hash {data["hash"]} already found for {history[data["hash"]]}')

        history[data["hash"]] = data["code"]

def hash(pixel_data: Tuple):
    # Map transparent to black, which is also ignored.
    if len(pixel_data) == 4 and pixel_data[3] == 0:
        return 0
    return pixel_data[0] + pixel_data[1] * 1000 + pixel_data[2] * 1000000

def unhash(hashed_col):
    b = hashed_col // 1000000;
    g = (hashed_col - b * 1000000) // 1000;
    r = (hashed_col - b * 1000000 - g * 1000);
    return (r, g, b)

def delta_col(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])

def get_color_histogram(im):
    col_data = {}
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
    return col_data

# Python 3.7+ only
col_data = dict(sorted(get_color_histogram(im).items(), key=lambda item: -item[1]["count"]))

def get_graphics_spec(col):
    return {
        "hash": hash(col["color"]),
        "size": [col["xmin"], col["zmin"], col["xmax"], col["zmax"]],
        "base_x": base_x,
        "base_z": base_z
    }

def remap_colors(im, key, col):
    col["keep"] = False
    if key == 0:
        return (key, col)
    if col["count"] < 100:
        return (key, col)

    if key in history:
        col["keep"] = True
        return (key, col)

    for key2 in history:
        if delta_col(unhash(key2), col["color"]) < 20:
            print(f'Remapping to {history[key2]}')
            replacement = unhash(key2)
            for px in col["pixels"]:
                im.putpixel(px, replacement)
            col["keep"] = True
            return (key2, col)

    col["keep"] = True
    print(f'New color: {key}')
    return (key, col)

mapped = [remap_colors(im, key, col) for key, col in col_data.items()]
col_data = {}
for key, col in mapped:
    if key in col_data:
        col_data[key]["pixels"] += col["pixels"]
        col_data[key]["xmin"] = min(col_data[key]["xmin"], col["xmin"])
        col_data[key]["xmax"] = max(col_data[key]["xmax"], col["xmax"])
        col_data[key]["zmin"] = min(col_data[key]["zmin"], col["zmin"])
        col_data[key]["zmax"] = max(col_data[key]["zmax"], col["zmax"])
    else:
        col_data[key] = col

for key, col in col_data.items():
    if key == 0:
        continue
    if col["keep"]:
        continue
    for px in col["pixels"]:
        real = set()
        for x in range(-4, 4):
            for z in range(-4, 4):
                if x + px[0] < im.width and x + px[0] >= 0:
                    if z + px[1] < im.height and z + px[1] >= 0:
                        h = hash(im.getpixel((px[0]+x, px[1]+z)))
                        if col_data[h]["keep"]:
                            real.add(h)

        if len(real) == 0:
            print("Could not map pixel " + str(px))
            continue
        real = list(real)
        minv = delta_col(unhash(real[0]), col["color"])
        v = unhash(real[0])
        for p in range(1, len(real)):
            if delta_col(unhash(real[1]), col["color"]) < minv:
                minv = delta_col(unhash(real[1]), col["color"])
                v = unhash(real[1])
        tg = col_data[hash(v)]
        tg["pixels"].append(px)
        tg["xmin"] = min(tg["xmin"], px[0])
        tg["xmax"] = max(tg["xmax"], px[0])
        tg["zmin"] = min(tg["zmin"], px[1])
        tg["zmax"] = max(tg["zmax"], px[1])


for key, col in col_data.items():
    if key == 0:
        continue
    if not col["keep"]:
        continue

    fname = history[key] if key in history else key

    with open(f"raw/{fname}.json", "w") as f:
        f.write(json.dumps(get_graphics_spec(col)))

    img = Image.new("RGBA", (col["xmax"] - col["xmin"] + 1, col["zmax"] - col["zmin"] + 1))
    for px in col["pixels"]:
        img.putpixel((px[0] - col["xmin"], px[1] - col["zmin"]), (255, 255, 255, 255))
    img.save(f"raw/{fname}.png", "PNG")
