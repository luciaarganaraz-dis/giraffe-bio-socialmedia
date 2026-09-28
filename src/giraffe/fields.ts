/** Shared native sliders and exact inputs for the two imported inspectors. */
export function field(id: string, label: string, value: number, min: number, max: number, step = 1, unit = '%') {
  return `<div class="light-slider"><div class="light-slider-label"><label for="${id}">${label}</label><span class="light-value"><input id="${id}-number" data-field="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}, valor exacto" disabled><small>${unit}</small></span></div><input id="${id}" data-field="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" disabled></div>`
}
export function bindFields(root: HTMLElement, onChange: (id: string, value: number) => void) {
  root.querySelectorAll<HTMLInputElement>('[data-field]').forEach(input => {
    const update = () => {
      if (input.value === '' || !Number.isFinite(input.valueAsNumber)) return
      const n = Math.max(Number(input.min), Math.min(Number(input.max), input.valueAsNumber))
      onChange(input.dataset.field!, n)
    }
    input.addEventListener('input', update)
    input.addEventListener('change', () => {
      update()
      input.value = root.querySelector<HTMLInputElement>(`input[type="range"][data-field="${input.dataset.field}"]`)!.value
    })
  })
}
export function syncField(root: HTMLElement, id: string, value: number) {
  root.querySelectorAll<HTMLInputElement>(`[data-field="${id}"]`).forEach(input => {
    if (input !== document.activeElement) input.value = String(Number(value.toFixed(3)))
  })
}
export function readStorage(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
export function saveStorage(key: string, state: unknown) {
  try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* Live editing remains available. */ }
}
