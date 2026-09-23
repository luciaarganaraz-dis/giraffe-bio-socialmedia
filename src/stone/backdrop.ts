import { Box3, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3, type Camera, type Object3D } from 'three'
import { CARVED_LOOK } from './carved-look'
import { noise } from './erosion-noise'
import { applyLook, applyTriplanar, createTriUniforms, type TriUniforms } from './triplanar'

/** A lit stone wall, kept behind the entire object even while orbiting. */
export function createStoneBackdrop(source: TriUniforms) {
  const uniforms = createTriUniforms()
  uniforms.uTriNor = source.uTriNor
  uniforms.uTriArm = source.uTriArm
  uniforms.uNoise3D = source.uNoise3D
  applyLook({
    ...CARVED_LOOK, matrixColor: '#30333a', veinColor: '#41454b',
    scale: .38, veinScale: .7, grainScale: 3, grain: .45, relief: .65, ao: .25, antiTiling: .9,
  }, uniforms)
  uniforms.uTriDetail.value = .35
  const material = new MeshStandardMaterial({ color: 'white', roughness: 1, metalness: 0 })
  applyTriplanar(material, uniforms)
  const compile = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    compile.call(material, shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace('vec3 triPos = vTriWorldPos;', `
      vec3 wallP = vTriWorldPos * .18;
      vec3 wallWarp = vec3(texture(uNoise3D, wallP).r,
        texture(uNoise3D, wallP + 13.7).r, texture(uNoise3D, wallP + 31.3).r);
      vec3 triPos = vTriWorldPos + (wallWarp - .5) * 4.0;
    `)
  }
  material.customProgramCacheKey = () => 'giraffe-stone-backdrop-v1'
  const geometry = new PlaneGeometry(50, 50, 200, 200)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i)
    positions.setZ(i, noise(x * .9, y * .9, .5, 847) * .13
      + noise(x * 2.8, y * 2.8, .5, 913) * .035)
  }
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, material)
  mesh.name = 'Fondo de piedra'
  mesh.receiveShadow = true
  const bounds = new Box3(), direction = new Vector3(), corner = new Vector3()
  return {
    mesh,
    update(camera: Camera, subject: Object3D) {
      camera.getWorldDirection(direction)
      bounds.setFromObject(subject)
      let farthest = -Infinity
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) farthest = Math.max(farthest, corner.set(x, y, z).dot(direction))
      }
      mesh.position.copy(direction).multiplyScalar(farthest + .65)
      mesh.quaternion.copy(camera.quaternion)
    },
    dispose() { geometry.dispose(); material.dispose() },
  }
}
