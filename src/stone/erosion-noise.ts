function hash(x: number, y: number, z: number, seed: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 2147483647.5 - 1
}
export function noise(x: number, y: number, z: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fade = (v: number) => v * v * (3 - 2 * v)
  const tx = fade(x - ix), ty = fade(y - iy), tz = fade(z - iz)
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  const layer = (k: number) => mix(
    mix(hash(ix, iy, k, seed), hash(ix + 1, iy, k, seed), tx),
    mix(hash(ix, iy + 1, k, seed), hash(ix + 1, iy + 1, k, seed), tx), ty,
  )
  return mix(layer(iz), layer(iz + 1), tz)
}

