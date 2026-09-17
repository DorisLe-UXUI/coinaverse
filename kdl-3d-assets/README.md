# KingdomLand Kids — 3D asset set

28 game-ready `.glb` assets for a small open-world adventure, built for
three.js on the web. Low-poly stylised, flat-shaded, no textures.

**Total: ~18,800 triangles, ~795 KB for the entire set.**

---

## What's here

```
kdl/
  build.py          run this to rebuild every asset
  lib/
    palette.py      all colours — one edit re-skins everything
    core.py         low-poly primitives (chamfer box, blob, limb, …)
    characters.py   parametric people + animation clips
    props.py        vegetation, buildings, set dressing
    rig.py          rigid-part rig + glTF animation writer
  out/              the .glb files + manifest.json  ← the deliverable
  demo/index.html   interactive viewer (open in a browser)
  preview/          rendered contact sheets
```

## Using the assets

Files are standard glTF 2.0 binary, **Y-up, facing +Z, feet on y=0**, in
metres. They drop into three.js with no rotation or rescaling:

```js
const gltf = await new GLTFLoader().loadAsync('out/hero_boy.glb');
scene.add(gltf.scene);

const mixer = new THREE.AnimationMixer(gltf.scene);
mixer.clipAction(gltf.animations.find(a => a.name === 'Walk')).play();
```

Every character ships the same three clips — **Idle**, **Walk**, **Wave** —
because they all share one skeleton. Clips are interchangeable across the
whole cast.

Set `material.flatShading = true` on load to get the faceted look; the
geometry is authored for it.

## The cast

| Asset | Height | Tris |
|---|---|---|
| hero_boy, hero_girl | 1.15 / 1.12 m | ~1,130 |
| friend_boy, friend_girl | 1.08 / 1.10 m | ~1,130 |
| villager_man, villager_woman | 1.68 / 1.58 m | ~1,290 |
| elder, shepherd | 1.60 / 1.66 m | ~1,290 |

31 assets in total.

Children and adults use **different proportions**, not different scales —
a child is ~3.3 heads tall, an adult ~5. Scaling a child up produces a
giant toddler, which is why `kid()` and `adult()` are separate presets.

## Props

Trees (3), palms (2), bushes (2), rocks (3), houses (3), well, jars (2),
basket, fence, campfire, scroll.

## Places of worship

One generator, `props.church(style=…)`, produces three:

| style | What it is | Use when |
|---|---|---|
| `church` | Nave, pitched roof, bell tower, spire, cross, stained glass | The story is set in the present day — a child recognises it instantly |
| `synagogue` | Flat-roofed stone hall, columned porch, menorah emblem | The story is set in the Biblical period — this is the period-correct building |
| `temple` | Larger, stepped platform, full colonnade, roof lantern | The Temple as a landmark or destination |

A church with a bell tower is Christian architecture from centuries after
the Biblical period. Dropping one into a Near-Eastern village of flat-roofed
houses, palms and clay jars breaks the setting. If the game is set in that
world, use `synagogue`. If it is set today, use `church`. Both are built,
so the choice is a config line, not a rebuild.

All three are sized to dominate: a house is ~2.8 m wide, these are 4.2-5.0 m
wide and 3-4x taller.

## Rebuilding

```bash
pip install numpy trimesh pygltflib scipy
python3 kdl/build.py
```

Output is deterministic — same code and seed give byte-identical files, so
a rebuild after a palette change is safe to ship straight into the game.

## Changing the look

Edit `lib/palette.py` and rebuild. Every asset reads its colours from
there, so the whole set re-skins together and stays consistent.

To add a villager, add one line to `CAST` / `ADULTS` in `build.py` — skin,
clothing, height and build are arguments. New NPCs cost a line of config,
not a modelling session.

## Known limits

- **Colours are placeholders.** They are not the KDL brand palette. Swap
  the values in `palette.py` for the real ones.
- **No facial expression** beyond eyes. Deliberate at this scale, but if
  the game needs emotion, that's a swappable head part, not a rework.
- **Robes are knee-length** so the walk cycle doesn't push legs through
  cloth. Full-length robes would need the legs hidden and a different clip.
- **No LODs.** At ~1,200 tris a character, a few hundred instances are fine
  on mobile; past that you'd want instancing or merged static geometry.
