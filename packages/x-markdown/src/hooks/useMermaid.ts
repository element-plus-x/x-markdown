import type { Ref } from 'vue'
import { throttle } from 'lodash-es'
import { computed, ref, watch, onUnmounted } from 'vue'
import type { MermaidZoomControls, UseMermaidZoomOptions, UseMermaidResult } from '../components/Mermaid/types'

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

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

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
          console.error('Failed to convert canvas to blob:', toBlobError)
          try {
            const dataUrl = canvas.toDataURL('image/png', 0.95)
            const link = document.createElement('a')
            link.href = dataUrl
            link.download = `mermaid-diagram-${timestamp}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          } catch (dataUrlError) {
            console.error('Failed to convert canvas to data URL:', dataUrlError)
          }
        }
      } catch (canvasError) {
        console.error('Canvas operation failed:', canvasError)
      }
    }

    img.onerror = (error) => {
      console.error('Failed to load image:', error)
    }

    img.src = svgDataUrl
  } catch (error) {
    console.error('Failed to download SVG:', error)
  }
}

interface UseMermaidOptions {
  id?: string
  theme?: 'default' | 'dark' | 'forest' | 'neutral' | string
  config?: any
  container?: HTMLElement | Ref<HTMLElement | null> | null
}

type UseMermaidOptionsInput = UseMermaidOptions | Ref<UseMermaidOptions>

let mermaidPromise: Promise<any> | null = null
let hasShownMermaidHint = false
let mermaidAvailableCache: boolean | null = null
let mermaidCheckPromise: Promise<boolean> | null = null

/**
 * 同步检查缓存状态（不触发检测）
 * @returns 缓存状态，null 表示未检测
 */
export function getMermaidAvailableCache(): boolean | null {
  return mermaidAvailableCache
}

/**
 * 检测 mermaid 是否可用（全局缓存，只检测一次）
 */
export async function checkMermaidAvailable(): Promise<boolean> {
  // 如果已经有缓存结果，直接返回
  if (mermaidAvailableCache !== null) {
    return mermaidAvailableCache
  }

  // 如果正在检测，返回检测 Promise
  if (mermaidCheckPromise) {
    return mermaidCheckPromise
  }

  // 开始检测
  mermaidCheckPromise = (async () => {
    try {
      // 尝试静态导入 mermaid
      await import('mermaid')
      mermaidAvailableCache = true
      return true
    } catch (error) {
      mermaidAvailableCache = false
      return false
    }
  })()

  return mermaidCheckPromise
}

const showMermaidHint = () => {
  if (hasShownMermaidHint) return
  hasShownMermaidHint = true

  console.log(
    '%c[x-markdown]%c Mermaid 图表功能已降级为代码块显示',
    'font-weight: bold; color: #9333ea;',
    'color: #666;'
  )
  console.log(
    '%c如需 Mermaid 图表渲染功能，请安装：',
    'color: #666; font-weight: bold;'
  )
  console.log(
    '%c  pnpm add mermaid',
    'color: #9333ea; font-family: monospace;'
  )
  console.log(
    '%c安装后请重启开发服务器',
    'color: #999; font-size: 12px;'
  )
}

async function loadMermaid() {
  if (typeof window === 'undefined') return null
  if (!mermaidPromise) {
    mermaidPromise = (async () => {
      try {
        // 直接静态导入，让 Vite/Rollup 在构建时处理
        const mod = await import('mermaid')
        return (mod as any).default
      } catch {
        showMermaidHint()
        return null
      }
    })()
  }
  return mermaidPromise
}

type RenderTask = () => Promise<void>
const renderQueue: RenderTask[] = []
let isProcessingQueue = false

async function processRenderQueue() {
  if (isProcessingQueue) return
  isProcessingQueue = true

  while (renderQueue.length > 0) {
    const task = renderQueue.shift()
    if (task) {
      try {
        await task()
      } catch (err) {
        console.error('Mermaid render queue error:', err)
      }
    }
  }

  isProcessingQueue = false
}

function addToRenderQueue(task: RenderTask) {
  renderQueue.push(task)
  processRenderQueue()
}

export function useMermaid(content: string | Ref<string>, options: UseMermaidOptionsInput = {}): UseMermaidResult {
  const optionsRef = computed(() => (typeof options === 'object' && 'value' in options ? options.value : options))
  const mermaidConfig = computed(() => ({
    suppressErrorRendering: true,
    startOnLoad: false,
    securityLevel: 'loose',
    theme: optionsRef.value.theme || 'default',
    ...(optionsRef.value.config || {}),
  }))
  const data = ref('')
  const error = ref<unknown>(null)
  const isLoading = ref(false)

  let isUnmounted = false

  const getRenderContainer = () => {
    const containerOption = optionsRef.value.container
    if (containerOption) {
      return typeof containerOption === 'object' && 'value' in containerOption ? containerOption.value : containerOption
    }
    return null
  }

  const throttledRender = throttle(
    () => {
      const contentValue = typeof content === 'string' ? content : content.value
      if (!contentValue?.trim()) {
        data.value = ''
        error.value = null
        isLoading.value = false
        return
      }

      isLoading.value = true

      addToRenderQueue(async () => {
        if (isUnmounted) return

        try {
          const mermaidInstance = await loadMermaid()
          if (!mermaidInstance) {
            data.value = contentValue
            error.value = null
            isLoading.value = false
            return
          }

          mermaidInstance.initialize(mermaidConfig.value)

          const isValid = await mermaidInstance.parse(contentValue.trim())
          if (!isValid) {
            data.value = ''
            error.value = new Error('Mermaid parse error: Invalid syntax')
            isLoading.value = false
            return
          }

          const renderId = `${optionsRef.value.id || 'mermaid'}-${Math.random().toString(36).substring(2, 11)}`
          const container = getRenderContainer()
          if (!container) {
            isLoading.value = false
            return
          }

          const { svg } = await mermaidInstance.render(renderId, contentValue, container)
          data.value = svg
          error.value = null
          isLoading.value = false
        } catch (err) {
          // Mermaid render error
          data.value = ''
          error.value = err
          isLoading.value = false
        }
      })
    },
    100,
    { leading: false, trailing: true },
  )

  watch(
    [() => (typeof content === 'string' ? content : content.value), () => mermaidConfig.value],
    () => {
      throttledRender()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    isUnmounted = true
  })

  return {
    data,
    error,
    isLoading,
  }
}

export function useMermaidZoom(options: UseMermaidZoomOptions): MermaidZoomControls {
  const { container } = options

  const scale = ref(1)
  const posX = ref(0)
  const posY = ref(0)
  const isDragging = ref(false)

  let removeEvents: (() => void) | null = null

  const getSvg = () => container.value?.querySelector('.syntax-mermaid__content svg') as HTMLElement

  const updateTransform = (svg: HTMLElement) => {
    svg.style.transformOrigin = 'center center'
    svg.style.transform = `translate(${posX.value}px, ${posY.value}px) scale(${scale.value})`
  }

  const resetState = () => {
    scale.value = 1
    posX.value = 0
    posY.value = 0
    isDragging.value = false
  }

  const addInteractionEvents = (containerEl: HTMLElement) => {
    let startX = 0
    let startY = 0
    let isInteractingWithMermaid = false

    const onStart = (clientX: number, clientY: number) => {
      isDragging.value = true
      startX = clientX - posX.value
      startY = clientY - posY.value
      document.body.style.userSelect = 'none'
    }

    const onMove = (clientX: number, clientY: number) => {
      if (isDragging.value && isInteractingWithMermaid) {
        posX.value = clientX - startX
        posY.value = clientY - startY
        const svg = getSvg()
        if (svg) {
          updateTransform(svg)
        }
      }
    }

    const onEnd = () => {
      isDragging.value = false
      isInteractingWithMermaid = false
      document.body.style.userSelect = ''
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (e.target === containerEl || containerEl.contains(e.target as Node)) {
        e.preventDefault()
        isInteractingWithMermaid = true
        onStart(e.clientX, e.clientY)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isInteractingWithMermaid) {
        onMove(e.clientX, e.clientY)
      }
    }

    const handleWheelZoom = (e: WheelEvent) => {
      const svg = getSvg()
      if (!svg) return

      const containerRect = containerEl.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()

      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top

      const svgCenterX = svgRect.left - containerRect.left + svgRect.width / 2
      const svgCenterY = svgRect.top - containerRect.top + svgRect.height / 2

      const offsetX = (mouseX - svgCenterX - posX.value) / scale.value
      const offsetY = (mouseY - svgCenterY - posY.value) / scale.value

      const delta = e.deltaY > 0 ? -0.05 : 0.05
      const newScale = Math.min(Math.max(scale.value + delta, 0.1), 10)

      if (newScale === scale.value) return

      scale.value = newScale

      posX.value = mouseX - svgCenterX - offsetX * scale.value
      posY.value = mouseY - svgCenterY - offsetY * scale.value

      updateTransform(svg)
    }

    const throttledWheelZoom = throttle(handleWheelZoom, 20, { leading: true, trailing: true })

    const onWheel = (e: WheelEvent) => {
      if (e.target === containerEl || containerEl.contains(e.target as Node)) {
        e.preventDefault()
        throttledWheelZoom(e)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.target === containerEl || containerEl.contains(e.target as Node)) {
        if (e.touches.length === 1) {
          e.preventDefault()
          isInteractingWithMermaid = true
          onStart(e.touches[0].clientX, e.touches[0].clientY)
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isInteractingWithMermaid) {
        e.preventDefault()
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    containerEl.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onEnd)
    containerEl.addEventListener('wheel', onWheel, { passive: false })
    containerEl.addEventListener('touchstart', onTouchStart, { passive: false })
    containerEl.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)

    return () => {
      containerEl.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      containerEl.removeEventListener('wheel', onWheel)
      containerEl.removeEventListener('touchstart', onTouchStart)
      containerEl.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
      document.body.style.userSelect = ''
    }
  }

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

    removeEvents = addInteractionEvents(container.value)

    const svg = getSvg()
    if (svg) {
      updateTransform(svg)
    }
  }

  const destroy = () => {
    removeEvents?.()
    removeEvents = null
    resetState()
  }

  watch(
    () => container.value,
    () => {
      destroy()
      resetState()
    },
  )

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
