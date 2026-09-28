import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'

export function createSculptureBackground() {
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, .9999, 1.0); }`,
    fragmentShader: `varying vec2 vUv;
      void main() {
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        float shade = .32 + .31 * (1. - smoothstep(0., 1., vUv.y)) * (1. - .35 * vUv.x);
        shade += grain * .025;
        gl_FragColor = vec4(vec3(shade), 1.);
      }`,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = -100
  mesh.name = 'Fondo de estudio'
  return { mesh, dispose() { material.dispose(); geometry.dispose() } }
}
