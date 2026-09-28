// Adapted from Giraffe bio, revision 002f979.
import { LOOK } from '../stone/look'

export type Q2LampType = 'sun' | 'point' | 'spot' | 'area'
export type Q2LampSettings = {
  type: Q2LampType
  enabled: boolean
  color: string
  power: number
  x: number; y: number; z: number
  rotationX: number; rotationY: number; rotationZ: number
  angle: number
  softness: number
  width: number
  height: number
}
export type Q2LampParameter = Exclude<keyof Q2LampSettings, 'type' | 'enabled' | 'color'>
export const Q2_LAMP_TYPES: Q2LampType[] = ['sun', 'point', 'spot', 'area']
export const Q2_LAMP_POWER_MAX = { sun: 50, point: 5000, spot: 5000, area: 500 }
export const Q2_LAMP_RANGES: Record<Q2LampParameter, readonly [number, number, number]> = {
  power: [0, 5000, 0.01],
  x: [-12, 12, 0.01], y: [-12, 12, 0.01], z: [-12, 12, 0.01],
  rotationX: [-180, 180, 0.01], rotationY: [-180, 180, 0.01], rotationZ: [-180, 180, 0.01],
  angle: [5, 160, 1], softness: [0, 100, 1],
  width: [0.1, 10, 0.1], height: [0.1, 10, 0.1],
}

export function q2LampDefaults(): Q2LampSettings[] {
  const strengths: Record<string, number> = { key: LOOK.keyLight, rim: LOOK.rimLight, fill: LOOK.fillLight, back: 7.5 }
  return [
    ...Object.entries(LOOK.lights).map(([id, spec]) => ({ i: strengths[id], ...spec })),
    ...LOOK.extraLights,
  ].map((spec) => ({
    type: 'sun', enabled: true, color: spec.color, power: spec.i ?? 1,
    x: spec.x, y: spec.y, z: spec.z,
    // YXZ Euler angles: every original lamp starts aimed at the stone's centre.
    rotationX: Math.atan2(-spec.y, Math.hypot(spec.x, spec.z)) * 180 / Math.PI,
    rotationY: Math.atan2(spec.x, spec.z) * 180 / Math.PI,
    rotationZ: 0, angle: 60, softness: 55, width: 3, height: 3,
  }))
}

/** Preserve orientation and approximate brightness when changing light type. */
export function q2ChangeLampType(lamp: Q2LampSettings, type: Q2LampType): Q2LampSettings {
  const distanceSquared = Math.max(1, lamp.x ** 2 + lamp.y ** 2 + lamp.z ** 2)
  const factor = (kind: Q2LampType) => kind === 'sun' ? 1
    : kind === 'area' ? distanceSquared / (lamp.width * lamp.height) : distanceSquared
  return { ...lamp, type, power: Math.min(Q2_LAMP_POWER_MAX[type], lamp.power * factor(type) / factor(lamp.type)) }
}

/** Old saves get all six approved lights; invalid fields cannot reach WebGL. */
export function readQ2Lamps(saved: unknown): Q2LampSettings[] {
  return q2LampDefaults().map((base, index) => {
    const value = Array.isArray(saved) ? saved[index] : undefined
    if (!value || typeof value !== 'object' || Array.isArray(value)) return base
    const result = { ...base }
    if (Q2_LAMP_TYPES.includes(value.type)) result.type = value.type
    if (typeof value.enabled === 'boolean') result.enabled = value.enabled
    if (typeof value.color === 'string' && /^#[\da-f]{6}$/i.test(value.color)) result.color = value.color
    for (const key of Object.keys(Q2_LAMP_RANGES) as Q2LampParameter[]) {
      const [min, max] = Q2_LAMP_RANGES[key]
      const n: unknown = value[key]
      if (typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max) result[key] = n
    }
    result.power = Math.min(result.power, Q2_LAMP_POWER_MAX[result.type])
    return result
  })
}
