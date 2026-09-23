import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { LOOK, type RockLight } from './look'
import { makeNoise3DTexture } from './noise3d'
import { applyLook, applyTriplanar, createTriUniforms } from './triplanar'

/** The approved hero material and its lighting, copied from the Giraffe Bio site. */
export async function createStoneSurface(renderer: THREE.WebGLRenderer) {
  const base = `${import.meta.env.BASE_URL}rock/`
  const loader = new THREE.TextureLoader().setPath(base)
  const results = await Promise.allSettled([
    loader.loadAsync('dark_rock_nor_gl_1k.jpg'),
    loader.loadAsync('dark_rock_arm_1k.jpg'),
    new RGBELoader().loadAsync(`${base}ferndale_studio_07_1k.hdr`),
  ])
  if (results.some(result => result.status === 'rejected')) {
    results.forEach(result => { if (result.status === 'fulfilled') result.value.dispose() })
    throw new Error('No se pudieron cargar las texturas de piedra.')
  }
  const [normal, arm, hdr] = results.map(result => (result as PromiseFulfilledResult<THREE.Texture>).value)
  for (const texture of [normal, arm]) {
    texture.colorSpace = THREE.NoColorSpace
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
  }
  const uniforms = createTriUniforms()
  const noise = makeNoise3DTexture(64)
  noise.generateMipmaps = true
  noise.minFilter = THREE.LinearMipmapLinearFilter
  uniforms.uNoise3D.value = noise
  uniforms.uTriNor.value = normal
  uniforms.uTriArm.value = arm
  applyLook(LOOK, uniforms)
  const material = new THREE.MeshStandardMaterial({
    name: 'Giraffe Bio — piedra oscura con pirita',
    color: 'white', roughness: LOOK.roughness, metalness: LOOK.metalness,
  })
  applyTriplanar(material, uniforms)
  material.customProgramCacheKey = () => 'giraffe-bio-stone-v1'
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromEquirectangular(hdr)
  hdr.dispose()
  pmrem.dispose()
  const lights = new THREE.Group()
  const intensities: Record<string, number> = { key: LOOK.keyLight, rim: LOOK.rimLight, fill: LOOK.fillLight }
  for (const [name, light] of Object.entries(LOOK.lights as Record<string, RockLight>)) {
    const lamp = new THREE.DirectionalLight(light.color, light.i ?? intensities[name] ?? 1)
    lamp.position.set(light.x, light.y, light.z)
    lights.add(lamp)
  }
  for (const light of LOOK.extraLights) {
    const lamp = new THREE.DirectionalLight(light.color, light.i)
    lamp.position.set(light.x, light.y, light.z)
    lights.add(lamp)
  }
  return {
    material, uniforms, environment: environment.texture, lights,
    dispose() {
      material.dispose()
      normal.dispose()
      arm.dispose()
      noise.dispose()
      environment.dispose()
    },
  }
}
