import {
  Camera,
  Clock,
  Color,
  DoubleSide,
  Euler,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Quaternion,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { createDie } from './createDie'

const clock = new Clock()
const spinDuration = 2 // 2 seconds
const startRotation = new Euler()
const targetRotation = new Euler()
let isSpinning = false
let highlightedFaceIndex = -1
let highlightedFaceMesh: Mesh | null = null

const { diceGroup, faceNormals, faceGeometries, numberMeshes } = createDie()
rollDie()

function rollDie() {
  if (isSpinning) return

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

function animateDie(camera: Camera) {
  if (isSpinning) {
    // Animate spin to random rotation
    const elapsed = clock.getElapsedTime()
    const progress = Math.min(elapsed / spinDuration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate rotations
    const lerp = MathUtils.lerp
    diceGroup.rotation.x = lerp(startRotation.x, targetRotation.x, eased)
    diceGroup.rotation.y = lerp(startRotation.y, targetRotation.y, eased)
    diceGroup.rotation.z = lerp(startRotation.z, targetRotation.z, eased)

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
  diceGroup.updateMatrixWorld()

  // Create quaternion from current die rotation
  const quaternion = new Quaternion()
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
      ;(
        numberMeshes[highlightedFaceIndex].material as MeshBasicMaterial
      ).color.setHex(0x000000)
    }

    // Highlight new face
    if (closestFaceIndex >= 0) {
      numberMeshes[closestFaceIndex].scale.setScalar(2.0)
      ;(
        numberMeshes[closestFaceIndex].material as MeshBasicMaterial
      ).color.setHex(0xffffff)

      if (highlightedFaceMesh) {
        highlightedFaceMesh.geometry = faceGeometries[closestFaceIndex]
      } else {
        // Create mesh to highlight the face
        const highlightMaterial = new MeshBasicMaterial({
          color: 0xffffff,
          side: DoubleSide,
          transparent: true,
          opacity: 0.4,
          depthWrite: false, // Don't write to depth buffer to avoid z-fighting
        })
        highlightedFaceMesh = new Mesh(
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

export { rollDie, animateDie, diceGroup }
