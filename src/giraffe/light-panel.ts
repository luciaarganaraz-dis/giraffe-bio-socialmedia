import { giraffeLightDefaults, readGiraffeLight, worldRanges, type GiraffeLightSettings } from './settings'
import { q2LampDefaults, q2ChangeLampType, Q2_LAMP_RANGES, Q2_LAMP_POWER_MAX, type Q2LampParameter, type Q2LampType } from './lamp-settings'
import { bindFields, field, readStorage, saveStorage, syncField } from './fields'

const lamps = ['Principal', 'Contraluz', 'Relleno', 'Trasera', 'Extra cálida', 'Extra suave']
const labels: Record<Q2LampParameter, string> = {
  power: 'Potencia', x: 'Posición X', y: 'Posición Y', z: 'Posición Z',
  rotationX: 'Inclinación', rotationY: 'Dirección', rotationZ: 'Giro del panel',
  angle: 'Apertura del foco', softness: 'Difusión del borde', width: 'Ancho', height: 'Alto',
}
export function giraffeLightMarkup() {
  return `<section id="giraffe-light-panel" class="inspector-panel" aria-label="Luz Giraffe original" hidden>
    <div class="light-heading"><div><span class="eyebrow">GIRAFFE BIO · ORIGINAL 004_V2</span><p>Seis luces sobre la piedra.</p></div><button id="giraffe-reset" type="button" disabled>Restablecer ↺</button></div>
    <div class="inspector-scroll">
      <label class="inspector-select">Luz a editar<select id="giraffe-lamp" disabled>${lamps.map((label, i) => `<option value="${i}">${label}</option>`).join('')}</select></label>
      <div id="giraffe-lamp-editor"></div>
      <details class="light-section" id="giraffe-world"><summary>Ambiente y exposición</summary><div class="light-section-body">
        ${Object.entries(worldRanges).map(([key, [min, max]]) => field(`giraffe-${key}`, ({ intensity: 'Intensidad global', environment: 'Reflejos del entorno', exposure: 'Exposición', rotation: 'Giro del entorno' } as Record<string, string>)[key], giraffeLightDefaults()[key as keyof typeof worldRanges], min, max, 1, key === 'rotation' ? '°' : '%')).join('')}
        <label class="light-toggle"><input id="giraffe-orbit" type="checkbox" disabled>Girar las luces alrededor de la piedra</label>
        <p class="light-note">Una vuelta cada 15 segundos. Se pausa junto con el movimiento.</p>
      </div></details>
    </div><p class="inspector-memory">Tus ajustes se guardan automáticamente.</p>
  </section>`
}
export function bindGiraffeLight(onChange: (settings: GiraffeLightSettings) => void) {
  const storageKey = 'giraffe-social-original-light-v1'
  let state = readGiraffeLight(readStorage(storageKey)), selected = 0
  const root = document.querySelector<HTMLElement>('#giraffe-light-panel')!
  const editor = root.querySelector<HTMLElement>('#giraffe-lamp-editor')!
  const emit = () => { saveStorage(storageKey, state); onChange(structuredClone(state)) }
  const sync = () => {
    const lamp = state.lamps[selected]
    for (const key of Object.keys(Q2_LAMP_RANGES) as Q2LampParameter[]) syncField(root, `giraffe-lamp-${key}`, lamp[key])
    for (const key of Object.keys(worldRanges) as (keyof typeof worldRanges)[]) syncField(root, `giraffe-${key}`, state[key])
    root.querySelector<HTMLInputElement>('#giraffe-orbit')!.checked = state.orbit
    emit()
  }
  function renderLamp() {
    const lamp = state.lamps[selected]
    const lampField = (key: Q2LampParameter, unit = '') => {
      const [min, max, step] = Q2_LAMP_RANGES[key]
      return field(`giraffe-lamp-${key}`, labels[key], lamp[key], min, key === 'power' ? Q2_LAMP_POWER_MAX[lamp.type] : max, step, unit)
    }
    editor.innerHTML = `<div class="light-section-body">
      <div class="light-source-top"><label class="light-toggle"><input id="giraffe-lamp-enabled" type="checkbox" ${lamp.enabled ? 'checked' : ''}>Encendida</label><label class="light-color">Color<input id="giraffe-lamp-color" type="color" value="${lamp.color}" aria-label="Color de la luz Giraffe"></label></div>
      <label class="inspector-select">Tipo de luz<select id="giraffe-lamp-type">${Object.entries({ sun: 'Sol', point: 'Puntual', spot: 'Foco', area: 'Panel de área' }).map(([key, label]) => `<option value="${key}" ${lamp.type === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      ${lampField('power')}
      ${lamp.type === 'spot' ? lampField('angle', '°') + lampField('softness', '%') : ''}
      ${lamp.type === 'area' ? lampField('width') + lampField('height') : ''}
      ${lamp.type !== 'point' ? `<details class="light-section" open><summary>Orientación</summary><div class="light-section-body">${lamp.type === 'sun' ? '<p class="light-note">En una luz de sol, la dirección se ajusta con la orientación.</p>' : ''}${lampField('rotationX', '°')}${lampField('rotationY', '°')}${lamp.type === 'area' ? lampField('rotationZ', '°') : ''}</div></details>` : ''}
      <details class="light-section" ${lamp.type !== 'sun' ? 'open' : ''}><summary>Posición</summary><div class="light-section-body">${lampField('x')}${lampField('y')}${lampField('z')}</div></details>
      <button class="inspector-reset" id="giraffe-lamp-reset" type="button">Restablecer esta luz</button>
    </div>`
    editor.querySelectorAll<HTMLInputElement>('[disabled]').forEach(el => { el.disabled = false })
    bindFields(editor, (id, value) => { state.lamps[selected][id.replace('giraffe-lamp-', '') as Q2LampParameter] = value; sync() })
    editor.querySelector<HTMLSelectElement>('#giraffe-lamp-type')!.addEventListener('change', event => {
      state.lamps[selected] = q2ChangeLampType(state.lamps[selected], (event.target as HTMLSelectElement).value as Q2LampType)
      renderLamp(); sync()
    })
    editor.querySelector<HTMLInputElement>('#giraffe-lamp-enabled')!.addEventListener('change', event => { state.lamps[selected].enabled = (event.target as HTMLInputElement).checked; emit() })
    editor.querySelector<HTMLInputElement>('#giraffe-lamp-color')!.addEventListener('input', event => { state.lamps[selected].color = (event.target as HTMLInputElement).value; emit() })
    editor.querySelector('#giraffe-lamp-reset')!.addEventListener('click', () => { state.lamps[selected] = q2LampDefaults()[selected]; renderLamp(); sync() })
  }
  bindFields(root.querySelector<HTMLElement>('#giraffe-world')!, (id, value) => { state[id.replace('giraffe-', '') as keyof typeof worldRanges] = value; sync() })
  root.querySelector('#giraffe-lamp')!.addEventListener('change', event => { selected = Number((event.target as HTMLSelectElement).value); renderLamp() })
  root.querySelector('#giraffe-reset')!.addEventListener('click', () => { state = giraffeLightDefaults(); renderLamp(); sync() })
  root.querySelector('#giraffe-orbit')!.addEventListener('change', event => { state.orbit = (event.target as HTMLInputElement).checked; emit() })
  renderLamp(); sync()
}
