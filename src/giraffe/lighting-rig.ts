// Adapted from Giraffe bio, revision 002f979.
import * as THREE from 'three'
import { temperatureColor } from '../parameters/light-temperature'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { q2LampDefaults, type Q2LampSettings, type Q2LampType } from './lamp-settings'

type StudioLight = THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight | THREE.RectAreaLight
let areaReady = false

function createLight(type: Q2LampType): StudioLight {
  if (type === 'area') {
    if (!areaReady) { RectAreaLightUniformsLib.init(); areaReady = true }
    return new THREE.RectAreaLight()
  }
  if (type === 'spot') return new THREE.SpotLight()
  if (type === 'point') return new THREE.PointLight()
  return new THREE.DirectionalLight()
}

/** Editable studio lights, shared in local stone coordinates by all specimens. */
export function createQ2StudioLighting() {
  const group = new THREE.Group()
  const defaults = q2LampDefaults()
  const entries: { type: Q2LampType; light: StudioLight }[] = []
  const direction = new THREE.Vector3()
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ')
  let previousSettings: Q2LampSettings[] | undefined
  let previousIntensity: number | undefined
  const update = (settings: Q2LampSettings[] = defaults, intensity = 100) => {
    if (settings === previousSettings && intensity === previousIntensity) return
    previousSettings = settings
    previousIntensity = intensity
    defaults.forEach((base, index) => {
      const spec = settings[index] ?? base
      let entry = entries[index]
      if (!entry || entry.type !== spec.type) {
        if (entry) {
          group.remove(entry.light)
          if ('target' in entry.light) group.remove(entry.light.target)
          entry.light.dispose()
        }
        entry = { type: spec.type, light: createLight(spec.type) }
        if (entry.light instanceof THREE.DirectionalLight) {
          Object.assign(entry.light.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 60 })
        }
        entries[index] = entry
        group.add(entry.light)
        if ('target' in entry.light) group.add(entry.light.target)
      }
      const light = entry.light
      light.visible = spec.enabled
      light.color.set(spec.color)
      if (spec.useTemperature) light.color.multiply(temperatureColor(spec.temperature))
      if ('distance' in light) { light.distance = spec.distance; light.decay = spec.decay }
      if ('shadow' in light) {
        light.castShadow = spec.shadows
        light.shadow.intensity = spec.shadowStrength
        light.shadow.radius = spec.shadowSoftness
        light.shadow.bias = spec.shadowBias
        light.shadow.normalBias = spec.normalBias
        const resolution = 2 ** Math.round(Math.log2(spec.shadowResolution))
        if (light.shadow.mapSize.x !== resolution) {
          light.shadow.mapSize.set(resolution, resolution)
          light.shadow.map?.dispose(); light.shadow.map = null
        }
      }
      light.intensity = spec.power * intensity / 100
      light.position.set(spec.x, spec.y, spec.z)
      rotation.set(THREE.MathUtils.degToRad(spec.rotationX), THREE.MathUtils.degToRad(spec.rotationY), THREE.MathUtils.degToRad(spec.rotationZ), 'YXZ')
      light.rotation.copy(rotation)
      if ('target' in light) {
        direction.set(0, 0, -1).applyEuler(rotation)
        light.target.position.copy(light.position).add(direction)
      }
      if (light instanceof THREE.SpotLight) {
        light.angle = THREE.MathUtils.degToRad(spec.angle / 2)
        light.penumbra = spec.softness / 100
      }
      if (light instanceof THREE.RectAreaLight) { light.width = spec.width; light.height = spec.height }
    })
  }
  return { group, update, dispose() {
    entries.forEach(({ light }) => light.dispose())
    group.removeFromParent()
  } }
}
