ARENAS = {
    "village-field": {
        "play_bounds": {"left": 160, "right": 1037, "top": 68, "bottom": 634},
    },
    "field-court": {
        "play_bounds": {"left": 152, "right": 1047, "top": 67, "bottom": 635},
    },
}

DEFAULT_ARENA_ID = "village-field"


def get_arena(arena_id=None):
    return ARENAS.get(arena_id) or ARENAS[DEFAULT_ARENA_ID]
