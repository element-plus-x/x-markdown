<script setup lang="ts">
import type { MdComponent, MermaidExposeProps, MermaidAction, MermaidSlotProps } from './types'
import type { BuiltinTheme } from 'shiki'
import type { VNode } from 'vue'
import { computed, ref, h } from 'vue'
import { useClipboard } from '@vueuse/core'
import SyntaxMermaid from './SyntaxMermaid.vue'
import SyntaxCodeBlock from '../CodeBlock/SyntaxCodeBlock.vue'

interface MermaidProps extends MdComponent {
  isDark?: boolean
  shikiTheme?: [BuiltinTheme, BuiltinTheme]
  config?: Record<string, any>
  mermaidActions?: MermaidAction[]
}

const props = withDefaults(defineProps<MermaidProps>(), {
  raw: () => ({}),
  isDark: false,
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
  config: () => ({}),
  mermaidActions: undefined,
})

const syntaxMermaidRef = ref<InstanceType<typeof SyntaxMermaid> | null>(null)
const showSourceCode = ref(false)
const mermaidContent = computed(() => props.raw?.content || '')
const mermaidId = computed(() => `mermaid-${props.raw?.key || 'default'}`)
const isLoading = computed(() => syntaxMermaidRef.value?.isLoading ?? true)
const svg = computed(() => syntaxMermaidRef.value?.svg ?? '')
const activeTab = computed(() => (showSourceCode.value ? 'code' : 'diagram'))

function handleZoomIn(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.zoomIn()
  }
}

function handleZoomOut(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.zoomOut()
  }
}

function handleReset(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.reset()
  }
}

function handleFullscreen() {
  if (!showSourceCode.value) {
    syntaxMermaidRef.value?.fullscreen()
  }
}

function handleToggleCode() {
  showSourceCode.value = !showSourceCode.value
}

const { copy: copyCode, copied } = useClipboard({ copiedDuring: 1500 })

function handleTabClick(tabName: string) {
  if (tabName === 'code' && !showSourceCode.value) {
    showSourceCode.value = true
  } else if (tabName === 'diagram' && showSourceCode.value) {
    showSourceCode.value = false
  }
}

async function handleCopyCode(event?: Event) {
  event?.stopPropagation()
  event?.preventDefault()

  if (copied.value) {
    return
  }

  if (!props.raw.content) {
    return
  }
  await copyCode(props.raw.content)
}

function handleDownload() {
  syntaxMermaidRef.value?.download()
}

const normalizedActions = computed<MermaidAction[]>(() => {
  return props.mermaidActions || []
})

const filteredActions = computed<MermaidAction[]>(() => {
  return normalizedActions.value.filter((action) => {
    if (!action.show) return true
    return action.show(slotProps.value)
  })
})

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

function renderActionIcon(action: MermaidAction): VNode | null {
  if (!action.icon) return null

  if (typeof action.icon === 'string') {
    return h('span', {
      class: 'mermaid-action-icon',
      innerHTML: action.icon,
    })
  }

  if (typeof action.icon === 'function') {
    try {
      const result = (action.icon as (props: MermaidSlotProps) => VNode)(slotProps.value)
      if (result && typeof result === 'object' && '__v_isVNode' in result) {
        return result
      }
    } catch {}
    return h(action.icon as any)
  }

  return h(action.icon as any)
}

function handleActionClick(action: MermaidAction) {
  if (action.disabled) return
  action.onClick?.(slotProps.value)
}

const exposedMethods = computed(
  () =>
    ({
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
  <div :key="props.raw.key" class="markdown-mermaid" :class="{ 'markdown-mermaid--dark': props.isDark }">
    <Transition name="toolbar" appear>
      <div class="toolbar-container">
        <slot name="mermaidHeader" v-bind="exposedMethods">
          <div class="mermaid-toolbar">
            <div class="toolbar-left">
              <div class="segmented-control">
                <div class="segmented-slider" :class="{ 'slide-right': activeTab === 'code' }" />
                <div
                  class="segment-item"
                  :class="{ active: activeTab === 'diagram' }"
                  @click="handleTabClick('diagram')"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>预览</span>
                </div>
                <div class="segment-item" :class="{ active: activeTab === 'code' }" @click="handleTabClick('code')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M16 18L22 12L16 6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M8 6L2 12L8 18"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>代码</span>
                </div>
              </div>
            </div>

            <div class="toolbar-right">
              <slot name="mermaidActions" v-bind="exposedMethods">
                <div
                  v-for="action in filteredActions"
                  :key="action.key"
                  class="toolbar-action-btn"
                  :class="[action.class, { 'toolbar-action-btn--disabled': action.disabled }]"
                  :style="action.style"
                  :title="action.title"
                  @click="handleActionClick(action)"
                >
                  <component :is="renderActionIcon(action)" v-if="action.icon" />
                </div>

                <template v-if="showSourceCode">
                  <div
                    class="toolbar-action-btn"
                    :class="{ 'copy-success': copied }"
                    title="复制代码"
                    @click="handleCopyCode($event)"
                  >
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
                    <svg v-else width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
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

                <template v-else>
                  <div class="toolbar-action-btn" title="缩小" @click="handleZoomOut($event)">
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704M352 448h256a32 32 0 0 1 0 64H352a32 32 0 0 1 0-64"
                      />
                    </svg>
                  </div>

                  <div class="toolbar-action-btn" title="放大" @click="handleZoomIn($event)">
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"
                      />
                    </svg>
                  </div>

                  <div class="toolbar-action-btn" title="重置" @click="handleReset($event)">
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

                  <div class="toolbar-action-btn" title="下载" @click="handleDownload">
                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                      <path
                        fill="currentColor"
                        d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64m384-253.696 236.288-236.352 45.248 45.248L508.8 704 192 387.2l45.248-45.248L480 584.704V128h64z"
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

    <div v-show="showSourceCode" class="mermaid-source-code">
      <SyntaxCodeBlock
        :code="props.raw?.content || ''"
        language="mermaid"
        :light-theme="props.shikiTheme[0]"
        :dark-theme="props.shikiTheme[1]"
        :is-dark="props.isDark"
      />
    </div>

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

.markdown-mermaid .mermaid-toolbar .segmented-control {
  display: flex;
  align-items: center;
  position: relative;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}

.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segmented-control {
  background: rgba(255, 255, 255, 0.08);
}

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

.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segmented-slider {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.markdown-mermaid .mermaid-toolbar .segmented-slider.slide-right {
  transform: translateX(calc(100% + 2px));
}

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

.markdown-mermaid .mermaid-toolbar .segment-item.active {
  opacity: 1;
}

.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .segment-item.active {
  color: #fff;
}

.markdown-mermaid .mermaid-toolbar .segment-item:hover {
  opacity: 1;
}

.markdown-mermaid .mermaid-toolbar .segment-item svg {
  flex-shrink: 0;
}

.markdown-mermaid .mermaid-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

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

.markdown-mermaid .mermaid-toolbar .toolbar-action-btn.copy-success {
  opacity: 1;
  color: #22c55e;
}

.markdown-mermaid.markdown-mermaid--dark .mermaid-toolbar .toolbar-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.markdown-mermaid .mermaid-toolbar .toolbar-action-btn.toolbar-action-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.markdown-mermaid .mermaid-toolbar .mermaid-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.markdown-mermaid .mermaid-toolbar .mermaid-action-icon :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.markdown-mermaid .mermaid-source-code {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.toolbar-enter-active,
.toolbar-leave-active {
  transition: opacity 0.3s ease;
}

.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
}
</style>
