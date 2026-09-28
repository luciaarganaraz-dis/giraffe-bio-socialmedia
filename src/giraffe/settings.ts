import { LOOK } from '../stone/look'
import { q2LampDefaults, readQ2Lamps, type Q2LampSettings } from './lamp-settings'

export type GiraffeLightSettings = {
  intensity: number; environment: number; exposure: number; rotation: number
  orbit: boolean; lamps: Q2LampSettings[]
}
export const worldRanges = {
  intensity: [0, 200], environment: [0, 200], exposure: [0, 200], rotation: [0, 360],
} as const
export const giraffeLightDefaults = (): GiraffeLightSettings => ({
  intensity: 100, environment: 100, exposure: 100, rotation: LOOK.envRotation,
  orbit: false, lamps: q2LampDefaults(),
})
export function readGiraffeLight(value: unknown): GiraffeLightSettings {
  const result = giraffeLightDefaults()
  if (!value || typeof value !== 'object') return result
  const saved = value as Record<string, unknown>
  result.lamps = readQ2Lamps(saved.lamps)
  if (typeof saved.orbit === 'boolean') result.orbit = saved.orbit
  for (const key of Object.keys(worldRanges) as (keyof typeof worldRanges)[]) {
    const n = saved[key], [min, max] = worldRanges[key]
    if (typeof n === 'number' && Number.isFinite(n)) result[key] = Math.max(min, Math.min(max, n))
  }
  return result
}
