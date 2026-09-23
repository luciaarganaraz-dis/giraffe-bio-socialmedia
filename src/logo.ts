import { Box3, ExtrudeGeometry, Group, Mesh, Path, Shape, Vector2, Vector3, type Material } from 'three'
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { sculptStone } from './stone/sculpt'
import { logoUVs } from './stone/unwrap'
import polygonClipping, { type Polygon, type Ring } from 'polygon-clipping'

export type Piece = 'logo' | 'symbol'

/** Union overlapping strokes before extrusion, especially the joined “ff”. */
export function readLogo(svg: string) {
  const paths = new SVGLoader().parse(svg).paths
  const polygons: Polygon[] = paths.flatMap(path => SVGLoader.createShapes(path).map(shape => {
    const points = shape.extractPoints(20)
    const ring = (list: Vector2[]): Ring => list.map(p => [p.x, p.y])
    return [ring(points.shape), ...points.holes.map(ring)]
  }))
  return polygonClipping.union(polygons).map(polygon => {
    const shape = new Shape(polygon[0].map(([x, y]) => new Vector2(x, -y)))
    shape.holes = polygon.slice(1).map(ring => new Path(ring.map(([x, y]) => new Vector2(x, -y))))
    const isSymbol = polygon[0].every(([x]) => x < 200)
    return { shape, isSymbol }
  })
}

export function createLogo(shapes: ReturnType<typeof readLogo>, piece: Piece, depth: number, material: Material[], carved = false) {
  const group = new Group()
  group.name = piece === 'logo' ? 'Giraffe bio. — logo' : 'Giraffe bio. — symbol'
  for (const [i, entry] of shapes.entries()) {
    if (piece === 'symbol' && !entry.isSymbol) continue
    let compact
    if (carved) compact = sculptStone(entry.shape, depth, 307 + i * 113)
    else {
      const geometry = new ExtrudeGeometry(entry.shape, {
        depth, steps: 1, UVGenerator: logoUVs(), bevelEnabled: true, bevelThickness: 1.2,
        bevelSize: 0.8, bevelSegments: 4, curveSegments: 20,
      })
      // Smooth in SVG units: the normal helper quantizes positions to 0.01.
      // Scaling first would merge distinct bevel rings and create streaks.
      toCreasedNormals(geometry, Math.PI / 3)
      const positions = geometry.getAttribute('position')
      const normals = geometry.getAttribute('normal')
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const z = positions.getZ(vertex)
        if (Math.abs(z + 1.2) < 0.001) normals.setXYZ(vertex, 0, 0, -1)
        if (Math.abs(z - depth - 1.2) < 0.001) normals.setXYZ(vertex, 0, 0, 1)
      }
      geometry.scale(0.01, 0.01, 0.01)
      compact = mergeVertices(geometry, 0.0001)
      geometry.dispose()
    }
    const mesh = new Mesh(compact, material)
    mesh.name = `${entry.isSymbol ? 'Symbol' : 'Letter'} ${i + 1}`
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  const bounds = new Box3().setFromObject(group)
  const center = bounds.getCenter(new Vector3())
  for (const child of group.children) child.position.sub(center)
  group.userData = { source: 'giraffe-bio.svg', depth, piece, carved }
  return group
}

export function disposeLogo(group: Group) {
  group.traverse(object => {
    if (object instanceof Mesh) object.geometry.dispose()
  })
}
