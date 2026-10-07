/** The longest side of a picture the site sends, in pixels. The server makes the photo with 600 x 800. */
export const maxPictureSide = 1600

/** A picture's size after shrinking it to fit a square of `maxSide`, keeping its shape. A smaller picture keeps its size. */
export function fitWithin(source: { width: number; height: number }, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  return { width: Math.round(source.width * scale), height: Math.round(source.height * scale) }
}

/**
 * Makes a chosen picture ready to send: turned upright, shrunk to at most `maxPictureSide` a side and saved as
 * JPEG. So a photo straight from a phone's camera becomes a small file. The server cuts it and makes the photo
 * and the small photo. Rejects when the file is not a picture the browser can read.
 */
export async function shrinkPicture(file: Blob): Promise<Blob> {
  const picture = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(picture, maxPictureSide)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')!
    // JPEG has no transparency: without this, the see-through parts of a PNG would turn black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.imageSmoothingQuality = 'high'
    context.drawImage(picture, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The canvas gave no image'))), 'image/jpeg', 0.9),
    )
  } finally {
    picture.close()
  }
}
