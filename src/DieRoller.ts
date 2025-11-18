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

export class DieRoller {
  private die: ReturnType<typeof createDie>
  private clock: Clock
  private spinDuration: number
  private startRotation: Euler
  private targetRotation: Euler
  private isSpinning: boolean
  private highlightedFaceIndex: number
  private highlightedFaceMesh: Mesh | null

  constructor() {
    this.die = createDie()
    this.clock = new Clock()
    this.spinDuration = 2 // 2 seconds
    this.startRotation = new Euler()
    this.targetRotation = new Euler()
    this.isSpinning = false
    this.highlightedFaceIndex = -1
    this.highlightedFaceMesh = null
  }

  public getGroup() {
    return this.die.group
  }

  public roll() {
    if (this.isSpinning) return

    this.isSpinning = true
    this.clock.start()

    // Save current rotation
    this.startRotation.x = this.die.group.rotation.x
    this.startRotation.y = this.die.group.rotation.y
    this.startRotation.z = this.die.group.rotation.z

    // Generate random target rotation
    const cycle = Math.PI * 2
    this.targetRotation.x =
      this.startRotation.x + cycle * 2 * (1 + Math.random() * 2)
    this.targetRotation.y =
      this.startRotation.y + cycle * 2 * (1 + Math.random() * 2)
    this.targetRotation.z =
      this.startRotation.z + cycle * 1 * (1 + Math.random() * 2)
  }

  public animate(camera: Camera) {
    if (!this.isSpinning) return

    // Animate spin to random rotation
    const elapsed = this.clock.getElapsedTime()
    const progress = Math.min(elapsed / this.spinDuration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    // Interpolate rotations
    const lerp = MathUtils.lerp
    this.die.group.rotation.x = lerp(
      this.startRotation.x,
      this.targetRotation.x,
      eased
    )
    this.die.group.rotation.y = lerp(
      this.startRotation.y,
      this.targetRotation.y,
      eased
    )
    this.die.group.rotation.z = lerp(
      this.startRotation.z,
      this.targetRotation.z,
      eased
    )

    this.updateHighlight(camera)

    if (progress >= 1) {
      this.isSpinning = false
      this.clock.stop()
    }
  }

  private updateHighlight(camera: Camera) {
    // Find the face closest to camera alignment
    const cameraDirection = new Vector3()
    camera.getWorldDirection(cameraDirection).negate()

    // Update diceGroup matrix to ensure transformations are current
    this.die.group.updateMatrixWorld()

    // Create quaternion from current die rotation
    const quaternion = new Quaternion()
    this.die.group.getWorldQuaternion(quaternion)

    let maxDot = -Infinity
    let closestFaceIndex = -1
    for (let i = 0; i < this.die.faceNormals.length; i++) {
      // Apply current die rotation to the face normal
      const worldNormal = this.die.faceNormals[i].clone()
      worldNormal.applyQuaternion(quaternion)

      // Dot product gives alignment (1 = perfectly aligned, -1 = opposite)
      const dot = worldNormal.dot(cameraDirection)
      if (dot > maxDot) {
        maxDot = dot
        closestFaceIndex = i
      }
    }

    // Update highlighting
    if (closestFaceIndex !== this.highlightedFaceIndex) {
      // Remove highlight from previous face
      if (this.highlightedFaceIndex >= 0) {
        this.die.numberMeshes[this.highlightedFaceIndex].scale.setScalar(1.0)
        ;(
          this.die.numberMeshes[this.highlightedFaceIndex]
            .material as MeshBasicMaterial
        ).color.setHex(0x000000)
      }

      // Highlight new face
      if (closestFaceIndex >= 0) {
        this.die.numberMeshes[closestFaceIndex].scale.setScalar(2.0)
        ;(
          this.die.numberMeshes[closestFaceIndex].material as MeshBasicMaterial
        ).color.setHex(0xffffff)

        if (this.highlightedFaceMesh) {
          this.highlightedFaceMesh.geometry =
            this.die.faceGeometries[closestFaceIndex]
        } else {
          // Create mesh to highlight the face

          this.highlightedFaceMesh = new Mesh(
            this.die.faceGeometries[closestFaceIndex],
            highlightMaterial
          )
          this.highlightedFaceMesh.scale.setScalar(0.99)
          this.highlightedFaceMesh.renderOrder = 2

          this.die.group.add(this.highlightedFaceMesh)
        }
      }

      this.highlightedFaceIndex = closestFaceIndex
    }
  }
}
