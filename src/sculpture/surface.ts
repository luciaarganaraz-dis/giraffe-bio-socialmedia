import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { CARVED_LOOK } from '../stone/carved-look'
import { applyLook, applyTriplanar, createTriUniforms, type TriUniforms } from '../stone/triplanar'

export const SCULPTURE_LOOK = {
  ...CARVED_LOOK, matrixColor: '#090909', veinColor: '#141414',
  veinAmount: .6, veinScale: 1.8, veinSoftness: .25,
  grain: .4, grainScale: 4, grainRelief: .04, scale: 2.1, relief: 1.2,
  roughness: .5, matrixRough: .44, veinRough: .52, metalness: 0,
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
  const ivory = new MeshPhysicalMaterial({
    name: 'Isologo lateral — marfil', color: '#e6e4df', roughness: .3, metalness: .08,
  })
  return { material, uniforms, ivory, dispose() { material.dispose(); ivory.dispose() } }
}
