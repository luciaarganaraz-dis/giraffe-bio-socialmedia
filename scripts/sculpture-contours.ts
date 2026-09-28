import { MeshStandardMaterial, Raycaster, Vector3, type Object3D } from 'three'
import { createLogo, disposeLogo, type readLogo } from '../src/logo'
import { ISO_PLACEMENT } from '../src/sculpture/placement'

/** Check the entire SVG footprint, not just a ray at the center of each lobe. */
export function sculptureContours(model: Object3D, shapes: ReturnType<typeof readLogo>, center: number[], depth: number) {
  const material = new MeshStandardMaterial()
  const original = createLogo(shapes, 'symbol', 100, [material, material])
  const entries = shapes.filter(entry => entry.isSymbol)
  const offset = new Vector3().fromArray(center)
  const ray = new Raycaster(), down = new Vector3(0, 0, -1)
  const placement = ISO_PLACEMENT
  const reports = original.children.map((child, index) => {
    const recessed = true
    const polygon = entries[index].shape.getPoints(20).map(point => ({
      x: (point.x * .01 + child.position.x) * placement.scale + placement.x,
      y: (point.y * .01 + child.position.y) * placement.scale + placement.y,
    }))
    const expectedZ = 1.03 - (.22 + depth * .005)
    const minX = Math.min(...polygon.map(p => p.x)), maxX = Math.max(...polygon.map(p => p.x))
    const minY = Math.min(...polygon.map(p => p.y)), maxY = Math.max(...polygon.map(p => p.y))
    const step = Math.max(maxX - minX, maxY - minY) / 18
    let sampled = 0, intact = 0, worstDepthError = 0
    for (let x = minX + step / 2; x < maxX; x += step) for (let y = minY + step / 2; y < maxY; y += step) {
      let inside = false, edgeDistance2 = Infinity
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j]
        if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside
        const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy
        if (length2 < 1e-12) continue
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length2))
        edgeDistance2 = Math.min(edgeDistance2, (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2)
      }
      if (!inside || edgeDistance2 < .018 ** 2) continue
      sampled++
      ray.set(new Vector3(x, y, 5).sub(offset), down)
      const hit = ray.intersectObject(model)[0]
      const error = hit ? Math.abs(hit.point.z + offset.z - expectedZ) : Infinity
      worstDepthError = Math.max(worstDepthError, error)
      if (error < .075) intact++
    }
    return { recessed, sampled, intact, coverage: intact / sampled, worstDepthError }
  })
  disposeLogo(original); material.dispose()
  return reports
}
