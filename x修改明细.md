# 修改明细报告

## 分支信息
- **当前分支**: `recovery-original-code`
- **对比分支**: `main`
- **起始 commit**: `6334dbee09cc9777ea1e47b4fb479e97030b34cd` (2025-12-25)

## 主要变更内容

本分支主要致力于**可选依赖的动态加载与优雅降级**机制的实现，解决了在未安装 `shiki` 或 `mermaid` 等重型依赖时组件库无法启动或报错的问题。

### 1. 核心功能修复与优化
- **动态加载 (Dynamic Loading)**: 将 `shiki`、`shiki-stream` 和 `mermaid` 从强依赖改为可选依赖。
- **优雅降级 (Graceful Degradation)**: 
  - 当未安装 `shiki` 时，代码块自动降级为纯文本显示。
  - 当未安装 `mermaid` 时，图表区域显示原始代码。
  - 避免了因缺少依赖导致的运行时崩溃。
- **Vite 插件增强**: 
  - 引入 `vite-plugin.ts`，通过虚拟模块（Virtual Modules）技术处理可选依赖的导入路径。
  - 自动检测项目依赖情况，注入相应的虚拟模块实现。

### 2. 修复的具体问题
- 修复了在未安装可选依赖时，项目无法通过构建或启动开发服务器的问题。
- 修复了插件在解析依赖时的报错问题（commit `fc83457`）。
- 解决了用户必须强制安装所有依赖才能使用基础 Markdown 功能的痛点。

## 涉及修改的文件

根据提交记录分析，主要修改涉及以下核心文件：

- **配置文件**:
  - `package.json`: 更新依赖声明，将部分依赖移至 `peerDependencies` 或 `devDependencies`，并标记为可选。
  - `vite.config.ts`: 集成新的 Vite 插件配置。

- **源代码**:
  - `packages/x-markdown/src/vite-plugin.ts`: 新增文件，实现依赖检测与虚拟模块注入逻辑。
  - `packages/x-markdown/src/virtual-modules/*.ts`: 新增虚拟模块定义（shiki, mermaid 等）。
  - `packages/x-markdown/src/index.ts`: 调整导出逻辑。

- **文档**:
  - `README.md`: 大幅更新，新增了"优雅降级行为说明"、"Vite 配置"章节，以及可选依赖的安装指南。
