"""
KDL palette — PLACEHOLDER VALUES.
Swap these for the real KingdomLand Kids brand colors; every asset in the
library reads from here, so one edit re-skins the entire set.
"""

PALETTE = {
    # warm / skin / character
    "skin_light":  "#F6D5B8",
    "skin_mid":    "#D9A273",
    "skin_deep":   "#8C5A3C",
    "hair_dark":   "#3B2A24",
    "hair_warm":   "#7A4A2B",

    # clothing — bright, high-chroma, kid-friendly
    "cloth_red":   "#E0574B",
    "cloth_blue":  "#4A8FD4",
    "cloth_gold":  "#F2B544",
    "cloth_green": "#5BAE6B",
    "cloth_cream": "#F5EBDA",
    "cloth_plum":  "#9B6BB5",

    # nature
    "leaf_light":  "#7BC96F",
    "leaf_mid":    "#4E9B52",
    "leaf_deep":   "#2F6B3C",
    "bark":        "#6B4A32",
    "bark_light":  "#8A6244",

    # ground / stone / built
    "sand":        "#E8CFA0",
    "sand_deep":   "#C9A870",
    "stone":       "#A8A49B",
    "stone_deep":  "#78746C",
    "clay":        "#C97F5B",
    "wood":        "#B07D4F",
    "roof":        "#C4654F",

    # water / sky accents
    "water":       "#5FBCD3",
    "water_deep":  "#3A8FA8",
    "sky_soft":    "#BFE3F0",

    # light / divine accent — used sparingly, reserved for story beats
    "glow_warm":   "#FFE9A8",
    "glow_gold":   "#F0C44C",
}


def rgba(name, alpha=1.0):
    """Hex name -> float RGBA tuple for glTF PBR baseColorFactor."""
    h = PALETTE[name].lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (r, g, b, alpha)


def rgba255(name, alpha=255):
    h = PALETTE[name].lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)] + [alpha]
