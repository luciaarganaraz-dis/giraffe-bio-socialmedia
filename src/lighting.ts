import { AmbientLight, Camera, Color, DirectionalLight, Group, Scene, SpotLight, Vector3, type WebGLRenderer } from 'three'
import { CARVED_LOOK as LOOK } from './stone/carved-look'
import { DEFAULT_LIGHT, type LightSettings } from './light-settings'
import { LOOK as ORIGINAL } from './stone/look'
import { createQ2StudioLighting } from './giraffe/lighting-rig'
import { giraffeLightDefaults, type GiraffeLightSettings } from './giraffe/settings'
export { DEFAULT_LIGHT, type LightSettings } from './light-settings'

/** Light positions can follow the camera or stay fixed in the studio. */
export function createLighting(renderer: WebGLRenderer, scene: Scene, stoneLights: Group) {
  const studioLights = new Group()
  const ambient = new AmbientLight('white', .9)
  const key = new DirectionalLight('white', 3.5)
  const fill = new DirectionalLight('white', 1)
  const rim = new DirectionalLight('#f3d9c6', 2.2)
  studioLights.add(ambient, key, fill, rim)
  const accent = new SpotLight('white', 0)
  accent.decay = 0
  scene.add(studioLights, accent, accent.target)
  const settings = { ...DEFAULT_LIGHT }
  const originalRig = createQ2StudioLighting()
  scene.add(originalRig.group)
  let originalSettings = giraffeLightDefaults()
  let mode: 'sculpture' | 'giraffe' = 'sculpture'
  let orbit = 0
  const stoneKey = stoneLights.getObjectByName('key') as DirectionalLight
  const stoneFill = stoneLights.getObjectByName('fill') as DirectionalLight
  const stoneRim = stoneLights.getObjectByName('rim') as DirectionalLight
  for (const light of [stoneKey, stoneFill, stoneRim, key, fill, rim]) {
    light.shadow.mapSize.set(2048, 2048)
    Object.assign(light.shadow.camera, { left: -8, right: 8, top: 5, bottom: -5, near: .1, far: 40 })
    light.shadow.bias = -.0001
  }
  accent.shadow.mapSize.set(2048, 2048)
  accent.shadow.bias = -.0001
  accent.shadow.camera.near = .1
  accent.shadow.camera.far = 45
  let rocky = true
  let sculpture = false
  const position = new Vector3(), tint = new Color()
  function update(camera: Camera) {
    const original = mode === 'giraffe'
    originalRig.group.visible = original
    studioLights.visible = !original && !rocky
    stoneLights.visible = !original && rocky
    accent.visible = !original
    if (original) {
      originalRig.update(originalSettings.lamps, originalSettings.intensity)
      originalRig.group.rotation.y = originalSettings.orbit ? orbit : 0
      scene.environmentIntensity = ORIGINAL.envIntensity * originalSettings.environment / 100
      scene.environmentRotation.y = originalSettings.rotation * Math.PI / 180 + originalRig.group.rotation.y
      renderer.toneMappingExposure = ORIGINAL.exposure * originalSettings.exposure / 100
      return
    }
    const move = (object: DirectionalLight | SpotLight | typeof accent.target, x: number, y: number, z: number) => {
      position.set(x, y, z)
      if (object !== accent.target && position.lengthSq() < .01) position.z = .1
      if (settings.followCamera) position.applyQuaternion(camera.quaternion)
      object.position.copy(position)
    }
    const color = (light: DirectionalLight, value: string, base = '#ffffff') => light.color.set(base).multiply(tint.set(value))
    color(stoneKey, settings.keyColor, sculpture ? '#ffffff' : LOOK.lights.key.color)
    color(stoneFill, settings.fillColor, sculpture ? '#ffffff' : LOOK.lights.fill.color)
    color(stoneRim, settings.rimColor, sculpture ? '#ffffff' : LOOK.lights.rim.color)
    color(key, settings.keyColor); color(fill, settings.fillColor); color(rim, settings.rimColor, '#f3d9c6')
    for (const light of [stoneKey, key]) move(light, settings.x / 10, settings.y / 10, settings.z / 10 + (sculpture ? 0 : 4))
    for (const light of [stoneFill, fill]) move(light, settings.fillX / 10 + (sculpture ? 0 : 6), settings.fillY / 10 - (sculpture ? 0 : 5), settings.fillZ / 10 - (sculpture ? 0 : 2))
    for (const light of [stoneRim, rim]) move(light, settings.rimX / 10, settings.rimY / 10 - (sculpture ? 0 : 2), settings.rimZ / 10)
    const strength = (enabled: boolean, value: number) => enabled ? value / 100 : 0
    stoneKey.intensity = (sculpture ? 7.5 : LOOK.keyLight) * strength(settings.keyOn, settings.intensity)
    stoneFill.intensity = (sculpture ? 6 : 1) * strength(settings.fillOn, settings.fill)
    stoneRim.intensity = (sculpture ? .8 : LOOK.rimLight) * strength(settings.rimOn, settings.rim)
    key.intensity = 3.5 * strength(settings.keyOn, settings.intensity)
    fill.intensity = strength(settings.fillOn, settings.fill)
    rim.intensity = 2.2 * strength(settings.rimOn, settings.rim)
    const shadows = (light: DirectionalLight | SpotLight, enabled: boolean, scale = 1) => {
      light.castShadow = enabled && light.intensity > 0
      light.shadow.intensity = settings.shadowStrength / 100 * scale
      light.shadow.radius = settings.softness / 10
      light.shadow.normalBias = sculpture ? .002 : .004
    }
    for (const light of [stoneKey, key]) shadows(light, settings.keyShadow, sculpture ? 1 : .48)
    for (const light of [stoneFill, fill]) shadows(light, settings.fillShadow)
    for (const light of [stoneRim, rim]) shadows(light, settings.rimShadow)
    move(accent, settings.accentX / 10, settings.accentY / 10, settings.accentZ / 10)
    move(accent.target, settings.targetX / 25, settings.targetY / 25, 0)
    accent.intensity = 9 * strength(settings.accentOn, settings.accent)
    accent.color.set(settings.accentColor)
    accent.angle = settings.angle * Math.PI / 180
    accent.penumbra = settings.penumbra / 100
    shadows(accent, settings.accentShadow)
    ambient.intensity = .9 * settings.ambient / 30
    scene.environmentIntensity = (sculpture ? .025 : rocky ? LOOK.envIntensity : 1) * settings.ambient / 30
    scene.environmentRotation.y = ((rocky ? LOOK.envRotation : 0) + settings.envRotation) * Math.PI / 180
    renderer.toneMappingExposure = (rocky ? LOOK.exposure : 1.35) * settings.exposure / 100
  }
  return {
    settings, update,
    get originalSettings() { return structuredClone(originalSettings) },
    setMode(value: 'sculpture' | 'giraffe') { mode = value },
    setOriginal(value: GiraffeLightSettings) { originalSettings = value },
    advance(dt: number) { orbit = (orbit + dt * Math.PI * 2 / 15) % (Math.PI * 2) },
    setSculpture(value: boolean) { sculpture = value },
    setFinish(stone: boolean) { rocky = stone; studioLights.visible = !stone; stoneLights.visible = stone },
    set(patch: Partial<LightSettings>) { Object.assign(settings, patch) },
    dispose() {
      originalRig.dispose()
      for (const light of [key, fill, rim, ambient, accent]) light.dispose()
      scene.remove(studioLights, accent, accent.target)
    },
  }
}
