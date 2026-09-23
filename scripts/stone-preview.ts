import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createStoneSurface } from '../src/stone/surface'
import { LOOK } from '../src/stone/look'

// Review fixture: reopen the downloaded GLB using only standard glTF materials.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(1346, 490)
renderer.toneMapping = THREE.AgXToneMapping
renderer.toneMappingExposure = LOOK.exposure
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color('#f1f0eb')
const surface = await createStoneSurface(renderer)
scene.environment = surface.environment
scene.environmentIntensity = LOOK.envIntensity
scene.environmentRotation.y = LOOK.envRotation * Math.PI / 180
scene.add(surface.lights)
const { scene: imported } = await new GLTFLoader().loadAsync('/exports/giraffe-bio-logo-stone.glb')
const pivot = new THREE.Group()
pivot.add(imported)
scene.add(pivot)
pivot.rotation.set(0.24, -0.35, -0.025)
const size = new THREE.Box3().setFromObject(imported).getSize(new THREE.Vector3())
const aspect = 1346 / 490
const h = Math.max(size.y * 0.95, size.x / aspect * 0.62)
const camera = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, 0.1, 100)
camera.position.set(0, 0, 20)
renderer.render(scene, camera)
document.body.dataset.ready = 'true'
