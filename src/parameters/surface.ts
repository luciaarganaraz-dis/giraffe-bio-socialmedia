import type { MeshPhysicalMaterial } from 'three'
import type { TriUniforms } from '../stone/triplanar'
import { createTextureController, textureDefaults, type TextureSettings } from '../giraffe/texture'
import { CARVED_LOOK } from '../stone/carved-look'
import { SCULPTURE_LOOK } from '../sculpture/surface'
import { MATERIAL_DEFAULTS, applyMaterial, type MaterialSettings } from './material'
import { DETAIL_DEFAULTS, applyDetail, type DetailSettings } from './texture-detail'

export function createSurfaceControls(stone: { material: MeshPhysicalMaterial; uniforms: TriUniforms }, sculpture: typeof stone) {
  const baseStone = createTextureController(stone.material, stone.uniforms, CARVED_LOOK)
  const baseSculpture = createTextureController(sculpture.material, sculpture.uniforms, SCULPTURE_LOOK)
  let texture = textureDefaults(), material = { ...MATERIAL_DEFAULTS }, detail = { ...DETAIL_DEFAULTS }
  function apply() {
    baseStone(texture); baseSculpture(texture)
    for (const surface of [stone, sculpture]) { applyDetail(surface.uniforms, detail); applyMaterial(surface.material, material) }
  }
  return {
    get state() { return { texture: { ...texture }, material: { ...material }, detail: { ...detail } } },
    texture(s: TextureSettings) { texture = s; apply() },
    material(s: MaterialSettings) { material = s; apply() },
    detail(s: DetailSettings) { detail = s; apply() },
  }
}
