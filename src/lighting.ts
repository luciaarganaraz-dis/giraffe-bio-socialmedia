import { AmbientLight, Camera, DirectionalLight, Group, Scene, Vector3, type WebGLRenderer } from 'three'
import { CARVED_LOOK as LOOK } from './stone/carved-look'

export const DEFAULT_LIGHT = { x: -40, y: 70, intensity: 100, fill: 30, rim: 100, exposure: 100 }
export type LightSettings = typeof DEFAULT_LIGHT

/** The control follows the camera: left on the pad always lights from the left. */
export function createLighting(renderer: WebGLRenderer, scene: Scene, stoneLights: Group) {
  const studioLights = new Group()
  const ambient = new AmbientLight('white', .9)
  const key = new DirectionalLight('white', 3.5)
  const rim = new DirectionalLight('#f3d9c6', 2.2)
  studioLights.add(ambient, key, rim)
  scene.add(studioLights)
  const settings = { ...DEFAULT_LIGHT }
  const stoneKey = stoneLights.getObjectByName('key') as DirectionalLight
  const stoneFill = stoneLights.getObjectByName('fill') as DirectionalLight
  const stoneRim = stoneLights.getObjectByName('rim') as DirectionalLight
  let rocky = true
  const position = new Vector3()
  function update(camera: Camera) {
    const move = (light: DirectionalLight, x: number, y: number, z: number) => {
      light.position.copy(position.set(x, y, z).applyQuaternion(camera.quaternion))
    }
    move(stoneKey, settings.x / 10, settings.y / 10, 7)
    move(key, settings.x / 10, settings.y / 10, 7)
    move(stoneFill, 1, -3, 5)
    move(stoneRim, 5, 2, -4)
    move(rim, 6, 2, -4)
    stoneKey.intensity = LOOK.keyLight * settings.intensity / 100
    stoneFill.intensity = settings.fill / 100
    stoneRim.intensity = LOOK.rimLight * settings.rim / 100
    key.intensity = 3.5 * settings.intensity / 100
    rim.intensity = 2.2 * settings.rim / 100
    ambient.intensity = .9 * settings.fill / 30
    scene.environmentIntensity = (rocky ? LOOK.envIntensity : 1) * settings.fill / 30
    renderer.toneMappingExposure = (rocky ? LOOK.exposure : 1.35) * settings.exposure / 100
  }
  return {
    settings, update,
    setFinish(stone: boolean) {
      rocky = stone
      studioLights.visible = !stone
      stoneLights.visible = stone
    },
    set(patch: Partial<LightSettings>) { Object.assign(settings, patch) },
  }
}
