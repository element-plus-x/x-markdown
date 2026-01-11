<div align="center">

# X-Markdown

一个功能强大的 Vue 3 Markdown 渲染组件库

支持流式渲染、代码高亮、LaTeX 数学公式、Mermaid 图表等特性

[![NPM version](https://img.shields.io/npm/v/x-markdown-vue.svg)](https://www.npmjs.com/package/x-markdown-vue)
[![NPM downloads](https://img.shields.io/npm/dm/x-markdown-vue.svg)](https://www.npmjs.com/package/x-markdown-vue)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)

<div align="center">

[在线演示](https://x-markdown.netlify.app/) · [报告问题](https://github.com/element-plus-x/x-markdown/issues) · [功能请求](https://github.com/element-plus-x/x-markdown/issues/new)

</div>

</div>

## ✨ 特性

- 🚀 **Vue 3 组合式 API** - 基于 Vue 3 Composition API 构建
- 📝 **GitHub Flavored Markdown** - 完整支持 GFM 语法
- 🎨 **代码高亮** - 基于 Shiki，支持 100+ 语言和多种主题
  - ⚡ **Highlighter 缓存** - 智能缓存机制，避免重复创建实例
  - 🌊 **流式高亮** - shiki-stream 支持 AI 流式输出场景
- 🧮 **LaTeX 数学公式** - 支持行内和块级数学公式渲染
- 📊 **Mermaid 图表** - 支持流程图、时序图等多种图表
- 🌗 **深色模式** - 内置深浅色主题切换支持
- 🔌 **高度可定制** - 支持自定义渲染、插槽和属性
- 🎭 **灵活的插件系统** - 支持 remark 和 rehype 插件扩展
- 🔒 **安全可靠** - 可选的 HTML 内容清理和消毒
- 🔧 **Vite 插件** - 自动检测可选依赖，优雅降级
- 📦 **Monorepo 架构** - 使用 pnpm workspace 和 Turbo 管理
- 🎯 **清爽体验** - 优化的控制台输出，无多余调试信息

## 📦 安装

```bash
# pnpm (推荐)
pnpm add x-markdown-vue

# npm
npm install x-markdown-vue

# yarn
yarn add x-markdown-vue
```

### 依赖项

确保安装了对等依赖:

```bash
# 必需依赖
pnpm add vue@^3.3.0

# 可选依赖（推荐安装以获得完整功能）
pnpm add shiki@^1.0.0 || ^3.0.0
pnpm add shiki-stream@^0.1.4
pnpm add mermaid@^10.0.0 || ^11.0.0
```

如果需要 LaTeX 支持，还需要引入 KaTeX 样式:

```ts
import 'katex/dist/katex.min.css'
```

## 🚀 快速开始

### Vite 配置（推荐）

使用内置的 Vite 插件自动检测可选依赖：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createXMarkdownVitePlugin } from 'x-markdown-vue/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    // x-markdown 可选依赖自动检测插件
    createXMarkdownVitePlugin({
      showConsoleHints: true, // 显示控制台提示（默认）
    }),
  ],
})
```

**插件功能**：
- ✅ 自动检测 `shiki`、`shiki-stream`、`mermaid` 是否安装
- ✅ 未安装时提供友好的控制台提示
- ✅ 支持虚拟模块，优雅降级
- ✅ 不影响生产构建
- ✅ 零配置，开箱即用

**插件配置选项**：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showConsoleHints` | `boolean` | `true` | 是否显示控制台提示 |

**完整的 Vite 配置示例**：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createXMarkdownVitePlugin } from 'x-markdown-vue/vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    createXMarkdownVitePlugin({
      showConsoleHints: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 其他 Vite 配置...
})
```

**如果不使用插件**：

如果你不想使用 Vite 插件，也可以手动配置可选依赖的虚拟模块：

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 手动配置虚拟模块（不推荐）
      'shiki': 'shiki/virtual',
      'shiki-stream': 'shiki-stream/virtual',
      'mermaid': 'mermaid/virtual',
    },
  },
})
```

> ⚠️ **注意**：不使用插件时，你需要自己处理可选依赖的加载和降级逻辑。推荐使用插件以获得最佳体验。

### 基础用法

```vue
<template>
  <MarkdownRenderer :markdown="content" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MarkdownRenderer } from 'x-markdown-vue'
import 'x-markdown-vue/style'

const content = ref(`
# Hello World

This is a **markdown** renderer.
`)
</script>
```

### 异步渲染

对于大型文档，可以使用异步渲染模式:

```vue
<template>
  <Suspense>
    <MarkdownRendererAsync :markdown="content" />
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MarkdownRendererAsync } from 'x-markdown-vue'
import 'x-markdown-vue/style'

const content = ref('# Large Document\n...')
</script>
```

## 📖 配置选项

### Props 属性

| 属性                  | 类型                | 默认值      | 说明                        |
| --------------------- | ------------------- | ----------- | --------------------------- |
| `markdown`            | `string`            | `''`        | Markdown 字符串内容         |
| `allowHtml`           | `boolean`           | `false`     | 是否允许渲染 HTML           |
| `enableLatex`         | `boolean`           | `true`      | 是否启用 LaTeX 数学公式支持 |
| `enableAnimate`       | `boolean`           | `false`     | 是否启用流式动画效果        |
| `enableBreaks`        | `boolean`           | `true`      | 是否将换行符转换为 `<br>`   |
| `isDark`              | `boolean`           | `false`     | 是否为深色模式              |
| `showCodeBlockHeader` | `boolean`           | `true`      | 是否显示代码块头部          |
| `codeMaxHeight`       | `string`            | `undefined` | 代码块最大高度，如 '300px'  |
| `codeBlockActions`    | `CodeBlockAction[]` | `[]`        | 代码块自定义操作按钮        |
| `mermaidActions`      | `MermaidAction[]`   | `[]`        | Mermaid 图表自定义操作按钮  |
| `codeXRender`         | `object`            | `{}`        | 自定义代码块渲染函数        |
| `customAttrs`         | `CustomAttrs`       | `{}`        | 自定义属性对象              |
| `remarkPlugins`       | `PluggableList`     | `[]`        | remark 插件列表             |
| `rehypePlugins`       | `PluggableList`     | `[]`        | rehype 插件列表             |
| `sanitize`            | `boolean`           | `false`     | 是否启用内容清洗            |
| `sanitizeOptions`     | `SanitizeOptions`   | `{}`        | 清洗配置选项                |

## 🎨 主题配置

### 深色模式

通过 `isDark` 属性控制整体主题：

```vue
<template>
  <MarkdownRenderer :markdown="content" :is-dark="isDark" />
</template>

<script setup>
import { ref } from 'vue'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
}
</script>
```

### 代码高亮主题

支持所有 [Shiki 内置主题](https://shiki.style/themes)。

## 🔧 自定义渲染

### 自定义属性

通过 `customAttrs` 为 Markdown 元素添加自定义属性：

```vue
<MarkdownRenderer
  :markdown="content"
  :custom-attrs="{
    heading: (node, { level }) => ({
      class: ['heading', `heading-${level}`],
      id: `heading-${level}`,
    }),
    a: (node) => ({
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  }"
/>
```

### 自定义插槽

组件提供了强大的插槽系统，可以自定义任何 Markdown 元素的渲染：

```vue
<MarkdownRenderer :markdown="content">
  <!-- 自定义标题渲染 -->
  <template #heading="{ node, level, children }">
    <component :is="`h${level}`" class="custom-heading">
      <a :href="`#heading-${level}`" class="anchor">#</a>
      <component :is="children" />
    </component>
  </template>

  <!-- 自定义引用块渲染 -->
  <template #blockquote="{ children }">
    <blockquote class="custom-blockquote">
      <div class="quote-icon">💬</div>
      <component :is="children" />
    </blockquote>
  </template>

  <!-- 自定义链接渲染 -->
  <template #a="{ node, children }">
    <a :href="node?.properties?.href" target="_blank" class="custom-link">
      <component :is="children" />
      <span class="external-icon">↗</span>
    </a>
  </template>
</MarkdownRenderer>
```

#### 支持的插槽类型

- `heading` / `h1` ~ `h6` - 标题
- `code` / `inline-code` / `block-code` - 代码
- `blockquote` - 引用块
- `list` / `ul` / `ol` / `li` / `list-item` - 列表
- `table` / `thead` / `tbody` / `tr` / `td` / `th` - 表格
- `a` / `img` / `p` / `strong` / `em` - 行内元素
- 以及所有标准 HTML 标签名

### 自定义代码块渲染器

通过 `codeXRender` 自定义特定语言的代码块渲染：

```vue
<script setup>
import { h } from 'vue'
import EchartsRenderer from './EchartsRenderer.vue'

const codeXRender = {
  // 自定义 echarts 代码块渲染
  echarts: (props) => h(EchartsRenderer, { code: props.raw.content }),
  // 自定义行内代码渲染
  inline: (props) => h('code', { class: 'custom-inline' }, props.raw.content),
}
</script>

<template>
  <MarkdownRenderer :markdown="content" :code-x-render="codeXRender" />
</template>
```

## 🌊 流式渲染动画

启用 `enableAnimate` 属性后，代码块中的每个 token 会添加 `x-md-animated-word` class，可配合 CSS 实现流式输出动画效果：

```vue
<MarkdownRenderer :markdown="content" :enable-animate="true" />
```

```css
/* 自定义动画样式 */
.x-md-animated-word {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

## ⚡ 性能优化

### Highlighter 缓存机制

x-markdown 内置智能 highlighter 缓存系统：

```typescript
// 按主题缓存 highlighter 实例
const highlighterCache = new Map<string, any>()

// 避免重复创建，提高性能
if (!highlighterCache.has(cacheKey)) {
  highlighter = await createHighlighter({ themes: [theme] })
  highlighterCache.set(cacheKey, highlighter)
}
```

**优化效果**：
- ✅ 避免 Shiki 单例警告
- ✅ 提升初始化性能
- ✅ 减少内存占用
- ✅ 支持多主题切换

### 优雅降级策略

当可选依赖未安装时，自动降级而不影响核心功能：

```typescript
// shiki 未安装 → 降级为纯文本代码块
// shiki-stream 未安装 → 使用 shiki 静态高亮
// mermaid 未安装 → 显示 mermaid 源码
```

### 控制台优化

清理了不必要的调试信息，提供清爽的开发体验：

- ❌ 移除流式高亮错误日志
- ❌ 移除 Mermaid 渲染状态日志
- ✅ 保留友好的依赖安装提示

## 🔌 插件系统

### remark 插件

```vue
<script setup>
import remarkEmoji from 'remark-emoji'

const remarkPlugins = [remarkEmoji]
</script>

<template>
  <MarkdownRenderer :markdown="content" :remark-plugins="remarkPlugins" />
</template>
```

### rehype 插件

```vue
<script setup>
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

const rehypePlugins = [rehypeSlug, rehypeAutolinkHeadings]
</script>

<template>
  <MarkdownRenderer :markdown="content" :rehype-plugins="rehypePlugins" />
</template>
```

## 🛡️ 安全配置

启用内容清洗以防止 XSS 攻击：

```vue
<MarkdownRenderer
  :markdown="untrustedContent"
  :sanitize="true"
  :sanitize-options="{
    allowedTags: ['h1', 'h2', 'p', 'a', 'code', 'pre'],
    allowedAttributes: {
      a: ['href', 'target'],
    },
  }"
/>
```

## 🎯 代码块自定义操作

通过 `codeBlockActions` 属性，可以为代码块添加自定义操作按钮，实现代码运行、复制、格式化等功能。

### CodeBlockAction 类型定义

```typescript
interface CodeBlockAction {
  key: string;                                          // 操作的唯一标识
  icon?: Component | FunctionalComponent | string | IconRenderFn;  // 图标（组件、SVG字符串或渲染函数）
  title?: string;                                       // 悬停提示文字
  onClick?: (props: CodeBlockSlotProps) => void;       // 点击回调函数
  disabled?: boolean;                                   // 是否禁用
  class?: string;                                       // 自定义 CSS 类名
  style?: Record<string, string>;                       // 自定义样式
  show?: (props: CodeBlockSlotProps) => boolean;       // 控制按钮显示逻辑
}

interface CodeBlockSlotProps {
  language: string;           // 代码块语言
  code: string;               // 代码内容
  copy: (text: string) => void;  // 复制函数
  copied: boolean;            // 是否已复制
  collapsed: boolean;         // 是否折叠
  toggleCollapse: () => void; // 切换折叠状态
}
```

### 基础用法

```vue
<script setup lang="ts">
import { MarkdownRenderer } from 'x-markdown-vue'
import type { CodeBlockAction } from 'x-markdown-vue'

const codeBlockActions: CodeBlockAction[] = [
  {
    key: 'run',
    title: '运行代码',
    // 使用 SVG 字符串作为图标
    icon: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>',
    onClick: (props) => {
      console.log('运行代码:', props.code)
      alert(`运行 ${props.language} 代码`)
    },
    // 仅在 JavaScript/TypeScript 代码块显示
    show: (props) => ['javascript', 'typescript', 'js', 'ts'].includes(props.language),
  },
  {
    key: 'format',
    title: '格式化代码',
    icon: '✨',
    onClick: (props) => {
      // 格式化代码逻辑
      console.log('格式化代码:', props.code)
    },
  },
]
</script>

<template>
  <MarkdownRenderer :markdown="content" :code-block-actions="codeBlockActions" />
</template>
```

## 📊 Mermaid 图表自定义操作

通过 `mermaidActions` 属性，可以为 Mermaid 图表添加自定义操作按钮，实现图表编辑、导出、分享等功能。

### MermaidAction 类型定义

```typescript
interface MermaidAction {
  key: string;                                          // 操作的唯一标识
  icon?: Component | FunctionalComponent | string | MermaidIconRenderFn;  // 图标
  title?: string;                                       // 悬停提示文字
  onClick?: (props: MermaidSlotProps) => void;         // 点击回调函数
  disabled?: boolean;                                   // 是否禁用
  class?: string;                                       // 自定义 CSS 类名
  style?: Record<string, string>;                       // 自定义样式
  show?: (props: MermaidSlotProps) => boolean;         // 控制按钮显示逻辑
}

interface MermaidSlotProps {
  showSourceCode: boolean;      // 是否显示源码
  svg: string;                  // SVG 内容
  rawContent: string;           // 原始 Mermaid 代码
  isLoading: boolean;           // 是否加载中
  copied: boolean;              // 是否已复制
  zoomIn: () => void;           // 放大
  zoomOut: () => void;          // 缩小
  reset: () => void;            // 重置缩放
  fullscreen: () => void;       // 全屏显示
  toggleCode: () => void;       // 切换源码显示
  copyCode: () => Promise<void>; // 复制源码
  download: () => void;         // 下载 SVG
  raw: any;                     // 原始数据对象
}
```

## 🌟 功能演示

### 代码高亮

支持 100+ 编程语言的语法高亮，基于 Shiki 引擎：

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`)
}
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```
````

### LaTeX 数学公式

支持行内和块级数学公式：

```markdown
行内公式: $E = mc^2$

块级公式:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
```

### Mermaid 图表

X-Markdown 支持完整的 Mermaid 图表渲染。

## 💡 使用场景

- **AI 对话应用** - 支持流式渲染，适合 ChatGPT 类应用
- **技术文档站点** - 完整的 Markdown 支持，代码高亮
- **博客系统** - 丰富的格式支持和自定义能力
- **在线编辑器** - 实时预览 Markdown 内容
- **知识库系统** - 支持数学公式和图表

## 🔧 技术栈

- **[Vue 3](https://vuejs.org/)** - 渐进式 JavaScript 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript 超集
- **[Unified](https://unifiedjs.com/)** - Markdown/HTML 处理生态系统
  - **[remark](https://remark.js.org/)** - Markdown 解析器
  - **[rehype](https://github.com/rehypejs/rehype)** - HTML 处理器
- **[Shiki](https://shiki.style/)** - 语法高亮引擎
- **[KaTeX](https://katex.org/)** - 数学公式渲染
- **[Mermaid](https://mermaid.js.org/)** - 图表生成
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - HTML 清理工具
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **[Turbo](https://turbo.build/)** - 高性能构建系统

## 📁 项目结构

```
x-markdown/
├── packages/
│   ├── x-markdown/          # 核心组件库
│   │   ├── src/
│   │   │   ├── components/  # Vue 组件
│   │   │   │   ├── CodeBlock/   # 代码块组件
│   │   │   │   ├── CodeLine/    # 行内代码组件
│   │   │   │   ├── CodeX/       # 代码渲染调度器
│   │   │   │   └── Mermaid/     # Mermaid 图表组件
│   │   │   ├── core/        # 核心渲染逻辑
│   │   │   ├── hooks/       # 组合式函数
│   │   │   ├── plugins/     # 内置插件
│   │   │   └── MarkdownRender/  # 主渲染组件
│   │   └── package.json
│   └── playground/          # 演示应用
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发指南

```bash
# 克隆仓库
git clone https://github.com/element-plus-x/x-markdown.git
cd x-markdown

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 格式化代码
pnpm format
```

## 📄 License

[MIT](./LICENSE) License © 2025 [element-plus-x](https://github.com/element-plus-x)

---

<div align="center">

如果这个项目对你有帮助，请给它一个 ⭐️

</div>
