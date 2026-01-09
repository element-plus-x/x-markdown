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

// 定义组件 props，支持行内代码的原始数据、主题配置和动画开关
const props = withDefaults(defineProps<CodeLineProps>(), {
  raw: () => ({}),
  isDark: false, // 默认亮色模式
  shikiTheme: () => ['vitesse-light', 'vitesse-dark'] as [import('shiki').BuiltinTheme, import('shiki').BuiltinTheme], // 默认主题
  enableAnimate: false, // 默认不启用动画
})

// 获取实际内容 - 从 raw 对象中提取代码内容
const content = computed(() => props.raw?.content ?? '')

// 获取代码语言
const language = computed(() => props.raw?.language || 'ts')

// 当前使用的主题
const actualTheme = computed(() => (props.isDark ? props.shikiTheme[1] : props.shikiTheme[0]))

// 使用 useHighlight hook 进行语法高亮
const { lines, preStyle } = useHighlight(content, {
  language,
  theme: actualTheme,
})

// 扁平化 tokens（行内代码只有一行，将二维数组拍平）
const flatTokens = computed(() => lines.value.flat())

// 代码背景样式 - 从 preStyle 中获取
const codeStyle = computed<CSSProperties>(() => preStyle.value || {})

// 将 CSS 属性名从 kebab-case 转为 camelCase
const normalizeStyleKeys = (style: Record<string, string | number>): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as Record<string, string | number>)[camelKey] = value
  })
  return normalized
}

// 获取 token 样式
const getTokenStyle = (token: ThemedToken): CSSProperties => {
  // 优先使用 token.htmlStyle（降级模式下 useHighlight 会填充这个）
  if (token.htmlStyle) {
    return normalizeStyleKeys(token.htmlStyle)
  }

  // 如果 @shikijs/core 还没加载完成，返回空样式
  if (!getTokenStyleObjectFn) {
    return {}
  }

  // 使用动态加载的 getTokenStyleObject
  const rawStyle = getTokenStyleObjectFn(token)
  return normalizeStyleKeys(rawStyle)
}
</script>
<style scoped>
/* 代码块容器 */
.x-md-inline-code {
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.03);
  vertical-align: sub;
}

/* 暗色主题容器 */
.x-md-inline-code.x-md-inline-code--dark {
  background: rgba(255, 255, 255, 0.13);
}
.x-md-inline-code code {
  background: transparent !important;
}
</style>
