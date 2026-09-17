"""
Parametric character builder.

One function, many villagers. Skin tone, clothing, height and build are
arguments -- so an entire cast shares proportions, pivot placement and
tri-budget automatically. That shared skeleton is also what lets every
character reuse the same animation clips.
"""

import numpy as np
import core
from rig import Part


def person(height=1.15, skin="skin_mid", tunic="cloth_blue", trim="cloth_gold",
           hair="hair_dark", build=1.0, hair_style="short", pants="cloth_cream",
           shoes="bark", head_f=0.300, leg_f=0.285, torso_f=0.330,
           shoulder_f=0.228, robe=False):
    """
    Child-proportioned character, ~4 heads tall. Units are metres,
    feet on z=0, +Z up. Returns the root Part.

    Proportions are deliberate: an oversized head reads as 'child' and
    stays legible at phone size, but the legs still have to carry ~38% of
    total height or the figure reads as a seated blob rather than a kid.
    """
    H = float(height)
    head_d   = H * float(head_f)   # head:body ratio is what reads as age,
    leg_span = H * float(leg_f)    # not overall height -- a scaled-up child
    torso_h  = H * float(torso_f)  # is a giant toddler, not an adult
    # shoulders scale with body height, NOT head size -- tying them to the
    # head leaves an adult (small head) with a torso too narrow for its arms
    torso_w  = H * float(shoulder_f) * build
    torso_d  = torso_w * 0.68
    arm_span = torso_h * 1.28     # hands reach mid-thigh, not the waist
    arm_r    = head_d * 0.098
    leg_r    = head_d * 0.135     # chunkier legs; thin legs read as adult

    root = Part("root", (0, 0, 0))
    hips = root.child("hips", (0, 0, leg_span))

    # --- torso: body block + shoulder yoke in the trim colour
    torso = hips.child("torso", (0, 0, 0))
    torso.add(core.chamfer_box((torso_w, torso_d, torso_h * 0.70), 0.24, tunic),
              offset=(0, 0, torso_h * 0.35))
    torso.add(core.chamfer_box((torso_w * 1.06, torso_d * 1.06, torso_h * 0.26),
                               0.30, trim),
              offset=(0, 0, torso_h * 0.83))

    # --- head sits directly on the yoke, no neck (neck reads as adult)
    head = torso.child("head", (0, 0, torso_h * 0.96))
    head.add(core.round_box((head_d, head_d * 0.86, head_d * 0.92), 0.38, 1, skin),
             offset=(0, 0, head_d * 0.46))

    # --- face: two eyes, sitting slightly proud of the skull so they never
    # z-fight. Character faces +Y. No mouth -- at this scale a mouth reads as
    # a smudge, and eyes alone carry the expression.
    for ex in (1.0, -1.0):
        head.add(core.chamfer_box((head_d * 0.125, head_d * 0.07,
                                   head_d * 0.165), 0.30, "hair_dark"),
                 offset=(ex * head_d * 0.200, head_d * 0.432, head_d * 0.455))
    if hair_style == "short":
        head.add(core.round_box((head_d * 1.03, head_d * 0.93, head_d * 0.34),
                                0.48, 1, hair),
                 offset=(0, 0, head_d * 0.745))
    elif hair_style == "long":
        head.add(core.round_box((head_d * 1.04, head_d * 0.94, head_d * 0.36),
                                0.48, 1, hair),
                 offset=(0, 0, head_d * 0.74))
        head.add(core.chamfer_box((head_d * 0.90, head_d * 0.26, head_d * 0.64),
                                  0.32, hair),
                 offset=(0, -head_d * 0.38, head_d * 0.22))
    elif hair_style == "wrap":
        # head covering: a shallow cap plus a short fall at the back.
        # Anything taller than ~0.38 of head height reads as a helmet.
        head.add(core.round_box((head_d * 1.06, head_d * 0.94, head_d * 0.36),
                                0.48, 1, trim),
                 offset=(0, 0, head_d * 0.745))
        head.add(core.chamfer_box((head_d * 0.94, head_d * 0.24, head_d * 0.46),
                                  0.34, trim),
                 offset=(0, -head_d * 0.40, head_d * 0.40))
    elif hair_style == "bald":
        pass

    # --- arms: pivot at the shoulder so one rotation swings the whole limb
    for side, sx in (("L", 1.0), ("R", -1.0)):
        sh = torso.child(f"arm_{side}", (sx * torso_w * 0.62, 0, torso_h * 0.78))
        sh.add(core.limb(arm_r, arm_span * 0.80, 6, tunic),
               offset=(0, 0, -arm_span * 0.40))
        hand = sh.child(f"hand_{side}", (0, 0, -arm_span * 0.84))
        hand.add(core.round_box((arm_r * 2.2, arm_r * 1.9, arm_r * 2.0),
                                0.46, 1, skin))

    # --- robe: a skirt hung off the hips, not the legs, so it stays put
    # while the legs swing underneath. Ankle-length for adults.
    if robe:
        # knee-length, not ankle-length: a full-length robe swallows the legs
        # and the walk cycle pushes them straight through the cloth.
        # Two stacked blocks give it a flare without a tapered mesh.
        rl = leg_span * 0.54
        hips.add(core.chamfer_box((torso_w * 1.02, torso_d * 1.08, rl * 0.62),
                                  0.20, tunic),
                 offset=(0, 0, -rl * 0.31))
        hips.add(core.chamfer_box((torso_w * 1.14, torso_d * 1.20, rl * 0.46),
                                  0.22, tunic),
                 offset=(0, 0, -rl * 0.77))
        hips.add(core.chamfer_box((torso_w * 1.18, torso_d * 1.24, rl * 0.11),
                                  0.34, trim),
                 offset=(0, 0, -rl * 1.00))

    # --- legs: set wide enough that the torso never hides them
    for side, sx in (("L", 1.0), ("R", -1.0)):
        lg = hips.child(f"leg_{side}", (sx * torso_w * 0.36, 0, 0))
        lg.add(core.limb(leg_r, leg_span * 0.82, 6, pants),
               offset=(0, 0, -leg_span * 0.41))
        ft = lg.child(f"foot_{side}", (0, 0, -leg_span * 0.84))
        ft.add(core.chamfer_box((leg_r * 2.1, leg_r * 3.2, leg_r * 1.4), 0.32,
                                shoes),
               offset=(0, leg_r * 0.50, -leg_r * 0.62))

    return root


# ---- animation clips, authored against the skeleton above ----

def clip_idle(period=2.6):
    """Breathing + tiny sway. Never fully still -- dead-still reads as broken."""
    t = [0.0, period * 0.5, period]
    return {
        "hips":  {"translation": [(t[0], (0, 0, 0)),
                                  (t[1], (0, 0, 0.012)),
                                  (t[2], (0, 0, 0))]},
        "torso": {"rotation": [(t[0], (0, 0, 0)), (t[1], (2.0, 0, 0)),
                               (t[2], (0, 0, 0))]},
        "head":  {"rotation": [(t[0], (0, 0, 3.0)), (t[1], (-1.5, 0, -2.0)),
                               (t[2], (0, 0, 3.0))]},
        "arm_L": {"rotation": [(t[0], (0, 0, 0)), (t[1], (-3.5, 0, 0)),
                               (t[2], (0, 0, 0))]},
        "arm_R": {"rotation": [(t[0], (0, 0, 0)), (t[1], (-3.5, 0, 0)),
                               (t[2], (0, 0, 0))]},
    }


def clip_walk(period=0.9, swing=32.0):
    """Contralateral swing + hip bob at double frequency."""
    q = period / 4.0
    t = [0, q, 2 * q, 3 * q, period]
    bob = 0.026
    return {
        "hips":  {"translation": [(t[0], (0, 0, 0)), (t[1], (0, 0, bob)),
                                  (t[2], (0, 0, 0)), (t[3], (0, 0, bob)),
                                  (t[4], (0, 0, 0))]},
        "leg_L": {"rotation": [(t[0], (swing, 0, 0)), (t[2], (-swing, 0, 0)),
                               (t[4], (swing, 0, 0))]},
        "leg_R": {"rotation": [(t[0], (-swing, 0, 0)), (t[2], (swing, 0, 0)),
                               (t[4], (-swing, 0, 0))]},
        "arm_L": {"rotation": [(t[0], (-swing * 0.72, 0, 0)),
                               (t[2], (swing * 0.72, 0, 0)),
                               (t[4], (-swing * 0.72, 0, 0))]},
        "arm_R": {"rotation": [(t[0], (swing * 0.72, 0, 0)),
                               (t[2], (-swing * 0.72, 0, 0)),
                               (t[4], (swing * 0.72, 0, 0))]},
        "torso": {"rotation": [(t[0], (0, 0, -3.0)), (t[2], (0, 0, 3.0)),
                               (t[4], (0, 0, -3.0))]},
    }


def clip_wave(period=1.8):
    """Greeting -- the single most useful NPC clip in a kids' adventure game."""
    t = [0, period * 0.18, period * 0.38, period * 0.58, period * 0.78, period]
    up = (-150.0, 0, -18.0)
    return {
        "arm_R": {"rotation": [(t[0], (0, 0, 0)), (t[1], up),
                               (t[2], (-150.0, 0, 8.0)), (t[3], up),
                               (t[4], (-150.0, 0, 8.0)), (t[5], (0, 0, 0))]},
        "head":  {"rotation": [(t[0], (0, 0, 0)), (t[2], (0, 0, -6.0)),
                               (t[5], (0, 0, 0))]},
        "torso": {"rotation": [(t[0], (0, 0, 0)), (t[2], (0, 0, -4.0)),
                               (t[5], (0, 0, 0))]},
    }


def kid(height=1.15, **kw):
    """Child proportions: ~3.3 heads. The default."""
    kw.setdefault("head_f", 0.300)
    kw.setdefault("leg_f", 0.285)
    kw.setdefault("torso_f", 0.330)
    return person(height=height, **kw)


def adult(height=1.62, **kw):
    """
    Adult proportions: ~5 heads. Still stylised, but the smaller head and
    longer legs are what make an adult stand next to a child and read as one.
    """
    kw.setdefault("head_f", 0.205)
    kw.setdefault("leg_f", 0.445)
    kw.setdefault("torso_f", 0.330)
    kw.setdefault("shoulder_f", 0.250)
    kw.setdefault("hair_style", "wrap")
    kw.setdefault("robe", True)
    return person(height=height, **kw)
