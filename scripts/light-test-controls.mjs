/** Open the relevant lamp before editing controls inside the scrolling panel. */
export async function revealLightControl(page, id) {
  const control = page.locator(`#light-${id}`)
  const section = await control.evaluate(node => node.closest('.light-section')?.id)
  if (section) {
    const detail = page.locator(`#${section}`)
    if (await detail.getAttribute('open') === null) {
      await page.locator(`[data-light-section="${section.replace('light-section-', '')}"]`).click()
    }
  }
  return control
}
export async function setLightSlider(page, id, value) {
  const control = await revealLightControl(page, id)
  await control.fill(String(value))
  await control.dispatchEvent('input')
}
