<script setup lang="ts">
import { computed } from 'vue';
import type { CodeLineProps } from '../../types';

const props = withDefaults(defineProps<CodeLineProps>(), {
  raw: () => ({}),
  content: ''
});

// 获取实际内容
const content = computed(() => {
  const result = props.raw?.content || props.content || '';
  return result;
});
</script>

<template>
  <span class="inline-code-tag">
    {{ content }}
  </span>
</template>

<style scoped>
.inline-code-tag {
  display: inline;
  background: #d7e2f8;
  padding: 0 4px;
  margin: 0 4px;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid #d7e2f8;
  word-wrap: break-word;
  word-break: break-all;
  line-height: 2;
}
</style>
