import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const url = process.argv[2] || 'http://127.0.0.1:5187'
mkdirSync('.review', { recursive: true })
mkdirSync('exports', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = []
const failures = []
try {
  for (const [name, width, height, reduced] of [
    ['desktop', 1440, 1000, false], ['tablet', 768, 1024, false],
    ['mobile', 390, 844, false], ['reduced-motion', 1440, 1000, true],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: name === 'mobile', deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on('pageerror', error => failures.push(`${name}: ${error.message}`))
    page.on('console', message => { if (message.type() === 'error') failures.push(`${name}: ${message.text()}`) })
    await page.goto(url)
    await page.waitForSelector('#viewer[data-ready="true"]')
    await page.waitForTimeout(350)
    const metric = await page.evaluate(() => ({
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      meshes: Number(document.querySelector('#viewer').dataset.meshes),
      frames: Number(document.querySelector('#viewer').dataset.frames),
      canvas: document.querySelectorAll('canvas').length,
      motion: document.querySelector('#motion').getAttribute('aria-pressed'),
    }))
    assert.equal(metric.scrollWidth, width, `${name}: horizontal overflow`)
    assert.equal(metric.canvas, 1)
    assert.ok(metric.meshes >= 15)
    if (reduced) {
      assert.equal(metric.motion, 'false')
      await page.waitForTimeout(250)
      const frames = Number(await page.locator('#viewer').getAttribute('data-frames'))
      assert.equal(frames, metric.frames, 'Reduced motion keeps painting frames')
    } else {
      assert.equal(metric.motion, 'true')
      await page.locator('#motion').click()
    }
    await page.locator('#reset').click()
    await page.screenshot({ path: `.review/${name}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Isotipo', exact: true }).click()
    assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '5')
    await page.getByRole('button', { name: 'Cobre', exact: true }).click()
    await page.screenshot({ path: `.review/${name}-symbol.png`, fullPage: true })
    if (name === 'desktop') {
      await page.locator('#viewer').focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('+')
      await page.locator('#reset').click()
      const [symbol] = await Promise.all([page.waitForEvent('download'), page.locator('#export-model').click()])
      await symbol.saveAs('exports/giraffe-bio-symbol-copper.glb')
      await page.getByRole('button', { name: 'Logo completo', exact: true }).click()
      await page.getByRole('button', { name: 'Grafito', exact: true }).click()
      const [model] = await Promise.all([page.waitForEvent('download'), page.locator('#export-model').click()])
      await model.saveAs('exports/giraffe-bio-logo-graphite.glb')
      const [png] = await Promise.all([page.waitForEvent('download'), page.locator('#export-image').click()])
      await png.saveAs('exports/giraffe-bio-logo-graphite.png')
      await page.locator('#transparent').uncheck()
      const [solid] = await Promise.all([page.waitForEvent('download'), page.locator('#export-image').click()])
      await solid.saveAs('.review/opaque.png')
      for (const w of [768, 390, 1440]) {
        await page.setViewportSize({ width: w, height: 1000 })
        assert.equal(await page.locator('canvas').count(), 1)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), w)
      }
      await page.screenshot({ path: '.review/resized.png', fullPage: true })
    }
    report.push({ name, ...metric })
    await context.close()
  }
  const glb = readFileSync('exports/giraffe-bio-logo-graphite.glb')
  assert.equal(glb.toString('utf8', 0, 4), 'glTF')
  assert.equal(glb.readUInt32LE(4), 2)
  assert.equal(glb.readUInt32LE(8), glb.length)
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)).trim())
  assert.ok(json.meshes.length >= 15)
  assert.ok(json.accessors.some(accessor => accessor.type === 'VEC3' && accessor.max?.[2] > accessor.min?.[2]))
  const png = readFileSync('exports/giraffe-bio-logo-graphite.png')
  assert.equal(png.readUInt32BE(16), 3000)
  assert.equal(png.readUInt32BE(20), 1500)
  assert.equal(png[25], 6, 'Export must contain alpha channel')
  assert.deepEqual(failures, [])
  writeFileSync('.review/results.json', JSON.stringify({ viewports: report, glbBytes: glb.length, meshes: json.meshes.length, errors: failures }, null, 2))
  console.log(JSON.stringify({ viewports: report, glbBytes: glb.length, meshes: json.meshes.length, errors: failures }, null, 2))
} finally { await browser.close() }
