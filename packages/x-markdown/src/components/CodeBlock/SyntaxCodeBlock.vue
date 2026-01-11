<template>
  <div class="x-md-syntax-code-block">
    <pre v-if="showFallback" :style="codeContainerStyle"><code>{{ code }}</code></pre>
    <pre v-else :class="['shiki', actualTheme]" :style="codeContainerStyle" tabindex="0">
      <code class="x-md-code-content">
        <span v-for="(line, i) in lines" :key="i" class="x-md-code-line">
          <span v-if="!line.length">&nbsp;</span>
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
import { computed, type CSSProperties } from 'vue'
import { useHighlight } from '../../hooks/useHighlight'
import type { SyntaxCodeBlockProps } from './types'

interface HighlightToken {
  content?: string
  color?: string
  fontStyle?: 'italic' | null
  fontWeight?: 'normal' | 'bold' | null
  htmlStyle?: Record<string, string>
}

defineOptions({
  name: 'SyntaxCodeBlock',
})

const props = withDefaults(defineProps<SyntaxCodeBlockProps>(), {
  lightTheme: 'vitesse-light',
  darkTheme: 'vitesse-dark',
  isDark: false,
  enableAnimate: false,
})

const code = computed(() => props.code.trim())

const language = computed(() => props.language || 'text')

const actualTheme = computed(() => (props.isDark ? props.darkTheme : props.lightTheme))

const { lines, preStyle } = useHighlight(code, {
  language,
  theme: actualTheme,
  colorReplacements: props.colorReplacements,
})

const applyColorReplacement = (color: string, replacements?: Record<string, string>) => {
  if (!replacements) return color
  return replacements[color.toLowerCase()] || color
}

const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

const getTokenStyle = (token: HighlightToken | null | undefined): CSSProperties => {
  // 处理 null/undefined token
  if (!token) {
    return {}
  }

  // 优先使用 htmlStyle（如果存在）
  if (token.htmlStyle) {
    const baseStyle = normalizeStyleKeys(token.htmlStyle)

    if (!props.colorReplacements) return baseStyle

    const style = { ...baseStyle }

    if (style.color && typeof style.color === 'string') {
      style.color = applyColorReplacement(style.color, props.colorReplacements)
    }
    if (style.backgroundColor && typeof style.backgroundColor === 'string') {
      style.backgroundColor = applyColorReplacement(style.backgroundColor, props.colorReplacements)
    }

    return style
  }

  // 直接使用 token 的 color、fontStyle、fontWeight 属性
  const style: CSSProperties = {}

  if (token.color) {
    style.color = props.colorReplacements
      ? applyColorReplacement(token.color, props.colorReplacements)
      : token.color
  }

  if (token.fontStyle === 'italic') {
    style.fontStyle = 'italic'
  }

  if (token.fontWeight) {
    style.fontWeight = token.fontWeight
  }

  return style
}

const showFallback = computed(() => !lines.value?.length)

const codeContainerStyle = computed(() => ({
  ...preStyle.value,
  maxHeight: props.codeMaxHeight,
}))

defineExpose({
  lines,
  code,
  language,
  actualTheme,
})
</script>

<style scoped>
.x-md-syntax-code-block {
  width: 100%;
}

.x-md-syntax-code-block pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: transparent !important;
}

.x-md-code-content {
  display: flex;
  flex-direction: column;
}

.x-md-code-line {
  width: 100%;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
}
</style>