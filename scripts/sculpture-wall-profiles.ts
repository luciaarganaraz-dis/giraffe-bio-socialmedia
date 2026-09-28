import { Raycaster, Vector3, type Object3D } from 'three'

/** Sample the actual walls through their thickness, independently of textures. */
export function wallProfiles(model: Object3D, center: number[], depth: number, probes: { x: number; y: number; recessed: boolean }[]) {
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
  const right = probes.filter(probe => probe.recessed).sort((a, b) => b.x - a.x)[0]
  const left = probes.filter(probe => probe.recessed).sort((a, b) => a.x - b.x)[0]
  return {
    rock: profile(5, 0, -.7, .5, -1),
    recessedRight: profile(right.x, right.y, floor + .07, .81, 1),
    recessed: profile(left.x, left.y, floor + .07, .81, 1),
  }
}
