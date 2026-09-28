import { textureDefaults, readTexture, textureRanges, type TextureKey, type TexturePreset, type TextureSettings } from './texture'
import { bindFields, field, readStorage, saveStorage, syncField } from './fields'

const labels: Record<TextureKey, string> = {
  scale: 'Escala de textura', relief: 'Relieve de superficie', detail: 'Detalle de la roca',
  veins: 'Vetas claras', roughness: 'Rugosidad', goldAmount: 'Cantidad de oro',
  goldSize: 'Tamaño del mineral', goldSpecks: 'Motas doradas', goldShine: 'Brillo del oro',
}
export function textureMarkup() {
  const fields = (keys: TextureKey[]) => keys.map(key => field(`texture-${key}`, labels[key], textureDefaults()[key], textureRanges[key][0], textureRanges[key][1])).join('')
  return `<section id="texture-panel" class="inspector-panel" aria-label="Textura de la piedra" hidden>
    <div class="light-heading"><div><span class="eyebrow">MATERIAL DE LA PIEDRA</span><p>La textura de Giraffe, a tu medida.</p></div><button id="texture-reset" type="button" disabled>Restablecer ↺</button></div>
    <div class="inspector-scroll"><label class="inspector-select">Material base<select id="texture-preset" disabled><option value="sculpture">Piedra tallada actual</option><option value="original-004-v2">Giraffe · Original 004_v2</option></select></label>
      <p class="light-note">Cambia la superficie de toda la piedra y del isologo. Conserva la luz y el tallado.</p>
      <div class="light-section-body">${fields(['scale', 'relief', 'detail', 'veins', 'roughness'])}</div>
      <details class="light-section" id="texture-gold"><summary>Mineral dorado</summary><div class="light-section-body">${fields(['goldAmount', 'goldSize', 'goldSpecks', 'goldShine'])}</div></details>
    </div><p class="inspector-memory">Se guarda automáticamente. PNG y modelo 3D incluyen tus ajustes.</p>
  </section>`
}
export function bindTexture(onChange: (settings: TextureSettings) => void) {
  const storageKey = 'giraffe-social-texture-v1'
  let state = readTexture(readStorage(storageKey))
  const root = document.querySelector<HTMLElement>('#texture-panel')!
  function sync() {
    root.querySelector<HTMLSelectElement>('#texture-preset')!.value = state.preset
    for (const key of Object.keys(textureRanges) as TextureKey[]) syncField(root, `texture-${key}`, state[key])
    saveStorage(storageKey, state); onChange({ ...state })
  }
  bindFields(root, (id, value) => { state[id.replace('texture-', '') as TextureKey] = value; sync() })
  root.querySelector('#texture-preset')!.addEventListener('change', event => { state = textureDefaults((event.target as HTMLSelectElement).value as TexturePreset); sync() })
  root.querySelector('#texture-reset')!.addEventListener('click', () => { state = textureDefaults(state.preset); sync() })
  sync()
}
