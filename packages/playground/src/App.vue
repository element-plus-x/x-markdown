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
      <!-- 示例切换 -->
      <div class="config-section example-section">
        <div class="config-title">📚 示例选择</div>
        <div class="config-content example-tabs">
          <button
            v-for="example in exampleList"
            :key="example.value"
            :class="['example-tab', { active: currentExample === example.value }]"
            @click="switchExample(example.value)"
          >
            {{ example.icon }} {{ example.label }}
          </button>
        </div>
      </div>

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
          <label>
             <input type="checkbox" v-model="enableCodeBlockHeaderSticky" />
                代码块头部开启sticky
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
        </div>
        <div class="preview-content markdown-body">
          <MarkdownRenderer
            :markdown="markdown"
            :enable-latex="enableLatex"
            :allow-html="allowHtml"
            :enable-breaks="enableBreaks"
            :enable-animate="enableAnimate"
            :is-dark="isDark"
            :show-code-block-header="showCodeBlockHeader"
            :sticky-code-block-header="enableCodeBlockHeaderSticky"
            :code-max-height="codeMaxHeight || undefined"
            :code-block-actions="codeBlockActions"
            :mermaid-actions="mermaidActions"
            :code-x-render="codeXRender"
          >
            <!-- 自定义 HTML 标签插槽 -->
            <template #self-btn>
              <button>点击button</button>
            </template>
            <template #tip>
              <div class="tip">角标</div>
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
import { ref, computed, onUnmounted, watch, h } from 'vue'
import { MarkdownRenderer } from 'x-markdown-vue'
import type * as echarts from 'echarts'

// ==================== 状态管理 ====================

// 主题状态
const isDark = ref(false)

// ECharts 实例管理 - 存储所有 ECharts 图表实例
const echartsInstances = new Map<string, echarts.ECharts>()

// 示例选择
type ExampleType = 'basic' | 'code' | 'mermaid' | 'formula'
const currentExample = ref<ExampleType>('basic')

// 示例列表
const exampleList = [
  { value: 'basic' as ExampleType, label: '基础示例', icon: '📝' },
  { value: 'code' as ExampleType, label: '代码块示例', icon: '💻' },
  { value: 'mermaid' as ExampleType, label: 'Mermaid 示例', icon: '📊' },
  { value: 'formula' as ExampleType, label: '公式示例', icon: '📐' },
]

// Markdown 渲染选项
const enableLatex = ref(true)
const allowHtml = ref(true)
const enableBreaks = ref(true)
const enableAnimate = ref(false) // 是否启用动画效果

// 代码块配置选项
const showCodeBlockHeader = ref(true) // 是否显示代码块头部
const enableCodeBlockHeaderSticky = ref(true) // 是否显示代码块头部sticky定位
const codeMaxHeight = ref('') // 代码块最大高度（如 '300px'）

// 流式演示状态
const isStreaming = ref(false)
const streamSpeed = ref(30)
let streamTimer: ReturnType<typeof setInterval> | null = null
let streamIndex = 0

// ==================== Markdown 内容 ====================

// 基础示例 - 展示基本 Markdown 语法
const basicExample = `# 🎉 X-Markdown 基础示例

欢迎使用 X-Markdown Playground！这是一个功能丰富的 Vue 3 Markdown 组件库。

<tip>角标</tip>

## ✨ 核心特性

- 🚀 **流式渲染** - 支持 AI 对话场景的实时输出
- 🎨 **代码高亮** - 基于 Shiki，支持 100+ 语言
- 📐 **LaTeX 数学** - 完整的数学公式支持
- 📊 **Mermaid 图表** - 流程图、时序图等
- 🔧 **自定义插槽** - 灵活定制渲染样式

## 📝 文本格式

这是一段**粗体文本**，这是*斜体文本*，这是~~删除线~~。

还可以使用 \`行内代码\` 来高亮显示代码片段。

## 📋 列表示例

### 无序列表
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

### 有序列表
1. 步骤一
2. 步骤二
3. 步骤三

## ✅ 任务列表

- [x] 基础 Markdown 渲染
- [x] 代码语法高亮
- [x] LaTeX 数学公式
- [ ] 待完成功能

## 💬 引用示例

> 这是一个引用块。
> 可以包含多行内容。
>
> — X-Markdown 团队

## 📊 表格示例

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown 渲染 | ✅ | GFM 规范 |
| 代码高亮 | ✅ | Shiki 引擎 |
| 流式渲染 | ✅ | 实时输出 |
| 自定义插槽 | ✅ | 灵活定制 |

## 🔗 链接示例

- [Vue.js 官网](https://vuejs.org)
- [GitHub 仓库](https://github.com/element-plus-x/x-markdown)

## 🔤 自定义插槽

<self-btn>这是自定义按钮</self-btn>

---

⚡ 尝试点击上方按钮切换不同示例！
`

// 代码块示例 - 展示多语言代码高亮
const codeExample = `# 💻 代码块示例

展示 X-Markdown 强大的代码高亮能力，基于 Shiki 引擎，支持 100+ 编程语言。

## 行内代码

可以在文本中使用 \`const a = 2\` 这样的行内代码，支持 \`多个\` \`行内代码\` \`并排显示\`。

## TypeScript / JavaScript

\`\`\`typescript
// TypeScript 示例 - 接口与异步函数
interface User {
  id: number
  name: string
  email: string
  roles: string[]
}

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const response = await fetch(\`/api/users/\${id}\`)
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`)
  }
  return response.json()
}

// 使用示例
const result = await fetchUser(1)
console.log(\`Hello, \${result.data.name}!\`)
\`\`\`

## Python

\`\`\`python
# Python 示例 - 类与装饰器
from functools import wraps
from typing import Callable, TypeVar

T = TypeVar('T')

def retry(max_attempts: int = 3):
    """重试装饰器"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise e
                    print(f"Attempt {attempt + 1} failed, retrying...")
            raise RuntimeError("Should not reach here")
        return wrapper
    return decorator

@retry(max_attempts=3)
def fetch_data(url: str) -> dict:
    """获取数据"""
    import requests
    response = requests.get(url)
    return response.json()
\`\`\`

## Rust

\`\`\`rust
// Rust 示例 - 结构体与 trait
use std::fmt;

#[derive(Debug, Clone)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p1 = Point::new(0.0, 0.0);
    let p2 = Point::new(3.0, 4.0);
    println!("Distance: {}", p1.distance(&p2));
}
\`\`\`

## Go

\`\`\`go
// Go 示例 - goroutine 与 channel
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\\n", id, job)
        time.Sleep(100 * time.Millisecond)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)
    var wg sync.WaitGroup

    // 启动 3 个 worker
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // 发送任务
    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)

    wg.Wait()
    close(results)
}
\`\`\`

## SQL

\`\`\`sql
-- SQL 示例 - 复杂查询
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        product_id,
        SUM(quantity) AS total_quantity,
        SUM(price * quantity) AS total_revenue
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY DATE_TRUNC('month', order_date), product_id
)
SELECT
    p.name AS product_name,
    ms.month,
    ms.total_quantity,
    ms.total_revenue,
    RANK() OVER (PARTITION BY ms.month ORDER BY ms.total_revenue DESC) AS rank
FROM monthly_sales ms
JOIN products p ON p.id = ms.product_id
WHERE ms.total_revenue > 1000
ORDER BY ms.month, rank;
\`\`\`

## Shell / Bash

\`\`\`bash
#!/bin/bash
# 自动化部署脚本

set -euo pipefail

PROJECT_DIR="/var/www/app"
BACKUP_DIR="/var/backups/app"

echo "🚀 Starting deployment..."

# 创建备份
backup_current() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    echo "📦 Creating backup..."
    tar -czf "$BACKUP_DIR/backup_$timestamp.tar.gz" -C "$PROJECT_DIR" .
}

# 拉取最新代码
pull_latest() {
    echo "📥 Pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main
}

# 安装依赖并构建
build_app() {
    echo "🔨 Building application..."
    pnpm install
    pnpm run build
}

# 执行部署
backup_current
pull_latest
build_app

echo "✅ Deployment completed!"
\`\`\`

## JSON

\`\`\`json
{
  "name": "x-markdown",
  "version": "1.0.0",
  "description": "Vue 3 Markdown 组件库",
  "keywords": ["vue", "markdown", "shiki", "mermaid"],
  "author": {
    "name": "Element Plus X",
    "email": "contact@example.com"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "shiki": "^1.0.0",
    "mermaid": "^10.0.0"
  },
  "features": {
    "streaming": true,
    "codeHighlight": true,
    "latex": true,
    "mermaid": true
  }
}
\`\`\`

## ECharts 图表 (自定义渲染)

通过 \`codeXRender\` 自定义渲染器，可以将 ECharts 配置直接渲染为交互式图表：

\`\`\`echarts
{
  "title": {
    "text": "技术栈使用趋势",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["Vue", "React", "Angular"],
    "top": "45"
  },
  "grid":  {
    "top": "20%",
    "bottom": "0%",
    "left": "5%",
    "right": "5%",
    "containLabel": true
  },
  "xAxis": {
    "type": "category",
    "data": ["2020", "2021", "2022", "2023", "2024"]
  },
  "yAxis": {
    "type": "value",
    "name": "使用率 (%)"
  },
  "series": [
    {
      "name": "Vue",
      "type": "line",
      "smooth": true,
      "data": [35, 42, 48, 55, 62]
    },
    {
      "name": "React",
      "type": "line",
      "smooth": true,
      "data": [45, 50, 52, 54, 56]
    },
    {
      "name": "Angular",
      "type": "line",
      "smooth": true,
      "data": [30, 28, 25, 22, 20]
    }
  ]
}
\`\`\`
## JSON 2

\`\`\`json
{
  "features": {
    "streaming": true,
    "codeHighlight": true,
    "latex": true,
    "mermaid": true
  }
}
\`\`\`

## ECharts 图表2 (自定义渲染)

通过 \`codeXRender\` 自定义渲染器，可以将 ECharts 配置直接渲染为交互式图表：

\`\`\`echarts
{
  "title": {
    "text": "技术栈使用趋势",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "legend": {
    "data": ["Vue", "React", "Angular"],
    "top": "45"
  },
  "grid":  {
    "top": "20%",
    "bottom": "0%",
    "left": "5%",
    "right": "5%",
    "containLabel": true
  },
  "xAxis": {
    "type": "category",
    "data": ["2020", "2021"]
  },
  "yAxis": {
    "type": "value",
    "name": "使用率 (%)"
  },
  "series": [
    {
      "name": "Vue",
      "type": "line",
      "smooth": true,
      "data": [35, 42]
    },
    {
      "name": "React",
      "type": "line",
      "smooth": true,
      "data": [45, 50]
    },
    {
      "name": "Angular",
      "type": "line",
      "smooth": true,
      "data": [30, 28]
    }
  ]
}
\`\`\`
`

// Mermaid 示例 - 展示各种图表
const mermaidExample = `# 📊 Mermaid 图表示例

X-Markdown 支持 Mermaid 图表，可以绘制流程图、时序图、甘特图等多种图表。

## 流程图 (Flowchart)

\`\`\`mermaid
graph TB
    A[开始] --> B{是否登录?}
    B -->|是| C[进入首页]
    B -->|否| D[跳转登录页]
    D --> E[输入账号密码]
    E --> F{验证通过?}
    F -->|是| C
    F -->|否| G[显示错误]
    G --> E
    C --> H[结束]
\`\`\`

## 时序图 (Sequence Diagram)

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant C as 客户端
    participant S as 服务器
    participant D as 数据库

    U->>C: 点击登录
    C->>S: POST /api/login
    S->>D: 查询用户信息
    D-->>S: 返回用户数据
    S-->>C: 返回 JWT Token
    C-->>U: 登录成功，跳转首页
\`\`\`

## 甘特图 (Gantt Chart)

\`\`\`mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 需求分析
    需求调研           :a1, 2024-01-01, 7d
    需求文档           :after a1, 5d
    section 设计阶段
    UI 设计            :2024-01-10, 10d
    架构设计           :2024-01-12, 8d
    section 开发阶段
    前端开发           :2024-01-20, 20d
    后端开发           :2024-01-20, 25d
    section 测试上线
    集成测试           :2024-02-15, 10d
    上线部署           :2024-02-25, 3d
\`\`\`

## 类图 (Class Diagram)

\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
        +fetch()
    }
    class Cat {
        +String color
        +meow()
        +scratch()
    }
    class Bird {
        +float wingspan
        +fly()
        +sing()
    }
    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird
\`\`\`

## 状态图 (State Diagram)

\`\`\`mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中 : 开始处理
    处理中 --> 已完成 : 处理成功
    处理中 --> 失败 : 处理失败
    失败 --> 处理中 : 重试
    失败 --> 已取消 : 取消
    已完成 --> [*]
    已取消 --> [*]
\`\`\`

## 饼图 (Pie Chart)

\`\`\`mermaid
pie showData
    title 技术栈使用占比
    "Vue.js" : 35
    "React" : 30
    "Angular" : 15
    "Svelte" : 10
    "其他" : 10
\`\`\`

## ER 图 (Entity Relationship)

\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int id PK
        date created_at
        int user_id FK
    }
    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM {
        int id PK
        int quantity
        int order_id FK
        int product_id FK
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
\`\`\`
`

// 公式示例 - 展示 LaTeX 数学公式
const formulaExample = `# 📐 LaTeX 公式示例

X-Markdown 支持 KaTeX 渲染的 LaTeX 数学公式，可以展示复杂的数学表达式。

## 行内公式

在文本中嵌入公式：质能方程 $E = mc^2$，欧拉恒等式 $e^{i\\pi} + 1 = 0$，二次公式 $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$。

## 基础数学

### 分数与根式

$$
\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}
$$

$$
\\sqrt{a^2 + b^2} = c \\quad \\text{（勾股定理）}
$$

$$
\\sqrt[n]{x} = x^{\\frac{1}{n}}
$$

### 指数与对数

$$
a^m \\cdot a^n = a^{m+n} \\qquad \\frac{a^m}{a^n} = a^{m-n}
$$

$$
\\log_a(xy) = \\log_a x + \\log_a y
$$

## 微积分

### 极限

$$
\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1
$$

$$
\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e
$$

### 导数

$$
\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)
$$

$$
\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h, y) - f(x, y)}{h}
$$

### 积分

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\oint_C \\vec{F} \\cdot d\\vec{r} = \\iint_S (\\nabla \\times \\vec{F}) \\cdot d\\vec{S}
$$

## 线性代数

### 矩阵

$$
A = \\begin{pmatrix}
a_{11} & a_{12} & a_{13} \\\\
a_{21} & a_{22} & a_{23} \\\\
a_{31} & a_{32} & a_{33}
\\end{pmatrix}
$$

### 行列式

$$
\\det(A) = \\begin{vmatrix}
a & b \\\\
c & d
\\end{vmatrix} = ad - bc
$$

### 特征值

$$
A\\vec{v} = \\lambda\\vec{v} \\implies \\det(A - \\lambda I) = 0
$$

## 概率统计

### 正态分布

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}
$$

### 期望与方差

$$
E[X] = \\sum_{i=1}^{n} x_i \\cdot P(x_i) \\qquad \\text{Var}(X) = E[(X - \\mu)^2]
$$

### 贝叶斯公式

$$
P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}
$$

## 级数

### 泰勒级数

$$
e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots
$$

$$
\\sin x = \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n+1}}{(2n+1)!}
$$

### 傅里叶级数

$$
f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left( a_n \\cos\\frac{n\\pi x}{L} + b_n \\sin\\frac{n\\pi x}{L} \\right)
$$

## 物理公式

### 麦克斯韦方程组

$$
\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}
$$

$$
\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}
$$

### 薛定谔方程

$$
i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\vec{r}, t) = \\hat{H}\\Psi(\\vec{r}, t)
$$

---

🎯 **提示**：确保启用「LaTeX 数学」选项以正确渲染公式！
`

// 示例内容映射
const exampleContents: Record<ExampleType, string> = {
  basic: basicExample,
  code: codeExample,
  mermaid: mermaidExample,
  formula: formulaExample,
}

// 完整的演示内容 - 默认使用基础示例
const fullContent = computed(() => exampleContents[currentExample.value])

// 当前显示的 markdown 内容
const markdown = ref(basicExample)

// 切换示例的方法
const switchExample = (example: ExampleType) => {
  // 如果正在流式中，先停止
  stopStreaming()
  // 切换示例
  currentExample.value = example
  // 更新 markdown 内容
  markdown.value = exampleContents[example]
  streamIndex = 0
}

// 流式进度 - 根据当前 markdown 内容长度计算
const streamProgress = computed(() => {
  if (fullContent.value.length === 0) return 0
  return Math.min((markdown.value.length / fullContent.value.length) * 100, 100)
})

// 监听流式速度变化，实时调整定时器间隔
watch(streamSpeed, (newSpeed) => {
  if (isStreaming.value && streamTimer) {
    clearInterval(streamTimer)
    streamTimer = setInterval(() => {
      if (streamIndex < fullContent.value.length) {
        const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullContent.value.length - streamIndex)
        markdown.value += fullContent.value.slice(streamIndex, streamIndex + charsToAdd)
        streamIndex += charsToAdd
      } else {
        stopStreaming()
      }
    }, newSpeed)
  }
})

// 监听主题变化，动态切换 ECharts 图表主题
watch(isDark, (newIsDark) => {
  // 遍历所有 ECharts 实例，调用 setTheme 方法切换主题
  echartsInstances.forEach((chart) => {
    // ECharts 6.0+ 支持动态主题切换
    // 使用 setTheme 方法可以无需重新初始化即可切换主题
    chart.setTheme(newIsDark ? 'dark' : 'default')
  })
})

// ==================== Actions 配置 ====================

// 代码块操作按钮
const codeBlockActions = [
  {
    key: 'run',
    title: '运行代码',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>',
    onClick: (props: any) => {
      console.log('运行代码:', props.code)
      alert('运行代码功能（示例）')
    },
    show: (props: any) => ['javascript', 'typescript', 'js', 'ts'].includes(props.language),
  },
]

// Mermaid 操作按钮
const mermaidActions = [
  {
    key: 'edit',
    title: '编辑图表',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    onClick: (props: any) => {
      console.log('编辑 Mermaid:', props.rawContent)
      alert('编辑图表功能（示例）')
    },
    show: (props: any) => !props.showSourceCode,
  },
]

// 自定义代码块渲染器示例
const codeXRender = {
  // 自定义 JSON 渲染：显示格式化的 JSON
  json: (props: any) => {
    // 使用从 x-markdown 传递的唯一 key
    const blockId = props.raw.key

    try {
      const formatted = JSON.stringify(JSON.parse(props.raw.content), null, 2)
      return h(
        'pre',
        {
          key: `${blockId}-json-success`,
          style: {
            background: isDark.value ? '#1e1e1e' : '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            margin: '0',
          },
        },
        [h('code', { style: { color: isDark.value ? '#9cdcfe' : '#0451a5' } }, formatted)],
      )
    } catch {
      // 检查是否可能是流式输出中（内容不完整）
      const content = props.raw.content.trim()
      const isLikelyStreaming = !content.endsWith('}') || content.split('{').length !== content.split('}').length

      if (isLikelyStreaming) {
        // 流式输出中，显示加载状态
        return h(
          'div',
          {
            key: `${blockId}-json-loading`, // 使用唯一但稳定的 key
            style: {
              background: isDark.value ? '#1e1e1e' : '#f9fafb',
              padding: '24px',
              borderRadius: '8px',
              border: `1px solid ${isDark.value ? '#333' : '#e5e7eb'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0',
            },
          },
          [
            h('div', {
              style: {
                width: '24px',
                height: '24px',
                border: `2px solid ${isDark.value ? '#333' : '#e5e7eb'}`,
                borderTop: '2px solid #42b883',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                flexShrink: '0',
              },
            }),
            h(
              'div',
              {
                style: {
                  color: isDark.value ? '#9ca3af' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                },
              },
              '正在加载 JSON 数据...',
            ),
          ],
        )
      }

      return null
    }
  },
  // 自定义 ECharts 渲染：解析配置并渲染图表
  echarts: (props: any) => {
    // 使用从 x-markdown 传递的唯一 key
    const blockId = props.raw.key
    const content = props.raw.content.trim()

    // 先检查内容是否完整
    const looksComplete = content.endsWith('}') && content.split('{').length === content.split('}').length

    // 内容不完整，显示 loading，不尝试解析
    if (!looksComplete) {
      return h(
        'div',
        {
          key: `${blockId}-echarts-loading`, // 使用唯一但稳定的 key
          style: {
            width: '99%',
            height: '400px',
            background: isDark.value ? '#1e1e1e' : '#f9fafb',
            borderRadius: '8px',
            border: `1px solid ${isDark.value ? '#333' : '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
          },
        },
        [
          h('div', {
            style: {
              width: '40px',
              height: '40px',
              border: `3px solid ${isDark.value ? '#333' : '#e5e7eb'}`,
              borderTop: '3px solid #42b883',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            },
          }),
          h(
            'div',
            {
              style: {
                color: isDark.value ? '#9ca3af' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
              },
            },
            '正在加载 ECharts 图表...',
          ),
        ],
      )
    }

    // 内容完整，尝试解析并渲染
    try {
      const config = JSON.parse(content)
      // 生成唯一 DOM ID
      const chartId = `${blockId}-echarts-dom`
      // 返回一个容器，并在 mounted 后初始化 ECharts
      return h('div', {
        key: `${blockId}-echarts-chart`, // 使用唯一的 key，与 loading 区分
        id: chartId,
        style: {
          width: '99%',
          height: '400px',
          background: isDark.value ? '#1e1e1e' : '#ffffff',
          borderRadius: '8px',
          border: `1px solid ${isDark.value ? '#333' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        // 使用 Vue 的 onMounted 钩子在元素挂载后初始化 ECharts
        onVnodeMounted: async (vnode: any) => {
          // 动态导入 echarts
          const echarts = await import('echarts')
          const chartDom = vnode.el as HTMLElement
          if (chartDom) {
            const chart = echarts.init(chartDom, isDark.value ? 'dark' : undefined)
            chart.setOption(config)

            // 将图表实例存储到 Map 中，以便后续主题切换时使用
            echartsInstances.set(chartId, chart)

            // 监听窗口大小变化，自适应图表
            const resizeHandler = () => chart.resize()
            window.addEventListener('resize', resizeHandler)

            // 存储清理函数
            ;(chartDom as any).__echarts_cleanup__ = () => {
              window.removeEventListener('resize', resizeHandler)
              echartsInstances.delete(chartId) // 从 Map 中移除实例
              chart.dispose()
            }
          }
        },
        onVnodeUnmounted: (vnode: any) => {
          const chartDom = vnode.el as HTMLElement
          if (chartDom && (chartDom as any).__echarts_cleanup__) {
            ;(chartDom as any).__echarts_cleanup__()
          }
        },
      })
    } catch (e) {
      // 解析失败，显示错误提示
      return h(
        'div',
        {
          key: `${blockId}-echarts-error`, // 使用唯一的 key
          style: {
            padding: '16px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '8px',
            border: '1px solid #fecaca',
          },
        },
        `ECharts 配置解析失败: ${e}`,
      )
    }
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
    if (streamIndex < fullContent.value.length) {
      // 每次添加 1-3 个字符
      const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, fullContent.value.length - streamIndex)
      markdown.value += fullContent.value.slice(streamIndex, streamIndex + charsToAdd)
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
  markdown.value = fullContent.value
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

/* Loading 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 - Webkit 浏览器 (Chrome, Edge, Safari) */
* {
  scrollbar-width: thin;
  /* Firefox */
  scrollbar-color: rgb(0 0 0 / 12%) rgb(0 0 0 / 6%);
  /* Firefox */
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
  scrollbar-color: rgb(255 255 255 / 15%) rgb(255 255 255 / 8%);
  /* Firefox 暗色模式 */
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

/* ==================== 示例选择器样式 ==================== */
.example-section {
  flex-shrink: 0;
}

.example-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-tab {
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.example-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.example-tab.active {
  background: rgba(255, 255, 255, 0.9);
  color: #014629;
  border-color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.app-dark .example-tab {
  background: rgba(66, 184, 131, 0.1);
  border-color: rgba(66, 184, 131, 0.3);
}

.app-dark .example-tab:hover {
  background: rgba(66, 184, 131, 0.2);
  border-color: rgba(66, 184, 131, 0.5);
}

.app-dark .example-tab.active {
  background: #42b883;
  color: white;
  border-color: #42b883;
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
