import { LOOK, type RockLook } from './look'

/** Eroded gray stone from the designer's letter-A reference, without metal flecks. */
export const CARVED_LOOK: RockLook = {
  ...LOOK,
  matrixColor: '#747780', veinColor: '#868991', pyriteColor: '#777980',
  fleckColor: '#45464a',
  veinAmount: .55, veinSoftness: .24, veinScale: 3.8,
  veinWarp: .55, veinInterlace: .15, veinGrain: 8,
  pyriteAmount: 0, goldAmount: 0, fleckAmount: .18, fleckScale: 45, fleckMetal: 0,
  grain: .5, grainScale: 5, grainRelief: .065,
  matrixRough: .92, veinRough: .95,
  scale: 4.8, relief: 1.05, antiTiling: .5, ao: .36,
  roughMin: .52, roughMax: .96, roughness: .8, metalness: 0,
  envIntensity: .17, envRotation: 314, exposure: 1.1,
  keyLight: 4.4, rimLight: 1.9, fillLight: .3,
  lights: {
    key: { x: -4, y: 7, z: 7, color: '#f3f0e9' },
    rim: { x: 5, y: 2, z: -4, color: '#bfc5df' },
    fill: { x: 1, y: -3, z: 5, color: '#d9dfed' },
  },
  extraLights: [],
}
