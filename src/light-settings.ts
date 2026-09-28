export const DEFAULT_LIGHT = {
  x: 80, y: 45, z: 30, intensity: 100, keyColor: '#ffffff', keyOn: true, keyShadow: true,
  fillX: -50, fillY: 20, fillZ: 70, fill: 22, fillColor: '#ffffff', fillOn: true, fillShadow: false,
  rimX: 50, rimY: 40, rimZ: -40, rim: 35, rimColor: '#ffffff', rimOn: true, rimShadow: false,
  accentX: -60, accentY: 60, accentZ: 80, accent: 100, accentColor: '#ffcf9e', accentOn: false, accentShadow: true,
  angle: 28, penumbra: 65, targetX: 0, targetY: 0,
  ambient: 22, envRotation: 0, exposure: 100, shadowStrength: 100, softness: 10, followCamera: true,
}
export type LightSettings = typeof DEFAULT_LIGHT
export type NumericLightKey = { [K in keyof LightSettings]: LightSettings[K] extends number ? K : never }[keyof LightSettings]
export type BooleanLightKey = { [K in keyof LightSettings]: LightSettings[K] extends boolean ? K : never }[keyof LightSettings]
export type ColorLightKey = { [K in keyof LightSettings]: LightSettings[K] extends string ? K : never }[keyof LightSettings]
export const LIGHT_SOURCES: { id: string; name: string; note: string; intensity: NumericLightKey; axes: NumericLightKey[]; color: ColorLightKey; on: BooleanLightKey; shadow: BooleanLightKey }[] = [
  { id: 'key', name: 'Principal', note: 'Define el volumen y las sombras.', intensity: 'intensity', axes: ['x', 'y', 'z'], color: 'keyColor', on: 'keyOn', shadow: 'keyShadow' },
  { id: 'fill', name: 'Relleno', note: 'Recupera detalle en las zonas oscuras.', intensity: 'fill', axes: ['fillX', 'fillY', 'fillZ'], color: 'fillColor', on: 'fillOn', shadow: 'fillShadow' },
  { id: 'rim', name: 'Contraluz', note: 'Dibuja los bordes desde atrás.', intensity: 'rim', axes: ['rimX', 'rimY', 'rimZ'], color: 'rimColor', on: 'rimOn', shadow: 'rimShadow' },
  { id: 'accent', name: 'Foco de acento', note: 'Un haz concentrado sobre la piedra.', intensity: 'accent', axes: ['accentX', 'accentY', 'accentZ'], color: 'accentColor', on: 'accentOn', shadow: 'accentShadow' },
]
export const LIGHT_PRESETS: Record<string, { name: string; values: Partial<LightSettings> }> = {
  reference: { name: 'Referencia', values: {} },
  soft: { name: 'Suave', values: { x: -35, y: 65, z: 95, intensity: 70, fill: 65, rim: 45, ambient: 70, softness: 85, shadowStrength: 65 } },
  dramatic: { name: 'Contraste', values: { x: 95, y: 20, z: 10, intensity: 130, fill: 7, rim: 110, ambient: 5, softness: 3 } },
  warm: { name: 'Cálida / fría', values: { x: -65, y: 55, z: 45, intensity: 110, keyColor: '#ffbd80', fill: 30, fillColor: '#9fbfff', rim: 150, rimColor: '#8caeff', ambient: 15 } },
}
