import { Float32BufferAttribute, Vector3 } from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { noise } from '../stone/erosion-noise'

/** A closed, fractured monolith. Its silhouette and facets exist in the mesh. */
export function sculptureRock() {
  const outline = [[-1.25, 2.5], [-.35, 2.85], [.85, 2.4], [1.48, 1.15],
    [1.65, -.25], [1.3, -1.9], [.45, -2.65], [-.8, -2.4], [-1.65, -1.35], [-1.75, .65]]
  const points: Vector3[] = []
  outline.forEach(([x, y], i) => {
    points.push(new Vector3(x - y * .1, y, 1.03 + noise(x, y, 0, 87) * .18))
    points.push(new Vector3(x * .87 + .18, y * .9 + .15, -1.15 + noise(x, y, 0, 413) * .28))
  })
  const hull = new ConvexGeometry(points)
  const geometry = new TessellateModifier(.075, 14).modify(hull)
  hull.dispose()
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const uv = new Float32Array(positions.count * 2)
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i)
    const rough = noise(x * 2.1, y * 2.1, z * 2.1, 821) * .16
      + noise(x * 6.8, y * 6.8, z * 6.8, 531) * .055
      + noise(x * 19, y * 19, z * 19, 193) * .017
    // Coordinate displacement is shared at every seam, regardless of face normal.
    positions.setXYZ(i, x + rough * .6, y + noise(x * 2.4, y * 2.4, z * 2.4, 57) * .095, z + rough)
    let chart: number, u: number, v: number
    if (Math.abs(nz) >= Math.max(Math.abs(nx), Math.abs(ny))) {
      chart = nz > 0 ? 0 : 1; u = (x + 2.5) / 5; v = (y + 3.2) / 6.4
    } else if (Math.abs(nx) >= Math.abs(ny)) {
      chart = nx > 0 ? 2 : 3; u = (z + 1.6) / 3.2; v = (y + 3.2) / 6.4
    } else {
      chart = ny > 0 ? 4 : 5; u = (x + 2.5) / 5; v = (z + 1.6) / 3.2
    }
    uv[i * 2] = (chart % 3 + .035 + u * .93) / 3
    uv[i * 2 + 1] = (Math.floor(chart / 3) + .035 + v * .93) / 2
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  // Smooth before world scale so the normal helper never collapses tiny facets.
  geometry.scale(100, 100, 100)
  geometry.computeVertexNormals()
  toCreasedNormals(geometry, Math.PI / 3)
  geometry.scale(.01, .01, .01)
  const compact = mergeVertices(geometry, .00001)
  compact.userData = { atlasMode: 'existing', sculpted: true }
  geometry.dispose()
  return compact
}
