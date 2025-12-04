<script setup lang="ts">
/**
 * SyntaxMermaid - 纯粹的 Mermaid 图表渲染组件
 *
 * 职责：
 * - 仅负责 Mermaid 图表的渲染
 * - 处理缩放、拖拽、全屏等交互
 * - 不包含任何 UI 控制元素（如工具栏）
 *
 * 设计理念：
 * - 单一职责原则：只做图表渲染
 * - 可复用性：可以在任何需要渲染 Mermaid 的地方使用
 * - 暴露控制方法：通过 defineExpose 向外暴露缩放等控制方法
 */

// Vue 核心 API 导入
import { computed, nextTick, ref, watch, onMounted } from 'vue'

// 第三方库导入
import { debounce } from 'lodash-es'

// 内部 hooks 导入
import { useMermaid, useMermaidZoom, downloadSvgAsPng } from '../../hooks'

// ==================== Props 定义 ====================
interface SyntaxMermaidProps {
  /** Mermaid 图表的源代码内容 */
  content: string
  /** 唯一标识符，用于 Mermaid 渲染 */
  id?: string
  /** 是否为暗色模式 */
  isDark?: boolean
  /** Mermaid 配置选项 */
  config?: Record<string, any>
}

// 定义 props 并设置默认值
const props = withDefaults(defineProps<SyntaxMermaidProps>(), {
  content: '',
  id: 'mermaid-default',
  isDark: false,
  config: () => ({}),
})

// ==================== Mermaid 渲染逻辑 ====================

// 使用 useMermaid hook 进行图表渲染
// 根据 isDark 切换 Mermaid 主题
const mermaidContent = computed(() => props.content)
// 使用 computed 包装 options，以便在 isDark 或 config 变化时重新渲染
const mermaidOptions = computed(() => ({
  id: props.id,
  theme: props.isDark ? 'dark' : 'default',
  config: props.config,
}))
const mermaidResult = useMermaid(mermaidContent, mermaidOptions)

// 存储渲染后的 SVG 内容
const svg = ref('')

// 计算加载状态：当没有数据且没有错误时为加载中
const isLoading = computed(() => !mermaidResult.data.value && !mermaidResult.error.value)

// 渲染错误信息
const error = computed(() => mermaidResult.error.value)

// ==================== 容器引用与缩放控制 ====================

// 组件容器 DOM 引用
const containerRef = ref<HTMLElement | null>(null)

// 使用 useMermaidZoom hook 进行缩放控制
// scaleStep: 每次缩放的步进值
// minScale/maxScale: 缩放范围限制
const zoomControls = useMermaidZoom({
  container: containerRef,
  scaleStep: 0.2,
  minScale: 0.1,
  maxScale: 5,
})

// ==================== 防抖初始化 ====================

// 使用 debounce 防止频繁初始化
const debouncedInitialize = debounce(initializeZoom, 500)

/**
 * 初始化缩放功能
 * 在 SVG 渲染完成后调用
 */
function initializeZoom() {
  nextTick(() => {
    if (containerRef.value) {
      zoomControls.initialize()
    }
  })
}

// ==================== 监听器 ====================

// 监听 Mermaid 渲染结果变化
watch(
  () => mermaidResult.data.value,
  (newSvg) => {
    if (newSvg) {
      svg.value = newSvg
      debouncedInitialize()
    }
  },
)

// 监听 SVG 内容变化，重新初始化缩放
watch(svg, (newSvg) => {
  if (newSvg) {
    debouncedInitialize()
  }
})

// ==================== 暴露的控制方法 ====================

/**
 * 放大图表
 */
function zoomIn() {
  zoomControls?.zoomIn()
}

/**
 * 缩小图表
 */
function zoomOut() {
  zoomControls?.zoomOut()
}

/**
 * 重置缩放到初始状态
 */
function reset() {
  zoomControls?.reset()
}

/**
 * 切换全屏模式
 */
function fullscreen() {
  zoomControls?.fullscreen()
  zoomControls?.reset()
}

/**
 * 下载 SVG 为 PNG 图片
 */
function download() {
  downloadSvgAsPng(svg.value)
}

/**
 * 获取当前 SVG 内容
 */
function getSvg() {
  return svg.value
}

/**
 * 重新初始化（可在外部调用）
 */
function reinitialize() {
  debouncedInitialize()
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 组件挂载后，如果已有 SVG 则初始化缩放
  if (svg.value) {
    debouncedInitialize()
  }
})

// ==================== 暴露给父组件的 API ====================
defineExpose({
  // 状态
  svg,
  isLoading,
  error,
  containerRef,

  // 缩放控制方法
  zoomIn,
  zoomOut,
  reset,
  fullscreen,

  // 其他方法
  download,
  getSvg,
  reinitialize,
})
</script>

<template>
  <!-- 
    Mermaid 图表渲染容器
    - 使用 ref 获取 DOM 引用，用于缩放控制
    - cursor: grab/grabbing 指示可拖拽
  -->
  <div
    ref="containerRef"
    class="syntax-mermaid"
    :class="{ 'syntax-mermaid--dark': props.isDark }"
  >
    <!-- 加载状态 -->
    <div v-if="isLoading" class="syntax-mermaid__loading">
      <slot name="loading">
        <span class="syntax-mermaid__loading-text">加载中...</span>
      </slot>
    </div>
    <div v-else class="syntax-mermaid__content" v-html="svg" />
  </div>
</template>

<style>
/* ==================== 容器样式 ==================== */
.syntax-mermaid {
  /* 弹性布局，内容居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 最小高度确保组件有足够空间 */
  min-height: 200px;
  /* 隐藏溢出内容（缩放时可能超出） */
  overflow: hidden;
  /* 拖拽光标 */
  cursor: grab;
  /* 相对定位，用于子元素定位 */
  position: relative;
}

/* 拖拽激活状态的光标 */
.syntax-mermaid:active {
  cursor: grabbing;
}

/* ==================== 内容区域样式 ==================== */
.syntax-mermaid__content {
  /* 占满父容器 */
  width: 100%;
  height: 100%;
  /* 内容居中 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SVG 图表样式 */
.syntax-mermaid__content svg {
  /* 缩放原点为中心 */
  transform-origin: center center;
  /* 限制最大尺寸 */
  max-width: 100%;
  max-height: 100%;
}

/* ==================== 全屏模式样式 ==================== */
.syntax-mermaid:fullscreen {
  /* 全屏时最大高度 */
  max-height: 100vh;
}

.syntax-mermaid:fullscreen .syntax-mermaid__content {
  /* 全屏时内容居中 */
  justify-content: center;
}

/* ==================== 加载状态样式 ==================== */
.syntax-mermaid__loading {
  /* 居中显示 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 占满容器 */
  width: 100%;
  height: 100%;
  /* 最小高度 */
  min-height: 200px;
}

.syntax-mermaid__loading-text {
  /* 加载文字样式 */
  color: #666;
  font-size: 14px;
}

/* 暗色模式下的加载文字 */
.syntax-mermaid--dark .syntax-mermaid__loading-text {
  color: #999;
}
</style>
