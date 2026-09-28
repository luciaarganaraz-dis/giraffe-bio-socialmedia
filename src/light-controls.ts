import { DEFAULT_LIGHT, LIGHT_PRESETS, LIGHT_SOURCES, type BooleanLightKey, type ColorLightKey, type LightSettings, type NumericLightKey } from './light-settings'
import { ranges } from './light-markup'
import './styles/light-controls.css'
export { lightControlsMarkup } from './light-markup'

export function bindLightControls(onChange: (settings: LightSettings) => void) {
  const state = { ...DEFAULT_LIGHT }
  const pad = document.querySelector<HTMLButtonElement>('#light-position')!
  const positionLabel = document.querySelector<HTMLElement>('#light-position-value')!
  const presetButtons = document.querySelectorAll<HTMLButtonElement>('[data-light-preset]')
  const storageKey = 'giraffe-studio-light-v1'
  const memoryStatus = document.querySelector<HTMLElement>('#light-memory-status')!
  const loadButton = document.querySelector<HTMLButtonElement>('#load-light')!
  let preset = 'reference'
  let saved: LightSettings | null = null
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (parsed && typeof parsed === 'object') {
      saved = { ...DEFAULT_LIGHT }
      for (const [key, bounds] of ranges) if (Number.isFinite(parsed[key])) saved[key] = Math.max(bounds.min, Math.min(bounds.max, parsed[key]))
      for (const light of LIGHT_SOURCES) {
        if (/^#[0-9a-f]{6}$/i.test(parsed[light.color])) saved[light.color] = parsed[light.color]
        for (const key of [light.on, light.shadow]) if (typeof parsed[key] === 'boolean') saved[key] = parsed[key]
      }
      if (typeof parsed.followCamera === 'boolean') saved.followCamera = parsed.followCamera
    }
  } catch { /* Storage can be unavailable; the live controls still work. */ }
  function sync() {
    pad.style.setProperty('--light-x', `${(state.x + 100) / 2}%`)
    pad.style.setProperty('--light-y', `${(100 - state.y) / 2}%`)
    positionLabel.textContent = `${state.x < -10 ? 'Izquierda' : state.x > 10 ? 'Derecha' : 'Centro'} · ${state.y > 10 ? 'Arriba' : state.y < -10 ? 'Abajo' : 'Centro'}`
    for (const [id] of ranges) {
      document.querySelector<HTMLInputElement>(`#light-${id}`)!.value = String(state[id])
      const number = document.querySelector<HTMLInputElement>(`#light-${id}-number`)!
      if (document.activeElement !== number) number.value = String(state[id])
    }
    document.querySelectorAll<HTMLInputElement>('[data-toggle]').forEach(input => { input.checked = state[input.dataset.toggle as BooleanLightKey] })
    document.querySelectorAll<HTMLInputElement>('[data-color]').forEach(input => { input.value = state[input.dataset.color as ColorLightKey] })
    for (const light of LIGHT_SOURCES) {
      document.querySelector<HTMLElement>(`[data-dot="${light.color}"]`)!.style.backgroundColor = state[light.color]
      document.querySelector<HTMLElement>(`[data-summary="${light.id}"]`)!.textContent = state[light.on] ? `${state[light.intensity]}%` : 'Apagada'
    }
    presetButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lightPreset === preset)))
    document.querySelector('#light-current')!.textContent = LIGHT_PRESETS[preset]?.name ?? (preset === 'saved' ? 'Mi luz guardada' : 'Ajuste libre')
    loadButton.disabled = !saved
    onChange({ ...state })
  }
  const edited = () => { preset = ''; sync() }
  const clamp = (value: number) => Math.max(-100, Math.min(100, Math.round(value)))
  const drag = (event: PointerEvent) => {
    const box = pad.getBoundingClientRect()
    state.x = clamp((event.clientX - box.left) / box.width * 200 - 100)
    state.y = clamp(100 - (event.clientY - box.top) / box.height * 200)
    edited()
  }
  pad.addEventListener('pointerdown', event => {
    if (event.button !== 0) return
    pad.setPointerCapture(event.pointerId); drag(event)
  })
  pad.addEventListener('pointermove', event => { if (pad.hasPointerCapture(event.pointerId)) drag(event) })
  pad.addEventListener('pointerup', event => { if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId) })
  pad.addEventListener('keydown', event => {
    const directions: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }
    if (!(event.key in directions)) return
    event.preventDefault()
    const [x, y] = directions[event.key]
    state.x = clamp(state.x + x); state.y = clamp(state.y + y); edited()
  })
  document.querySelectorAll<HTMLInputElement>('[data-range], [data-number]').forEach(input => {
    const key = (input.dataset.range ?? input.dataset.number) as NumericLightKey
    const { min, max } = ranges.get(key)!
    input.addEventListener('input', () => {
      if (input.value === '' || !Number.isFinite(input.valueAsNumber)) return
      state[key] = Math.max(min, Math.min(max, Math.round(input.valueAsNumber)))
      edited()
    })
    input.addEventListener('change', () => { input.value = String(state[key]); sync() })
  })
  document.querySelectorAll<HTMLInputElement>('[data-toggle]').forEach(input => input.addEventListener('change', () => {
    state[input.dataset.toggle as BooleanLightKey] = input.checked; edited()
  }))
  document.querySelectorAll<HTMLInputElement>('[data-color]').forEach(input => input.addEventListener('input', () => {
    state[input.dataset.color as ColorLightKey] = input.value; edited()
  }))
  presetButtons.forEach(button => button.addEventListener('click', () => {
    preset = button.dataset.lightPreset!; Object.assign(state, DEFAULT_LIGHT, LIGHT_PRESETS[preset].values); sync()
  }))
  document.querySelectorAll<HTMLButtonElement>('[data-light-section]').forEach(button => button.addEventListener('click', () => {
    const section = document.querySelector<HTMLDetailsElement>(`#light-section-${button.dataset.lightSection}`)!
    document.querySelectorAll<HTMLDetailsElement>('.light-section').forEach(item => { item.open = item === section })
    const scroll = document.querySelector<HTMLElement>('.light-scroll')!
    scroll.scrollTop += section.getBoundingClientRect().top - scroll.getBoundingClientRect().top
  }))
  document.querySelector('#reset-light')!.addEventListener('click', () => { preset = 'reference'; Object.assign(state, DEFAULT_LIGHT); sync() })
  document.querySelector('#save-light')!.addEventListener('click', () => {
    saved = { ...state }
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); memoryStatus.textContent = 'Tu luz quedó guardada en este navegador.' }
    catch { memoryStatus.textContent = 'Guardada sólo hasta cerrar esta página.' }
    loadButton.disabled = false
  })
  loadButton.addEventListener('click', () => { if (saved) { preset = 'saved'; Object.assign(state, saved); sync() } })
  sync()
}
