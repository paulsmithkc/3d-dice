import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { createTextMaterial } from './material'

export function createDieNumbers(geometry: BufferGeometry) {
  const positions = geometry.attributes.position
  const faceCenters = [] as Vector3[]
  const faceNormals = [] as Vector3[]
  const faceRotations = [] as Quaternion[]
  const faceGeometries = [] as BufferGeometry[]

  // N.B. IcosahedronGeometry stores vertices directly as triangles (no index buffer)
  for (let i = 0; i < positions.count; i += 3) {
    const v1 = new Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    )
    const v2 = new Vector3(
      positions.getX(i + 1),
      positions.getY(i + 1),
      positions.getZ(i + 1)
    )
    const v3 = new Vector3(
      positions.getX(i + 2),
      positions.getY(i + 2),
      positions.getZ(i + 2)
    )

    const faceGeometry = new BufferGeometry()
    const vertices = new Float32Array([...v1, ...v2, ...v3])
    faceGeometry.setAttribute('position', new BufferAttribute(vertices, 3))
    faceGeometry.computeVertexNormals()
    faceGeometries.push(faceGeometry)

    const center = new Vector3()
    center.add(v1).add(v2).add(v3).divideScalar(3)
    faceCenters.push(center)
    const edge1 = new Vector3().subVectors(v2, v1).normalize()
    const edge2 = new Vector3().subVectors(v3, v1).normalize()
    const normal = new Vector3().crossVectors(edge1, edge2).normalize()
    faceNormals.push(normal)

    // Build a basis for the plane:
    // Z = outward from face
    // X = aligned with edge
    // Y = Z × X (right-hand rule)
    const matrix = new Matrix4().makeBasis(
      edge1,
      new Vector3().crossVectors(normal, edge1).normalize(),
      normal
    )

    // Build quaternion from basis matrix
    faceRotations.push(new Quaternion().setFromRotationMatrix(matrix))
  }

  const numberGroup = new Group()
  const numberMeshes = [] as Mesh[]
  for (let i = 0; i < faceCenters.length; i++) {
    const numberMaterial = createTextMaterial((i + 1).toFixed(0))
    const numberGeometry = new PlaneGeometry(0.3, 0.3)
    const numberMesh = new Mesh(numberGeometry, numberMaterial)

    numberMesh.position.copy(faceCenters[i]).multiplyScalar(1.02)
    numberMesh.rotation.setFromQuaternion(faceRotations[i])
    numberMesh.renderOrder = 1

    numberGroup.add(numberMesh)
    numberMeshes.push(numberMesh)
  }

  return {
    faceCenters,
    faceNormals,
    faceRotations,
    faceGeometries,
    numberMeshes,
    numberGroup,
  }
}
