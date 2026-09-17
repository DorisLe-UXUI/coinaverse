#!/usr/bin/env python3
"""
Build the whole KDL asset set to GLB.

    python3 kdl/build.py

Every asset is deterministic: same code + same seed -> byte-identical output,
so a rebuild after a palette change is safe to drop straight into the game.
"""

import os, sys, json, shutil
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))

import characters, props, rig

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
TMP = os.path.join(OUT, "_tmp.glb")

# The cast. One builder, many villagers -- all sharing a skeleton, so all
# sharing the same three animation clips.
CAST = [
    ("hero_boy",      dict(height=1.15, skin="skin_mid",   tunic="cloth_blue",  trim="cloth_gold",  hair="hair_dark",  hair_style="short")),
    ("hero_girl",     dict(height=1.12, skin="skin_light", tunic="cloth_plum",  trim="cloth_cream", hair="hair_warm",  hair_style="long")),
    ("friend_boy",    dict(height=1.08, skin="skin_deep",  tunic="cloth_green", trim="cloth_cream", hair="hair_dark",  hair_style="short")),
    ("friend_girl",   dict(height=1.10, skin="skin_mid",   tunic="cloth_red",   trim="cloth_gold",  hair="hair_dark",  hair_style="long")),
]

ADULTS = [
    ("villager_man",  dict(height=1.68, skin="skin_mid",   tunic="cloth_cream", trim="cloth_blue",  hair="hair_dark", build=1.10)),
    ("villager_woman",dict(height=1.58, skin="skin_light", tunic="cloth_blue",  trim="cloth_plum",  hair="hair_dark")),
    ("elder",         dict(height=1.60, skin="skin_light", tunic="cloth_cream", trim="cloth_gold",  hair="cloth_cream", build=1.04)),
    ("shepherd",      dict(height=1.66, skin="skin_deep",  tunic="cloth_gold",  trim="bark",        hair="hair_dark")),
]

PROPS = [
    ("tree_a",    props.tree,     dict(height=3.2, seed=1)),
    ("tree_b",    props.tree,     dict(height=2.6, seed=7, leaf="leaf_deep")),
    ("tree_c",    props.tree,     dict(height=3.8, seed=13, leaf="leaf_light", tiers=4)),
    ("palm_a",    props.palm,     dict(height=4.2, seed=2)),
    ("palm_b",    props.palm,     dict(height=3.4, seed=9)),
    ("bush_a",    props.bush,     dict(size=0.75, seed=3)),
    ("bush_b",    props.bush,     dict(size=0.55, seed=11, leaf="leaf_deep")),
    ("rock_a",    props.rock,     dict(size=0.9, seed=4)),
    ("rock_b",    props.rock,     dict(size=1.6, seed=8)),
    ("rock_c",    props.rock,     dict(size=0.5, seed=12, color="sand_deep")),
    ("house_a",   props.house,    dict(width=2.8, seed=5)),
    ("house_b",   props.house,    dict(width=3.4, seed=6, wall="sand_deep")),
    ("house_c",   props.house,    dict(width=2.2, seed=14, wall="clay")),
    ("well",      props.well,     dict(radius=0.6)),
    ("jar_a",     props.jar,      dict(height=0.55)),
    ("jar_b",     props.jar,      dict(height=0.38, color="sand_deep")),
    ("basket",    props.basket,   dict(size=0.45)),
    ("fence",     props.fence,    dict(length=2.0)),
    ("campfire",  props.campfire, dict(size=0.5)),
    ("scroll",    props.scroll,   dict(length=0.5)),
    ("church",    props.church,   dict(width=4.2, seed=3, style="church")),
    ("synagogue", props.church,   dict(width=4.2, seed=3, style="synagogue")),
    ("temple",    props.church,   dict(width=5.0, seed=3, style="temple")),
]

CLIPS = [("Idle", characters.clip_idle), ("Walk", characters.clip_walk),
         ("Wave", characters.clip_wave)]


def write(root, name, target_height=None):
    path = os.path.join(OUT, name + ".glb")
    rig.build_scene(root, target_height=target_height).export(path)
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {"characters": [], "props": []}

    for name, kw, builder in ([(n, k, characters.kid) for n, k in CAST] +
                              [(n, k, characters.adult) for n, k in ADULTS]):
        root = builder(**kw)
        path = write(root, name, target_height=kw["height"])
        for clip_name, fn in CLIPS:
            rig.add_clip(path, TMP, clip_name, fn())
            os.replace(TMP, path)
        tris = sum(len(m.faces) for p in root.walk() for m, _ in p.meshes)
        manifest["characters"].append(
            {"name": name, "file": name + ".glb", "tris": tris,
             "bytes": os.path.getsize(path), "height_m": kw["height"],
             "clips": [c for c, _ in CLIPS]})

    for name, fn, kw in PROPS:
        root = fn(**kw)
        path = write(root, name)
        tris = sum(len(m.faces) for p in root.walk() for m, _ in p.meshes)
        manifest["props"].append(
            {"name": name, "file": name + ".glb", "tris": tris,
             "bytes": os.path.getsize(path)})

    if os.path.exists(TMP):
        os.remove(TMP)

    total_b = sum(a["bytes"] for a in manifest["characters"] + manifest["props"])
    total_t = sum(a["tris"] for a in manifest["characters"] + manifest["props"])
    manifest["totals"] = {"assets": len(manifest["characters"]) + len(manifest["props"]),
                          "bytes": total_b, "tris": total_t}
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"{manifest['totals']['assets']} assets | "
          f"{total_t:,} tris | {total_b/1024:.1f} KB total")
    for a in manifest["characters"] + manifest["props"]:
        print(f"  {a['name']:15} {a['tris']:5d} tris  {a['bytes']/1024:6.1f} KB")


if __name__ == "__main__":
    main()
