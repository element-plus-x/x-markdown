<script setup lang="ts">
import type { MermaidToolbarConfig, MermaidToolbarEmits } from './types'
import { computed, ref } from 'vue'

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

// 复制成功状态
const isCopySuccess = ref(false)

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

  try {
    if (!props.sourceCode) {
      emit('onCopyCode')
      return
    }

    // 使用现代剪贴板 API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.sourceCode)
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = props.sourceCode
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }

    // 设置复制成功状态
    isCopySuccess.value = true

    setTimeout(() => {
      isCopySuccess.value = false
    }, 1500)

    emit('onCopyCode')
  } catch (err) {
    console.error('Failed to copy code: ', err)
    // 如果复制失败，也通知父组件，让父组件决定如何处理
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
    <!-- 左侧 Tabs -->
    <div class="toolbar-left" :style="tabTextColorStyle">
      <div class="toolbar-tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'diagram' }"
          @click="handleTabClickEvent({ paneName: 'diagram' })"
        >
          图片
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'code' }"
          @click="handleTabClickEvent({ paneName: 'code' })"
        >
          代码
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

.mermaid-toolbar .toolbar-left .toolbar-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mermaid-toolbar .toolbar-left .toolbar-tabs .tab-item {
  font-size: 12px;
  border: none;
  color: inherit;
  width: 60px;
  text-align: center;
  box-sizing: border-box;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 8px;
  transition: all 0.2s ease;
  background: transparent;
}

.mermaid-toolbar .toolbar-left .toolbar-tabs .tab-item.active {
  color: inherit;
  background: rgba(0, 0, 0, 0.08);
}

.markdown-mermaid--dark .mermaid-toolbar .toolbar-left .toolbar-tabs .tab-item.active {
  background: rgba(255, 255, 255, 0.1);
}

.mermaid-toolbar .toolbar-left .toolbar-tabs .tab-item:hover:not(.active) {
  color: inherit;
  background: rgba(0, 0, 0, 0.08);
}

.markdown-mermaid--dark .mermaid-toolbar .toolbar-left .toolbar-tabs .tab-item:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
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
  width: 16px;
  height: 16px;
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

.markdown-mermaid--dark .mermaid-toolbar .toolbar-right .toolbar-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
