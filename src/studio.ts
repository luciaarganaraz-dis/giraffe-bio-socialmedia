import {
  AgXToneMapping, ACESFilmicToneMapping, AmbientLight, Box3, Color, DirectionalLight, Group,
  OrthographicCamera, PCFSoftShadowMap, PMREMGenerator, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createLogo, disposeLogo, readLogo, type Piece } from './logo'
import { applyFinish, createMaterials, type Finish } from './materials'
import { createStoneSurface } from './stone/surface'
import { CARVED_LOOK as LOOK } from './stone/carved-look'

export async function createStudio(host: HTMLElement) {
  const response = await fetch(`${import.meta.env.BASE_URL}giraffe-bio.svg`)
  if (!response.ok) throw new Error('No se pudo cargar el SVG.')
  const shapes = readLogo(await response.text())
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  host.append(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')

  const scene = new Scene()
  const camera = new OrthographicCamera(-8, 8, 5, -5, 0.1, 100)
  const environment = new RoomEnvironment()
  const pmrem = new PMREMGenerator(renderer)
  const environmentMap = pmrem.fromScene(environment, 0.04)
  scene.environment = environmentMap.texture
  environment.dispose()
  pmrem.dispose()
  const studioLights = new Group()
  scene.add(studioLights)
  studioLights.add(new AmbientLight('white', 0.9))
  const key = new DirectionalLight('white', 3.5)
  key.position.set(-4, 7, 8)
  studioLights.add(key)
  const rim = new DirectionalLight('#f3d9c6', 2.2)
  rim.position.set(6, 2, -4)
  studioLights.add(rim)

  const materials = createMaterials()
  applyFinish(materials, 'graphite')
  const stone = await createStoneSurface(renderer)
  scene.add(stone.lights)
  let finish: Finish = 'stone'
  updateLighting()
  let piece: Piece = 'logo'
  let depth = 78
  let model = createLogo(shapes, piece, depth, finish === 'stone' ? [stone.material, stone.material] : materials, finish === 'stone')
  const pivot = new Group()
  pivot.add(model)
  scene.add(pivot)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minZoom = 0.65
  controls.maxZoom = 2.5
  controls.rotateSpeed = 0.65
  // The canvas rotates with a finger; the page scrolls from the surrounding UI.
  renderer.domElement.style.touchAction = 'none'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let moving = !reduced.matches
  let interacting = false
  let frame = 0
  let lastTime = 0
  let phase = 0
  let visible = true
  let dirty = true
  controls.addEventListener('change', () => { dirty = true })
  let onMotionChange = (_moving: boolean) => {}

  function fit(width: number, height: number) {
    const bounds = new Box3().setFromObject(model)
    const size = bounds.getSize(new Vector3())
    const aspect = width / height
    const halfHeight = Math.max(size.y * 0.95, size.x / aspect * 0.62)
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
  }
  function render() { renderer.render(scene, camera) }
  function resize() {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height)
    fit(width, height)
    render()
  }
  function reset() {
    camera.position.set(0, 0, 20)
    camera.zoom = 1
    controls.target.set(0, 0, 0)
    pivot.rotation.set(0.24, -0.35, -0.025)
    pivot.position.y = 0
    phase = 0
    controls.update()
    resize()
  }
  function animate(time: number) {
    frame = requestAnimationFrame(animate)
    const dt = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time
    if (!visible || document.hidden) return
    if (moving && !interacting) {
      phase += dt * 0.45
      pivot.rotation.y = -0.35 + Math.sin(phase) * 0.14
      pivot.rotation.x = 0.24 + Math.sin(phase * 0.75) * 0.055
      pivot.position.y = Math.sin(phase) * 0.045
    }
    controls.update()
    if (dirty || (moving && !interacting)) { render(); dirty = false }
    host.dataset.frames = String(renderer.info.render.frame)
  }
  function setMotion(value: boolean) {
    moving = value
    onMotionChange(value)
  }
  const start = () => { interacting = true; setMotion(false) }
  const end = () => { interacting = false }
  controls.addEventListener('start', start)
  controls.addEventListener('end', end)
  const motionPreference = () => { setMotion(!reduced.matches); reset() }
  reduced.addEventListener('change', motionPreference)
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  intersection.observe(host)
  reset()
  frame = requestAnimationFrame(animate)
  host.dataset.ready = 'true'
  measureModel()

  return {
    get moving() { return moving },
    get model() { return model },
    get piece() { return piece },
    get finish() { return finish },
    set onMotionChange(callback: (value: boolean) => void) { onMotionChange = callback },
    setMotion,
    reset,
    key(event: KeyboardEvent) {
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [0, -0.1], ArrowRight: [0, 0.1], ArrowUp: [-0.1, 0], ArrowDown: [0.1, 0],
      }
      if (event.key in directions) {
        event.preventDefault()
        setMotion(false)
        const [x, y] = directions[event.key]
        pivot.rotation.x += x
        pivot.rotation.y += y
      } else if (['+', '=', '-'].includes(event.key)) {
        event.preventDefault()
        camera.zoom = Math.min(2.5, Math.max(0.65, camera.zoom * (event.key === '-' ? 0.9 : 1.1)))
        camera.updateProjectionMatrix()
      } else if (event.key === 'Home') { event.preventDefault(); reset() }
      else return
      render()
    },
    setPiece(value: Piece) { piece = value; rebuild(); reset() },
    setDepth(value: number) { depth = value; rebuild() },
    setFinish(value: Finish) {
      finish = value
      if (value !== 'stone') applyFinish(materials, value)
      updateLighting()
      rebuild()
    },
    async exportModel() {
      const { exportLogo } = await import('./stone/export')
      return exportLogo(model, finish === 'stone' ? { renderer, uniforms: stone.uniforms } : undefined)
    },
    async capture(transparent: boolean) {
      const originalSize = renderer.getSize(new Vector2())
      const originalRatio = renderer.getPixelRatio()
      const originalBackground = scene.background
      try {
        renderer.setPixelRatio(1)
        const width = piece === 'symbol' ? 2048 : 3000
        const height = piece === 'symbol' ? 2048 : 1500
        renderer.setSize(width, height, false)
        fit(width, height)
        scene.background = transparent ? null : new Color(finish === 'stone' ? '#111316' : '#f1f0eb')
        render()
        return await new Promise<Blob>((resolve, reject) => renderer.domElement.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('No se pudo exportar la imagen.'))
        }, 'image/png'))
      } finally {
        scene.background = originalBackground
        renderer.setPixelRatio(originalRatio)
        renderer.setSize(originalSize.x, originalSize.y, false)
        resize()
      }
    },
    dispose() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      reduced.removeEventListener('change', motionPreference)
      controls.dispose()
      disposeLogo(model)
      materials.forEach(material => material.dispose())
      stone.dispose()
      environmentMap.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }

  function updateLighting() {
    const rocky = finish === 'stone'
    host.closest('.stage')?.setAttribute('data-surface', finish)
    studioLights.visible = !rocky
    stone.lights.visible = rocky
    scene.environment = rocky ? stone.environment : environmentMap.texture
    scene.environmentIntensity = rocky ? LOOK.envIntensity : 1
    scene.environmentRotation.y = rocky ? LOOK.envRotation * Math.PI / 180 : 0
    renderer.toneMapping = rocky ? AgXToneMapping : ACESFilmicToneMapping
    renderer.toneMappingExposure = rocky ? LOOK.exposure : 1.35
  }

  function measureModel() {
    host.dataset.meshes = String(model.children.length)
    host.dataset.carved = String(model.userData.carved)
    host.dataset.relief = String(Math.max(...model.children.map(child =>
      'geometry' in child ? (child as import('three').Mesh).geometry.userData.frontRelief ?? 0 : 0)))
  }

  function rebuild() {
    pivot.remove(model)
    disposeLogo(model)
    model = createLogo(shapes, piece, depth, finish === 'stone' ? [stone.material, stone.material] : materials, finish === 'stone')
    pivot.add(model)
    measureModel()
    resize()
  }
}
