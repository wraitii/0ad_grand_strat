import pygame

from .scroll import scroll
from .province import provinces
from .input_state import InputState

class CenterPointMode(InputState):
    """Create connections between provinces."""
    def __init__(self):
        super(CenterPointMode, self).__init__()

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
        elif event.button == 1 or event.button == 3:
            for prov in provinces:
                pv = provinces[prov]
                if pv.art is None:
                    continue
                ep = (
                    event.pos[0] + scroll.x,
                    event.pos[1] + scroll.y
                )
                if pv.is_over(ep):
                    if event.button == 3:
                        self.province = pv.code
                    else:
                        provinces[self.province].set_centerpoint(ep)
            return 1
        return 0

    def frame(self):
        pass

    def render(self, screen):
        pass
