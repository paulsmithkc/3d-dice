import {
  Color,
  OrthographicCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { wireframeMaterial } from './wireframe'
import { animateDie, rollDie, die } from './rollDie'

const scene = new Scene()
scene.background = new Color(0xe8d4b8)
scene.add(die.group)

const camera = new OrthographicCamera(-5, 5, 5, -5, 0.1, 1000)
camera.position.z = 5

function updateCamera() {
  // N.B. The die has a fixed diameter of 1 unit
  const viewSize = 1.5
  const aspect = window.innerWidth / window.innerHeight

  // Set camera bounds to fit the dice
  if (aspect > 1) {
    // Landscape - fit to height
    camera.left = -viewSize * aspect
    camera.right = viewSize * aspect
    camera.top = viewSize
    camera.bottom = -viewSize
  } else {
    // Portrait- fit to width
    camera.left = -viewSize
    camera.right = viewSize
    camera.top = viewSize / aspect
    camera.bottom = -viewSize / aspect
  }

  camera.updateProjectionMatrix()
}
updateCamera()

const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(() => {
  animateDie(camera)
  renderer.render(scene, camera)
})
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateCamera()
  wireframeMaterial.resolution.set(window.innerWidth, window.innerHeight)
})

const mouse = new Vector2()
const raycaster = new Raycaster()

window.addEventListener('click', (event) => {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  // Check if the user clicked on the die
  const intersects = raycaster.intersectObjects(die.group.children, true)
  if (intersects.length > 0) {
    rollDie()
  }
})
