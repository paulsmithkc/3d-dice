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
  solidMesh.scale.setScalar(0.99) // shrink the solid mesh so that it doesn't obscure with the wireframe

  // Create the wireframe for the die edges
  const { wireframeMesh, wireframeMaterial } = createWireframe(geometry)

  // Create the numbers for the die faces
  const numbers = createNumbers(geometry)

  // Put all the components into a group
  const diceGroup = new THREE.Group()
  diceGroup.add(solidMesh)
  diceGroup.add(wireframeMesh)
  diceGroup.add(numbers)
  return { diceGroup, wireframeMaterial }
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
  })
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
  const wireframeMesh = new Line2(wireframeGeometry, wireframeMaterial)
  return { wireframeGeometry, wireframeMesh, wireframeMaterial }
}

function createNumbers(geometry) {
  const positions = geometry.attributes.position
  const faceCenters = []
  const faceNormals = []
  for (let i = 0; i < positions.count; i += 3) {
    // assume the geometry is stored as triangles
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
    const center = new THREE.Vector3()
    center.add(v1).add(v2).add(v3).divideScalar(3)
    faceCenters.push(center)
    const edge1 = new THREE.Vector3().subVectors(v2, v1)
    const edge2 = new THREE.Vector3().subVectors(v3, v1)
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize()
    faceNormals.push(normal)
  }

  const numberGroup = new THREE.Group()
  for (let i = 0; i < faceCenters.length; i++) {
    const texture = createTextTexture((i + 1).toString())
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.copy(faceCenters[i])
    sprite.position.multiplyScalar(1.02) // Slightly outside the mesh
    sprite.scale.setScalar(0.3)
    numberGroup.add(sprite)
  }

  return numberGroup
}

function createTextTexture(text, size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.fillStyle = '#000000'
  context.font = `bold ${size * 0.6}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
