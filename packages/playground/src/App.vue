<template>
  <div id="app">
    <header class="header">
      <h1>X-Markdown Playground</h1>
      <p>A Vue 3 Markdown Component Library</p>
    </header>

    <div class="container">
      <div class="editor-panel">
        <div class="panel-header">
          <h2>Markdown Editor</h2>
          <button @click="toggleTheme" class="theme-toggle">
            {{ isDark ? '🌞 Light' : '🌙 Dark' }}
          </button>
        </div>
        <textarea
          v-model="markdown"
          class="editor"
          placeholder="Type your markdown here..."
        ></textarea>

        <div class="options">
          <label>
            <input type="checkbox" v-model="enableLatex" />
            Enable LaTeX
          </label>
          <label>
            <input type="checkbox" v-model="allowHtml" />
            Allow HTML
          </label>
          <label>
            <input type="checkbox" v-model="enableBreaks" />
            Enable Line Breaks
          </label>
          <label>
            <input type="checkbox" v-model="sanitize" />
            Sanitize HTML
          </label>
        </div>
      </div>

      <div class="preview-panel">
        <div class="panel-header">
          <h2>Preview</h2>
        </div>
        <div class="preview-content" :class="{ 'dark-mode': isDark }">
          <MarkdownRenderer
            :markdown="markdown"
            :enable-latex="enableLatex"
            :allow-html="allowHtml"
            :enable-breaks="enableBreaks"
            :sanitize="sanitize"
            :is-dark="isDark"
            :code-x-props="{
              enableCodeCopy: true,
              enableThemeToggle: false,
              enableCodeLineNumber: true
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'katex/dist/katex.min.css';
import { ref } from 'vue';
import { MarkdownRenderer } from 'x-markdown';

const isDark = ref(false);
const enableLatex = ref(true);
const allowHtml = ref(false);
const enableBreaks = ref(true);
const sanitize = ref(false);

const markdown = ref(`# Welcome to X-Markdown Playground

## Features

This is a **Vue 3** markdown component library with rich features:

- ✅ GitHub Flavored Markdown (GFM)
- ✅ Syntax highlighting
- ✅ LaTeX math support
- ✅ Mermaid diagrams
- ✅ HTML support (optional)
- ✅ Sanitization

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return name;
}

greet('World');
\`\`\`

### Python Code

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print([fibonacci(i) for i in range(10)])
\`\`\`

### Math (LaTeX)

Inline math: $E = mc^2$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Table

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Code Highlight | ✅ |
| LaTeX | ✅ |
| Mermaid | ✅ |

### Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

### Blockquote

> This is a blockquote.
> It can span multiple lines.

### Task List

- [x] Support basic markdown
- [x] Add syntax highlighting
- [x] Implement LaTeX
- [ ] Add more features

### Links and Images

[Visit Vue.js](https://vuejs.org)

---

Try editing the markdown on the left to see it rendered in real-time!
`);

const toggleTheme = () => {
  isDark.value = !isDark.value;
};
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.header p {
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 140px);
}

.editor-panel,
.preview-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.theme-toggle {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.theme-toggle:hover {
  background: #764ba2;
}

.editor {
  flex: 1;
  padding: 1.5rem;
  border: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.options {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: #fafafa;
}

.options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
}

.options input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.preview-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: white;
}

.preview-content.dark-mode {
  background: #1e1e1e;
  color: #d4d4d4;
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .editor-panel {
    min-height: 400px;
  }

  .preview-panel {
    min-height: 600px;
  }
}
</style>
