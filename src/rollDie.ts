import {
  Camera,
  Clock,
  Euler,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from 'three'
import { createDie } from './createDie'
import { highlightMaterial } from './material'

const clock = new Clock()
const spinDuration = 2 // 2 seconds
const startRotation = new Euler()
const targetRotation = new Euler()
let isSpinning = false
let highlightedFaceIndex = -1
let highlightedFaceMesh: Mesh | null = null

const die = createDie()
rollDie()

function rollDie() {
  if (isSpinning) return

  // Start spinning to random rotation
  isSpinning = true
  clock.start()

  // Save current rotation
  startRotation.x = die.group.rotation.x
  startRotation.y = die.group.rotation.y
  startRotation.z = die.group.rotation.z

  // Generate random target rotation
  const cycle = Math.PI * 2
  targetRotation.x = startRotation.x + cycle * 2 * (1 + Math.random() * 2)
  targetRotation.y = startRotation.y + cycle * 2 * (1 + Math.random() * 2)
  targetRotation.z = startRotation.z + cycle * 1 * (1 + Math.random() * 2)
}

function animateDie(camera: Camera) {
  if (isSpinning) {
    // Animate spin to random rotation
    const elapsed = clock.getElapsedTime()
    const progress = Math.min(elapsed / spinDuration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate rotations
    const lerp = MathUtils.lerp
    die.group.rotation.x = lerp(startRotation.x, targetRotation.x, eased)
    die.group.rotation.y = lerp(startRotation.y, targetRotation.y, eased)
    die.group.rotation.z = lerp(startRotation.z, targetRotation.z, eased)

    updateHighlight(camera)

    if (progress >= 1) {
      isSpinning = false
      clock.stop()
    }
  }
}

function updateHighlight(camera: Camera) {
  // Find the face closest to camera alignment
  const cameraDirection = new Vector3()
  camera.getWorldDirection(cameraDirection).negate()

  // Update diceGroup matrix to ensure transformations are current
  die.group.updateMatrixWorld()

  // Create quaternion from current die rotation
  const quaternion = new Quaternion()
  die.group.getWorldQuaternion(quaternion)

  let maxDot = -Infinity
  let closestFaceIndex = -1
  for (let i = 0; i < die.faceNormals.length; i++) {
    // Apply current die rotation to the face normal
    const worldNormal = die.faceNormals[i].clone()
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
      die.numberMeshes[highlightedFaceIndex].scale.setScalar(1.0)
      ;(
        die.numberMeshes[highlightedFaceIndex].material as MeshBasicMaterial
      ).color.setHex(0x000000)
    }

    // Highlight new face
    if (closestFaceIndex >= 0) {
      die.numberMeshes[closestFaceIndex].scale.setScalar(2.0)
      ;(
        die.numberMeshes[closestFaceIndex].material as MeshBasicMaterial
      ).color.setHex(0xffffff)

      if (highlightedFaceMesh) {
        highlightedFaceMesh.geometry = die.faceGeometries[closestFaceIndex]
      } else {
        // Create mesh to highlight the face

        highlightedFaceMesh = new Mesh(
          die.faceGeometries[closestFaceIndex],
          highlightMaterial
        )
        highlightedFaceMesh.scale.setScalar(0.99)
        highlightedFaceMesh.renderOrder = 2

        die.group.add(highlightedFaceMesh)
      }
    }

    highlightedFaceIndex = closestFaceIndex
  }
}

export { animateDie, rollDie, die }
