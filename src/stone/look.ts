/* ---------------------------------------------------------------------------
   The mineral's approved look: 004_v2, a dark stone veined with golden pyrite.

   These are shader inputs, not site tokens. A number here changes how one WebGL
   material resolves light; it has no meaning anywhere else on the page, which
   is why it does not live in styles/tokens.css.

   The look carries its lighting, not just its palette: the six lamps below are
   part of it, and taking the colours alone gives a different rock.

   The environment matters too, and more than it looks. three.js overwrites a
   material's own `envMapIntensity` with `scene.environmentIntensity` whenever
   the material has no envMap of its own and the scene has an environment — see
   WebGLRenderer's material uniform pass — so the operative control is
   `envIntensity` here, and the HDR contributes across the whole surface. It was
   measured: blocking that download changes 15% of the canvas.
   --------------------------------------------------------------------------- */

export type RockLight = { x: number; y: number; z: number; color: string; i?: number }

/**
 * Written out rather than left open. An index signature made `satisfies` accept
 * anything, so a misspelled field reached the look map, matched nothing and was
 * ignored in silence — which is exactly how the gold's centre went missing.
 */
export type RockLook = {
  /** Which scanned normal/ARM pair the surface samples. */
  set: string

  matrixColor: string
  veinColor: string
  pyriteColor: string
  fleckColor: string
  goldLight: string
  goldDark: string

  veinAmount: number
  veinSoftness: number
  veinScale: number
  veinWarp: number
  veinInterlace: number
  veinGrain: number
  veinRough: number
  matrixRough: number
  pyriteAmount: number
  pyriteScale: number
  grain: number
  scale: number
  relief: number
  antiTiling: number
  ao: number
  roughMin: number
  roughMax: number
  grainRelief: number
  grainScale: number

  goldAmount: number
  goldRadius: number
  goldCentreX: number
  goldCentreY: number
  goldCentreZ: number
  goldIrregular: number
  goldIrregularScale: number
  goldSpeckScale: number
  goldSpeckStrength: number
  goldSpeckWidth: number
  goldMetal: number
  goldRough: number

  fleckAmount: number
  fleckScale: number
  fleckEdge: number
  fleckMetal: number
  fleckRough: number

  chiselStrength: number
  chiselScale: number
  chiselStretch: number
  chiselAngle: number
  chiselSharpness: number

  roughness: number
  metalness: number
  envIntensity: number
  envRotation: number
  exposure: number

  keyLight: number
  rimLight: number
  fillLight: number
  lights: Record<string, RockLight>
  extraLights: RockLight[]
}

export const LOOK = {
  set: 'dark_rock',

  matrixColor: '#000000', // check-tokens-ignore — a shader input, not a site colour
  veinColor: '#b5b5b5', // check-tokens-ignore — a shader input, not a site colour
  pyriteColor: '#bca162', // check-tokens-ignore — a shader input, not a site colour
  veinAmount: 0.6,
  veinSoftness: 0.105,
  veinScale: 10.96,
  veinWarp: 0.91,
  veinInterlace: 0.39,
  veinGrain: 5,
  pyriteAmount: 0.95,
  pyriteScale: 42,
  grain: 0,
  matrixRough: 0.62,
  veinRough: 0.95,
  scale: 3,
  relief: 2.2,
  antiTiling: 0.5,
  ao: 0.77,
  roughMin: 0.34,
  roughMax: 0.92,
  grainRelief: 0,
  grainScale: 10,

  goldAmount: 0,
  goldRadius: 0.44,
  goldCentreX: 0.47,
  goldCentreY: 0.24,
  goldCentreZ: 0.39,
  goldIrregular: 0.87,
  goldIrregularScale: 1.3,
  goldSpeckScale: 84,
  goldSpeckStrength: 1.1,
  goldSpeckWidth: 0.06,
  goldMetal: 1,
  goldRough: 0.41,
  goldLight: '#c99a3b', // check-tokens-ignore — a shader input, not a site colour
  goldDark: '#6b4f18', // check-tokens-ignore — a shader input, not a site colour

  fleckAmount: 0.26,
  /* 55, not the 63 the preset was written with. That number was spelled
     `fleckSize`, which the look map has never read, so the shader has always
     used the uniform's own default — this is that default, written down. */
  fleckScale: 55,
  fleckEdge: 0.12,
  fleckMetal: 0,
  fleckRough: 0,
  fleckColor: '#383838', // check-tokens-ignore — a shader input, not a site colour

  chiselStrength: 0,
  chiselScale: 34,
  chiselStretch: 1,
  chiselAngle: 3.06,
  chiselSharpness: 1,

  /* Material and environment. `envMapIntensity` is not here on purpose: three
     overwrites it with the scene's own intensity for a material lit by
     `scene.environment`, so a value here would do nothing at all. */
  roughness: 0.67,
  metalness: 0.35,
  envIntensity: 1.02,
  envRotation: 314,
  exposure: 0.76,

  /* The six lamps the look was approved under. */
  keyLight: 2.18,
  rimLight: 1.04,
  fillLight: 0.83,
  lights: {
    key: { x: 0.22, y: 3.2, z: 3.21, color: '#ffffff' }, // check-tokens-ignore — a shader input, not a site colour
    rim: { x: -1.97, y: -1.44, z: 3.42, color: '#ffffff' }, // check-tokens-ignore — a shader input, not a site colour
    fill: { x: 0, y: -1.32, z: -0.46, color: '#ffffff' }, // check-tokens-ignore — a shader input, not a site colour
    back: { x: 3.2, y: 1.5, z: -2.6, color: '#655543', i: 7.5 }, // check-tokens-ignore — a shader input, not a site colour
  },
  extraLights: [
    { i: 7.5, color: '#fff4e8', x: 3.32, y: 1.4, z: -1.22 }, // check-tokens-ignore — a shader input, not a site colour
    { i: 15, color: '#dbd4bd', x: 6.3, y: 3.17, z: -1.81 }, // check-tokens-ignore — a shader input, not a site colour
  ],
} satisfies RockLook

/** Where the mineral's own assets live, relative to the site root. */
export const ROCK_BASE = '/rock/'
