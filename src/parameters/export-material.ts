import { MeshPhysicalMaterial, type Texture } from 'three'

/** glTF stores the baked stone maps plus the live physical surface extensions. */
export function exportMaterial(source: MeshPhysicalMaterial, maps: Texture[]) {
  const material = new MeshPhysicalMaterial()
  material.copy(source)
  material.name = 'Piedra tallada — material físico'
  material.map = maps[0]; material.roughnessMap = material.metalnessMap = maps[1]; material.normalMap = maps[2]
  material.roughness = material.metalness = 1
  material.onBeforeCompile = () => {}
  material.customProgramCacheKey = () => 'giraffe-export-physical'
  return material
}
