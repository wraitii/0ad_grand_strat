import glob
import json
import math
import random

import pygame

from .province import Province, provinces
from ..config import PATH_TO_ART, PATH_TO_HISTORY, BASES

from .mode_link import LinkMode
from .mode_centerpoint import CenterPointMode

from .scroll import scroll

random.seed()

pygame.display.init()
pygame.font.init()
screen = pygame.display.set_mode((1000, 700))


# TODO: not hardcoding this
scale = 0.33

PROV_SIZE = 512


baseFiles = glob.glob(BASES + "*.png")
baseImages = []
for base in baseFiles:
    xx = base.find("map_") + 4
    yy = base.find("_", xx)
    xx = int(base[xx:yy])
    yy = int(base[yy+1:base.find(".png")])
    baseImages.append({
        "tex": pygame.image.load(base),
        "x": xx * scale,
        "y": yy * scale,
    })
    print(f"loaded {baseImages[-1]}")

font = pygame.font.SysFont(pygame.font.get_default_font(), 16)

print(f"Ready - loaded {len(baseImages)} images")

usedColors = set()

provFiles = glob.glob(PATH_TO_HISTORY + "*.json")
for prov in provFiles:
    try:
        province = Province(prov.replace(PATH_TO_HISTORY, "").replace(".json", "")).load()
    except Exception as err:
        print(err)
        continue
    provinces[province.code] = province
    usedColors.add(province.color)

def findColor():
    while True:
        col = (math.floor(random.uniform(0, 256)), math.floor(random.uniform(0, 256)), math.floor(random.uniform(0, 256)))
        if col not in usedColors:
            return col


current_color = None
current_province = None

def resetCurrent():
    global current_color
    global current_province

    current_color = findColor()
    current_province = Province("")
    current_province.color = current_color
resetCurrent()

NORMAL_MODE = 0
EDIT_MODE = 1
MASK_MODE = 2
LINK_MODE = 3
CENTERPOINT_MODE = 4
mode = NORMAL_MODE

INPUT_STATE = None

loop = True
while loop:
    event = pygame.event.poll()
    if event:
        if event.type == pygame.QUIT:
            loop = False
        if INPUT_STATE is not None:
            ret = INPUT_STATE.event(event)
            if ret == 2:
                INPUT_STATE = None
                mode = NORMAL_MODE
        elif event.type == pygame.KEYDOWN:
            if mode == EDIT_MODE:
                if event.key == pygame.K_RETURN:
                    mode = NORMAL_MODE
                elif event.key == pygame.K_ESCAPE:
                    mode = NORMAL_MODE
                    try:
                        current_province.load()
                    except:
                        pass
                    resetCurrent()
            elif mode == NORMAL_MODE:
                if event.mod & pygame.KMOD_LCTRL:
                    if event.key == pygame.K_m:
                        mode = MASK_MODE
                    elif event.key == pygame.K_l:
                        mode = LINK_MODE
                        INPUT_STATE = LinkMode()
                    elif event.key == pygame.K_c:
                        mode = CENTERPOINT_MODE
                        INPUT_STATE = CenterPointMode()
                    elif event.key == pygame.K_s:
                        # Save current province
                        try:
                            provinces = current_province.save(provinces)
                        except Exception as err:
                            pass

                        # Export all provinces PNG (this is done here as we render neighbors)
                        sf = pygame.Surface((PROV_SIZE, PROV_SIZE), pygame.SRCALPHA)
                        for prov1 in provinces:
                            sf.fill((0, 0, 0, 0))
                            pv1 = provinces[prov1]
                            try:
                                pv1.save({})
                            except:
                                continue
                            pv1.blit(sf, pv1.art["base_x"], pv1.art["base_z"])
                            for prov2 in provinces:
                                pv2 = provinces[prov2]
                                pv2.blit(sf, pv1.art["base_x"], pv1.art["base_z"])

                            pa = pygame.PixelArray(sf.copy())
                            pa = pa.extract(pv1.color)
                            pa.replace((0, 0, 0), (0, 0, 0, 0))
                            pa = pa.make_surface()
                            pygame.image.save(pa, PATH_TO_ART + pv1.code + ".png")

                        # Reset
                        resetCurrent()

                else:
                    if event.key >= pygame.K_a and event.key <= pygame.K_z:
                        current_province.code += pygame.key.name(event.key)
                    elif event.key == pygame.K_BACKSPACE:
                        current_province.code = current_province.code[0:-1]
                    elif event.scancode >= 30 and event.scancode <= 39: # top row, laziness
                        current_province.code += "_"
            elif mode == MASK_MODE:
                if event.key == pygame.K_ESCAPE:
                    current_province.load()
                    mode = NORMAL_MODE
                elif event.key == pygame.K_RETURN:
                    mode = NORMAL_MODE
                elif event.key == pygame.K_SPACE:
                    if current_province.art is None:
                        print("NONO art is none")
                        continue
                    sf = pygame.Surface((PROV_SIZE, PROV_SIZE))
                    for base in baseImages:
                        sf.blit(base["tex"], (
                            base["x"] - current_province.art["base_x"],
                            base["y"] - current_province.art["base_z"]))
                    pa = pygame.PixelArray(sf)
                    pa = pa.extract(current_color, 0.05)
                    mask = pygame.mask.from_threshold(pa.make_surface(), (0, 0, 0, 255), (127, 127, 127, 255))
                    current_province.surface = mask.to_surface(
                        setsurface=current_province.surface,
                        unsetcolor=(0, 0, 0, 0))

    pressed = pygame.key.get_pressed()
    if pressed[pygame.K_DOWN]:
        scroll.y += 10
    elif pressed[pygame.K_UP]:
        scroll.y -= 10
    if pressed[pygame.K_LEFT]:
        scroll.x -= 10
    elif pressed[pygame.K_RIGHT]:
        scroll.x += 10

    if INPUT_STATE is not None:
        INPUT_STATE.frame()

    if pygame.mouse.get_pressed()[0]:
        coord = pygame.mouse.get_pos()
        coord = (coord[0] + scroll.x, coord[1] + scroll.y)
        if mode == NORMAL_MODE:
            mode = EDIT_MODE
            if current_province.art is None:
                current_province.set_base(coord[0], coord[1])
        elif mode == EDIT_MODE or mode == MASK_MODE:
            pygame.draw.circle(current_province.surface, current_province.color, (
                coord[0] - current_province.art["base_x"],
                coord[1] - current_province.art["base_z"]
            ), 10)
    elif mode == NORMAL_MODE and pygame.mouse.get_pressed()[2]:
        col = screen.copy().get_at(pygame.mouse.get_pos())
        for prov in provinces:
            if provinces[prov].color == col:
                current_province = provinces[prov]
                current_color = col
                break
    elif mode == EDIT_MODE and pygame.mouse.get_pressed()[2]:
        coord = pygame.mouse.get_pos()
        coord = (coord[0] + scroll.x, coord[1] + scroll.y)
        pygame.draw.circle(current_province.surface, (0, 0, 0, 0), (
            coord[0] - current_province.art["base_x"],
            coord[1] - current_province.art["base_z"]
        ), 10)
        #if current_province.art is not None:
        #    current_province.art["base_x"] = coord[0] - PROV_SIZE//2
        #    current_province.art["base_z"] = coord[1] - PROV_SIZE//2
    elif mode == MASK_MODE and pygame.mouse.get_pressed()[2]:
        current_color = screen.copy().get_at(pygame.mouse.get_pos())


    screen.fill((0, 0, 0))

    for base in baseImages:
        screen.blit(base["tex"], (base["x"] - scroll.x, base["y"] - scroll.y))

    for prov in provinces:
        pv = provinces[prov]
        if pv.art is not None:
            pv.blit(screen, scroll.x, scroll.y)
            pv.blit_cp(screen, scroll.x, scroll.y)
    pv = current_province
    if pv.art is not None:
        pv.blit(screen, scroll.x, scroll.y)
        if mode == EDIT_MODE:
            pygame.draw.line(screen, (0, 0, 0, 100),
                (pv.art["base_x"] - scroll.x, pv.art["base_z"] - scroll.y),
                (pv.art["base_x"] + PROV_SIZE - scroll.x, pv.art["base_z"] + PROV_SIZE - scroll.y),
                3
            )
    for prov in provinces:
        pv = provinces[prov]
        if pv.art is not None:
            pv.blit_links(screen, scroll.x, scroll.y)

    if INPUT_STATE is not None:
        INPUT_STATE.render(screen)

    # "Interface"
    img = font.render(f'Pos: {scroll.x} {scroll.y}', True, (0, 0, 0))
    screen.blit(img, (20, 20))

    modeStr = "NORMAL MODE"
    if mode == EDIT_MODE:
        modeStr = "EDIT MODE"
    elif mode == MASK_MODE:
        modeStr = "MASK MODE"
    elif mode == LINK_MODE:
        modeStr = "LINK MODE"
    elif mode == CENTERPOINT_MODE:
        modeStr = "CENTERPOINT MODE"
    img = font.render(modeStr, True, (0, 0, 0))
    screen.blit(img, (20, 30))

    img = font.render("Current prov name:" + current_province.code, True, (0, 0, 0))
    screen.blit(img, (20, 40))

    pygame.display.flip()

pygame.quit()
