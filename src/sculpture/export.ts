import { Group, Mesh, MeshStandardMaterial, type BufferGeometry, type Texture, type WebGLRenderer } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { atlasModel } from '../stone/atlas'
import { bakeStone } from '../stone/bake'
import { CARVED_LOOK } from '../stone/carved-look'
import type { TriUniforms } from '../stone/triplanar'
import { SCULPTURE_LOOK } from './surface'

export async function exportSculpture(source: Group, renderer: WebGLRenderer, body: TriUniforms, symbol: TriUniforms) {
  const model = source.clone(true)
  const maps: Texture[] = [], materials: MeshStandardMaterial[] = [], geometries: BufferGeometry[] = []
  try {
    for (const [tag, uniforms, look] of [['body', body, SCULPTURE_LOOK], ['symbol', symbol, CARVED_LOOK]] as const) {
      const group = new Group()
      model.children.filter(child => child.userData.bakeSurface === tag).forEach(child => group.add(child.clone()))
      if (!group.children.length) continue
      const atlas = atlasModel(group, 2048)
      const baked = bakeStone(renderer, atlas, uniforms, 2048, look)
      maps.push(...baked)
      const material = new MeshStandardMaterial({
        name: tag === 'body' ? 'Roca negra — PBR' : 'Isologo en piedra — PBR',
        map: baked[0], roughnessMap: baked[1], metalnessMap: baked[1], normalMap: baked[2],
        roughness: 1, metalness: 1,
      })
      materials.push(material)
      for (const child of [...atlas.children] as Mesh[]) {
        geometries.push(child.geometry)
        child.material = material
        model.remove(model.getObjectByName(child.name)!)
        model.add(child)
      }
    }
    return await new GLTFExporter().parseAsync(model, { binary: true }) as ArrayBuffer
  } finally {
    maps.forEach(texture => texture.dispose())
    materials.forEach(material => material.dispose())
    geometries.forEach(geometry => geometry.dispose())
  }
}
