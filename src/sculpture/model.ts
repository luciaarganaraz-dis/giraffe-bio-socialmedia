import { Box3, Group, Mesh, Vector3, type Material } from 'three'
import { createLogo, type readLogo } from '../logo'
import { sculptureRock } from './rock'

export function createSculpture(shapes: ReturnType<typeof readLogo>, depth: number,
  face: Material[], rockMaterial: Material, ivory: Material, carved: boolean) {
  const sculpture = new Group()
  sculpture.name = 'Giraffe bio. — escultura mineral'
  const rock = new Mesh(sculptureRock(), rockMaterial)
  rock.name = 'Monolito de piedra'
  rock.userData.bakeSurface = 'body'
  sculpture.add(rock)
  const front = createLogo(shapes, 'symbol', (35 + depth * .4) / 1.43, face, carved)
  front.scale.setScalar(1.43)
  front.position.set(-.05, .1, .8 + new Box3().setFromObject(front).getSize(new Vector3()).z / 2)
  const side = createLogo(shapes, 'symbol', (60 + depth * .18) / 1.02, [ivory, ivory])
  side.scale.setScalar(1.02)
  side.rotation.y = Math.PI / 2
  side.position.set(1 + new Box3().setFromObject(side).getSize(new Vector3()).x / 2, -.45, -.05)
  for (const [part, label] of [[front, 'Frente'], [side, 'Lateral']] as const) {
    part.updateMatrix()
    for (const child of [...part.children]) {
      child.applyMatrix4(part.matrix)
      child.name = `${label} — ${child.name}`
      if (part === front && carved) child.userData.bakeSurface = 'symbol'
      sculpture.add(child)
    }
  }
  const center = new Box3().setFromObject(sculpture).getCenter(new Vector3())
  sculpture.children.forEach(child => {
    child.position.sub(center)
    child.castShadow = child.receiveShadow = true
  })
  sculpture.userData = { source: 'giraffe-bio.svg', piece: 'sculpture', depth, carved: true }
  return sculpture
}
