<script setup lang="ts">
import type { MdComponent, MermaidExposeProps, MermaidToolbarConfig } from './types'
import { debounce } from 'lodash-es'
import { computed, nextTick, ref, watch } from 'vue'
import { useMermaid, useMermaidZoom } from '../../hooks'
import { useHighlight } from '../../hooks/useHighlight'
import { copyToClipboard, downloadSvgAsPng } from './composables'
import MermaidToolbar from './MermaidToolbar.vue'

interface MermaidProps extends MdComponent {
  toolbarConfig?: MermaidToolbarConfig
  isDark?: boolean
  codeLightTheme?: string
  codeDarkTheme?: string
}

const props = withDefaults(defineProps<MermaidProps>(), {
  raw: () => ({}),
  toolbarConfig: () => ({}),
  isDark: false,
  codeLightTheme: 'vitesse-light',
  codeDarkTheme: 'vitesse-dark',
  config: () => ({}),
})

const mermaidContent = computed(() => props.raw?.content || '')
const mermaidResult = useMermaid(mermaidContent, {
  id: `mermaid-${props.raw?.key || 'default'}`,
  theme: props.isDark ? 'dark' : 'default',
  config: props.config,
})

const svg = ref('')
const isLoading = computed(() => !mermaidResult.data.value && !mermaidResult.error.value)

const codeXSlot = ref({})

const toolbarConfig = computed(() => ({
  showToolbar: true,
  showFullscreen: true,
  showZoomIn: true,
  showZoomOut: true,
  showReset: true,
  ...props.toolbarConfig,
}))

const containerRef = ref<HTMLElement | null>(null)
const showSourceCode = ref(false)

const zoomControls = useMermaidZoom({
  container: containerRef,
  scaleStep: 0.2,
  minScale: 0.1,
  maxScale: 5,
})

const debouncedInitialize = debounce(onContentTransitionEnter, 500)

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

const codeContent = computed(() => props.raw?.content || '')
const actualTheme = computed(() => (props.isDark ? props.codeDarkTheme : props.codeLightTheme))
const {
  lines,
  preStyle,
  isLoading: isCodeLoading,
} = useHighlight(codeContent, {
  language: 'mermaid',
  theme: actualTheme,
})

function handleZoomIn() {
  if (!showSourceCode.value) {
    zoomControls?.zoomIn()
  }
}

function handleZoomOut() {
  if (!showSourceCode.value) {
    zoomControls?.zoomOut()
  }
}

function handleReset() {
  if (!showSourceCode.value) {
    zoomControls?.reset()
  }
}

function handleFullscreen() {
  if (!showSourceCode.value) {
    zoomControls?.fullscreen()
    zoomControls?.reset()
  }
}

function handleToggleCode() {
  showSourceCode.value = !showSourceCode.value
}

async function handleCopyCode() {
  if (!props.raw.content) {
    return
  }
  copyToClipboard(props.raw.content)
}

function handleDownload() {
  downloadSvgAsPng(svg.value)
}

function onContentTransitionEnter() {
  if (!showSourceCode.value) {
    nextTick(() => {
      if (containerRef.value) {
        zoomControls.initialize()
      }
    })
  }
}

// 创建暴露给插槽的方法对象
const exposedMethods = computed(
  () =>
    ({
      // 基础属性
      showSourceCode: showSourceCode.value,
      svg: svg.value,
      rawContent: props.raw.content || '',
      toolbarConfig: toolbarConfig.value,
      isLoading: isLoading.value,

      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      reset: handleReset,
      fullscreen: handleFullscreen,

      toggleCode: handleToggleCode,
      copyCode: handleCopyCode,
      download: handleDownload,

      raw: props.raw,
    }) satisfies MermaidExposeProps,
)
</script>

<template>
  <div
    ref="containerRef"
    :key="props.raw.key"
    class="markdown-mermaid"
    :class="{ 'markdown-mermaid--dark': props.isDark }"
  >
    <Transition name="toolbar" appear>
      <div class="toolbar-container">
        <component :is="codeXSlot.codeMermaidHeader" v-if="codeXSlot?.codeMermaidHeader" v-bind="exposedMethods" />
        <template v-else>
          <component
            :is="codeXSlot.codeMermaidHeaderControl"
            v-if="codeXSlot?.codeMermaidHeaderControl"
            v-bind="exposedMethods"
          />
          <MermaidToolbar
            v-else
            :toolbar-config="toolbarConfig"
            :is-source-code-mode="showSourceCode"
            :source-code="props.raw.content"
            @on-zoom-in="handleZoomIn"
            @on-zoom-out="handleZoomOut"
            @on-reset="handleReset"
            @on-fullscreen="handleFullscreen"
            @on-toggle-code="handleToggleCode"
            @on-copy-code="handleCopyCode"
            @on-download="handleDownload"
          />
        </template>
      </div>
    </Transition>
    <Transition name="content" mode="out-in" @after-enter="onContentTransitionEnter">
      <div v-if="showSourceCode" key="source" class="mermaid-source-code">
        <pre :style="[preStyle, { margin: 0 }]"><code class="code-content">
        <template v-for="(line, i) in lines" :key="i"><span class="code-line">
          <template v-for="(token, j) in line" :key="j">
            <span :style="{
              color: token.color,
              backgroundColor: token.backgroundColor,
              fontWeight: token.fontWeight,
              fontStyle: token.fontStyle,
              textDecoration: token.textDecoration
            }">
              {{ token.content }}
            </span>
          </template>
          </span>{{ i < lines.length - 1 ? '\n' : '' }}
        </template>
        </code></pre>
      </div>
      <div v-else class="mermaid-content" v-html="svg" />
    </Transition>
  </div>
</template>

<style>
.markdown-mermaid {
  border-radius: 8px;
  overflow: hidden;
  font-size: 0;
  background: rgba(0, 0, 0, 0.03);
}

.markdown-mermaid.markdown-mermaid--dark {
  background-color: #1a1a1a;
}

.markdown-mermaid .toolbar-container {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.markdown-mermaid.markdown-mermaid--dark .toolbar-container {
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
}

.markdown-mermaid .mermaid-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 200px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
}

.markdown-mermaid .mermaid-content:active {
  cursor: grabbing;
}

.markdown-mermaid .mermaid-content svg {
  transform-origin: center center;
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.markdown-mermaid:fullscreen .mermaid-content {
  max-height: 100vh;
  justify-content: center;
}

.markdown-mermaid .mermaid-source-code {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.markdown-mermaid.markdown-mermaid--dark .mermaid-source-code {
  background-color: #1a1a1a;
}

.markdown-mermaid .mermaid-source-code pre {
  padding: 16px;
  margin: 0 !important;
  overflow: auto;
  background: transparent !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-mermaid .mermaid-source-code .code-content {
  display: flex;
  flex-direction: column;
}

.markdown-mermaid .mermaid-source-code .code-line {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
}

.content-enter-active,
.content-leave-active,
.toolbar-enter-active,
.toolbar-leave-active {
  transition: opacity 0.3s ease;
}

.content-enter-from,
.content-leave-to,
.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
}
</style>
