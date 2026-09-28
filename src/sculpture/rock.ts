import { Float32BufferAttribute, Vector3 } from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { noise } from '../stone/erosion-noise'
import { fracturePoint } from './fracture'

/** A closed, fractured monolith. Its silhouette and facets exist in the mesh. */
export function sculptureRock() {
  const outline = [[-1.46, 2.85], [-.45, 2.65], [.8, 1.88], [1.48, .98],
    [1.65, -.35], [.95, -1.98], [.22, -2.48], [-.92, -2.6], [-1.72, -1.45], [-1.93, .6]]
  const points: Vector3[] = []
  outline.forEach(([x, y]) => {
    points.push(new Vector3(x - y * .1, y, 1.03 + noise(x, y, 0, 87) * .18))
    points.push(new Vector3(x * .72 + .22, y * .88 - .12, -.95 - y * .10 + noise(x, y, 0, 413) * .3))
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
    positions.setXYZ(i, ...fracturePoint(x, y, z))
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
  toCreasedNormals(geometry, Math.PI / 4)
  geometry.scale(.01, .01, .01)
  const compact = mergeVertices(geometry, .00001)
  compact.userData = { atlasMode: 'existing', sculpted: true }
  geometry.dispose()
  return compact
}
