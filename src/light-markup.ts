import { DEFAULT_LIGHT, LIGHT_PRESETS, LIGHT_SOURCES, type BooleanLightKey, type NumericLightKey } from './light-settings'

export const ranges = new Map<NumericLightKey, { min: number; max: number }>()
function slider(id: NumericLightKey, name: string, min: number, max: number, unit = '%') {
  ranges.set(id, { min, max })
  return `<div class="light-slider"><div class="light-slider-label"><label for="light-${id}">${name}</label><span class="light-value"><input id="light-${id}-number" data-number="${id}" type="number" min="${min}" max="${max}" step="1" value="${DEFAULT_LIGHT[id]}" aria-label="${name}, valor exacto" disabled><small>${unit}</small></span></div><input id="light-${id}" data-range="${id}" type="range" min="${min}" max="${max}" value="${DEFAULT_LIGHT[id]}" disabled></div>`
}
function toggle(id: BooleanLightKey, name: string) {
  return `<label class="light-toggle"><input id="light-${id}" data-toggle="${id}" type="checkbox" ${DEFAULT_LIGHT[id] ? 'checked' : ''} disabled><span>${name}</span></label>`
}
export function lightControlsMarkup() {
  return `<section class="light-panel" aria-label="Control de luz">
    <div class="light-heading"><div><span class="eyebrow">LUZ DEL ESTUDIO</span><p>Cuatro luces. Tu dirección.</p></div><button id="reset-light" type="button" disabled>Restablecer ↺</button></div>
    <div class="light-presets" aria-label="Combinaciones de luz">${Object.entries(LIGHT_PRESETS).map(([id, preset]) => `<button data-light-preset="${id}" type="button" aria-pressed="${id === 'reference'}" disabled>${preset.name}</button>`).join('')}</div>
    <p class="light-current" id="light-current" role="status">Referencia</p>
    <nav class="light-nav" aria-label="Editar una luz">${[...LIGHT_SOURCES.map(light => [light.id, light.name]), ['environment', 'Ambiente / sombras']].map(([id, name]) => `<button type="button" data-light-section="${id}" aria-controls="light-section-${id}" disabled>${name}</button>`).join('')}</nav>
    <div class="light-scroll">
      ${slider('exposure', 'Exposición', 10, 250)}
      ${LIGHT_SOURCES.map((light, i) => `<details class="light-section" id="light-section-${light.id}" ${i === 0 ? 'open' : ''}>
        <summary><span class="light-summary-dot" data-dot="${light.color}"></span><span>${light.name}</span><small data-summary="${light.id}"></small></summary>
        <div class="light-section-body"><p class="light-note">${light.note}</p>
          <div class="light-source-top">${toggle(light.on, 'Encendida')}<label class="light-color">Color<input id="light-${light.color}" data-color="${light.color}" type="color" value="${DEFAULT_LIGHT[light.color]}" aria-label="Color de ${light.name.toLowerCase()}" disabled></label></div>
          ${slider(light.intensity, 'Intensidad', 0, 300)}
          ${i === 0 ? `<div class="light-position-control"><button id="light-position" type="button" class="light-pad" aria-label="Posición de la luz. Arrastrá el punto o usá las flechas." aria-describedby="light-position-value" disabled><span class="light-orbit" aria-hidden="true"></span><span class="light-point" aria-hidden="true"></span></button><div class="light-position-caption"><span>Mové la principal</span><small id="light-position-value"></small><small>Arrastrá el punto</small></div></div>` : ''}
          ${light.axes.map((axis, index) => slider(axis, ['Izquierda ↔ derecha', 'Abajo ↔ arriba', 'Atrás ↔ adelante'][index], -100, 100, '')).join('')}
          ${i === 3 ? `${slider('angle', 'Apertura del haz', 5, 80, '°')}${slider('penumbra', 'Difusión del borde', 0, 100)}${slider('targetX', 'Apuntar · horizontal', -100, 100, '')}${slider('targetY', 'Apuntar · vertical', -100, 100, '')}` : ''}
          ${toggle(light.shadow, 'Proyectar sombras')}
        </div></details>`).join('')}
      <details class="light-section" id="light-section-environment"><summary><span>Ambiente y sombras</span></summary><div class="light-section-body">
        <p class="light-note">Luz que envuelve la pieza y carácter de las sombras.</p>
        ${slider('ambient', 'Luz ambiente', 0, 300)}${slider('envRotation', 'Giro del ambiente', -180, 180, '°')}
        ${slider('shadowStrength', 'Intensidad de sombras', 0, 100)}${slider('softness', 'Suavidad de sombras', 0, 100)}
        ${toggle('followCamera', 'Las luces siguen la cámara')}
      </div></details>
    </div>
    <div class="light-memory"><button id="save-light" type="button" disabled>Guardar mi luz</button><button id="load-light" type="button" disabled>Recuperar</button><small id="light-memory-status" role="status">Se guarda en este navegador.</small></div>
  </section>`
}
