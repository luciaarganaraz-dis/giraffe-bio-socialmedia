import { lightControlsMarkup } from '../light-controls'
import { giraffeLightMarkup } from './light-panel'
import { textureMarkup } from './texture-panel'
import { readStorage, saveStorage } from './fields'
import './workbench.css'

export function workbenchMarkup() {
  return `<aside class="workbench" aria-label="Estudio de luz y textura">
    <div class="workbench-tabs" role="group" aria-label="Editar apariencia"><button data-inspector="light" aria-pressed="true" type="button">Luz</button><button data-inspector="texture" aria-pressed="false" type="button">Textura</button></div>
    <div id="workbench-light" class="workbench-body">
      <label class="inspector-select light-setup">Esquema de luz<select id="lighting-mode" disabled><option value="sculpture">Estudio actual · 4 luces</option><option value="giraffe">Giraffe original · 6 luces</option></select></label>
      ${lightControlsMarkup()}${giraffeLightMarkup()}
    </div>${textureMarkup()}
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
    const texture = button.dataset.inspector === 'texture'
    document.querySelector<HTMLElement>('#workbench-light')!.hidden = texture
    document.querySelector<HTMLElement>('#texture-panel')!.hidden = !texture
    document.querySelectorAll('[data-inspector]').forEach(el => el.setAttribute('aria-pressed', String(el === button)))
  }))
  apply()
}
