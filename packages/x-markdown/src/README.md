# 使用

```vue
import {MarkdownRenderer,MarkdownRendererAsync} from '@/components/Markdown';

<template>
  // 同步渲染
  <MarkdownRenderer class="markdown-render" :markdown="content" />

  // 异步渲染
  <Suspense>
    <MarkdownRendererAsync class="markdown-render" :markdown="content" />
  </Suspense>
</template>
```

## 属性

### customAttrs 自定义属性支持

通过 `customAttrs` 可以对 Markdown 渲染的节点动态添加自定义属性：

```ts
const customAttrs = {
  heading: (node, { level }) => ({
    class: ['heading', `heading-${level}`]
  }),
  a: node => ({
    target: '_blank',
    rel: 'noopener noreferrer'
  })
};
```

### 插槽

> 组件提供了多个插槽，可以自定义渲染，标签即为插槽,你可以接管任何插槽，自定义渲染逻辑。

**请注意：组件内部拦截了code标签的渲染，支持高亮代码块，mermaid图表等。如果你需要自定义渲染，可以接管code插槽。**

```vue
<header></header>

<MarkdownRenderer>
 <template #heading="{ node, level }">
   可自定义标题渲染
 </template>
</MarkdownRenderer>
```

### 代码块渲染

组件内置了代码块渲染器，支持高亮代码块，mermaid图表等。
codeXSlot自定义代码块顶部
可通过 codeXRender 属性自定义代码块语言渲染器，如下可以自定义 echarts 渲染器：

```text
codeXRender: {
  echarts: (props) => {
    return h()
  },
}
```
