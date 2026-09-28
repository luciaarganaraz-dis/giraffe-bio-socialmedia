import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const errors = [], changes = {}
page.on('pageerror', e => errors.push(e.message))
page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
const getState = key => page.locator('#viewer').getAttribute(`data-${key}`).then(JSON.parse)
const textureTab = () => page.locator('[data-inspector="texture"]').click()
const lightTab = () => page.locator('[data-inspector="light"]').click()
const pixels = () => page.locator('#viewer canvas').evaluate(canvas => {
  const copy = document.createElement('canvas'); copy.width = 180; copy.height = 200
  const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0, 180, 200)
  return Array.from(ctx.getImageData(0, 0, 180, 200).data)
})
const delta = (a, b) => a.reduce((n, v, i) => n + Math.abs(v - b[i]), 0) / a.length
const changed = async (key, before, min = .01) => {
  changes[key] = delta(before, await pixels()); assert.ok(changes[key] > min, `${key}: ${changes[key]}`)
}
const field = async (id, value) => {
  const input = page.locator(`#${id}-number`)
  await input.evaluate(el => { let parent = el.parentElement; while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement } })
  await input.fill(String(value)); await input.press('Tab')
}
const download = async (id, path) => {
  const event = page.waitForEvent('download'); await page.locator(id).click(); await (await event).saveAs(path)
}
const glbMaps = path => {
  const b = readFileSync(path), n = b.readUInt32LE(12)
  const json = JSON.parse(b.subarray(20, 20 + n).toString())
  const binStart = 28 + n
  return { json, images: json.images.map(image => {
    const view = json.bufferViews[image.bufferView]
    return b.subarray(binStart + (view.byteOffset ?? 0), binStart + (view.byteOffset ?? 0) + view.byteLength).toString('base64')
  }) }
}
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-ready="true"]')
  const baseline = await pixels(), oldLight = await getState('light')
  await page.locator('#lighting-mode').selectOption('giraffe')
  const originalLight = await getState('giraffe-light')
  assert.equal(originalLight.lamps.length, 6)
  assert.deepEqual(originalLight.lamps.map(l => l.power), [2.18, 1.04, .83, 7.5, 7.5, 15])
  await changed('original rig', baseline)
  const beforeTexture = await pixels()
  await textureTab(); await page.locator('#texture-preset').selectOption('original-004-v2')
  await changed('original material', beforeTexture)
  assert.deepEqual(await getState('giraffe-light'), originalLight, 'Texture does not change lighting')
  const baseTexture = await getState('texture'), basePixels = await pixels()
  await page.locator('#viewer').screenshot({ path: '.review/giraffe-original.png' })
  for (const [key, value] of [['scale', 35], ['relief', 0], ['detail', 0], ['veins', 20], ['roughness', 30], ['goldSpecks', 0]]) {
    await field(`texture-${key}`, value); await changed(key, basePixels)
    await page.locator('#texture-reset').click()
  }
  await field('texture-goldAmount', 200); await changed('gold amount', basePixels)
  const gold = await pixels()
  await field('texture-goldSize', 200); await changed('gold size', gold)
  const bigGold = await pixels()
  await field('texture-goldShine', 0); await changed('gold shine', bigGold)
  await page.locator('#texture-reset').click()
  assert.ok(delta(basePixels, await pixels()) < .01, 'Material reset exactly restores original pixels')
  await lightTab()
  await field('giraffe-environment', 0); await changed('environment', basePixels)
  await field('giraffe-environment', 100)
  await field('giraffe-exposure', 170); await changed('exposure', basePixels)
  await field('giraffe-exposure', 100)
  await field('giraffe-rotation', 90); await changed('environment rotation', basePixels)
  await page.locator('#giraffe-reset').click()
  for (let i = 0; i < 6; i++) {
    await page.locator('#giraffe-lamp').selectOption(String(i))
    const before = await pixels()
    await page.locator('#giraffe-lamp-enabled').uncheck(); await changed(`lamp ${i} enabled`, before, .001)
    await page.locator('#giraffe-lamp-enabled').check()
  }
  await page.locator('#giraffe-lamp').selectOption('0')
  const originalTexture = await getState('texture')
  for (const type of ['point', 'spot', 'area', 'sun']) {
    await page.locator('#giraffe-lamp-type').selectOption(type)
    assert.equal((await getState('giraffe-light')).lamps[0].type, type)
    const before = await pixels()
    await field('giraffe-lamp-power', 0); await changed(`${type} power`, before, .001)
    await page.locator('#giraffe-lamp-reset').click()
  }
  await page.locator('#giraffe-lamp-type').selectOption('spot')
  await field('giraffe-lamp-angle', 30); const narrow = await pixels()
  await field('giraffe-lamp-angle', 120); await changed('spot aperture', narrow)
  await field('giraffe-lamp-softness', 100); const soft = await pixels()
  await field('giraffe-lamp-softness', 0); await changed('spot softness', soft)
  await field('giraffe-lamp-rotationY', 30); const aim = await pixels()
  await field('giraffe-lamp-rotationY', -30); await changed('spot aim', aim)
  await page.locator('#giraffe-lamp-reset').click()
  await page.locator('#giraffe-lamp-type').selectOption('area')
  const area = await pixels(); await field('giraffe-lamp-width', 8); await changed('area width', area)
  await field('giraffe-lamp-height', 1); const strip = await pixels()
  await field('giraffe-lamp-rotationZ', 90); await changed('area roll', strip)
  await page.locator('#giraffe-reset').click()
  assert.deepEqual(await getState('texture'), originalTexture, 'Light does not change texture')
  await page.locator('#lighting-mode').selectOption('sculpture')
  assert.deepEqual(await getState('light'), oldLight, 'Switching rigs retains the previous controls')
  await page.locator('#lighting-mode').selectOption('giraffe')
  await field('giraffe-exposure', 123); await textureTab(); await field('texture-scale', 75)
  const savedLight = await getState('giraffe-light'), savedTexture = await getState('texture')
  await page.reload(); await page.waitForSelector('#viewer[data-ready="true"]')
  assert.equal(await page.locator('#lighting-mode').inputValue(), 'giraffe')
  assert.deepEqual(await getState('giraffe-light'), savedLight)
  assert.deepEqual(await getState('texture'), savedTexture)
  await textureTab(); await page.locator('#texture-reset').click(); await lightTab(); await page.locator('#giraffe-reset').click()
  await download('#export-image', 'exports/giraffe-bio-original-004-v2.png')
  await download('#export-model', '.review/giraffe-original.glb')
  await textureTab(); await field('texture-roughness', 25)
  await download('#export-model', '.review/giraffe-smooth.glb')
  const original = glbMaps('.review/giraffe-original.glb'), smooth = glbMaps('.review/giraffe-smooth.glb')
  assert.equal(smooth.json.materials.length, 1)
  assert.equal(smooth.json.meshes.length, 1)
  assert.ok(original.images[1] === smooth.images[1], 'Roughness does not alter albedo')
  assert.ok(original.images[0] !== smooth.images[0], 'Export carries the actual changed roughness')
  assert.ok(original.images[2] === smooth.images[2], 'Roughness does not alter normals')
  const info = smooth.json.nodes.find(n => n.extras?.texture)?.extras
  assert.equal(info.texture.roughness, 25)
  assert.equal(info.relief.recessed, 5)
  assert.equal(info.relief.raised, 0)
  await page.locator('#texture-reset').click()
  await page.screenshot({path: '.review/giraffe-texture-panel.png', fullPage: true})
  await lightTab(); await page.screenshot({path: '.review/giraffe-light-panel.png', fullPage: true})
  assert.deepEqual(errors, [])
  writeFileSync('.review/giraffe-controls-report.json', JSON.stringify({changes, maps: smooth.images.length, errors}, null, 2))
  console.log(JSON.stringify({changes, maps: smooth.images.length, errors}, null, 2))
} finally { await browser.close() }
