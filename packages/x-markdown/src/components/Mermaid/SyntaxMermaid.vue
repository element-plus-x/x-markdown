<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import { useMermaid, useMermaidZoom, downloadSvgAsPng } from '../../hooks'

interface SyntaxMermaidProps {
  content: string
  id?: string
  isDark?: boolean
  config?: Record<string, any>
}

const props = withDefaults(defineProps<SyntaxMermaidProps>(), {
  content: '',
  id: 'mermaid-default',
  isDark: false,
  config: () => ({}),
})

const renderContainerRef = ref<HTMLElement | null>(null)

const mermaidContent = computed(() => props.content)
const mermaidOptions = computed(() => ({
  id: props.id,
  theme: props.isDark ? 'dark' : 'default',
  config: props.config,
  container: renderContainerRef.value,
}))
const mermaidResult = useMermaid(mermaidContent, mermaidOptions)

const svg = ref('')

const isLoading = computed(() => mermaidResult.isLoading.value)

const error = computed(() => mermaidResult.error.value)

const containerRef = ref<HTMLElement | null>(null)

const zoomControls = useMermaidZoom({
  container: containerRef,
  scaleStep: 0.2,
  minScale: 0.1,
  maxScale: 5,
})

const debouncedInitialize = debounce(initializeZoom, 500)

function initializeZoom() {
  nextTick(() => {
    if (containerRef.value) {
      zoomControls.initialize()
    }
  })
}

watch(
  () => mermaidResult.data.value,
  (newSvg) => {
    if (newSvg) {
      svg.value = newSvg
      debouncedInitialize()
    }
  },
)

watch(svg, (newSvg) => {
  if (newSvg) {
    debouncedInitialize()
  }
})

function zoomIn() {
  zoomControls?.zoomIn()
}

function zoomOut() {
  zoomControls?.zoomOut()
}

function reset() {
  zoomControls?.reset()
}

function fullscreen() {
  zoomControls?.fullscreen()
  zoomControls?.reset()
}

function download() {
  downloadSvgAsPng(svg.value)
}

function getSvg() {
  return svg.value
}

function reinitialize() {
  debouncedInitialize()
}

onMounted(() => {
  if (svg.value) {
    debouncedInitialize()
  }
})

defineExpose({
  svg,
  isLoading,
  error,
  containerRef,
  zoomIn,
  zoomOut,
  reset,
  fullscreen,
  download,
  getSvg,
  reinitialize,
})
</script>

<template>
  <div
    ref="containerRef"
    class="syntax-mermaid"
    :class="{ 'syntax-mermaid--dark': props.isDark }"
  >
    <div
      ref="renderContainerRef"
      class="syntax-mermaid__render-container"
      aria-hidden="true"
    />

    <div v-if="isLoading" class="syntax-mermaid__loading">
      <slot name="loading">
        <span class="syntax-mermaid__loading-text">加载中...</span>
      </slot>
    </div>
    <div v-else class="syntax-mermaid__content" v-html="svg" />
  </div>
</template>

<style>
.syntax-mermaid {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.syntax-mermaid__render-container {
  position: absolute;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.syntax-mermaid:active {
  cursor: grabbing;
}

.syntax-mermaid__content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.syntax-mermaid__content svg {
  transform-origin: center center;
  max-width: 100%;
  max-height: 100%;
}

.syntax-mermaid:fullscreen {
  max-height: 100vh;
}

.syntax-mermaid:fullscreen .syntax-mermaid__content {
  justify-content: center;
}

.syntax-mermaid__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.syntax-mermaid__loading-text {
  color: #666;
  font-size: 14px;
}

.syntax-mermaid--dark .syntax-mermaid__loading-text {
  color: #999;
}
</style>
