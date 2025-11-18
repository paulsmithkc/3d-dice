import * as THREE from 'three'
import { createDie } from './die.js'

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

const { diceGroup, wireframeMaterial } = createDie()
scene.add(diceGroup)

function animate(time) {
  diceGroup.rotation.x = time * 0.001
  diceGroup.rotation.y = time * 0.001
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
})
