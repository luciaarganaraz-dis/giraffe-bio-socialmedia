import { noise } from '../stone/erosion-noise'

/** Piecewise planes, rather than rounded bumps, for exposed fracture surfaces. */
function facets(u: number, v: number, seed: number) {
  const x = Math.floor(u), y = Math.floor(v), a = u - x, b = v - y
  const p00 = noise(x, y, 0, seed), p10 = noise(x + 1, y, 0, seed)
  const p01 = noise(x, y + 1, 0, seed), p11 = noise(x + 1, y + 1, 0, seed)
  return a + b <= 1 ? p00 + a * (p10 - p00) + b * (p01 - p00)
    : p11 + (1 - a) * (p01 - p11) + (1 - b) * (p10 - p11)
}

/** Change each cross-section through the thickness, leaving the front intact. */
export function rockSidewall(x: number, y: number, z: number): [number, number] {
  const t = Math.max(0, Math.min(1, (.96 - z) / .55))
  const mask = t * t * (3 - 2 * t)
  const radius = Math.max(1, Math.hypot(x, y * .68))
  const shelves = facets(y * 1.45 + z * .4, z * 2.2 - y * .25, 1947)
  const breaks = facets(x * 1.6 - z * .6, z * 2.6 + y * .24, 832)
  const fold = Math.max(0, 1 - Math.abs(z + y * .27 + .08) / .23)
  const side = mask * (.10 + shelves * .55 - fold * .23)
  return [x / radius * side, y * .68 / radius * mask * breaks * .32]
}

/** The same depth-dependent warp for all five lobes keeps their gaps coherent. */
export function carvedSidewall(x: number, y: number, z: number, depth: number): [number, number] {
  const floor = 1.03 - (.22 + depth * .005)
  const crest = 1.03 + (.18 + depth * .005)
  const t = Math.max(0, Math.min(1, (z - floor) / (crest - floor)))
  const mask = Math.sin(t * Math.PI)
  return [
    (facets(x * 3.2 + y * .7, z * 5.6 + y * 1.3, 719) * .16
      + facets(x * 2.1 + y * .5, z * 17 + y * .6, 461) * .13) * mask,
    (facets(y * 3.8 - x * .6, z * 5.2 - x * .9, 1231) * .14
      + facets(y * 2.2 - x * .4, z * 15 - x * .7, 904) * .10) * mask,
  ]
}
