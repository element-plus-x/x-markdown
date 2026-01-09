<template>
  <!-- 行内代码容器 - 支持深浅色主题和语法高亮 -->
  <div
    class="x-md-inline-code"
    :class="{
      'x-md-inline-code--dark': props.isDark,
      'x-md-animated-word': props.enableAnimate,
    }"
  >
    <code :style="codeStyle">
      <!-- 无高亮时显示纯文本 -->
      <template v-if="!flatTokens.length">{{ content }}</template>
      <!-- 有高亮时渲染 token -->
      <template v-else>
        <span
          v-for="(token, i) in flatTokens"
          :key="i"
          :style="getTokenStyle(token)"
          :class="{ 'x-md-animated-word': props.enableAnimate }"
          >{{ token.content }}</span
        >
      </template>
    </code>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type CSSProperties } from 'vue'
import type { ThemedToken } from 'shiki'
import { useHighlight } from '../../hooks/useHighlight'
import type { CodeLineProps } from './types'

const SHIKI_CORE_PKG = '@shikijs/core'

let getTokenStyleObjectFn: any = null

onMounted(async () => {
  const mod = await (Function(`return import('${SHIKI_CORE_PKG}')`)())
    .catch(() => {
      return { getTokenStyleObject: () => ({}) }
    })
  getTokenStyleObjectFn = mod.getTokenStyleObject
})

const props = withDefaults(defineProps<CodeLineProps>(), {
  raw: () => ({}),
  isDark: false,
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [import('shiki').BuiltinTheme, import('shiki').BuiltinTheme],
  enableAnimate: false,
})

const content = computed(() => props.raw?.content ?? '')
const language = computed(() => props.raw?.language || 'ts')
const actualTheme = computed(() => (props.isDark ? props.shikiTheme[1] : props.shikiTheme[0]))

const { lines, preStyle } = useHighlight(content, {
  language,
  theme: actualTheme,
})

const flatTokens = computed(() => lines.value.flat())
const codeStyle = computed<CSSProperties>(() => preStyle.value || {})

const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

const getTokenStyle = (token: ThemedToken): CSSProperties => {
  if (token.htmlStyle) {
    return normalizeStyleKeys(token.htmlStyle)
  }

  if (!getTokenStyleObjectFn) {
    return {}
  }

  const rawStyle = getTokenStyleObjectFn(token)
  return normalizeStyleKeys(rawStyle)
}
</script>
<style scoped>
.x-md-inline-code {
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.03);
  vertical-align: sub;
}

.x-md-inline-code.x-md-inline-code--dark {
  background: rgba(255, 255, 255, 0.13);
}
.x-md-inline-code code {
  background: transparent !important;
}
</style>
