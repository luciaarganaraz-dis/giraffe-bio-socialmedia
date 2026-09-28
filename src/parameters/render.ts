import { ACESFilmicToneMapping, AgXToneMapping, LinearToneMapping, NeutralToneMapping, ReinhardToneMapping, type WebGLRenderer, type Scene } from 'three'
import type { RenderSettings } from './scene-settings'
const modes = { agx: AgXToneMapping, aces: ACESFilmicToneMapping, neutral: NeutralToneMapping, linear: LinearToneMapping, reinhard: ReinhardToneMapping }
export function applyRender(renderer: WebGLRenderer, scene: Scene, settings: RenderSettings) {
  renderer.toneMapping = modes[settings.tone as keyof typeof modes] ?? AgXToneMapping
  // Lighting writes its base values before these independent render adjustments.
  renderer.toneMappingExposure *= 2 ** settings.exposure
  scene.environmentIntensity *= settings.environment / 100
}
