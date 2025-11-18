import { BufferGeometry, WireframeGeometry } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

export const wireframeMaterial = new LineMaterial({
  color: 0x000000,
  linewidth: 5,
})

export function createWireframe(geometry: BufferGeometry) {
  const wireframeBaseGeometry = new WireframeGeometry(geometry)
  const wireframeBasePositions = wireframeBaseGeometry.attributes.position
  const wireframePositions = [] as number[]
  for (let i = 0; i < wireframeBasePositions.count; i++) {
    wireframePositions.push(
      wireframeBasePositions.getX(i),
      wireframeBasePositions.getY(i),
      wireframeBasePositions.getZ(i)
    )
  }
  const wireframeGeometry = new LineGeometry()
  wireframeGeometry.setPositions(wireframePositions)
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
  const wireframeMesh = new Line2(wireframeGeometry, wireframeMaterial)
  wireframeMesh.renderOrder = 3
  return { wireframeGeometry, wireframeMesh, wireframeMaterial }
}
