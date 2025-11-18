import { Group, IcosahedronGeometry, Mesh } from 'three'
import { createWireframe } from './wireframe'
import { dieMaterial } from './material'
import { createDieNumbers } from './createDieNumbers'

export function createDie() {
  // create the solid mesh of the die
  const geometry = new IcosahedronGeometry()
  const mesh = new Mesh(geometry, dieMaterial)
  mesh.scale.setScalar(0.99) // shrink the solid mesh so that it doesn't obscure with the wireframe

  // Create the wireframe for the die edges
  const { wireframeMesh } = createWireframe(geometry)

  // Create the numbers for the die faces
  const numbers = createDieNumbers(geometry)

  // Put all the components into a group
  const group = new Group()
  group.add(mesh)
  group.add(wireframeMesh)
  group.add(numbers.numberGroup)

  return {
    group,
    geometry,
    mesh,
    wireframeMesh,
    ...numbers,
  }
}
