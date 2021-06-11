import copy
import json
import pygame

from .config import *

provinces = {}

class Province:
    """Data for a province"""
    def __init__(self, code):
        self.code = code
        self.art = None
        self.history = {
            "code": code
        }
        self.surface = pygame.Surface((PROV_SIZE, PROV_SIZE), pygame.SRCALPHA)

    def load(self):
        self.surface.fill((0, 0, 0, 0))
        data = json.load(open(PATH_TO_HISTORY + self.code + ".json"))
        artData = json.load(open(PATH_TO_ART + self.code + ".json"))
        artData["base_x"] = int(artData["base_x"])
        artData["base_z"] = int(artData["base_z"])
        file = pygame.image.load(PATH_TO_ART + self.code + ".png")
        r = data["hash"] // 1000000
        g = (data["hash"] - r * 1000000) // 1000
        b = (data["hash"] - r * 1000000 - g * 1000)

        self.art = artData
        self.history = data
        self.history["links"] = set(self.history["links"])
        self.color = (r, g, b)

        pa = pygame.PixelArray(file)
        pa.replace((255, 255, 255), (r, g, b))
        self.surface.blit(
            pa.make_surface(),
            (PROV_SIZE // 2 - file.get_width() // 2, PROV_SIZE // 2 - file.get_height() // 2)
        )
        return self

    def save(self, provinces):
        """Save province data except for the surface image."""
        if len(self.code) == 0:
            raise Exception("ERROR: no province name")
        if self.art is None:
            raise Exception("ERROR: no province art")

        # Save the current province
        with open(PATH_TO_HISTORY + self.code + ".json", "w+") as f:
            d = copy.copy(self.history)
            d["links"] = list(self.history["links"]) if "links" in self.history else []
            d["hash"] = self.color[0] * 1000000 + self.color[1] * 1000 + self.color[2]
            d["code"] = self.code
            f.write(json.dumps(d))
        with open(PATH_TO_ART + self.code + ".json", "w+") as f:
            d = self.art
            d["size"] = [self.art["base_x"], self.art["base_z"], self.art["base_x"] + PROV_SIZE, self.art["base_z"] + PROV_SIZE]
            d["hash"] = self.color[0] * 1000000 + self.color[1] * 1000 + self.color[2]
            f.write(json.dumps(d))
        provinces[self.code] = self
        return provinces

    def add_link(self, code):
        if "links" not in self.history:
            self.history["links"] = set()
        self.history["links"].add(code)

    def del_link(self, code):
        if "links" in self.history:
            self.history["links"].remove(code)

    def set_base(self, x, y):
        if self.art is None:
            self.art = {}
        self.art["base_x"] = int(x) - PROV_SIZE // 2
        self.art["base_z"] = int(y) - PROV_SIZE // 2

    def set_centerpoint(self, pos):
        self.history["centerpoint"] = [pos[0], pos[1]]

    def get_centerpoint(self):
        if "centerpoint" in self.history:
            return (self.history["centerpoint"][0], self.history["centerpoint"][1])
        else:
            return (self.art["base_x"] + PROV_SIZE // 2, self.art["base_z"] + PROV_SIZE // 2)

    def blit(self, surface, scroll_x, scroll_y):
        if self.art is None:
            return
        surface.blit(self.surface, (
            self.art["base_x"] - scroll_x,
            self.art["base_z"] - scroll_y
        ))

    def blit_cp(self, surface, scroll_x, scroll_y):
        if "centerpoint" in self.history:
            pygame.draw.circle(surface, (0, 0, 0, 255), (
                self.history["centerpoint"][0] - scroll_x,
                self.history["centerpoint"][1] - scroll_y
                ),
                3
            )

    def blit_links(self, surface, scroll_x, scroll_y):
        if "links" not in self.history:
            return
        for link in self.history["links"]:
            pos = self.get_centerpoint()
            opos = provinces[link].get_centerpoint()
            pygame.draw.line(surface, (0, 0, 0, 255),
                (pos[0] - scroll_x, pos[1] - scroll_y),
                (opos[0] - scroll_x, opos[1] - scroll_y),
            2)

    def is_over(self, pos):
        if self.art is None:
            return False
        ep = (
            pos[0] - self.art["base_x"],
            pos[1] - self.art["base_z"]
        )
        if ep[0] < 0 or ep[0] >= PROV_SIZE or ep[1] < 0 or ep[1] >= PROV_SIZE:
            return False
        return self.surface.get_at(ep) == self.color
