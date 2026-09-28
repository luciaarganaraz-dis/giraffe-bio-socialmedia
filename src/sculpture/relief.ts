import { Box3, Vector3, type BufferGeometry, type Material, type Mesh } from 'three'
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { createLogo, disposeLogo, type readLogo } from '../logo'
import { atlasModel } from '../stone/atlas'
import { noise } from '../stone/erosion-noise'

/** Five original SVG lobes, in a single placement; left/top sink into the rock. */
export function reliefTools(shapes: ReturnType<typeof readLogo>, depth: number, material: Material) {
  const logo = createLogo(shapes, 'symbol', 100, [material, material])
  const atlas = atlasModel(logo, 2048)
  disposeLogo(logo)
  const recessed: BufferGeometry[] = [], raised: BufferGeometry[] = []
  const probes: { x: number; y: number; recessed: boolean }[] = []
  atlas.updateMatrixWorld(true)
  for (const child of atlas.children as Mesh[]) {
    const bounds = new Box3().setFromObject(child)
    const center = bounds.getCenter(new Vector3())
    const inset = center.x < -.3 || center.y > .25
    const lower = inset ? 1.03 - (.22 + depth * .005) : .45
    const upper = inset ? 2.3 : 1.03 + (.18 + depth * .005)
    child.geometry.applyMatrix4(child.matrixWorld)
    const geometry = new TessellateModifier(.08, 12).modify(child.geometry)
    child.geometry.dispose()
    const positions = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) * 1.43 - .05
      const y = positions.getY(i) * 1.43 + .1
      const t = (positions.getZ(i) - bounds.min.z) / (bounds.max.z - bounds.min.z)
      const z = lower + t * (upper - lower)
      const weathering = noise(x * 2.1, y * 2.1, z * 2.1, 821) * .045
        + noise(x * 6.8, y * 6.8, z * 6.8, 531) * .012
      positions.setXYZ(i, x, y, z + weathering)
      uv.setX(i, .5 + uv.getX(i) * .5)
    }
    geometry.scale(100, 100, 100)
    geometry.computeVertexNormals()
    toCreasedNormals(geometry, Math.PI / 3)
    geometry.scale(.01, .01, .01)
    geometry.clearGroups()
    const target = inset ? recessed : raised
    target.push(geometry)
    probes.push({ x: center.x * 1.43 - .05, y: center.y * 1.43 + .1, recessed: inset })
  }
  return { recessed, raised, probes }
}
