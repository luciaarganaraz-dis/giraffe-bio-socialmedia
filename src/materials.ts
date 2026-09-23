import { MeshPhysicalMaterial } from 'three'

export const finishes = {
  graphite: { label: 'Grafito', color: '#353636', side: '#292b2b', metalness: 0.72, roughness: 0.28 },
  copper: { label: 'Cobre', color: '#bd7757', side: '#905136', metalness: 0.86, roughness: 0.24 },
  ivory: { label: 'Marfil', color: '#e1dfd3', side: '#c8c4b4', metalness: 0.16, roughness: 0.26 },
} as const
export type Finish = keyof typeof finishes

export function createMaterials() {
  return [new MeshPhysicalMaterial(), new MeshPhysicalMaterial()]
}

export function applyFinish(materials: MeshPhysicalMaterial[], name: Finish) {
  const finish = finishes[name]
  materials.forEach((material, index) => {
    material.color.set(index === 0 ? finish.color : finish.side)
    material.metalness = finish.metalness
    material.roughness = finish.roughness
    material.clearcoat = 0.32
    material.clearcoatRoughness = 0.24
    material.envMapIntensity = 1.5
  })
}
