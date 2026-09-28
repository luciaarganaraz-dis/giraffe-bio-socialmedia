/** One transform for the original SVG, with room for stone around every lobe. */
export const ISO_PLACEMENT = { scale: 1.24, x: .10, y: .10 }

/** A coordinate-based direction keeps duplicate vertices and face seams together. */
export function outlineDirection(points: { x: number; y: number }[]) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  const sign = area > 0 ? 1 : -1
  const cache = new Map<string, [number, number]>()
  return (x: number, y: number): [number, number] => {
    const key = `${x.toFixed(6)},${y.toFixed(6)}`
    const cached = cache.get(key)
    if (cached) return cached
    let closest = Infinity, direction: [number, number] = [0, 0]
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length]
      const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy
      if (length2 < 1e-12) continue
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length2))
      const distance = (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2
      if (distance < closest) {
        closest = distance
        const length = Math.sqrt(length2)
        direction = [sign * dy / length, -sign * dx / length]
      }
    }
    cache.set(key, direction)
    return direction
  }
}
