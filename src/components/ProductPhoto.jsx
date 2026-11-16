import { useState } from 'react'

export default function ProductPhoto({ product, src, alt, size = 'md' }) {
  const url = src || product?.image
  const label = alt || product?.name || 'Product'
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className={`prod-photo fallback ${size}`} aria-hidden>
        {product?.emoji || '📦'}
      </div>
    )
  }

  return (
    <img
      className={`prod-photo ${size}`}
      src={url}
      alt={label}
      onError={() => setFailed(true)}
    />
  )
}

export function fileToImageDataUrl(file, max = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
