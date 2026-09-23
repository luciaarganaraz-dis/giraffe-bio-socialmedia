import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
const pixels = () => page.locator('#viewer canvas').evaluate(canvas => {
  const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0)
  const data = ctx.getImageData(0, 0, copy.width, copy.height).data
  let light = 0, samples = 0
  for (let i = 0; i < data.length; i += 64) { light += (data[i] + data[i + 1] + data[i + 2]) / 3; samples++ }
  return { mean: light / samples, cornerAlpha: data[3], width: canvas.width, height: canvas.height }
})
const slider = async (name, value) => {
  await page.locator(`#light-${name}`).fill(String(value))
  await page.locator(`#light-${name}`).dispatchEvent('input')
}
const pngInfo = async path => page.evaluate(async src => {
  const image = new Image(); image.src = src; await image.decode()
  const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
  const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
  return { width: image.width, height: image.height, alpha: ctx.getImageData(0, 0, 1, 1).data[3] }
}, `data:image/png;base64,${readFileSync(path).toString('base64')}`)
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-ready="true"]')
  assert.equal(await page.locator('#transparent').isChecked(), false)
  const baseline = await pixels()
  assert.equal(baseline.cornerAlpha, 255, 'The stone backdrop must be in the actual scene')
  await page.screenshot({ path: '.review/lighting-default.png', fullPage: true })
  await slider('intensity', 0); await slider('fill', 0); await slider('rim', 0)
  const dark = await pixels()
  assert.ok(dark.mean < baseline.mean * .25, 'Turning off all lights must darken both logo and stone wall')
  await slider('fill', 60)
  assert.ok((await pixels()).mean > dark.mean + 5, 'Fill must light the scene')
  await page.locator('#reset-light').click()
  await slider('intensity', 180)
  const strong = await pixels()
  assert.ok(strong.mean > baseline.mean + 5, 'Intensity must change rendered pixels')
  await page.locator('#reset-light').click()
  await slider('exposure', 150)
  assert.ok((await pixels()).mean > baseline.mean + 5, 'Exposure must change rendered pixels')
  await page.locator('#reset-light').click()
  await slider('rim', 0)
  const noRim = await pixels()
  await slider('rim', 200)
  assert.ok((await pixels()).mean > noRim.mean + .1, 'Rim light must reach the logo')
  await page.locator('#reset-light').click()
  const pad = await page.locator('#light-position').boundingBox()
  await page.mouse.move(pad.x + pad.width * .3, pad.y + pad.height * .15)
  await page.mouse.down()
  await page.mouse.move(pad.x + pad.width * .85, pad.y + pad.height * .75, { steps: 8 })
  await page.mouse.up()
  const moved = JSON.parse(await page.locator('#viewer').getAttribute('data-light'))
  assert.ok(moved.x > 60 && moved.y < -40)
  await page.screenshot({ path: '.review/lighting-moved.png', fullPage: true })
  await page.locator('#light-position').press('ArrowLeft')
  assert.equal(JSON.parse(await page.locator('#viewer').getAttribute('data-light')).x, moved.x - 5)
  await page.locator('#reset-light').click()
  const reset = await pixels()
  assert.ok(Math.abs(reset.mean - baseline.mean) < .01, 'Reset must restore the original lighting')
  for (const transparent of [false, true]) {
    await page.locator('#transparent').setChecked(transparent)
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export-image').click()])
    const path = transparent ? '.review/lighting-transparent.png' : 'exports/giraffe-bio-logo-stone-fondo.png'
    await download.saveAs(path)
    assert.deepEqual(await pngInfo(path), { width: 3000, height: 1500, alpha: transparent ? 0 : 255 })
    const restored = await pixels()
    assert.equal(restored.cornerAlpha, 255, 'Export must restore the backdrop in the viewer')
    assert.ok(Math.abs(restored.mean - baseline.mean) < .01)
  }
  await page.locator('[data-finish="copper"]').click()
  await slider('intensity', 140)
  assert.equal(JSON.parse(await page.locator('#viewer').getAttribute('data-light')).intensity, 140)
  await page.locator('[data-piece="symbol"]').click()
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '5')
  assert.equal(JSON.parse(await page.locator('#viewer').getAttribute('data-light')).intensity, 140)
  await page.locator('[data-finish="stone"]').click()
  await page.locator('#reset-light').click()
  await page.screenshot({ path: '.review/lighting-symbol.png', fullPage: true })
  assert.deepEqual(errors, [])
  const report = { baseline, dark, strong, reset, exports: ['stone background', 'transparent'], errors }
  writeFileSync('.review/lighting-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
