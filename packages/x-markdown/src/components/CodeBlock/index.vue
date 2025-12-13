<template>
  <div class="x-md-code-block" :class="{ 'x-md-code-block--dark': props.isDark }">
    <!-- 头部区域：支持完全自定义或默认渲染 -->
    <div
      v-if="showCodeBlockHeader"
      class="x-md-code-header-wrapper"
      :class="[{'x-md-code-header-wrapper--sticky': props.stickyCodeBlockHeader }, { 'x-md-code-header-wrapper--collapsed': collapsed }]"
    >
      <div class="x-md-code-header">
        <slot
          name="codeHeader"
          :language="language"
          :code="code"
          :copy="copy"
          :copied="copied"
          :collapsed="collapsed"
          :toggleCollapse="toggleCollapse"
        >
          <div class="x-md-code-header__left">
            <button
              class="x-md-collapse-btn"
              :class="{ 'x-md-collapse-btn--collapsed': collapsed }"
              @click="toggleCollapse"
              :title="collapsed ? '展开代码' : '折叠代码'"
            >
              <svg
                class="x-md-collapse-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <span class="x-md-code-lang">{{ language }}</span>
          </div>
          <div class="x-md-code-header__right">
            <slot name="codeActions" :code="code" :copy="copy" :copied="copied">
              <button
                v-for="action in filteredActions"
                :key="action.key"
                class="x-md-action-btn"
                :class="[action.class, { 'x-md-action-btn--disabled': action.disabled }]"
                :style="action.style"
                :title="action.title"
                :disabled="action.disabled"
                @click="handleActionClick(action)"
              >
                <component :is="renderActionIcon(action)" v-if="action.icon" />
              </button>
                <button class="x-md-copy-btn" :class="{ 'x-md-copy-btn--copied': copied }" @click="copy(code)">
                  <svg
                    v-if="copied"
                    class="x-md-copy-icon"
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
                  <svg
                    v-else
                    class="x-md-copy-icon"
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
                </button>
              </slot>
          </div>
        </slot>
      </div>
    </div>
    <div class="x-md-code-body" :class="{ 'x-md-code-body--collapsed': collapsed }">
      <SyntaxCodeBlock
        ref="syntaxCodeBlockRef"
        :code="code"
        :language="language"
        :light-theme="props.lightTheme"
        :dark-theme="props.darkTheme"
        :is-dark="props.isDark"
        :color-replacements="props.colorReplacements"
        :code-max-height="props.codeMaxHeight"
        :enable-animate="props.enableAnimate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h, type VNode } from 'vue'
import { useClipboard } from '@vueuse/core'
import type { CodeBlockProps, CodeBlockAction, CodeBlockSlotProps } from './types'
import SyntaxCodeBlock from './SyntaxCodeBlock.vue'

defineOptions({
  name: 'CodeBlock',
})

const { copy, copied } = useClipboard({ copiedDuring: 2000 })

const collapsed = ref(false)

const syntaxCodeBlockRef = ref<InstanceType<typeof SyntaxCodeBlock> | null>(null)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const props = withDefaults(defineProps<CodeBlockProps>(), {
  lightTheme: 'vitesse-light', // 默认亮色主题
  darkTheme: 'vitesse-dark',   // 默认暗色主题
  isDark: false,               // 默认亮色模式
  showCodeBlockHeader: true,   // 默认显示代码块头部
  enableAnimate: false,        // 默认不启用动画
  codeBlockActions: undefined, // 默认无自定义操作按钮
  stickyCodeBlockHeader: true, // 默认启用sticky
})

const code = computed(() => props.code.trim())

const language = computed(() => props.language || 'text')

const normalizedActions = computed<CodeBlockAction[]>(() => {
  return props.codeBlockActions || []
})

const filteredActions = computed<CodeBlockAction[]>(() => {
  return normalizedActions.value.filter((action) => {
    if (!action.show) return true
    return action.show(slotProps.value)
  })
})

const slotProps = computed<CodeBlockSlotProps>(() => ({
  language: language.value,
  code: code.value,
  copy,
  copied: copied.value,
  collapsed: collapsed.value,
  toggleCollapse,
}))

function renderActionIcon(action: CodeBlockAction): VNode | null {
  if (!action.icon) return null

  if (typeof action.icon === 'string') {
    return h('span', {
      class: 'x-md-action-icon',
      innerHTML: action.icon,
    })
  }

  if (typeof action.icon === 'function') {
    try {
      const result = (action.icon as (props: CodeBlockSlotProps) => VNode)(slotProps.value)
      if (result && typeof result === 'object' && '__v_isVNode' in result) {
        return result
      }
    } catch {
    }
    return h(action.icon as any)
  }

  return h(action.icon as any)
}

function handleActionClick(action: CodeBlockAction) {
  if (action.disabled) return
  action.onClick?.(slotProps.value)
}

defineExpose({
  copy,
  copied,
  collapsed,
  toggleCollapse,
  syntaxCodeBlockRef,
})
</script>

<style scoped>
.x-md-code-block {
  border-radius: 8px;
  overflow: hidden;
  font-size: 0;
  background: rgba(0, 0, 0, 0.03);
}

.x-md-code-block.x-md-code-block--dark {
  background: rgba(255, 255, 255, 0.13);
}

/* ==================== 头部工具栏样式 ==================== */
.x-md-code-header-wrapper--sticky {
  background: #fff;                  /* 白色背景用于覆盖代码块背景 */
  position: sticky;
  top: 0;
}

/* 暗色主题 Sticky 头部包裹器 */
.x-md-code-block.x-md-code-block--dark .x-md-code-header-wrapper--sticky {
  background: #1a1a1a;
}

.x-md-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* Sticky 头部样式 */
.x-md-code-block .x-md-code-header-wrapper--sticky .x-md-code-header{
  background: rgba(235, 235, 235);
  border-radius: 8px 8px 0 0;
}

/* 当启用 sticky header 时，移除 overflow hidden */
.x-md-code-block:has(.x-md-code-header-wrapper--sticky) {
  overflow: visible;
}

/* 暗色主题头部 */
.x-md-code-block.x-md-code-block--dark .x-md-code-header {
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
}

/* 暗色主题Sticky头部 */
.x-md-code-block.x-md-code-block--dark .x-md-code-header-wrapper--sticky .x-md-code-header {
  background: rgba(44, 44, 44);
}

/* 折叠收起补齐圆角 */
.x-md-code-block .x-md-code-header-wrapper--collapsed .x-md-code-header {
    border-radius: 8px;
}

.x-md-code-header__left,
.x-md-code-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.x-md-code-lang {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.6;
  text-transform: lowercase;
}

.x-md-copy-btn {
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
  opacity: 0.7;
  transition: all 0.2s ease;
}

.x-md-copy-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

.x-md-code-block.x-md-code-block--dark .x-md-copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.x-md-copy-btn.x-md-copy-btn--copied {
  opacity: 1;
  color: #22c55e;
}

.x-md-copy-icon {
  flex-shrink: 0;
}

.x-md-action-btn {
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
  opacity: 0.7;
  transition: all 0.2s ease;
}

.x-md-action-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

.x-md-code-block.x-md-code-block--dark .x-md-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.x-md-action-btn.x-md-action-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.x-md-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.x-md-action-icon :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.x-md-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.x-md-collapse-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

.x-md-code-block.x-md-code-block--dark .x-md-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.x-md-collapse-icon {
  transition: transform 0.2s ease;
}

.x-md-collapse-btn--collapsed .x-md-collapse-icon {
  transform: rotate(-90deg);
}

.x-md-code-body {
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease;
}

.x-md-code-body--collapsed {
  max-height: 0 !important;
  opacity: 0;
}
</style>