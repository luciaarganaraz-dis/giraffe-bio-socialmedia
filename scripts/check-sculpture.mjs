import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

mkdirSync('.review', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
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
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '11')
  await page.screenshot({ path: '.review/sculpture-studio.png', fullPage: true })
  await page.locator('canvas').screenshot({ path: '.review/sculpture-source.png' })
  await download('image', 'exports/giraffe-bio-escultura.png')
  const png = readFileSync('exports/giraffe-bio-escultura.png')
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [2160, 2700])
  await download('model', 'exports/giraffe-bio-escultura.glb')
  const json = glbJson('exports/giraffe-bio-escultura.glb')
  assert.equal(json.meshes.length, 11)
  assert.equal(json.images.length, 3)
  assert.ok(json.nodes.some(node => node.name === 'Monolito_de_piedra' || node.name === 'Monolito de piedra'))
  assert.equal(json.nodes.filter(node => node.name?.startsWith('Frente')).length, 5)
  assert.equal(json.nodes.filter(node => node.name?.startsWith('Lateral')).length, 5)
  await page.locator('#light-position').press('ArrowRight')
  assert.equal(JSON.parse(await page.locator('#viewer').getAttribute('data-light')).x, -35)
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
  await page.locator('button[data-finish="stone"]').click()
  await download('model', '.review/sculpture-stone.glb')
  assert.equal(glbJson('.review/sculpture-stone.glb').images.length, 6)
  await page.locator('button[data-piece="logo"]').click()
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '17')
  await page.locator('button[data-piece="symbol"]').click()
  assert.equal(await page.locator('#viewer').getAttribute('data-meshes'), '5')
  await page.route('**/__sculpture-review', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0"><script type="module" src="/scripts/sculpture-preview.ts"></script></body></html>' }))
  await page.goto('http://127.0.0.1:5187/__sculpture-review')
  await page.waitForSelector('body[data-ready="true"]')
  await page.locator('canvas').screenshot({ path: '.review/sculpture-export.png' })
  assert.deepEqual(errors, [])
  const report = { meshes: json.meshes.length, maps: json.images.length, portrait: [2160, 2700], transparentAlpha: alpha, glbBytes: readFileSync('exports/giraffe-bio-escultura.glb').length, errors }
  writeFileSync('.review/sculpture-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
