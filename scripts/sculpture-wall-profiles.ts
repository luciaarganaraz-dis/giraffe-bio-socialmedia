import { Raycaster, Vector3, type Object3D } from 'three'

/** Sample the actual walls through their thickness, independently of textures. */
export function wallProfiles(model: Object3D, center: number[], depth: number) {
  const offset = new Vector3().fromArray(center)
  const ray = new Raycaster()
  const profile = (x: number, y: number, start: number, end: number, direction: number) => {
    const samples = Array.from({ length: 13 }, (_, i) => {
      const z = start + (end - start) * i / 12
      ray.set(new Vector3(x, y, z).sub(offset), new Vector3(direction, 0, 0))
      const hit = ray.intersectObject(model)[0]
      return { z, x: hit ? hit.point.x + offset.x : null }
    })
    const xs = samples.map(sample => sample.x ?? NaN)
    // A taper alone is still a straight extrusion. Measure departures from a line.
    const departure = Math.max(...xs.map((x, i) => Math.abs(x - (xs[0] + (xs[12] - xs[0]) * i / 12))))
    return { samples, range: Math.max(...xs) - Math.min(...xs), departure }
  }
  const floor = 1.03 - (.22 + depth * .005)
  const crest = 1.03 + (.18 + depth * .005)
  return {
    rock: profile(5, 0, -.7, .5, -1),
    raised: profile(5, .353, 1.25, crest - .06, -1),
    recessed: profile(-1.13, .174, floor + .07, .81, 1),
  }
}
