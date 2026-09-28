import { lightControlsMarkup } from '../light-controls'
import { giraffeLightMarkup } from './light-panel'
import { textureMarkup } from './texture-panel'
import { readStorage, saveStorage } from './fields'
import { parameterMarkup } from '../parameters/controls'
import './workbench.css'

export function workbenchMarkup() {
  return `<aside class="workbench" aria-label="Estudio de luz y textura">
    <div class="workbench-tabs" role="group" aria-label="Editar apariencia">${Object.entries({ light: 'Luz', texture: 'Textura', material: 'Material', camera: 'Cámara', object: 'Objeto', render: 'Render', detail: 'Textura avanzada' }).map(([id, label]) => `<button data-inspector="${id}" aria-pressed="${id === 'light'}" type="button">${label}</button>`).join('')}</div>
    <div id="workbench-light" class="workbench-body">
      <label class="inspector-select light-setup">Esquema de luz<select id="lighting-mode" disabled><option value="sculpture">Estudio actual · 4 luces</option><option value="giraffe">Giraffe original · 6 luces</option></select></label>
      ${lightControlsMarkup()}${giraffeLightMarkup()}
    </div>${textureMarkup()}${parameterMarkup()}
    <div class="parameter-export"><button id="export-settings" type="button" disabled>Descargar ajustes .json</button><small>Vista previa en tiempo real. Cycles y el editor de nodos requieren Blender.</small></div>
  </aside>`
}
export function bindWorkbench(onMode: (mode: 'sculpture' | 'giraffe') => void) {
  const select = document.querySelector<HTMLSelectElement>('#lighting-mode')!
  select.value = readStorage('giraffe-social-light-mode') === 'giraffe' ? 'giraffe' : 'sculpture'
  const apply = () => {
    const mode = select.value as 'sculpture' | 'giraffe'
    document.querySelector<HTMLElement>('#workbench-light > .light-panel')!.hidden = mode !== 'sculpture'
    document.querySelector<HTMLElement>('#giraffe-light-panel')!.hidden = mode !== 'giraffe'
    saveStorage('giraffe-social-light-mode', mode); onMode(mode)
  }
  select.addEventListener('change', apply)
  document.querySelectorAll<HTMLButtonElement>('[data-inspector]').forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.inspector
    for (const id of ['light', 'texture', 'material', 'camera', 'object', 'render', 'detail']) {
      document.querySelector<HTMLElement>(id === 'light' ? '#workbench-light' : `#${id}-panel`)!.hidden = id !== selected
    }
    document.querySelectorAll('[data-inspector]').forEach(el => el.setAttribute('aria-pressed', String(el === button)))
  }))
  apply()
}
