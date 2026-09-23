import { Group, Mesh, MeshStandardMaterial, type Texture, type WebGLRenderer } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { atlasModel, disposeAtlas } from './atlas'
import { bakeStone } from './bake'
import type { TriUniforms } from './triplanar'

type StoneSource = { renderer: WebGLRenderer; uniforms: TriUniforms }

export async function exportLogo(source: Group, stone?: StoneSource) {
  if (!stone) return new GLTFExporter().parseAsync(source, { binary: true }) as Promise<ArrayBuffer>
  const model = atlasModel(source, 2048)
  let maps: Texture[] = []
  let material: MeshStandardMaterial | undefined
  try {
    maps = bakeStone(stone.renderer, model, stone.uniforms, 2048)
    material = new MeshStandardMaterial({
      name: 'Giraffe Bio — piedra con pirita (PBR)', color: 'white',
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
