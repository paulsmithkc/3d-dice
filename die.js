import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export function createDie() {
  // create the solid mesh of the die
  const geometry = new THREE.IcosahedronGeometry()
  const solidMaterial = new THREE.MeshBasicMaterial({
    color: 0xcc0000,
  })
  const solidMesh = new THREE.Mesh(geometry, solidMaterial)
  solidMesh.scale.setScalar(0.98) // shrink the solid mesh so that it doesn't obscure with the wireframe

  // Create the wireframe for the die edges
  const { wireframeMesh, wireframeMaterial } = createWireframe(geometry)

  // Create the numbers for the die faces
  const {
    faceCenters,
    faceNormals,
    faceGeometries,
    numberMeshes,
    numberGroup,
  } = createNumbers(geometry)

  // Put all the components into a group
  const diceGroup = new THREE.Group()
  diceGroup.add(solidMesh)
  diceGroup.add(wireframeMesh)
  diceGroup.add(numberGroup)

  return {
    diceGroup,
    wireframeMaterial,
    faceCenters,
    faceNormals,
    faceGeometries,
    numberMeshes,
  }
}

function createWireframe(geometry) {
  const wireframeBaseGeometry = new THREE.WireframeGeometry(geometry)
  const wireframeBasePositions = wireframeBaseGeometry.attributes.position
  const wireframePositions = []
  for (let i = 0; i < wireframeBasePositions.count; i++) {
    wireframePositions.push(
      wireframeBasePositions.getX(i),
      wireframeBasePositions.getY(i),
      wireframeBasePositions.getZ(i)
    )
  }
  const wireframeGeometry = new LineGeometry()
  wireframeGeometry.setPositions(wireframePositions)
  const wireframeMaterial = new LineMaterial({
    color: 0x000000,
    linewidth: 5,
    writeDepth: false,
  })
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
  const wireframeMesh = new Line2(wireframeGeometry, wireframeMaterial)
  wireframeMesh.renderOrder = 3
  return { wireframeGeometry, wireframeMesh, wireframeMaterial }
}

function createNumbers(geometry) {
  const positions = geometry.attributes.position
  const faceCenters = []
  const faceNormals = []
  const faceGeometries = []

  // IcosahedronGeometry stores vertices directly as triangles (no index buffer)
  for (let i = 0; i < positions.count; i += 3) {
    const v1 = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    )
    const v2 = new THREE.Vector3(
      positions.getX(i + 1),
      positions.getY(i + 1),
      positions.getZ(i + 1)
    )
    const v3 = new THREE.Vector3(
      positions.getX(i + 2),
      positions.getY(i + 2),
      positions.getZ(i + 2)
    )

    const faceGeometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([...v1, ...v2, ...v3])
    faceGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3)
    )
    faceGeometry.computeVertexNormals()
    faceGeometries.push(faceGeometry)

    const center = new THREE.Vector3()
    center.add(v1).add(v2).add(v3).divideScalar(3)
    faceCenters.push(center)
    const edge1 = new THREE.Vector3().subVectors(v2, v1)
    const edge2 = new THREE.Vector3().subVectors(v3, v1)
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()
    faceNormals.push(normal)
  }

  const numberGroup = new THREE.Group()
  const numberMeshes = []
  for (let i = 0; i < faceCenters.length; i++) {
    const numberTexture = createTextTexture((i + 1).toFixed(0))
    const numberMaterial = new THREE.MeshBasicMaterial({
      map: numberTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
      color: 0x000000,
      depthWrite: false,
    })
    const numberGeometry = new THREE.PlaneGeometry(0.3, 0.3)
    const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial)

    numberMesh.position.copy(faceCenters[i].clone().multiplyScalar(1.02))
    numberMesh.lookAt(faceCenters[i].clone().add(faceNormals[i]))
    numberMesh.renderOrder = 1

    numberGroup.add(numberMesh)
    numberMeshes.push(numberMesh)
  }

  return { faceCenters, faceNormals, faceGeometries, numberMeshes, numberGroup }
}

function createTextTexture(text, size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.font = `bold ${size * 0.6}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, size / 2, size / 2)

  // Underline numbers end with 6 and 9 to distinguish them
  // Canvas doesn't support CSS text-decoration, so we draw it manually
  if (text.endsWith('6') || text.endsWith('9')) {
    context.strokeStyle = '#ffffff'
    context.lineWidth = 5
    const underlineY = size * 0.8
    const underlineWidth = size * 0.3 * text.length
    context.beginPath()
    context.moveTo(size / 2 - underlineWidth / 2, underlineY)
    context.lineTo(size / 2 + underlineWidth / 2, underlineY)
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
