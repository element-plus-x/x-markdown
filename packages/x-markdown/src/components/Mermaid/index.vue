<script setup lang="ts">
/**
 * Mermaid - Mermaid 图表容器组件
 *
 * 职责：
 * - 提供头部控制区域（工具栏）
 * - 管理代码视图/图表视图的切换
 * - 引入 SyntaxMermaid 组件进行图表渲染
 * - 使用 SyntaxCodeBlock 组件进行代码高亮显示
 *
 * 分层设计：
 * - Mermaid（本组件）：容器层，负责 UI 控制和布局
 * - SyntaxMermaid：渲染层，纯粹负责 Mermaid 图表渲染
 * - SyntaxCodeBlock：渲染层，负责代码语法高亮
 */

// ==================== 类型导入 ====================
import type { MdComponent, MermaidExposeProps, MermaidAction, MermaidSlotProps } from './types'
import type { BuiltinTheme } from 'shiki'
import type { VNode } from 'vue'

// ==================== Vue 核心 API 导入 ====================
import { computed, ref, h } from 'vue'

// ==================== 第三方 hooks 导入 ====================
import { useClipboard } from '@vueuse/core'

// ==================== 组件导入 ====================
import SyntaxMermaid from './SyntaxMermaid.vue'
import SyntaxCodeBlock from '../CodeBlock/SyntaxCodeBlock.vue'

interface MermaidProps extends MdComponent {
  isDark?: boolean
  shikiTheme?: [BuiltinTheme, BuiltinTheme]
  config?: Record<string, any>
  /** Mermaid 操作按钮配置，支持数组 */
  mermaidActions?: MermaidAction[]
}

// 定义 props 并设置默认值
const props = withDefaults(defineProps<MermaidProps>(), {
  raw: () => ({}),
  isDark: false,
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
  config: () => ({}),
  mermaidActions: undefined,
})

// ==================== 组件引用 ====================

// SyntaxMermaid 组件实例引用
const syntaxMermaidRef = ref<InstanceType<typeof SyntaxMermaid> | null>(null)

// ==================== 状态管理 ====================

// 是否显示源代码视图
const showSourceCode = ref(false)

// ==================== 计算属性 ====================

// Mermaid 内容
const mermaidContent = computed(() => props.raw?.content || '')

// 唯一标识符
const mermaidId = computed(() => `mermaid-${props.raw?.key || 'default'}`)

// 加载状态（从 SyntaxMermaid 获取）
const isLoading = computed(() => syntaxMermaidRef.value?.isLoading ?? true)

// SVG 内容（从 SyntaxMermaid 获取）
const svg = computed(() => syntaxMermaidRef.value?.svg ?? '')

// 当前激活的 tab（预览/代码）
const activeTab = computed(() => (showSourceCode.value ? 'code' : 'diagram'))

// ==================== 控制方法 ====================

/**
 * 放大图表
 * 通过 SyntaxMermaid 组件调用
 */
function handleZoomIn(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.zoomIn()
  }
}

/**
 * 缩小图表
 */
function handleZoomOut(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.zoomOut()
  }
}

/**
 * 重置缩放
 */
function handleReset(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.reset()
  }
}

/**
 * 切换全屏模式
 */
function handleFullscreen() {
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.fullscreen()
  }
}

function handleToggleCode() {
  showSourceCode.value = !showSourceCode.value
}

// 使用 vueuse 的 useClipboard hook 进行复制操作
// copiedDuring: 1500 表示复制成功状态持续 1.5 秒
const { copy: copyCode, copied } = useClipboard({ copiedDuring: 1500 })

/**
 * 切换 tab（预览/代码）
 */
function handleTabClick(tabName: string) {
  if (tabName === 'code' && !showSourceCode.value) {
    showSourceCode.value = true
  } else if (tabName === 'diagram' && showSourceCode.value) {
    showSourceCode.value = false
  }
}

/**
 * 复制代码到剪贴板
 * 用于插槽暴露和事件回调
 */
async function handleCopyCode(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  
  // 如果正在显示成功状态，不执行复制操作
  if (copied.value) {
    return
  }
  
  if (!props.raw.content) {
    return
  }
  await copyCode(props.raw.content)
}

/**
 * 下载 SVG 为 PNG 图片
 */
function handleDownload() {
  syntaxMermaidRef.value?.download()
}

// ==================== mermaidActions 处理逻辑 ====================

// 将 mermaidActions 统一转换为数组形式
const normalizedActions = computed<MermaidAction[]>(() => {
  // 仅支持数组形式，如果未传入则返回空数组
  return props.mermaidActions || []
})

// 根据当前视图过滤要显示的操作按钮
const filteredActions = computed<MermaidAction[]>(() => {
  return normalizedActions.value.filter((action) => {
    // 如果没有设置 show 函数，默认显示
    if (!action.show) return true
    // 调用 show 函数判断是否显示
    return action.show(slotProps.value)
  })
})

// 暴露给插槽/操作按钮的上下文属性
const slotProps = computed<MermaidSlotProps>(() => ({
  showSourceCode: showSourceCode.value,
  svg: svg.value,
  rawContent: props.raw.content || '',
  isLoading: isLoading.value,
  copied: copied.value,
  zoomIn: handleZoomIn,
  zoomOut: handleZoomOut,
  reset: handleReset,
  fullscreen: handleFullscreen,
  toggleCode: handleToggleCode,
  copyCode: handleCopyCode,
  download: handleDownload,
  raw: props.raw,
}))

/**
 * 渲染单个操作按钮的图标
 * 支持 Vue 组件、字符串（HTML/SVG）或渲染函数
 */
function renderActionIcon(action: MermaidAction): VNode | null {
  // 如果没有图标配置，返回 null
  if (!action.icon) return null
  
  // 如果是字符串，使用 v-html 渲染（支持 SVG 字符串）
  if (typeof action.icon === 'string') {
    return h('span', {
      class: 'mermaid-action-icon',
      innerHTML: action.icon,
    })
  }
  
  // 如果是函数类型（渲染函数），调用函数获取 VNode
  if (typeof action.icon === 'function') {
    // 检查是否是渲染函数（非组件函数）
    try {
      const result = (action.icon as (props: MermaidSlotProps) => VNode)(slotProps.value)
      // 如果返回的是 VNode，直接使用
      if (result && typeof result === 'object' && '__v_isVNode' in result) {
        return result
      }
    } catch {
      // 如果调用失败，当作组件处理
    }
    // 作为函数式组件处理
    return h(action.icon as any)
  }
  
  // 如果是组件对象，直接渲染组件
  return h(action.icon as any)
}

/**
 * 处理操作按钮点击事件
 */
function handleActionClick(action: MermaidAction) {
  // 如果按钮被禁用，不执行点击事件
  if (action.disabled) return
  // 调用按钮的 onClick 回调，传入上下文属性
  action.onClick?.(slotProps.value)
}

// 创建暴露给插槽的方法对象
const exposedMethods = computed(
  () =>
    ({
      // 基础属性
      showSourceCode: showSourceCode.value,
      svg: svg.value,
      rawContent: props.raw.content || '',
      isLoading: isLoading.value,
      copied: copied.value,

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
  <!-- 
    Mermaid 容器组件
    - 包含工具栏区域
    - 包含内容区域（代码视图/图表视图）
  -->
  <div
    :key="props.raw.key"
    class="markdown-mermaid"
    :class="{ 'markdown-mermaid--dark': props.isDark }"
  >
    <!-- ==================== 工具栏区域 ==================== -->
    <Transition name="toolbar" appear>
      <div class="toolbar-container">
        <!-- mermaidHeader 插槽：完全替换整个头部区域 -->
        <slot
          name="mermaidHeader"
          v-bind="exposedMethods"
        >
          <!-- 默认工具栏 -->
          <div class="mermaid-toolbar">
            <!-- 左侧分段器 -->
            <div class="toolbar-left">
              <div class="segmented-control">
                <!-- 滑块背景，用于指示当前选中项 -->
                <div class="segmented-slider" :class="{ 'slide-right': activeTab === 'code' }" />
                <!-- Mermaid 图表选项 -->
                <div
                  class="segment-item"
                  :class="{ active: activeTab === 'diagram' }"
                  @click="handleTabClick('diagram')"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>预览</span>
                </div>
                <!-- 代码选项 -->
                <div
                  class="segment-item"
                  :class="{ active: activeTab === 'code' }"
                  @click="handleTabClick('code')"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 18L22 12L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 6L2 12L8 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>代码</span>
                </div>
              </div>
            </div>

            <!-- 右侧按钮组 -->
            <div class="toolbar-right">
              <!-- mermaidActions 插槽：自定义操作按钮区域 -->
              <slot name="mermaidActions" v-bind="exposedMethods">
                <!-- 通过 props 传入的自定义操作按钮 -->
                <div
                  v-for="action in filteredActions"
                  :key="action.key"
                  class="toolbar-action-btn"
                  :class="[action.class, { 'toolbar-action-btn--disabled': action.disabled }]"
                  :style="action.style"
                  :title="action.title"
                  @click="handleActionClick(action)"
                >
                  <!-- 渲染图标：支持组件、字符串或渲染函数 -->
                  <component
                    :is="renderActionIcon(action)"
                    v-if="action.icon"
                  />
                </div>

                <!-- 代码视图：显示复制按钮 -->
                <template v-if="showSourceCode">
                  <div
                    class="toolbar-action-btn"
                    :class="{ 'copy-success': copied }"
                    title="复制代码"
                    @click="handleCopyCode($event)"
                  >
                    <!-- 复制成功图标 -->
                    <svg
                      v-if="copied"
                      width="16"
                      height="16"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                    >
                      <path
                        fill="currentColor"
                        d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
                      />
                    </svg>
                    <!-- 复制图标 -->
                    <svg
                      v-else
                      width="16"
                      height="16"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1024 1024"
                    >
                      <path
                        fill="currentColor"
                        d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"
                      />
                      <path
                        fill="currentColor"
                        d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"
                      />
                    </svg>
                  </div>
                </template>

                <!-- 图表视图：显示缩放操作按钮 -->
                <template v-else>
                  <!-- 缩小按钮 -->
                  <div
                    class="toolbar-action-btn"
                    title="缩小"
                    @click="handleZoomOut($event)"
                  >
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704M352 448h256a32 32 0 0 1 0 64H352a32 32 0 0 1 0-64"
                      />
                    </svg>
                  </div>

                  <!-- 放大按钮 -->
                  <div
                    class="toolbar-action-btn"
                    title="放大"
                    @click="handleZoomIn($event)"
                  >
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"
                      />
                    </svg>
                  </div>

                  <!-- 重置按钮 -->
                  <div
                    class="toolbar-action-btn"
                    title="重置"
                    @click="handleReset($event)"
                  >
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"
                      />
                      <path
                        fill="currentColor"
                        d="M512 96a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V128a32 32 0 0 1 32-32m0 576a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V704a32 32 0 0 1 32-32M96 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H128a32 32 0 0 1-32-32m576 0a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H704a32 32 0 0 1-32-32"
                      />
                    </svg>
                  </div>
                </template>
              </slot>
            </div>
          </div>
        </slot>
      </div>
    </Transition>

    <!-- ==================== 内容区域 ==================== -->
    <!-- 代码视图：使用 SyntaxCodeBlock 组件显示语法高亮的源代码 -->
    <div v-show="showSourceCode" class="mermaid-source-code">
      <SyntaxCodeBlock
        :code="props.raw?.content || ''"
        language="mermaid"
        :light-theme="props.shikiTheme[0]"
        :dark-theme="props.shikiTheme[1]"
        :is-dark="props.isDark"
      />
    </div>

    <!-- 图表视图：使用 SyntaxMermaid 组件渲染 -->
    <SyntaxMermaid
      v-show="!showSourceCode"
      ref="syntaxMermaidRef"
      :content="mermaidContent"
      :id="mermaidId"
      :is-dark="props.isDark"
      :config="props.config"
    />
  </div>
</template>

<style>
/* ==================== 容器样式 ==================== */
.markdown-mermaid {
  border-radius: 8px;
  overflow: hidden;
  font-size: 0;
  background: rgba(0, 0, 0, 0.03);
}

.markdown-mermaid.markdown-mermaid--dark {
  background: rgba(255, 255, 255, 0.13);
}

/* ==================== 工具栏容器样式 ==================== */
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

/* ==================== 工具栏样式 ==================== */
.markdown-mermaid .mermaid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: transparent;
  color: inherit;
}

.markdown-mermaid .mermaid-toolbar .toolbar-left {
  display: flex;
  align-items: center;
}

/* 分段器容器样式 */
.markdown-mermaid .mermaid-toolbar .segmented-control {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}

/* 暗色模式下的分段器背景 */
.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segmented-control {
  background: rgba(255, 255, 255, 0.08);
}

/* 滑块背景样式 */
.markdown-mermaid .mermaid-toolbar .segmented-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 4px);
  height: calc(100% - 6px);
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

/* 暗色模式下的滑块背景 */
.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segmented-slider {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 滑块向右滑动 */
.markdown-mermaid .mermaid-toolbar .segmented-slider.slide-right {
  transform: translateX(calc(100% + 2px));
}

/* 分段器选项样式 */
.markdown-mermaid .mermaid-toolbar .segment-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  border: none;
  color: inherit;
  min-width: 60px;
  text-align: center;
  box-sizing: border-box;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  padding: 5px 12px;
  transition: all 0.2s ease;
  background: transparent;
  opacity: 0.6;
  user-select: none;
  position: relative;
  z-index: 1;
}

/* 选项激活状态 */
.markdown-mermaid .mermaid-toolbar .segment-item.active {
  opacity: 1;
}

/* 暗色模式下激活状态的文字颜色 */
.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segment-item.active {
  color: #fff;
}

/* 选项 hover 效果 */
.markdown-mermaid .mermaid-toolbar .segment-item:hover {
  opacity: 1;
}

/* 选项内的图标样式 */
.markdown-mermaid .mermaid-toolbar .segment-item svg {
  flex-shrink: 0;
}

/* 右侧按钮组 */
.markdown-mermaid .mermaid-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 操作按钮样式 */
.markdown-mermaid .mermaid-toolbar .toolbar-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.markdown-mermaid .mermaid-toolbar .toolbar-action-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

/* 复制成功状态 - 绿色图标 */
.markdown-mermaid .mermaid-toolbar .toolbar-action-btn.copy-success {
  opacity: 1;
  color: #22c55e;
}

.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .toolbar-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ==================== 自定义操作按钮样式 ==================== */
/* 禁用状态 */
.markdown-mermaid .mermaid-toolbar .toolbar-action-btn.toolbar-action-btn--disabled {
  opacity: 0.3;              /* 降低透明度 */
  cursor: not-allowed;       /* 禁止光标 */
  pointer-events: none;      /* 禁止点击 */
}

/* 图标容器 */
.markdown-mermaid .mermaid-toolbar .mermaid-action-icon {
  display: flex;              /* 弹性布局 */
  align-items: center;        /* 垂直居中 */
  justify-content: center;    /* 水平居中 */
}

/* 图标内的 SVG 样式 */
.markdown-mermaid .mermaid-toolbar .mermaid-action-icon :deep(svg) {
  width: 16px;                /* 统一图标宽度 */
  height: 16px;               /* 统一图标高度 */
  flex-shrink: 0;             /* 防止图标被压缩 */
}

/* ==================== 源代码区域样式 ==================== */
.markdown-mermaid .mermaid-source-code {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
}

/* ==================== 过渡动画 ==================== */
.toolbar-enter-active,
.toolbar-leave-active {
  transition: opacity 0.3s ease;
}

.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
}
</style>
