<script setup lang="ts">
// 类型导入
import type { MdComponent, MermaidExposeProps, MermaidToolbarConfig } from './types'
import type { ThemedToken, BuiltinTheme } from 'shiki'
import type { CSSProperties } from 'vue'

// 第三方库导入
import { debounce } from 'lodash-es'
import { getTokenStyleObject } from '@shikijs/core'

// Vue 核心 API 导入
import { computed, nextTick, ref, watch } from 'vue'

// 第三方 hooks 导入
import { useClipboard } from '@vueuse/core'

// 内部 hooks 导入
import { useMermaid, useMermaidZoom, downloadSvgAsPng } from '../../hooks'
import { useHighlight } from '../../hooks/useHighlight'

// 组件导入
import MermaidToolbar from './MermaidToolbar.vue'

interface MermaidProps extends MdComponent {
  toolbarConfig?: MermaidToolbarConfig
  isDark?: boolean
  shikiTheme?: [BuiltinTheme, BuiltinTheme]
  config?: Record<string, any>
  codeXSlots?: Record<string, any>
}

const props = withDefaults(defineProps<MermaidProps>(), {
  raw: () => ({}),
  toolbarConfig: () => ({}),
  isDark: false,
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
  config: () => ({}),
  codeXSlots: () => ({}),
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
const actualTheme = computed(() => (props.isDark ? props.shikiTheme[1] : props.shikiTheme[0]))
const { lines, preStyle } = useHighlight(codeContent, {
  language: 'mermaid',
  theme: actualTheme,
})

// 将 CSS 属性名从 kebab-case 转为 camelCase
const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      ; (normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

// 获取 token 样式
const getTokenStyle = (token: ThemedToken): CSSProperties => {
  const rawStyle = token.htmlStyle || getTokenStyleObject(token)
  return normalizeStyleKeys(rawStyle)
}

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

// 使用 vueuse 的 useClipboard hook 进行复制操作
const { copy: copyCode } = useClipboard()

/**
 * 复制代码到剪贴板
 * 用于插槽暴露和事件回调
 */
async function handleCopyCode() {
  if (!props.raw.content) {
    return
  }
  await copyCode(props.raw.content)
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
  <div ref="containerRef" :key="props.raw.key" class="markdown-mermaid"
    :class="{ 'markdown-mermaid--dark': props.isDark }">
    <Transition name="toolbar" appear>
      <div class="toolbar-container">
        <component :is="codeXSlot.codeMermaidHeader" v-if="codeXSlot?.codeMermaidHeader" v-bind="exposedMethods" />
        <template v-else>
          <component :is="codeXSlot.codeMermaidHeaderControl" v-if="codeXSlot?.codeMermaidHeaderControl"
            v-bind="exposedMethods" />
          <MermaidToolbar v-else :toolbar-config="toolbarConfig" :is-source-code-mode="showSourceCode"
            :source-code="props.raw.content" @on-zoom-in="handleZoomIn" @on-zoom-out="handleZoomOut"
            @on-reset="handleReset" @on-fullscreen="handleFullscreen" @on-toggle-code="handleToggleCode"
            @on-copy-code="handleCopyCode" @on-download="handleDownload" />
        </template>
      </div>
    </Transition>
    <Transition name="content" mode="out-in" @after-enter="onContentTransitionEnter">
      <div v-if="showSourceCode" key="source" class="mermaid-source-code">
        <pre :class="['shiki', actualTheme]" :style="preStyle"><code class="code-content">
        <span v-for="(line, i) in lines" :key="i" class="code-line">
          <template v-if="!line.length">{{ '\u00A0' }}</template>
          <template v-else><span
                v-for="(token, j) in line"
                :key="j"
                :style="getTokenStyle(token)"
              >{{ token.content }}</span></template></span></code></pre>
      </div>
      <!-- 图表视图：显示渲染后的 SVG -->
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
  background: rgba(255, 255, 255, 0.13);
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
