/* ---------------------------------------------------------------------------
   The stone's shader: a world-space triplanar projection.

   Why triplanar rather than the model's UVs: the mesh is unwrapped into an
   atlas, with islands at different scales and seams everywhere. Tiling detail
   across that looks broken. Projecting from the three world axes and blending
   by the normal keeps the detail even and seamless, however it is unwrapped.

   These are chunk replacements spliced into three.js's own standard material,
   so the rock is lit like any other surface in the scene.
   --------------------------------------------------------------------------- */

export const VERT_COMMON = /* glsl */ `
  varying vec3 vTriWorldPos;
  varying vec3 vTriWorldNormal;
  varying mat3 vTexToWorld;
  uniform float uRestScale;
  #ifdef USE_RESTPOS
    attribute vec3 restPos;
  #endif
  #ifdef USE_INSTANCING
    attribute vec3 aTexOffset;
  #endif
`

export const VERT_BODY = /* glsl */ `
  mat3 triMW = mat3(modelMatrix);
  #ifdef USE_INSTANCING
    triMW = triMW * mat3(instanceMatrix);
  #endif
  vTexToWorld = mat3(normalize(triMW[0]), normalize(triMW[1]), normalize(triMW[2]));

  // Rest space: for a shard this is its position in the WHOLE rock, so the
  // pattern stays continuous once the pieces separate. For the intact rock it
  // is simply its own object space, which comes to the same thing.
  #ifdef USE_RESTPOS
    vTriWorldPos = restPos * uRestScale;
  #else
    vec3 triLocal = transformed;
    // Each instance reads a different part of the material. The offset is a
    // fixed attribute rather than the live position: reading the position
    // would slide the texture over the fragment as it moves.
    #ifdef USE_INSTANCING
      triLocal += aTexOffset;
    #endif
    vTriWorldPos = triLocal * uRestScale;
  #endif
  vTriWorldNormal = normalize(objectNormal);
`

export const FRAG_COMMON = /* glsl */ `
  uniform sampler2D uTriNor;
  uniform sampler2D uTriArm;
  uniform float uTriScale;
  uniform float uTriBlend;
  uniform float uTriMix2;
  uniform float uTriNormal;
  uniform float uTriDetail;
  uniform float uTriPivot;
  uniform float uTriRoughMin;
  uniform float uTriRoughMax;
  uniform float uTriAO;
  uniform float uMeshyMix;
  uniform sampler3D uNoise3D;
  uniform vec3 uMatrixColor;
  uniform vec3 uVeinColor;
  uniform vec3 uPyriteColor;
  uniform float uVeinScale;
  uniform float uVeinAmount;
  uniform float uVeinSoftness;
  uniform float uVeinWarp;
  uniform float uVeinInterlace;
  uniform float uVeinGrain;
  uniform float uVeinRough;
  uniform float uMatrixRough;
  uniform float uPyriteScale;
  uniform float uPyriteAmount;
  uniform float uPyriteRough;
  uniform float uGrain;
  uniform float uGrainRelief;
  uniform float uGrainScale;
  uniform float uFleckAmount;
  uniform float uFleckScale;
  uniform float uFleckEdge;
  uniform float uFleckMetal;
  uniform float uFleckRough;
  uniform vec3 uFleckColor;
  uniform float uGoldAmount;
  uniform vec3 uGoldCentre;
  uniform float uGoldRadius;
  uniform float uGoldIrregular;
  uniform float uGoldIrregularScale;
  uniform float uGoldSpeckScale;
  uniform float uGoldSpeckStrength;
  uniform float uGoldSpeckWidth;
  uniform float uGoldMetal;
  uniform float uGoldRough;
  uniform vec3 uGoldLight;
  uniform vec3 uGoldDark;
  uniform float uChiselStrength;
  uniform float uChiselScale;
  uniform float uChiselStretch;
  uniform float uChiselAngle;
  uniform float uChiselSharpness;

  // Ridged noise: the absolute value folds the noise onto itself and leaves a
  // sharp crest where there was a soft transition. That is what turns a bump
  // into a chisel mark.
  float triCincel(vec3 p) {
    float c = cos(uChiselAngle), s = sin(uChiselAngle);
    vec2 xz = mat2(c, -s, s, c) * p.xz;
    vec3 q = vec3(xz.x / max(uChiselStretch, 0.01), p.y, xz.y);
    float n = texture(uNoise3D, q).r;
    return pow(1.0 - abs(2.0 * n - 1.0), uChiselSharpness);
  }
  varying vec3 vTriWorldPos;
  varying vec3 vTriWorldNormal;
  varying mat3 vTexToWorld;

  vec3 triWeights(vec3 n) {
    vec3 b = pow(abs(n), vec3(uTriBlend));
    return b / max(dot(b, vec3(1.0)), 1e-4);
  }

  const mat2 TRI_ROT = mat2(-0.7314, -0.6819, 0.6819, -0.7314); // 137 degrees

  vec4 triSample(sampler2D tex, vec2 uv) {
    vec4 a = texture2D(tex, uv);
    vec4 b = texture2D(tex, TRI_ROT * uv * 0.413 + 0.37);
    return mix(a, b, uTriMix2 * 0.5);
  }
`

// map_fragment: base colour. The reference is nearly achromatic, so the scanned
// detail is desaturated and normalised against its own mean luminance — it ends
// up as a multiplicative variation over the material's colour.
export const FRAG_MAP = /* glsl */ `
  vec3 triPos = vTriWorldPos;
  vec3 triN = normalize(vTriWorldNormal);
  vec3 triW = triWeights(triN);
  vec2 triUvX = triPos.zy * uTriScale;
  vec2 triUvY = triPos.xz * uTriScale;
  vec2 triUvZ = triPos.xy * uTriScale;

  vec4 triArm = texture2D(uTriArm, triUvX) * triW.x
              + texture2D(uTriArm, triUvY) * triW.y
              + texture2D(uTriArm, triUvZ) * triW.z;

  // The luminance variation comes from the ARM map's AO: one texture fewer to
  // sample and one fewer to download.
  float triLum = triArm.r;
  vec3 triStone = vec3(mix(1.0, triLum / max(uTriPivot, 1e-3), uTriDetail));

  // Mask for the pale mineral. The scanned relief pushes the mask so the
  // patches sit in the relief rather than floating over the surface.
  // Domain warp at three scales. Deforming the COORDINATES — rather than adding
  // noise to the mask's value — is what gives a crenulated edge while keeping
  // the areas connected. Adding noise before a hard cut does not interlace: it
  // dithers, and reads as sandblasting.
  vec3 triVp = triPos * uVeinScale * 0.25;
  vec3 triW1 = texture(uNoise3D, triVp * 0.5 + 11.0).rgb - 0.5;   // large lobes
  vec3 triW2 = texture(uNoise3D, triVp * 1.7 + 3.1).rgb - 0.5;    // mid ripple
  vec3 triW3 = texture(uNoise3D, triPos * uVeinGrain * 0.12 + 7.9).rgb - 0.5;

  vec3 triWarp = (triW1 + triW2 * 0.45) * uVeinWarp
               + triW3 * uVeinInterlace * 0.6;

  float triVetaN = texture(uNoise3D, triVp + triWarp).r;
  triVetaN += (triLum - uTriPivot) * 0.30;
  float triVeta = smoothstep(
    uVeinAmount - uVeinSoftness, uVeinAmount + uVeinSoftness, triVetaN);

  // Pyrite: the product of two fine noises, cut high. Small scattered islands
  // rather than an even layer.
  float triSp = texture(uNoise3D, triPos * uPyriteScale * 0.05).g
              * texture(uNoise3D, triPos * uPyriteScale * 0.135 + 0.37).g;
  float triUmbral = mix(0.88, 0.30, uPyriteAmount);
  float triPirita = smoothstep(triUmbral, triUmbral + 0.05, triSp);

  // Fine grain: compacted crystal is never a flat colour.
  float triGrano = texture(uNoise3D, triPos * uGrainScale * 0.35).b;
  float triGranoMix = mix(1.0, 0.42 + triGrano * 1.16, uGrain);

  vec3 triAlbedo = mix(uMatrixColor, uVeinColor, triVeta) * triGranoMix;
  triAlbedo = mix(triAlbedo, uPyriteColor, triPirita);

  // --- GOLD (optional layer, off by default) --------------------------------
  // Its own offset, so it does not correlate with the vein or the pyrite.
  float triOro = 0.0;
  if (uGoldAmount > 0.001) {
    #ifdef USE_VEINED_GOLD
      // Intergrown brass mineral on the reference specimen: warped seams,
      // broken by the scanned pores, at the same density on every face.
      vec3 goldP = triPos * vec3(2.2, 0.9, 1.7);
      vec3 goldWarp = texture(uNoise3D, goldP * 0.65 + 23.4).rgb - 0.5;
      float goldField = texture(uNoise3D, goldP + goldWarp * 0.85 + 8.6).r;
      goldField += (triLum - uTriPivot) * 0.24;
      triOro = smoothstep(0.53, 0.66, goldField) * uGoldAmount;
      triOro *= mix(0.42, 1.0, smoothstep(0.25, 0.7, triGrano));
    #else
    // ONE patch: a distance field to a point, not a threshold over noise. A
    // threshold always gives several patches; this gives exactly one.
    float triOroD = length(triPos - uGoldCentre) / max(uGoldRadius * uGoldAmount, 1e-3);

    // Deform it so it does not read as a perfect sphere.
    triOroD += (texture(uNoise3D, triPos * uGoldIrregularScale + 5.3).r - 0.5)
             * uGoldIrregular;

    // A speckled edge: fine noise added to the distance and then a HARD cut.
    // The noise only counts near the edge, so the centre stays solid and the
    // transition breaks into grains instead of fading.
    float triOroCerca = 1.0 - clamp(abs(triOroD - 1.0) / max(uGoldSpeckWidth, 1e-3), 0.0, 1.0);
    float triOroPts = texture(uNoise3D, triPos * uGoldSpeckScale + 17.1).b;
    triOroD += (triOroPts - 0.5) * uGoldSpeckStrength * triOroCerca;

    triOro = 1.0 - step(1.0, triOroD);
    #ifdef USE_BROKEN_DEPOSIT
      // Expose matrix between the mineral grains, including inside the patch:
      // the reference is an intergrown deposit, not a flat coat of ochre.
      float depositGrain = texture(uNoise3D, triPos * 1.8 + 31.2).g;
      triOro *= mix(0.12, 1.0, smoothstep(0.25, 0.55, depositGrain));
      triOro *= smoothstep(0.2, 0.85, triLum);
    #endif
    #endif
    // Real gold is never one tone: amber in the highlights, ochre in the lows.
    triAlbedo = mix(triAlbedo, mix(uGoldDark, uGoldLight, triGrano), triOro);
  }

  // --- FLECKS (trial layer, off by default) ---------------------------------
  // The large offset separates them from the pyrite noise: without it they
  // landed in the same places and inherited its metalness.
  float triPeca = 0.0;
  if (uFleckAmount > 0.001) {
    float triPecaN = texture(uNoise3D, triPos * uFleckScale * 0.05 + 41.7).g;
    float triPecaU = mix(0.94, 0.32, uFleckAmount);
    triPeca = smoothstep(triPecaU, triPecaU + uFleckEdge, triPecaN);
    triAlbedo = mix(triAlbedo, uFleckColor, triPeca);
  }

  diffuseColor.rgb *= triAlbedo * triStone;
  diffuseColor.rgb *= mix(1.0, triArm.r, uTriAO);

  #ifdef USE_MAP
    vec4 meshySample = texture2D(map, vMapUv);
    diffuseColor.rgb = mix(diffuseColor.rgb, meshySample.rgb, uMeshyMix);
  #endif
`

// roughness: rather than one value, the ARM's G channel is remapped between a
// minimum and a maximum. That is where fresh fracture and erosion differ.
export const FRAG_ROUGH = /* glsl */ `
  float triRoughBase = mix(uMatrixRough, uVeinRough, triVeta);
  float triRoughVar = mix(uTriRoughMin, uTriRoughMax, triArm.g) * 2.0;
  float roughnessFactor = clamp(
    mix(
      mix(
        mix(triRoughBase * triRoughVar, uPyriteRough, triPirita) * roughness * 2.0,
        uGoldRough, triOro
      ),
      uFleckRough, triPeca * uFleckMetal
    ),
    0.02, 1.0
  );
`

// normal: a whiteout blend of the three planes, in world space, converted to
// view space only at the end. It needs no tangents.
export const FRAG_NORMAL = /* glsl */ `
  vec3 triNx = triSample(uTriNor, triUvX).xyz * 2.0 - 1.0;
  vec3 triNy = triSample(uTriNor, triUvY).xyz * 2.0 - 1.0;
  vec3 triNz = triSample(uTriNor, triUvZ).xyz * 2.0 - 1.0;

  triNx.xy *= uTriNormal;
  triNy.xy *= uTriNormal;
  triNz.xy *= uTriNormal;

  triNx = vec3(triNx.xy + triN.zy, abs(triNx.z) * triN.x);
  triNy = vec3(triNy.xy + triN.xz, abs(triNy.z) * triN.y);
  triNz = vec3(triNz.xy + triN.xy, abs(triNz.z) * triN.z);

  vec3 triWorldN = normalize(
    triNx.zyx * triW.x + triNy.xzy * triW.y + triNz.xyz * triW.z
  );

  if (uGrainRelief > 0.001) {
    vec3 gp = triPos * uGrainScale;
    float e = 0.035;
    float g0 = texture(uNoise3D, gp).b;
    vec3 grad = vec3(
      texture(uNoise3D, gp + vec3(e, 0.0, 0.0)).b - g0,
      texture(uNoise3D, gp + vec3(0.0, e, 0.0)).b - g0,
      texture(uNoise3D, gp + vec3(0.0, 0.0, e)).b - g0) / e;
    grad -= dot(grad, triWorldN) * triWorldN;   // the tangential component only
    triWorldN = normalize(triWorldN - grad * uGrainRelief);
  }

  // Back to world space before going to view space.
  if (uChiselStrength > 0.001) {
    vec3 cp = triPos * uChiselScale;
    float e = 0.06;
    float c0 = triCincel(cp);
    vec3 grad = vec3(
      triCincel(cp + vec3(e, 0.0, 0.0)) - c0,
      triCincel(cp + vec3(0.0, e, 0.0)) - c0,
      triCincel(cp + vec3(0.0, 0.0, e)) - c0) / e;
    grad -= dot(grad, triWorldN) * triWorldN;
    triWorldN = normalize(triWorldN - grad * uChiselStrength);
  }

  normal = normalize(mat3(viewMatrix) * (vTexToWorld * triWorldN));
`

// Only the pyrite specks are metal; everything else is a dielectric.
export const FRAG_METAL = /* glsl */ `
  float metalnessFactor = mix(metalness, 1.0,
    max(max(triPirita, triOro * uGoldMetal), triPeca * uFleckMetal));
`
