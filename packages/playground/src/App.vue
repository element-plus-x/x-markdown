<template>
  <div id="app" :class="{ 'app-dark': isDark }">
    <!-- 顶部标题栏 -->
    <header class="header">
      <div class="header-content">
        <h1>🚀 X-Markdown Playground</h1>
        <p>Vue 3 Markdown 组件库 - 支持流式渲染、代码高亮、LaTeX、Mermaid</p>
      </div>
      <div class="header-actions">
        <!-- 流式演示控制 -->
        <button @click="startStreaming" :disabled="isStreaming" class="action-btn primary">
          {{ isStreaming ? '⏳ 流式中...' : '▶️ 流式演示' }}
        </button>
        <button @click="resetContent" class="action-btn">🔄 重置</button>
        <!-- 主题切换 -->
        <button @click="toggleTheme" class="theme-toggle">
          {{ isDark ? '🌞 亮色' : '🌙 暗色' }}
        </button>
      </div>
    </header>

    <!-- 配置区域 - 放在顶部 -->
    <div class="config-bar">
      <!-- 渲染选项 -->
      <div class="config-section">
        <div class="config-title">⚙️ 渲染选项</div>
        <div class="config-content">
          <label>
            <input type="checkbox" v-model="enableLatex" />
            LaTeX 数学
          </label>
          <label>
            <input type="checkbox" v-model="allowHtml" />
            允许 HTML
          </label>
          <label>
            <input type="checkbox" v-model="enableBreaks" />
            换行转 br
          </label>
          <label>
            <input type="checkbox" v-model="enableAnimate" />
            动画效果
          </label>
          <label>
            <input type="checkbox" v-model="useCustomSlots" />
            自定义插槽
          </label>
        </div>
      </div>

      <!-- 代码块配置 -->
      <div class="config-section">
        <div class="config-title">📦 代码块配置</div>
        <div class="config-content">
          <label>
            <input type="checkbox" v-model="showCodeBlockHeader" />
            显示代码块头部
          </label>
          <label class="code-max-height-label">
            代码块最大高度
            <input type="text" v-model="codeMaxHeight" placeholder="如: 300px" class="code-max-height-input" />
          </label>
        </div>
      </div>

      <!-- 流式速度控制 -->
      <div class="config-section speed-section">
        <div class="config-title">🎚️ 流式控制</div>
        <div class="config-content speed-content">
          <label>速度：</label>
          <input type="range" v-model.number="streamSpeed" min="10" max="150" step="10" />
          <span class="speed-value">{{ streamSpeed }}ms</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: streamProgress + '%' }"></div>
            <span class="progress-text" :class="{ 'on-fill': streamProgress > 50 }"
              >{{ streamProgress.toFixed(1) }}%</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- 左侧：编辑器面板 -->
      <div class="editor-panel">
        <div class="panel-header">
          <h2>📝 Markdown 编辑器</h2>
          <span class="char-count">{{ markdown.length }} 字符</span>
        </div>

        <textarea v-model="markdown" class="editor" placeholder="在此输入 Markdown 内容..."></textarea>
      </div>

      <!-- 右侧：预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h2>👁️ 实时预览</h2>
          <span v-if="useCustomSlots" class="slot-badge">✨ 自定义渲染</span>
        </div>
        <div class="preview-content markdown-body">
          <MarkdownRenderer
            :markdown="markdown"
            :enable-latex="enableLatex"
            :allow-html="allowHtml"
            :enable-breaks="enableBreaks"
            :enable-animate="enableAnimate"
            :is-dark="isDark"
            :code-x-props="codeXProps"
            :code-x-slots="useCustomSlots ? codeXSlots : undefined"
          >
            <!-- 自定义 blockquote：添加引用图标 -->
            <template v-if="useCustomSlots" #blockquote="{ children }">
              <blockquote class="custom-blockquote">
                <div class="quote-icon">💬</div>
                <div class="quote-content">
                  <component :is="children" />
                </div>
              </blockquote>
            </template>
            <template #self-btn>
              <button>点击button</button>
            </template>
            <template #tip>
              <div class="tip">角标</div>
            </template>
            <!-- 自定义链接：添加外链图标 -->
            <template v-if="useCustomSlots" #a="{ children, ...props }">
              <a :href="props?.href" target="_blank" rel="noopener noreferrer" class="custom-link">
                <component :is="children" />
                <span class="link-icon">↗</span>
              </a>
            </template>
          </MarkdownRenderer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'katex/dist/katex.min.css'
import 'github-markdown-css/github-markdown.css'
import { ref, computed, h, onUnmounted, watch } from 'vue'
import { MarkdownRenderer } from 'x-markdown'

// ==================== 状态管理 ====================

// 主题状态
const isDark = ref(false)

// Markdown 渲染选项
const enableLatex = ref(true)
const allowHtml = ref(true)
const enableBreaks = ref(true)
const enableAnimate = ref(false) // 是否启用动画效果
const useCustomSlots = ref(true)

// 代码块配置选项
const showCodeBlockHeader = ref(true) // 是否显示代码块头部
const codeMaxHeight = ref('') // 代码块最大高度（如 '300px'）

// 流式演示状态
const isStreaming = ref(false)
const streamSpeed = ref(30)
let streamTimer: ReturnType<typeof setInterval> | null = null
let streamIndex = 0

// ==================== Markdown 内容 ====================

// 完整的演示内容
const fullContent = `# 🎉 X-Markdown 功能演示

欢迎使用 X-Markdown Playground！这是一个功能丰富的 Vue 3 Markdown 组件库。

<tip>角标</tip>

## ✨ 核心特性

- 🚀 **流式渲染** - 支持 AI 对话场景的实时输出
- 🎨 **代码高亮** - 基于 Shiki，支持 100+ 语言
- 📐 **LaTeX 数学** - 完整的数学公式支持
- 📊 **Mermaid 图表** - 流程图、时序图等
- 🔧 **自定义插槽** - 灵活定制渲染样式

## 💻 代码高亮示例
\`const a = 2\` \`const b = 2\` \`const c = 2\` \`const d = 2\` \`const e = 2\`
\`\`\`typescript
// TypeScript 示例 - 实时语法高亮
interface User {
  id: number
  name: string
  email: string
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`)
  return response.json()
}

const user = await fetchUser(1)
console.log(\`Hello, \${user.name}!\`)
\`\`\`

\`\`\`python
# Python 示例
def fibonacci(n: int) -> list[int]:
    """生成斐波那契数列"""
    result = []
    a, b = 0, 1
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))
\`\`\`

## 📐 LaTeX 数学公式

行内公式：质能方程 $E = mc^2$，欧拉公式 $e^{i\\pi} + 1 = 0$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

## 📊 数据表格

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown 渲染 | ✅ | GFM 规范 |
| 代码高亮 | ✅ | Shiki 引擎 |
| 流式渲染 | ✅ | 实时输出 |
| 自定义插槽 | ✅ | 灵活定制 |

## 📈 Mermaid 流程图

\`\`\`mermaid
graph LR
    A[输入 Markdown] --> B{解析}
    B --> C[AST 树]
    C --> D[渲染 VNode]
    D --> E[显示结果]
    B --> F[代码块]
    F --> G[Shiki 高亮]
    G --> D
\`\`\`

## 💬 引用示例

> 这是一个自定义样式的引用块。
> 当启用"自定义插槽"时，会显示特殊的引用图标。
>
> — X-Markdown 团队

## ✅ 任务列表

- [x] 基础 Markdown 渲染
- [x] 代码语法高亮
- [x] LaTeX 数学公式
- [x] Mermaid 图表
- [x] 流式渲染支持
- [x] 自定义插槽渲染


## 🔤 插槽示例
<self-btn>这是button</self-btn>
## 🔗 相关链接

- [Vue.js 官网](https://vuejs.org)
- [GitHub 仓库](https://github.com/element-plus-x/x-markdown)
- [Shiki 文档](https://shiki.matsu.io)

---

⚡ 点击左上角 **"流式演示"** 按钮查看实时流式渲染效果！
`

// 当前显示的 markdown 内容
const markdown = ref(fullContent)

// 流式进度 - 根据当前 markdown 内容长度计算
const streamProgress = computed(() => {
  if (fullContent.length === 0) return 0
  return Math.min((markdown.value.length / fullContent.length) * 100, 100)
})

// 监听流式速度变化，实时调整定时器间隔
watch(streamSpeed, (newSpeed) => {
  if (isStreaming.value && streamTimer) {
    clearInterval(streamTimer)
    streamTimer = setInterval(() => {
      if (streamIndex < fullContent.length) {
        const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullContent.length - streamIndex)
        markdown.value += fullContent.slice(streamIndex, streamIndex + charsToAdd)
        streamIndex += charsToAdd
      } else {
        stopStreaming()
      }
    }, newSpeed)
  }
})

// ==================== CodeX 配置 ====================

// 代码块完整配置（包含主题、样式、功能等）
const codeXProps = computed(() => ({
  // 主题配置
  codeLightTheme: 'vitesse-light', // 浅色主题
  codeDarkTheme: 'vitesse-dark', // 深色主题
  // 功能配置
  showCodeBlockHeader: showCodeBlockHeader.value, // 是否显示代码块头部
  codeMaxHeight: codeMaxHeight.value || undefined, // 代码块最大高度
}))

// 自定义代码块插槽
const codeXSlots = {
  // 自定义头部左侧：语言图标 + 名称
  'header-left': ({ language }: { language: string }) => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      rust: '🦀',
      go: '🐹',
      java: '☕',
      cpp: '⚙️',
      c: '©️',
      html: '🌐',
      css: '🎨',
      json: '📋',
      markdown: '📝',
      shell: '💻',
      bash: '💻',
      sql: '🗃️',
      mermaid: '📊',
    }
    const icon = icons[language] || '📄'
    return h('span', { class: 'custom-lang' }, [
      h('span', { class: 'lang-icon' }, icon),
      h('span', { class: 'lang-name' }, language.toUpperCase()),
    ])
  },

  // 自定义头部右侧：复制按钮
  'header-right': ({ code, copy, copied }: { code: string; copy: (text: string) => void; copied: boolean }) => {
    return h(
      'button',
      {
        class: ['custom-copy-btn', { copied }],
        onClick: () => copy(code),
      },
      copied ? '✅ 已复制' : '📋 复制',
    )
  },
}

// ==================== 方法 ====================

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
}

// 开始流式演示
const startStreaming = () => {
  if (isStreaming.value) return

  isStreaming.value = true
  markdown.value = ''
  streamIndex = 0

  streamTimer = setInterval(() => {
    if (streamIndex < fullContent.length) {
      // 每次添加 1-3 个字符
      const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullContent.length - streamIndex)
      markdown.value += fullContent.slice(streamIndex, streamIndex + charsToAdd)
      streamIndex += charsToAdd
    } else {
      stopStreaming()
    }
  }, streamSpeed.value)
}

// 停止流式
const stopStreaming = () => {
  if (streamTimer) {
    clearInterval(streamTimer)
    streamTimer = null
  }
  isStreaming.value = false
}

// 重置内容
const resetContent = () => {
  stopStreaming()
  markdown.value = fullContent
  streamIndex = 0
}

// 组件卸载时清理
onUnmounted(() => {
  stopStreaming()
})
</script>
<style>
body {
  margin: 0 !important;
}

/* 滚动条样式 - Webkit 浏览器 (Chrome, Edge, Safari) */
* {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgb(0 0 0 / 12%) rgb(0 0 0 / 6%); /* Firefox */
}

*::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

*::-webkit-scrollbar-track {
  background: rgb(0 0 0 / 6%);
  border-radius: 3px;
  box-shadow: inset 0 0 5px rgb(0 0 0 / 8%);
}

*::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 12%);
  border-radius: 3px;
  box-shadow: inset 0 0 10px rgb(0 0 0 / 20%);
}

*::-webkit-scrollbar-thumb:hover {
  background: rgb(0 0 0 / 24%);
}

/* 暗色模式下的滚动条 */
.app-dark *::-webkit-scrollbar-track {
  background: rgb(255 255 255 / 8%);
  box-shadow: inset 0 0 5px rgb(255 255 255 / 5%);
}

.app-dark *::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 15%);
  box-shadow: inset 0 0 10px rgb(255 255 255 / 10%);
}

.app-dark *::-webkit-scrollbar-thumb:hover {
  background: rgb(255 255 255 / 25%);
}

.app-dark * {
  scrollbar-color: rgb(255 255 255 / 15%) rgb(255 255 255 / 8%); /* Firefox 暗色模式 */
}
</style>

<style scoped>
/* ==================== 全局样式 ==================== */
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  transition: all 0.3s ease;
}

#app.app-dark {
  background: #1a1a1a;
}

/* ==================== 头部样式 ==================== */
.header {
  background: #42b883;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(1, 57, 24, 0.3);
}

.app-dark .header {
  background: #014629;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.header-content p {
  margin: 0.3rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* ==================== 按钮样式 ==================== */
.action-btn {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.theme-toggle {
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* ==================== 配置栏样式 ==================== */
.config-bar {
  display: flex;
  gap: 1.5rem;
  padding: 0.8rem 1.5rem;
  background: #42b883;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-dark .config-bar {
  background: #014629;
  border-color: #374151;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.config-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.app-dark .config-title {
  color: rgba(255, 255, 255, 0.9);
}

.config-content {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
}

.config-content label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: background 0.2s;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.config-content label:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.app-dark .config-content label {
  color: #e5e5e5;
  background: rgba(66, 184, 131, 0.15);
  border-color: rgba(66, 184, 131, 0.3);
}

.app-dark .config-content label:hover {
  background: rgba(66, 184, 131, 0.25);
  border-color: rgba(66, 184, 131, 0.5);
}

.config-content input[type='checkbox'] {
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.config-content .code-max-height-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.config-content .code-max-height-input {
  width: 80px;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.config-content .code-max-height-input::placeholder {
  color: #999;
}

.app-dark .config-content .code-max-height-input {
  background: #212121;
  border-color: #4b5563;
  color: #e5e5e5;
}

.config-content .code-max-height-input:focus {
  outline: none;
  border-color: #42b883;
}

.speed-section {
  flex: 1;
  min-width: 200px;
}

.speed-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.speed-content input[type='range'] {
  width: 100px;
  cursor: pointer;
  accent-color: white;
}

.speed-content input[type='range']::-webkit-slider-thumb {
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.speed-content input[type='range']::-moz-range-thumb {
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.app-dark .speed-content input[type='range'] {
  accent-color: #42b883;
}

.app-dark .speed-content input[type='range']::-webkit-slider-thumb {
  background: #42b883;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.app-dark .speed-content input[type='range']::-moz-range-thumb {
  background: #42b883;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.speed-value {
  min-width: 45px;
  font-weight: 600;
  color: white;
  font-size: 0.85rem;
}

.app-dark .speed-value {
  color: white;
}

.speed-content .progress-bar {
  position: relative;
  flex: 1;
  min-width: 120px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.app-dark .speed-content .progress-bar {
  background: transparent;
  border-color: rgba(66, 184, 131, 0.3);
}

.speed-content .progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  transition: width 0.2s ease;
  border-radius: 10px;
}

.speed-content .progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  z-index: 1;
  transition: color 0.2s ease;
}

.speed-content .progress-text.on-fill {
  color: #ffffff;
}

.app-dark .speed-content .progress-text {
  color: #9ca3af;
}

.app-dark .speed-content .progress-text.on-fill {
  color: #ffffff;
}

/* ==================== 主容器 ==================== */
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 160px);
}

/* ==================== 面板样式 ==================== */
.editor-panel,
.preview-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-dark .editor-panel,
.app-dark .preview-panel {
  background: #212121;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.panel-header {
  padding: 0.8rem 1.2rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%);
}

.app-dark .panel-header {
  background: linear-gradient(135deg, #212121 0%, #212121 100%);
  border-color: #374151;
}

.panel-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.app-dark .panel-header h2 {
  color: #e5e5e5;
}

.char-count {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.app-dark .char-count {
  background: #374151;
  color: #9ca3af;
}

.slot-badge {
  font-size: 0.75rem;
  color: #42b883;
  background: #e8f5f0;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 500;
}

.app-dark .slot-badge {
  background: #1e3a32;
  color: #42b883;
}

/* ==================== 编辑器样式 ==================== */
.editor {
  flex: 1;
  padding: 1rem;
  border: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  outline: none;
  background: white;
  color: #333;
}

.app-dark .editor {
  background: #212121;
  color: #e5e5e5;
}

/* ==================== 预览内容 ==================== */
.preview-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: white;
}

/* GitHub Markdown 样式适配 */
.preview-content.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 100%;
  background-color: transparent;
}

/* 亮色主题 - 强制覆盖 */
.preview-content.markdown-body {
  color-scheme: light;
  --fgColor-default: #1f2328;
  --fgColor-muted: #59636e;
  --fgColor-accent: #0969da;
  --bgColor-default: #ffffff;
  --bgColor-muted: #f6f8fa;
  --borderColor-default: #d1d9e0;
  --borderColor-muted: #d1d9e0b3;
  color: var(--fgColor-default);
}

/* 暗色主题 - 强制覆盖 */
.app-dark .preview-content {
  background: transparent;
}

.app-dark .preview-content.markdown-body {
  color-scheme: dark;
  --fgColor-default: #f0f6fc;
  --fgColor-muted: #9198a1;
  --fgColor-accent: #4493f8;
  --bgColor-default: #0d1117;
  --bgColor-muted: #151b23;
  --borderColor-default: #3d444d;
  --borderColor-muted: #3d444db3;
  color: var(--fgColor-default);
}

/* ==================== 自定义渲染样式 ==================== */

/* 自定义 h1 */
:deep(.custom-h1) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #42b883;
  margin-bottom: 1rem;
}

.h1-icon {
  font-size: 1.3rem;
}

/* 自定义 blockquote */
:deep(.custom-blockquote) {
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
  margin: 1rem 0;
  background: #e8f5f0;
  border-radius: 12px;
  border: none;
  border-left: 4px solid #42b883;
}

.app-dark :deep(.custom-blockquote) {
  background: #1e3a32;
}

.quote-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.quote-content {
  flex: 1;
}

:deep(.quote-content p) {
  margin: 0;
}

/* 自定义链接 */
:deep(.custom-link) {
  color: #42b883;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  transition: all 0.2s;
  font-weight: 500;
}

:deep(.custom-link:hover) {
  background: #e8f5f0;
  color: #35495e;
}

.app-dark :deep(.custom-link:hover) {
  background: #1e3a32;
}

.link-icon {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* 自定义代码块头部 */
:deep(.custom-lang) {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

:deep(.lang-icon) {
  font-size: 1rem;
}

:deep(.lang-name) {
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

:deep(.custom-copy-btn) {
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
  transition: all 0.2s;
  font-weight: 500;
}

:deep(.custom-copy-btn:hover) {
  background: rgba(0, 0, 0, 0.12);
}

:deep(.custom-copy-btn.copied) {
  background: #22c55e;
  color: white;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1024px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .editor-panel {
    min-height: 300px;
  }

  .preview-panel {
    min-height: 500px;
  }
}
.tip {
  display: inline-block;
  background: #fffae5;
  color: #b45309;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #fcd34d;
  margin-top: 20px;
  position: relative;
}
.tip::after {
  content: '6';
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  background: #ef4444;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
}
</style>
