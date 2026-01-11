import { resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin, UserConfig } from 'vite'

// 在 ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * x-markdown Vite 插件配置选项
 */
export interface XMarkdownVitePluginOptions {
  /**
   * 可选依赖列表（默认：['mermaid', 'shiki', 'shiki-stream']）
   */
  optionalDeps?: string[]
  /**
   * 虚拟模块目录（相对于项目根目录）
   */
  virtualModulesDir?: string
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
  const {
    optionalDeps = ['mermaid', 'shiki', 'shiki-stream'],
    virtualModulesDir = './node_modules/x-markdown-vue/virtual-modules',
    showConsoleHints = true,
  } = options

  // 存储虚拟模块的路径映射
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
      return null
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

      for (const dep of optionalDeps) {
        const depPath = resolve(projectRoot, 'node_modules', dep)

        if (!existsSync(depPath)) {
          // 依赖未安装，使用虚拟模块
          // 尝试从多个可能的位置查找虚拟模块
          const virtualModulePaths = [
            resolve(projectRoot, virtualModulesDir, `${dep}.js`),
            resolve(projectRoot, 'src/virtual-modules', `${dep}.js`),
            // 最后尝试：从 x-markdown 包内部获取
            resolve(__dirname, 'virtual-modules', `${dep}.js`),
          ]

          let virtualModulePath: string | null = null
          for (const path of virtualModulePaths) {
            if (existsSync(path)) {
              virtualModulePath = path
              break
            }
          }

          if (virtualModulePath) {
            // 同时添加到 alias 和 resolveId 映射
            optionalAliases.push({
              find: dep,
              replacement: virtualModulePath,
            })

            // 添加到 resolveId 映射表（用于动态导入）
            virtualModuleMap.set(dep, virtualModulePath)

            // 在开发环境显示提示信息
            if (config.mode === 'development') {
              console.log(
                `\x1b[33m[x-markdown-vue]\x1b[0m ${dep} 未安装，使用虚拟模块: ${virtualModulePath}`
              )
            }
          }
        }
      }

      // 如果有需要添加的 alias，更新配置
      if (optionalAliases.length > 0) {
        // 保留原有的 alias 配置
        const existingAlias = config.resolve?.alias || []

        // 合并 alias 配置
        config.resolve = {
          ...config.resolve,
          alias: [
            ...optionalAliases,
            ...(Array.isArray(existingAlias) ? existingAlias : [existingAlias]),
          ],
        }
      }

      // 确保 optionalDeps 不被预构建
      const optimizeDeps = config.optimizeDeps || {}
      const excludeDeps = optimizeDeps.exclude || []
      const includeDeps = optimizeDeps.include || []

      // 移除未安装的依赖从 include
      const filteredInclude = includeDeps.filter((dep: string) => {
        const depPath = resolve(projectRoot, 'node_modules', dep)
        return existsSync(depPath)
      })

      // 添加未安装的依赖到 exclude
      const newExclude = [...optionalDeps.filter(dep => {
        const depPath = resolve(projectRoot, 'node_modules', dep)
        return !existsSync(depPath)
      }), ...excludeDeps]

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
