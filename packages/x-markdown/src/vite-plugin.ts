import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'module'
import type { Plugin, UserConfig } from 'vite'

/**
 * x-markdown Vite 插件配置选项
 */
export interface XMarkdownVitePluginOptions {
  /**
   * 可选依赖列表（默认：['mermaid', 'shiki', 'shiki-stream']）
   */
  optionalDeps?: string[]
  /**
   * 是否显示控制台提示（默认：true）
   */
  showConsoleHints?: boolean
}

/**
 * x-markdown Vite 插件
 *
 * 自动处理可选依赖（shiki、shiki-stream、mermaid）的虚拟模块配置
 * 当这些依赖未安装时，自动映射到虚拟模块避免构建失败
 *
 * @param options - 插件配置选项
 * @returns Vite 插件
 */
export function createXMarkdownVitePlugin(options: XMarkdownVitePluginOptions = {}): Plugin {
  const { optionalDeps = ['mermaid', 'shiki', 'shiki-stream'], showConsoleHints = true } = options

  const VIRTUAL_PREFIX = '\0virtual:x-markdown/'
  const virtualModuleMap = new Map<string, string>()

  return {
    name: 'x-markdown-vue:vite-plugin',
    enforce: 'pre', // 在其他插件之前执行

    // 拦截模块解析，包括动态导入
    resolveId(id) {
      // 检查是否是我们需要处理的可选依赖
      if (virtualModuleMap.has(id)) {
        return virtualModuleMap.get(id)
      }
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return id
      }
      return null
    },

    load(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return 'export default null;'
      }
    },

    configResolved() {
      // console.log('[x-markdown-plugin] Final aliases:', config.resolve.alias)
    },
    config(config: UserConfig) {
      // 获取项目根目录
      const projectRoot = process.cwd()

      // 注入全局变量，控制是否显示控制台提示
      if (!config.define) {
        config.define = {}
      }
      config.define.__X_MARKDOWN_CONSOLE_HINTS_ENABLED__ = JSON.stringify(showConsoleHints)

      // 动态生成可选依赖的 alias 配置
      const optionalAliases: Array<{ find: string; replacement: string }> = []

      // 创建 require 函数，用于解析依赖
      const projectRequire = createRequire(resolve(projectRoot, 'package.json'))
      let declaredDeps: Record<string, any> | null = null
      try {
        const pkgJsonPath = resolve(projectRoot, 'package.json')
        const pkgRaw = readFileSync(pkgJsonPath, 'utf-8')
        declaredDeps = JSON.parse(pkgRaw)
      } catch {
        declaredDeps = null
      }

      const isDeclaredInProject = (dep: string) => {
        if (!declaredDeps) return false
        const fields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const
        const declared = fields.some((field) => Boolean((declaredDeps as any)?.[field]?.[dep]))
        // console.log(`[x-markdown-plugin] Check ${dep} declared: ${declared}`)
        return declared
      }

      for (const dep of optionalDeps) {
        let isInstalled = false
        try {
          if (!isDeclaredInProject(dep)) {
            isInstalled = false
            // console.log(`[x-markdown-plugin] ${dep} NOT declared in package.json`)
          } else {
            projectRequire.resolve(dep)
            isInstalled = true
            // console.log(`[x-markdown-plugin] ${dep} is installed and declared`)
          }
        } catch {
          isInstalled = false
        }

        if (!isInstalled) {
          // 依赖未安装，使用虚拟模块
          const virtualId = `${VIRTUAL_PREFIX}${dep}`

          // 同时添加到 alias 和 resolveId 映射
          optionalAliases.push({
            find: dep,
            replacement: virtualId,
          })

          // 添加到 resolveId 映射表（用于动态导入）
          virtualModuleMap.set(dep, virtualId)

          // 在开发环境显示提示信息
          if (config.mode === 'development') {
            console.log(`\x1b[33m[x-markdown-vue]\x1b[0m ${dep} 未安装，使用虚拟模块`)
          }
        }
      }

      // 如果有需要添加的 alias，更新配置
      if (optionalAliases.length > 0) {
        // 保留原有的 alias 配置
        const existingAlias = config.resolve?.alias || []

        // 规范化现有 alias 为数组格式
        let normalizedExistingAlias: Array<any> = []
        if (Array.isArray(existingAlias)) {
          normalizedExistingAlias = existingAlias
        } else if (typeof existingAlias === 'object') {
          // 对象格式转换为数组格式
          normalizedExistingAlias = Object.entries(existingAlias).map(([find, replacement]) => ({
            find,
            replacement,
          }))
        }

        // 合并 alias 配置
        config.resolve = {
          ...config.resolve,
          alias: [...optionalAliases, ...normalizedExistingAlias],
        }
      }

      // 确保 optionalDeps 不被预构建
      const optimizeDeps = config.optimizeDeps || {}
      const excludeDeps = optimizeDeps.exclude || []
      const includeDeps = optimizeDeps.include || []

      // 移除未安装的依赖从 include
      const filteredInclude = includeDeps.filter((dep: string) => {
        try {
          if (!isDeclaredInProject(dep)) return false
          projectRequire.resolve(dep)
          return true
        } catch {
          return false
        }
      })

      // 添加未安装的依赖到 exclude
      const newExclude = [
        ...optionalDeps.filter((dep) => {
          try {
            if (!isDeclaredInProject(dep)) return true
            projectRequire.resolve(dep)
            return false
          } catch {
            return true
          }
        }),
        ...excludeDeps,
      ]

      config.optimizeDeps = {
        ...optimizeDeps,
        include: filteredInclude,
        exclude: [...new Set(newExclude)],
      }
    },
  }
}

// 默认导出，方便使用
export default createXMarkdownVitePlugin

/**
 * 为了兼容性，也提供一个具名导出
 */
export { createXMarkdownVitePlugin as xMarkdownVitePlugin }
