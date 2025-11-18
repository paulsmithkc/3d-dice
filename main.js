import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xe8d4b8)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)

const geometry = new THREE.IcosahedronGeometry()
const solidMaterial = new THREE.MeshBasicMaterial({
  color: 0xcc0000,
})

const wireframeBaseGeometry = new THREE.WireframeGeometry(geometry)
const wireframePositions = []
const wireframeBasePositions = wireframeBaseGeometry.attributes.position
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
  linewidth: 3,
  side: THREE.DoubleSide,
})
wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)

const solidMesh = new THREE.Mesh(geometry, solidMaterial)
const wireframeMesh = new Line2(wireframeGeometry, wireframeMaterial)
scene.add(solidMesh)
scene.add(wireframeMesh)

function animate(time) {
  solidMesh.rotation.x = time * 0.001
  solidMesh.rotation.y = time * 0.001
  wireframeMesh.rotation.x = time * 0.001
  wireframeMesh.rotation.y = time * 0.001
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
})
