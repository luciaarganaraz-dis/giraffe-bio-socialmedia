import { DoubleSide, FrontSide, MeshPhysicalMaterial } from 'three'
import { color, number as n, toggle, type ParameterGroup } from './panel'

export const MATERIAL_DEFAULTS = {
  customSurface: false, baseColor: '#ffffff', roughness: .67, metallic: .35,
  ior: 1.5, specular: 1, specularTint: '#ffffff', anisotropy: 0, anisotropyRotation: 0,
  coat: 0, coatRoughness: 0, sheen: 0, sheenTint: '#ffffff', sheenRoughness: 1,
  transmission: 0, thickness: 0, attenuationDistance: 10, attenuationColor: '#ffffff',
  iridescence: 0, filmIor: 1.3, filmMin: 100, filmMax: 400,
  emissionColor: '#000000', emissionStrength: 0, alpha: 1, doubleSided: false,
}
export type MaterialSettings = typeof MATERIAL_DEFAULTS
export const MATERIAL_GROUPS: ParameterGroup[] = [
  { title: 'Superficie · Principled', note: 'Por defecto, rugosidad y metal vienen del material de piedra. Activá valores propios para reemplazarlos.', fields: [color('baseColor', 'Color base'), toggle('customSurface', 'Usar rugosidad y metal propios'), n('roughness', 'Rugosidad', 0, 1), n('metallic', 'Metálico', 0, 1), n('ior', 'IOR', 1, 2.5), n('alpha', 'Alfa', .05, 1), toggle('doubleSided', 'Mostrar ambas caras')] },
  { title: 'Especular y anisotropía', fields: [n('specular', 'Intensidad especular', 0, 1), color('specularTint', 'Tinte especular'), n('anisotropy', 'Anisotropía', 0, 1), n('anisotropyRotation', 'Rotación anisotrópica', -180, 180, 1, '°')] },
  { title: 'Recubrimiento · Coat', fields: [n('coat', 'Peso del recubrimiento', 0, 1), n('coatRoughness', 'Rugosidad del recubrimiento', 0, 1)] },
  { title: 'Brillo superficial · Sheen', fields: [n('sheen', 'Peso del brillo superficial', 0, 1), color('sheenTint', 'Tinte del brillo'), n('sheenRoughness', 'Rugosidad del brillo', 0, 1)] },
  { title: 'Transmisión y volumen', fields: [n('transmission', 'Transmisión', 0, 1), n('thickness', 'Espesor óptico', 0, 5), color('attenuationColor', 'Color de absorción'), n('attenuationDistance', 'Distancia de absorción', .01, 50, .01)] },
  { title: 'Película fina · Thin Film', fields: [n('iridescence', 'Iridiscencia', 0, 1), n('filmIor', 'IOR de la película', 1, 2.5), n('filmMin', 'Espesor mínimo', 0, 1200, 1, 'nm'), n('filmMax', 'Espesor máximo', 0, 1200, 1, 'nm')] },
  { title: 'Emisión', fields: [color('emissionColor', 'Color de emisión'), n('emissionStrength', 'Fuerza de emisión', 0, 20, .1)] },
]
export function applyMaterial(material: MeshPhysicalMaterial, s: MaterialSettings) {
  material.color.set(s.baseColor)
  if (s.customSurface) { material.roughness = s.roughness; material.metalness = s.metallic }
  material.ior = s.ior; material.specularIntensity = s.specular; material.specularColor.set(s.specularTint)
  material.anisotropy = s.anisotropy; material.anisotropyRotation = s.anisotropyRotation * Math.PI / 180
  material.clearcoat = s.coat; material.clearcoatRoughness = s.coatRoughness
  material.sheen = s.sheen; material.sheenColor.set(s.sheenTint); material.sheenRoughness = s.sheenRoughness
  material.transmission = s.transmission; material.thickness = s.thickness
  material.attenuationDistance = s.attenuationDistance; material.attenuationColor.set(s.attenuationColor)
  material.iridescence = s.iridescence; material.iridescenceIOR = s.filmIor
  material.iridescenceThicknessRange = [Math.min(s.filmMin, s.filmMax), Math.max(s.filmMin, s.filmMax)]
  material.emissive.set(s.emissionColor); material.emissiveIntensity = s.emissionStrength
  const transparent = s.alpha < 1, side = s.doubleSided ? DoubleSide : FrontSide
  if (material.transparent !== transparent || material.side !== side) material.needsUpdate = true
  material.opacity = s.alpha; material.transparent = transparent; material.side = side
}
