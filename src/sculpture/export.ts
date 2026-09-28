import { Mesh, MeshStandardMaterial, type Group, type Texture, type WebGLRenderer } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { atlasModel, disposeAtlas } from '../stone/atlas'
import { bakeStone } from '../stone/bake'
import type { TriUniforms } from '../stone/triplanar'

export async function exportSculpture(source: Group, renderer: WebGLRenderer, uniforms: TriUniforms, finish: Pick<MeshStandardMaterial, 'roughness' | 'metalness'>) {
  const model = atlasModel(source, 2048)
  let maps: Texture[] = []
  let material: MeshStandardMaterial | undefined
  try {
    maps = bakeStone(renderer, model, uniforms, 2048, finish)
    material = new MeshStandardMaterial({
      name: 'Piedra tallada — PBR',
      map: maps[0], roughnessMap: maps[1], metalnessMap: maps[1], normalMap: maps[2],
      roughness: 1, metalness: 1,
    })
    model.children.forEach(child => { (child as Mesh).material = material! })
    return await new GLTFExporter().parseAsync(model, { binary: true }) as ArrayBuffer
  } finally {
    maps.forEach(texture => texture.dispose())
    material?.dispose()
    disposeAtlas(model)
  }
}
