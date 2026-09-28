import { Box3, Vector3, type BufferGeometry, type Material, type Mesh } from 'three'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { createLogo, disposeLogo, type readLogo } from '../logo'
import { atlasModel } from '../stone/atlas'
import { noise } from '../stone/erosion-noise'
import { carvedSidewallWear } from './sidewall'
import { ISO_PLACEMENT, outlineDirection } from './placement'

/** Five original SVG lobes, in a single placement; left/top sink into the rock. */
export function reliefTools(shapes: ReturnType<typeof readLogo>, depth: number, material: Material) {
  const logo = createLogo(shapes, 'symbol', 100, [material, material])
  const atlas = atlasModel(logo, 2048)
  disposeLogo(logo)
  const recessed: BufferGeometry[] = [], raised: BufferGeometry[] = []
  const probes: { x: number; y: number; recessed: boolean }[] = []
  const entries = shapes.filter(entry => entry.isSymbol)
  const placement = ISO_PLACEMENT
  atlas.updateMatrixWorld(true)
  for (const [index, child] of (atlas.children as Mesh[]).entries()) {
    const bounds = new Box3().setFromObject(child)
    const center = bounds.getCenter(new Vector3())
    const inset = center.x < -.3 || center.y > .25
    const lower = inset ? 1.03 - (.22 + depth * .005) : .45
    const upper = inset ? 2.3 : 1.03 + (.18 + depth * .005)
    const outline = entries[index].shape.getPoints(20).map(point => ({
      x: (point.x * .01 + child.position.x) * placement.scale + placement.x,
      y: (point.y * .01 + child.position.y) * placement.scale + placement.y,
    }))
    const direction = outlineDirection(outline)
    child.geometry.applyMatrix4(child.matrixWorld)
    // Subdivide at the final depth so the sidewalls have enough cross-sections.
    const source = child.geometry.getAttribute('position')
    for (let i = 0; i < source.count; i++) {
      const t = (source.getZ(i) - bounds.min.z) / (bounds.max.z - bounds.min.z)
      source.setXYZ(i, source.getX(i) * placement.scale + placement.x, source.getY(i) * placement.scale + placement.y, lower + t * (upper - lower))
    }
    const geometry = new TessellateModifier(.08, 12).modify(child.geometry)
    child.geometry.dispose()
    const positions = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
      const weathering = noise(x * 2.1, y * 2.1, z * 2.1, 821) * .045
        + noise(x * 6.8, y * 6.8, z * 6.8, 531) * .012
      const [nx, ny] = direction(x, y)
      const wear = carvedSidewallWear(x, y, z, depth, inset)
      positions.setXYZ(i, x + nx * wear, y + ny * wear, z + weathering)
      uv.setX(i, .5 + uv.getX(i) * .5)
    }
    geometry.scale(100, 100, 100)
    geometry.computeVertexNormals()
    toCreasedNormals(geometry, Math.PI / 3)
    geometry.scale(.01, .01, .01)
    geometry.clearGroups()
    const target = inset ? recessed : raised
    target.push(geometry)
    probes.push({ x: center.x * placement.scale + placement.x, y: center.y * placement.scale + placement.y, recessed: inset })
  }
  return { recessed, raised, probes }
}
