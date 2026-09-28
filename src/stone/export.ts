import { Group, Mesh, MeshPhysicalMaterial, type Texture, type WebGLRenderer } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { atlasModel, disposeAtlas } from './atlas'
import { bakeStone } from './bake'
import { exportMaterial } from '../parameters/export-material'
import type { TriUniforms } from './triplanar'

type StoneSource = { renderer: WebGLRenderer; uniforms: TriUniforms; finish: MeshPhysicalMaterial }

export async function exportLogo(source: Group, stone?: StoneSource) {
  if (!stone) return new GLTFExporter().parseAsync(source, { binary: true }) as Promise<ArrayBuffer>
  const model = atlasModel(source, 2048)
  let maps: Texture[] = []
  let material: MeshPhysicalMaterial | undefined
  try {
    maps = bakeStone(stone.renderer, model, stone.uniforms, 2048, stone.finish)
    material = exportMaterial(stone.finish, maps)
    model.children.forEach(child => { (child as Mesh).material = material! })
    return await new GLTFExporter().parseAsync(model, { binary: true }) as ArrayBuffer
  } finally {
    maps.forEach(texture => texture.dispose())
    material?.dispose()
    disposeAtlas(model)
  }
}
