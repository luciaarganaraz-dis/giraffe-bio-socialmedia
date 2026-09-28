import { Mesh, PlaneGeometry, ShaderMaterial, Color } from 'three'

export function createSculptureBackground() {
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    uniforms: { topColor: { value: new Color('#525252').convertLinearToSRGB() }, bottomColor: { value: new Color('#a1a1a1').convertLinearToSRGB() }, grainAmount: { value: .025 } },
    depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, .9999, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform vec3 topColor; uniform vec3 bottomColor; uniform float grainAmount;
      void main() {
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        vec3 shade = mix(topColor, bottomColor, (1. - smoothstep(0., 1., vUv.y)) * (1. - .35 * vUv.x));
        shade += grain * grainAmount;
        gl_FragColor = vec4(shade, 1.);
      }`,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = -100
  mesh.name = 'Fondo de estudio'
  return { mesh, set(top: string, bottom: string, grain: number) {
    material.uniforms.topColor.value.set(top).convertLinearToSRGB()
    material.uniforms.bottomColor.value.set(bottom).convertLinearToSRGB()
    material.uniforms.grainAmount.value = grain
  }, dispose() { material.dispose(); geometry.dispose() } }
}
