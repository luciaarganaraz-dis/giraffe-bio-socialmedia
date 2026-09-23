import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
try {
  await page.goto('http://127.0.0.1:5187')
  await page.waitForSelector('#viewer[data-ready="true"]')
  assert.equal(await page.locator('[data-finish="stone"]').getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('#viewer').getAttribute('data-carved'), 'true')
  assert.ok(Number(await page.locator('#viewer').getAttribute('data-relief')) > .12, 'Stone must have physically displaced front faces')
  await page.screenshot({ path: '.review/stone-logo.png', fullPage: true })
  await page.locator('canvas').screenshot({ path: '.review/stone-source.png' })
  for (const format of ['image', 'model']) {
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.locator(`#export-${format}`).click()])
    await download.saveAs(`exports/giraffe-bio-logo-stone.${format === 'image' ? 'png' : 'glb'}`)
  }
  const glb = readFileSync('exports/giraffe-bio-logo-stone.glb')
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim())
  assert.equal(json.nodes.filter(node => node.name?.startsWith('Letter') || node.name?.startsWith('Symbol')).length, 17)
  assert.ok(json.images.length >= 3, 'Stone export must embed its PBR maps')
  assert.ok(json.materials[0].normalTexture, 'Stone export must include the surface relief')
  assert.ok(json.materials[0].pbrMetallicRoughness.baseColorTexture)
  assert.ok(json.materials[0].pbrMetallicRoughness.metallicRoughnessTexture)
  for (const finish of ['graphite', 'copper', 'ivory', 'stone']) {
    await page.locator(`[data-finish="${finish}"]`).click()
    assert.equal(await page.locator(`[data-finish="${finish}"]`).getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('#viewer').getAttribute('data-carved'), String(finish === 'stone'))
  }
  await page.locator('[data-piece="symbol"]').click()
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '5')
  await page.screenshot({ path: '.review/stone-symbol.png', fullPage: true })
  await page.locator('#depth').fill('52')
  await page.locator('#depth').dispatchEvent('input')
  await page.waitForTimeout(100)
  assert.equal(await page.locator('#depth-value').textContent(), '52')
  await page.route('**/__stone-review*', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0"><script type="module" src="/scripts/stone-preview.ts"></script></body></html>' }))
  await page.goto('http://127.0.0.1:5187/__stone-review')
  await page.waitForSelector('body[data-ready="true"]')
  await page.locator('canvas').screenshot({ path: '.review/stone-export.png' })
  await page.goto('http://127.0.0.1:5187/__stone-review?clay')
  await page.waitForSelector('body[data-ready="true"]')
  await page.locator('canvas').screenshot({ path: '.review/stone-geometry.png' })
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ meshes: json.meshes.length, embeddedMaps: json.images.length, glbBytes: glb.length, errors }, null, 2))
} finally { await browser.close() }
