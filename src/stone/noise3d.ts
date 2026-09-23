import * as THREE from 'three'

/* ---------------------------------------------------------------------------
   3D noise, baked into a texture once at startup.

   Five octaves of fbm evaluated per pixel cost around 64 hashes per fragment
   and were 90% of the cost of a frame. Precomputing them here leaves one
   texture fetch. It adds nothing to the download: the texture is generated in
   the browser.

   Each octave's lattice is periodic (indices mod f), so the texture tiles with
   no seam and can be sampled at any scale with RepeatWrapping.
   --------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lattice(f: number, rnd: () => number) {
  const g = new Float32Array(f * f * f)
  for (let i = 0; i < g.length; i++) g[i] = rnd()
  return g
}

const fade = (t: number) => t * t * (3 - 2 * t)

function sampleLattice(g: Float32Array, f: number, x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const tx = fade(x - xi)
  const ty = fade(y - yi)
  const tz = fade(z - zi)
  const x0 = ((xi % f) + f) % f
  const y0 = ((yi % f) + f) % f
  const z0 = ((zi % f) + f) % f
  const x1 = (x0 + 1) % f
  const y1 = (y0 + 1) % f
  const z1 = (z0 + 1) % f

  const at = (a: number, b: number, c: number) => g[(c * f + b) * f + a]
  const c00 = at(x0, y0, z0) + (at(x1, y0, z0) - at(x0, y0, z0)) * tx
  const c10 = at(x0, y1, z0) + (at(x1, y1, z0) - at(x0, y1, z0)) * tx
  const c01 = at(x0, y0, z1) + (at(x1, y0, z1) - at(x0, y0, z1)) * tx
  const c11 = at(x0, y1, z1) + (at(x1, y1, z1) - at(x0, y1, z1)) * tx
  const c0 = c00 + (c10 - c00) * ty
  const c1 = c01 + (c11 - c01) * ty
  return c0 + (c1 - c0) * tz
}

export function makeNoise3DTexture(size = 64, seed = 1337) {
  const rnd = mulberry32(seed)
  const freqs = [2, 4, 8, 16] // fbm, for the large patches
  const lats = freqs.map((f) => lattice(f, rnd))
  const speckLat = lattice(32, rnd) // high frequency, for the pyrite
  const grainLat = lattice(size, rnd) // one value per voxel: the fine grain

  const amps = freqs.map((_, i) => 0.5 ** (i + 1))
  const ampSum = amps.reduce((a, b) => a + b, 0)

  const data = new Uint8Array(size * size * size * 4)
  let i = 0
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size
        const v = y / size
        const w = z / size

        let fbm = 0
        for (let o = 0; o < freqs.length; o++) {
          const f = freqs[o]
          fbm += amps[o] * sampleLattice(lats[o], f, u * f, v * f, w * f)
        }
        fbm /= ampSum

        const speck = sampleLattice(speckLat, 32, u * 32, v * 32, w * 32)

        data[i++] = fbm * 255
        data[i++] = speck * 255
        data[i++] = sampleLattice(grainLat, size, x, y, z) * 255
        data[i++] = 255
      }
    }
  }

  const tex = new THREE.Data3DTexture(data, size, size, size)
  tex.format = THREE.RGBAFormat
  tex.type = THREE.UnsignedByteType
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.wrapR = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}
