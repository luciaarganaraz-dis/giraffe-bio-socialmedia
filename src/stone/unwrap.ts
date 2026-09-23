import { Vector2, type ExtrudeGeometryOptions } from 'three'

/** A separate continuous strip for the extrusion, including the inner counters. */
export function logoUVs(layers = 9): NonNullable<ExtrudeGeometryOptions['UVGenerator']> {
  let call = 0
  let cursor = 0
  let edge = 0
  // The caller supplies the depth steps plus both bevel stacks.
  return {
    generateTopUV(_geometry, vertices, a, b, c) {
      return [a, b, c].map(i => new Vector2(vertices[i * 3], vertices[i * 3 + 1]))
    },
    generateSideWallUV(_geometry, vertices, a, b, c, d) {
      if (call % layers === 0) edge = Math.hypot(vertices[a * 3] - vertices[b * 3], vertices[a * 3 + 1] - vertices[b * 3 + 1])
      const uvs = [
        new Vector2(cursor, vertices[a * 3 + 2]), new Vector2(cursor + edge, vertices[b * 3 + 2]),
        new Vector2(cursor + edge, vertices[c * 3 + 2]), new Vector2(cursor, vertices[d * 3 + 2]),
      ]
      if (++call % layers === 0) cursor += edge
      return uvs
    },
  }
}
