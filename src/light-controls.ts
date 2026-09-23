import { DEFAULT_LIGHT, type LightSettings } from './lighting'
import './styles/light-controls.css'

const sliders = [
  ['intensity', 'Intensidad', 0, 200], ['fill', 'Relleno', 0, 100],
  ['rim', 'Contraluz', 0, 200], ['exposure', 'Exposición', 50, 160],
] as const

export function lightControlsMarkup() {
  return `<section class="light-panel" aria-label="Control de luz">
    <div class="light-heading"><div><span class="eyebrow">LUZ DEL ESTUDIO</span><p>Mové la luz, encontrá el relieve.</p></div><button id="reset-light" type="button" disabled>Restablecer luz ↺</button></div>
    <div class="light-body"><div class="light-position-control">
      <button id="light-position" type="button" class="light-pad" aria-label="Posición de la luz. Arrastrá el punto o usá las flechas." aria-describedby="light-position-value" disabled>
        <span class="light-orbit" aria-hidden="true"></span><span class="light-point" aria-hidden="true"></span>
      </button><div class="light-position-caption"><span>Posición</span><small id="light-position-value">Izquierda · Arriba</small><small>Arrastrá el punto</small></div>
    </div><div class="light-sliders">${sliders.map(([id, name, min, max]) => `<label class="light-slider" for="light-${id}"><span>${name}<output id="light-${id}-value" for="light-${id}">${DEFAULT_LIGHT[id]}%</output></span><input id="light-${id}" type="range" min="${min}" max="${max}" value="${DEFAULT_LIGHT[id]}" disabled /></label>`).join('')}</div></div>
  </section>`
}

export function bindLightControls(onChange: (settings: LightSettings) => void) {
  const state = { ...DEFAULT_LIGHT }
  const pad = document.querySelector<HTMLButtonElement>('#light-position')!
  const positionLabel = document.querySelector<HTMLElement>('#light-position-value')!
  function sync() {
    pad.style.setProperty('--light-x', `${(state.x + 100) / 2}%`)
    pad.style.setProperty('--light-y', `${(100 - state.y) / 2}%`)
    positionLabel.textContent = `${state.x < -10 ? 'Izquierda' : state.x > 10 ? 'Derecha' : 'Centro'} · ${state.y > 10 ? 'Arriba' : state.y < -10 ? 'Abajo' : 'Frente'}`
    for (const [id] of sliders) {
      document.querySelector<HTMLInputElement>(`#light-${id}`)!.value = String(state[id])
      document.querySelector<HTMLOutputElement>(`#light-${id}-value`)!.value = `${state[id]}%`
    }
    onChange({ ...state })
  }
  const clamp = (value: number) => Math.max(-100, Math.min(100, Math.round(value)))
  const drag = (event: PointerEvent) => {
    const box = pad.getBoundingClientRect()
    state.x = clamp((event.clientX - box.left) / box.width * 200 - 100)
    state.y = clamp(100 - (event.clientY - box.top) / box.height * 200)
    sync()
  }
  pad.addEventListener('pointerdown', event => {
    if (event.button !== 0) return
    pad.setPointerCapture(event.pointerId)
    drag(event)
  })
  pad.addEventListener('pointermove', event => { if (pad.hasPointerCapture(event.pointerId)) drag(event) })
  pad.addEventListener('pointerup', event => { if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId) })
  pad.addEventListener('keydown', event => {
    const directions: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }
    if (!(event.key in directions)) return
    event.preventDefault()
    const [x, y] = directions[event.key]
    state.x = clamp(state.x + x); state.y = clamp(state.y + y)
    sync()
  })
  for (const [id] of sliders) document.querySelector<HTMLInputElement>(`#light-${id}`)!.addEventListener('input', event => {
    state[id] = Number((event.target as HTMLInputElement).value)
    sync()
  })
  document.querySelector('#reset-light')!.addEventListener('click', () => { Object.assign(state, DEFAULT_LIGHT); sync() })
  sync()
}
