import { CanvasTexture, DoubleSide, MeshBasicMaterial } from 'three'

export const dieMaterial = new MeshBasicMaterial({
  color: 0x00cccc,
})

export const highlightMaterial = new MeshBasicMaterial({
  color: 0xffffff,
  side: DoubleSide,
  transparent: true,
  opacity: 0.6,
  depthWrite: false, // Don't write to depth buffer to avoid z-fighting
})

export function createTextMaterial(text: string) {
  const texture = createTextTexture(text)
  return new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
    transparent: true,
    opacity: 1,
    color: 0x000000,
    depthWrite: false,
  })
}

export function createTextTexture(text: string, size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d') as CanvasRenderingContext2D
  context.fillStyle = '#ffffff'
  context.font = `bold ${size * 0.6}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, size / 2, size / 2)

  // Underline numbers ending in 6 and 9 to distinguish them
  // Canvas doesn't support CSS text-decoration, so we draw it manually
  if (text.endsWith('6') || text.endsWith('9')) {
    context.strokeStyle = '#ffffff'
    context.lineWidth = 5
    const underlineY = size * 0.8
    const underlineWidth = size * 0.3 * text.length
    context.beginPath()
    context.moveTo(size / 2 - underlineWidth / 2, underlineY)
    context.lineTo(size / 2 + underlineWidth / 2, underlineY)
    context.stroke()
  }

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
