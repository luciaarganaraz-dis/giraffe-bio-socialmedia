import * as THREE from 'three'
import {
  FRAG_COMMON,
  FRAG_MAP,
  FRAG_METAL,
  FRAG_NORMAL,
  FRAG_ROUGH,
  VERT_BODY,
  VERT_COMMON,
} from './triplanar-shaders'
import type { RockLook } from './look'

/* ---------------------------------------------------------------------------
   The stone material: three minerals living on one surface, projected from the
   three world axes. The shader itself is in triplanar-shaders.ts; what is here
   is the uniforms it reads and the mapping from a look to those uniforms.
   --------------------------------------------------------------------------- */

/**
 * One uniform set per mounted rock. This used to be a module-level object,
 * which meant a second instance overwrote the first one's textures and a
 * teardown disposed textures the survivor still pointed at.
 */
export function createTriUniforms() {
  return {
    uTriNor: { value: null as THREE.Texture | null },
    uTriArm: { value: null as THREE.Texture | null },
    uTriScale: { value: 1.5 },
    uTriBlend: { value: 4.0 }, // how hard the cut between the three planes is
    uTriMix2: { value: 0.5 }, // a second, rotated octave: breaks the tiling
    uTriNormal: { value: 1.6 }, // strength of the micro-relief
    uTriDetail: { value: 1.0 }, // how much of the scanned colour comes through
    uTriPivot: { value: 0.85 }, // the map's mean AO, to normalise against
    uTriRoughMin: { value: 0.34 }, // fresh fracture faces: with a sheen
    uTriRoughMax: { value: 0.92 }, // weathered areas: matte
    uTriAO: { value: 0.8 },
    uMeshyMix: { value: 0.0 }, // 0 = ignore the model's own texture, 1 = only it

    /* The matrix mineral: three materials sharing a surface. */
    uNoise3D: { value: null as THREE.Data3DTexture | null }, // precomputed noise (see noise3d.ts)
    uRestScale: { value: 1.0 }, // the pivot's scale: rest space into world units
    uMatrixColor: { value: new THREE.Color() }, // green-black serpentine
    uVeinColor: { value: new THREE.Color() }, // cream/bone: carbonate-quartz
    uPyriteColor: { value: new THREE.Color() }, // brass: the metallic specks
    uVeinScale: { value: 3.2 },
    uVeinAmount: { value: 0.5 }, // how much of the surface it covers
    uVeinSoftness: { value: 0.12 }, // edge: hard = crystal, soft = diffuse
    uVeinWarp: { value: 0.0 }, // deforms the coordinates: an irregular edge
    uVeinInterlace: { value: 0.0 }, // dissolves that edge into grains
    uVeinGrain: { value: 40.0 }, // at what scale those grains sit
    uVeinRough: { value: 0.95 }, // the carbonate is more porous and matte
    uMatrixRough: { value: 0.62 },
    uPyriteScale: { value: 42.0 },
    uPyriteAmount: { value: 0.22 },
    uPyriteRough: { value: 0.3 },
    uGrain: { value: 0.45 }, // fine noise that breaks up the flat colour

    /* Sugar grain: fine relief no 1k scan can give. */
    uGrainRelief: { value: 0.0 },
    uGrainScale: { value: 90.0 },

    /* Flecks. */
    uFleckAmount: { value: 0.0 },
    uFleckScale: { value: 55.0 },
    uFleckEdge: { value: 0.04 },
    uFleckMetal: { value: 0.0 },
    uFleckRough: { value: 0.35 },
    uFleckColor: { value: new THREE.Color('#6b5a3e') }, // check-tokens-ignore — a shader input, not a site colour

    /* Gold: large patches of chalcopyrite-like mineral. Off by default. */
    uGoldAmount: { value: 0.0 },
    uGoldCentre: { value: new THREE.Vector3(0.25, 0.2, 0.35) },
    uGoldRadius: { value: 0.55 },
    uGoldIrregular: { value: 0.35 }, // deforms the edge so it is not a circle
    uGoldIrregularScale: { value: 3.0 },
    uGoldSpeckScale: { value: 90.0 },
    uGoldSpeckStrength: { value: 0.45 },
    uGoldSpeckWidth: { value: 0.35 },
    uGoldMetal: { value: 0.55 },
    uGoldRough: { value: 0.28 }, // reads wet, not matte
    uGoldLight: { value: new THREE.Color('#c9962e') }, // check-tokens-ignore — a shader input, not a site colour
    uGoldDark: { value: new THREE.Color('#6b4f18') }, // check-tokens-ignore — a shader input, not a site colour

    /* Chisel: directional, sharp relief instead of the noise's rounded bump. */
    uChiselStrength: { value: 0.0 },
    uChiselScale: { value: 14.0 },
    uChiselStretch: { value: 5.0 }, // 1 = even; higher = longer marks
    uChiselAngle: { value: 0.6 },
    uChiselSharpness: { value: 3.0 },
  } satisfies Record<string, THREE.IUniform>
}

export type TriUniforms = ReturnType<typeof createTriUniforms>

/** Splices the triplanar chunks into three.js's standard material. */
export function applyTriplanar(material: THREE.MeshStandardMaterial, uniforms: TriUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_COMMON}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`)

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_COMMON}`)
      .replace('#include <map_fragment>', FRAG_MAP)
      .replace('#include <roughnessmap_fragment>', FRAG_ROUGH)
      .replace('#include <metalnessmap_fragment>', FRAG_METAL)
      .replace('#include <normal_fragment_maps>', FRAG_NORMAL)
  }
  material.needsUpdate = true
  return material
}

/* One map from a look's fields to the uniforms they drive, so the presets and
   the shader cannot drift apart. The key unions are written out rather than
   derived from the look: only some of a look's fields are scalar uniforms, and
   a broader type would demand the colours, the lights and the exposure too. */
type ScalarLookKey =
  | 'veinScale'
  | 'veinAmount'
  | 'veinSoftness'
  | 'veinWarp'
  | 'veinInterlace'
  | 'veinGrain'
  | 'veinRough'
  | 'matrixRough'
  | 'pyriteScale'
  | 'pyriteAmount'
  | 'grain'
  | 'grainRelief'
  | 'grainScale'
  | 'fleckAmount'
  | 'fleckScale'
  | 'fleckEdge'
  | 'fleckMetal'
  | 'fleckRough'
  | 'goldAmount'
  | 'goldRadius'
  | 'goldIrregular'
  | 'goldIrregularScale'
  | 'goldSpeckScale'
  | 'goldSpeckStrength'
  | 'goldSpeckWidth'
  | 'goldMetal'
  | 'goldRough'
  | 'chiselStrength'
  | 'chiselScale'
  | 'chiselStretch'
  | 'chiselAngle'
  | 'chiselSharpness'
  | 'scale'
  | 'relief'
  | 'antiTiling'
  | 'ao'
  | 'roughMin'
  | 'roughMax'

type ColourLookKey =
  | 'matrixColor'
  | 'veinColor'
  | 'pyriteColor'
  | 'fleckColor'
  | 'goldLight'
  | 'goldDark'

const LOOK_TO_UNIFORM = {
  veinScale: 'uVeinScale',
  veinAmount: 'uVeinAmount',
  veinSoftness: 'uVeinSoftness',
  veinWarp: 'uVeinWarp',
  veinInterlace: 'uVeinInterlace',
  veinGrain: 'uVeinGrain',
  veinRough: 'uVeinRough',
  matrixRough: 'uMatrixRough',
  pyriteScale: 'uPyriteScale',
  pyriteAmount: 'uPyriteAmount',
  grain: 'uGrain',
  grainRelief: 'uGrainRelief',
  grainScale: 'uGrainScale',
  fleckAmount: 'uFleckAmount',
  fleckScale: 'uFleckScale',
  fleckEdge: 'uFleckEdge',
  fleckMetal: 'uFleckMetal',
  fleckRough: 'uFleckRough',
  goldAmount: 'uGoldAmount',
  goldRadius: 'uGoldRadius',
  goldIrregular: 'uGoldIrregular',
  goldIrregularScale: 'uGoldIrregularScale',
  goldSpeckScale: 'uGoldSpeckScale',
  goldSpeckStrength: 'uGoldSpeckStrength',
  goldSpeckWidth: 'uGoldSpeckWidth',
  goldMetal: 'uGoldMetal',
  goldRough: 'uGoldRough',
  chiselStrength: 'uChiselStrength',
  chiselScale: 'uChiselScale',
  chiselStretch: 'uChiselStretch',
  chiselAngle: 'uChiselAngle',
  chiselSharpness: 'uChiselSharpness',
  scale: 'uTriScale',
  relief: 'uTriNormal',
  antiTiling: 'uTriMix2',
  ao: 'uTriAO',
  roughMin: 'uTriRoughMin',
  roughMax: 'uTriRoughMax',
} satisfies Record<ScalarLookKey, keyof TriUniforms>

const LOOK_TO_COLOUR = {
  matrixColor: 'uMatrixColor',
  veinColor: 'uVeinColor',
  pyriteColor: 'uPyriteColor',
  fleckColor: 'uFleckColor',
  goldLight: 'uGoldLight',
  goldDark: 'uGoldDark',
} satisfies Record<ColourLookKey, keyof TriUniforms>

export function applyLook(look: RockLook, uniforms: TriUniforms) {
  for (const field of Object.keys(LOOK_TO_UNIFORM) as ScalarLookKey[]) {
    uniforms[LOOK_TO_UNIFORM[field]].value = look[field]
  }
  for (const field of Object.keys(LOOK_TO_COLOUR) as ColourLookKey[]) {
    ;(uniforms[LOOK_TO_COLOUR[field]].value as THREE.Color).set(look[field])
  }
  // Three scalars for one vector uniform, so this one is applied by hand rather
  // than through the table. It was missing entirely: the look declared a centre
  // for the gold and the shader never saw it.
  ;(uniforms.uGoldCentre.value as THREE.Vector3).set(
    look.goldCentreX,
    look.goldCentreY,
    look.goldCentreZ,
  )
}
