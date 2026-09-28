import { noise } from '../stone/erosion-noise'

// Unequal edge losses, like pieces snapped away from a larger rock.
const chips = [
  [1.60, .13, .17], [.45, .21, .20], [-.86, .19, .17],
  [-2.60, .23, .16], [2.56, .15, .12],
] as const

/** A shared coordinate warp keeps all face seams together after chipping. */
export function fracturePoint(x: number, y: number, z: number): [number, number, number] {
  const radius = Math.hypot(x / 1.8, y / 2.7)
  const angle = Math.atan2(y / 2.7, x / 1.8) + z * .10
  let missing = 0
  for (const [center, width, depth] of chips) {
    const difference = Math.atan2(Math.sin(angle - center), Math.cos(angle - center))
    missing = Math.max(missing, Math.max(0, 1 - Math.abs(difference) / width) * depth)
  }
  const edge = Math.min(radius * radius, 1.1)
  const shrink = 1 - missing * edge
  const fault = Math.abs(noise(x * 1.8, y * 2.4, z * 1.4, 1741))
  const rough = noise(x * 2.1, y * 2.1, z * 2.1, 821) * .16
    + noise(x * 6.8, y * 6.8, z * 6.8, 531) * .055
    + noise(x * 19, y * 19, z * 19, 193) * .017
  return [
    x * shrink + rough * .6,
    y * shrink + noise(x * 2.4, y * 2.4, z * 2.4, 57) * .095,
    z + rough + (fault - .3) * .16 * edge,
  ]
}
