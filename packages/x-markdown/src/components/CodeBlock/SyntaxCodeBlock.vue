<template>
  <!-- 代码块主体：纯渲染层，只负责代码的语法高亮显示 -->
  <div class="x-md-syntax-code-block">
    <!-- 降级显示：当语法高亮未生成时，显示纯文本代码 -->
    <pre v-if="showFallback" :style="codeContainerStyle"><code>{{ code }}</code></pre>
    <!-- 语法高亮代码：使用 Shiki 生成的 token 进行渲染 -->
    <pre v-else :class="['shiki', actualTheme]" :style="codeContainerStyle" tabindex="0">
      <code class="x-md-code-content">
        <!-- 遍历每一行代码 -->
        <span v-for="(line, i) in lines" :key="i" class="x-md-code-line">
          <!-- 空行显示占位符，保持行高一致 -->
          <span v-if="!line.length">&nbsp;</span>
          <!-- 渲染每个 token，应用对应的语法高亮样式 -->
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
</template>

<script setup lang="ts">
// Vue 核心 API
import { computed, type CSSProperties } from 'vue'
// Shiki 类型定义：Token 类型
import type { ThemedToken } from 'shiki'
// Shiki 核心工具：获取 token 的样式对象
import { getTokenStyleObject } from '@shikijs/core'
// 自定义语法高亮 hook：处理代码的词法分析和样式生成
import { useHighlight } from '../../hooks/useHighlight'
// 类型定义
import type { SyntaxCodeBlockProps } from './types'

// 定义组件名称
defineOptions({
  name: 'SyntaxCodeBlock',
})

// 定义组件 props，设置默认值
const props = withDefaults(defineProps<SyntaxCodeBlockProps>(), {
  lightTheme: 'vitesse-light', // 默认亮色主题
  darkTheme: 'vitesse-dark',   // 默认暗色主题
  isDark: false,               // 默认使用亮色模式
  enableAnimate: false,        // 默认不启用打字动画
})

// 处理代码内容：去除首尾空白字符
const code = computed(() => props.code.trim())

// 处理语言标识：如果未指定则默认为纯文本
const language = computed(() => props.language || 'text')

// 根据暗色模式选择对应的主题
const actualTheme = computed(() => (props.isDark ? props.darkTheme : props.lightTheme))

// 使用语法高亮 hook，获取解析后的代码行和预设样式
const { lines, preStyle } = useHighlight(code, {
  language,               // 代码语言
  theme: actualTheme,     // 当前主题
  colorReplacements: props.colorReplacements, // 颜色替换映射
})

/**
 * 颜色替换函数
 * 将指定的颜色替换为自定义颜色，用于主题定制
 * @param color - 原始颜色值
 * @param replacements - 颜色替换映射表
 * @returns 替换后的颜色值
 */
const applyColorReplacement = (color: string, replacements?: Record<string, string>) => {
  // 如果没有替换映射，直接返回原颜色
  if (!replacements) return color
  // 查找替换映射，使用小写进行匹配
  return replacements[color.toLowerCase()] || color
}

/**
 * 将 CSS 属性名从 kebab-case 转为 camelCase
 * 例如：font-style -> fontStyle
 * @param style - 原始样式对象
 * @returns 转换后的 CSSProperties 对象
 */
const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  // 遍历所有样式属性
  Object.entries(style).forEach(([key, value]) => {
    // 使用正则将 kebab-case 转为 camelCase
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

/**
 * 获取 token 的完整样式
 * 包括语法高亮颜色和可选的颜色替换
 * @param token - Shiki 生成的 ThemedToken
 * @returns 应用于 token 的 CSS 样式
 */
const getTokenStyle = (token: ThemedToken): CSSProperties => {
  // 获取 token 的原始样式（优先使用 htmlStyle，否则从 token 对象生成）
  const rawStyle = token.htmlStyle || getTokenStyleObject(token)
  // 标准化样式属性名
  const baseStyle = normalizeStyleKeys(rawStyle)

  // 如果没有颜色替换映射，直接返回基础样式
  if (!props.colorReplacements) return baseStyle

  // 复制样式对象以避免修改原对象
  const style = { ...baseStyle }

  // 替换前景色
  if (style.color && typeof style.color === 'string') {
    style.color = applyColorReplacement(style.color, props.colorReplacements)
  }
  // 替换背景色
  if (style.backgroundColor && typeof style.backgroundColor === 'string') {
    style.backgroundColor = applyColorReplacement(style.backgroundColor, props.colorReplacements)
  }

  return style
}

// 判断是否显示降级内容（当语法高亮未生成时）
const showFallback = computed(() => !lines.value?.length)

// 代码容器样式：合并 preStyle 和最大高度限制
const codeContainerStyle = computed(() => ({
  ...preStyle.value,
  maxHeight: props.codeMaxHeight,
}))

// 暴露给父组件的属性和方法
defineExpose({
  lines,        // 解析后的代码行数据
  code,         // 处理后的代码内容
  language,     // 代码语言
  actualTheme,  // 当前使用的主题
})
</script>

<style scoped>
/* 语法代码块容器 */
.x-md-syntax-code-block {
  width: 100%;
}

/* pre 样式重置 */
.x-md-syntax-code-block pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: transparent !important;
}

/* 代码内容容器：使用 flex 布局实现行排列 */
.x-md-code-content {
  display: flex;
  flex-direction: column;
}

/* 代码行样式 */
.x-md-code-line {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
}
</style>
