import type Konva from 'konva'

export function downloadDataUrl(dataUrl: string, filename = 'seance-foot.png'): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function stageToPng(stage: Konva.Stage, pixelRatio = 2): string {
  return stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
}
