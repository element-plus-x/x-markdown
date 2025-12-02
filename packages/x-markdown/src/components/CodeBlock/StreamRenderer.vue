<template>
  <div class="code-block-wrapper" :class="className" :style="containerStyle">
    <!-- 头部：支持插槽自定义 -->
    <div v-if="showHeader" class="code-header">
      <slot name="header" :language="language" :code="code" :copy="copy" :copied="copied">
        <!-- 左侧：语言标识 -->
        <div class="header-left">
          <slot name="header-left" :language="language">
            <span class="code-language">{{ language }}</span>
          </slot>
        </div>
        <!-- 右侧：复制按钮 -->
        <div class="header-right">
          <slot name="header-right" :code="code" :copy="copy" :copied="copied">
            <button class="copy-btn" :class="{ copied }" @click="copy(code)">
              <span class="copy-text">{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </slot>
        </div>
      </slot>
    </div>
    <pre v-if="showFallback"><code>{{ code }}</code></pre>
    <pre v-else :class="['shiki', theme]" :style="preStyle" tabindex="0">
      <code class="code-content">
        <span v-for="(line, i) in lines" :key="i" class="line">
          <template v-if="!line.length">{{ '\u00A0' }}</template>
<span v-else v-for="(token, j) in line" :key="j" :style="getTokenStyle(token)">{{ token.content }}</span>
</span>
</code>
</pre>
  </div>
</template>
<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { BuiltinTheme, ThemedToken } from 'shiki'
import { getTokenStyleObject } from '@shikijs/core'
import { useClipboard } from '@vueuse/core'
import { useHighlight } from '../../hooks/useHighlight'

// 复制功能
const { copy, copied } = useClipboard({ copiedDuring: 2000 })

interface Props {
  code: string
  language: string
  theme?: BuiltinTheme
  colorReplacements?: Record<string, string>
  className?: string
  style?: CSSProperties
  maxWidth?: string
  maxHeight?: string
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'vitesse-light',
  className: 'stream-highlighter',
  showHeader: true
})

// 代码高亮
const code = computed(() => props.code.trim())
const { lines, preStyle } = useHighlight(code, {
  language: props.language,
  theme: props.theme,
  streaming: true,
  colorReplacements: props.colorReplacements
})

// 颜色替换
const applyColorReplacement = (color: string, replacements?: Record<string, string>) => {
  if (!replacements) return color
  return replacements[color.toLowerCase()] || color
}

// 将 CSS 属性名从 kebab-case 转为 camelCase
const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    // font-style -> fontStyle
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      ; (normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

// 获取 token 样式
const getTokenStyle = (token: ThemedToken): CSSProperties => {
  const rawStyle = token.htmlStyle || getTokenStyleObject(token)
  const baseStyle = normalizeStyleKeys(rawStyle)

  if (!props.colorReplacements) return baseStyle

  const style = { ...baseStyle }

  // 替换颜色
  if (style.color && typeof style.color === 'string') {
    style.color = applyColorReplacement(style.color, props.colorReplacements)
  }
  if (style.backgroundColor && typeof style.backgroundColor === 'string') {
    style.backgroundColor = applyColorReplacement(style.backgroundColor, props.colorReplacements)
  }

  return style
}

const showFallback = computed(() => !lines.value?.length)

const containerStyle = computed(() => ({
  ...props.style,
  maxWidth: props.maxWidth,
  maxHeight: props.maxHeight
}))
</script>

<style scoped>
.code-block-wrapper {
  border-radius: 8px;
  overflow: hidden;
  font-size: 0;
  background: rgba(0, 0, 0, 0.03);
}

/* 头部样式 */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.015);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-language {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.6;
  text-transform: lowercase;
}

/* 复制按钮 */
.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
}


.copy-btn.copied {
  opacity: 1;
  color: #22c55e;
}

.copy-text {
  font-size: 12px;
}

.code-block-wrapper pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: transparent !important;
}

.code-content {
  display: flex;
  flex-direction: column;
}

.line {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
}
</style>
