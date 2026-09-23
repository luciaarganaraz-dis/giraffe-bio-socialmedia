import './styles/tokens.css'
import './styles/studio.css'
import { createStudio } from './studio'
import { type Piece } from './logo'
import { type Finish } from './materials'

const downloadIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" stroke="currentColor" stroke-width="1.5"/></svg>'
const resetIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 .7 6M4 4v6h6" stroke="currentColor" stroke-width="1.5"/></svg>'
const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <a class="skip-link" href="#controls">Ir a los controles</a>
  <header class="header">
    <a class="brand" href="./" aria-label="Giraffe bio., inicio"><img src="${import.meta.env.BASE_URL}giraffe-bio.svg" alt="Giraffe bio." width="1172" height="182" /></a>
    <span class="header-label">Brand studio <span>/</span> 001</span>
    <span class="local-label"><i></i> Un nuevo punto de vista</span>
  </header>
  <main>
    <div class="intro"><div><p class="eyebrow">GIRAFFE BIO. / EXPLORACIÓN 3D</p><h1>Una nueva dimensión.</h1></div><p class="intro-note">La misma identidad.<br />Ahora, con otra profundidad.</p></div>
    <section class="stage" aria-label="Vista interactiva del logo en tres dimensiones">
      <div class="stage-top"><span id="piece-label">01 — Logo completo</span><span>ESTUDIO DE MATERIAL</span></div>
      <div class="viewer" id="viewer" tabindex="0" role="img" aria-label="Logo Giraffe bio. en 3D. Arrastrá para girar, usá la rueda o dos dedos para acercar. Con teclado, las flechas giran y las teclas más y menos acercan.">
        <img class="fallback" src="${import.meta.env.BASE_URL}giraffe-bio.svg" alt="" />
      </div>
      <div class="stage-bottom"><span class="drag-hint"><span aria-hidden="true">↔</span> Arrastrá para explorar</span><div class="view-actions"><button id="motion" type="button" aria-pressed="true" disabled>Pausar movimiento</button><button id="reset" class="icon-button" type="button" aria-label="Restablecer vista" title="Restablecer vista" disabled>${resetIcon}</button></div></div>
    </section>
    <section class="controls" id="controls" aria-label="Personalizar logo">
      <fieldset class="control-block"><legend>01 <span>Pieza</span></legend><div class="segmented" id="piece"><button type="button" data-piece="logo" aria-pressed="true" disabled>Logo completo</button><button type="button" data-piece="symbol" aria-pressed="false" disabled>Isotipo</button></div></fieldset>
      <fieldset class="control-block"><legend>02 <span>Material</span></legend><div class="materials" id="materials"><button type="button" data-finish="graphite" aria-pressed="true" disabled><i class="swatch graphite"></i>Grafito</button><button type="button" data-finish="copper" aria-pressed="false" disabled><i class="swatch copper"></i>Cobre</button><button type="button" data-finish="ivory" aria-pressed="false" disabled><i class="swatch ivory"></i>Marfil</button></div></fieldset>
      <fieldset class="control-block depth-control"><legend>03 <span>Profundidad</span></legend><div class="depth-row"><input id="depth" type="range" min="8" max="60" value="36" aria-label="Profundidad del logo" disabled /><output for="depth" id="depth-value">36</output></div></fieldset>
    </section>
    <div class="export-bar"><label class="checkbox"><input id="transparent" type="checkbox" checked /><span>PNG con fondo transparente</span></label><div class="export-actions"><button type="button" id="export-model" class="button secondary" disabled>Modelo 3D <span>.glb</span>${downloadIcon}</button><button type="button" id="export-image" class="button primary" disabled>Descargar imagen${downloadIcon}</button></div></div>
    <p id="status" class="status" role="status">Preparando el logo…</p>
  </main>
  <footer><span>Giraffe bio. / Estudio de identidad</span><span>Giraffe bio. © ${new Date().getFullYear()}</span></footer>
`

const status = document.querySelector<HTMLElement>('#status')!
const host = document.querySelector<HTMLElement>('#viewer')!
function save(blob: Blob, filename: string) {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

async function start() {
  const studio = await createStudio(host)
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('[disabled]').forEach(el => { el.disabled = false })
  const motion = document.querySelector<HTMLButtonElement>('#motion')!
  const updateMotion = (moving: boolean) => {
    motion.textContent = moving ? 'Pausar movimiento' : 'Activar movimiento'
    motion.setAttribute('aria-pressed', String(moving))
  }
  studio.onMotionChange = updateMotion
  updateMotion(studio.moving)
  status.textContent = ''
  motion.addEventListener('click', () => studio.setMotion(!studio.moving))
  document.querySelector('#reset')!.addEventListener('click', () => studio.reset())
  document.querySelectorAll<HTMLButtonElement>('[data-piece]').forEach(button => {
    button.addEventListener('click', () => {
      const piece = button.dataset.piece as Piece
      studio.setPiece(piece)
      document.querySelectorAll('[data-piece]').forEach(el => el.setAttribute('aria-pressed', String(el === button)))
      document.querySelector('#piece-label')!.textContent = piece === 'logo' ? '01 — Logo completo' : '02 — Isotipo'
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-finish]').forEach(button => {
    button.addEventListener('click', () => {
      studio.setFinish(button.dataset.finish as Finish)
      document.querySelectorAll('[data-finish]').forEach(el => el.setAttribute('aria-pressed', String(el === button)))
    })
  })
  let depthTimer: ReturnType<typeof setTimeout>
  document.querySelector<HTMLInputElement>('#depth')!.addEventListener('input', event => {
    const value = Number((event.target as HTMLInputElement).value)
    document.querySelector('#depth-value')!.textContent = String(value)
    clearTimeout(depthTimer)
    depthTimer = setTimeout(() => studio.setDepth(value), 70)
  })
  host.addEventListener('keydown', event => studio.key(event))
  for (const [id, format] of [['export-model', 'model'], ['export-image', 'image']] as const) {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`)!
    button.addEventListener('click', async () => {
      button.disabled = true
      studio.setMotion(false)
      status.textContent = 'Preparando la descarga…'
      try {
        const name = `giraffe-bio-${studio.piece}-${studio.finish}`
        if (format === 'model') {
          const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
          const buffer = await new GLTFExporter().parseAsync(studio.model, { binary: true }) as ArrayBuffer
          save(new Blob([buffer], { type: 'model/gltf-binary' }), `${name}.glb`)
        } else {
          const transparent = document.querySelector<HTMLInputElement>('#transparent')!.checked
          save(await studio.capture(transparent), `${name}.png`)
        }
        status.textContent = 'Listo. Tu archivo está descargado.'
      } catch (error) {
        console.error(error)
        status.textContent = 'La descarga no se pudo completar. Probá de nuevo.'
      } finally { button.disabled = false }
    })
  }
  const lost = (event: Event) => {
    event.preventDefault()
    status.textContent = 'La vista 3D se interrumpió. Recargá para volver a abrirla.'
    host.dataset.ready = 'false'
  }
  host.querySelector('canvas')!.addEventListener('webglcontextlost', lost)
  window.addEventListener('pagehide', event => {
    clearTimeout(depthTimer)
    if (!event.persisted) studio.dispose()
  })
}
start().catch(error => {
  console.error(error)
  status.textContent = 'No se pudo abrir la vista 3D. Probá recargar o usar un navegador con WebGL.'
})
