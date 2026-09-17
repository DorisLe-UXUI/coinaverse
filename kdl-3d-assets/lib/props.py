"""
Props and environment pieces.

Every generator takes a seed so a level can be populated with varied
instances that are still reproducible -- same seed, same village, every
build. Randomness without a seed is how art review becomes impossible.
"""

import numpy as np
import core
from rig import Part


def _rng(seed):
    return np.random.default_rng(int(seed))


# ---------------- vegetation ----------------

def tree(height=3.2, seed=0, leaf="leaf_mid", trunk="bark", tiers=3):
    """Stylised canopy tree: tapering stack of rounded tiers."""
    r = _rng(seed)
    H = float(height)
    root = Part("root", (0, 0, 0))
    tr = root.child("trunk", (0, 0, 0))
    th = H * 0.34
    tr.add(core.cyl(H * 0.075, th, 6, trunk), offset=(0, 0, th / 2))

    shades = [leaf, "leaf_light", "leaf_deep"]
    z = th * 0.92
    w = H * 0.42
    for i in range(int(tiers)):
        k = 1.0 - i / max(tiers, 1) * 0.42
        tier = tr.child(f"canopy_{i}", (0, 0, z))
        tier.add(core.round_box((w * k, w * k * 0.94, H * 0.19), 0.42, 1,
                                shades[i % len(shades)]),
                 offset=(r.uniform(-0.02, 0.02) * H, r.uniform(-0.02, 0.02) * H, 0))
        z += H * 0.15
    return root


def bush(size=0.7, seed=0, leaf="leaf_light"):
    r = _rng(seed)
    S = float(size)
    root = Part("root", (0, 0, 0))
    for i in range(3):
        k = r.uniform(0.70, 1.05)
        root.add(core.blob((S * k, S * k * 0.92, S * k * 0.88), seed=seed * 7 + i,
                           jitter=0.22, color=leaf if i else "leaf_mid"),
                 offset=(r.uniform(-0.26, 0.26) * S, r.uniform(-0.22, 0.22) * S,
                         S * r.uniform(0.34, 0.52)))
    return root


def palm(height=4.0, seed=0):
    """Date palm -- the signature silhouette for a Near-Eastern setting."""
    r = _rng(seed)
    H = float(height)
    root = Part("root", (0, 0, 0))
    tr = root.child("trunk", (0, 0, 0))
    # one tapered trunk, slightly leaning: stacking offset segments produced
    # a visible staircase down the side
    # a single straight tapered trunk. Any stacked-segment approach leaves a
    # visible staircase down one side, which is worse than no taper at all.
    tr.add(core.at(core.cyl(H * 0.050, H * 0.66, 7, "bark_light"),
                   scale=(1.0, 1.0, 1.0)),
           offset=(0, 0, H * 0.33))
    tr.add(core.cyl(H * 0.038, H * 0.20, 7, "bark_light"),
           offset=(0, 0, H * 0.70))

    crown = tr.child("crown", (0, 0, H * 0.72))
    # two rings of fronds at different droop angles -- one flat ring reads
    # as a pinwheel from any raised camera
    for ring, (n, ln, droop, zo) in enumerate([(6, 0.36, -34, 0.022),
                                               (5, 0.26, -56, -0.030)]):
        for i in range(n):
            a = i / n * 2 * np.pi + (0.45 if ring else 0.0) + r.uniform(-.12, .12)
            frond = core.chamfer_box((H * ln, H * 0.105, H * 0.040), 0.40,
                                     "leaf_mid" if (i + ring) % 2 else "leaf_deep")
            crown.add(core.at(frond,
                              pos=(np.cos(a) * H * ln * 0.46,
                                   np.sin(a) * H * ln * 0.46, H * zo),
                              rot=(0, droop, np.degrees(a))))
    crown.add(core.blob((H * 0.10, H * 0.10, H * 0.085), seed=seed, jitter=0.18,
                        color="bark"), offset=(0, 0, H * 0.01))
    return root


def rock(size=0.9, seed=0, color="stone"):
    """A big lump with one or two smaller ones nestled against it."""
    r = _rng(seed)
    S = float(size)
    root = Part("root", (0, 0, 0))
    root.add(core.blob((S, S * r.uniform(0.80, 1.00), S * r.uniform(0.62, 0.86)),
                       seed=seed, jitter=0.26, color=color),
             offset=(0, 0, S * 0.34))
    for i in range(int(r.integers(1, 3))):
        k = r.uniform(0.34, 0.52)
        root.add(core.blob((S * k, S * k * 0.9, S * k * 0.8), seed=seed + 31 + i,
                           jitter=0.30, color="stone_deep"),
                 offset=(r.uniform(-0.55, 0.55) * S, r.uniform(-0.5, 0.5) * S,
                         S * k * 0.42))
    return root


# ---------------- built environment ----------------

def house(width=2.8, seed=0, wall="sand", roof_c="roof", door_c="wood"):
    """Flat-roofed dwelling with a stair -- generic Near-Eastern village."""
    r = _rng(seed)
    W = float(width)
    D = W * r.uniform(0.78, 0.95)
    Hh = W * r.uniform(0.62, 0.80)
    root = Part("root", (0, 0, 0))
    body = root.child("body", (0, 0, 0))
    body.add(core.chamfer_box((W, D, Hh), 0.05, wall), offset=(0, 0, Hh / 2))
    body.add(core.chamfer_box((W * 1.06, D * 1.06, Hh * 0.10), 0.18, roof_c),
             offset=(0, 0, Hh * 1.02))
    # door + window, inset on the +Y face
    body.add(core.chamfer_box((W * 0.20, D * 0.06, Hh * 0.46), 0.10, door_c),
             offset=(W * r.uniform(-0.18, 0.18), D * 0.50, Hh * 0.23))
    body.add(core.chamfer_box((W * 0.16, D * 0.06, Hh * 0.16), 0.12, "sky_soft"),
             offset=(W * r.uniform(-0.32, 0.32), D * 0.50, Hh * 0.66))
    # outside stair to the roof
    steps = int(r.integers(3, 5))
    for i in range(steps):
        sh = Hh * (0.16 + i * (0.86 / steps))
        body.add(core.chamfer_box((W * 0.26, D * 0.17, sh), 0.06, "clay"),
                 offset=(W * 0.60, -D * (0.30 - i * 0.17), sh / 2))
    return root


def well(radius=0.6, seed=0):
    root = Part("root", (0, 0, 0))
    R = float(radius)
    root.add(core.cyl(R, R * 0.9, 10, "stone"), offset=(0, 0, R * 0.45))
    root.add(core.cyl(R * 0.82, R * 0.12, 10, "water_deep"), offset=(0, 0, R * 0.90))
    for sx in (-1, 1):
        root.add(core.chamfer_box((R * 0.16, R * 0.16, R * 1.5), 0.24, "wood"),
                 offset=(sx * R * 0.82, 0, R * 1.30))
    root.add(core.chamfer_box((R * 2.0, R * 0.34, R * 0.20), 0.30, "wood"),
             offset=(0, 0, R * 2.02))
    return root


def jar(height=0.55, seed=0, color="clay"):
    """Clay water jar -- the most-reused set dressing in this setting."""
    H = float(height)
    root = Part("root", (0, 0, 0))
    root.add(core.round_box((H * 0.68, H * 0.68, H * 0.72), 0.44, 1, color),
             offset=(0, 0, H * 0.38))
    root.add(core.cyl(H * 0.17, H * 0.22, 8, color), offset=(0, 0, H * 0.82))
    root.add(core.cyl(H * 0.23, H * 0.06, 8, color), offset=(0, 0, H * 0.93))
    return root


def basket(size=0.45, seed=0):
    S = float(size)
    root = Part("root", (0, 0, 0))
    root.add(core.cyl(S * 0.52, S * 0.62, 8, "bark_light"), offset=(0, 0, S * 0.31))
    root.add(core.cyl(S * 0.58, S * 0.10, 8, "bark"), offset=(0, 0, S * 0.60))
    return root


def fence(length=2.0, seed=0, posts=4):
    L = float(length)
    root = Part("root", (0, 0, 0))
    for i in range(int(posts)):
        x = -L / 2 + L * i / (posts - 1)
        root.add(core.chamfer_box((L * 0.045, L * 0.045, L * 0.34), 0.22, "wood"),
                 offset=(x, 0, L * 0.17))
    for k in (0.60, 0.95):
        root.add(core.chamfer_box((L, L * 0.028, L * 0.035), 0.20, "bark_light"),
                 offset=(0, 0, L * 0.34 * k))
    return root


def campfire(size=0.5, seed=0):
    r = _rng(seed)
    S = float(size)
    root = Part("root", (0, 0, 0))
    for i in range(6):
        a = i / 6 * 2 * np.pi
        root.add(core.at(core.chamfer_box((S * 0.5, S * 0.14, S * 0.12), 0.26, "bark"),
                         pos=(np.cos(a) * S * 0.22, np.sin(a) * S * 0.22, S * 0.08),
                         rot=(0, 0, np.degrees(a))))
    # flames: concentric cones are pointless -- the outer one hides the rest.
    # Stagger them so each inner, brighter tongue pokes out above the last.
    flame = root.child("flame", (0, 0, S * 0.12))
    for rad, hgt, z, c in [(0.32, 0.62, 0.00, "cloth_red"),
                           (0.22, 0.56, 0.30, "glow_gold"),
                           (0.12, 0.40, 0.62, "glow_warm")]:
        flame.add(core.cone(S * rad, S * hgt, 6, c),
                  offset=(0, 0, S * (z + hgt * 0.5)))
    return root


def scroll(length=0.5, seed=0):
    """Story item -- scrolls carry narrative beats in a faith-based game."""
    L = float(length)
    root = Part("root", (0, 0, 0))
    root.add(core.at(core.cyl(L * 0.16, L * 0.92, 8, "cloth_cream"),
                     rot=(0, 90, 0)), offset=(0, 0, L * 0.16))
    for sx in (-1, 1):
        root.add(core.at(core.cyl(L * 0.09, L * 0.10, 8, "wood"), rot=(0, 90, 0)),
                 offset=(sx * L * 0.50, 0, L * 0.16))
    return root


# ---------------- places of worship ----------------

def church(width=4.2, seed=0, wall="cloth_cream", roof_c="roof",
           door_c="wood", accent="cloth_blue", style="church"):
    """
    Place of worship, in three historical flavours from one generator.

      style="church"    nave + pitched roof + bell tower + cross.
                        Reads instantly to a modern child.
      style="synagogue" flat-roofed stone hall with a columned porch.
                        Period-correct for a Near-Eastern village.
      style="temple"    larger, raised on a stepped platform, full colonnade.

    Sized to dominate the village: a house here is ~2.8 m wide, this is
    ~4.2 m wide and 3-4x taller. A place of worship that does not read as
    the biggest thing in the settlement has failed at its one job.
    """
    r = _rng(seed)
    W = float(width)
    D = W * 1.75                      # long hall, not a square box
    root = Part("root", (0, 0, 0))

    # ---- plinth: lifts the building and reads as 'approach' from any angle
    plinth_h = W * (0.16 if style == "temple" else 0.07)
    steps = 3 if style == "temple" else 2
    base = root.child("base", (0, 0, 0))
    for i in range(steps):
        k = 1.0 - i * 0.055
        base.add(core.chamfer_box((W * 1.20 * k, D * 1.12 * k,
                                   plinth_h / steps), 0.08, "stone"),
                 offset=(0, 0, plinth_h * (i + 0.5) / steps))

    z0 = plinth_h
    body = root.child("body", (0, 0, z0))

    if style == "church":
        wall_h = W * 0.86
        body.add(core.chamfer_box((W, D, wall_h), 0.04, wall),
                 offset=(0, 0, wall_h / 2))
        # pitched roof: a prism laid along the hall
        roof_h = W * 0.46
        body.add(core.at(core.wedge((D * 1.05, W * 1.06, roof_h), roof_c),
                         rot=(0, 0, 90)),
                 offset=(0, 0, wall_h + roof_h / 2))

        # bell tower at the front, taller than the ridge
        tw = W * 0.40
        tower_h = wall_h * 1.62
        tower = body.child("tower", (0, D * 0.44, 0))
        tower.add(core.chamfer_box((tw, tw, tower_h), 0.05, wall),
                  offset=(0, 0, tower_h / 2))
        # belfry openings
        for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            tower.add(core.chamfer_box((tw * (0.30 if sx else 0.50), 
                                        tw * (0.50 if sx else 0.30),
                                        tower_h * 0.13), 0.14, "hair_dark"),
                      offset=(sx * tw * 0.49, sy * tw * 0.49, tower_h * 0.86))
        # spire + cross
        spire_h = tw * 1.45
        tower.add(core.cone(tw * 0.76, spire_h, 4, roof_c),
                  offset=(0, 0, tower_h + spire_h * 0.5))
        cz = tower_h + spire_h
        tower.add(core.chamfer_box((tw * 0.075, tw * 0.075, tw * 0.46), 0.26,
                                   "glow_gold"),
                  offset=(0, 0, cz + tw * 0.23))
        tower.add(core.chamfer_box((tw * 0.30, tw * 0.075, tw * 0.075), 0.26,
                                   "glow_gold"),
                  offset=(0, 0, cz + tw * 0.30))

        # arched door on the tower face
        dw, dh = tw * 0.52, wall_h * 0.52
        tower.add(core.chamfer_box((dw, tw * 0.07, dh), 0.10, door_c),
                  offset=(0, tw * 0.50, dh / 2))
        tower.add(core.at(core.cyl(dw * 0.50, tw * 0.07, 8, door_c),
                          rot=(90, 0, 0)),
                  offset=(0, tw * 0.50, dh))

        # stained glass down both flanks -- the one place colour is loud
        glass = ["cloth_red", "cloth_blue", "glow_gold", "cloth_plum",
                 "leaf_mid", "water"]
        for i in range(4):
            y = D * (-0.30 + i * 0.20)
            for sx in (1, -1):
                c = glass[int(r.integers(0, len(glass)))]
                body.add(core.chamfer_box((W * 0.05, D * 0.085, wall_h * 0.34),
                                          0.14, c),
                         offset=(sx * W * 0.49, y, wall_h * 0.52))
        # rose window over the door
        body.add(core.at(core.cyl(W * 0.13, W * 0.05, 8, "glow_gold"),
                         rot=(90, 0, 0)),
                 offset=(0, D * 0.50, wall_h * 0.70))

    else:
        # synagogue / temple: flat roof, stone, colonnade at the entrance
        stone = "sand" if style == "synagogue" else "stone"
        wall_h = W * (0.92 if style == "synagogue" else 1.15)
        body.add(core.chamfer_box((W, D, wall_h), 0.03, stone),
                 offset=(0, 0, wall_h / 2))
        body.add(core.chamfer_box((W * 1.07, D * 1.05, wall_h * 0.09), 0.16,
                                  "sand_deep"),
                 offset=(0, 0, wall_h * 1.02))
        if style == "temple":
            # clerestory lantern -- the silhouette cue that separates a
            # temple from a synagogue at a glance
            lh = wall_h * 0.30
            body.add(core.chamfer_box((W * 0.62, D * 0.52, lh), 0.06, stone),
                     offset=(0, -D * 0.06, wall_h * 1.06 + lh / 2))
            body.add(core.chamfer_box((W * 0.70, D * 0.58, wall_h * 0.07),
                                      0.18, "sand_deep"),
                     offset=(0, -D * 0.06, wall_h * 1.06 + lh))
            for sx in (1, -1):
                body.add(core.chamfer_box((W * 0.03, D * 0.30, lh * 0.52),
                                          0.14, "glow_warm"),
                         offset=(sx * W * 0.31, -D * 0.06,
                                 wall_h * 1.06 + lh * 0.52))

        # Columns need air between them or the porch reads as a solid wall.
        # Keep capital width well under the gap: 4 columns across the full
        # facade, spaced ~0.36W, capitals 0.11W.
        n_col = 4
        porch_d = W * 0.42
        col_h = wall_h * 0.92
        span = W * 1.08
        for i in range(n_col):
            x = -span / 2 + span * i / (n_col - 1)
            col = body.child(f"col_{i}", (x, D * 0.50 + porch_d * 0.5, 0))
            col.add(core.cyl(W * 0.042, col_h, 8, stone),
                    offset=(0, 0, col_h / 2))
            for zz, w in ((0.025, 0.105), (0.975, 0.115)):
                col.add(core.chamfer_box((W * w, W * w, col_h * 0.045),
                                         0.22, stone),
                        offset=(0, 0, col_h * zz))
        # porch lintel
        body.add(core.chamfer_box((span * 1.10, porch_d, wall_h * 0.10), 0.14,
                                  "sand_deep"),
                 offset=(0, D * 0.50 + porch_d * 0.5, col_h * 1.025))

        dw, dh = W * 0.38, wall_h * 0.62
        body.add(core.chamfer_box((dw, W * 0.05, dh), 0.08, door_c),
                 offset=(0, D * 0.505, dh / 2))
        body.add(core.chamfer_box((dw * 1.16, W * 0.06, wall_h * 0.06), 0.18,
                                  "sand_deep"),
                 offset=(0, D * 0.505, dh + wall_h * 0.03))
        if style == "synagogue":
            # menorah-ish emblem above the door, kept abstract
            body.add(core.chamfer_box((W * 0.20, W * 0.04, W * 0.035), 0.24,
                                      "glow_gold"),
                     offset=(0, D * 0.505, dh + W * 0.22))
            for k in (-1, 0, 1):
                body.add(core.chamfer_box((W * 0.03, W * 0.04, W * 0.14), 0.24,
                                          "glow_gold"),
                         offset=(k * W * 0.08, D * 0.505, dh + W * 0.30))
        for i in range(3):
            y = D * (-0.28 + i * 0.26)
            for sx in (1, -1):
                body.add(core.chamfer_box((W * 0.045, D * 0.07, wall_h * 0.26),
                                          0.12, "sky_soft"),
                         offset=(sx * W * 0.49, y, wall_h * 0.62))

    return root
