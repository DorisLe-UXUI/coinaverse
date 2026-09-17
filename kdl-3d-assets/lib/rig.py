"""
Rigid-part rig + glTF animation injection.

Why not skinning: at this art scale every limb is a solid rounded block.
Skinned weights would deform shapes that are meant to stay hard-edged,
cost a joints/weights buffer per vertex, and need a bind-pose pipeline.
Rigid parts animate as plain node TRS keyframes -- three.js plays them
with AnimationMixer out of the box, and the clip data is a few hundred
bytes instead of tens of KB.
"""

import numpy as np
import trimesh
from trimesh.transformations import (translation_matrix, euler_matrix,
                                     quaternion_from_euler)
from pygltflib import (GLTF2, Animation, AnimationChannel, AnimationSampler,
                       AnimationChannelTarget, Accessor, BufferView, FLOAT,
                       SCALAR, VEC3, VEC4)


class Part:
    """One rigid piece: a pivot in parent space plus the meshes hung off it."""

    def __init__(self, name, pivot=(0, 0, 0), parent=None):
        self.name = name
        self.pivot = np.array(pivot, dtype=np.float64)
        self.parent = parent
        self.meshes = []      # (mesh, local_offset)
        self.children = []
        if parent is not None:
            parent.children.append(self)

    def add(self, mesh, offset=(0, 0, 0)):
        """Attach geometry, positioned relative to this part's pivot."""
        self.meshes.append((mesh, np.array(offset, dtype=np.float64)))
        return self

    def child(self, name, pivot):
        return Part(name, pivot, parent=self)

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()


# Assets are authored +Z up / +Y forward because that is how the primitive
# maths reads. glTF consumers (three.js, Godot, Babylon) expect +Y up and
# treat +Z as forward, so the root node carries the conversion and every
# exported file is correct on import with no rotation at the call site.
# order matters: stand it up first (Z-up -> Y-up), then spin it to face +Z
_YUP = euler_matrix(0.0, np.pi, 0.0).dot(
    euler_matrix(-np.pi / 2.0, 0.0, 0.0))


def build_scene(root, yup=True, target_height=None, ground=True):
    """
    Flatten a Part tree into a trimesh Scene with real glTF parenting.

    target_height: scale the finished asset so its real bounding height
      matches this value. Without it, 'height' is only a construction hint
      and two characters asked for 1.15 can end up different sizes.
    ground: drop the asset so its lowest point sits exactly on y=0, so
      nothing floats or sinks when placed in a scene.
    """
    sc = trimesh.Scene()
    for part in root.walk():
        parent_name = part.parent.name if part.parent else None
        m = translation_matrix(part.pivot)
        if part.parent is None and yup:
            m = _YUP.dot(m)
        # the pivot node itself (empty, carries the animated transform)
        sc.graph.update(frame_to=part.name,
                        frame_from=parent_name if parent_name else sc.graph.base_frame,
                        matrix=m)
        for i, (mesh, off) in enumerate(part.meshes):
            sc.add_geometry(mesh,
                            node_name=f"{part.name}_m{i}",
                            geom_name=f"{part.name}_g{i}",
                            parent_node_name=part.name,
                            transform=translation_matrix(off))

    if yup and (target_height or ground):
        lo, hi = sc.bounds
        fix = np.eye(4)
        if target_height:
            k = float(target_height) / max(float(hi[1] - lo[1]), 1e-6)
            fix[:3, :3] *= k
            lo, hi = lo * k, hi * k
        if ground:
            fix[1, 3] = -float(lo[1])
        cur = sc.graph.get(root.name)[0]
        sc.graph.update(frame_to=root.name, frame_from=sc.graph.base_frame,
                        matrix=fix.dot(cur))
    return sc


# ---------------- animation ----------------

def _pad(gltf, blob):
    """Append bytes to the GLB binary blob, 4-byte aligned. Returns offset."""
    while len(blob) % 4:
        blob += b"\x00"
    return len(blob), blob


def _to_trs(node):
    """
    Convert a node from a baked matrix to translation/rotation/scale.

    The glTF spec forbids `matrix` on any node targeted by an animation --
    a matrix has no separable channels to key. trimesh writes matrices, so
    every animated node has to be decomposed before a channel can point at it.
    Returns (translation, rotation_xyzw) as plain lists.
    """
    if node.matrix is not None:
        m = np.array(node.matrix, dtype=np.float64).reshape(4, 4).T
        t = m[:3, 3].tolist()
        rs = m[:3, :3]
        sc = np.linalg.norm(rs, axis=0)
        sc[sc == 0] = 1.0
        rot = rs / sc
        if np.linalg.det(rot) < 0:      # mirrored basis -> flip one axis
            rot[:, 0] *= -1.0
            sc[0] *= -1.0
        q = trimesh.transformations.quaternion_from_matrix(
            np.vstack([np.hstack([rot, [[0], [0], [0]]]), [0, 0, 0, 1]]))
        node.matrix = None
        node.translation = [float(v) for v in t]
        node.rotation = [float(q[1]), float(q[2]), float(q[3]), float(q[0])]
        node.scale = [float(v) for v in sc]
    if node.translation is None:
        node.translation = [0.0, 0.0, 0.0]
    if node.rotation is None:
        node.rotation = [0.0, 0.0, 0.0, 1.0]
    return node.translation, node.rotation


def _qmul(a, b):
    """Quaternion product, both xyzw."""
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by,
            aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw,
            aw * bw - ax * bx - ay * by - az * bz]


def add_clip(path_in, path_out, clip_name, tracks, duration=None):
    """
    tracks: {node_name: {'rotation':    [(t, (rx,ry,rz) degrees), ...],
                         'translation': [(t, (dx,dy,dz) metres),  ...]}}

    Values are DELTAS from the node's rest pose, which is what clip authors
    actually think in. glTF channels are absolute, so the rest transform is
    read off the node and folded in here -- writing raw absolutes by hand is
    how you end up animating a character's hips into the floor.
    """
    g = GLTF2().load(path_in)
    blob = bytearray(g.binary_blob())
    name_to_idx = {n.name: i for i, n in enumerate(g.nodes) if n.name}

    if g.animations is None:
        g.animations = []
    anim = Animation(name=clip_name, channels=[], samplers=[])

    for node_name, paths in tracks.items():
        if node_name not in name_to_idx:
            raise KeyError(f"node '{node_name}' not in GLB "
                           f"(have: {sorted(name_to_idx)[:8]}...)")
        nidx = name_to_idx[node_name]
        base_t, base_q = _to_trs(g.nodes[nidx])

        for path, keys in paths.items():
            times = np.array([k[0] for k in keys], dtype=np.float32)
            if path == "rotation":
                vals = []
                for _, e in keys:
                    q = quaternion_from_euler(*np.radians(e))      # w,x,y,z
                    vals.append(_qmul(base_q, [q[1], q[2], q[3], q[0]]))
                vals = np.array(vals, dtype=np.float32)
                vtype = VEC4
            else:
                vals = np.array([[base_t[0] + d[0], base_t[1] + d[1],
                                  base_t[2] + d[2]] for _, d in keys],
                                dtype=np.float32)
                vtype = VEC3

            off, blob = _pad(g, blob)
            blob = bytearray(blob) + times.tobytes()
            g.bufferViews.append(BufferView(buffer=0, byteOffset=off,
                                            byteLength=times.nbytes))
            g.accessors.append(Accessor(bufferView=len(g.bufferViews) - 1,
                                        componentType=FLOAT, count=len(times),
                                        type=SCALAR, min=[float(times.min())],
                                        max=[float(times.max())]))
            t_acc = len(g.accessors) - 1

            off, blob = _pad(g, blob)
            blob = bytearray(blob) + vals.tobytes()
            g.bufferViews.append(BufferView(buffer=0, byteOffset=off,
                                            byteLength=vals.nbytes))
            g.accessors.append(Accessor(bufferView=len(g.bufferViews) - 1,
                                        componentType=FLOAT, count=len(vals),
                                        type=vtype))
            v_acc = len(g.accessors) - 1

            anim.samplers.append(AnimationSampler(input=t_acc, output=v_acc,
                                                  interpolation="LINEAR"))
            anim.channels.append(AnimationChannel(
                sampler=len(anim.samplers) - 1,
                target=AnimationChannelTarget(node=nidx, path=path)))

    g.animations.append(anim)
    g.buffers[0].byteLength = len(blob)
    g.set_binary_blob(bytes(blob))
    g.save(path_out)
    return path_out
