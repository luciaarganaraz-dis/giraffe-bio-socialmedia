import { Mesh, MeshPhysicalMaterial, type Group, type Texture, type WebGLRenderer } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { atlasModel, disposeAtlas } from '../stone/atlas'
import { bakeStone } from '../stone/bake'
import { exportMaterial } from '../parameters/export-material'
import type { TriUniforms } from '../stone/triplanar'

export async function exportSculpture(source: Group, renderer: WebGLRenderer, uniforms: TriUniforms, finish: MeshPhysicalMaterial) {
  const model = atlasModel(source, 2048)
  let maps: Texture[] = []
  let material: MeshPhysicalMaterial | undefined
  try {
    maps = bakeStone(renderer, model, uniforms, 2048, finish)
    material = exportMaterial(finish, maps)
    model.children.forEach(child => { (child as Mesh).material = material! })
    return await new GLTFExporter().parseAsync(model, { binary: true }) as ArrayBuffer
  } finally {
    maps.forEach(texture => texture.dispose())
    material?.dispose()
    disposeAtlas(model)
  }
}
