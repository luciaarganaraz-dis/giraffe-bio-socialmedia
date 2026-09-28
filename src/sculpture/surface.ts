import { MeshStandardMaterial } from 'three'
import { CARVED_LOOK } from '../stone/carved-look'
import { applyLook, applyTriplanar, createTriUniforms, type TriUniforms } from '../stone/triplanar'

export const SCULPTURE_LOOK = {
  ...CARVED_LOOK, matrixColor: '#090909', veinColor: '#101010',
  veinAmount: .6, veinScale: .8, veinSoftness: .25,
  // Let the scanned fractures read at the scale of the rock, without sand-like grain.
  scale: .5, relief: .95, antiTiling: .7,
  grain: .12, grainScale: 2, grainRelief: 0, fleckAmount: 0,
  roughness: .5, matrixRough: .45, veinRough: .5, roughMin: .45, roughMax: .93, metalness: 0,
}

export function createSculptureSurface(source: TriUniforms) {
  const uniforms = createTriUniforms()
  uniforms.uTriNor = source.uTriNor
  uniforms.uTriArm = source.uTriArm
  uniforms.uNoise3D = source.uNoise3D
  applyLook(SCULPTURE_LOOK, uniforms)
  const material = new MeshStandardMaterial({
    name: 'Roca negra', roughness: SCULPTURE_LOOK.roughness, metalness: SCULPTURE_LOOK.metalness,
  })
  applyTriplanar(material, uniforms)
  material.customProgramCacheKey = () => 'giraffe-sculpture-rock-v1'
  return { material, uniforms, dispose() { material.dispose() } }
}
