import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// 判断是否是构建 vite-plugin
const isVitePluginBuild = process.env.VITE_BUILD_TARGET === 'vite-plugin'

export default defineConfig(({ mode }) => {
  // 构建 vite-plugin 的配置
  if (isVitePluginBuild) {
    return {
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/vite-plugin.ts'),
          fileName: (format) => `vite-plugin.${format}.js`,
          formats: ['es', 'cjs'],
        },
        rollupOptions: {
          external: ['vite'],
          output: {
            globals: {
              vite: 'Vite',
            },
          },
        },
        target: 'node18',
        ssr: true,
        minify: false,
        sourcemap: true,
      },
    }
  }

  // 主库的配置
  return {
    plugins: [vue()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'XMarkdown',
      fileName: (format) => `x-markdown.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // 外部化依赖，不打包进 bundle
      // 注意：在生产构建时外部化可选依赖（shiki, mermaid）
      // 但为了让它们在 Vite 开发服务器中正常工作，我们使用条件 external
      external: [
        'vue',
        'element-plus',
        // unified 生态系统（始终外部化）
        'unified',
        'remark',
        'remark-parse',
        'remark-rehype',
        'remark-gfm',
        'remark-breaks',
        'remark-math',
        'rehype',
        'rehype-raw',
        'rehype-sanitize',
        'rehype-katex',
        'mdast',
        'hast',
        'mdast-util-to-hast',
        'unist-util-visit',
        'property-information',
        // 其他依赖
        'dompurify',
        'deepmerge',
        'lodash-es',
        // 可选依赖：始终外部化，由消费者项目提供
        // 消费者项目需要在 Vite 配置中确保这些模块可被动态导入
        'mermaid',
        /^shiki($|\/|\\)/,
        /^@shikijs\/.*/,
        /^shiki-stream($|\/|\\)/,
      ],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          mermaid: 'mermaid',
          shiki: 'shiki',
          'dompurify': 'DOMPurify',
        },
        // 保留模块结构，使动态导入能正确外部化
        preserveModules: true,
        preserveModulesRoot: resolve(__dirname, 'src'),
        // 启用 Tree Shaking
        exports: 'named', // 使用命名导出，优化 tree-shaking
        // 手动代码分割
        manualChunks: undefined, // preserveModules 模式下不需要
      },
      // Tree Shaking 配置
      treeshake: {
        moduleSideEffects: false, // 假设所有模块都是纯净的（无副作用）
        propertyReadSideEffects: true, // 优化属性读取
        unknownGlobalSideEffects: false, // 假设全局变量无副作用
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        ecma: 2020,
        passes: 2,
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    // CSS 代码分割（关闭以合并所有样式到一个文件）
    cssCodeSplit: false,
    // 目标环境
    target: 'es2020',
    // 报告压缩后的文件大小
    reportCompressedSize: true,
    //chunkSizeWarningLimit: 500,
    // 生成 sourcemap
    sourcemap: true,
  },
  // 优化依赖预构建（仅用于 x-markdown 开发时的测试）
  // 不影响消费者项目
  optimizeDeps: {
    include: ['vue', 'element-plus'],
    // 排除 mermaid 和 shiki，防止 Vite 预构建这些可选依赖
    // 这样它们只会在运行时动态导入时才加载，从而正确测试降级行为
    exclude: ['mermaid', 'shiki', 'shiki-stream'],
  },
  }
})
