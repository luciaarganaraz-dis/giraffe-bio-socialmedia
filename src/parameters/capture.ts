import { Color, Vector2, type Scene, type WebGLRenderer } from 'three'
import type { Piece } from '../logo'
import type { RenderSettings } from './scene-settings'
export async function captureImage(renderer: WebGLRenderer, scene: Scene, piece: Piece, settings: RenderSettings,
  transparent: boolean, setTransparent: (value: boolean) => void, fit: (w: number, h: number) => void, render: () => void, restore: () => void) {
  const size = renderer.getSize(new Vector2()), ratio = renderer.getPixelRatio(), background = scene.background
  const sizes: Record<string, [number, number]> = { portrait1080: [1080, 1350], portrait2160: [2160, 2700], square: [1080, 1080], story: [1080, 1920], custom: [settings.width, settings.height], auto: piece === 'sculpture' ? [2160, 2700] : piece === 'symbol' ? [2048, 2048] : [3000, 1500] }
  const [w, h] = sizes[settings.outputPreset] ?? sizes.auto
  const width = Math.round(w * settings.outputScale / 100), height = Math.round(h * settings.outputScale / 100)
  try {
    renderer.setPixelRatio(1); renderer.setSize(width, height, false); fit(width, height)
    setTransparent(transparent); scene.background = transparent ? null : new Color('#111316'); render()
    return await new Promise<Blob>((resolve, reject) => renderer.domElement.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo exportar la imagen.')), 'image/png'))
  } finally {
    scene.background = background; setTransparent(false)
    renderer.setPixelRatio(ratio); renderer.setSize(size.x, size.y, false); restore()
  }
}
