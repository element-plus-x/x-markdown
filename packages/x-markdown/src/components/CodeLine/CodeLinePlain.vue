<template>
  <!-- 行内代码容器 - 纯文本版本，不使用 Shiki -->
  <div
    class="x-md-inline-code"
    :class="{
      'x-md-inline-code--dark': props.isDark,
      'x-md-animated-word': props.enableAnimate,
    }"
  >
    <code>{{ content }}</code>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CodeLinePlainProps {
  raw?: {
    content?: string
    language?: string
  }
  isDark?: boolean
  enableAnimate?: boolean
}

const props = withDefaults(defineProps<CodeLinePlainProps>(), {
  raw: () => ({}),
  isDark: false,
  enableAnimate: false,
})

const content = computed(() => props.raw?.content ?? '')
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
  padding: 2px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
