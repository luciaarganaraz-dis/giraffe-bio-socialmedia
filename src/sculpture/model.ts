import { Box3, Group, Mesh, Vector3, type Material } from 'three'
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { type readLogo } from '../logo'
import { sculptureRock } from './rock'
import { reliefTools } from './relief'

/** One connected stone: remove the recessed lobes and unite the raised ones. */
export function createSculpture(shapes: ReturnType<typeof readLogo>, depth: number, material: Material) {
  const sculpture = new Group()
  sculpture.name = 'Giraffe bio. — escultura mineral'
  const geometry = sculptureRock()
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * .5)
  const tools = reliefTools(shapes, depth, material)
  const evaluator = new Evaluator()
  evaluator.useGroups = false
  let solid = new Brush(geometry, material)
  solid.updateMatrixWorld()
  for (const [parts, operation] of [[tools.recessed, SUBTRACTION], [tools.raised, ADDITION]] as const) {
    const combined = mergeGeometries(parts)!
    const tool = new Brush(combined, material)
    tool.updateMatrixWorld()
    const next = evaluator.evaluate(solid, tool, operation)
    solid.disposeCacheData()
    solid.geometry.dispose()
    tool.disposeCacheData()
    combined.dispose()
    parts.forEach(part => part.dispose())
    solid = next
    solid.updateMatrixWorld()
  }
  // Discard acceleration data; only the final geometry belongs to the artwork.
  solid.disposeCacheData()
  solid.geometry.userData = { atlasMode: 'existing', sculpted: true }
  const rock = new Mesh(solid.geometry, material)
  rock.name = 'Monolito de piedra — isologo tallado'
  rock.castShadow = rock.receiveShadow = true
  rock.userData.bakeSurface = 'body'
  const center = new Box3().setFromObject(rock).getCenter(new Vector3())
  rock.position.sub(center)
  sculpture.add(rock)
  sculpture.userData = { source: 'giraffe-bio.svg', piece: 'sculpture', depth, carved: true,
    relief: { recessed: tools.recessed.length, raised: tools.raised.length, probes: tools.probes, center: center.toArray() } }
  return sculpture
}
