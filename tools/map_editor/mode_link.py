import pygame

from .scroll import scroll
from ..common.province import provinces
from .input_state import InputState

class LinkMode(InputState):
    """Create connections between provinces."""
    def __init__(self):
        super(LinkMode, self).__init__()

        self.start = None

    def enter(self):
        pass

    def leave(self):
        pass

    def event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN or event.key == pygame.K_ESCAPE:
                return 2
        if event.type != pygame.MOUSEBUTTONUP:
            return 0
        if event.button == 1 or event.button == 3:
            if self.start is None:
                for prov in provinces:
                    pv = provinces[prov]
                    if pv.art is None:
                        continue
                    ep = (
                        event.pos[0] + scroll.x,
                        event.pos[1] + scroll.y
                    )
                    if pv.is_over(ep):
                        self.startPv = pv.code
                        self.start = ep
                        self.add = event.button == 1
            else:
                for prov in provinces:
                    pv = provinces[prov]
                    if pv.art is None:
                        continue
                    ep = (
                        event.pos[0] + scroll.x,
                        event.pos[1] + scroll.y
                    )
                    if pv.is_over(ep):
                        if self.add:
                            pv.add_link(self.startPv)
                            provinces[self.startPv].add_link(pv.code)
                        else:
                            pv.del_link(self.startPv)
                            provinces[self.startPv].del_link(pv.code)

                        self.start = None
                        self.startPv = None
            return 1
        return 0

    def frame(self):
        mp = pygame.mouse.get_pos()
        self.end = (
            mp[0] + scroll.x,
            mp[1] + scroll.y
        )

    def render(self, screen):
        if self.start is None:
            return
        pygame.draw.line(
            screen,
            (0, 50, 0, 255) if self.add else (200, 0, 0, 255),
            (self.start[0] - scroll.x, self.start[1] - scroll.y),
            (self.end[0] - scroll.x, self.end[1] - scroll.y),
            3
        )
