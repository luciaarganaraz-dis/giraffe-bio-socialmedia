import { Color } from 'three'
/** Approximate black-body RGB for the renderer's color temperature input. */
export function temperatureColor(kelvin: number, target = new Color()) {
  const t = Math.max(1000, Math.min(12000, kelvin)) / 100
  const red = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -.1332047592
  const green = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -.0755148492
  const blue = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  return target.setRGB(...[red, green, blue].map(v => Math.max(0, Math.min(1, v / 255))) as [number, number, number])
}
