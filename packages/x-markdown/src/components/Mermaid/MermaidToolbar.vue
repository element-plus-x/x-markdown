<script setup lang="ts">
import type { MermaidToolbarConfig, MermaidToolbarEmits } from './types'
import { computed } from 'vue'
// 直接从 @vueuse/core 导入剪贴板功能
import { useClipboard } from '@vueuse/core'

interface MermaidToolbarInternalProps {
  toolbarConfig?: MermaidToolbarConfig
  isSourceCodeMode?: boolean
  sourceCode?: string
}

const props = withDefaults(defineProps<MermaidToolbarInternalProps>(), {
  toolbarConfig: () => ({}),
  isSourceCodeMode: false,
  sourceCode: '',
})

const emit = defineEmits<MermaidToolbarEmits>()

// 使用 vueuse 的剪贴板 hook
// copiedDuring: 1500 表示复制成功状态持续 1.5 秒
const { copy, copied: isCopySuccess } = useClipboard({ copiedDuring: 1500 })

// 当前激活的 tab
const activeTab = computed({
  get: () => (props.isSourceCodeMode ? 'code' : 'diagram'),
  set: (value: string) => {
    if (value === 'code' && !props.isSourceCodeMode) {
      handleToggleCode()
    } else if (value === 'diagram' && props.isSourceCodeMode) {
      handleToggleCode()
    }
  },
})

// 合并默认配置
const config = computed(() => {
  return {
    showToolbar: true,
    showZoomIn: true,
    showZoomOut: true,
    showReset: true,
    toolbarStyle: {},
    toolbarClass: '',
    iconColor: undefined,
    tabTextColor: undefined,
    hoverBackgroundColor: undefined,
    tabActiveBackgroundColor: undefined,
    ...props.toolbarConfig,
  }
})

// 动态图标颜色
const iconColorStyle = computed(() => {
  const style: Record<string, string> = {}

  if (config.value.iconColor) {
    style.color = config.value.iconColor
    style['--custom-icon-color'] = config.value.iconColor
  }

  // 设置hover背景色
  if (config.value.hoverBackgroundColor) {
    style['--custom-hover-bg'] = config.value.hoverBackgroundColor
  } else if (config.value.iconColor) {
    // 如果设置了图标颜色但没有设置hover背景色，使用稍暗的背景
    style['--custom-hover-bg'] = 'rgba(0, 0, 0, 0.1)'
  }

  return style
})

// 动态 tab 文字颜色
const tabTextColorStyle = computed(() => {
  const style: Record<string, string> = {}

  if (config.value.tabTextColor) {
    style['--tab-text-color'] = config.value.tabTextColor
  }

  // 设置tab激活状态背景色
  if (config.value.tabActiveBackgroundColor) {
    style['--tab-active-bg'] = config.value.tabActiveBackgroundColor
  } else if (config.value.tabTextColor) {
    // 如果设置了文字颜色但没有设置激活背景色，使用稍暗的背景
    style['--tab-active-bg'] = 'rgba(0, 0, 0, 0.1)'
  }

  return style
})

function handleZoomIn(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  emit('onZoomIn')
}

function handleZoomOut(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  emit('onZoomOut')
}

function handleReset(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  emit('onReset')
}

function handleToggleCode(event?: Event) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  emit('onToggleCode')
}

async function handleCopyCode(event: Event) {
  event.stopPropagation()
  event.preventDefault()

  // 如果正在显示成功状态，不执行复制操作
  if (isCopySuccess.value) {
    return
  }

  // 如果没有源代码，通知父组件处理
  if (!props.sourceCode) {
    emit('onCopyCode')
    return
  }

  try {
    // 使用 vueuse 的 copy 方法进行复制
    await copy(props.sourceCode)
    // 通知父组件复制完成
    emit('onCopyCode')
  } catch (err) {
    console.error('Failed to copy code: ', err)
    // 复制失败时也通知父组件
    emit('onCopyCode')
  }
}

function handleToolbarClick(event: Event) {
  event.stopPropagation()
  event.preventDefault()
}

function handleTabClick(tabName: string) {
  activeTab.value = tabName
}

interface TabClickEvent {
  paneName: string
}

function handleTabClickEvent(pane: TabClickEvent) {
  handleTabClick(pane.paneName)
}
</script>

<template>
  <!-- 正常状态：显示工具栏 -->
  <div
    v-if="config.showToolbar"
    class="mermaid-toolbar"
    :class="config.toolbarClass"
    :style="config.toolbarStyle"
    @click="handleToolbarClick"
  >
    <!-- 左侧分段器 -->
    <div class="toolbar-left" :style="tabTextColorStyle">
      <div class="segmented-control">
        <!-- 滑块背景，用于指示当前选中项 -->
        <div class="segmented-slider" :class="{ 'slide-right': activeTab === 'code' }" />
        <!-- Mermaid 图表选项 -->
        <div
          class="segment-item"
          :class="{ active: activeTab === 'diagram' }"
          @click="handleTabClickEvent({ paneName: 'diagram' })"
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
          @click="handleTabClickEvent({ paneName: 'code' })"
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
      <!-- 代码视图：只显示复制按钮 -->
      <template v-if="props.isSourceCodeMode">
        <div
          class="toolbar-action-btn"
          :class="{ 'copy-success': isCopySuccess }"
          :style="iconColorStyle"
          @click="handleCopyCode($event)"
        >
          <svg
            v-if="isCopySuccess"
            width="16"
            height="16"
            data-v-58697b5c=""
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="currentColor"
              d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
            ></path>
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            data-v-c91486b5=""
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="currentColor"
              d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"
            ></path>
            <path
              fill="currentColor"
              d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"
            ></path>
          </svg>
        </div>
      </template>

      <!-- 图片视图：显示所有操作按钮 -->
      <template v-else>
        <!-- 缩小按钮 -->
        <div
          v-if="config.showZoomOut"
          class="toolbar-action-btn"
          :style="iconColorStyle"
          @click="handleZoomOut($event)"
        >
          <svg width="16" height="16" data-v-c91486b5="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704M352 448h256a32 32 0 0 1 0 64H352a32 32 0 0 1 0-64"
            ></path>
          </svg>
        </div>

        <!-- 放大按钮 -->
        <div v-if="config.showZoomIn" class="toolbar-action-btn" :style="iconColorStyle" @click="handleZoomIn($event)">
          <svg width="16" height="16" data-v-c91486b5="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"
            ></path>
          </svg>
        </div>

        <!-- 适应按钮 (重置) -->
        <div v-if="config.showReset" class="toolbar-action-btn" :style="iconColorStyle" @click="handleReset($event)">
          <svg width="16" height="16" data-v-c91486b5="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"
            ></path>
            <path
              fill="currentColor"
              d="M512 96a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V128a32 32 0 0 1 32-32m0 576a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V704a32 32 0 0 1 32-32M96 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H128a32 32 0 0 1-32-32m576 0a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H704a32 32 0 0 1-32-32"
            ></path>
          </svg>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mermaid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: transparent;
  color: inherit;
}

.mermaid-toolbar .toolbar-left {
  display: flex;
  align-items: center;
}

/* 分段器容器样式 */
.mermaid-toolbar .toolbar-left .segmented-control {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}

/* 暗色模式下的分段器背景 */
.markdown-mermaid--dark .mermaid-toolbar .toolbar-left .segmented-control {
  background: rgba(255, 255, 255, 0.08);
}

/* 滑块背景样式 - 用于指示当前选中项 */
.mermaid-toolbar .toolbar-left .segmented-control .segmented-slider {
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
.markdown-mermaid--dark .mermaid-toolbar .toolbar-left .segmented-control .segmented-slider {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 滑块向右滑动时的位置 */
.mermaid-toolbar .toolbar-left .segmented-control .segmented-slider.slide-right {
  transform: translateX(calc(100% + 2px));
}

/* 分段器选项样式 */
.mermaid-toolbar .toolbar-left .segmented-control .segment-item {
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
.mermaid-toolbar .toolbar-left .segmented-control .segment-item.active {
  opacity: 1;
}

/* 暗色模式下激活状态的文字颜色 */
.markdown-mermaid--dark .mermaid-toolbar .toolbar-left .segmented-control .segment-item.active {
  color: #fff;
}

/* 选项 hover 效果 */
.mermaid-toolbar .toolbar-left .segmented-control .segment-item:hover {
  opacity: 1;
}

/* 选项内的图标样式 */
.mermaid-toolbar .toolbar-left .segmented-control .segment-item svg {
  flex-shrink: 0;
}

.mermaid-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mermaid-toolbar .toolbar-right .toolbar-action-btn {
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

.mermaid-toolbar .toolbar-right .toolbar-action-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

/* 复制成功状态 - 绿色图标 */
.mermaid-toolbar .toolbar-right .toolbar-action-btn.copy-success {
  opacity: 1;
  color: #22c55e;
}

.markdown-mermaid--dark .mermaid-toolbar .toolbar-right .toolbar-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
