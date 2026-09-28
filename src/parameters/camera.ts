import { OrthographicCamera, PerspectiveCamera, Spherical, Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CAMERA_DEFAULTS, type CameraSettings } from './scene-settings'

export function createCamera(canvas: HTMLCanvasElement, changed: () => void) {
  let settings = { ...CAMERA_DEFAULTS }
  let camera: OrthographicCamera | PerspectiveCamera = new OrthographicCamera(-8, 8, 5, -5, .1, 100)
  const controls = new OrbitControls<OrthographicCamera | PerspectiveCamera>(camera, canvas)
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .08
  controls.minZoom = .2; controls.maxZoom = 5; controls.rotateSpeed = .65
  controls.minDistance = 4; controls.maxDistance = 60
  let width = 1, height = 1, halfHeight = 4, applying = false
  let onChange = (_s: CameraSettings) => {}
  const spherical = new Spherical(), offset = new Vector3()
  function fit(w = width, h = height, half = halfHeight) {
    width = w; height = h; halfHeight = half
    camera.clearViewOffset()
    if (camera instanceof OrthographicCamera) {
      camera.left = -half * w / h; camera.right = half * w / h
      camera.top = half; camera.bottom = -half
    } else { camera.aspect = w / h; camera.filmGauge = settings.sensor; camera.setFocalLength(settings.focal) }
    camera.zoom = settings.zoom; camera.near = settings.near; camera.far = settings.far
    camera.setViewOffset(w, h, settings.shiftX * w, -settings.shiftY * h, w, h)
    camera.updateProjectionMatrix()
  }
  function apply(next: CameraSettings) {
    applying = true
    // Finish any pointer inertia before applying exact numeric framing.
    controls.enableDamping = false; controls.update()
    settings = { ...next }
    const perspective = settings.projection === 'perspective'
    if (perspective !== (camera instanceof PerspectiveCamera)) {
      camera = perspective ? new PerspectiveCamera() : new OrthographicCamera()
      controls.object = camera
    }
    const phi = (90 - settings.elevation) * Math.PI / 180, theta = settings.azimuth * Math.PI / 180
    controls.target.set(settings.targetX, settings.targetY, settings.targetZ)
    camera.position.setFromSpherical(new Spherical(settings.distance, phi, theta)).add(controls.target)
    camera.up.set(Math.sin(settings.roll * Math.PI / 180), Math.cos(settings.roll * Math.PI / 180), 0)
    camera.lookAt(controls.target); fit(); controls.update()
    controls.enableDamping = true
    applying = false
  }
  controls.addEventListener('change', () => {
    if (!applying) {
      offset.copy(camera.position).sub(controls.target); spherical.setFromVector3(offset)
      settings = { ...settings, distance: spherical.radius, azimuth: spherical.theta * 180 / Math.PI, elevation: 90 - spherical.phi * 180 / Math.PI, zoom: camera.zoom }
      onChange({ ...settings })
    }
    changed()
  })
  apply(settings)
  return {
    controls, fit, apply,
    get camera() { return camera },
    get settings() { return { ...settings } },
    set onChange(callback: (settings: CameraSettings) => void) { onChange = callback },
    reset() { apply({ ...CAMERA_DEFAULTS }); onChange({ ...settings }) },
    zoom(factor: number) { settings.zoom = Math.min(5, Math.max(.2, settings.zoom * factor)); fit(); onChange({ ...settings }) },
  }
}
