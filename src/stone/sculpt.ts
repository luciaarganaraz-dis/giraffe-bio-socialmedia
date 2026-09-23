import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, Vector2 } from 'three'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { logoUVs } from './unwrap'

function hash(x: number, y: number, z: number, seed: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 2147483647.5 - 1
}
function noise(x: number, y: number, z: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fade = (v: number) => v * v * (3 - 2 * v)
  const tx = fade(x - ix), ty = fade(y - iy), tz = fade(z - iz)
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  const layer = (k: number) => mix(
    mix(hash(ix, iy, k, seed), hash(ix + 1, iy, k, seed), tx),
    mix(hash(ix, iy + 1, k, seed), hash(ix + 1, iy + 1, k, seed), tx), ty,
  )
  return mix(layer(iz), layer(iz + 1), tz)
}

/** Keep corners, with fewer samples along smooth curves before subdivision. */
function stoneOutline(source: Shape) {
  const simplify = (points: Vector2[]) => {
    const result: Vector2[] = []
    for (let i = 0; i < points.length; i++) {
      const previous = points[(i + points.length - 1) % points.length]
      const next = points[(i + 1) % points.length]
      const incoming = points[i].clone().sub(previous).normalize()
      const outgoing = next.clone().sub(points[i]).normalize()
      if (!result.length || result.at(-1)!.distanceTo(points[i]) >= 2.2 || incoming.dot(outgoing) < 0.985) result.push(points[i])
    }
    return result
  }
  const shape = new Shape(simplify(source.getPoints()))
  shape.holes = source.holes.map(hole => new Path(simplify(hole.getPoints())))
  return shape
}

/** Real displaced volume: the silhouette, front, back and inner walls all erode. */
export function sculptStone(shape: Shape, depth: number, seed: number) {
  const base = new ExtrudeGeometry(stoneOutline(shape), {
    depth, steps: 5, bevelEnabled: true, bevelThickness: 5.5,
    bevelSize: 3.5, bevelSegments: 3, curveSegments: 12, UVGenerator: logoUVs(11),
  })
  const pieces: BufferGeometry[] = []
  // Tessellate caps and walls independently, preserving their export UV charts.
  const tessellator = new TessellateModifier(2.4, 15)
  for (const group of base.groups) {
    const part = new BufferGeometry()
    for (const name of ['position', 'normal', 'uv']) {
      const attribute = base.getAttribute(name)
      part.setAttribute(name, new Float32BufferAttribute(
        Array.from(attribute.array).slice(group.start * attribute.itemSize, (group.start + group.count) * attribute.itemSize), attribute.itemSize,
      ))
    }
    pieces.push(tessellator.modify(part))
    part.dispose()
  }
  const geometry = mergeGeometries(pieces, true)!
  pieces.forEach(piece => piece.dispose())
  base.dispose()
  const position = geometry.getAttribute('position')
  const cache = new Map<string, [number, number, number]>()
  let minFront = Infinity, maxFront = -Infinity
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`
    let result = cache.get(key)
    if (!result) {
      const t = (z + 5.5) / (depth + 11)
      const face = (t * 2 - 1)
      // Broad rocky masses, smaller broken shoulders and grit are separate scales.
      const relief = noise(x * .042, y * .042, z * .025, seed) * 10
        + noise(x * .105, y * .105, z * .065, seed + 11) * 3.6
        + noise(x * .32, y * .32, z * .24, seed + 29) * .8
      const chip = Math.pow(Math.abs(noise(x * .072, y * .072, z * .05, seed + 57)), 3) * 5
      const nx = x + noise(x * .08, y * .075, z * .045, seed + 83) * 3.0
        + noise(x * .35, y * .35, z * .2, seed + 91) * .65
      const ny = y + noise(x * .07, y * .08, z * .04, seed + 113) * 3.0
        + noise(x * .31, y * .31, z * .19, seed + 123) * .65
      const nz = z + face * (relief - chip)
      result = [nx, ny, nz]
      cache.set(key, result)
    }
    position.setXYZ(i, ...result)
    if (z > depth + 5.4) { minFront = Math.min(minFront, result[2]); maxFront = Math.max(maxFront, result[2]) }
  }
  geometry.computeVertexNormals()
  toCreasedNormals(geometry, Math.PI / 3.5)
  geometry.scale(.01, .01, .01)
  const compact = mergeVertices(geometry, .00001)
  compact.userData = { sculpted: true, frontRelief: (maxFront - minFront) * .01 }
  geometry.dispose()
  return compact
}
