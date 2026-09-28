import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createStoneSurface } from '../src/stone/surface'
import { createSculptureBackground } from '../src/sculpture/background'
import { createLighting } from '../src/lighting'
import { CARVED_LOOK } from '../src/stone/carved-look'

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
const { scene: model } = await new GLTFLoader().loadAsync('/exports/giraffe-bio-escultura.glb')
model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true } })
const pivot = new THREE.Group()
pivot.add(model)
pivot.rotation.set(.035, -.62, .11)
scene.add(pivot)
const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3())
const aspect = .8
const h = Math.max(size.y * .57, size.x / aspect * .62)
const camera = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, .1, 100)
camera.position.z = 20
lighting.update(camera)
renderer.render(scene, camera)
document.body.dataset.ready = 'true'
