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
          console.error('toBlobError:', toBlobError)
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

interface UseMermaidOptions {
  id?: string
  theme?: 'default' | 'dark' | 'forest' | 'neutral' | string
  config?: any
  container?: HTMLElement | Ref<HTMLElement | null> | null
}

type UseMermaidOptionsInput = UseMermaidOptions | Ref<UseMermaidOptions>

// 缓存 mermaid 模块，避免重复加载
let mermaidPromise: Promise<any> | null = null

async function loadMermaid() {
  if (typeof window === 'undefined') return null
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => m.default)
  }
  return mermaidPromise
}

// 全局渲染队列，确保 mermaid 渲染不互相干扰，但尽快处理
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
  const optionsRef = computed(() => typeof options === 'object' && 'value' in options ? options.value : options)
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

  const getRenderContainer = () => {
    const containerOption = optionsRef.value.container
    if (containerOption) {
      return typeof containerOption === 'object' && 'value' in containerOption
        ? containerOption.value
        : containerOption
    }
    return null
  }

  // 每个实例有自己的 throttle 函数
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

      // 将实际渲染任务添加到队列
      addToRenderQueue(async () => {
        try {
          const mermaidInstance = await loadMermaid()
          if (!mermaidInstance) {
            data.value = contentValue
            error.value = null
            isLoading.value = false
            return
          }

          // 先初始化配置
          mermaidInstance.initialize(mermaidConfig.value)

          // 使用 parse 验证语法
          const isValid = await mermaidInstance.parse(contentValue.trim())
          if (!isValid) {
            console.log('Mermaid parse error: Invalid syntax')
            data.value = ''
            error.value = new Error('Mermaid parse error: Invalid syntax')
            isLoading.value = false
            return
          }

          const renderId = `${optionsRef.value.id || 'mermaid'}-${Math.random().toString(36).substring(2, 11)}`
          const container = getRenderContainer()
          if (!container) {
            console.warn('Mermaid render container not found')
            isLoading.value = false
            return
          }

          const { svg } = await mermaidInstance.render(renderId, contentValue, container)
          data.value = svg
          error.value = null
          isLoading.value = false
        } catch (err) {
          console.log('Mermaid render error:', err)
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
    [
      () => (typeof content === 'string' ? content : content.value),
      () => mermaidConfig.value,
    ],
    () => {
      throttledRender()
    },
    { immediate: true },
  )

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
        const svg = getSvg()
        if (svg) {
          updateTransform(svg)
        }
      }
    }

    const onEnd = () => {
      isDragging.value = false
      document.body.style.userSelect = ''
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      onStart(e.clientX, e.clientY)
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)

    const handleWheelZoom = (e: WheelEvent) => {
      const svg = getSvg()
      if (!svg) return

      const containerRect = containerEl.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()

      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top

      const svgCenterX = (svgRect.left - containerRect.left) + svgRect.width / 2
      const svgCenterY = (svgRect.top - containerRect.top) + svgRect.height / 2

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
      e.preventDefault()
      throttledWheelZoom(e)
    }

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

    containerEl.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onEnd)
    containerEl.addEventListener('wheel', onWheel, { passive: false })
    containerEl.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onEnd)

    return () => {
      containerEl.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      containerEl.removeEventListener('wheel', onWheel)
      containerEl.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
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
