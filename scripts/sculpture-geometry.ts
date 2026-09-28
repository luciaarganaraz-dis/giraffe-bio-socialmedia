import { Box3, Mesh, MeshStandardMaterial, Raycaster, Vector3 } from 'three'
import { createSculpture } from '../src/sculpture/model'
import { sculptureRock } from '../src/sculpture/rock'
import { readLogo, disposeLogo } from '../src/logo'

const shapes = readLogo(await (await fetch('/giraffe-bio.svg')).text())
const material = new MeshStandardMaterial()
const original = new Mesh(sculptureRock(), material)
original.updateMatrixWorld()
const ray = new Raycaster()
const reports = []
for (const depth of [24, 78, 130]) {
  const start = performance.now()
  const model = createSculpture(shapes, depth, material)
  const relief = model.userData.relief
  const center = new Vector3().fromArray(relief.center)
  model.updateMatrixWorld(true)
  const probes = relief.probes.map((probe: { x: number; y: number; recessed: boolean }) => {
    const origin = new Vector3(probe.x, probe.y, 5)
    ray.set(origin, new Vector3(0, 0, -1))
    const before = ray.intersectObject(original)[0]?.point.z
    ray.set(origin.sub(center), new Vector3(0, 0, -1))
    const after = ray.intersectObject(model)[0]?.point.z
    return { ...probe, before, after: after + center.z, change: after + center.z - before }
  })
  reports.push({ depth, ms: performance.now() - start, probes,
    bounds: new Box3().setFromObject(model).getSize(new Vector3()).toArray(), meshes: model.children.length })
  disposeLogo(model)
}
original.geometry.dispose(); material.dispose()
document.body.textContent = JSON.stringify(reports)
document.body.dataset.ready = 'true'
