import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
page.setDefaultTimeout(60000)
const errors = [], changes = {}
page.on('pageerror', e => errors.push(e.message))
page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
const state = key => page.locator('#viewer').getAttribute(`data-${key}`).then(JSON.parse)
const tab = id => page.locator(`[data-inspector="${id}"]`).click()
const pixels = () => page.locator('#viewer canvas').evaluate(canvas => {
  const copy = document.createElement('canvas'); copy.width = 160; copy.height = 200
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0, 160, 200)
  return Array.from(ctx.getImageData(0, 0, 160, 200).data)
})
const delta = (a, b) => a.reduce((n, v, i) => n + Math.abs(v - b[i]), 0) / a.length
const changed = async (key, before, min = .001) => {
  changes[key] = delta(before, await pixels()); assert.ok(changes[key] > min, `${key}: ${changes[key]}`)
}
const open = async locator => locator.evaluate(el => {
  for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true
})
const field = async (id, value) => {
  const input = page.locator(`#${id}-number`); await open(input)
  await input.fill(String(value)); await input.press('Tab')
}
const color = async (id, value) => {
  const input = page.locator(`#${id}`); await open(input); await input.fill(value); await input.dispatchEvent('input')
}
const download = async (id, path) => {
  const event = page.waitForEvent('download'); await page.locator(id).click(); await (await event).saveAs(path)
}
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-render]')
  const base = await pixels()
  await tab('material')
  await color('material-baseColor', '#ff2211'); await changed('base color', base)
  await page.locator('#material-reset').click()
  await page.locator('#material-customSurface').check()
  for (const [key, value] of [['roughness', .08], ['metallic', .8], ['ior', 2.4], ['specular', 0], ['coat', 1], ['sheen', 1], ['iridescence', 1], ['transmission', .9], ['alpha', .4]]) {
    const before = await pixels(); await field(`material-${key}`, value); await changed(key, before)
    await page.locator('#material-reset').click(); await page.locator('#material-customSurface').check()
  }
  await field('material-roughness', .08); await field('material-metallic', .8)
  const reflective = await pixels(); await field('material-anisotropy', .9); await changed('anisotropy', reflective)
  await color('material-emissionColor', '#ff2200'); const noEmission = await pixels()
  await field('material-emissionStrength', 2); await changed('emission', noEmission)
  await page.locator('#material-reset').click()
  await tab('detail'); await page.locator('#detail-enabled').check()
  const detailBase = await pixels(); await color('detail-veinColor', '#2288ff'); await changed('vein color', detailBase)
  const veins = await pixels(); await field('detail-veinScale', 2); await changed('vein scale', veins)
  const smooth = await pixels(); await field('detail-chiselStrength', .4); await changed('directional bump', smooth)
  await page.locator('#detail-reset').click()
  assert.ok(delta(base, await pixels()) < .05, 'Reset preserves the original material')
  await tab('camera'); await page.locator('#camera-projection').selectOption('perspective')
  await changed('perspective camera', base)
  const perspective = await pixels(); await field('camera-focal', 80); await changed('focal length', perspective)
  await field('camera-focal', 50); const normal = await pixels()
  await field('camera-roll', 25); await changed('camera roll', normal)
  await field('camera-roll', 0); await field('camera-azimuth', 25)
  assert.ok(Math.abs((await state('camera')).azimuth - 25) < .01)
  await page.locator('#camera-reset').click()
  assert.ok(delta(base, await pixels()) < .05, 'Camera reset returns to original frame')
  const canvas = await page.locator('#viewer canvas').boundingBox()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
  await page.mouse.down(); await page.mouse.move(canvas.x + canvas.width / 2 + 40, canvas.y + canvas.height / 2 + 10, { steps: 5 }); await page.mouse.up()
  await page.waitForTimeout(400)
  assert.ok(Math.abs((await state('camera')).azimuth) > 1, 'Dragging syncs camera controls')
  await page.locator('#camera-reset').click()
  await tab('object'); await field('object-scaleX', .6); const scaled = await pixels(); await changed('object scale', base)
  await tab('render'); await field('render-quality', 1); await field('render-quality', 2)
  const resizeDifference = delta(scaled, await pixels())
  assert.ok(resizeDifference < .05, `Resize does not refit away object scale: ${resizeDifference}`)
  await tab('object'); await page.locator('#object-reset').click()
  await tab('render'); await field('render-exposure', 1.5); await changed('render exposure', base)
  const exposed = await pixels(); await page.locator('#render-tone').selectOption('aces'); await changed('view transform', exposed)
  await page.locator('#render-reset').click()
  await tab('light'); await page.locator('#lighting-mode').selectOption('giraffe')
  const cool = await pixels(); await page.locator('#giraffe-lamp-temperature-on').check()
  await field('giraffe-lamp-temperature', 2000); await changed('color temperature', cool)
  await open(page.locator('#giraffe-lamp-shadows')); const shadow = await pixels()
  await page.locator('#giraffe-lamp-shadows').uncheck(); await changed('shadow toggle', shadow)
  await page.locator('#giraffe-lamp-shadows').check(); await field('giraffe-lamp-shadowBias', -.0004)
  await page.locator('#giraffe-lamp-shadowResolution').selectOption('1024')
  assert.equal((await state('giraffe-light')).lamps[0].shadowBias, -.0004)
  await page.locator('#giraffe-reset').click()
  await tab('material'); await field('material-coat', .7); await field('material-coatRoughness', .25)
  await field('material-ior', 1.7)
  await tab('object'); await field('object-x', .3); await field('object-scaleX', .8)
  await tab('camera'); await page.locator('#camera-projection').selectOption('perspective'); await field('camera-focal', 60)
  await tab('render'); await page.locator('#render-outputPreset').selectOption('custom')
  await field('render-width', 640); await field('render-height', 800); await field('render-outputScale', 50)
  await download('#export-image', '.review/parameters-custom.png')
  const png = readFileSync('.review/parameters-custom.png')
  assert.equal(png.readUInt32BE(16), 320); assert.equal(png.readUInt32BE(20), 400)
  await download('#export-model', '.review/parameters-physical.glb')
  const glb = readFileSync('.review/parameters-physical.glb')
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString())
  const material = gltf.materials[0]
  assert.equal(gltf.meshes.length, 1); assert.equal(gltf.materials.length, 1)
  assert.equal(material.extensions.KHR_materials_clearcoat.clearcoatFactor, .7)
  assert.equal(material.extensions.KHR_materials_ior.ior, 1.7)
  const root = gltf.nodes.find(n => n.extras?.camera)
  assert.equal(root.extras.camera.focal, 60); assert.equal(root.extras.relief.recessed, 5)
  assert.equal(root.matrix[0], .8); assert.equal(root.matrix[12], .3)
  await download('#export-settings', '.review/parameters-settings.json')
  const saved = JSON.parse(readFileSync('.review/parameters-settings.json'))
  assert.equal(saved.surface.material.coat, .7); assert.equal(saved.camera.focal, 60)
  assert.equal(saved.render.width, 640); assert.equal(saved.object.scaleX, .8)
  await page.reload(); await page.waitForSelector('#viewer[data-render]')
  assert.equal((await state('material')).coat, .7); assert.equal((await state('camera')).focal, 60)
  assert.equal((await state('object')).scaleX, .8); assert.equal((await state('render')).width, 640)
  for (const id of ['material', 'camera', 'object', 'render']) { await tab(id); await page.locator(`#${id}-reset`).click() }
  await tab('material'); await page.screenshot({ path: '.review/parameters-material-panel.png', fullPage: true })
  await tab('camera'); await page.screenshot({ path: '.review/parameters-camera-panel.png', fullPage: true })
  assert.deepEqual(errors, [])
  writeFileSync('.review/parameters-report.json', JSON.stringify({ changes, png: [320, 400], extensions: gltf.extensionsUsed, errors }, null, 2))
  console.log(JSON.stringify({ changes, extensions: gltf.extensionsUsed, errors }, null, 2))
} finally { await browser.close() }
