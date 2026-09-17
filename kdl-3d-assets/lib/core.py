"""
Low-poly stylized primitives for the KDL asset library.

Design rules baked in here (change them here, not per-asset):
  * Every edge is chamfered, never razor-sharp -> soft, kid-safe silhouette.
  * Flat shading (unmerged vertices) -> crisp facets that catch light,
    the Monument Valley / Alto look. No smooth-shaded blobs.
  * Low segment counts by default. A prop has no business over ~400 tris.
  * Colour comes from a flat PBR baseColorFactor, no textures at all.
    That is what keeps the whole set under a few hundred KB.
"""

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals

from palette import rgba


def _finish(mesh, color, roughness=0.92, flat=True):
    """Apply flat colour + flat shading. Every primitive exits through here."""
    if flat:
        mesh.unmerge_vertices()
    mat = PBRMaterial(
        baseColorFactor=rgba(color) if isinstance(color, str) else color,
        metallicFactor=0.0,
        roughnessFactor=roughness,
        doubleSided=False,
    )
    mesh.visual = TextureVisuals(material=mat)
    return mesh


def chamfer_box(size=(1, 1, 1), chamfer=0.12, color="cloth_blue", **kw):
    """
    A box with all 8 corners cut. The workhorse primitive.
    chamfer is a fraction (0-0.5) of the smallest dimension.
    ~44 tris. Reads as 'soft cube' at any distance.
    """
    sx, sy, sz = (float(v) / 2.0 for v in size)
    c = float(chamfer) * min(sx, sy, sz) * 2.0
    c = max(c, 1e-4)
    pts = []
    for ix in (-1, 1):
        for iy in (-1, 1):
            for iz in (-1, 1):
                x, y, z = ix * sx, iy * sy, iz * sz
                # three cut points per corner
                pts.append((x - ix * c, y, z))
                pts.append((x, y - iy * c, z))
                pts.append((x, y, z - iz * c))
    mesh = trimesh.convex.convex_hull(np.array(pts, dtype=np.float64))
    return _finish(mesh, color, **kw)


def round_box(size=(1, 1, 1), radius=0.2, quality=1, color="cloth_blue", **kw):
    """
    Softer than chamfer_box: convex hull of 8 low-poly spheres.
    quality 0 degenerates to a chamfer box; 1 (~230 tris) is the usable
    minimum for a genuinely round read. Use for heads and
    hero-facing shapes only; too expensive to spam across a scene.
    """
    sx, sy, sz = (float(v) / 2.0 for v in size)
    r = float(radius) * min(sx, sy, sz)
    ico = trimesh.creation.icosphere(subdivisions=int(quality), radius=r)
    pts = []
    for ix in (-1, 1):
        for iy in (-1, 1):
            for iz in (-1, 1):
                off = np.array([ix * (sx - r), iy * (sy - r), iz * (sz - r)])
                pts.append(ico.vertices + off)
    mesh = trimesh.convex.convex_hull(np.vstack(pts))
    return _finish(mesh, color, **kw)


def cyl(radius=0.5, height=1.0, seg=8, color="wood", **kw):
    """Low-poly cylinder. seg=6 for background, 8 default, 12 for hero props."""
    mesh = trimesh.creation.cylinder(radius=float(radius), height=float(height),
                                     sections=int(seg))
    return _finish(mesh, color, **kw)


def cone(radius=0.5, height=1.0, seg=8, color="leaf_mid", **kw):
    """Centred on its own origin -- trimesh builds cones from z=0 up, we don't."""
    mesh = trimesh.creation.cone(radius=float(radius), height=float(height),
                                 sections=int(seg))
    mesh.apply_translation([0, 0, -float(height) / 2.0])
    return _finish(mesh, color, **kw)


def sphere_lp(radius=0.5, quality=1, color="leaf_light", **kw):
    """quality 0=20 tris, 1=80, 2=320."""
    mesh = trimesh.creation.icosphere(subdivisions=int(quality),
                                      radius=float(radius))
    return _finish(mesh, color, **kw)


def capsule(radius=0.3, height=1.0, seg=8, color="skin_mid", **kw):
    """
    Limbs and rounded trunks. Centred on origin.
    NOTE: end-to-end length is height + 2*radius, not height. Use span=
    to size by the real length instead.
    """
    mesh = trimesh.creation.capsule(radius=float(radius), height=float(height),
                                    count=[int(seg), int(seg)])
    return _finish(mesh, color, **kw)


def limb(radius=0.1, span=1.0, seg=6, color="skin_mid", **kw):
    """Capsule sized by true end-to-end length. What character code should use."""
    h = max(float(span) - 2.0 * float(radius), 1e-3)
    return capsule(radius=radius, height=h, seg=seg, color=color, **kw)


def blob(size=(1, 1, 1), seed=0, jitter=0.30, quality=1, color="stone", **kw):
    """
    Irregular convex lump -- rocks, boulders, bread, fruit.

    A chamfered box always reads as 'box'. Jittering an icosphere's vertices
    and re-hulling gives flat facets at random angles, which is what makes a
    rock look quarried instead of manufactured. Deterministic per seed.
    """
    r = np.random.default_rng(int(seed))
    ico = trimesh.creation.icosphere(subdivisions=int(quality), radius=0.5)
    v = ico.vertices * (1.0 + r.uniform(-jitter, jitter, (len(ico.vertices), 1)))
    v = v * np.array(size, dtype=np.float64)
    mesh = trimesh.convex.convex_hull(v)
    return _finish(mesh, color, **kw)


def wedge(size=(1, 1, 1), color="roof", **kw):
    """Triangular prism — roofs, ramps, rock shards. 8 tris."""
    sx, sy, sz = (float(v) / 2.0 for v in size)
    pts = np.array([
        (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
        (-sx, -sy, sz) if False else (0.0, -sy, sz), (0.0, sy, sz),
    ], dtype=np.float64)
    mesh = trimesh.convex.convex_hull(pts)
    return _finish(mesh, color, **kw)


# ---- transform helpers (mesh-space, applied before node placement) ----

def at(mesh, pos=(0, 0, 0), rot=None, scale=None):
    """Translate/rotate/scale a mesh in place and return it. rot = (x,y,z) deg."""
    m = mesh.copy()
    if scale is not None:
        s = [scale] * 3 if np.isscalar(scale) else list(scale)
        m.apply_scale(s)
    if rot is not None:
        for axis, ang in zip(((1, 0, 0), (0, 1, 0), (0, 0, 1)), rot):
            if ang:
                m.apply_transform(trimesh.transformations.rotation_matrix(
                    np.radians(float(ang)), axis))
    m.apply_translation(np.array(pos, dtype=np.float64))
    return m


def tris(*meshes):
    return sum(len(m.faces) for m in meshes)
