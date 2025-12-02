<template>
  <div class="x-md-code-block" :class="{ 'x-md-code-block--dark': props.isDark }">
    <!-- 头部：支持插槽自定义 -->
    <div v-if="showCodeBlockHeader" class="x-md-code-header">
      <slot
        name="header"
        :language="language"
        :code="code"
        :copy="copy"
        :copied="copied"
        :collapsed="collapsed"
        :toggleCollapse="toggleCollapse"
      >
        <!-- 左侧：语言标识 + 折叠按钮 -->
        <div class="x-md-code-header__left">
          <slot name="header-left" :language="language" :collapsed="collapsed" :toggleCollapse="toggleCollapse">
            <!-- 折叠/展开图标 -->
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
          </slot>
        </div>
        <!-- 右侧：复制按钮 -->
        <div class="x-md-code-header__right">
          <slot name="header-right" :code="code" :copy="copy" :copied="copied">
            <button class="x-md-copy-btn" :class="{ 'x-md-copy-btn--copied': copied }" @click="copy(code)">
              <span class="x-md-copy-btn__text">{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
          </slot>
        </div>
      </slot>
    </div>
    <!-- 代码块主体（可折叠） -->
    <div class="x-md-code-body" :class="{ 'x-md-code-body--collapsed': collapsed }">
      <pre v-if="showFallback" :style="codeContainerStyle"><code>{{ code }}</code></pre>
      <pre v-else :class="['shiki', actualTheme]" :style="codeContainerStyle" tabindex="0">
        <code class="x-md-code-content">
          <span v-for="(line, i) in lines" :key="i" class="x-md-code-line">
            <!-- 空行显示占位符 -->
            <template v-if="!line.length">{{ '\u00A0' }}</template>
            <!-- 渲染 token - 当 enableAnimate 为 true 时添加动画 class -->
            <span 
              v-else 
              v-for="(token, j) in line" 
              :key="j" 
              :style="getTokenStyle(token)"
              :class="{ 'x-md-animated-word': props.enableAnimate }"
            >{{ token.content }}</span>
          </span>
        </code>
      </pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import type { BuiltinTheme, ThemedToken } from 'shiki'
// import { getTokenStyleObject } from '@shikijs/core'
import { getTokenStyleObject } from 'shiki'
import { useClipboard } from '@vueuse/core'
import { useHighlight } from '../../hooks/useHighlight'

const { copy, copied } = useClipboard({ copiedDuring: 2000 })

// 折叠状态
const collapsed = ref(false)

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

interface Props {
  /** 代码内容 */
  code: string
  /** 代码语言 */
  language: string
  /** 亮色主题 */
  lightTheme?: BuiltinTheme
  /** 暗色主题 */
  darkTheme?: BuiltinTheme
  /** 是否为暗色模式 */
  isDark?: boolean
  /** 颜色替换映射表 */
  colorReplacements?: Record<string, string>
  /** 代码块最大高度（超出后滚动） */
  codeMaxHeight?: string
  /** 是否显示代码块头部 */
  showCodeBlockHeader?: boolean
  /** 是否启用动画效果 - 启用后给每个 token 添加 x-md-animated-word class */
  enableAnimate?: boolean
}

// 定义组件 props 默认值
const props = withDefaults(defineProps<Props>(), {
  lightTheme: 'vitesse-light', // 默认亮色主题
  darkTheme: 'vitesse-dark', // 默认暗色主题
  isDark: false, // 默认亮色模式
  showCodeBlockHeader: true, // 默认显示代码块头部
  enableAnimate: false, // 默认不启用动画
})

const code = computed(() => props.code.trim())
const language = computed(() => props.language || 'text')
const actualTheme = computed(() => (props.isDark ? props.darkTheme : props.lightTheme))

const { lines, preStyle } = useHighlight(code, {
  language,
  theme: actualTheme,
  colorReplacements: props.colorReplacements,
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
    ;(normalized as Record<string, string | number>)[camelKey] = value
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

// 是否显示 fallback
const showFallback = computed(() => !lines.value?.length)

// 代码容器样式（合并 preStyle 和 codeMaxHeight）
const codeContainerStyle = computed(() => ({
  ...preStyle.value,
  maxHeight: props.codeMaxHeight,
}))
</script>

<style scoped>
/* 代码块容器 */
.x-md-code-block {
  border-radius: 8px;
  overflow: hidden;
  font-size: 0;
  background: rgba(0, 0, 0, 0.03);
}

/* 暗色主题容器 */
.x-md-code-block.x-md-code-block--dark {
  background: rgba(255, 255, 255, 0.13);
}

/* 头部样式 */
.x-md-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* 暗色主题头部 */
.x-md-code-block.x-md-code-block--dark .x-md-code-header {
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
}

.x-md-code-header__left,
.x-md-code-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 语言标识 */
.x-md-code-lang {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.6;
  text-transform: lowercase;
}

/* 复制按钮 */
.x-md-copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.x-md-copy-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.12);
}

/* 暗色主题复制按钮 */
.x-md-code-block.x-md-code-block--dark .x-md-copy-btn {
  background: rgba(255, 255, 255, 0.1);
}

.x-md-code-block.x-md-code-block--dark .x-md-copy-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.x-md-copy-btn.x-md-copy-btn--copied {
  opacity: 1;
  color: #22c55e;
}

.x-md-copy-btn__text {
  font-size: 12px;
}

/* pre 样式 */
.x-md-code-block pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: transparent !important;
}

/* 代码内容 */
.x-md-code-content {
  display: flex;
  flex-direction: column;
}

/* 代码行 */
.x-md-code-line {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
}

/* 折叠按钮 */
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

/* 暗色主题折叠按钮 */
.x-md-code-block.x-md-code-block--dark .x-md-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 折叠图标 */
.x-md-collapse-icon {
  transition: transform 0.2s ease;
}

/* 折叠状态时图标旋转 */
.x-md-collapse-btn--collapsed .x-md-collapse-icon {
  transform: rotate(-90deg);
}

/* 代码块主体容器 */
.x-md-code-body {
  overflow: hidden;
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease;
}

/* 折叠状态 */
.x-md-code-body--collapsed {
  max-height: 0 !important;
  opacity: 0;
}
</style>
