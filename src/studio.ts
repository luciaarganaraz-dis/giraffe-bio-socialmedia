import {
  AgXToneMapping, ACESFilmicToneMapping, Group,
  PCFShadowMap, PMREMGenerator, Scene, Vector3, WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createLogo, disposeLogo, readLogo, type Piece } from './logo'
import { applyFinish, createMaterials, type Finish } from './materials'
import { createStoneSurface } from './stone/surface'
import { CARVED_LOOK as LOOK } from './stone/carved-look'
import { createStoneBackdrop } from './stone/backdrop'
import { createLighting, type LightSettings } from './lighting'
import { createSculpture } from './sculpture/model'
import { createSculptureSurface } from './sculpture/surface'
import { createSculptureBackground } from './sculpture/background'
import { type TextureSettings } from './giraffe/texture'
import { createCamera } from './parameters/camera'
import { createSurfaceControls } from './parameters/surface'
import type { MaterialSettings } from './parameters/material'
import type { DetailSettings } from './parameters/texture-detail'
import { RENDER_DEFAULTS, OBJECT_DEFAULTS, type RenderSettings, type ObjectSettings, type CameraSettings } from './parameters/scene-settings'
import { applyRender } from './parameters/render'
import { captureImage } from './parameters/capture'
import { framingBounds } from './parameters/framing'
import type { GiraffeLightSettings } from './giraffe/settings'

export async function createStudio(host: HTMLElement) {
  const response = await fetch(`${import.meta.env.BASE_URL}giraffe-bio.svg`)
  if (!response.ok) throw new Error('No se pudo cargar el SVG.')
  const shapes = readLogo(await response.text())
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  host.append(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')

  const scene = new Scene()
  let dirty = true
  const view = createCamera(renderer.domElement, () => { dirty = true })
  const controls = view.controls
  const environment = new RoomEnvironment()
  const pmrem = new PMREMGenerator(renderer)
  const environmentMap = pmrem.fromScene(environment, 0.04)
  scene.environment = environmentMap.texture
  environment.dispose()
  pmrem.dispose()

  const materials = createMaterials()
  applyFinish(materials, 'graphite')
  const stone = await createStoneSurface(renderer)
  scene.add(stone.lights)
  const lighting = createLighting(renderer, scene, stone.lights)
  const backdrop = createStoneBackdrop(stone.uniforms)
  scene.add(backdrop.mesh)
  const sculptureSurface = createSculptureSurface(stone.uniforms)
  const sculptureBackground = createSculptureBackground()
  const surface = createSurfaceControls(stone, sculptureSurface)
  let renderSettings = { ...RENDER_DEFAULTS }, objectSettings = { ...OBJECT_DEFAULTS }
  scene.add(sculptureBackground.mesh)
  let transparentCapture = false
  let finish: Finish = 'graphite'
  let piece: Piece = 'sculpture'
  updateLighting()
  let depth = 78
  let model = makeModel()
  const pivot = new Group()
  pivot.add(model)
  const objectRoot = new Group()
  objectRoot.add(pivot); scene.add(objectRoot)

  // The canvas rotates with a finger; the page scrolls from the surrounding UI.
  renderer.domElement.style.touchAction = 'none'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let moving = !reduced.matches
  let interacting = false
  let frame = 0
  let lastTime = 0
  let phase = 0
  let visible = true
  controls.addEventListener('change', () => { dirty = true })
  let onMotionChange = (_moving: boolean) => {}

  function fit(width: number, height: number) {
    const bounds = framingBounds(model, pivot)
    const size = bounds.getSize(new Vector3())
    const aspect = width / height
    const halfHeight = piece === 'sculpture'
      ? Math.max(size.y * .57, size.x / aspect * .62)
      : Math.max(size.y * .95, size.x / aspect * .62)
    view.fit(width, height, halfHeight)
  }
  function render() {
    lighting.update(view.camera)
    applyRender(renderer, scene, renderSettings)
    backdrop.mesh.visible = !transparentCapture && piece !== 'sculpture'
    sculptureBackground.mesh.visible = !transparentCapture && piece === 'sculpture'
    if (backdrop.mesh.visible) backdrop.update(view.camera, pivot)
    renderer.render(scene, view.camera)
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height)
    fit(width, height)
    render()
  }
  function reset() {
    view.reset()
    if (piece === 'sculpture') pivot.rotation.set(.035, -.62, .11)
    else pivot.rotation.set(.24, -.35, -.025)
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
      lighting.advance(dt)
      pivot.rotation.y = (piece === 'sculpture' ? -.62 : -.35) + Math.sin(phase) * .14
      pivot.rotation.x = (piece === 'sculpture' ? .035 : .24) + Math.sin(phase * .75) * .055
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
    get settings() { return { surface: surface.state, camera: view.settings, object: objectSettings, render: renderSettings, light: lighting.settings, giraffeLight: lighting.originalSettings, mode: host.dataset.lightingMode, piece, depth } },
    set onCameraChange(callback: (s: CameraSettings) => void) { view.onChange = callback },
    setCamera(settings: CameraSettings) { view.apply(settings); host.dataset.camera = JSON.stringify(view.settings); render() },
    setObject(settings: ObjectSettings) {
      objectSettings = settings
      objectRoot.position.set(settings.x, settings.y, settings.z)
      objectRoot.rotation.set(settings.rotationX * Math.PI / 180, settings.rotationY * Math.PI / 180, settings.rotationZ * Math.PI / 180)
      objectRoot.scale.set(settings.scaleX, settings.scaleY, settings.scaleZ)
      host.dataset.object = JSON.stringify(settings); render()
    },
    setRender(settings: RenderSettings) {
      renderSettings = settings
      sculptureBackground.set(settings.backgroundTop, settings.backgroundBottom, settings.backgroundGrain)
      renderer.setPixelRatio(settings.quality)
      host.dataset.render = JSON.stringify(settings); resize()
    },
    setMaterial(settings: MaterialSettings) { surface.material(settings); host.dataset.material = JSON.stringify(settings); measureModel(); render() },
    setDetail(settings: DetailSettings) { surface.detail(settings); host.dataset.detail = JSON.stringify(settings); measureModel(); render() },
    set onMotionChange(callback: (value: boolean) => void) { onMotionChange = callback },
    setMotion,
    reset,
    setLight(settings: Partial<LightSettings>) {
      lighting.set(settings)
      host.dataset.light = JSON.stringify(lighting.settings)
      render()
    },
    setGiraffeLight(settings: GiraffeLightSettings) {
      lighting.setOriginal(settings)
      host.dataset.giraffeLight = JSON.stringify(settings)
      render()
    },
    setLightingMode(mode: 'sculpture' | 'giraffe') {
      lighting.setMode(mode); host.dataset.lightingMode = mode; render()
    },
    setTexture(settings: TextureSettings) {
      surface.texture(settings)
      host.dataset.texture = JSON.stringify(settings)
      measureModel()
      render()
    },
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
        view.zoom(event.key === '-' ? .9 : 1.1)
      } else if (event.key === 'Home') { event.preventDefault(); reset() }
      else return
      render()
    },
    setPiece(value: Piece) { piece = value; updateLighting(); rebuild(); reset() },
    setDepth(value: number) { depth = value; rebuild() },
    setFinish(value: Finish) {
      finish = value
      if (value !== 'stone') applyFinish(materials, value)
      updateLighting()
      rebuild()
    },
    async exportModel() {
      const exported = model.clone(true)
      exported.position.copy(objectRoot.position); exported.rotation.copy(objectRoot.rotation); exported.scale.copy(objectRoot.scale)
      exported.userData.camera = view.settings; exported.userData.render = renderSettings
      if (piece === 'sculpture') {
        const { exportSculpture } = await import('./sculpture/export')
        return exportSculpture(exported, renderer, sculptureSurface.uniforms, sculptureSurface.material)
      }
      const { exportLogo } = await import('./stone/export')
      return exportLogo(exported, finish === 'stone' ? { renderer, uniforms: stone.uniforms, finish: stone.material } : undefined)
    },
    capture(transparent: boolean) {
      return captureImage(renderer, scene, piece, renderSettings, transparent, value => { transparentCapture = value }, fit, render, resize)
    },
    dispose() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      reduced.removeEventListener('change', motionPreference)
      controls.dispose()
      disposeLogo(model)
      materials.forEach(material => material.dispose())
      sculptureSurface.dispose()
      sculptureBackground.dispose()
      backdrop.dispose()
      lighting.dispose()
      stone.dispose()
      environmentMap.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }

  function updateLighting() {
    const rocky = finish === 'stone' || piece === 'sculpture'
    host.closest('.scene-workspace')?.setAttribute('data-composition', piece)
    lighting.setSculpture(piece === 'sculpture')
    host.closest('.stage')?.setAttribute('data-surface', finish)
    lighting.setFinish(rocky)
    scene.environment = rocky ? stone.environment : environmentMap.texture
    scene.environmentRotation.y = rocky ? LOOK.envRotation * Math.PI / 180 : 0
    renderer.toneMapping = rocky ? AgXToneMapping : ACESFilmicToneMapping
  }

  function measureModel() {
    Object.assign(model.userData, surface.state)
    host.dataset.piece = piece
    host.dataset.meshes = String(model.children.length)
    host.dataset.carved = String(model.userData.carved)
    host.dataset.relief = String(Math.max(...model.children.map(child =>
      'geometry' in child ? (child as import('three').Mesh).geometry.userData.frontRelief ?? 0 : 0)))
  }

  function makeModel() {
    const selected = finish === 'stone' ? [stone.material, stone.material] : materials
    return piece === 'sculpture'
      ? createSculpture(shapes, depth, sculptureSurface.material)
      : createLogo(shapes, piece, depth, selected, finish === 'stone')
  }

  function rebuild() {
    pivot.remove(model)
    disposeLogo(model)
    model = makeModel()
    pivot.add(model)
    measureModel()
    resize()
  }
}
