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
import { computed, onMounted, type CSSProperties } from 'vue'
import { useHighlight } from '../../hooks/useHighlight'
import type { SyntaxCodeBlockProps } from './types'

// 动态加载 getTokenStyleObject，支持优雅降级
// 使用变量名存储模块路径，避免 Vite 静态分析
const SHIKI_CORE_PKG = '@shikijs/core'

let getTokenStyleObjectFn: any = null

onMounted(async () => {
  const mod = await (Function(`return import('${SHIKI_CORE_PKG}')`)())
    .catch(() => {
      // @shikijs/core 不可用时，使用空函数作为降级
      // 此时 token.htmlStyle 应该已经被 useHighlight 填充
      return { getTokenStyleObject: () => ({}) }
    })
  getTokenStyleObjectFn = mod.getTokenStyleObject
})

// 本地 Token 类型（与 useHighlight.ts 保持一致）
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

const getTokenStyle = (token: HighlightToken): CSSProperties => {
  // 优先使用 token.htmlStyle（降级模式下 useHighlight 会填充这个）
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

  // 如果 @shikijs/core 还没加载完成，返回空样式
  if (!getTokenStyleObjectFn) {
    return {}
  }

  // 使用动态加载的 getTokenStyleObject
  const rawStyle = getTokenStyleObjectFn(token as any)
  const baseStyle = normalizeStyleKeys(rawStyle)

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