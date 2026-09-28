import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
// Fixed studio crop: compare the recessed front with the illuminated right flank.
const lightPixels = () => page.locator('#viewer canvas').evaluate(canvas => {
  const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0)
  const sample = (x, y, w, h) => {
    const data = ctx.getImageData(x * copy.width, y * copy.height, w * copy.width, h * copy.height).data
    let total = 0
    for (let i = 0; i < data.length; i += 4) total += (data[i] + data[i + 1] + data[i + 2]) / 3
    return total / (data.length / 4)
  }
  return { front: sample(.37, .38, .1, .24), flank: sample(.62, .3, .035, .3) }
})
const glbJson = path => {
  const buffer = readFileSync(path)
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF')
  return JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)).trim())
}
const download = async (format, path) => {
  const [file] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.locator(`#export-${format}`).click()])
  await file.saveAs(path)
}
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-ready="true"]')
  assert.equal(await page.locator('button[data-piece="sculpture"]').getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '1')
  const light = await lightPixels()
  assert.ok(light.flank > light.front * 2, 'Raking light must separate the bright flank from the dark front')
  assert.ok(light.front > 5, 'The isologo must remain readable in the shadow')
  await page.locator('#light-fill').fill('0')
  await page.locator('#light-fill').dispatchEvent('input')
  const noFill = await lightPixels()
  assert.ok(noFill.front < light.front * .6, 'Fill must reveal real detail in the dark front')
  await page.locator('#reset-light').click()
  const resetLight = await lightPixels()
  assert.ok(Math.abs(resetLight.front - light.front) < .01)
  await page.screenshot({ path: '.review/sculpture-studio.png', fullPage: true })
  await page.locator('canvas').screenshot({ path: '.review/sculpture-source.png' })
  await download('image', 'exports/giraffe-bio-escultura.png')
  const png = readFileSync('exports/giraffe-bio-escultura.png')
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [2160, 2700])
  await download('model', 'exports/giraffe-bio-escultura.glb')
  const json = glbJson('exports/giraffe-bio-escultura.glb')
  assert.equal(json.meshes.length, 1)
  assert.equal(json.images.length, 3)
  assert.ok(json.nodes.some(node => node.name?.startsWith('Monolito')))
  assert.equal(json.materials.length, 1)
  assert.equal(json.nodes.filter(node => node.name?.startsWith('Lateral')).length, 0)
  await page.locator('#light-position').press('ArrowRight')
  assert.equal(JSON.parse(await page.locator('#viewer').getAttribute('data-light')).x, 85)
  assert.equal(await page.locator('#viewer').getAttribute('data-piece'), 'sculpture')
  await page.locator('#light-intensity').fill('160')
  await page.locator('#light-intensity').dispatchEvent('input')
  await page.screenshot({ path: '.review/sculpture-light.png', fullPage: true })
  await page.locator('#reset-light').click()
  await page.locator('#transparent').check()
  await download('image', '.review/sculpture-transparent.png')
  const alpha = await page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    return ctx.getImageData(0, 0, 1, 1).data[3]
  }, `data:image/png;base64,${readFileSync('.review/sculpture-transparent.png').toString('base64')}`)
  assert.equal(alpha, 0)
  assert.equal(await page.locator('#materials').isVisible(), false)
  await page.locator('button[data-piece="logo"]').click()
  assert.equal(await page.locator('#materials').isVisible(), true)
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '17')
  await page.locator('button[data-piece="symbol"]').click()
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '5')
  await page.route('**/__sculpture-review*', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0"><script type="module" src="/scripts/sculpture-preview.ts"></script></body></html>' }))
  await page.goto('http://127.0.0.1:5187/__sculpture-review')
  await page.waitForSelector('body[data-ready="true"]')
  await page.locator('canvas').screenshot({ path: '.review/sculpture-export.png' })
  const exportedRelief = JSON.parse(await page.locator('body').getAttribute('data-relief'))
  const exportedWalls = JSON.parse(await page.locator('body').getAttribute('data-walls'))
  exportedRelief.forEach(probe => assert.ok(probe.recessed ? probe.z < .65 : probe.z > 1.35))
  for (const query of ['side', 'side&neutral']) {
    await page.goto(`http://127.0.0.1:5187/__sculpture-review?${query}`)
    await page.waitForSelector('body[data-ready="true"]')
    await page.locator('canvas').screenshot({ path: `.review/sculpture-${query.includes('neutral') ? 'geometry' : 'side'}.png` })
  }
  await page.route('**/__geometry-review', route => route.fulfill({ contentType: 'text/html', body: '<html><body><script type="module" src="/scripts/sculpture-geometry.ts"></script></body></html>' }))
  await page.goto('http://127.0.0.1:5187/__geometry-review')
  await page.waitForSelector('body[data-ready="true"]')
  const geometry = JSON.parse(await page.locator('body').textContent())
  geometry.forEach(({ probes, meshes }) => {
    assert.equal(meshes, 1)
    assert.equal(probes.filter(probe => probe.recessed).length, 3)
    assert.equal(probes.filter(probe => !probe.recessed).length, 2)
    probes.forEach(probe => assert.ok(probe.recessed ? probe.change < -.12 : probe.change > .12))
  })
  geometry[0].probes.forEach((probe, i) => {
    assert.ok(Math.abs(geometry[2].probes[i].change) > Math.abs(probe.change) + .35)
  })
  for (const [wall, minimum] of Object.entries({ rock: .15, raised: .025, recessed: .04 })) {
    const profile = geometry[1].walls[wall]
    assert.ok(profile.samples.every(sample => Number.isFinite(sample.x)), `${wall}: every side ray must hit a wall`)
    assert.ok(profile.departure > minimum, `${wall}: the wall must break its straight extrusion through the depth`)
    assert.ok(Math.abs(exportedWalls[wall].departure - profile.departure) < .00001, `${wall}: GLB must preserve the fractured wall`)
  }
  assert.deepEqual(errors, [])
  const report = { meshes: json.meshes.length, maps: json.images.length, portrait: [2160, 2700], transparentAlpha: alpha, light, noFill, resetLight, geometry, exportedRelief, exportedWalls, glbBytes: readFileSync('exports/giraffe-bio-escultura.glb').length, errors }
  writeFileSync('.review/sculpture-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
