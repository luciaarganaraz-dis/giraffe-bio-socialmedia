import { Box3, Matrix4, Mesh, type Object3D } from 'three'

/** Frame the natural piece; user scale and location must survive resize/export. */
export function framingBounds(model: Object3D, pivot: Object3D) {
  const bounds = new Box3()
  pivot.updateMatrix()
  function visit(object: Object3D, parent: Matrix4) {
    object.updateMatrix()
    const matrix = parent.clone().multiply(object.matrix)
    if (object instanceof Mesh) {
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
      bounds.union(object.geometry.boundingBox!.clone().applyMatrix4(matrix))
    }
    object.children.forEach(child => visit(child, matrix))
  }
  visit(model, pivot.matrix)
  return bounds
}
