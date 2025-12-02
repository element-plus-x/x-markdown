// 复制到剪贴板
export async function copyToClipboard(content: string): Promise<boolean> {
  if (!content) return false

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content)
      return true
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      return true
    }
  } catch (err) {
    console.error('复制失败: ', err)
    return false
  }
}

// SVG下载功能
export function downloadSvgAsPng(svg: string): void {
  if (!svg) return

  try {
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    const img = new Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        if (!ctx) return

        const scale = 2
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 绘制SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // 下载
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

        try {
          canvas.toBlob(
            (blob) => {
              if (!blob) return
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `mermaid-diagram-${timestamp}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            },
            'image/png',
            0.95,
          )
        } catch (toBlobError) {
          console.error('toBlobError:', toBlobError)
          // 降级方案
          try {
            const dataUrl = canvas.toDataURL('image/png', 0.95)
            const link = document.createElement('a')
            link.href = dataUrl
            link.download = `mermaid-diagram-${timestamp}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          } catch (dataUrlError) {
            console.error('dataUrlError:', dataUrlError)
          }
        }
      } catch (canvasError) {
        console.error('Canvas操作失败:', canvasError)
      }
    }

    img.onerror = (error) => {
      console.error('Image load error:', error)
    }

    img.src = svgDataUrl
  } catch (error) {
    console.error('下载失败:', error)
  }
}
