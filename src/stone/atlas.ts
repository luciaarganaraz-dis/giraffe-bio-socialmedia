import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { Float32BufferAttribute, Group, Mesh, type BufferGeometry } from 'three'

/** Three non-overlapping charts per piece: back, front and the perimeter strip. */
export function atlasModel(source: Group, resolution: number) {
  const clone = source.clone(true)
  const grid = Math.ceil(Math.sqrt(clone.children.length * 3))
  clone.children.forEach((child, meshIndex) => {
    const mesh = child as Mesh
    const original = mesh.geometry
    const geometry = original.index ? original.toNonIndexed() : original.clone()
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const positions = geometry.getAttribute('position')
    const oldUVs = geometry.getAttribute('uv')
    const uvs = new Float32Array(positions.count * 2)
    const sideGroup = geometry.groups.find(group => group.materialIndex === 1)!
    let perimeter = 0
    for (let i = sideGroup.start; i < sideGroup.start + sideGroup.count; i++) perimeter = Math.max(perimeter, oldUVs.getX(i))
    const inset = 6 / resolution
    const tileSize = 1 / grid - 2 * inset
    for (let i = 0; i < positions.count; i++) {
      const side = i >= sideGroup.start && i < sideGroup.start + sideGroup.count
      const chart = side ? 2 : positions.getZ(i) > (box.min.z + box.max.z) / 2 ? 1 : 0
      const tile = meshIndex * 3 + chart
      const u = side ? oldUVs.getX(i) / Math.max(perimeter, 1e-6) : (positions.getX(i) - box.min.x) / (box.max.x - box.min.x)
      const v = side ? (positions.getZ(i) - box.min.z) / (box.max.z - box.min.z) : (positions.getY(i) - box.min.y) / (box.max.y - box.min.y)
      uvs[i * 2] = (tile % grid) / grid + inset + u * tileSize
      uvs[i * 2 + 1] = Math.floor(tile / grid) / grid + inset + v * tileSize
    }
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
    geometry.clearGroups()
    mesh.geometry = mergeVertices(geometry, .00001)
    geometry.dispose()
  })
  return clone
}

export function disposeAtlas(model: Group) {
  model.traverse(object => { if (object instanceof Mesh) (object.geometry as BufferGeometry).dispose() })
}
