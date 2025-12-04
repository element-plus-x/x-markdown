import type { Ref } from 'vue'
import { throttle } from 'lodash-es'
import { computed, ref, watch, onUnmounted } from 'vue'
import type { MermaidZoomControls, UseMermaidZoomOptions } from '../components/Mermaid/types'

/**
 * 将 SVG 转换为 PNG 并下载
 * @param svg - SVG 字符串内容
 */
export function downloadSvgAsPng(svg: string): void {
  // SVG 内容为空时直接返回
  if (!svg) return

  try {
    // 将 SVG 转换为 Data URL
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    const img = new Image()

    // 图片加载完成后进行绘制和下载
    img.onload = () => {
      try {
        // 创建 Canvas 元素
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        if (!ctx) return

        // 使用 2x 缩放以获得更清晰的图像
        const scale = 2
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        // 启用图像平滑以提高质量
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 填充白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 绘制 SVG 图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // 生成文件名（包含时间戳）
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')

        try {
          // 优先使用 toBlob 方法（性能更好）
          canvas.toBlob(
            (blob) => {
              if (!blob) return
              // 创建 Blob URL 并触发下载
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `mermaid-diagram-${timestamp}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              // 释放 Blob URL
              URL.revokeObjectURL(url)
            },
            'image/png',
            0.95, // 图像质量
          )
        } catch (toBlobError) {
          console.error('toBlobError:', toBlobError)
          // 降级方案：使用 toDataURL
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

    // 图片加载失败的处理
    img.onerror = (error) => {
      console.error('Image load error:', error)
    }

    // 开始加载图片
    img.src = svgDataUrl
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// ==================== Mermaid Hooks ====================

interface UseMermaidOptions {
  id?: string
  theme?: 'default' | 'dark' | 'forest' | 'neutral' | string
  config?: any
}

async function loadMermaid() {
  if (typeof window === 'undefined') return null
  const mermaidModule = await import('mermaid')
  return mermaidModule.default
}

let mermaidContainer: HTMLElement | null = null

function getMermaidContainer(): HTMLElement {
  if (!mermaidContainer) {
    mermaidContainer = document.querySelector('.elx-markdown-mermaid-container') as HTMLElement
    if (!mermaidContainer) {
      mermaidContainer = document.createElement('div') as HTMLElement
      mermaidContainer.ariaHidden = 'true'
      mermaidContainer.style.maxHeight = '0'
      mermaidContainer.style.opacity = '0'
      mermaidContainer.style.overflow = 'hidden'
      mermaidContainer.classList.add('elx-markdown-mermaid-container')
      document.body.append(mermaidContainer)
    }
  }
  return mermaidContainer
}

export function useMermaid(content: string | Ref<string>, options: UseMermaidOptions = {}) {
  const { id = 'mermaid', theme = 'default', config = {} } = options
  const mermaidConfig = computed(() => ({
    suppressErrorRendering: true,
    startOnLoad: false,
    securityLevel: 'loose',
    theme,
    ...config,
  }))
  const data = ref('')
  const error = ref<unknown>(null)
  const throttledRender = throttle(
    async () => {
      const contentValue = typeof content === 'string' ? content : content.value
      if (!contentValue?.trim()) {
        data.value = ''
        error.value = null
        return
      }
      try {
        // 动态加载 mermaid 库
        const mermaidInstance = await loadMermaid()
        if (!mermaidInstance) {
          data.value = contentValue
          error.value = null
          return
        }
        // 语法校验
        const isValid = await mermaidInstance.parse(contentValue.trim())
        if (!isValid) {
          console.log('Mermaid parse error: Invalid syntax')
          data.value = ''
          error.value = new Error('Mermaid parse error: Invalid syntax')
          return
        }
        // 初始化 mermaid 配置
        mermaidInstance.initialize(mermaidConfig.value)
        const renderId = `${id}-${Math.random().toString(36).substr(2, 9)}`
        const container = getMermaidContainer()
        const { svg } = await mermaidInstance.render(renderId, contentValue, container)
        data.value = svg
        error.value = null
      } catch (err) {
        console.log('Mermaid render error:', err)
        data.value = ''
        error.value = err
      }
    },
    300,
    { trailing: true, leading: true },
  )

  // 监听内容变化，自动触发渲染
  watch(
    () => (typeof content === 'string' ? content : content.value),
    () => {
      throttledRender()
    },
    { immediate: true },
  )

  return {
    data,
    error,
  }
}

export function useMermaidZoom(options: UseMermaidZoomOptions): MermaidZoomControls {
  const { container } = options

  const scale = ref(1)
  const posX = ref(0)
  const posY = ref(0)
  const isDragging = ref(false)

  let removeEvents: (() => void) | null = null

  // 获取SVG元素
  const getSvg = () => container.value?.querySelector('.mermaid-content svg') as HTMLElement

  // 更新变换
  const updateTransform = (svg: HTMLElement) => {
    svg.style.transformOrigin = 'center center'
    svg.style.transform = `translate(${posX.value}px, ${posY.value}px) scale(${scale.value})`
  }

  // 重置状态
  const resetState = () => {
    scale.value = 1
    posX.value = 0
    posY.value = 0
    isDragging.value = false
  }

  // 添加拖拽事件
  const addDragEvents = (content: HTMLElement) => {
    let startX = 0
    let startY = 0

    const onStart = (clientX: number, clientY: number) => {
      isDragging.value = true
      startX = clientX - posX.value
      startY = clientY - posY.value
      document.body.style.userSelect = 'none'
    }

    const onMove = (clientX: number, clientY: number) => {
      if (isDragging.value) {
        posX.value = clientX - startX
        posY.value = clientY - startY
        updateTransform(content)
      }
    }

    const onEnd = () => {
      isDragging.value = false
      document.body.style.userSelect = ''
    }

    // 鼠标事件
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // ⭐️ 只响应鼠标左键
      e.preventDefault()
      onStart(e.clientX, e.clientY)
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)

    // 触摸事件
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault()
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    // 绑定事件
    content.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onEnd)
    content.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)

    return () => {
      content.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      content.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
      document.body.style.userSelect = ''
    }
  }

  // 缩放功能
  const zoomIn = () => {
    const svg = getSvg()
    if (svg) {
      scale.value = Math.min(scale.value + 0.2, 10)
      updateTransform(svg)
    }
  }

  const zoomOut = () => {
    const svg = getSvg()
    if (svg) {
      scale.value = Math.max(scale.value - 0.2, 0.1)
      updateTransform(svg)
    }
  }

  const reset = () => {
    const svg = getSvg()
    if (svg) {
      resetState()
      updateTransform(svg)
    }
  }

  const fullscreen = () => {
    if (!container.value) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.value.requestFullscreen?.()
    }
  }

  const initialize = () => {
    if (!container.value) return

    resetState()

    const svg = getSvg()
    if (svg) {
      removeEvents = addDragEvents(svg)
      updateTransform(svg)
    }
  }

  const destroy = () => {
    removeEvents?.()
    removeEvents = null
    resetState()
  }

  // 监听容器变化
  watch(
    () => container.value,
    () => {
      destroy()
      resetState()
    },
  )

  // 组件卸载时清理
  onUnmounted(destroy)

  return {
    zoomIn,
    zoomOut,
    reset,
    fullscreen,
    destroy,
    initialize,
  }
}
