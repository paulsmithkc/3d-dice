import * as THREE from 'three'
import { createDie } from './die'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xe8d4b8)

// Calculate orthographic camera bounds
const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000)
camera.position.z = 5

function updateCamera() {
  // N.B. The die has a fixed diameter of 1 unit
  const viewSize = 1.5

  // Account for aspect ratio
  const aspect = window.innerWidth / window.innerHeight

  // Set camera bounds to fit the dice
  if (aspect > 1) {
    // Wider than tall - fit to height
    camera.left = -viewSize * aspect
    camera.right = viewSize * aspect
    camera.top = viewSize
    camera.bottom = -viewSize
  } else {
    // Taller than wide - fit to width
    camera.left = -viewSize
    camera.right = viewSize
    camera.top = viewSize / aspect
    camera.bottom = -viewSize / aspect
  }

  camera.updateProjectionMatrix()
}
updateCamera()

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)

const {
  diceGroup,
  wireframeMaterial,
  faceNormals,
  faceGeometries,
  numberMeshes,
} = createDie()
scene.add(diceGroup)

// Animation state
const clock = new THREE.Clock()
const spinDuration = 2 // 2 seconds
const startRotation = new THREE.Euler()
const targetRotation = new THREE.Euler()
let isSpinning = false
let highlightedFaceIndex = -1
let highlightedFaceMesh: THREE.Mesh | null = null
rollDie()

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

    updateHighlight()

    if (progress >= 1) {
      isSpinning = false
      clock.stop()
    }
  }

  renderer.render(scene, camera)
}

function updateHighlight() {
  // Find the face closest to camera alignment
  const cameraDirection = new THREE.Vector3()
  camera.getWorldDirection(cameraDirection).negate()

  // Update diceGroup matrix to ensure transformations are current
  diceGroup.updateMatrixWorld()

  // Create quaternion from current die rotation
  const quaternion = new THREE.Quaternion()
  diceGroup.getWorldQuaternion(quaternion)

  let maxDot = -Infinity
  let closestFaceIndex = -1
  for (let i = 0; i < faceNormals.length; i++) {
    // Apply current die rotation to the face normal
    const worldNormal = faceNormals[i].clone()
    worldNormal.applyQuaternion(quaternion)

    // Dot product gives alignment (1 = perfectly aligned, -1 = opposite)
    const dot = worldNormal.dot(cameraDirection)
    if (dot > maxDot) {
      maxDot = dot
      closestFaceIndex = i
    }
  }

  // Update highlighting
  if (closestFaceIndex !== highlightedFaceIndex) {
    // Remove highlight from previous face
    if (highlightedFaceIndex >= 0) {
      numberMeshes[highlightedFaceIndex].scale.setScalar(1.0)
      numberMeshes[highlightedFaceIndex].material.color.setHex(0x000000)
    }

    // Highlight new face
    if (closestFaceIndex >= 0) {
      numberMeshes[closestFaceIndex].scale.setScalar(2.0)
      numberMeshes[closestFaceIndex].material.color.setHex(0xffffff)

      if (highlightedFaceMesh) {
        highlightedFaceMesh.geometry = faceGeometries[closestFaceIndex]
      } else {
        // Create mesh to highlight the face
        const highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
          depthWrite: false, // Don't write to depth buffer to avoid z-fighting
        })
        highlightedFaceMesh = new THREE.Mesh(
          faceGeometries[closestFaceIndex],
          highlightMaterial
        )
        highlightedFaceMesh.scale.setScalar(0.99)
        highlightedFaceMesh.renderOrder = 2

        diceGroup.add(highlightedFaceMesh)
      }
    }

    highlightedFaceIndex = closestFaceIndex
  }
}

function rollDie() {
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

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateCamera()
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
    rollDie()
  }
})
