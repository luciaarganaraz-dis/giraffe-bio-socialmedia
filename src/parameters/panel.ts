import { field, bindFields, syncField, readStorage, saveStorage } from '../giraffe/fields'
export type Values = Record<string, number | string | boolean>
export type Parameter = { key: string; label: string; min?: number; max?: number; step?: number; unit?: string; type?: 'number' | 'color' | 'toggle' | 'select'; options?: Record<string, string> }
export type ParameterGroup = { title: string; note?: string; fields: Parameter[] }
export const number = (key: string, label: string, min: number, max: number, step = .01, unit = ''): Parameter => ({ key, label, min, max, step, unit })
export const color = (key: string, label: string): Parameter => ({ key, label, type: 'color' })
export const toggle = (key: string, label: string): Parameter => ({ key, label, type: 'toggle' })
export const select = (key: string, label: string, options: Record<string, string>): Parameter => ({ key, label, type: 'select', options })
export function readValues<T extends Values>(defaults: T, groups: ParameterGroup[], saved: unknown): T {
  const state: Values = { ...defaults }, value = saved && typeof saved === 'object' ? saved as Values : {}
  for (const f of groups.flatMap(g => g.fields)) {
    const v = value[f.key]
    if (f.type === 'color' && typeof v === 'string' && /^#[\da-f]{6}$/i.test(v)) state[f.key] = v
    else if (f.type === 'toggle' && typeof v === 'boolean') state[f.key] = v
    else if (f.type === 'select' && typeof v === 'string' && f.options?.[v]) state[f.key] = v
    else if (!f.type && typeof v === 'number' && Number.isFinite(v)) state[f.key] = Math.max(f.min!, Math.min(f.max!, v))
  }
  return state as T
}
export function parameterFields(prefix: string, values: Values, fields: Parameter[]) {
  return fields.map(f => {
    const id = `${prefix}-${f.key}`, v = values[f.key]
    if (f.type === 'color') return `<label class="light-color parameter-color">${f.label}<input id="${id}" data-value="${f.key}" type="color" value="${v}" disabled></label>`
    if (f.type === 'toggle') return `<label class="light-toggle"><input id="${id}" data-value="${f.key}" type="checkbox" ${v ? 'checked' : ''} disabled>${f.label}</label>`
    if (f.type === 'select') return `<label class="inspector-select">${f.label}<select id="${id}" data-value="${f.key}" disabled>${Object.entries(f.options!).map(([key, label]) => `<option value="${key}" ${key === v ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`
    return field(id, f.label, Number(v), f.min!, f.max!, f.step, f.unit ?? '')
  }).join('')
}
export function parameterGroups(prefix: string, values: Values, groups: ParameterGroup[]) {
  return groups.map((group, i) => `<details class="light-section" id="${prefix}-group-${i}" ${i === 0 ? 'open' : ''}><summary>${group.title}</summary><div class="light-section-body">${group.note ? `<p class="light-note">${group.note}</p>` : ''}${parameterFields(prefix, values, group.fields)}</div></details>`).join('')
}
export function panelMarkup(id: string, title: string, defaults: Values, groups: ParameterGroup[]) {
  return `<section id="${id}-panel" class="inspector-panel" hidden aria-label="${title}"><div class="light-heading"><div><span class="eyebrow">${title.toUpperCase()}</span><p>Ajustes de la escena.</p></div><button id="${id}-reset" type="button" disabled>Restablecer ↺</button></div><div class="inspector-scroll">${parameterGroups(id, defaults, groups)}</div><p class="inspector-memory">Se guarda automáticamente en este navegador.</p></section>`
}
export function bindPanel<T extends Values>(id: string, defaults: T, groups: ParameterGroup[], onChange: (state: T, changed?: string) => void) {
  const storage = `giraffe-${id}-v1`, root = document.querySelector<HTMLElement>(`#${id}-panel`)!
  let state = readValues(defaults, groups, readStorage(storage))
  function sync() {
    for (const f of groups.flatMap(g => g.fields)) {
      if (!f.type) syncField(root, `${id}-${f.key}`, Number(state[f.key]))
      else {
        const input = root.querySelector<HTMLInputElement>(`#${id}-${f.key}`)!
        if (f.type === 'toggle') input.checked = Boolean(state[f.key])
        else input.value = String(state[f.key])
      }
    }
    saveStorage(storage, state)
  }
  const emit = (changed?: string) => { sync(); onChange({ ...state }, changed) }
  bindFields(root, (key, value) => { (state as Values)[key.slice(id.length + 1)] = value; emit(key.slice(id.length + 1)) })
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-value]').forEach(input => input.addEventListener('input', () => {
    (state as Values)[input.dataset.value!] = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : input.value
    emit(input.dataset.value)
  }))
  root.querySelector(`#${id}-reset`)!.addEventListener('click', () => { state = { ...defaults }; emit('reset') })
  emit('init')
  return { sync(value: Partial<T>) { state = { ...state, ...value }; sync() } }
}
