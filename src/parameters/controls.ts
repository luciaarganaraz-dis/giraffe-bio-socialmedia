import { bindPanel, panelMarkup } from './panel'
import { MATERIAL_DEFAULTS, MATERIAL_GROUPS } from './material'
import { DETAIL_DEFAULTS, DETAIL_GROUPS } from './texture-detail'
import { CAMERA_DEFAULTS, CAMERA_GROUPS, OBJECT_DEFAULTS, OBJECT_GROUPS, RENDER_DEFAULTS, RENDER_GROUPS } from './scene-settings'
import type { createStudio } from '../studio'

export const parameterMarkup = () => [
  panelMarkup('material', 'Material · Principled', MATERIAL_DEFAULTS, MATERIAL_GROUPS),
  panelMarkup('detail', 'Textura avanzada', DETAIL_DEFAULTS, DETAIL_GROUPS),
  panelMarkup('camera', 'Cámara', CAMERA_DEFAULTS, CAMERA_GROUPS),
  panelMarkup('object', 'Objeto', OBJECT_DEFAULTS, OBJECT_GROUPS),
  panelMarkup('render', 'Render y salida', RENDER_DEFAULTS, RENDER_GROUPS),
].join('')
const showField = (id: string, show: boolean) => {
  const element = document.querySelector<HTMLInputElement>(`#${id}`)
  const row = element?.closest<HTMLElement>('.light-slider')
  if (row) row.hidden = !show
}
export function bindParameters(studio: Awaited<ReturnType<typeof createStudio>>) {
  bindPanel('material', MATERIAL_DEFAULTS, MATERIAL_GROUPS, state => {
    showField('material-roughness', state.customSurface); showField('material-metallic', state.customSurface)
    studio.setMaterial(state)
  })
  bindPanel('detail', DETAIL_DEFAULTS, DETAIL_GROUPS, state => {
    document.querySelectorAll<HTMLElement>('#detail-panel .light-section').forEach((group, i) => { if (i) group.hidden = !state.enabled })
    studio.setDetail(state)
  })
  const camera = bindPanel('camera', CAMERA_DEFAULTS, CAMERA_GROUPS, state => {
    showField('camera-focal', state.projection === 'perspective'); showField('camera-sensor', state.projection === 'perspective')
    studio.setCamera(state)
  })
  studio.onCameraChange = state => {
    camera.sync(state)
    document.querySelector<HTMLElement>('#viewer')!.dataset.camera = JSON.stringify(state)
  }
  bindPanel('object', OBJECT_DEFAULTS, OBJECT_GROUPS, state => studio.setObject(state))
  bindPanel('render', RENDER_DEFAULTS, RENDER_GROUPS, state => {
    showField('render-width', state.outputPreset === 'custom'); showField('render-height', state.outputPreset === 'custom')
    studio.setRender(state)
  })
  document.querySelector('#export-settings')!.addEventListener('click', () => {
    const data = { app: 'giraffe-bio-socialmedia', version: 1, ...studio.settings }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'giraffe-estudio-ajustes.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  })
}
