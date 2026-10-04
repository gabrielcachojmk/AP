import * as THREE from 'three'

let paperBump: THREE.CanvasTexture | null = null

/** Procedural paper grain used as bump map so no texture files are needed. */
export function getPaperBump(): THREE.CanvasTexture {
  if (paperBump) return paperBump
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    // Two layers of noise: fine fibre + soft blotches
    const fine = 200 + Math.random() * 55
    const v = fine * (0.9 + 0.1 * Math.sin(i * 0.00007))
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  paperBump = new THREE.CanvasTexture(canvas)
  paperBump.wrapS = paperBump.wrapT = THREE.RepeatWrapping
  paperBump.repeat.set(3, 2)
  return paperBump
}
