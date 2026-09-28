import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { revealLightControl, setLightSlider } from './light-test-controls.mjs'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const errors = [], changes = {}
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
const state = async () => JSON.parse(await page.locator('#viewer').getAttribute('data-light'))
const slider = (key, value) => setLightSlider(page, key, value)
const toggle = async (key, value) => (await revealLightControl(page, key)).setChecked(value)
const color = async (key, value) => (await revealLightControl(page, key)).evaluate((input, color) => {
  input.value = color; input.dispatchEvent(new Event('input', { bubbles: true }))
}, value)
const pixels = () => page.locator('#viewer canvas').evaluate(canvas => {
  const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0)
  const data = ctx.getImageData(0, 0, copy.width, copy.height).data
  const samples = []
  for (let i = 0; i < data.length; i += 64) samples.push(data[i], data[i + 1], data[i + 2])
  return samples
})
const difference = (a, b) => a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length
const changed = async (name, before, minimum = .05) => {
  const delta = difference(before, await pixels()); changes[name] = delta
  assert.ok(delta > minimum, `${name} must change rendered pixels; measured ${delta}`)
}
const reset = () => page.locator('#reset-light').click()
const png = async name => {
  const [file] = await Promise.all([page.waitForEvent('download'), page.locator('#export-image').click()])
  const path = `.review/light-studio-${name}.png`; await file.saveAs(path)
  return page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const channels = [0, 0, 0]; let count = 0
    for (let i = 0; i < data.length; i += 64) { for (let c = 0; c < 3; c++) channels[c] += data[i + c]; count++ }
    return { size: [canvas.width, canvas.height], alpha: data[3], channels: channels.map(value => value / count) }
  }, `data:image/png;base64,${readFileSync(path).toString('base64')}`)
}
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-ready="true"]')
  const defaults = await state(), baseline = await pixels()
  assert.equal(await page.locator('[data-range]').count(), 25)
  for (const [id, intensity] of [['key', 'intensity'], ['fill', 'fill'], ['rim', 'rim'], ['accent', 'accent']]) {
    for (const lamp of ['key', 'fill', 'rim', 'accent']) await toggle(`${lamp}On`, false)
    await slider('ambient', 0)
    const dark = await pixels()
    await slider(intensity, 200); await toggle(`${id}On`, true)
    await changed(`${id} alone`, dark)
    const lit = await pixels()
    await color(`${id}Color`, '#ff4020'); await changed(`${id} color`, lit)
    await color(`${id}Color`, '#ffffff')
    const beforePosition = await pixels()
    await slider(id === 'key' ? 'x' : `${id}X`, -90)
    await slider(id === 'key' ? 'z' : `${id}Z`, 90)
    await changed(`${id} position`, beforePosition)
    await slider(intensity, 0)
    assert.ok(difference(dark, await pixels()) < .01, 'Zero intensity must turn a lamp fully off')
  }
  await reset(); await toggle('keyOn', false); await toggle('fillOn', false); await toggle('rimOn', false)
  await toggle('accentOn', true); await slider('ambient', 0); await slider('accentX', 0); await slider('accentY', 60)
  await slider('angle', 12); const narrow = await pixels()
  await slider('angle', 65); await changed('spot aperture', narrow)
  await slider('angle', 25); await slider('penumbra', 0); const hardSpot = await pixels()
  await slider('penumbra', 100); await changed('spot diffusion', hardSpot)
  const centered = await pixels(); await slider('targetX', 60); await changed('spot aim', centered)
  await reset(); await slider('shadowStrength', 0); const noShadows = await pixels()
  await slider('shadowStrength', 100); await changed('shadow strength', noShadows)
  await slider('softness', 0); const hardShadow = await pixels()
  await slider('softness', 100); await changed('shadow softness', hardShadow, .01)
  await reset(); await slider('ambient', 0); const noAmbient = await pixels()
  await slider('ambient', 250); await changed('environment intensity', noAmbient)
  const env = await pixels(); await slider('envRotation', 160); await changed('environment rotation', env)
  await reset()
  for (const lamp of ['fill', 'rim', 'accent']) {
    await toggle(`${lamp}On`, true)
    await slider(lamp, 200)
    await toggle(`${lamp}Shadow`, false); const without = await pixels()
    await toggle(`${lamp}Shadow`, true); await changed(`${lamp} shadows`, without, .001)
    await reset()
  }
  await page.locator('#viewer').scrollIntoViewIfNeeded()
  const box = await page.locator('#viewer').boundingBox()
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5)
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .65, box.y + box.height * .5, { steps: 12 }); await page.mouse.up()
  await page.waitForTimeout(500)
  const following = await pixels()
  await toggle('followCamera', false); await changed('camera versus fixed lights', following)
  await page.locator('#reset').click(); await reset()
  for (const preset of ['soft', 'dramatic', 'warm']) {
    await page.locator(`[data-light-preset="${preset}"]`).click()
    await changed(`preset ${preset}`, baseline)
  }
  await revealLightControl(page, 'intensity')
  await page.locator('#light-intensity-number').fill('999')
  assert.equal((await state()).intensity, 300)
  await page.locator('#light-intensity-number').fill('-15')
  assert.equal((await state()).intensity, 0)
  await page.locator('#light-intensity-number').fill('123')
  await page.locator('#light-exposure-number').fill('')
  await page.locator('#light-exposure-number').pressSequentially('250')
  assert.equal((await state()).exposure, 250, 'Typing an exact value must not clamp intermediate keystrokes')
  await slider('exposure', 100)
  await slider('x', -42)
  const saved = await state()
  await page.locator('#save-light').click(); await reset(); await page.locator('#load-light').click()
  assert.deepEqual(await state(), saved)
  await page.reload(); await page.waitForSelector('#viewer[data-ready="true"]')
  await page.locator('#load-light').click(); assert.deepEqual(await state(), saved)
  await reset(); assert.deepEqual(await state(), defaults)
  assert.ok(difference(baseline, await pixels()) < .01, 'Reset must restore every lighting parameter')
  const referencePng = await png('reference')
  await page.locator('[data-light-preset="warm"]').click()
  const beforeExport = await state(), warmPng = await png('warm')
  assert.deepEqual(await state(), beforeExport)
  assert.deepEqual(warmPng.size, [2160, 2700])
  assert.ok(warmPng.channels[0] - warmPng.channels[2] > referencePng.channels[0] - referencePng.channels[2] + 1)
  await page.locator('#transparent').check()
  assert.equal((await png('transparent')).alpha, 0)
  await page.locator('[data-light-section="accent"]').click()
  await page.screenshot({ path: '.review/light-studio-controls.png', fullPage: true })
  await reset(); await page.locator('[data-light-section="key"]').click()
  await page.screenshot({ path: '.review/light-studio-default.png', fullPage: true })
  assert.deepEqual(errors, [])
  const report = { parameterCount: Object.keys(defaults).length, changes, savedAndRecovered: true, referencePng, warmPng, errors }
  writeFileSync('.review/light-studio-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
