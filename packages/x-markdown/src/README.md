# X-Markdown 使用指南

## 基础用法

```vue
<template>
  <!-- 同步渲染 -->
  <MarkdownRenderer :markdown="content" />

  <!-- 异步渲染（适用于大型文档） -->
  <Suspense>
    <MarkdownRendererAsync :markdown="content" />
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MarkdownRenderer, MarkdownRendererAsync } from 'x-markdown'
import 'x-markdown/style'

const content = ref('# Hello World')
</script>
```

## Props 属性

| 属性            | 类型            | 默认值  | 说明             |
| --------------- | --------------- | ------- | ---------------- |
| `markdown`      | `string`        | `''`    | Markdown 内容    |
| `allowHtml`     | `boolean`       | `false` | 是否允许 HTML    |
| `enableLatex`   | `boolean`       | `true`  | 是否启用 LaTeX   |
| `enableAnimate` | `boolean`       | `false` | 是否启用流式动画 |
| `enableBreaks`  | `boolean`       | `true`  | 换行转 `<br>`    |
| `isDark`        | `boolean`       | `false` | 深色模式         |
| `codeXProps`    | `CodeXProps`    | `{}`    | 代码块配置       |
| `codeXRender`   | `object`        | `{}`    | 自定义代码块渲染 |
| `codeXSlots`    | `object`        | `{}`    | 代码块插槽       |
| `customAttrs`   | `CustomAttrs`   | `{}`    | 自定义属性       |
| `remarkPlugins` | `PluggableList` | `[]`    | remark 插件      |
| `rehypePlugins` | `PluggableList` | `[]`    | rehype 插件      |

## 自定义属性

通过 `customAttrs` 为元素添加自定义属性：

```ts
const customAttrs = {
  heading: (node, { level }) => ({
    class: ['heading', `heading-${level}`],
  }),
  a: (node) => ({
    target: '_blank',
    rel: 'noopener noreferrer',
  }),
}
```

## 自定义插槽

组件提供多个插槽用于自定义渲染：

```vue
<MarkdownRenderer :markdown="content">
  <!-- 自定义标题 -->
  <template #heading="{ node, level, children }">
    <component :is="`h${level}`" class="custom-heading">
      <component :is="children" />
    </component>
  </template>

  <!-- 自定义引用块 -->
  <template #blockquote="{ children }">
    <blockquote class="custom-blockquote">
      <component :is="children" />
    </blockquote>
  </template>
</MarkdownRenderer>
```

## 代码块配置

### codeXProps 代码块属性

```vue
<MarkdownRenderer
  :markdown="content"
  :code-x-props="{
    codeLightTheme: 'github-light',
    codeDarkTheme: 'github-dark',
    showCodeBlockHeader: true,
    codeMaxHeight: '400px',
  }"
/>
```

### codeXRender 自定义渲染器

```ts
const codeXRender = {
  // 自定义 echarts 代码块
  echarts: (props) => h(EchartsRenderer, { code: props.raw.content }),
  // 自定义行内代码
  inline: (props) => h('code', { class: 'custom' }, props.raw.content),
}
```

### codeXSlots 代码块插槽

```ts
const codeXSlots = {
  header: ({ language, code, copy, copied }) => {
    /* 自定义头部 */
  },
  'header-left': ({ language }) => {
    /* 左侧区域 */
  },
  'header-right': ({ code, copy }) => {
    /* 右侧区域 */
  },
}
```

## 流式渲染动画

启用 `enableAnimate` 后，代码 token 会添加 `x-md-animated-word` class：

```vue
<MarkdownRenderer :markdown="content" :enable-animate="true" />
```

```css
.x-md-animated-word {
  animation: fadeIn 0.3s ease-in-out;
}
```
