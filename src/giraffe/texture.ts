import type { MeshStandardMaterial } from 'three'
import { LOOK, type RockLook } from '../stone/look'
import { applyLook, type TriUniforms } from '../stone/triplanar'

/** Q2's material controls, relative to the selected base and independent of light. */
export const textureRanges = {
  scale: [25, 250], relief: [0, 200], detail: [0, 200], veins: [0, 200],
  roughness: [25, 175], goldAmount: [0, 200], goldSize: [25, 200],
  goldSpecks: [0, 200], goldShine: [0, 200],
} as const
export type TextureKey = keyof typeof textureRanges
export type TexturePreset = 'sculpture' | 'original-004-v2'
export type TextureSettings = Record<TextureKey, number> & { preset: TexturePreset }
export const textureDefaults = (preset: TexturePreset = 'sculpture'): TextureSettings => ({
  preset, scale: 100, relief: 100, detail: 100, veins: 100, roughness: 100,
  goldAmount: 0, goldSize: 100, goldSpecks: preset === 'sculpture' ? 0 : 100, goldShine: 100,
})
export function readTexture(value: unknown): TextureSettings {
  const saved = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const state = textureDefaults(saved.preset === 'original-004-v2' ? saved.preset : 'sculpture')
  for (const key of Object.keys(textureRanges) as TextureKey[]) {
    const n = saved[key], [min, max] = textureRanges[key]
    if (typeof n === 'number' && Number.isFinite(n)) state[key] = Math.max(min, Math.min(max, n))
  }
  return state
}
export function createTextureController(material: MeshStandardMaterial, uniforms: TriUniforms, specimen: RockLook) {
  return (settings: TextureSettings) => {
    const base = settings.preset === 'original-004-v2' ? LOOK : specimen
    applyLook(base, uniforms)
    uniforms.uTriScale.value = base.scale * settings.scale / 100
    uniforms.uTriNormal.value = base.relief * settings.relief / 100
    uniforms.uGrainRelief.value = base.grainRelief * settings.relief / 100
    uniforms.uTriDetail.value = settings.detail / 100
    uniforms.uVeinAmount.value = Math.max(.05, Math.min(.95, base.veinAmount - (settings.veins - 100) * .003))
    material.roughness = Math.max(.08, Math.min(1, base.roughness * settings.roughness / 100))
    material.metalness = base.metalness
    uniforms.uGoldAmount.value = settings.goldAmount / 100
    uniforms.uGoldRadius.value = base.goldRadius * settings.goldSize / 100
    // A mineral control must also work on the plain stone base, whose gold starts at zero.
    uniforms.uPyriteAmount.value = Math.min(1.25, LOOK.pyriteAmount * settings.goldSpecks / 100)
    uniforms.uPyriteColor.value.set(LOOK.pyriteColor)
    uniforms.uGoldMetal.value = Math.min(1, base.goldMetal * settings.goldShine / 100)
    uniforms.uGoldRough.value = Math.max(.08, Math.min(1, base.goldRough * (2 - settings.goldShine / 100)))
  }
}
