/**
 * 全局类型定义
 *
 * 此文件包含由 x-markdown Vite 插件注入的全局变量类型声明
 */

declare global {
  /**
   * 是否启用控制台提示
   *
   * 此变量由 createXMarkdownVitePlugin 的 showConsoleHints 选项控制
   * 当设置为 false 时，将不会显示 shiki、shiki-stream、mermaid 的安装提示
   *
   * @default true
   */
  const __X_MARKDOWN_CONSOLE_HINTS_ENABLED__: boolean
}

export {}
