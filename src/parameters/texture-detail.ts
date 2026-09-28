import { Color } from 'three'
import type { TriUniforms } from '../stone/triplanar'
import { color, number as n, toggle, type ParameterGroup } from './panel'

// These values map to the actual stone shader, not a second painted material.
export const DETAIL_DEFAULTS = {
  enabled: false, matrixColor: '#000000', veinColor: '#b5b5b5', pyriteColor: '#bca162', fleckColor: '#383838', goldLight: '#c99a3b', goldDark: '#6b4f18',
  veinScale: 10.96, veinSoftness: .105, veinWarp: .91, veinInterlace: .39, veinGrain: 5, veinRough: .95, matrixRough: .62,
  pyriteScale: 42, pyriteRough: .3, grain: 0, grainScale: 10, grainRelief: 0, blend: 4, antiTiling: .5, ao: .77, roughMin: .34, roughMax: .92,
  fleckAmount: .26, fleckScale: 55, fleckEdge: .12, fleckMetal: 0, fleckRough: 0,
  goldX: .47, goldY: .24, goldZ: .39, goldIrregular: .87, goldIrregularScale: 1.3, goldSpeckScale: 84, goldSpeckStrength: 1.1, goldSpeckWidth: .06,
  chiselStrength: 0, chiselScale: 34, chiselStretch: 1, chiselAngle: 175.326, chiselSharpness: 1,
}
export type DetailSettings = typeof DETAIL_DEFAULTS
export const DETAIL_GROUPS: ParameterGroup[] = [
  { title: 'Textura avanzada', note: 'Activá esta capa para reemplazar los valores internos de la textura base. No modifica el contorno del isologo.', fields: [toggle('enabled', 'Editar textura avanzada')] },
  { title: 'Paleta mineral', fields: [color('matrixColor', 'Color de la matriz'), color('veinColor', 'Color de vetas'), color('pyriteColor', 'Color de pirita'), color('fleckColor', 'Color de inclusiones'), color('goldLight', 'Oro claro'), color('goldDark', 'Oro oscuro')] },
  { title: 'Vetas', fields: [n('veinScale', 'Escala de vetas', .1, 30, .1), n('veinSoftness', 'Borde de vetas', .01, .5), n('veinWarp', 'Distorsión de vetas', 0, 3), n('veinInterlace', 'Entrelazado mineral', 0, 2), n('veinGrain', 'Grano de las vetas', 1, 100, 1), n('veinRough', 'Rugosidad de vetas', .02, 1), n('matrixRough', 'Rugosidad de la matriz', .02, 1)] },
  { title: 'Grano, relieve y mezcla', fields: [n('grain', 'Cantidad de grano', 0, 1), n('grainScale', 'Escala de grano', 1, 120, 1), n('grainRelief', 'Relieve del grano', 0, .3), n('blend', 'Mezcla entre caras', 1, 12, .1), n('antiTiling', 'Romper repetición', 0, 1), n('ao', 'Oclusión de la textura', 0, 1), n('roughMin', 'Rugosidad mínima', .02, 1), n('roughMax', 'Rugosidad máxima', .02, 1)] },
  { title: 'Pirita e inclusiones', fields: [n('pyriteScale', 'Escala de pirita', 1, 120, 1), n('pyriteRough', 'Rugosidad de pirita', .02, 1), n('fleckAmount', 'Cantidad de inclusiones', 0, 1), n('fleckScale', 'Escala de inclusiones', 1, 120, 1), n('fleckEdge', 'Borde de inclusiones', .01, .5), n('fleckMetal', 'Metal de inclusiones', 0, 1), n('fleckRough', 'Rugosidad de inclusiones', 0, 1)] },
  { title: 'Forma del depósito dorado', fields: [n('goldX', 'Centro del oro X', -3, 3), n('goldY', 'Centro del oro Y', -3, 3), n('goldZ', 'Centro del oro Z', -3, 3), n('goldIrregular', 'Irregularidad del oro', 0, 2), n('goldIrregularScale', 'Escala de irregularidad', .1, 8), n('goldSpeckScale', 'Escala de motas del borde', 1, 150, 1), n('goldSpeckStrength', 'Rotura del borde', 0, 3), n('goldSpeckWidth', 'Ancho del borde mineral', .01, 1)] },
  { title: 'Marcas direccionales · Bump', fields: [n('chiselStrength', 'Fuerza de marcas', 0, 1), n('chiselScale', 'Escala de marcas', 1, 100, 1), n('chiselStretch', 'Estiramiento de marcas', 1, 10), n('chiselAngle', 'Ángulo de marcas', -180, 180, 1, '°'), n('chiselSharpness', 'Nitidez de marcas', .1, 10)] },
]
export function applyDetail(u: TriUniforms, s: DetailSettings) {
  if (!s.enabled) return
  const extra: Record<string, string> = { blend: 'uTriBlend', antiTiling: 'uTriMix2', ao: 'uTriAO', roughMin: 'uTriRoughMin', roughMax: 'uTriRoughMax' }
  for (const [key, value] of Object.entries(s)) {
    if (key === 'enabled' || key.startsWith('gold') && ['goldX', 'goldY', 'goldZ'].includes(key)) continue
    const uniform = u[(extra[key] ?? `u${key[0].toUpperCase()}${key.slice(1)}`) as keyof TriUniforms]
    if (!uniform) continue
    if (uniform.value instanceof Color && typeof value === 'string') uniform.value.set(value)
    else if (typeof value === 'number') (uniform as { value: number }).value = key === 'chiselAngle' ? value * Math.PI / 180 : value
  }
  u.uGoldCentre.value.set(s.goldX, s.goldY, s.goldZ)
  u.uTriRoughMin.value = Math.min(s.roughMin, s.roughMax)
  u.uTriRoughMax.value = Math.max(s.roughMin, s.roughMax)
}
