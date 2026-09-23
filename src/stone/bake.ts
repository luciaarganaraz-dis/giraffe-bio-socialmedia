import * as THREE from 'three'
import { CARVED_LOOK as LOOK } from './carved-look'
import { FRAG_COMMON, FRAG_MAP, FRAG_METAL, FRAG_NORMAL, FRAG_ROUGH } from './triplanar-shaders'
import type { TriUniforms } from './triplanar'

const vertexShader = /* glsl */ `
  varying vec3 vTriWorldPos;
  varying vec3 vTriWorldNormal;
  varying mat3 vTexToWorld;
  varying vec2 vBakeUv;
  void main() {
    vTriWorldPos = position;
    vTriWorldNormal = normal;
    vTexToWorld = mat3(1.0);
    vBakeUv = uv;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  }
`
const fragmentShader = /* glsl */ `
  precision highp sampler3D;
  ${FRAG_COMMON}
  varying vec2 vBakeUv;
  uniform float roughness;
  uniform float metalness;
  void main() {
    vec4 diffuseColor = vec4(1.0);
    ${FRAG_MAP}
    #if BAKE_MODE == 0
      vec3 c = max(diffuseColor.rgb, vec3(0.0));
      c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
      gl_FragColor = vec4(c, 1.0);
    #elif BAKE_MODE == 1
      ${FRAG_ROUGH}
      ${FRAG_METAL}
      gl_FragColor = vec4(1.0, roughnessFactor, metalnessFactor, 1.0);
    #else
      vec3 normal;
      ${FRAG_NORMAL}
      // Object-space relief becomes a portable tangent-space normal map.
      vec3 n = normalize(vTriWorldNormal);
      vec3 q1 = dFdx(vTriWorldPos), q2 = dFdy(vTriWorldPos);
      vec2 st1 = dFdx(vBakeUv), st2 = dFdy(vBakeUv);
      float det = st1.x * st2.y - st1.y * st2.x;
      vec3 t = (q1 * st2.y - q2 * st1.y) / det;
      vec3 b = (-q1 * st2.x + q2 * st1.x) / det;
      t = normalize(t - n * dot(n, t));
      float handedness = sign(dot(cross(n, t), b));
      b = normalize(cross(n, t)) * handedness;
      vec3 tangentNormal = normalize(vec3(dot(triWorldN, t), dot(triWorldN, b), dot(triWorldN, n)));
      gl_FragColor = vec4(tangentNormal * 0.5 + 0.5, 1.0);
    #endif
  }
`

/** Bake the actual source shader in UV space, so the GLB carries the same stone. */
export function bakeStone(renderer: THREE.WebGLRenderer, model: THREE.Group, uniforms: TriUniforms, size: number) {
  const target = new THREE.WebGLRenderTarget(size, size, { depthBuffer: false, stencilBuffer: false })
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera()
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms: { ...uniforms, roughness: { value: LOOK.roughness }, metalness: { value: LOOK.metalness } },
    defines: { BAKE_MODE: 0 }, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false,
  })
  for (const child of model.children) {
    const proxy = new THREE.Mesh((child as THREE.Mesh).geometry, material)
    proxy.frustumCulled = false
    scene.add(proxy)
  }
  const previousTarget = renderer.getRenderTarget()
  const previousClear = renderer.getClearColor(new THREE.Color())
  const previousAlpha = renderer.getClearAlpha()
  const maps: THREE.CanvasTexture[] = []
  try {
    renderer.setRenderTarget(target)
    renderer.setClearColor('black', 0)
    for (let mode = 0; mode < 3; mode++) {
      material.defines.BAKE_MODE = mode
      material.needsUpdate = true
      renderer.clear()
      renderer.render(scene, camera)
      const pixels = new Uint8Array(size * size * 4)
      renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels)
      // Extend island edges a few texels for bilinear filtering and mipmaps.
      padEdges(pixels, size)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const context = canvas.getContext('2d')!
      const data = context.createImageData(size, size)
      for (let y = 0; y < size; y++) data.data.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), (size - y - 1) * size * 4)
      context.putImageData(data, 0, 0)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = mode === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace
      maps.push(texture)
    }
    return maps
  } catch (error) {
    maps.forEach(texture => texture.dispose())
    throw error
  } finally {
    renderer.setRenderTarget(previousTarget)
    renderer.setClearColor(previousClear, previousAlpha)
    target.dispose()
    material.dispose()
  }
}

function padEdges(pixels: Uint8Array, size: number) {
  const stride = size * 4
  const next = new Uint8Array(pixels.length)
  for (let pass = 0; pass < 4; pass++) {
    next.set(pixels)
    for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) {
      const i = (y * size + x) * 4
      if (pixels[i + 3]) continue
      for (const offset of [-4, 4, -stride, stride]) {
        if (!pixels[i + offset + 3]) continue
        next.set(pixels.subarray(i + offset, i + offset + 4), i)
        break
      }
    }
    pixels.set(next)
  }
}
