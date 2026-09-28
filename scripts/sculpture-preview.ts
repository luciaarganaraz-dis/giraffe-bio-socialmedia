import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createStoneSurface } from '../src/stone/surface'
import { createSculptureBackground } from '../src/sculpture/background'
import { createLighting } from '../src/lighting'
import { CARVED_LOOK } from '../src/stone/carved-look'
import { createSculpture } from '../src/sculpture/model'
import { createSculptureSurface } from '../src/sculpture/surface'
import { readLogo } from '../src/logo'
import { wallProfiles } from './sculpture-wall-profiles'
import { sculptureContours } from './sculpture-contours'

const params = new URLSearchParams(location.search)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(720, 900)
renderer.toneMapping = THREE.AgXToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
scene.add(createSculptureBackground().mesh)
const stone = await createStoneSurface(renderer)
scene.environment = stone.environment
scene.environmentRotation.y = CARVED_LOOK.envRotation * Math.PI / 180
scene.add(stone.lights)
const lighting = createLighting(renderer, scene, stone.lights)
lighting.setFinish(true)
lighting.setSculpture(true)
const model = params.has('live')
  ? createSculpture(readLogo(await (await fetch('/giraffe-bio.svg')).text()), 78, createSculptureSurface(stone.uniforms).material)
  : (await new GLTFLoader().loadAsync('/exports/giraffe-bio-escultura.glb')).scene
const originalShapes = readLogo(await (await fetch('/giraffe-bio.svg')).text())
if (params.has('neutral')) {
  const neutral = new THREE.MeshStandardMaterial({ color: '#8a8a8a', roughness: .9 })
  model.traverse(object => { if (object instanceof THREE.Mesh) object.material = neutral })
}
model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true } })
model.updateMatrixWorld(true)
model.traverse(object => {
  if (!object.userData.relief) return
  const { probes, center } = object.userData.relief
  document.body.dataset.contours = JSON.stringify(sculptureContours(model, originalShapes, center, 78))
  document.body.dataset.walls = JSON.stringify(wallProfiles(model, center, 78, probes))
  const offset = new THREE.Vector3().fromArray(center)
  const ray = new THREE.Raycaster()
  const result = probes.map((probe: { x: number; y: number; recessed: boolean }) => {
    ray.set(new THREE.Vector3(probe.x, probe.y, 5).sub(offset), new THREE.Vector3(0, 0, -1))
    const hit = ray.intersectObject(model)[0]
    return { ...probe, z: hit?.point.z + offset.z }
  })
  document.body.dataset.relief = JSON.stringify(result)
})
const pivot = new THREE.Group()
pivot.add(model)
if (params.has('front')) pivot.rotation.set(0, 0, 0)
else pivot.rotation.set(.035, params.has('side') ? -1.25 : -.62, .11)
scene.add(pivot)
const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
const aspect = .8
const h = Math.max(size.y * .57, size.x / aspect * .62)
const camera = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, .1, 100)
camera.position.z = 20
lighting.update(camera)
renderer.render(scene, camera)
document.body.dataset.ready = 'true'
