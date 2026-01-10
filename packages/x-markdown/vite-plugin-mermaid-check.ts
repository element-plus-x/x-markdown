import type { Plugin } from 'vite'

/**
 * Vite 插件：生成 mermaid 检测虚拟模块
 * 返回 true 表示让组件在运行时动态检测 mermaid 是否可用
 */
export function mermaidCheckPlugin(): Plugin {
  const virtualModuleId = 'virtual:mermaid-check'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-mermaid-check',

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        // 始终返回 true，让组件在运行时动态检测
        // 这样可以支持使用项目的依赖，而不是构建时检测
        return `export const HAS_MERMAID = true;`
      }
      return null
    },
  }
}
