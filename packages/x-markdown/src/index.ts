/**
 * x-markdown-vue 主入口
 *
 * 本库使用显式导出以优化 Tree Shaking
 * 请根据需要按需导入，而不是导入整个库
 */

// ========== 核心组件 ==========
export { VueMarkdown, VueMarkdownAsync } from './core/components'
export type { VueMarkdownProps, VueMarkdownAsyncProps } from './core/components'

// ========== 高级渲染器（包含样式和容器） ==========
export { MarkdownRenderer, MarkdownRendererAsync } from './MarkdownRender'

// ========== 核心渲染工具 ==========
export { getVNodeInfos, render, renderChildren } from './core/hast-to-vnode'
export { createProcessor, useMarkdownProcessor } from './core/useProcessor'

// ========== Vue Hooks ==========
export { useComponents } from './hooks/useComponents'
export { useHighlight } from './hooks/useHighlight'
export { useMarkdown } from './hooks/useMarkdown'
export { useMermaid } from './hooks/useMermaid'
export { usePlugins } from './hooks/usePlugins'
export { useTheme } from './hooks/useTheme'

// ========== Shiki 缓存和预加载工具 ==========
export { preloadDefaultShikiThemes, getPreloadStatus, isThemePreloaded, getPreloadedThemes } from './utils/shiki-preload'
export { getHighlighterCached, preloadTheme, clearShikiCache } from './utils/shiki-cache'

// ========== 类型导出 ==========
export type * from './core/types'
export type { CodeLineProps } from './components/CodeLine/types'
export type { CodeBlockProps } from './components/CodeBlock/types'
export type { MermaidProps } from './components/Mermaid/types'
export type { CodeXProps } from './components/CodeX/types'
export type { MarkdownContext } from './MarkdownRender/types'
export type { CustomAttrs, SanitizeOptions, Schema } from './core/types'
