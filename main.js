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

// Animation state
const clock = new THREE.Clock()
let isSpinning = false
// let spinStartTime = 0
let spinDuration = 2 // 2 seconds
let startRotation = new THREE.Euler()
let targetRotation = new THREE.Euler()

function animate() {
  if (isSpinning) {
    // Animate spin to random rotation
    const elapsed = clock.getElapsedTime()
    const progress = Math.min(elapsed / spinDuration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate rotations
    const lerp = THREE.MathUtils.lerp
    diceGroup.rotation.x = lerp(startRotation.x, targetRotation.x, eased)
    diceGroup.rotation.y = lerp(startRotation.y, targetRotation.y, eased)
    diceGroup.rotation.z = lerp(startRotation.z, targetRotation.z, eased)

    if (progress >= 1) {
      isSpinning = false
      clock.stop()
    }
  }

  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
})

const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

window.addEventListener('click', (event) => {
  if (isSpinning) return

  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  // Check if the user clicked on the die
  const intersects = raycaster.intersectObjects(diceGroup.children, true)
  if (intersects.length > 0) {
    // Start spinning to random rotation
    isSpinning = true
    clock.start()

    // Save current rotation
    startRotation.x = diceGroup.rotation.x
    startRotation.y = diceGroup.rotation.y
    startRotation.z = diceGroup.rotation.z

    // Generate random target rotation
    const cycle = Math.PI * 2
    targetRotation.x = startRotation.x + cycle * 2 * (1 + Math.random() * 2)
    targetRotation.y = startRotation.y + cycle * 2 * (1 + Math.random() * 2)
    targetRotation.z = startRotation.z + cycle * 1 * (1 + Math.random() * 2)
  }
})
