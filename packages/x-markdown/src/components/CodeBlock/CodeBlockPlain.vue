<template>
  <div class="x-md-code-block x-md-code-block-plain" :class="{ 'x-md-code-block--dark': props.isDark }">
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
      <pre class="x-md-plain-pre" :style="codeContainerStyle"><code class="x-md-code-content">{{ code }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClipboard } from '@vueuse/core'

interface CodeBlockPlainProps {
  code: string
  language?: string
  isDark?: boolean
  showCodeBlockHeader?: boolean
  stickyCodeBlockHeader?: boolean
  codeMaxHeight?: string
}

defineOptions({
  name: 'CodeBlockPlain',
})

const { copy, copied } = useClipboard({ copiedDuring: 2000 })

const collapsed = ref(false)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const props = withDefaults(defineProps<CodeBlockPlainProps>(), {
  isDark: false,
  showCodeBlockHeader: true,
  stickyCodeBlockHeader: true,
})

const code = computed(() => props.code.trim())

const language = computed(() => props.language || 'text')

const codeContainerStyle = computed(() => ({
  maxHeight: props.codeMaxHeight,
}))

defineExpose({
  copy,
  copied,
  collapsed,
  toggleCollapse,
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

.x-md-code-header-wrapper--sticky {
  background: #fff;
  position: sticky;
  top: 0;
}

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

.x-md-code-block .x-md-code-header-wrapper--sticky .x-md-code-header{
  background: rgba(235, 235, 235);
  border-radius: 8px 8px 0 0;
}

.x-md-code-block:has(.x-md-code-header-wrapper--sticky) {
  overflow: visible;
}

.x-md-code-block.x-md-code-block--dark .x-md-code-header {
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
}

.x-md-code-block.x-md-code-block--dark .x-md-code-header-wrapper--sticky .x-md-code-header {
  background: rgba(44, 44, 44);
}

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

.x-md-plain-pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: transparent !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
}

.x-md-code-block.x-md-code-block--dark .x-md-plain-pre {
  color: #e5e5e5;
}

.x-md-code-content {
  display: block;
  white-space: pre;
}
</style>
