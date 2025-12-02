<template>
  <div>
    <StreamRenderer
      :code="props?.raw?.content || ''"
      language="typescript"
    />
  </div>
</template>
<script lang="ts" setup>
import type { CodeBlockProps } from './types';
import StreamRenderer from './StreamRenderer.vue';
const props = defineProps<CodeBlockProps>()
</script>
