<template>
  <div class="x-md-syntax-code-block" :class="{ 'x-md-syntax-code-block--dark': props.isDark }">
    <pre v-if="showFallback" :style="codeContainerStyle" tabindex="0">
      <code class="x-md-code-content">
        <span v-for="(line, i) in fallbackLines" :key="i" class="x-md-code-line">
          <span v-if="props.enableCodeLineNumber" class="x-md-code-line-number" aria-hidden="true">{{
            i + codeLineNumberStartResolved
          }}</span>
          <span class="x-md-code-line-code">{{ line}}</span>
        </span>
      </code>
    </pre>
    <pre v-else :class="['shiki', actualTheme]" :style="codeContainerStyle" tabindex="0">
      <code class="x-md-code-content">
        <span v-for="(line, i) in lines" :key="i" class="x-md-code-line">
          <span v-if="props.enableCodeLineNumber" class="x-md-code-line-number" aria-hidden="true">{{
            i + codeLineNumberStartResolved
          }}</span>
          <span class="x-md-code-line-code">
            <span v-if="!line.length">&nbsp;</span>
            <span
              v-else
              v-for="(token, j) in line"
              :key="j"
              :style="getTokenStyle(token)"
              :class="{ 'x-md-animated-word': props.enableAnimate }"
              >{{ token.content }}</span
            >
          </span>
        </span>
      </code>
    </pre>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { ThemedToken, BuiltinTheme } from 'shiki'
import { getTokenStyleObject } from '@shikijs/core'
import { useHighlight } from '../../hooks/useHighlight'
import type { SyntaxCodeBlockProps } from './types'

defineOptions({
  name: 'SyntaxCodeBlock',
})

const props = withDefaults(defineProps<SyntaxCodeBlockProps>(), {
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [BuiltinTheme, BuiltinTheme],
  isDark: false,
  enableAnimate: false,
  enableCodeLineNumber: true,
  codeLineNumberStart: 1,
})

const code = computed(() => props.code.trim())

const language = computed(() => props.language || 'text')

const actualTheme = computed(() => (props.isDark ? props.shikiTheme[1] : props.shikiTheme[0]))

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

const getTokenStyle = (token: ThemedToken): CSSProperties => {
  const rawStyle = token.htmlStyle || getTokenStyleObject(token)
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

const codeLineNumberStartResolved = computed(() => {
  if(typeof props.codeLineNumberStart !== 'number' || Number.isNaN(props.codeLineNumberStart)) return 1

  return Math.floor(props.codeLineNumberStart)
})

const fallbackLines = computed(() => {
  const t = code.value
  if (!t) return ['']
  return t.split('\n')
})

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
  align-items: flex-start;
}

.x-md-code-line-number {
  flex-shrink: 0;
  min-width: 3ch;
  padding-right: 1em;
  margin-right: 0.25em;
  text-align: right;
  user-select: none;
  color: rgba(100, 100, 100, 0.85);
  font-variant-numeric: tabular-nums;
}

.x-md-syntax-code-block--dark .x-md-code-line-number {
  color: rgba(200, 200, 200, 0.55);
}

.x-md-code-line-code {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
}
</style>
